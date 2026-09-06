#!/usr/bin/env python3
"""Attempt IP102 acquisition via official Google Drive folder (gdown)."""

from __future__ import annotations

import json
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ARCHIVES = REPO / "data" / "external" / "archives"
DEST = REPO / "data" / "raw" / "ip102"
DRIVE = "https://drive.google.com/drive/folders/1svFSy2Da3cVMvekBwe13mzyx38XZ9xWo"


def count_images(path: Path) -> int:
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    return sum(1 for p in path.rglob("*") if p.is_file() and p.suffix.lower() in exts)


def main() -> int:
    DEST.mkdir(parents=True, exist_ok=True)
    ARCHIVES.mkdir(parents=True, exist_ok=True)

    meta_dir = ARCHIVES / "IP102-meta"
    if not (meta_dir / ".git").exists():
        subprocess.run(
            ["git", "clone", "--depth", "1", "https://github.com/xpwu95/IP102.git", str(meta_dir)],
            check=True,
        )
    if (meta_dir / "classes.txt").exists():
        shutil.copy2(meta_dir / "classes.txt", DEST / "classes.txt")

    classes = []
    if (DEST / "classes.txt").exists():
        classes = [l.strip() for l in (DEST / "classes.txt").read_text(encoding="utf-8").splitlines() if l.strip()]

    gdrive_dest = ARCHIVES / "ip102_gdrive"
    gdrive_dest.mkdir(parents=True, exist_ok=True)
    gdown_error = None
    try:
        import gdown

        print(f"Downloading IP102 from Drive folder: {DRIVE}")
        gdown.download_folder(DRIVE, output=str(gdrive_dest), quiet=False, use_cookies=False)
        for item in gdrive_dest.iterdir():
            target = DEST / item.name
            if item.is_dir():
                if target.exists():
                    shutil.rmtree(target)
                shutil.copytree(item, target)
            else:
                shutil.copy2(item, target)
    except Exception as e:
        gdown_error = str(e)
        print(f"gdown failed: {e}")

    n = count_images(DEST)
    size = sum(p.stat().st_size for p in DEST.rglob("*") if p.is_file())
    if n > 1000:
        status = "ACQUIRED"
    elif n > 0:
        status = "PARTIALLY_ACQUIRED"
    else:
        status = "PENDING_MANUAL_DOWNLOAD"

    meta = {
        "dataset": "ip102",
        "source": "https://github.com/xpwu95/IP102",
        "official_data_host": DRIVE,
        "aliyun": "https://www.aliyundrive.com/s/c5G9scSGyak",
        "status": status,
        "images": n,
        "classes_from_txt": classes,
        "class_count_from_txt": len(classes),
        "size_bytes": size,
        "size_mb": round(size / 1e6, 1),
        "gdown_error": gdown_error,
        "license_note": "Free for academic usage. Contact author for other purposes.",
        "manual_action": None
        if status == "ACQUIRED"
        else (
            "1. Open https://drive.google.com/drive/folders/1svFSy2Da3cVMvekBwe13mzyx38XZ9xWo\n"
            "2. Download IP102 v1.1 archives\n"
            "3. Extract into data/raw/ip102/\n"
            "4. Re-run: python scripts/prepare_dataset.py ip102 --summary\n"
            "Alt: AliyunDrive https://www.aliyundrive.com/s/c5G9scSGyak"
        ),
        "acquired_at": datetime.now(timezone.utc).isoformat(),
    }
    with open(DEST / "acquisition_meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(json.dumps(meta, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
