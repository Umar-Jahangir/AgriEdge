#!/usr/bin/env python3
"""Download PlantDoc via GitHub zip and sanitize Windows-invalid filenames."""

from __future__ import annotations

import json
import re
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlretrieve

REPO = Path(__file__).resolve().parents[1]
ARCHIVES = REPO / "data" / "external" / "archives"
DEST = REPO / "data" / "raw" / "plantdoc"
URL = "https://github.com/pratikkayal/PlantDoc-Dataset/archive/refs/heads/master.zip"


def sanitize(name: str) -> str:
    name = re.sub(r'[<>:"/\\|?*]', "_", name)
    # Avoid Windows MAX_PATH issues (~260 chars)
    if len(name) > 80:
        stem = Path(name).stem
        suffix = Path(name).suffix
        name = stem[:70] + suffix
    return name


def win_long(path: Path) -> str:
    """Enable Windows extended-length path for create/open."""
    p = str(path.resolve())
    if p.startswith("\\\\?\\"):
        return p
    return "\\\\?\\" + p


def main() -> int:
    ARCHIVES.mkdir(parents=True, exist_ok=True)
    DEST.mkdir(parents=True, exist_ok=True)
    zip_path = ARCHIVES / "PlantDoc-Dataset-master.zip"

    print(f"Downloading {URL}")
    urlretrieve(URL, zip_path)
    print(f"Downloaded {zip_path.stat().st_size} bytes")

    # Clear previous extract
    for child in DEST.iterdir():
        if child.name == "acquisition_meta.json":
            continue
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()

    extracted = 0
    with zipfile.ZipFile(zip_path, "r") as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            parts = Path(info.filename).parts
            if len(parts) < 2:
                continue
            rel = Path(*[sanitize(p) for p in parts[1:]])
            out = DEST / rel
            # Create parents with long-path support
            Path(win_long(out.parent)).mkdir(parents=True, exist_ok=True)
            if out.exists():
                out = out.with_name(f"{out.stem}_{extracted}{out.suffix}")
            with zf.open(info) as src, open(win_long(out), "wb") as dst:
                shutil.copyfileobj(src, dst)
            extracted += 1

    exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    images = [p for p in DEST.rglob("*") if p.is_file() and p.suffix.lower() in exts]
    classes = sorted(
        {
            p.parent.name
            for p in images
            if p.parent.parent.name.lower() in ("train", "test")
        }
    )
    class_counts = {}
    for p in images:
        if p.parent.parent.name.lower() in ("train", "test"):
            class_counts[p.parent.name] = class_counts.get(p.parent.name, 0) + 1

    meta = {
        "dataset": "plantdoc",
        "source": URL,
        "status": "ACQUIRED" if images else "BLOCKED",
        "extracted_files": extracted,
        "images": len(images),
        "classes": classes,
        "class_counts": class_counts,
        "size_bytes": sum(p.stat().st_size for p in DEST.rglob("*") if p.is_file()),
        "windows_note": "Filenames with ? and other invalid Windows chars were sanitized to _",
        "acquired_at": datetime.now(timezone.utc).isoformat(),
        "license": "CC BY 4.0",
    }
    with open(DEST / "acquisition_meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(json.dumps(meta, indent=2))
    return 0 if images else 1


if __name__ == "__main__":
    raise SystemExit(main())
