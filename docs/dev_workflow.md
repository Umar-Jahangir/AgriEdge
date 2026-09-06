# Development workflow — multi-machine

AgriEdge Rover uses a split development setup.

```
┌─────────────────────┐     GitHub (source only)     ┌──────────────────────────┐
│ Main PC + Cursor    │ ◄──────────────────────────► │ GPU laptop + Antigravity │
│ Software / integrate│                              │ ML train / evaluate      │
└─────────┬───────────┘                              └────────────┬─────────────┘
          │                                                       │
          │              ONNX + mapping (manual copy)               │
          └──────────────────────► Raspberry Pi 4 ─────────────────┘
                                   Edge deployment
```

## Roles

| Machine | Tool | Responsibility |
|---------|------|----------------|
| **Main PC** | Cursor | Backend, frontend, ESP32 skeleton, docs, integration, dataset *scripts* |
| **GPU laptop** | Antigravity | Model training/evaluation (CUDA), exporting ONNX, writing metrics into `docs/` |
| **GitHub** | git remote | Shared **source of truth** for code/config/docs — **not** datasets or weight binaries |
| **Raspberry Pi 4** | deploy target | Offline inference with copied ONNX + class maps |

## What goes to GitHub

**Commit:** Python/TS source, `scripts/`, `config/`, `docs/`, `requirements` / `package.json`, `.env.example`, model **directory READMEs**, small training **metric JSON** under `docs/training_artifacts/`.

**Do not commit:** `data/raw|processed|splits|external`, `node_modules`, venvs, `*.pt` / `*.onnx`, `models/**/runs/`, `.env`, SQLite runtime DBs, logs.

## Dataset policy

Datasets are acquired **per machine**:

1. Clone the repo.
2. Follow `docs/dataset.md` / `docs/dataset_status.md`.
3. Run acquisition/prepare/split scripts.
4. Keep images only on local disks (and Pi if needed).

## GPU laptop — before any training

Verify in order:

```bash
nvidia-smi
python --version
python -c "import torch; print(torch.__version__, torch.cuda.is_available(), torch.cuda.get_device_name(0) if torch.cuda.is_available() else None)"
```

Expect: NVIDIA driver OK, **CUDA available**, device name contains **T1200** (or the installed GPU).

Only after CUDA is verified, run disease training (resume EfficientNet comparison / longer runs). Do **not** invent metrics.

## Main PC — current ML note

- MobileNetV3-Small **CPU** Phase-1 benchmark completed (real metrics in `docs/training_artifacts/`).
- EfficientNet-B0 **CPU** training was **stopped** (incomplete; no checkpoint) when moving training to the GPU laptop.
- Do **not** start new heavy training on the Main PC.

## Raspberry Pi

Copy from GPU laptop (or Main PC staging):

- `model.onnx` (or chosen best checkpoint export)
- class mapping JSON
- preprocessing config notes from the training report

Measure latency **on the Pi** before claiming Edge performance.
