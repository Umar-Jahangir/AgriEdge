# AI Pipeline Documentation

## Multimodal AI System

AgriEdge uses **four specialized models**, not a single monolithic classifier:

| Model | Purpose | Dataset | Architecture | Status |
|-------|---------|---------|--------------|--------|
| Disease | Crop disease from leaf images | PlantVillage + mapped PlantDoc | MobileNetV3-Small vs EfficientNet-B0 (benchmark) | Phase 1 training |
| Pest | Insect pest detection | IP102 | YOLO (lightweight, TBD) | Not started |
| Nutrient | Visual deficiency symptoms | Maize Nutrient Deficiency | Classifier TBD | Blocked — await complete manual dataset |
| Nitrogen | Maize nitrogen stress | Nitrogen Deficiency in Maize | Classifier TBD | Blocked — dataset missing |

## Multi-machine ML workflow

- **Main PC + Cursor:** software/integration (no new heavy training).
- **GPU laptop + Antigravity:** disease/pest training after CUDA verified.
- **GitHub:** source/docs/config only — not datasets or weight binaries.
- **Raspberry Pi:** deployment target for ONNX.

See `docs/dev_workflow.md`.

## Phase 1 — Disease model (current)

- MobileNetV3-Small **CPU** 3-epoch benchmark: **complete** (metrics in `docs/training_artifacts/`).
- EfficientNet-B0 **CPU** run: **stopped incomplete** — re-train on GPU laptop.
- Main PC training: **paused**.

### Datasets

- **Primary taxonomy:** PlantVillage (38 classes)
- **Secondary:** PlantDoc images mapped into PlantVillage labels where safe (18 classes mapped; 10 generic leaf classes excluded)
- Combined split sizes (after mapping): train **38,261** / val **8,181** / test **9,445**
- Label mapping artifact: `docs/disease_label_mapping.json` and `models/disease/class_mapping.json`

### Leakage controls

- PlantVillage splits use stratified + leaf-group holdout (seed 42)
- PlantDoc uses its own stratified splits; only same-named splits are merged (train∪train, etc.)
- Path and group-id overlap check must pass before training (`leakage_ok: true`)

### Preprocessing / augmentation

- Resize 224×224, ImageNet mean/std
- Train: horizontal flip, ±15° rotation, color jitter
- Val/test: resize + normalize only

### Class imbalance

- Weighted random sampler over training labels
- Class-weighted CrossEntropyLoss

### Training protocol

- Reproducible seed: **42**
- Architectures compared (not popularity-picked): `mobilenet_v3_small`, `efficientnet_b0`
- Checkpoints: best (by val macro-F1) + final + per-epoch
- Config saved with each run
- Metrics must be **measured**, never fabricated

### Evaluation (required real outputs)

- Accuracy, precision, recall, F1 (macro + weighted)
- Confusion matrix + per-class report
- Inference latency (host; re-measure on Raspberry Pi 4)
- Model / checkpoint size

### Artifacts location

```
models/disease/
├── class_mapping.json
├── training_config_used.json
├── architecture_comparison.json
└── runs/<timestamp>_<arch>/
    ├── checkpoints/best.pt
    ├── checkpoints/final.pt
    ├── training_history.json
    ├── val_metrics.json
    ├── test_metrics.json
    ├── *_confusion_matrix.json
    ├── evaluation_results.json
    └── model.onnx
```

### Explicit non-goals (this phase)

- Do **not** integrate into production backend yet
- Do **not** change frontend
- Do **not** train pest / nutrient / nitrogen models yet
- Do **not** claim Raspberry Pi latency until measured on Pi

## Training pipeline (general)

```
Raw Dataset → Inspection → Cleaning → Label Validation
  → Train/Val/Test Split → Preprocessing → Augmentation
  → Training → Evaluation → Error Analysis → Export (ONNX)
  → Raspberry Pi Deployment
```

## Important distinctions

- **NPK sensor** measures soil nutrient-related values (per sensor capability)
- **Vision model** detects visible symptoms only
- System **combines both** in the decision engine — never claims camera measures soil nitrogen concentration

## Dataset resources

| Dataset | URL | License note |
|---------|-----|--------------|
| PlantVillage | https://github.com/spMohanty/PlantVillage-Dataset | Academic use |
| PlantDoc | https://github.com/pratikkayal/PlantDoc-Dataset | Check repo |
| IP102 | https://github.com/xpwu95/IP102 | Free for academic use |
| Maize Nutrient | https://doi.org/10.17632/34gb2gr7p2.1 | Mendeley |
| Nitrogen Maize | https://doi.org/10.17632/g7xnn2bm4g.1 | Mendeley |

## Code layout (disease Phase 1)

```
ai/
├── datasets/           # Dataset preparers (acquisition phase)
├── disease/            # Phase 1 training stack
│   ├── config.yaml
│   ├── label_mapping.py
│   ├── dataset.py
│   ├── transforms_models.py
│   ├── train.py
│   └── evaluate.py
└── inference/          # Demo predict only — not production disease model yet
```

## Commands

```bash
python scripts/final_verify_acquired.py
python scripts/inspect_disease_labels.py
python -u ai/disease/train.py --config ai/disease/config.yaml
```

## Deployment flow (later)

```
Development PC → Train → Evaluate → Export ONNX
  → Copy to models/ on Raspberry Pi → Local inference via backend
```
