"""Disease classification dataset loaders (PlantVillage + mapped PlantDoc)."""

from __future__ import annotations

import json
import logging
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from PIL import Image
from torch.utils.data import Dataset

from ai.disease.label_mapping import (
    EXCLUDED_PLANTDOC_CLASSES,
    MAPPING_NOTES,
    PLANTDOC_TO_PLANTVILLAGE,
    map_plantdoc_label,
)

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[2]


@dataclass
class SampleRecord:
    image_path: Path
    label: str
    source_dataset: str
    sample_id: str
    group_id: str | None
    split: str


def _load_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def load_plantvillage_split(
    split: str,
    manifests_dir: Path | None = None,
    *,
    check_exists: bool = False,
) -> list[SampleRecord]:
    manifests_dir = manifests_dir or (REPO_ROOT / "data" / "splits" / "plantvillage")
    path = manifests_dir / f"{split}.jsonl"
    records: list[SampleRecord] = []
    missing = 0
    for row in _load_jsonl(path):
        p = Path(row["image_path"])
        if check_exists and not p.exists():
            missing += 1
            continue
        records.append(
            SampleRecord(
                image_path=p,
                label=row["label"],
                source_dataset="plantvillage",
                sample_id=row.get("sample_id", p.stem),
                group_id=row.get("group_id"),
                split=split,
            )
        )
    if missing:
        logger.warning("PlantVillage %s: skipped %d missing files", split, missing)
    return records


def load_plantdoc_mapped_split(
    split: str,
    manifests_dir: Path | None = None,
    *,
    check_exists: bool = False,
) -> tuple[list[SampleRecord], dict]:
    """Load PlantDoc split, mapping labels into PlantVillage taxonomy."""
    manifests_dir = manifests_dir or (REPO_ROOT / "data" / "splits" / "plantdoc")
    path = manifests_dir / f"{split}.jsonl"
    records: list[SampleRecord] = []
    stats = {
        "total": 0,
        "mapped": 0,
        "excluded": 0,
        "unmapped_other": 0,
        "missing_file": 0,
        "by_mapped_label": Counter(),
        "excluded_labels": Counter(),
        "unmapped_labels": Counter(),
    }
    excluded = set(EXCLUDED_PLANTDOC_CLASSES)
    for row in _load_jsonl(path):
        stats["total"] += 1
        raw_label = row["label"]
        mapped = map_plantdoc_label(raw_label)
        if mapped is None:
            if raw_label in excluded:
                stats["excluded"] += 1
                stats["excluded_labels"][raw_label] += 1
            else:
                stats["unmapped_other"] += 1
                stats["unmapped_labels"][raw_label] += 1
            continue
        p = Path(row["image_path"])
        if check_exists and not p.exists():
            stats["missing_file"] += 1
            continue
        stats["mapped"] += 1
        stats["by_mapped_label"][mapped] += 1
        records.append(
            SampleRecord(
                image_path=p,
                label=mapped,
                source_dataset="plantdoc",
                sample_id=row.get("sample_id", p.stem),
                group_id=row.get("group_id"),
                split=split,
            )
        )
    return records, stats


def build_combined_split(split: str, *, check_exists: bool = False) -> tuple[list[SampleRecord], dict]:
    """Combine PlantVillage + mapped PlantDoc for one split (no cross-split mixing)."""
    pv = load_plantvillage_split(split, check_exists=check_exists)
    pd, pd_stats = load_plantdoc_mapped_split(split, check_exists=check_exists)
    combined = pv + pd
    summary = {
        "split": split,
        "plantvillage_count": len(pv),
        "plantdoc_mapped_count": len(pd),
        "combined_count": len(combined),
        "plantdoc_stats": {
            **{k: (dict(v) if isinstance(v, Counter) else v) for k, v in pd_stats.items()}
        },
        "class_counts": dict(Counter(r.label for r in combined)),
    }
    return combined, summary


def discover_class_names(records: list[SampleRecord]) -> list[str]:
    return sorted({r.label for r in records})


def assert_no_path_leakage(train: list[SampleRecord], val: list[SampleRecord], test: list[SampleRecord]) -> dict:
    """Verify image paths and group_ids do not overlap across splits."""
    def paths(recs: list[SampleRecord]) -> set[str]:
        return {str(r.image_path.resolve()) for r in recs}

    def groups(recs: list[SampleRecord]) -> set[str]:
        return {r.group_id for r in recs if r.group_id}

    tp, vp, te = paths(train), paths(val), paths(test)
    tg, vg, eg = groups(train), groups(val), groups(test)
    report = {
        "path_overlap_train_val": len(tp & vp),
        "path_overlap_train_test": len(tp & te),
        "path_overlap_val_test": len(vp & te),
        "group_overlap_train_val": len(tg & vg),
        "group_overlap_train_test": len(tg & eg),
        "group_overlap_val_test": len(vg & eg),
        "ok": True,
    }
    if any(
        report[k] > 0
        for k in [
            "path_overlap_train_val",
            "path_overlap_train_test",
            "path_overlap_val_test",
            "group_overlap_train_val",
            "group_overlap_train_test",
            "group_overlap_val_test",
        ]
    ):
        report["ok"] = False
    return report


class DiseaseImageDataset(Dataset):
    def __init__(
        self,
        records: list[SampleRecord],
        class_to_idx: dict[str, int],
        transform: Callable | None = None,
    ):
        self.records = records
        self.class_to_idx = class_to_idx
        self.transform = transform

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, index: int):
        rec = self.records[index]
        with Image.open(rec.image_path) as img:
            image = img.convert("RGB")
        if self.transform is not None:
            image = self.transform(image)
        label_idx = self.class_to_idx[rec.label]
        return image, label_idx


def build_label_mapping_document(
    train: list[SampleRecord],
    val: list[SampleRecord],
    test: list[SampleRecord],
    pd_stats_by_split: dict,
) -> dict:
    classes = discover_class_names(train + val + test)
    return {
        "strategy": "plantvillage_primary_with_plantdoc_mapped",
        "num_classes": len(classes),
        "classes": classes,
        "plantdoc_to_plantvillage": PLANTDOC_TO_PLANTVILLAGE,
        "excluded_plantdoc_classes": EXCLUDED_PLANTDOC_CLASSES,
        "notes": MAPPING_NOTES,
        "plantdoc_mapping_stats": pd_stats_by_split,
        "split_counts": {
            "train": len(train),
            "validation": len(val),
            "test": len(test),
        },
        "source_counts": {
            "train": dict(Counter(r.source_dataset for r in train)),
            "validation": dict(Counter(r.source_dataset for r in val)),
            "test": dict(Counter(r.source_dataset for r in test)),
        },
    }
