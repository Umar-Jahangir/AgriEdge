"""Compare static-int8 recipes for a checkpoint's fp32 ONNX on a test subset."""
import argparse, os, random, sys, time
from pathlib import Path

import numpy as np
import onnxruntime as ort
from onnxruntime.quantization import CalibrationMethod, QuantFormat, QuantType, quantize_static
from onnxruntime.quantization.shape_inference import quant_pre_process
from torch.utils.data import DataLoader

sys.path.insert(0, os.path.dirname(__file__))
from data import PlantDataset, load_manifest
from export import Calib, bench

RECIPES = {
    "all_percentile": dict(method=CalibrationMethod.Percentile, ops=None),
    "all_entropy": dict(method=CalibrationMethod.Entropy, ops=None),
    "conv_minmax": dict(method=CalibrationMethod.MinMax, ops=["Conv", "Gemm", "MatMul"]),
    "conv_percentile": dict(method=CalibrationMethod.Percentile, ops=["Conv", "Gemm", "MatMul"]),
    "conv_entropy": dict(method=CalibrationMethod.Entropy, ops=["Conv", "Gemm", "MatMul"]),
}


def subset(n_pv):
    rows = load_manifest("test")
    rng = random.Random(0)
    pv = [r for r in rows if r["source"] == "plantvillage"]
    return rng.sample(pv, n_pv) + [r for r in rows if r["source"] != "plantvillage"]


def acc(path, rows, img_size):
    so = ort.SessionOptions()
    so.intra_op_num_threads = 8
    sess = ort.InferenceSession(path, so, providers=["CPUExecutionProvider"])
    dl = DataLoader(PlantDataset(rows, img_size, train=False), 1, num_workers=8)
    pred = np.array([sess.run(None, {"input": x.numpy()})[0].argmax() for x, _ in dl])
    y = np.array([r["label_idx"] for r in rows])
    src = np.array([r["source"] for r in rows])
    return {s: float((pred[src == s] == y[src == s]).mean()) for s in ("plantvillage", "plantdoc", "maize_nutrient")}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--export-dir", required=True)
    ap.add_argument("--img-size", type=int, default=224)
    ap.add_argument("--n-pv", type=int, default=1500)
    ap.add_argument("--recipes", nargs="*", default=list(RECIPES))
    args = ap.parse_args()
    d = Path(args.export_dir)
    rows = subset(args.n_pv)
    pre = d / "_pre.onnx"
    quant_pre_process(str(d / "model_fp32.onnx"), str(pre))
    print(f"{'recipe':18s} {'MB':>5s} {'ms/4thr':>8s} {'pv':>7s} {'plantdoc':>9s} {'nutrient':>9s}")
    r = acc(str(d / "model_fp32.onnx"), rows, args.img_size)
    print(f"{'fp32':18s} {os.path.getsize(d / 'model_fp32.onnx') / 1e6:5.2f} {bench(str(d / 'model_fp32.onnx'), 4):8.1f} {r['plantvillage']:7.4f} {r['plantdoc']:9.4f} {r['maize_nutrient']:9.4f}", flush=True)
    for name in args.recipes:
        rc = RECIPES[name]
        out = d / f"sweep_{name}.onnx"
        quantize_static(str(pre), str(out), Calib("input", args.img_size, 300), quant_format=QuantFormat.QDQ,
                        activation_type=QuantType.QUInt8, weight_type=QuantType.QInt8, per_channel=True,
                        calibrate_method=rc["method"], op_types_to_quantize=rc["ops"])
        r = acc(str(out), rows, args.img_size)
        print(f"{name:18s} {os.path.getsize(out) / 1e6:5.2f} {bench(str(out), 4):8.1f} {r['plantvillage']:7.4f} {r['plantdoc']:9.4f} {r['maize_nutrient']:9.4f}", flush=True)
    pre.unlink()


if __name__ == "__main__":
    main()
