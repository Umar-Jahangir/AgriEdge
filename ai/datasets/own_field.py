"""AgriEdge own field/rover dataset preparer — structure validation only until data exists."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from ai.datasets.base import BaseDatasetPreparer
from ai.datasets.schema import DatasetMetadata, DatasetStatus, PreparationResult, DatasetSample, SplitName
from ai.datasets.utils import (
    finalize_metadata,
    is_image_file,
    stratified_split,
    validate_image,
)

logger = logging.getLogger(__name__)


class OwnFieldPreparer(BaseDatasetPreparer):
    dataset_key = "own_field"

    def prepare(self, copy_files: bool = False) -> PreparationResult:
        images_dir = self.input_path / "images"
        labels_file = self.input_path / "labels" / "manual_annotations.csv"
        metadata_file = self.input_path / "metadata" / "collection_log.json"

        if not images_dir.exists():
            meta = DatasetMetadata(
                dataset_id="own_field",
                name="AgriEdge Own Field Dataset",
                task="multimodal",
                ai_model_target="domain_adaptation",
                status=DatasetStatus.PENDING_DOWNLOAD,
                description=self.config["description"],
                raw_path=str(self.input_path),
                errors=["Own field dataset not yet collected. See data/own/README.md"],
                limitations=["Dataset does not exist yet — structure validation only."],
            )
            self.save(meta)
            return PreparationResult(success=False, metadata=meta, message=meta.errors[0])

        samples: list[DatasetSample] = []
        corrupt = 0
        for img_path in images_dir.rglob("*"):
            if not img_path.is_file() or not is_image_file(img_path):
                continue
            if not validate_image(img_path):
                corrupt += 1
                continue
            zone_id = None
            label = "unlabeled"
            samples.append(
                DatasetSample(
                    sample_id=img_path.stem,
                    image_path=str(img_path.resolve()),
                    label=label,
                    split=SplitName.TRAIN,
                    source_dataset="own_field",
                    zone_id=zone_id,
                )
            )

        if not samples:
            meta = DatasetMetadata(
                dataset_id="own_field",
                name="AgriEdge Own Field Dataset",
                task="multimodal",
                ai_model_target="domain_adaptation",
                status=DatasetStatus.PENDING_DOWNLOAD,
                description=self.config["description"],
                raw_path=str(self.input_path),
                warnings=["images/ folder exists but contains no valid images yet."],
            )
            self.save(meta)
            return PreparationResult(success=False, metadata=meta, message="No valid images in data/own/images")

        split_cfg = self.config["split"]
        splits = stratified_split(
            samples,
            train_ratio=split_cfg["train"],
            val_ratio=split_cfg["validation"],
            test_ratio=split_cfg["test"],
            seed=split_cfg["seed"],
        )

        metadata = DatasetMetadata(
            dataset_id="own_field",
            name="AgriEdge Own Field Dataset",
            task="multimodal",
            ai_model_target="domain_adaptation",
            status=DatasetStatus.PROCESSED,
            description=self.config["description"],
            raw_path=str(self.input_path),
            processed_path=str(self.output_path),
            splits_path=str(self.splits_path),
            split_strategy=split_cfg["strategy"],
            leakage_prevention="Split by zone when zone metadata available; currently unlabeled.",
            limitations=[
                "Field dataset for domain adaptation — labels may be partial.",
                "Will include rover camera images + sensor readings when collection starts.",
            ],
            scientific_notes=[
                "Primary dataset for validating models under actual deployment conditions.",
            ],
            warnings=[
                f"Labels file present: {labels_file.exists()}",
                f"Metadata log present: {metadata_file.exists()}",
            ],
        )
        metadata = finalize_metadata(metadata, samples, splits, self.splits_path, corrupt)
        self.save(metadata)

        return PreparationResult(
            success=True,
            metadata=metadata,
            message=f"Validated {metadata.total_images} own-field images (mostly unlabeled)",
        )
