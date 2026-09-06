#!/usr/bin/env python3
"""
Acquire AgriEdge Rover datasets from official public sources.

Does NOT invent URLs. Does NOT train models.
Marks datasets BLOCKED when automation is impossible.
"""

from __future__ import annotations

import argparse
import json
import logging
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("acquire_datasets")

RAW = REPO_ROOT / "data" / "raw"
EXTERNAL = REPO_ROOT / "data" / "external"
ARCHIVES = EXTERNAL / "archives"
STATUS_PATH = REPO_ROOT / "docs" / "dataset_acquisition_log.json"


def ensure_dirs() -> None:
    for p in [
        RAW / "plantvillage",
        RAW / "plantdoc",
        RAW / "ip102",
        RAW / "maize_nutrient",
        RAW / "maize_nitrogen",
        ARCHIVES,
        REPO_ROOT / "data" / "own" / "images",
        REPO_ROOT / "data" / "own" / "annotations",
        REPO_ROOT / "data" / "own" / "metadata",
        REPO_ROOT / "data" / "own" / "raw",
        REPO_ROOT / "data" / "own" / "processed",
    ]:
        p.mkdir(parents=True, exist_ok=True)


def dir_size_bytes(path: Path) -> int:
    if not path.exists():
        return 0
    total = 0
    for f in path.rglob("*"):
        if f.is_file():
            try:
                total += f.stat().st_size
            except OSError:
                pass
    return total


def count_images(path: Path) -> int:
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}
    if not path.exists():
        return 0
    return sum(1 for f in path.rglob("*") if f.is_file() and f.suffix.lower() in exts)


