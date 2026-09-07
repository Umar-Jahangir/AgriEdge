"""Checkpoint -> ONNX (fp32) -> static int8 ONNX, with a CPU latency benchmark."""
import argparse, json, os, random, sys, time
from pathlib import Path

import numpy as np
import onnx
import torch

sys.path.insert(0, os.path.dirname(__file__))
from data import PlantDataset, load_manifest
from labels import CLASSES, pretty

ROOT = Path(__file__).resolve().parent.parent


class Calib:
    """Feeds ~N preprocessed training images (all sources) to the static quantizer."""

    def __init__(self, input_name, img_size, n):
        rows = load_manifest("train")
        by_src = {}
        for r in rows:
            by_src.setdefault(r["source"], []).append(r)
        rng = random.Random(0)
        picked = []
        for src, rs in by_src.items():
            picked += rng.sample(rs, min(len(rs), n // len(by_src)))
        self.ds = PlantDataset(picked, img_size, train=False)
        self.input_name, self.i = input_name, 0

    def get_next(self):
        if self.i >= len(self.ds):
            return None
        x, _ = self.ds[self.i]
        self.i += 1
        return {self.input_name: x.unsqueeze(0).numpy()}


def bench(path, threads, n=50):
    import onnxruntime as ort
    so = ort.SessionOptions()
    so.intra_op_num_threads = threads
    sess = ort.InferenceSession(path, so, providers=["CPUExecutionProvider"])
    name = sess.get_inputs()[0].name
    x = np.random.rand(1, 3, 224, 224).astype(np.float32)
    for _ in range(10):
        sess.run(None, {name: x})
    t = time.perf_counter()
    for _ in range(n):
        sess.run(None, {name: x})
    return (time.perf_counter() - t) / n * 1000


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ckpt", required=True)
    ap.add_argument("--out-dir", default=None)
    ap.add_argument("--calib-n", type=int, default=300)
    ap.add_argument("--calib-method", default="percentile", choices=["minmax", "entropy", "percentile"])
    args = ap.parse_args()
    import timm
    from onnxruntime.quantization import CalibrationMethod, QuantFormat, QuantType, quantize_static
    from onnxruntime.quantization.shape_inference import quant_pre_process

    ck = torch.load(args.ckpt, map_location="cpu", weights_only=False)
    img_size = ck["img_size"]
    out_dir = Path(args.out_dir or Path(args.ckpt).parent / "export")
    out_dir.mkdir(parents=True, exist_ok=True)
    model = timm.create_model(ck["model"], num_classes=len(CLASSES), exportable=True)
    model.load_state_dict(ck["state_dict"])
    model.eval()

    fp32 = out_dir / "model_fp32.onnx"
    torch.onnx.export(model, torch.zeros(1, 3, img_size, img_size), str(fp32), input_names=["input"], output_names=["logits"],
                      opset_version=17, dynamo=False, do_constant_folding=True)
    try:
        import onnxslim
        onnx.save(onnxslim.slim(onnx.load(str(fp32))), str(fp32))
    except Exception as e:  # noqa: BLE001
        print("onnxslim skipped:", e)
    m = onnx.load(str(fp32))
    m.metadata_props.add(key="classes", value=json.dumps(CLASSES))
    m.metadata_props.add(key="preprocess", value=f"resize short side to {int(img_size * 1.14)}, center crop {img_size}, RGB/255, imagenet mean/std")
    onnx.save(m, str(fp32))

    pre = out_dir / "model_fp32_pre.onnx"
    quant_pre_process(str(fp32), str(pre))
    int8 = out_dir / "model_int8.onnx"
    quantize_static(str(pre), str(int8), Calib("input", img_size, args.calib_n), quant_format=QuantFormat.QDQ,
                    activation_type=QuantType.QUInt8, weight_type=QuantType.QInt8, per_channel=True,
                    calibrate_method={"minmax": CalibrationMethod.MinMax, "entropy": CalibrationMethod.Entropy, "percentile": CalibrationMethod.Percentile}[args.calib_method])
    pre.unlink()

    labels = [dict(id=i, name=c, pretty=pretty(c)) for i, c in enumerate(CLASSES)]
    json.dump(dict(img_size=img_size, mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225], classes=labels), open(out_dir / "labels.json", "w"), indent=1)

    # parity check on a few real images
    import onnxruntime as ort
    ds = PlantDataset(load_manifest("val")[:64], img_size, train=False)
    xs = torch.stack([ds[i][0] for i in range(len(ds))])
    with torch.no_grad():
        ref = model(xs).argmax(1).numpy()
    for p in (fp32, int8):
        sess = ort.InferenceSession(str(p), providers=["CPUExecutionProvider"])
        pred = np.array([sess.run(None, {"input": x[None].numpy()})[0].argmax() for x in xs])
        print(f"{p.name}: {os.path.getsize(p) / 1e6:.2f} MB, agrees with PyTorch on {(pred == ref).mean() * 100:.1f}% of 64 val images")
    print("\nCPU latency here (x86, proxy only — a Pi 4 is ~10-20x slower):")
    for p in (fp32, int8):
        print(f"  {p.name}: 1 thread {bench(str(p), 1):.1f} ms, 4 threads {bench(str(p), 4):.1f} ms")


if __name__ == "__main__":
    main()
