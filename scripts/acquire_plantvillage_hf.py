#!/usr/bin/env python3
"""Acquire PlantVillage via Hugging Face (official mohanty/PlantVillage color)."""

from __future__ import annotations

import json
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
DEST = REPO / "data" / "raw" / "plantvillage"


def save_one(args):
    split_name, i, row, label_names, color_root = args
    label = label_names[row["label"]]
    out_dir = color_root / label
    out_dir.mkdir(parents=True, exist_ok=True)
    leaf_id = str(row.get("leaf_id", "unknown")).replace("/", "_")
    fname = f"{split_name}_leaf{leaf_id}_{i:06d}.jpg"
    path = out_dir / fname
    if not path.exists():
        row["image"].convert("RGB").save(path, quality=92)
    return label


def main() -> int:
    from datasets import load_dataset

    DEST.mkdir(parents=True, exist_ok=True)
    color_root = DEST / "color"
    color_root.mkdir(parents=True, exist_ok=True)

    print("Loading mohanty/PlantVillage color from Hugging Face...")
    ds = load_dataset("mohanty/PlantVillage", "color")
    label_names = ds["train"].features["label"].names
    counts: Counter = Counter()

    for split_name in ds.keys():
        split = ds[split_name]
        print(f"Exporting split {split_name}: {len(split)} images")
        # Process in batches to avoid huge memory
        batch = []
        for i, row in enumerate(split):
            batch.append((split_name, i, row, label_names, color_root))
            if len(batch) >= 64:
                with ThreadPoolExecutor(max_workers=8) as ex:
                    for label in ex.map(save_one, batch):
                        counts[label] += 1
                if (i + 1) % 2000 == 0:
                    print(f"  {split_name}: {i+1}/{len(split)}")
                batch = []
        if batch:
            with ThreadPoolExecutor(max_workers=8) as ex:
                for label in ex.map(save_one, batch):
                    counts[label] += 1

    size = sum(p.stat().st_size for p in DEST.rglob("*") if p.is_file())
    meta = {
        "dataset": "plantvillage",
        "source": "https://huggingface.co/datasets/mohanty/PlantVillage",
        "config": "color",
        "status": "ACQUIRED",
        "images": int(sum(counts.values())),
        "classes": label_names,
        "class_counts": dict(counts),
        "official_splits": {k: len(ds[k]) for k in ds.keys()},
        "size_bytes": size,
        "size_mb": round(size / 1e6, 1),
        "leakage_note": "HF official train/test preserve leaf grouping; filenames prefixed with split",
        "acquired_at": datetime.now(timezone.utc).isoformat(),
    }
    with open(DEST / "acquisition_meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(json.dumps({k: meta[k] for k in ["status", "images", "size_mb", "official_splits"]}, indent=2))
    print(f"Classes ({len(label_names)}): {label_names}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
