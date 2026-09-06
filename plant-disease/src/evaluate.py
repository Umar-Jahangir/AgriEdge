"""Evaluate a checkpoint (or ONNX model) on every test split, per source."""
import argparse, json, os, sys
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader

sys.path.insert(0, os.path.dirname(__file__))
from data import PlantDataset, load_manifest
from labels import CLASSES, pretty

ROOT = Path(__file__).resolve().parent.parent
SOURCE_NOTE = {"plantvillage": "lab (single leaf, plain background)", "plantdoc": "field (in-the-wild web photos)",
               "maize_nutrient": "field (smartphone, nutrient deficiency)"}


def predict_torch(ckpt_path, rows, img_size, device="cuda"):
    import timm
    ck = torch.load(ckpt_path, map_location="cpu", weights_only=False)
    model = timm.create_model(ck["model"], num_classes=len(CLASSES))
    model.load_state_dict(ck["state_dict"])
    model = model.to(device).eval()
    dl = DataLoader(PlantDataset(rows, img_size, train=False), 256, num_workers=16)
    out = []
    with torch.no_grad():
        for x, _ in dl:
            out.append(model(x.to(device)).float().cpu().numpy())
    return np.concatenate(out)


def predict_onnx(onnx_path, rows, img_size, threads=8):
    import onnxruntime as ort
    so = ort.SessionOptions()
    so.intra_op_num_threads = threads
    sess = ort.InferenceSession(onnx_path, so, providers=["CPUExecutionProvider"])
    name = sess.get_inputs()[0].name
    ds = PlantDataset(rows, img_size, train=False)
    dl = DataLoader(ds, 1, num_workers=8)
    return np.concatenate([sess.run(None, {name: x.numpy()})[0] for x, _ in dl])


def report(logits, rows, label):
    y = np.array([r["label_idx"] for r in rows])
    top1 = logits.argmax(1)
    top3 = np.argsort(-logits, axis=1)[:, :3]
    src = np.array([r["source"] for r in rows])
    res = {}
    print(f"\n=== {label} ===")
    print(f"{'source':16s} {'n':>6s} {'top-1':>7s} {'top-3':>7s}  domain")
    for s in sorted(set(src)):
        m = src == s
        r = dict(n=int(m.sum()), top1=float((top1[m] == y[m]).mean()), top3=float((top3[m] == y[m, None]).any(1).mean()))
        res[s] = r
        print(f"{s:16s} {r['n']:6d} {r['top1']:7.4f} {r['top3']:7.4f}  {SOURCE_NOTE.get(s, '')}")
    res["all"] = dict(n=len(y), top1=float((top1 == y).mean()), top3=float((top3 == y[:, None]).any(1).mean()))
    print(f"{'all':16s} {len(y):6d} {res['all']['top1']:7.4f} {res['all']['top3']:7.4f}")

    # per-class recall on field sources, where the interesting failures are
    field = np.isin(src, ["plantdoc", "maize_nutrient"])
    per_class = {}
    for c in sorted(set(y[field].tolist())):
        m = field & (y == c)
        per_class[CLASSES[c]] = dict(n=int(m.sum()), recall=float((top1[m] == c).mean()))
    res["field_per_class"] = per_class
    worst = sorted(per_class.items(), key=lambda kv: kv[1]["recall"])[:8]
    print("\nweakest field classes:")
    for name, r in worst:
        print(f"  {pretty(name):45s} n={r['n']:3d} recall={r['recall']:.2f}")
    conf = Counter((CLASSES[a], CLASSES[b]) for a, b in zip(y[field], top1[field]) if a != b)
    res["field_top_confusions"] = [dict(true=a, pred=b, n=n) for (a, b), n in conf.most_common(8)]
    print("\ntop field confusions (true -> predicted):")
    for (a, b), n in conf.most_common(8):
        print(f"  {n:3d}  {pretty(a)} -> {pretty(b)}")
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ckpt", default=None)
    ap.add_argument("--onnx", nargs="*", default=[])
    ap.add_argument("--img-size", type=int, default=224)
    ap.add_argument("--out", default=None)
    args = ap.parse_args()
    rows = load_manifest("test")
    results = {}
    if args.ckpt:
        results["pytorch"] = report(predict_torch(args.ckpt, rows, args.img_size), rows, f"PyTorch {args.ckpt}")
    for p in args.onnx:
        results[Path(p).name] = report(predict_onnx(p, rows, args.img_size), rows, f"ONNX {p}")
    if args.out:
        json.dump(results, open(args.out, "w"), indent=1)


if __name__ == "__main__":
    main()
