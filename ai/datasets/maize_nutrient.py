"""Maize Nutrient Deficiency Dataset preparer (Mendeley 34gb2gr7p2)."""

from __future__ import annotations

import logging
from pathlib import Path

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

# Expected class name patterns — actual labels discovered from folders, not invented
MAIZE_NUTRIENT_ALIASES = {
    "mg": "magnesium_deficiency",
    "magnesium": "magnesium_deficiency",
    "k": "potassium_deficiency",
    "potassium": "potassium_deficiency",
    "n": "nitrogen_deficiency",
    "nitrogen": "nitrogen_deficiency",
    "p": "phosphorus_deficiency",
    "phosphorus": "phosphorus_deficiency",
    "healthy": "healthy",
    "control": "healthy",
}


class MaizeNutrientPreparer(BaseDatasetPreparer):
    dataset_key = "maize_nutrient"

    def _normalize_classes(self, classes: dict[str, list[Path]]) -> dict[str, list[Path]]:
        normalized: dict[str, list[Path]] = {}
        for label, paths in classes.items():
            key = normalize_label(label)
            mapped = MAIZE_NUTRIENT_ALIASES.get(key, key)
            normalized.setdefault(mapped, []).extend(paths)
        return normalized

    def _discover(self) -> dict[str, list[Path]]:
        classes = discover_class_folders(self.input_path)
        if classes:
            return self._normalize_classes(classes)
        classes = discover_nested_class_folders(self.input_path, depth=2)
        return self._normalize_classes(classes)

    def prepare(self, copy_files: bool = False) -> PreparationResult:
        pending = self.verify_input_exists()
        if pending:
            self.save(pending.metadata)
            return pending

        classes = self._discover()
        if not classes:
            meta = DatasetMetadata(
                dataset_id="maize_nutrient",
                name="Maize Nutrient Deficiency",
                task="classification",
                ai_model_target="nutrient",
                status=DatasetStatus.ERROR,
                description=self.config["description"],
                source_url=self.config.get("source_url"),
                raw_path=str(self.input_path),
                errors=["No class folders found. Download from Mendeley and extract to raw path."],
            )
            self.save(meta)
            return PreparationResult(success=False, metadata=meta, message=meta.errors[0])

        samples, corrupt = build_samples_from_classes(classes, "maize_nutrient")
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
            dataset_id="maize_nutrient",
            name="Maize Nutrient Deficiency",
            task="classification",
            ai_model_target="nutrient",
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
                "Maize-only visual symptoms.",
                "Classes mapped from folder names — verify against Mendeley dataset documentation.",
            ],
            scientific_notes=[
                "CRITICAL: This model detects VISIBLE nutrient deficiency symptoms on leaves.",
                "It does NOT measure soil nitrogen, phosphorus, or potassium concentration.",
                "Combine with NPK sensor readings in the decision engine for recommendations.",
            ],
        )
        metadata = finalize_metadata(metadata, samples, splits, self.splits_path, corrupt)
        self.save(metadata)

        return PreparationResult(
            success=True,
            metadata=metadata,
            message=f"Processed {metadata.total_images} images, classes: {metadata.classes}",
        )
