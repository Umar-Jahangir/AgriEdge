"""PlantDoc real-world disease dataset preparer."""

from __future__ import annotations

import logging
from pathlib import Path

from ai.datasets.base import BaseDatasetPreparer
from ai.datasets.schema import DatasetMetadata, DatasetStatus, PreparationResult, SplitName
from ai.datasets.utils import (
    build_samples_from_classes,
    copy_or_link_samples,
    discover_class_folders,
    discover_nested_class_folders,
    finalize_metadata,
    stratified_split,
)

logger = logging.getLogger(__name__)


class PlantDocPreparer(BaseDatasetPreparer):
    dataset_key = "plantdoc"

    def _discover(self) -> dict[str, list[Path]]:
        for sub in ["train", "test", "images", "dataset"]:
            sub_path = self.input_path / sub
            if sub_path.exists():
                classes = discover_class_folders(sub_path)
                if classes:
                    return classes

        classes = discover_class_folders(self.input_path)
        if classes:
            return classes

        return discover_nested_class_folders(self.input_path, depth=2)

    def prepare(self, copy_files: bool = False) -> PreparationResult:
        pending = self.verify_input_exists()
        if pending:
            self.save(pending.metadata)
            return pending

        classes = self._discover()
        if not classes:
            meta = DatasetMetadata(
                dataset_id="plantdoc",
                name="PlantDoc",
                task="classification",
                ai_model_target="disease",
                status=DatasetStatus.ERROR,
                description=self.config["description"],
                source_url=self.config.get("source_url"),
                raw_path=str(self.input_path),
                errors=["No images discovered. PlantDoc may use a non-standard layout — inspect raw files."],
            )
            self.save(meta)
            return PreparationResult(success=False, metadata=meta, message=meta.errors[0])

        samples, corrupt = build_samples_from_classes(classes, "plantdoc")

        split_cfg = self.config["split"]
        splits = stratified_split(
            samples,
            train_ratio=split_cfg["train"],
            val_ratio=split_cfg["validation"],
            test_ratio=split_cfg["test"],
            seed=split_cfg["seed"],
        )

        if copy_files:
            copy_or_link_samples(splits, self.output_path)

        metadata = DatasetMetadata(
            dataset_id="plantdoc",
            name="PlantDoc",
            task="classification",
            ai_model_target="disease",
            status=DatasetStatus.PROCESSED,
            description=self.config["description"],
            source_url=self.config.get("source_url"),
            license_note=self.config.get("license_note"),
            raw_path=str(self.input_path),
            processed_path=str(self.output_path),
            splits_path=str(self.splits_path),
            split_strategy=split_cfg["strategy"],
            leakage_prevention="Stratified split by class. No official grouping metadata assumed.",
            preprocessing=self.config.get("preprocessing", {}),
            limitations=[
                "Real-world images with variable backgrounds — harder than PlantVillage.",
                "Class names taken from folder structure; verify after download.",
            ],
            scientific_notes=["Detects visible disease symptoms; possible disease, not confirmed diagnosis."],
        )
        metadata = finalize_metadata(metadata, samples, splits, self.splits_path, corrupt)
        self.save(metadata)

        return PreparationResult(
            success=True,
            metadata=metadata,
            message=f"Processed {metadata.total_images} images, {len(metadata.classes)} classes",
        )
