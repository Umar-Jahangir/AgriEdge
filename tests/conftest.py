"""Pytest configuration and synthetic dataset fixtures."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

FIXTURES = Path(__file__).parent / "fixtures" / "datasets"


def _write_tiny_image(path: Path, color: tuple[int, int, int]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (32, 32), color)
    img.save(path, format="JPEG")


@pytest.fixture(scope="session")
def synthetic_plantvillage(tmp_path_factory):
    root = tmp_path_factory.mktemp("plantvillage")
    color_dir = root / "color"
    for cls, rgb in [
        ("Tomato___healthy", (0, 180, 0)),
        ("Tomato___Late_blight", (180, 0, 0)),
        ("Potato___healthy", (0, 120, 0)),
    ]:
        for i in range(4):
            _write_tiny_image(color_dir / cls / f"leaf_{i}.JPG", rgb)
    return root


@pytest.fixture(scope="session")
def synthetic_maize_nutrient(tmp_path_factory):
    root = tmp_path_factory.mktemp("maize_nutrient")
    for cls, rgb in [
        ("Healthy", (0, 200, 0)),
        ("Nitrogen", (200, 200, 0)),
        ("Phosphorus", (200, 100, 0)),
    ]:
        for i in range(3):
            _write_tiny_image(root / cls / f"img_{i}.jpg", rgb)
    return root


@pytest.fixture(scope="session")
def synthetic_output(tmp_path_factory):
    return tmp_path_factory.mktemp("processed")
