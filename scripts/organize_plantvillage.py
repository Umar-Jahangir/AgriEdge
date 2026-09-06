#!/usr/bin/env python3
"""Link/copy PlantVillage from GitHub clone into data/raw/plantvillage and verify."""

from __future__ import annotations

import json
import shutil
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SRC = REPO / "data" / "external" / "archives" / "PlantVillage-Dataset"
DEST = REPO / "data" / "raw" / "plantvillage"


def main() -> int:
    # Official structure: raw/color, raw/grayscale, raw/segmented
    color = SRC / "raw" / "color"
    if not color.exists():
        # fallback search
        candidates = list(SRC.rglob("Apple___Apple_scab"))
        print("color not found; candidates", candidates[:5])
        return 1

    DEST.mkdir(parents=True, exist_ok=True)
    dest_color = DEST / "color"
    if dest_color.exists():
        if dest_color.is_symlink() or dest_color.is_junction():
            dest_color.unlink()
        else:
            shutil.rmtree(dest_color)

    # Prefer junction/symlink to avoid duplicating ~GBs
    try:
        dest_color.symlink_to(color, target_is_directory=True)
        link_mode = "symlink"
    except OSError:
        try:
            import _winapi

            _winapi.CreateJunction(str(color), str(dest_color))
            link_mode = "junction"
        except Exception:
            print("Symlink/junction failed; copying (slow)...")
            shutil.copytree(color, dest_color)
            link_mode = "copy"

    # Also note official leaf-grouped SVM splits if present
    svm = SRC / "data_distribution_for_SVM"
    class_counts = Counter()
    classes = []
    for cdir in sorted(dest_color.iterdir()):
        if not cdir.is_dir():
            continue
        classes.append(cdir.name)
        n = sum(1 for p in cdir.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png"})
        class_counts[cdir.name] = n

    total = sum(class_counts.values())
    size = sum(p.stat().st_size for p in dest_color.rglob("*") if p.is_file())

    meta = {
        "dataset": "plantvillage",
        "source": "https://github.com/spMohanty/PlantVillage-Dataset",
        "secondary_source": "https://huggingface.co/datasets/mohanty/PlantVillage",
        "status": "ACQUIRED",
        "layout": "raw/color/<ClassName>/*.JPG",
        "link_mode": link_mode,
        "source_path": str(color),
        "destination": str(DEST),
        "images": total,
        "classes": classes,
        "class_counts": dict(class_counts),
        "num_classes": len(classes),
        "size_bytes": size,
        "size_mb": round(size / 1e6, 1),
        "official_svm_split_present": svm.exists(),
        "leaf_grouping_dir": str(SRC / "leaf_grouping") if (SRC / "leaf_grouping").exists() else None,
        "acquired_at": datetime.now(timezone.utc).isoformat(),
    }
    with open(DEST / "acquisition_meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(json.dumps({
        "status": meta["status"],
        "images": meta["images"],
        "num_classes": meta["num_classes"],
        "size_mb": meta["size_mb"],
        "link_mode": link_mode,
        "classes_sample": classes[:10],
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
