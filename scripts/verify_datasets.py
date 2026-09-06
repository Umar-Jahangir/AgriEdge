#!/usr/bin/env python3
"""Verify all AgriEdge datasets: counts, classes, corrupt files, disk usage."""

from __future__ import annotations

import hashlib
import json
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO))

EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}

DATASETS = {
    "plantvillage": REPO / "data" / "raw" / "plantvillage",
    "plantdoc": REPO / "data" / "raw" / "plantdoc",
    "ip102": REPO / "data" / "raw" / "ip102",
    "maize_nutrient": REPO / "data" / "raw" / "maize_nutrient",
    "maize_nitrogen": REPO / "data" / "raw" / "maize_nitrogen",
    "own_field": REPO / "data" / "own",
}


def find_class_root(root: Path) -> Path | None:
    for candidate in [root / "color", root / "train", root / "TRAIN", root]:
        if candidate.exists():
            return candidate
    return root if root.exists() else None


def discover_classes(root: Path) -> dict[str, list[Path]]:
    classes: dict[str, list[Path]] = defaultdict(list)
    # Prefer train/test class folders
    for split in ["train", "test", "TRAIN", "TEST", "color"]:
        split_dir = root / split
        if not split_dir.exists():
            continue
        for cdir in split_dir.iterdir():
            if cdir.is_dir():
                for img in cdir.rglob("*"):
                    if img.is_file() and img.suffix.lower() in EXTS:
                        classes[cdir.name].append(img)
        if classes:
            return dict(classes)

    # Flat class folders
    for cdir in root.iterdir():
        if cdir.is_dir() and cdir.name not in {".git"}:
            imgs = [p for p in cdir.rglob("*") if p.is_file() and p.suffix.lower() in EXTS]
            if imgs:
                classes[cdir.name] = imgs
    return dict(classes)


def verify_images(paths: list[Path], max_check: int = 500) -> dict:
    corrupt = 0
    dims = Counter()
    checked = 0
    for p in paths[:max_check]:
        checked += 1
        try:
            with Image.open(p) as im:
                im.verify()
            with Image.open(p) as im:
                dims[f"{im.size[0]}x{im.size[1]}"] += 1
        except Exception:
            corrupt += 1
    return {"checked": checked, "corrupt_in_sample": corrupt, "top_dimensions": dims.most_common(5)}


def file_hash_sample(paths: list[Path], max_files: int = 200) -> dict:
    """Lightweight duplicate detection on a sample via size+partial hash."""
    seen = {}
    dups = 0
    for p in paths[:max_files]:
        try:
            sz = p.stat().st_size
            with open(p, "rb") as f:
                h = hashlib.md5(f.read(8192) + str(sz).encode()).hexdigest()
            key = (sz, h)
            if key in seen:
                dups += 1
            else:
                seen[key] = str(p)
        except Exception:
            pass
    return {"sample_size": min(len(paths), max_files), "approx_duplicates_in_sample": dups}


def verify_one(name: str, root: Path) -> dict:
    meta_path = root / "acquisition_meta.json"
    acq = {}
    if meta_path.exists():
        acq = json.loads(meta_path.read_text(encoding="utf-8"))

    if not root.exists():
        return {
            "dataset": name,
            "status": "MISSING",
            "images": 0,
            "classes": [],
            "acquisition": acq,
        }

    classes = discover_classes(root)
    all_imgs = [p for imgs in classes.values() for p in imgs]
    # Also count any images if class discovery failed
    if not all_imgs:
        all_imgs = [p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in EXTS]

    size = sum(p.stat().st_size for p in root.rglob("*") if p.is_file())
    status = acq.get("status")
    if not status:
        if name == "own_field":
            status = "STRUCTURE_ONLY" if len(all_imgs) == 0 else "ACQUIRED"
        else:
            status = "ACQUIRED" if len(all_imgs) > 0 else "PENDING_MANUAL_DOWNLOAD"

    result = {
        "dataset": name,
        "path": str(root),
        "status": status,
        "images": len(all_imgs),
        "num_classes": len(classes),
        "classes": sorted(classes.keys()),
        "class_counts": {k: len(v) for k, v in sorted(classes.items())},
        "size_bytes": size,
        "size_mb": round(size / 1e6, 1),
        "size_gb": round(size / 1e9, 2),
        "image_check": verify_images(all_imgs) if all_imgs else {},
        "duplicate_sample": file_hash_sample(all_imgs) if all_imgs else {},
        "acquisition": acq,
        "verified_at": datetime.now(timezone.utc).isoformat(),
    }
    return result


def main() -> int:
    results = [verify_one(k, v) for k, v in DATASETS.items()]
    out = REPO / "docs" / "dataset_verification.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"verified_at": datetime.now(timezone.utc).isoformat(), "datasets": results}, f, indent=2)

    print(json.dumps([
        {
            "dataset": r["dataset"],
            "status": r["status"],
            "images": r["images"],
            "num_classes": r["num_classes"],
            "size_gb": r["size_gb"],
            "classes_sample": r["classes"][:8],
        }
        for r in results
    ], indent=2))
    print(f"\nFull report: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
