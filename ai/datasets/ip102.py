"""IP102 insect pest dataset preparer — uses official train/val/test lists when present."""

from __future__ import annotations

import logging
from pathlib import Path

from ai.datasets.base import BaseDatasetPreparer
from ai.datasets.schema import DatasetMetadata, DatasetSample, DatasetStatus, PreparationResult, SplitName
from ai.datasets.utils import (
    build_samples_from_classes,
    discover_class_folders,
    finalize_metadata,
    normalize_label,
    stratified_split,
    validate_image,
    write_manifest,
)

logger = logging.getLogger(__name__)


class IP102Preparer(BaseDatasetPreparer):
    dataset_key = "ip102"

    def _find_classification_root(self) -> Path | None:
        candidates = [
            self.input_path / "Classification" / "extracted" / "ip102_v1.1",
            self.input_path / "Classification" / "ip102_v1.1",
            self.input_path / "ip102_v1.1",
            self.input_path,
        ]
        for c in candidates:
            if (c / "train.txt").exists() and (c / "images").exists():
                return c
        return None

    def _load_class_names(self) -> dict[int, str]:
        candidates = [
            self.input_path / "classes.txt",
            self.input_path / "Classification" / "classes.txt",
        ]
        mapping: dict[int, str] = {}
        for path in candidates:
            if not path.exists():
                continue
            with open(path, encoding="utf-8") as f:
                for i, line in enumerate(f):
                    raw = line.strip()
                    if not raw:
                        continue
                    # Lines like "1  rice leaf roller" — strip leading index
                    parts = raw.split(maxsplit=1)
                    name = parts[1] if len(parts) == 2 and parts[0].isdigit() else raw
                    mapping[i] = normalize_label(name)
            if mapping:
                logger.info("Loaded %d IP102 class names from %s", len(mapping), path)
                return mapping
        return mapping

    def _load_official_splits(self, clf_root: Path) -> dict[SplitName, list[DatasetSample]] | None:
        class_map = self._load_class_names()
        images_root = clf_root / "images"
        split_files = {
            SplitName.TRAIN: clf_root / "train.txt",
            SplitName.VALIDATION: clf_root / "val.txt",
            SplitName.TEST: clf_root / "test.txt",
        }
        if not all(p.exists() for p in split_files.values()):
            return None

        splits: dict[SplitName, list[DatasetSample]] = {
            SplitName.TRAIN: [],
            SplitName.VALIDATION: [],
            SplitName.TEST: [],
        }
        corrupt = 0
        for split_name, list_path in split_files.items():
            with open(list_path, encoding="utf-8") as f:
                for line_no, line in enumerate(f):
                    parts = line.strip().split()
                    if len(parts) < 2:
                        continue
                    img_name, label_idx = parts[0], int(parts[1])
                    img_path = images_root / img_name
                    if not img_path.exists() or img_path.stat().st_size < 100:
                        corrupt += 1
                        continue
                    label = class_map.get(label_idx, f"class_{label_idx}")
                    splits[split_name].append(
                        DatasetSample(
                            sample_id=f"ip102_{split_name.value}_{line_no}",
                            image_path=str(img_path.resolve()),
                            label=label,
                            split=split_name,
                            source_dataset="ip102",
                        )
                    )
        self._last_corrupt = corrupt
        return splits

    def prepare(self, copy_files: bool = False) -> PreparationResult:
        pending = self.verify_input_exists()
        if pending:
            self.save(pending.metadata)
            return pending

        self._last_corrupt = 0
        clf_root = self._find_classification_root()
        splits = self._load_official_splits(clf_root) if clf_root else None

        if splits:
            samples = [s for ss in splits.values() for s in ss]
            split_strategy = "official_ip102_train_val_test_lists"
            leakage = (
                "Preserved official IP102 train.txt / val.txt / test.txt splits. "
                "No reshuffling performed."
            )
        else:
            classes = discover_class_folders(self.input_path)
            if not classes:
                meta = DatasetMetadata(
                    dataset_id="ip102",
                    name="IP102",
                    task="detection",
                    ai_model_target="pest",
                    status=DatasetStatus.ERROR,
                    description=self.config["description"],
                    source_url=self.config.get("source_url"),
                    raw_path=str(self.input_path),
                    errors=["Could not locate IP102 official lists or class folders."],
                )
                self.save(meta)
                return PreparationResult(success=False, metadata=meta, message=meta.errors[0])
            samples, self._last_corrupt = build_samples_from_classes(classes, "ip102")
            split_cfg = self.config["split"]
            splits = stratified_split(
                samples,
                train_ratio=split_cfg["train"],
                val_ratio=split_cfg["validation"],
                test_ratio=split_cfg["test"],
                seed=split_cfg["seed"],
            )
            split_strategy = "stratified_fallback"
            leakage = "Official lists missing; used stratified split by class."

        # Detection annotation availability
        det_xml = list((self.input_path / "Detection").rglob("*.xml")) if (self.input_path / "Detection").exists() else []

        metadata = DatasetMetadata(
            dataset_id="ip102",
            name="IP102",
            task="detection",
            ai_model_target="pest",
            status=DatasetStatus.PROCESSED,
            description=self.config["description"],
            source_url=self.config.get("source_url"),
            license_note=self.config.get("license_note"),
            raw_path=str(self.input_path),
            processed_path=str(self.output_path),
            splits_path=str(self.splits_path),
            split_strategy=split_strategy,
            leakage_prevention=leakage,
            preprocessing=self.config.get("preprocessing", {}),
            limitations=[
                "102 pest classes only — model will not detect pests outside this set.",
                f"VOC detection annotations found: {len(det_xml)} XML files.",
                "Academic use only per IP102 license terms.",
            ],
            scientific_notes=[
                "Pest recognition/detection from images; not a substitute for field scouting.",
            ],
        )
        metadata = finalize_metadata(metadata, samples, splits, self.splits_path, self._last_corrupt)
        self.save(metadata)
        return PreparationResult(
            success=True,
            metadata=metadata,
            message=f"Processed {metadata.total_images} images, {len(metadata.classes)} classes ({split_strategy})",
        )
