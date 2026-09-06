#!/usr/bin/env python3
"""
Train and evaluate disease classification models (PlantVillage + mapped PlantDoc).

Produces REAL measured metrics only. Does not integrate into backend/frontend.
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import yaml
from torch.utils.data import DataLoader, WeightedRandomSampler

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO))

from ai.disease.dataset import (  # noqa: E402
    DiseaseImageDataset,
    assert_no_path_leakage,
    build_combined_split,
    build_label_mapping_document,
    discover_class_names,
)
from ai.disease.evaluate import (  # noqa: E402
    compute_classification_metrics,
    measure_latency_ms,
    predict_loader,
    save_json,
)
from ai.disease.transforms_models import (  # noqa: E402
    SUPPORTED_ARCHITECTURES,
    build_transforms,
    count_parameters,
    create_model,
    model_size_mb,
)


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def load_config(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def make_weighted_sampler(labels: list[int]) -> WeightedRandomSampler:
    counts = np.bincount(np.array(labels), minlength=max(labels) + 1)
    counts = np.maximum(counts, 1)
    class_w = 1.0 / counts
    sample_w = class_w[np.array(labels)]
    return WeightedRandomSampler(weights=torch.DoubleTensor(sample_w), num_samples=len(sample_w), replacement=True)


def class_weights_tensor(labels: list[int], num_classes: int, device: torch.device) -> torch.Tensor:
    counts = np.bincount(np.array(labels), minlength=num_classes).astype(np.float64)
    counts = np.maximum(counts, 1.0)
    w = counts.sum() / (num_classes * counts)
    return torch.tensor(w, dtype=torch.float32, device=device)


def train_one_epoch(model, loader, criterion, optimizer, device, log_every: int = 100) -> dict:
    model.train()
    total_loss = 0.0
    correct = 0
    n = 0
    num_batches = len(loader)
    for batch_idx, (images, labels) in enumerate(loader, start=1):
        images = images.to(device)
        labels = labels.to(device)
        optimizer.zero_grad(set_to_none=True)
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += float(loss.item()) * labels.size(0)
        correct += int((outputs.argmax(1) == labels).sum().item())
        n += labels.size(0)
        if batch_idx == 1 or batch_idx % log_every == 0 or batch_idx == num_batches:
            print(
                f"  batch {batch_idx}/{num_batches} "
                f"loss={total_loss / max(n, 1):.4f} acc={correct / max(n, 1):.4f}",
                flush=True,
            )
    return {"loss": total_loss / max(n, 1), "accuracy": correct / max(n, 1)}


@torch.no_grad()
def eval_epoch(model, loader, criterion, device, class_names: list[str] | None = None) -> dict:
    model.eval()
    total_loss = 0.0
    correct = 0
    n = 0
    ys: list[int] = []
    preds: list[int] = []
    for images, labels in loader:
        images = images.to(device)
        labels = labels.to(device)
        outputs = model(images)
        loss = criterion(outputs, labels)
        total_loss += float(loss.item()) * labels.size(0)
        pred = outputs.argmax(1)
        correct += int((pred == labels).sum().item())
        n += labels.size(0)
        if class_names is not None:
            ys.extend(labels.cpu().tolist())
            preds.extend(pred.cpu().tolist())
    out = {"loss": total_loss / max(n, 1), "accuracy": correct / max(n, 1)}
    if class_names is not None:
        from sklearn.metrics import f1_score
        import numpy as np

        out["f1_macro"] = float(f1_score(np.array(ys), np.array(preds), average="macro", zero_division=0))
    return out


def train_architecture(
    architecture: str,
    cfg: dict,
    train_records,
    val_records,
    test_records,
    class_names: list[str],
    class_to_idx: dict[str, int],
    run_dir: Path,
    device: torch.device,
) -> dict:
    prep = cfg["preprocessing"]
    train_tf = build_transforms(prep["image_size"], prep["mean"], prep["std"], train=True)
    eval_tf = build_transforms(prep["image_size"], prep["mean"], prep["std"], train=False)

    train_ds = DiseaseImageDataset(train_records, class_to_idx, train_tf)
    val_ds = DiseaseImageDataset(val_records, class_to_idx, eval_tf)
    test_ds = DiseaseImageDataset(test_records, class_to_idx, eval_tf)

    train_labels = [class_to_idx[r.label] for r in train_records]
    tcfg = cfg["training"]
    sampler = make_weighted_sampler(train_labels) if tcfg.get("class_weighting", True) else None

    train_loader = DataLoader(
        train_ds,
        batch_size=tcfg["batch_size"],
        sampler=sampler,
        shuffle=sampler is None,
        num_workers=tcfg.get("num_workers", 0),
        pin_memory=device.type == "cuda",
    )
    val_loader = DataLoader(
        val_ds,
        batch_size=tcfg["batch_size"],
        shuffle=False,
        num_workers=tcfg.get("num_workers", 0),
        pin_memory=device.type == "cuda",
    )
    test_loader = DataLoader(
        test_ds,
        batch_size=tcfg["batch_size"],
        shuffle=False,
        num_workers=tcfg.get("num_workers", 0),
        pin_memory=device.type == "cuda",
    )
    latency_loader = DataLoader(test_ds, batch_size=1, shuffle=False, num_workers=0)

    model = create_model(architecture, num_classes=len(class_names), pretrained=tcfg.get("pretrained", True))
    model = model.to(device)
    params = count_parameters(model)

    weights = class_weights_tensor(train_labels, len(class_names), device) if tcfg.get("class_weighting", True) else None
    criterion = nn.CrossEntropyLoss(weight=weights)
    optimizer = torch.optim.AdamW(model.parameters(), lr=tcfg["lr"], weight_decay=tcfg["weight_decay"])
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=tcfg["epochs"])

    history = []
    best_val_f1 = -1.0
    best_epoch = -1
    patience = tcfg.get("early_stopping_patience", 3)
    stale = 0
    ckpt_dir = run_dir / "checkpoints"
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    best_path = ckpt_dir / "best.pt"
    final_path = ckpt_dir / "final.pt"

    t0 = time.perf_counter()
    for epoch in range(1, tcfg["epochs"] + 1):
        tr = train_one_epoch(model, train_loader, criterion, optimizer, device)
        va = eval_epoch(model, val_loader, criterion, device, class_names=class_names)
        val_f1 = float(va["f1_macro"])
        scheduler.step()
        row = {
            "epoch": epoch,
            "train_loss": tr["loss"],
            "train_accuracy": tr["accuracy"],
            "val_loss": va["loss"],
            "val_accuracy": va["accuracy"],
            "val_f1_macro": val_f1,
            "lr": float(optimizer.param_groups[0]["lr"]),
        }
        history.append(row)
        save_json(history, run_dir / "training_history.json")
        print(
            f"[{architecture}] epoch {epoch}/{tcfg['epochs']} "
            f"train_acc={tr['accuracy']:.4f} val_acc={va['accuracy']:.4f} val_f1={val_f1:.4f}",
            flush=True,
        )

        torch.save(
            {
                "architecture": architecture,
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "class_names": class_names,
                "class_to_idx": class_to_idx,
                "val_f1_macro": val_f1,
            },
            ckpt_dir / f"epoch_{epoch:03d}.pt",
        )

        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            best_epoch = epoch
            stale = 0
            torch.save(
                {
                    "architecture": architecture,
                    "epoch": epoch,
                    "model_state_dict": model.state_dict(),
                    "class_names": class_names,
                    "class_to_idx": class_to_idx,
                    "val_f1_macro": val_f1,
                },
                best_path,
            )
        else:
            stale += 1
            if stale >= patience:
                print(f"[{architecture}] early stopping at epoch {epoch}", flush=True)
                break

    torch.save(
        {
            "architecture": architecture,
            "epoch": history[-1]["epoch"] if history else 0,
            "model_state_dict": model.state_dict(),
            "class_names": class_names,
            "class_to_idx": class_to_idx,
        },
        final_path,
    )
    train_seconds = time.perf_counter() - t0

    # Load best for evaluation
    best = torch.load(best_path, map_location=device, weights_only=False)
    model.load_state_dict(best["model_state_dict"])

    y_val, p_val = predict_loader(model, val_loader, device)
    y_test, p_test = predict_loader(model, test_loader, device)
    val_metrics = compute_classification_metrics(y_val, p_val, class_names)
    test_metrics = compute_classification_metrics(y_test, p_test, class_names)
    latency = measure_latency_ms(
        model,
        latency_loader,
        device,
        warmup=cfg["evaluation"].get("latency_warmup", 10),
        runs=cfg["evaluation"].get("latency_runs", 50),
    )

    # Export ONNX optional
    onnx_path = None
    if cfg.get("export", {}).get("onnx", True):
        onnx_path = run_dir / "model.onnx"
        dummy = torch.randn(1, 3, prep["image_size"], prep["image_size"], device=device)
        torch.onnx.export(
            model,
            dummy,
            str(onnx_path),
            input_names=["images"],
            output_names=["logits"],
            opset_version=cfg.get("export", {}).get("opset", 17),
            dynamo=False,
        )

    best_size = model_size_mb(best_path)
    onnx_size = model_size_mb(onnx_path) if onnx_path and onnx_path.exists() else None

    results = {
        "architecture": architecture,
        "device": str(device),
        "parameter_counts": params,
        "best_epoch": best_epoch,
        "best_val_f1_macro": best_val_f1,
        "train_seconds": train_seconds,
        "checkpoint_best_mb": best_size,
        "onnx_mb": onnx_size,
        "validation": val_metrics,
        "test": test_metrics,
        "latency": latency,
        "paths": {
            "best_checkpoint": str(best_path),
            "final_checkpoint": str(final_path),
            "onnx": str(onnx_path) if onnx_path else None,
            "history": str(run_dir / "training_history.json"),
        },
    }
    save_json(val_metrics, run_dir / "val_metrics.json")
    save_json(test_metrics, run_dir / "test_metrics.json")
    save_json(results, run_dir / "evaluation_results.json")
    save_json({"confusion_matrix": val_metrics["confusion_matrix"], "classes": class_names}, run_dir / "val_confusion_matrix.json")
    save_json({"confusion_matrix": test_metrics["confusion_matrix"], "classes": class_names}, run_dir / "test_confusion_matrix.json")
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Train disease models")
    parser.add_argument("--config", type=Path, default=REPO / "ai" / "disease" / "config.yaml")
    parser.add_argument("--architectures", nargs="+", default=None, choices=list(SUPPORTED_ARCHITECTURES))
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--batch-size", type=int, default=None)
    parser.add_argument("--device", type=str, default=None)
    parser.add_argument("--max-train-samples", type=int, default=None, help="Optional cap for smoke/debug only")
    args = parser.parse_args()

    cfg = load_config(args.config)
    if args.epochs is not None:
        cfg["training"]["epochs"] = args.epochs
    if args.batch_size is not None:
        cfg["training"]["batch_size"] = args.batch_size

    set_seed(cfg["seed"])
    device = torch.device(args.device or ("cuda" if torch.cuda.is_available() else "cpu"))
    print(f"Device: {device}")

    # Build splits (PlantVillage + mapped PlantDoc, same split names → no cross-split leakage)
    train_records, train_sum = build_combined_split("train")
    val_records, val_sum = build_combined_split("validation")
    test_records, test_sum = build_combined_split("test")

    if args.max_train_samples is not None:
        # Stratified-ish: keep order but truncate — documented as debug-only
        train_records = train_records[: args.max_train_samples]
        print(f"WARNING: max-train-samples={args.max_train_samples} (debug/smoke only)")

    leakage = assert_no_path_leakage(train_records, val_records, test_records)
    if not leakage["ok"]:
        print("BLOCKER: train/val/test leakage detected:")
        print(json.dumps(leakage, indent=2))
        return 2

    class_names = discover_class_names(train_records + val_records + test_records)
    # Ensure all PlantVillage classes present even if a rare class missing from one split
    # Use train classes as authoritative for model head
    class_names = sorted({r.label for r in train_records})
    class_to_idx = {c: i for i, c in enumerate(class_names)}

    pd_stats = {
        "train": train_sum["plantdoc_stats"],
        "validation": val_sum["plantdoc_stats"],
        "test": test_sum["plantdoc_stats"],
    }
    label_doc = build_label_mapping_document(train_records, val_records, test_records, pd_stats)
    label_doc["leakage_check"] = leakage

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_root = REPO / cfg.get("output_dir", "models/disease")
    out_root.mkdir(parents=True, exist_ok=True)
    save_json(label_doc, out_root / "class_mapping.json")
    save_json(cfg, out_root / "training_config_used.json")

    architectures = args.architectures or cfg["training"]["architectures"]
    all_results = []
    for arch in architectures:
        run_dir = out_root / "runs" / f"{stamp}_{arch}"
        run_dir.mkdir(parents=True, exist_ok=True)
        save_json(cfg, run_dir / "config.json")
        save_json(label_doc, run_dir / "class_mapping.json")
        print(f"=== Training {arch} -> {run_dir} ===")
        result = train_architecture(
            arch,
            cfg,
            train_records,
            val_records,
            test_records,
            class_names,
            class_to_idx,
            run_dir,
            device,
        )
        all_results.append(result)
        save_json(result, run_dir / "summary.json")

    # Benchmark comparison (real measured values only)
    comparison = {
        "generated_at_utc": stamp,
        "device": str(device),
        "seed": cfg["seed"],
        "datasets": ["plantvillage", "plantdoc_mapped"],
        "num_classes": len(class_names),
        "split_counts": label_doc["split_counts"],
        "architectures": all_results,
        "selection_notes": [
            "Compare validation F1/accuracy, checkpoint size, and host latency.",
            "Raspberry Pi suitability prefers smaller / faster models even if slightly lower accuracy.",
            "Host CPU latency is a proxy only; re-measure on Pi 4 before deployment claims.",
        ],
    }
    # Recommend without popularity bias: score = val_f1 - size_penalty - latency_penalty (normalized simply)
    if all_results:
        # Prefer higher val F1, lower size, lower latency
        scored = []
        for r in all_results:
            f1 = r["validation"]["f1_macro"]
            size = r["checkpoint_best_mb"] or 1.0
            lat = r["latency"]["latency_mean_ms"]
            # Heuristic documented in report — not fabricated accuracy
            score = f1 - 0.002 * size - 0.0005 * lat
            scored.append((score, r["architecture"], f1, size, lat))
        scored.sort(reverse=True)
        comparison["recommendation"] = {
            "rank_by_score": [
                {"architecture": a, "score": s, "val_f1_macro": f1, "checkpoint_mb": sz, "latency_ms": lt}
                for s, a, f1, sz, lt in scored
            ],
            "formula": "score = val_f1_macro - 0.002*checkpoint_mb - 0.0005*latency_mean_ms",
            "primary_pick": scored[0][1] if scored else None,
        }

    save_json(comparison, out_root / "architecture_comparison.json")
    print(json.dumps(comparison.get("recommendation", {}), indent=2))
    print(f"Wrote artifacts under {out_root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
