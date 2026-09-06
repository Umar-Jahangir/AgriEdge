"""Transforms and model builders for disease classification."""

from __future__ import annotations

from typing import Any

import torch
import torch.nn as nn
from torchvision import models, transforms


def build_transforms(image_size: int, mean: list[float], std: list[float], train: bool) -> transforms.Compose:
    if train:
        return transforms.Compose(
            [
                transforms.Resize((image_size, image_size)),
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.RandomRotation(15),
                transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
                transforms.ToTensor(),
                transforms.Normalize(mean=mean, std=std),
            ]
        )
    return transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=mean, std=std),
        ]
    )


SUPPORTED_ARCHITECTURES = ("mobilenet_v3_small", "efficientnet_b0")


def create_model(architecture: str, num_classes: int, pretrained: bool = True) -> nn.Module:
    weights_small = models.MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
    weights_eff = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None

    if architecture == "mobilenet_v3_small":
        model = models.mobilenet_v3_small(weights=weights_small)
        in_features = model.classifier[-1].in_features
        model.classifier[-1] = nn.Linear(in_features, num_classes)
        return model
    if architecture == "efficientnet_b0":
        model = models.efficientnet_b0(weights=weights_eff)
        in_features = model.classifier[-1].in_features
        model.classifier[-1] = nn.Linear(in_features, num_classes)
        return model
    raise ValueError(f"Unsupported architecture: {architecture}. Choose from {SUPPORTED_ARCHITECTURES}")


def count_parameters(model: nn.Module) -> dict[str, int]:
    total = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    return {"total": total, "trainable": trainable}


def model_size_mb(path: Any) -> float:
    from pathlib import Path

    p = Path(path)
    return round(p.stat().st_size / (1024 * 1024), 4)
