"""PlantVillage disease classification dataset preparer."""

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
    infer_plantvillage_leaf_group,
    stratified_split,
)

logger = logging.getLogger(__name__)

# Known PlantVillage layouts after extraction
PLANTVILLAGE_LAYOUTS = [
    "color",           # raw/color/Crop___Disease/*.JPG
    "grayscale",
    "segmented",
]


class PlantVillagePreparer(BaseDatasetPreparer):
    dataset_key = "plantvillage"

    def _discover(self) -> dict[str, list[Path]]:
        # Try standard layouts
        for layout in PLANTVILLAGE_LAYOUTS:
            layout_path = self.input_path / layout
            if layout_path.exists():
                classes = discover_class_folders(layout_path)
                if classes:
                    logger.info("Found PlantVillage layout: %s (%d classes)", layout, len(classes))
                    return classes

        # Flat class folders at root
        classes = discover_class_folders(self.input_path)
        if classes:
            return classes

        # Deep search (e.g. nested archives)
        classes = discover_nested_class_folders(self.input_path, depth=2)
        if classes:
            return classes

        return discover_nested_class_folders(self.input_path, depth=3)

    def prepare(self, copy_files: bool = False) -> PreparationResult:
        pending = self.verify_input_exists()
        if pending:
            self.save(pending.metadata)
            return pending

        classes = self._discover()
        if not classes:
            meta = DatasetMetadata(
                dataset_id="plantvillage",
                name="PlantVillage",
                task="classification",
                ai_model_target="disease",
                status=DatasetStatus.ERROR,
                description=self.config["description"],
                source_url=self.config.get("source_url"),
                license_note=self.config.get("license_note"),
                raw_path=str(self.input_path),
                processed_path=str(self.output_path),
                splits_path=str(self.splits_path),
                errors=["No class folders or images discovered. Inspect raw dataset structure."],
                limitations=[
                    "Controlled lab/leaf imagery — domain gap vs field rover images.",
                    "Classes discovered from folder names only; verify against dataset documentation.",
                ],
                scientific_notes=[
                    "Detects visible disease symptoms on leaves; not a soil or nutrient measurement.",
                ],
            )
            self.save(meta)
            return PreparationResult(success=False, metadata=meta, message=meta.errors[0])

        samples, corrupt = build_samples_from_classes(
            classes, "plantvillage", group_fn=infer_plantvillage_leaf_group
        )

        split_cfg = self.config["split"]
        splits = stratified_split(
            samples,
            train_ratio=split_cfg["train"],
            val_ratio=split_cfg["validation"],
            test_ratio=split_cfg["test"],
            seed=split_cfg["seed"],
            group_key=split_cfg.get("group_key"),
        )

        if copy_files:
            copy_or_link_samples(splits, self.output_path)

        metadata = DatasetMetadata(
            dataset_id="plantvillage",
            name="PlantVillage",
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
            leakage_prevention=(
                "Stratified split with group holdout using inferred leaf_group from filename. "
                "All images sharing a leaf_group stay in the same split."
            ),
            preprocessing=self.config.get("preprocessing", {}),
            augmentation=self.config.get("augmentation", {}),
            limitations=[
                "Controlled lab imagery; expect domain shift on rover field captures.",
                "Leaf groups inferred heuristically from filenames — verify for your download version.",
            ],
            scientific_notes=[
                "Disease classification from leaf images only.",
            ],
        )
        metadata = finalize_metadata(metadata, samples, splits, self.splits_path, corrupt)
        self.save(metadata)

        return PreparationResult(
            success=True,
            metadata=metadata,
            message=f"Processed {metadata.total_images} images across {len(metadata.classes)} classes",
        )
