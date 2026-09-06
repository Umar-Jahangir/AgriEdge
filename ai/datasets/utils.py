"""Shared utilities for dataset preparation."""

from __future__ import annotations

import hashlib
import json
import logging
import re
import shutil
from collections import defaultdict
from pathlib import Path
from typing import Iterable

import yaml
from PIL import Image

from ai.datasets.schema import DatasetMetadata, DatasetSample, DatasetStatus, PreparationResult, SplitInfo, SplitName

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[2]
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}


def load_dataset_config(dataset_key: str) -> dict:
    config_path = REPO_ROOT / "config" / "datasets.yaml"
    with open(config_path, encoding="utf-8") as f:
        config = yaml.safe_load(f)
    if dataset_key not in config["datasets"]:
        raise KeyError(f"Unknown dataset key: {dataset_key}")
    return config["datasets"][dataset_key]


def resolve_path(path_str: str, base: Path | None = None) -> Path:
    path = Path(path_str)
    if path.is_absolute():
        return path
    return (base or REPO_ROOT) / path


def normalize_label(name: str) -> str:
    """Normalize folder/filename labels to snake_case."""
    name = name.strip().lower()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[\s-]+", "_", name)
    return name


def is_image_file(path: Path, extensions: Iterable[str] | None = None) -> bool:
    ext = path.suffix.lower()
    allowed = {e.lower() if e.startswith(".") else f".{e.lower()}" for e in (extensions or IMAGE_EXTENSIONS)}
    return ext in allowed


def validate_image(path: Path) -> bool:
    try:
        with Image.open(path) as img:
            img.verify()
        with Image.open(path) as img:
            img.load()
        return True
    except Exception as exc:
        logger.warning("Corrupt image skipped: %s (%s)", path, exc)
        return False


def discover_class_folders(root: Path, extensions: Iterable[str] | None = None) -> dict[str, list[Path]]:
    """Discover images grouped by immediate class folder name."""
    classes: dict[str, list[Path]] = defaultdict(list)
    if not root.exists():
        return classes

    for class_dir in sorted(root.iterdir()):
        if not class_dir.is_dir():
            continue
        label = normalize_label(class_dir.name)
        for img_path in class_dir.rglob("*"):
            if img_path.is_file() and is_image_file(img_path, extensions):
                classes[label].append(img_path.resolve())
    return dict(classes)


def discover_nested_class_folders(root: Path, depth: int = 2) -> dict[str, list[Path]]:
    """Discover class folders at a given depth (e.g. PlantVillage color/Crop___Disease/)."""
    classes: dict[str, list[Path]] = defaultdict(list)
    if not root.exists():
        return classes

    for path in root.rglob("*"):
        if not path.is_file() or not is_image_file(path):
            continue
        parts = path.relative_to(root).parts
        if len(parts) < depth:
            continue
        label = normalize_label(parts[depth - 1])
        classes[label].append(path.resolve())
    return dict(classes)


def infer_plantvillage_leaf_group(filename: str) -> str:
    """Best-effort leaf group from PlantVillage filename patterns."""
    stem = Path(filename).stem
    # Common patterns: leaf_001, image_12, or hash-like prefixes before extension groups
    match = re.match(r"^(.*?)(?:[_-]?\d+)?$", stem)
    return match.group(1) if match else stem


def stratified_split(
    samples: list[DatasetSample],
    train_ratio: float,
    val_ratio: float,
    test_ratio: float,
    seed: int,
    group_key: str | None = None,
) -> dict[SplitName, list[DatasetSample]]:
    import random

    random.seed(seed)
    by_class: dict[str, list[DatasetSample]] = defaultdict(list)
    for s in samples:
        by_class[s.label].append(s)

    splits: dict[SplitName, list[DatasetSample]] = {
        SplitName.TRAIN: [],
        SplitName.VALIDATION: [],
        SplitName.TEST: [],
    }

    for label, class_samples in by_class.items():
        if group_key:
            groups: dict[str, list[DatasetSample]] = defaultdict(list)
            for s in class_samples:
                gid = s.group_id or s.sample_id
                groups[gid].append(s)
            items = list(groups.values())
            random.shuffle(items)
        else:
            items = [[s] for s in class_samples]
            random.shuffle(items)

        n = len(items)
        n_train = max(1, int(n * train_ratio)) if n >= 3 else max(0, n - 2)
        n_val = max(1, int(n * val_ratio)) if n >= 3 else (1 if n - n_train > 1 else 0)
        n_test = n - n_train - n_val
        if n_test < 0:
            n_test = 0
            n_val = n - n_train

        train_groups = items[:n_train]
        val_groups = items[n_train : n_train + n_val]
        test_groups = items[n_train + n_val :]

        for group in train_groups:
            for s in group:
                s.split = SplitName.TRAIN
                splits[SplitName.TRAIN].append(s)
        for group in val_groups:
            for s in group:
                s.split = SplitName.VALIDATION
                splits[SplitName.VALIDATION].append(s)
        for group in test_groups:
            for s in group:
                s.split = SplitName.TEST
                splits[SplitName.TEST].append(s)

    return splits