def acquire_plantvillage() -> dict:
    """Official Hugging Face: mohanty/PlantVillage (color config)."""
    dest = RAW / "plantvillage"
    status = {
        "dataset": "plantvillage",
        "source": "https://huggingface.co/datasets/mohanty/PlantVillage",
        "method": "datasets.load_dataset(mohanty/PlantVillage, color)",
        "destination": str(dest),
        "status": "PENDING",
    }
    try:
        from datasets import load_dataset

        logger.info("Downloading PlantVillage (color) from Hugging Face...")
        ds = load_dataset("mohanty/PlantVillage", "color")
        # Save images to disk organized by label for our preparers
        color_root = dest / "color"
        color_root.mkdir(parents=True, exist_ok=True)
        label_names = ds["train"].features["label"].names
        counts = {n: 0 for n in label_names}

        for split_name in ds.keys():
            split = ds[split_name]
            for i, row in enumerate(split):
                label = label_names[row["label"]]
                out_dir = color_root / label
                out_dir.mkdir(parents=True, exist_ok=True)
                leaf_id = row.get("leaf_id", "unknown")
                fname = f"{split_name}_{leaf_id}_{i}.jpg"
                row["image"].convert("RGB").save(out_dir / fname, quality=95)
                counts[label] += 1
                if (i + 1) % 2000 == 0:
                    logger.info("PlantVillage %s: %d/%d", split_name, i + 1, len(split))

        # Write official split metadata
        meta = {
            "source": "huggingface:mohanty/PlantVillage:color",
            "official_splits": {k: len(ds[k]) for k in ds.keys()},
            "classes": label_names,
            "class_counts": counts,
            "acquired_at": datetime.now(timezone.utc).isoformat(),
            "note": "Preserved Hugging Face official train/test leaf-grouped split via filename prefix",
        }
        with open(dest / "acquisition_meta.json", "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)

        status.update(
            {
                "status": "ACQUIRED",
                "images": sum(counts.values()),
                "classes": label_names,
                "class_counts": counts,
                "size_bytes": dir_size_bytes(dest),
                "size_mb": round(dir_size_bytes(dest) / 1e6, 1),
            }
        )
    except Exception as e:
        logger.exception("PlantVillage acquisition failed")
        status.update({"status": "BLOCKED", "error": str(e)})
    return status


def acquire_plantdoc() -> dict:
    """Official GitHub: pratikkayal/PlantDoc-Dataset (contains images)."""
    dest = RAW / "plantdoc"
    status = {
        "dataset": "plantdoc",
        "source": "https://github.com/pratikkayal/PlantDoc-Dataset",
        "method": "git clone --depth 1",
        "destination": str(dest),
        "status": "PENDING",
    }
    try:
        clone_dir = ARCHIVES / "PlantDoc-Dataset"
        if not (clone_dir / ".git").exists() and not any(clone_dir.glob("*")):
            logger.info("Cloning PlantDoc-Dataset...")
            subprocess.run(
                [
                    "git",
                    "clone",
                    "--depth",
                    "1",
                    "https://github.com/pratikkayal/PlantDoc-Dataset.git",
                    str(clone_dir),
                ],
                check=True,
            )
        else:
            logger.info("PlantDoc clone already present at %s", clone_dir)

        # Copy/symlink TRAIN/TEST structure into raw/plantdoc
        dest.mkdir(parents=True, exist_ok=True)
        for sub in ["TRAIN", "TEST", "train", "test"]:
            src = clone_dir / sub
            if src.exists():
                target = dest / sub.lower()
                if target.exists():
                    shutil.rmtree(target)
                shutil.copytree(src, target)

        # Also clone OD repo metadata note only (large annotations may be separate)
        od_status = {
            "object_detection_repo": "https://github.com/pratikkayal/PlantDoc-Object-Detection-Dataset",
            "note": "OD repo acquired separately if needed",
        }
        n = count_images(dest)
        classes = sorted(
            {
                p.name
                for split in dest.iterdir()
                if split.is_dir()
                for p in split.iterdir()
                if p.is_dir()
            }
        )
        meta = {
            "source": "github:pratikkayal/PlantDoc-Dataset",
            "images": n,
            "classes": classes,
            "acquired_at": datetime.now(timezone.utc).isoformat(),
            **od_status,
        }
        with open(dest / "acquisition_meta.json", "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)

        status.update(
            {
                "status": "ACQUIRED" if n > 0 else "PARTIALLY_ACQUIRED",
                "images": n,
                "classes": classes,
                "size_bytes": dir_size_bytes(dest),
                "size_mb": round(dir_size_bytes(dest) / 1e6, 1),
            }
        )
    except Exception as e:
        logger.exception("PlantDoc acquisition failed")
        status.update({"status": "BLOCKED", "error": str(e)})
    return status


def acquire_ip102() -> dict:
    """
    Official source documents Google Drive / AliyunDrive for the actual images.
    GitHub repo only contains classes.txt and README — not the images.
    Attempt gdown of the official Drive folder.
    """
    dest = RAW / "ip102"
    status = {
        "dataset": "ip102",
        "source": "https://github.com/xpwu95/IP102",
        "official_data_host": "https://drive.google.com/drive/folders/1svFSy2Da3cVMvekBwe13mzyx38XZ9xWo",
        "method": "git clone metadata + gdown Drive folder",
        "destination": str(dest),
        "status": "PENDING",
        "license_note": "Free for academic usage. Contact author for other purposes.",
    }
    dest.mkdir(parents=True, exist_ok=True)
    try:
        # Clone metadata repo
        meta_dir = ARCHIVES / "IP102-meta"
        if not (meta_dir / ".git").exists():
            subprocess.run(
                [
                    "git",
                    "clone",
                    "--depth",
                    "1",
                    "https://github.com/xpwu95/IP102.git",
                    str(meta_dir),
                ],
                check=True,
            )
        classes_src = meta_dir / "classes.txt"
        if classes_src.exists():
            shutil.copy2(classes_src, dest / "classes.txt")

        # Attempt Drive download
        drive_folder = "https://drive.google.com/drive/folders/1svFSy2Da3cVMvekBwe13mzyx38XZ9xWo"
        gdrive_dest = ARCHIVES / "ip102_gdrive"
        gdrive_dest.mkdir(parents=True, exist_ok=True)
        logger.info("Attempting gdown of IP102 Drive folder (may fail due to quota/auth)...")
        try:
            import gdown

            gdown.download_folder(drive_folder, output=str(gdrive_dest), quiet=False, use_cookies=False)
            # Move contents into raw/ip102
            for item in gdrive_dest.iterdir():
                target = dest / item.name
                if item.is_dir():
                    if target.exists():
                        shutil.rmtree(target)
                    shutil.copytree(item, target)
                else:
                    shutil.copy2(item, target)
        except Exception as ge:
            status["gdown_error"] = str(ge)
            logger.warning("IP102 Drive download failed: %s", ge)

        n = count_images(dest)
        classes = []
        if (dest / "classes.txt").exists():
            classes = [
                line.strip()
                for line in (dest / "classes.txt").read_text(encoding="utf-8").splitlines()
                if line.strip()
            ]

        if n > 1000:
            status["status"] = "ACQUIRED"
        elif n > 0:
            status["status"] = "PARTIALLY_ACQUIRED"
        else:
            status["status"] = "BLOCKED"
            status["manual_action"] = (
                "1. Open https://drive.google.com/drive/folders/1svFSy2Da3cVMvekBwe13mzyx38XZ9xWo\n"
                "2. Download the full IP102 v1.1 archive(s)\n"
                "3. Extract into data/raw/ip102/\n"
                "4. Re-run: python scripts/prepare_dataset.py ip102 --summary\n"
                "Alt: AliyunDrive https://www.aliyundrive.com/s/c5G9scSGyak"
            )

        status.update(
            {
                "images": n,
                "classes": classes,
                "class_count": len(classes),
                "size_bytes": dir_size_bytes(dest),
                "size_mb": round(dir_size_bytes(dest) / 1e6, 1),
            }
        )
        with open(dest / "acquisition_meta.json", "w", encoding="utf-8") as f:
            json.dump(status, f, indent=2)
    except Exception as e:
        logger.exception("IP102 acquisition failed")
        status.update({"status": "BLOCKED", "error": str(e)})
    return status


def acquire_mendeley(dataset_key: str, doi: str, dest: Path, page_url: str) -> dict:
    """
    Attempt Mendeley Data API download.
    Many Mendeley datasets require browser acceptance — mark BLOCKED if so.
    """
    status = {
        "dataset": dataset_key,
        "source": page_url,
        "doi": doi,
        "method": "mendeley_data_api_attempt",
        "destination": str(dest),
        "status": "PENDING",
    }
    dest.mkdir(parents=True, exist_ok=True)
    try:
        import urllib.request

        # Mendeley Data API: https://data.mendeley.com/public-api/datasets/{id}/files
        # DOI format 10.17632/{id}.{version}
        dataset_id = doi.split("/")[-1].split(".")[0]
        api = f"https://data.mendeley.com/public-api/datasets/{dataset_id}/files"
        logger.info("Querying Mendeley API: %s", api)
        req = urllib.request.Request(api, headers={"User-Agent": "AgriEdgeRover/0.1"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            files = json.loads(resp.read().decode("utf-8"))

        status["api_files"] = [
            {"filename": f.get("filename"), "size": f.get("size"), "id": f.get("id")}
            for f in (files if isinstance(files, list) else files.get("data", files) or [])
        ]

        downloaded = 0
        file_list = files if isinstance(files, list) else files.get("data", [])
        for fmeta in file_list:
            fid = fmeta.get("id")
            fname = fmeta.get("filename") or f"file_{fid}"
            # Common download endpoint pattern
            dl_url = f"https://data.mendeley.com/public-api/datasets/{dataset_id}/files/{fid}?source=4"
            out = ARCHIVES / f"{dataset_key}_{fname}"
            logger.info("Downloading %s ...", fname)
            try:
                urllib.request.urlretrieve(dl_url, out)
                downloaded += 1
                # Extract if zip
                if out.suffix.lower() == ".zip":
                    import zipfile

                    with zipfile.ZipFile(out, "r") as zf:
                        zf.extractall(dest)
                else:
                    shutil.copy2(out, dest / fname)
            except Exception as de:
                logger.warning("Failed to download %s: %s", fname, de)
                status.setdefault("download_errors", []).append(f"{fname}: {de}")

        n = count_images(dest)
        if n > 0:
            status["status"] = "ACQUIRED"
        elif downloaded > 0:
            status["status"] = "PARTIALLY_ACQUIRED"
            status["note"] = "Files downloaded but no images found yet — may need manual extract"
        else:
            status["status"] = "PENDING_MANUAL_DOWNLOAD"
            status["manual_action"] = (
                f"1. Open {page_url}\n"
                f"2. Accept license / Download All\n"
                f"3. Extract archives into {dest}\n"
                f"4. Re-run preparation scripts"
            )
        status["images"] = n
        status["size_mb"] = round(dir_size_bytes(dest) / 1e6, 1)
        with open(dest / "acquisition_meta.json", "w", encoding="utf-8") as f:
            json.dump(status, f, indent=2)
    except Exception as e:
        logger.exception("%s Mendeley acquisition failed", dataset_key)
        status.update(
            {
                "status": "PENDING_MANUAL_DOWNLOAD",
                "error": str(e),
                "manual_action": (
                    f"1. Open {page_url}\n"
                    f"2. Click Download All (may require Mendeley account / accept terms)\n"
                    f"3. Extract into {dest}\n"
                    f"4. Re-run: python scripts/prepare_dataset.py {dataset_key} --summary"
                ),
            }
        )
    return status


def setup_own_field() -> dict:
    own = REPO_ROOT / "data" / "own"
    for sub in ["images", "annotations", "metadata", "raw", "processed"]:
        (own / sub).mkdir(parents=True, exist_ok=True)
    readme = own / "README.md"
    content = """# AgriEdge Own Field / Rover Dataset

This dataset does **not** exist yet. It will be collected using the physical AgriEdge Rover.

## Structure

```
data/own/
  images/         # Rover camera captures
  annotations/    # Human / field labels
  metadata/       # zone, timestamp, sensor links
  raw/            # Unprocessed field dumps
  processed/      # Prepared samples for fine-tuning
```

Do not place fabricated images here.
"""
    readme.write_text(content, encoding="utf-8")
    return {
        "dataset": "own_field",
        "status": "STRUCTURE_ONLY",
        "images": 0,
        "note": "No external source. Structure created. Collection pending hardware deployment.",
        "destination": str(own),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--only",
        nargs="*",
        choices=["plantvillage", "plantdoc", "ip102", "maize_nutrient", "maize_nitrogen", "own"],
        help="Acquire only these datasets",
    )
    args = parser.parse_args()
    ensure_dirs()
    targets = args.only or ["plantvillage", "plantdoc", "ip102", "maize_nutrient", "maize_nitrogen", "own"]

    results = []
    if "plantvillage" in targets:
        results.append(acquire_plantvillage())
    if "plantdoc" in targets:
        results.append(acquire_plantdoc())
    if "ip102" in targets:
        results.append(acquire_ip102())
    if "maize_nutrient" in targets:
        results.append(
            acquire_mendeley(
                "maize_nutrient",
                "10.17632/34gb2gr7p2.1",
                RAW / "maize_nutrient",
                "https://data.mendeley.com/datasets/34gb2gr7p2/1",
            )
        )
    if "maize_nitrogen" in targets:
        results.append(
            acquire_mendeley(
                "maize_nitrogen",
                "10.17632/g7xnn2bm4g.1",
                RAW / "maize_nitrogen",
                "https://data.mendeley.com/datasets/g7xnn2bm4g/1",
            )
        )
    if "own" in targets:
        results.append(setup_own_field())

    STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(STATUS_PATH, "w", encoding="utf-8") as f:
        json.dump({"acquired_at": datetime.now(timezone.utc).isoformat(), "results": results}, f, indent=2)

    print(json.dumps(results, indent=2))
    print(f"\nLog written to {STATUS_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
