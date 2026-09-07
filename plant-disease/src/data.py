"""Datasets, augmentation, and leaf-on-field-background compositing."""
import csv, random
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageFilter
from torch.utils.data import Dataset
from torchvision import transforms as T

ROOT = Path(__file__).resolve().parent.parent
MEAN, STD = (0.485, 0.456, 0.406), (0.229, 0.224, 0.225)

# how many times each source is repeated per epoch; field imagery is tiny next to PlantVillage
REPEAT = {"plantvillage": 1, "plantdoc": 8, "maize_nutrient": 10, "maize_canopy": 2}


def load_manifest(split=None, sources=None):
    rows = list(csv.DictReader(open(ROOT / "data/manifest.csv")))
    for r in rows:
        r["label_idx"] = int(r["label_idx"])
    if split:
        rows = [r for r in rows if r["split"] == split]
    if sources:
        rows = [r for r in rows if r["source"] in sources]
    return rows


class BackgroundPool:
    def __init__(self, bg_dir=ROOT / "data/backgrounds"):
        self.files = sorted(bg_dir.glob("*.jpg"))

    def _img(self, i):
        # decoded fresh each time: a per-worker cache multiplies across workers and gets OOM-killed
        return Image.open(self.files[i]).convert("RGB")

    def sample(self, size, rng):
        if self.files and rng.random() < 0.8:
            im = self._img(rng.randrange(len(self.files)))
            w, h = im.size
            s = rng.randint(min(w, h) // 3, min(w, h))
            x, y = rng.randint(0, w - s), rng.randint(0, h - s)
            bg = im.crop((x, y, x + s, y + s)).resize((size, size), Image.BILINEAR)
            if rng.random() < 0.5:
                bg = bg.transpose(Image.FLIP_LEFT_RIGHT)
            return bg
        # synthetic fallback: flat colour, gradient, or noise
        kind = rng.random()
        if kind < 0.5:
            return Image.new("RGB", (size, size), tuple(rng.randint(20, 235) for _ in range(3)))
        arr = np.random.default_rng(rng.getrandbits(32)).integers(0, 255, (size, size, 3), dtype=np.uint8)
        if kind < 0.9:
            arr = np.asarray(Image.fromarray(arr).filter(ImageFilter.GaussianBlur(size // 8)))
        return Image.fromarray(arr)


def composite(seg: Image.Image, bg_pool: BackgroundPool, rng: random.Random, size=256) -> Image.Image:
    """Paste a black-background segmented leaf onto a random field background."""
    seg = seg.convert("RGB")
    arr = np.asarray(seg)
    mask = (arr.max(axis=2) > 18).astype(np.uint8) * 255
    mask = Image.fromarray(mask).filter(ImageFilter.GaussianBlur(1.0))
    scale = rng.uniform(0.6, 1.0)
    s = int(size * scale)
    leaf = seg.resize((s, s), Image.BILINEAR)
    mask = mask.resize((s, s), Image.BILINEAR)
    canvas = bg_pool.sample(size, rng)
    x, y = rng.randint(0, size - s), rng.randint(0, size - s)
    canvas.paste(leaf, (x, y), mask)
    return canvas


def train_transform(img_size):
    return T.Compose([
        T.RandomResizedCrop(img_size, scale=(0.35, 1.0), ratio=(0.75, 1.33)),
        T.RandomHorizontalFlip(),
        T.RandomVerticalFlip(),
        T.RandomApply([T.RandomRotation(30)], p=0.5),
        T.ColorJitter(0.4, 0.4, 0.4, 0.08),
        T.RandomGrayscale(0.05),
        T.RandomApply([T.GaussianBlur(5, (0.1, 2.0))], p=0.2),
        T.ToTensor(),
        T.Normalize(MEAN, STD),
        T.RandomErasing(p=0.25, scale=(0.02, 0.15)),
    ])


def eval_transform(img_size):
    return T.Compose([
        T.Resize(int(img_size * 1.14)),
        T.CenterCrop(img_size),
        T.ToTensor(),
        T.Normalize(MEAN, STD),
    ])


class PlantDataset(Dataset):
    def __init__(self, rows, img_size, train, composite_p=0.5):
        self.rows = rows
        self.train = train
        self.composite_p = composite_p
        self.tf = train_transform(img_size) if train else eval_transform(img_size)
        self.bg = BackgroundPool() if train else None
        self.index = [i for i, r in enumerate(rows) for _ in range(REPEAT.get(r["source"], 1))] if train else list(range(len(rows)))

    def __len__(self):
        return len(self.index)

    def __getitem__(self, i):
        r = self.rows[self.index[i]]
        rng = random.Random()
        if self.train and r["seg_cache"] and rng.random() < self.composite_p:
            img = composite(Image.open(r["seg_cache"]), self.bg, rng)
        else:
            img = Image.open(r["cache"]).convert("RGB")
        return self.tf(img), r["label_idx"]
