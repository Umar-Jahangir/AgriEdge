#!/usr/bin/env python3
"""Plant disease classifier for Raspberry Pi 4: Picamera2 -> ONNX Runtime.

    python3 predict.py                    # continuous: capture + classify every 2s
    python3 predict.py --once             # single capture
    python3 predict.py --image leaf.jpg   # classify a file instead of the camera
"""
import argparse, json, time
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

HERE = Path(__file__).resolve().parent


def load(model_path, labels_path, threads):
    meta = json.load(open(labels_path))
    so = ort.SessionOptions()
    so.intra_op_num_threads = threads
    so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    sess = ort.InferenceSession(str(model_path), so, providers=["CPUExecutionProvider"])
    return sess, meta


def preprocess(img: Image.Image, meta) -> np.ndarray:
    size = meta["img_size"]
    img = img.convert("RGB")
    w, h = img.size
    s = int(size * 1.14) / min(w, h)
    img = img.resize((max(size, round(w * s)), max(size, round(h * s))), Image.BILINEAR)
    w, h = img.size
    l, t = (w - size) // 2, (h - size) // 2
    img = img.crop((l, t, l + size, t + size))
    x = np.asarray(img, dtype=np.float32) / 255.0
    x = (x - np.array(meta["mean"], dtype=np.float32)) / np.array(meta["std"], dtype=np.float32)
    return x.transpose(2, 0, 1)[None].astype(np.float32)


def classify(sess, meta, img, topk=3):
    x = preprocess(img, meta)
    t = time.perf_counter()
    logits = sess.run(None, {sess.get_inputs()[0].name: x})[0][0]
    ms = (time.perf_counter() - t) * 1000
    p = np.exp(logits - logits.max())
    p /= p.sum()
    idx = np.argsort(-p)[:topk]
    return [(meta["classes"][i]["pretty"], float(p[i])) for i in idx], ms


def show(preds, ms):
    print(f"[{ms:6.1f} ms]  " + "  |  ".join(f"{n} {p * 100:.0f}%" for n, p in preds), flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=HERE / "model_fp32.onnx")
    ap.add_argument("--labels", default=HERE / "labels.json")
    ap.add_argument("--image", help="classify an image file instead of using the camera")
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--interval", type=float, default=2.0, help="seconds between captures")
    ap.add_argument("--threads", type=int, default=4)
    ap.add_argument("--save-dir", help="also save each capture as a JPEG here")
    args = ap.parse_args()
    sess, meta = load(args.model, args.labels, args.threads)

    if args.image:
        show(*classify(sess, meta, Image.open(args.image)))
        return

    from picamera2 import Picamera2
    cam = Picamera2()
    # libcamera's "BGR888" yields an [R, G, B] numpy array (the naming is inverted vs. what you'd expect)
    cam.configure(cam.create_still_configuration(main={"size": (1024, 768), "format": "BGR888"}))
    cam.start()
    time.sleep(1.0)  # let AE/AWB settle
    try:
        while True:
            frame = cam.capture_array()
            img = Image.fromarray(frame)
            preds, ms = classify(sess, meta, img)
            show(preds, ms)
            if args.save_dir:
                Path(args.save_dir).mkdir(parents=True, exist_ok=True)
                img.save(Path(args.save_dir) / f"{time.strftime('%Y%m%d-%H%M%S')}.jpg", quality=90)
            if args.once:
                break
            time.sleep(args.interval)
    finally:
        cam.stop()


if __name__ == "__main__":
    main()
