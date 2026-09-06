#!/usr/bin/env python3
"""Finalize IP102 acquisition metadata after tar extraction."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ROOT = REPO / "data" / "raw" / "ip102"


def main() -> int:
    classes = []
    cls_file = ROOT / "classes.txt"
    if cls_file.exists():
        classes = [l.strip() for l in cls_file.read_text(encoding="utf-8").splitlines() if l.strip()]

    clf_root = ROOT / "Classification" / "extracted"
    clf_imgs = [p for p in clf_root.rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png"}]
    det_imgs = [p for p in (ROOT / "Detection").rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png"}]
    det_xml = [p for p in (ROOT / "Detection").rglob("*.xml")]

    # Inspect classification layout
    layout_sample = []
    ip = clf_root / "ip102_v1.1"
    if ip.exists():
        layout_sample = [p.name for p in ip.iterdir()][:20]

    size = sum(p.stat().st_size for p in ROOT.rglob("*") if p.is_file())
    meta = {
        "dataset": "ip102",
        "source": "https://github.com/xpwu95/IP102",
        "official_data_host": "https://drive.google.com/drive/folders/1svFSy2Da3cVMvekBwe13mzyx38XZ9xWo",
        "status": "ACQUIRED" if len(clf_imgs) > 1000 else "PARTIALLY_ACQUIRED",
        "classification_images": len(clf_imgs),
        "detection_images": len(det_imgs),
        "detection_xml_annotations": len(det_xml),
        "classes_from_txt": classes,
        "class_count_from_txt": len(classes),
        "classification_layout_sample": layout_sample,
        "size_bytes": size,
        "size_gb": round(size / 1e9, 2),
        "license_note": "Free for academic usage. Contact author for other purposes.",
        "acquired_at": datetime.now(timezone.utc).isoformat(),
    }
    with open(ROOT / "acquisition_meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(json.dumps(meta, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