def write_manifest(samples: list[DatasetSample], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for s in samples:
            f.write(s.model_dump_json() + "\n")


def write_metadata(metadata: DatasetMetadata, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    meta_path = output_dir / "dataset_metadata.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata.model_dump(), f, indent=2, default=str)
    return meta_path


def build_samples_from_classes(
    classes: dict[str, list[Path]],
    dataset_id: str,
    group_fn=None,
) -> tuple[list[DatasetSample], int]:
    samples: list[DatasetSample] = []
    corrupt = 0
    for label, paths in classes.items():
        for img_path in paths:
            if not validate_image(img_path):
                corrupt += 1
                continue
            group_id = group_fn(img_path.name) if group_fn else None
            sample_id = hashlib.md5(str(img_path).encode()).hexdigest()[:12]
            samples.append(
                DatasetSample(
                    sample_id=sample_id,
                    image_path=str(img_path),
                    label=label,
                    split=SplitName.TRAIN,
                    source_dataset=dataset_id,
                    group_id=group_id,
                )
            )
    return samples, corrupt


def class_distribution(samples: list[DatasetSample]) -> dict[str, int]:
    dist: dict[str, int] = defaultdict(int)
    for s in samples:
        dist[s.label] += 1
    return dict(sorted(dist.items()))


def finalize_metadata(
    metadata: DatasetMetadata,
    samples: list[DatasetSample],
    splits: dict[SplitName, list[DatasetSample]],
    splits_dir: Path,
    corrupt: int,
) -> DatasetMetadata:
    metadata.total_images = len(samples)
    metadata.corrupt_images = corrupt
    metadata.classes = sorted({s.label for s in samples})
    metadata.class_counts = class_distribution(samples)

    for split_name, split_samples in splits.items():
        manifest = splits_dir / f"{split_name.value}.jsonl"
        write_manifest(split_samples, manifest)
        try:
            manifest_rel = str(manifest.relative_to(REPO_ROOT))
        except ValueError:
            manifest_rel = str(manifest)
        metadata.splits[split_name.value] = SplitInfo(
            count=len(split_samples),
            manifest_path=manifest_rel,
            class_distribution=class_distribution(split_samples),
        )

    metadata.status = DatasetStatus.PROCESSED if samples else DatasetStatus.ERROR
    return metadata


def copy_or_link_samples(
    splits: dict[SplitName, list[DatasetSample]],
    processed_dir: Path,
    use_symlinks: bool = True,
) -> None:
    """Organize processed folder as split/class/images (symlinks to save space)."""
    for split_name, split_samples in splits.items():
        for sample in split_samples:
            dest_dir = processed_dir / split_name.value / sample.label
            dest_dir.mkdir(parents=True, exist_ok=True)
            src = Path(sample.image_path)
            dest = dest_dir / src.name
            if dest.exists():
                continue
            if use_symlinks:
                try:
                    dest.symlink_to(src)
                    continue
                except OSError:
                    pass
            shutil.copy2(src, dest)


def pending_result(
    dataset_id: str,
    name: str,
    task: str,
    ai_target: str,
    description: str,
    raw_path: Path,
    reason: str,
) -> PreparationResult:
    metadata = DatasetMetadata(
        dataset_id=dataset_id,
        name=name,
        task=task,
        ai_model_target=ai_target,
        status=DatasetStatus.PENDING_DOWNLOAD,
        description=description,
        raw_path=str(raw_path),
        errors=[reason],
        scientific_notes=[
            "Visual models detect symptoms only; they do not measure soil NPK.",
        ],
    )
    return PreparationResult(success=False, metadata=metadata, message=reason)
