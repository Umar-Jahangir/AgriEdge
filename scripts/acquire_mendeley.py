#!/usr/bin/env python3
"""Attempt Mendeley Data acquisition for maize nutrient and nitrogen datasets."""

from __future__ import annotations

import json
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen, urlretrieve

REPO = Path(__file__).resolve().parents[1]
ARCHIVES = REPO / "data" / "external" / "archives"

DATASETS = [
    {
        "key": "maize_nutrient",
        "id": "34gb2gr7p2",
        "version": "1",
        "doi": "10.17632/34gb2gr7p2.1",
        "page": "https://data.mendeley.com/datasets/34gb2gr7p2/1",
        "dest": REPO / "data" / "raw" / "maize_nutrient",
    },
    {
        "key": "maize_nitrogen",
        "id": "g7xnn2bm4g",
        "version": "1",
        "doi": "10.17632/g7xnn2bm4g.1",
        "page": "https://data.mendeley.com/datasets/g7xnn2bm4g/1",
        "dest": REPO / "data" / "raw" / "maize_nitrogen",
    },
]


def count_images(path: Path) -> int:
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    return sum(1 for p in path.rglob("*") if p.is_file() and p.suffix.lower() in exts)


def try_api(ds_id: str, version: str) -> list[dict]:
    urls = [
        f"https://data.mendeley.com/public-api/datasets/{ds_id}/versions/{version}/files",
        f"https://data.mendeley.com/public-api/datasets/{ds_id}/files",
    ]
    for u in urls:
        try:
            req = Request(u, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
            with urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode())
            if isinstance(data, list):
                return data
            if isinstance(data, dict) and "data" in data:
                return data["data"]
            print(f"Unexpected API response from {u}: {str(data)[:200]}")
        except Exception as e:
            print(f"API fail {u}: {e}")
    return []


def try_s3_zip_candidates(ds_id: str, version: str, out: Path) -> bool:
    """
    Mendeley often hosts zip caches on S3 with a known pattern.
    We only try documented public patterns; if 404, we do not invent success.
    """
    candidates = [
        f"https://prod-dcd-datasets-cache-zipfiles.s3.eu-west-1.amazonaws.com/{ds_id}-{version}.zip",
        f"https://prod-dcd-datasets-cache-zipfiles.s3.eu-west-1.amazonaws.com/{ds_id}.zip",
    ]
    for url in candidates:
        try:
            req = Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
            with urlopen(req, timeout=30) as resp:
                if resp.status == 200:
                    print(f"Found S3 zip: {url}")
                    urlretrieve(url, out)
                    return True
        except Exception as e:
            print(f"S3 candidate miss {url}: {e}")
    return False


def acquire_one(cfg: dict) -> dict:
    ARCHIVES.mkdir(parents=True, exist_ok=True)
    dest: Path = cfg["dest"]
    dest.mkdir(parents=True, exist_ok=True)

    result = {
        "dataset": cfg["key"],
        "source": cfg["page"],
        "doi": cfg["doi"],
        "destination": str(dest),
        "status": "PENDING_MANUAL_DOWNLOAD",
        "acquired_at": datetime.now(timezone.utc).isoformat(),
    }

    files = try_api(cfg["id"], cfg["version"])
    result["api_files"] = [
        {"filename": f.get("filename"), "size": f.get("size"), "id": f.get("id")} for f in files
    ]

    downloaded = 0
    for fmeta in files:
        fid = fmeta.get("id")
        fname = fmeta.get("filename") or f"file_{fid}"
        dl_urls = [
            f"https://data.mendeley.com/public-api/datasets/{cfg['id']}/files/{fid}",
            f"https://data.mendeley.com/public-api/datasets/{cfg['id']}/files/{fid}?source=4",
            f"https://data.mendeley.com/public-api/datasets/{cfg['id']}/versions/{cfg['version']}/files/{fid}",
        ]
        out = ARCHIVES / f"{cfg['key']}_{fname}"
        for dl in dl_urls:
            try:
                print(f"Downloading {fname} via {dl}")
                urlretrieve(dl, out)
                downloaded += 1
                if out.suffix.lower() == ".zip":
                    with zipfile.ZipFile(out, "r") as zf:
                        zf.extractall(dest)
                else:
                    (dest / fname).write_bytes(out.read_bytes())
                break
            except Exception as e:
                print(f"  fail: {e}")

    if downloaded == 0:
        zip_out = ARCHIVES / f"{cfg['key']}.zip"
        if try_s3_zip_candidates(cfg["id"], cfg["version"], zip_out):
            with zipfile.ZipFile(zip_out, "r") as zf:
                zf.extractall(dest)
            downloaded = 1

    n = count_images(dest)
    size = sum(p.stat().st_size for p in dest.rglob("*") if p.is_file())
    result["images"] = n
    result["size_bytes"] = size
    result["size_mb"] = round(size / 1e6, 1)

    if n > 0:
        result["status"] = "ACQUIRED"
    elif downloaded > 0:
        result["status"] = "PARTIALLY_ACQUIRED"
        result["note"] = "Archive downloaded but image count is 0 — inspect extraction structure"
    else:
        result["status"] = "PENDING_MANUAL_DOWNLOAD"
        result["manual_action"] = (
            f"1. Open {cfg['page']}\n"
            f"2. Accept license / sign in if prompted\n"
            f"3. Click Download All\n"
            f"4. Extract into {dest}\n"
            f"5. Re-run preparation: python scripts/prepare_dataset.py {cfg['key']} --summary\n"
            f"   (for nitrogen use prepare path maize_nitrogen / nitrogen_maize mapping)"
        )

    with open(dest / "acquisition_meta.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    return result


def main() -> int:
    results = [acquire_one(cfg) for cfg in DATASETS]
    print(json.dumps(results, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
