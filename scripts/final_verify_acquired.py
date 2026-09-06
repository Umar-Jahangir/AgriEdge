#!/usr/bin/env python3
"""Final on-disk verification of PlantVillage, PlantDoc, IP102 — no modifications."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def count_images(path: Path) -> int:
    if not path.exists():
        return 0
    return sum(1 for p in path.rglob("*") if p.is_file() and p.suffix.lower() in EXTS)


def count_jsonl(path: Path) -> int:
    if not path.exists():
        return 0
    return sum(1 for _ in open(path, encoding="utf-8"))


def verify_plantvillage() -> dict:
    color = REPO / "data" / "raw" / "plantvillage" / "color"
    classes = sorted([p.name for p in color.iterdir() if p.is_dir()]) if color.exists() else []
    counts = {c: sum(1 for p in (color / c).iterdir() if p.suffix.lower() in EXTS) for c in classes}
    meta = json.loads((REPO / "data" / "processed" / "plantvillage" / "dataset_metadata.json").read_text(encoding="utf-8"))
    splits = {
        s: count_jsonl(REPO / "data" / "splits" / "plantvillage" / f"{s}.jsonl")
        for s in ["train", "validation", "test"]
    }
    return {
        "dataset": "plantvillage",
        "color_exists": color.exists(),
        "disk_images": sum(counts.values()),
        "disk_classes": len(classes),
        "classes": classes,
        "meta_total": meta.get("total_images"),
        "meta_classes": len(meta.get("classes", [])),
        "split_manifest_counts": splits,
        "meta_split_counts": {k: v.get("count") for k, v in meta.get("splits", {}).items()},
        "counts_match_meta": sum(counts.values()) == meta.get("total_images"),
        "splits_match_meta": splits == {k: v.get("count") for k, v in meta.get("splits", {}).items()},
    }


def verify_plantdoc() -> dict:
    root = REPO / "data" / "raw" / "plantdoc"
    classes = set()
    disk_images = 0
    for split in ["train", "test"]:
        sd = root / split
        if not sd.exists():
            continue
        for cdir in sd.iterdir():
            if cdir.is_dir():
                classes.add(cdir.name)
                disk_images += sum(1 for p in cdir.iterdir() if p.suffix.lower() in EXTS)
    meta = json.loads((REPO / "data" / "processed" / "plantdoc" / "dataset_metadata.json").read_text(encoding="utf-8"))
    splits = {
        s: count_jsonl(REPO / "data" / "splits" / "plantdoc" / f"{s}.jsonl")
        for s in ["train", "validation", "test"]
    }
    return {
        "dataset": "plantdoc",
        "disk_images": disk_images,
        "disk_classes": len(classes),
        "classes": sorted(classes),
        "meta_total": meta.get("total_images"),
        "meta_classes": len(meta.get("classes", [])),
        "split_manifest_counts": splits,
        "meta_split_counts": {k: v.get("count") for k, v in meta.get("splits", {}).items()},
        "note": "Prepared/validated count may be lower than raw extract if corrupt files skipped",
    }


def verify_ip102() -> dict:
    clf = REPO / "data" / "raw" / "ip102" / "Classification" / "extracted" / "ip102_v1.1"
    images = clf / "images"
    det_jpeg = REPO / "data" / "raw" / "ip102" / "Detection" / "VOC2007" / "JPEGImages"
    det_ann = REPO / "data" / "raw" / "ip102" / "Detection" / "VOC2007" / "Annotations"
    classes_txt = REPO / "data" / "raw" / "ip102" / "classes.txt"
    class_lines = [l.strip() for l in classes_txt.read_text(encoding="utf-8").splitlines() if l.strip()] if classes_txt.exists() else []

    official = {}
    for name in ["train.txt", "val.txt", "test.txt"]:
        p = clf / name
        official[name] = sum(1 for _ in open(p, encoding="utf-8")) if p.exists() else 0

    meta = json.loads((REPO / "data" / "processed" / "ip102" / "dataset_metadata.json").read_text(encoding="utf-8"))
    splits = {
        s: count_jsonl(REPO / "data" / "splits" / "ip102" / f"{s}.jsonl")
        for s in ["train", "validation", "test"]
    }
    return {
        "dataset": "ip102",
        "classification_images_on_disk": count_images(images),
        "detection_images_on_disk": count_images(det_jpeg),
        "detection_xml_on_disk": sum(1 for _ in det_ann.rglob("*.xml")) if det_ann.exists() else 0,
        "classes_txt_count": len(class_lines),
        "official_list_counts": official,
        "meta_total": meta.get("total_images"),
        "meta_classes": len(meta.get("classes", [])),
        "split_manifest_counts": splits,
        "official_equals_manifests": (
            official.get("train.txt") == splits.get("train")
            and official.get("val.txt") == splits.get("validation")
            and official.get("test.txt") == splits.get("test")
        ),
    }


def main() -> int:
    report = {
        "plantvillage": verify_plantvillage(),
        "plantdoc": verify_plantdoc(),
        "ip102": verify_ip102(),
        "maize_nutrient_present": (REPO / "data" / "raw" / "maize_nutrient").exists()
        and count_images(REPO / "data" / "raw" / "maize_nutrient") > 0,
        "maize_nitrogen_present": (REPO / "data" / "raw" / "maize_nitrogen").exists()
        and count_images(REPO / "data" / "raw" / "maize_nitrogen") > 0,
    }
    out = REPO / "docs" / "dataset_final_verification.json"
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    print(f"Wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
