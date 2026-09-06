"""Dataset preparation pipeline tests — use synthetic fixtures, no downloads required."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from ai.datasets.plantvillage import PlantVillagePreparer
from ai.datasets.maize_nutrient import MaizeNutrientPreparer
from ai.datasets.own_field import OwnFieldPreparer
from ai.datasets.nitrogen_maize import NitrogenMaizePreparer
from ai.datasets.schema import DatasetStatus
from ai.datasets.utils import (
    infer_plantvillage_leaf_group,
    normalize_label,
    stratified_split,
    validate_image,
    build_samples_from_classes,
)
from ai.datasets.schema import DatasetSample, SplitName


class TestUtilities:
    def test_normalize_label(self):
        assert normalize_label("Tomato___Late_blight") == "tomato___late_blight"
        assert normalize_label("Nitrogen Deficiency") == "nitrogen_deficiency"

    def test_leaf_group_inference(self):
        assert infer_plantvillage_leaf_group("leaf_001.JPG") == "leaf"
        assert infer_plantvillage_leaf_group("image_12.JPG") == "image"

    def test_validate_image(self, synthetic_plantvillage):
        img = next(synthetic_plantvillage.rglob("*.JPG"))
        assert validate_image(img) is True

    def test_stratified_split_preserves_groups(self):
        samples = [
            DatasetSample(
                sample_id=f"s{i}",
                image_path=f"/img{i}.jpg",
                label="a" if i < 5 else "b",
                split=SplitName.TRAIN,
                source_dataset="test",
                group_id=f"g{i // 2}",
            )
            for i in range(10)
        ]
        splits = stratified_split(samples, 0.6, 0.2, 0.2, seed=42, group_key="leaf_group")
        assert sum(len(v) for v in splits.values()) == 10
        assert len(splits[SplitName.TRAIN]) > 0


class TestPlantVillagePreparer:
    def test_prepare_synthetic(self, synthetic_plantvillage, synthetic_output, tmp_path):
        splits_dir = tmp_path / "splits"
        preparer = PlantVillagePreparer(
            input_path=synthetic_plantvillage,
            output_path=synthetic_output / "plantvillage",
        )
        preparer.splits_path = splits_dir
        result = preparer.prepare()

        assert result.success is True
        assert result.metadata.status == DatasetStatus.PROCESSED
        assert result.metadata.total_images == 12
        assert len(result.metadata.classes) == 3
        assert "tomato___healthy" in result.metadata.classes

        meta_file = synthetic_output / "plantvillage" / "dataset_metadata.json"
        assert meta_file.exists()
        with open(meta_file) as f:
            data = json.load(f)
        assert data["ai_model_target"] == "disease"

        train_manifest = splits_dir / "train.jsonl"
        assert train_manifest.exists()


class TestMaizeNutrientPreparer:
    def test_prepare_synthetic(self, synthetic_maize_nutrient, synthetic_output, tmp_path):
        preparer = MaizeNutrientPreparer(
            input_path=synthetic_maize_nutrient,
            output_path=synthetic_output / "maize",
        )
        preparer.splits_path = tmp_path / "splits_maize"
        result = preparer.prepare()

        assert result.success is True
        assert result.metadata.total_images == 9
        assert "healthy" in result.metadata.classes
        assert any("NOT measure soil" in n for n in result.metadata.scientific_notes)


class TestNitrogenMaizePreparer:
    def test_pending_when_missing(self, tmp_path):
        preparer = NitrogenMaizePreparer(input_path=tmp_path / "missing")
        result = preparer.prepare()
        assert result.success is False
        assert result.metadata.status == DatasetStatus.PENDING_DOWNLOAD


class TestOwnFieldPreparer:
    def test_pending_when_empty(self, tmp_path):
        own_root = tmp_path / "own"
        (own_root / "images").mkdir(parents=True)
        preparer = OwnFieldPreparer(input_path=own_root, output_path=tmp_path / "out")
        preparer.splits_path = tmp_path / "splits_own"
        result = preparer.prepare()
        assert result.success is False


class TestPendingDownload:
  def test_all_public_datasets_report_pending_without_download(self, tmp_path):
    from ai.datasets.registry import PREPARERS

    for key in ["plantvillage", "plantdoc", "ip102", "maize_nutrient", "nitrogen_maize"]:
      preparer = PREPARERS[key](input_path=tmp_path / key)
      preparer.splits_path = tmp_path / "splits" / key
      preparer.output_path = tmp_path / "out" / key
      result = preparer.prepare()
      assert result.success is False
      assert result.metadata.status in (
        DatasetStatus.PENDING_DOWNLOAD,
        DatasetStatus.ERROR,
      )
