# Disease Model Report — Phase 1

**Status:** MobileNetV3-Small CPU benchmark **COMPLETE** (real metrics). EfficientNet-B0 CPU run **STOPPED** incomplete (moved to GPU laptop).  
**Last updated:** 2026-09-06

## Datasets used

| Source | Role | Combined split sizes |
|--------|------|----------------------|
| PlantVillage | Primary taxonomy (38 classes) | 37,163 / 7,951 / 9,191 |
| PlantDoc | Mapped into PV labels (18 classes); 10 generic leaf classes excluded | +1,098 / +230 / +254 |

Combined: **38,261 / 8,181 / 9,445** (train / val / test).  
Label mapping: `docs/disease_label_mapping.json`.

## Preprocessing

- 224×224 RGB, ImageNet mean/std  
- Train: flip, ±15° rotation, color jitter  
- Val/test: resize + normalize only  
- Imbalance: WeightedRandomSampler + class-weighted CE  
- Seed: 42; leakage check passed (paths + leaf groups)

## Architecture — CPU Phase-1 benchmark

| Candidate | Status on Main PC |
|-----------|-------------------|
| MobileNetV3-Small | **Completed** 3 epochs (CPU) |
| EfficientNet-B0 | **Stopped** mid epoch 1 — **no checkpoint**; re-run on GPU laptop |

Config: batch 16, AdamW lr 3e-4, cosine schedule, early-stop patience 3 on val macro-F1.  
See `ai/disease/config.yaml`.

## REAL results — MobileNetV3-Small (CPU host)

Source: `docs/training_artifacts/mobilenet_v3_small_cpu_phase1/evaluation_results.json`  
Run id: `20260906T094019Z_mobilenet_v3_small`  
Best epoch: **3** (by val macro-F1)

| Metric | Validation (n=8181) | Test (n=9445) |
|--------|---------------------|---------------|
| Accuracy | **0.9752** | **0.9418** |
| Precision (macro) | 0.9495 | 0.9291 |
| Recall (macro) | 0.9726 | 0.9650 |
| F1 (macro) | **0.9589** | **0.9394** |
| Precision (weighted) | 0.9777 | 0.9646 |
| Recall (weighted) | 0.9752 | 0.9418 |
| F1 (weighted) | 0.9758 | 0.9480 |

| Deployment proxy (Main PC CPU, not Pi) | Value |
|----------------------------------------|-------|
| Parameters | 1,556,806 |
| Best checkpoint size | 6.05 MB |
| ONNX size | 5.95 MB |
| Batch-1 latency mean | **16.13 ms** (CPU host) |
| Train wall time | ~8470 s (~2.35 h) for 3 epochs |

Confusion matrices / per-class metrics: same folder under `docs/training_artifacts/mobilenet_v3_small_cpu_phase1/`.

## EfficientNet-B0 (CPU) — stopped

- Stopped intentionally for GPU-laptop migration.  
- No epoch completed; **no** `best.pt` / metrics.  
- Notice: `docs/training_artifacts/cpu_training_stop_notice.json`  
- Local preserve copy under `models/disease/preserved_cpu_phase1_*` (gitignored).

## Limitations

- PlantVillage domain gap vs field rover images.  
- PlantDoc only partially mapped.  
- Host CPU latency ≠ Raspberry Pi 4.  
- Architecture comparison **incomplete** until EfficientNet is trained on GPU.  
- Vision ≠ soil NPK.

## Recommended next step

1. Push prepared repo to GitHub (after your approval).  
2. On GPU laptop: clone, acquire datasets, verify `nvidia-smi` + PyTorch CUDA + T1200.  
3. Train EfficientNet-B0 (and optionally longer MobileNet) with CUDA.  
4. Produce architecture comparison with **real** GPU metrics.  
5. Still do **not** wire into backend/frontend until comparison is documented.

## Explicit non-goals (unchanged)

No backend production integration, no frontend changes, no ESP32/hardware work, no pest/nutrient/nitrogen training yet.
