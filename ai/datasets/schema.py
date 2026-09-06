"""Common dataset metadata schema for all AgriEdge AI datasets."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class DatasetStatus(str, Enum):
    PENDING_DOWNLOAD = "pending_download"
    VERIFIED = "verified"
    PROCESSED = "processed"
    ERROR = "error"


class SplitName(str, Enum):
    TRAIN = "train"
    VALIDATION = "validation"
    TEST = "test"


class DatasetSample(BaseModel):
    """Single sample entry in a split manifest."""

    sample_id: str
    image_path: str
    label: str
    split: SplitName
    source_dataset: str
    group_id: str | None = None
    zone_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class SplitInfo(BaseModel):
    count: int
    manifest_path: str
    class_distribution: dict[str, int] = Field(default_factory=dict)


class DatasetMetadata(BaseModel):
    """Unified metadata written after dataset preparation."""

    dataset_id: str
    name: str
    version: str = "1.0.0"
    task: str
    ai_model_target: str
    status: DatasetStatus
    description: str
    source_url: str | None = None
    license_note: str | None = None

    classes: list[str] = Field(default_factory=list)
    class_counts: dict[str, int] = Field(default_factory=dict)
    total_images: int = 0
    corrupt_images: int = 0
    missing_labels: int = 0

    splits: dict[str, SplitInfo] = Field(default_factory=dict)
    split_strategy: str = ""
    leakage_prevention: str = ""

    preprocessing: dict[str, Any] = Field(default_factory=dict)
    augmentation: dict[str, Any] = Field(default_factory=dict)
    limitations: list[str] = Field(default_factory=list)
    scientific_notes: list[str] = Field(default_factory=list)

    raw_path: str = ""
    processed_path: str = ""
    splits_path: str = ""
    prepared_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)

    def to_summary_dict(self) -> dict[str, Any]:
        return {
            "dataset_id": self.dataset_id,
            "status": self.status.value,
            "task": self.task,
            "ai_model_target": self.ai_model_target,
            "total_images": self.total_images,
            "num_classes": len(self.classes),
            "classes": self.classes,
            "class_counts": self.class_counts,
            "split_strategy": self.split_strategy,
            "corrupt_images": self.corrupt_images,
            "errors": self.errors,
        }


class PreparationResult(BaseModel):
    success: bool
    metadata: DatasetMetadata
    message: str = ""
