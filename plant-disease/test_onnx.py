"""Plug-and-play tester: run ANY ONNX classifier in this repo on ANY image(s).

    uv run test_onnx.py --list                                   # show every .onnx found under plant-disease/
    uv run test_onnx.py -i leaf.jpg                              # default model: pi/model_fp32.onnx
    uv run test_onnx.py -m pi/small/model_int8.onnx -i leaf.jpg  # swap the model
    uv run test_onnx.py -m outputs/mobilenetv3_large_100/export/model_int8.onnx -i photos/   # a whole folder
    uv run test_onnx.py -m a.onnx -m b.onnx -i leaf.jpg          # compare several models on the same image
    uv run test_onnx.py -i leaf.jpg --expect Tomato___Late_blight --json out.json --bench 50

Anything works as long as the model takes an NCHW float image and returns logits. Labels are resolved from
(1) --labels, (2) labels.json next to the model, (3) the "classes" metadata baked into the ONNX by src/export.py,
(4) plain class indices. Input size is read from the model; dynamic dims fall back to labels.json / --size.
Plain `python3 test_onnx.py` also works if onnxruntime, numpy and pillow are installed.
"""
import argparse, json, sys, time
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

HERE = Path(__file__).resolve().parent
IMG_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}
IMAGENET_MEAN, IMAGENET_STD = [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]


# --------------------------------------------------------------------------- resolution helpers
def find_models(root=HERE):
    return sorted(p for p in root.rglob("*.onnx") if ".venv" not in p.parts)


def resolve_model(spec):
    """Accept a path, or a bare filename / substring that matches exactly one .onnx under the repo."""
    p = Path(spec)
    if p.is_file():
        return p.resolve()
    if (HERE / spec).is_file():
        return (HERE / spec).resolve()
    hits = [m for m in find_models() if spec in str(m.relative_to(HERE))]
    if len(hits) == 1:
        return hits[0]
    if not hits:
        sys.exit(f"model not found: {spec}  (try --list)")
    sys.exit(f"ambiguous model '{spec}', matches:\n  " + "\n  ".join(str(h.relative_to(HERE)) for h in hits))


def load_labels(model_path, sess, labels_arg, size_arg):
    """Return dict(img_size, mean, std, names[list[str]], source)."""
    meta = None
    src = None
    if labels_arg:
        meta, src = json.load(open(labels_arg)), labels_arg
    elif (model_path.parent / "labels.json").is_file():
        meta, src = json.load(open(model_path.parent / "labels.json")), str(model_path.parent / "labels.json")
    if meta is not None:
        classes = meta.get("classes", [])
        names = [c["pretty"] if isinstance(c, dict) else str(c) for c in classes]
        raw = [c["name"] if isinstance(c, dict) else str(c) for c in classes]
        return dict(img_size=size_arg or meta.get("img_size", 224), mean=meta.get("mean", IMAGENET_MEAN),
                    std=meta.get("std", IMAGENET_STD), names=names, raw=raw, source=src)
    md = sess.get_modelmeta().custom_metadata_map
    if "classes" in md:
        raw = json.loads(md["classes"])
        return dict(img_size=size_arg or 224, mean=IMAGENET_MEAN, std=IMAGENET_STD, names=list(raw), raw=list(raw),
                    source="onnx metadata")
    return dict(img_size=size_arg or 224, mean=IMAGENET_MEAN, std=IMAGENET_STD, names=None, raw=None, source="none (indices)")


def collect_images(specs):
    out = []
    for s in specs:
        p = Path(s)
        if p.is_dir():
            out += sorted(q for q in p.rglob("*") if q.suffix.lower() in IMG_EXT)
        elif p.is_file():
            out.append(p)
        else:
            out += sorted(Path().glob(s))
    if not out:
        sys.exit("no images found for: " + ", ".join(specs))
    return out


# --------------------------------------------------------------------------- inference
def make_session(path, threads):
    so = ort.SessionOptions()
    so.intra_op_num_threads = threads
    so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    so.log_severity_level = 3
    return ort.InferenceSession(str(path), so, providers=["CPUExecutionProvider"])


def input_hw(sess, fallback):
    shape = sess.get_inputs()[0].shape  # e.g. [1, 3, 224, 224] or ['batch', 3, 'h', 'w']
    h = shape[2] if len(shape) == 4 and isinstance(shape[2], int) else fallback
    w = shape[3] if len(shape) == 4 and isinstance(shape[3], int) else fallback
    return h, w


