"""Nitrogen Deficiency in Maize dataset preparer (Mendeley g7xnn2bm4g)."""

from __future__ import annotations

import logging

from ai.datasets.base import BaseDatasetPreparer
from ai.datasets.schema import DatasetMetadata, DatasetStatus, PreparationResult
from ai.datasets.utils import (
    build_samples_from_classes,
    copy_or_link_samples,
    discover_class_folders,
    discover_nested_class_folders,
    finalize_metadata,
    normalize_label,
    stratified_split,
)

logger = logging.getLogger(__name__)


class NitrogenMaizePreparer(BaseDatasetPreparer):
    dataset_key = "nitrogen_maize"

    def _discover(self) -> dict[str, list]:
        classes = discover_class_folders(self.input_path)
        if classes:
            return {normalize_label(k): v for k, v in classes.items()}
        classes = discover_nested_class_folders(self.input_path, depth=2)
        return {normalize_label(k): v for k, v in classes.items()}

    def prepare(self, copy_files: bool = False) -> PreparationResult:
        pending = self.verify_input_exists()
        if pending:
            self.save(pending.metadata)
            return pending

        classes = self._discover()
        if not classes:
            meta = DatasetMetadata(
                dataset_id="nitrogen_maize",
                name="Nitrogen Deficiency in Maize",
                task="classification",
                ai_model_target="nitrogen",
                status=DatasetStatus.ERROR,
                description=self.config["description"],
                source_url=self.config.get("source_url"),
                raw_path=str(self.input_path),
                errors=[
                    "No images found. Download from Mendeley (g7xnn2bm4g) and extract.",
                    "Inspect actual folder labels before training — do not invent class names.",
                ],
            )
            self.save(meta)
            return PreparationResult(success=False, metadata=meta, message=meta.errors[0])

        samples, corrupt = build_samples_from_classes(classes, "nitrogen_maize")
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
            dataset_id="nitrogen_maize",
            name="Nitrogen Deficiency in Maize",
            task="classification",
            ai_model_target="nitrogen",
            status=DatasetStatus.PROCESSED,
            description=self.config["description"],
            source_url=self.config.get("source_url"),
            license_note=self.config.get("license_note"),
            raw_path=str(self.input_path),
            processed_path=str(self.output_path),
            splits_path=str(self.splits_path),
            split_strategy=split_cfg["strategy"],
            leakage_prevention="Stratified split by discovered class folder.",
            preprocessing=self.config.get("preprocessing", {}),
            limitations=[
                "Maize field RGB images under different nitrogen fertilization levels.",
                "Actual class labels discovered from folder names — inspect metadata after download.",
            ],
            scientific_notes=[
                "Detects visible nitrogen stress symptoms — NOT soil nitrogen ppm.",
                "Supporting signal for fusion with NPK sensor data.",
            ],
        )
        metadata = finalize_metadata(metadata, samples, splits, self.splits_path, corrupt)
        self.save(metadata)

        return PreparationResult(
            success=True,
            metadata=metadata,
            message=f"Processed {metadata.total_images} images. Discovered classes: {metadata.classes}",
        )
