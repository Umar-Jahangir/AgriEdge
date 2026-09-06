# Software Status — AgriEdge Rover

Last updated: 2026-09-06

## Multi-machine workflow

| Role | Machine | Tool |
|------|---------|------|
| Software / integration | Main PC | Cursor |
| ML train / evaluate | GPU laptop (NVIDIA T1200, 4GB) | Antigravity |
| Source sync | GitHub | git |
| Edge deploy | Raspberry Pi 4 | ONNX local inference |

Details: `docs/dev_workflow.md`

## Overall

| Area | Status | Notes |
|------|--------|-------|
| Frontend dashboard | Demo / mock-capable | Unchanged this phase |
| Backend API | Mock/demo AI | Not wired to trained disease model |
| Dataset acquisition (PV / PlantDoc / IP102) | Verified on Main PC disk | Not in git — reacquire on GPU laptop |
| Maize Nutrient | Partial / manual | Local only; do not train yet |
| Nitrogen Maize | Missing | `data/raw/maize_nitrogen/` |
| Disease MobileNetV3-Small | **CPU benchmark complete** | Real metrics in `docs/training_artifacts/` |
| Disease EfficientNet-B0 | **CPU run stopped** | Incomplete; resume on GPU laptop |
| Main PC training | **Paused** | Do not start new training here |
| Pest / nutrient / nitrogen models | Not started | |
| ESP32 / hardware | Skeleton | Out of scope |
| Production model integration | Not started | |

## MobileNetV3-Small (measured, Main PC CPU)

| Split | Accuracy | Macro-F1 |
|-------|----------|----------|
| Val | 0.9752 | 0.9589 |
| Test | 0.9418 | 0.9394 |

Checkpoint ~6.05 MB; host CPU latency ~16.1 ms (not Pi).

## GitHub preparation

- Root `.gitignore` excludes datasets, weights, `node_modules`, venvs, secrets, logs, runtime DBs.
- Model directory READMEs explain local placement of weights.
- Tracked training metrics: `docs/training_artifacts/` (JSON only, no `.pt`/`.onnx`).
