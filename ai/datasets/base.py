"""Base class for dataset preparers."""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from pathlib import Path

from ai.datasets.schema import DatasetMetadata, PreparationResult
from ai.datasets.utils import (
    REPO_ROOT,
    finalize_metadata,
    load_dataset_config,
    pending_result,
    resolve_path,
    write_metadata,
)

logger = logging.getLogger(__name__)


class BaseDatasetPreparer(ABC):
    dataset_key: str = ""

    def __init__(self, input_path: Path | None = None, output_path: Path | None = None):
        self.config = load_dataset_config(self.dataset_key)
        self.input_path = input_path or resolve_path(self.config["raw_path"])
        self.output_path = output_path or resolve_path(self.config["processed_path"])
        self.splits_path = resolve_path(self.config["splits_path"])

    @abstractmethod
    def prepare(self, copy_files: bool = False) -> PreparationResult:
        raise NotImplementedError

    def verify_input_exists(self) -> PreparationResult | None:
        if not self.input_path.exists():
            return pending_result(
                dataset_id=self.config["id"],
                name=self.config["id"],
                task=self.config["task"],
                ai_target=self.config["ai_model_target"],
                description=self.config.get("description", ""),
                raw_path=self.input_path,
                reason=f"Raw dataset not found at {self.input_path}. Download manually — see docs/dataset.md",
            )
        return None

    def save(self, metadata: DatasetMetadata) -> Path:
        return write_metadata(metadata, self.output_path)
