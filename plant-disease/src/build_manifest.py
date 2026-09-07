"""Scan raw datasets -> data/manifest.csv + resized image cache + background pool."""
import argparse, csv, json, os, random, sys
from collections import Counter, defaultdict
from multiprocessing import Pool
from pathlib import Path

from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from labels import CLASS_TO_IDX, MAIZE_CANOPY_TO_CLASS, MAIZE_NUTRIENT_TO_CLASS, PLANTDOC_TO_CLASS

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "raw"
DATA = ROOT / "data"
CACHE = DATA / "cache"
BG = DATA / "backgrounds"
MAX_SIDE = 320
BG_SIDE = 512
IMG_EXT = {".jpg", ".jpeg", ".png"}


def leaf_key(path: str) -> str:
    stem = Path(path).stem
    return stem.split("___", 1)[1].lower() if "___" in stem else stem.lower()


def plantvillage(rng):
    leaf_map = json.load(open(RAW / "pv_meta/leaf-map.json"))
    rows = []
    for split in ("train", "test"):
        for line in open(RAW / f"pv_meta/color_{split}.txt"):
            rel = line.strip()
            if not rel:
                continue
            cls = rel.split("/")[2]
            color = RAW / "pv" / rel
            seg = RAW / "pv" / rel.replace("raw/color/", "raw/segmented/")
            seg = seg.with_name(seg.stem + "_final_masked.jpg")
            groups = leaf_map.get(leaf_key(rel))
            group = f"pv:{groups[0]}" if groups else f"pv:single:{Path(rel).stem}"
            rows.append(dict(source="plantvillage", split=split, path=str(color),
                             seg_path=str(seg) if seg.exists() else "", label=cls, group=group))
    # val: 5% of train leaf groups, so no leaf straddles train/val
    groups = sorted({r["group"] for r in rows if r["split"] == "train"})
    rng.shuffle(groups)
    val_groups = set(groups[: int(0.05 * len(groups))])
    for r in rows:
        if r["split"] == "train" and r["group"] in val_groups:
            r["split"] = "val"
    return rows


def plantdoc(rng):
    base = RAW / "plantdoc/PlantDoc-Dataset-master"
    rows = []
    for split in ("train", "test"):
        for d in sorted((base / split).iterdir()):
            cls = PLANTDOC_TO_CLASS[d.name]
            for f in sorted(d.iterdir()):
                if f.suffix.lower() in IMG_EXT:
                    rows.append(dict(source="plantdoc", split=split, path=str(f), seg_path="",
                                     label=cls, group=f"pd:{f.stem}"))
    train = [r for r in rows if r["split"] == "train"]
    rng.shuffle(train)
    for r in train[: int(0.10 * len(train))]:
        r["split"] = "val"
    return rows


def folder_dataset(base, mapping, source, rng, key_fn):
    rows = []
    for f in sorted(base.rglob("*")):
        if f.suffix.lower() not in IMG_EXT:
            continue
        cls = mapping.get(key_fn(f))
        if cls:
            rows.append(dict(source=source, split="", path=str(f), seg_path="", label=cls, group=f"{source}:{f.stem}"))
    # stratified 80/10/10; no leaf ids exist for these, so near-duplicates may straddle splits
    by_cls = defaultdict(list)
    for r in rows:
        by_cls[r["label"]].append(r)
    for rs in by_cls.values():
        rng.shuffle(rs)
        n = len(rs)
        for i, r in enumerate(rs):
            r["split"] = "test" if i < int(0.10 * n) else "val" if i < int(0.20 * n) else "train"
    return rows


def resize_one(args):
    src, dst, max_side = args
    if os.path.exists(dst):
        return True
    try:
        im = Image.open(src)
        im.draft("RGB", (max_side * 2, max_side * 2))  # cheap JPEG downscale on decode
        im = im.convert("RGB")
        if max(im.size) > max_side:
            im.thumbnail((max_side, max_side), Image.LANCZOS)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        im.save(dst, "JPEG", quality=92)
        return True
    except Exception as e:  # noqa: BLE001
        print("BAD", src, e, flush=True)
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--include-canopy", action="store_true", help="add N0/NFull canopy plots as labeled samples")
    ap.add_argument("--workers", type=int, default=64)
    args = ap.parse_args()
    rng = random.Random(42)

    rows = plantvillage(rng) + plantdoc(rng)
    rows += folder_dataset(RAW / "maize_nutrient", MAIZE_NUTRIENT_TO_CLASS, "maize_nutrient", rng, lambda f: f.parent.name)
    if args.include_canopy:
        rows += folder_dataset(RAW / "maize_n", MAIZE_CANOPY_TO_CLASS, "maize_canopy", rng, lambda f: f.name.split(" ")[0])

    jobs = []
    for i, r in enumerate(rows):
        r["id"] = i
        r["label_idx"] = CLASS_TO_IDX[r["label"]]
        r["cache"] = str(CACHE / r["source"] / f"{i}.jpg")
        jobs.append((r["path"], r["cache"], MAX_SIDE))
        if r["seg_path"] and r["split"] != "test":
            r["seg_cache"] = str(CACHE / r["source"] / f"{i}_seg.jpg")
            jobs.append((r["seg_path"], r["seg_cache"], MAX_SIDE))
        else:
            r["seg_cache"] = ""
    # canopy plots double as a pool of real field backgrounds for compositing
    bg_jobs = [(str(f), str(BG / f"{f.stem.replace(' ', '_')}.jpg"), BG_SIDE) for f in sorted((RAW / "maize_n").glob("*.JPG"))]

    print(f"resizing {len(jobs)} images + {len(bg_jobs)} backgrounds with {args.workers} workers", flush=True)
    with Pool(args.workers) as pool:
        ok = pool.map(resize_one, jobs + bg_jobs, chunksize=64)
    print("failed:", ok.count(False))

    DATA.mkdir(exist_ok=True)
    cols = ["id", "source", "split", "label", "label_idx", "group", "path", "cache", "seg_cache"]
    with open(DATA / "manifest.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)

    print("\nrows per source/split:")
    c = Counter((r["source"], r["split"]) for r in rows)
    for k in sorted(c):
        print(f"  {k[0]:16s} {k[1]:6s} {c[k]:6d}")
    print("seg available (train+val pv):", sum(1 for r in rows if r["seg_cache"]))
    print("classes used:", len({r["label"] for r in rows}))


if __name__ == "__main__":
    main()