def preprocess(img, h, w, mean, std, crop_pct=1.14):
    """Mirror pi/predict.py: scale short side to size*1.14, center crop, /255, normalize, NCHW."""
    img = img.convert("RGB")
    size = min(h, w)
    W, H = img.size
    s = int(size * crop_pct) / min(W, H)
    img = img.resize((max(w, round(W * s)), max(h, round(H * s))), Image.BILINEAR)
    W, H = img.size
    l, t = (W - w) // 2, (H - h) // 2
    img = img.crop((l, t, l + w, t + h))
    x = np.asarray(img, dtype=np.float32) / 255.0
    x = (x - np.array(mean, dtype=np.float32)) / np.array(std, dtype=np.float32)
    return x.transpose(2, 0, 1)[None].astype(np.float32)


def softmax(z):
    z = z.astype(np.float64)
    e = np.exp(z - z.max())
    return e / e.sum()


def run_one(sess, x, bench=0):
    name = sess.get_inputs()[0].name
    t = time.perf_counter()
    logits = sess.run(None, {name: x})[0].reshape(-1)
    ms = (time.perf_counter() - t) * 1000
    if bench:
        for _ in range(3):
            sess.run(None, {name: x})
        t = time.perf_counter()
        for _ in range(bench):
            sess.run(None, {name: x})
        ms = (time.perf_counter() - t) / bench * 1000
    return logits, ms


def label_of(lab, i):
    return lab["names"][i] if lab["names"] and i < len(lab["names"]) else f"class_{i}"


def matches_expect(lab, i, expect):
    e = expect.lower()
    cands = [str(i), label_of(lab, i).lower()]
    if lab["raw"] and i < len(lab["raw"]):
        cands.append(lab["raw"][i].lower())
    return any(e == c or e in c for c in cands)


# --------------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-m", "--model", action="append", help="path / unique substring of an .onnx (repeatable). default: pi/model_fp32.onnx")
    ap.add_argument("-i", "--image", action="append", help="image file, directory, or glob (repeatable)")
    ap.add_argument("--labels", help="labels.json to use instead of auto-detection")
    ap.add_argument("--size", type=int, help="input size if the model has dynamic H/W (default: labels.json or 224)")
    ap.add_argument("-k", "--topk", type=int, default=3)
    ap.add_argument("--threads", type=int, default=4)
    ap.add_argument("--bench", type=int, default=0, metavar="N", help="average latency over N extra runs per image")
    ap.add_argument("--expect", help="class index / raw name / pretty name expected for ALL given images -> prints accuracy")
    ap.add_argument("--json", metavar="FILE", help="also dump all results to this JSON file")
    ap.add_argument("--list", action="store_true", help="list every .onnx under plant-disease/ and exit")
    args = ap.parse_args()

    if args.list:
        for m in find_models():
            print(f"{m.stat().st_size / 1e6:6.2f} MB  {m.relative_to(HERE)}")
        return
    if not args.image:
        ap.error("-i/--image is required (or use --list)")

    models = [resolve_model(s) for s in (args.model or ["pi/model_fp32.onnx"])]
    images = collect_images(args.image)
    results = []

    for mp in models:
        sess = make_session(mp, args.threads)
        lab = load_labels(mp, sess, args.labels, args.size)
        h, w = input_hw(sess, lab["img_size"])
        n_out = sess.get_outputs()[0].shape
        print(f"\n=== {mp.relative_to(HERE) if HERE in mp.parents else mp}  ({mp.stat().st_size / 1e6:.2f} MB)")
        print(f"    input {sess.get_inputs()[0].name} {sess.get_inputs()[0].shape} -> using {h}x{w}   output {n_out}   labels: {lab['source']}")
        if lab["names"] and isinstance(n_out[-1], int) and n_out[-1] != len(lab["names"]):
            print(f"    WARNING: model has {n_out[-1]} outputs but labels file has {len(lab['names'])} classes")

        correct = 0
        for ip in images:
            try:
                img = Image.open(ip)
            except Exception as e:  # noqa: BLE001
                print(f"  {ip}: cannot open ({e})")
                continue
            x = preprocess(img, h, w, lab["mean"], lab["std"])
            logits, ms = run_one(sess, x, args.bench)
            p = softmax(logits)
            top = np.argsort(-p)[: args.topk]
            preds = [dict(index=int(i), label=label_of(lab, int(i)), prob=float(p[i])) for i in top]
            ok = None
            if args.expect:
                ok = matches_expect(lab, int(top[0]), args.expect)
                correct += ok
            flag = "" if ok is None else ("  ✓" if ok else "  ✗")
            print(f"  [{ms:6.1f} ms] {ip.name:<32} " + "  |  ".join(f"{d['label']} {d['prob'] * 100:.1f}%" for d in preds) + flag)
            results.append(dict(model=str(mp), image=str(ip), latency_ms=ms, top=preds, correct=ok))
        if args.expect:
            print(f"    top-1 accuracy vs '{args.expect}': {correct}/{len(images)} = {correct / len(images) * 100:.1f}%")

    if args.json:
        json.dump(results, open(args.json, "w"), indent=1)
        print(f"\nwrote {len(results)} results -> {args.json}")


if __name__ == "__main__":
    main()
