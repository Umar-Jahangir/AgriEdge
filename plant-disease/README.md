# Plant disease classifier for Raspberry Pi 4

A 42-class leaf classifier (38 PlantVillage crop/disease classes + 4 maize nutrient deficiencies), trained for
real field photos and exported as int8 ONNX for a Raspberry Pi 4 with a Pi camera (Picamera2).

## Layout

```
src/labels.py           unified label space + per-dataset mappings
src/build_manifest.py   raw/ -> data/manifest.csv + resized cache + background pool
src/data.py             dataset, augmentation, leaf-on-field-background compositing
src/train.py            timm training loop (AdamW, cosine, EMA, mixup/cutmix, bf16)
src/evaluate.py         per-source test metrics for a checkpoint and/or ONNX files
src/export.py           checkpoint -> ONNX fp32 -> static int8 + parity check + latency
pi/                     what goes on the Pi: predict.py, labels.json, model_*.onnx
raw/                    downloaded datasets (download.sh)
outputs/<model>/        best.pt, log.jsonl, export/
```

## Reproduce

```bash
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python torch torchvision --index-url https://download.pytorch.org/whl/cu128
uv pip install --python .venv/bin/python timm pillow numpy scikit-learn onnx onnxruntime onnxslim tqdm
./download.sh                                   # PlantVillage, PlantDoc, maize nitrogen (see notes for the 4th)
.venv/bin/python src/build_manifest.py
.venv/bin/python src/train.py --model mobilenetv3_large_100 --epochs 20
.venv/bin/python src/export.py --ckpt outputs/mobilenetv3_large_100/best.pt
.venv/bin/python src/evaluate.py --ckpt outputs/mobilenetv3_large_100/best.pt \
    --onnx outputs/mobilenetv3_large_100/export/model_fp32.onnx outputs/mobilenetv3_large_100/export/model_int8.onnx
```

## Datasets

| Source | Role | Images | Split |
|---|---|---|---|
| PlantVillage (`mohanty/PlantVillage`, color) | 38 classes, lab imagery | 54,305 | official leaf-grouped train/test; 5% of train leaf-groups held out as val |
| PlantDoc (github `pratikkayal/PlantDoc-Dataset`) | 27 of the same classes, real field photos | 2,578 | official train/test; 10% of train as val |
| Maize Nutrient Deficiency (Mendeley `34gb2gr7p2`) | +4 classes (Mg/N/P/K deficiency) + corn healthy, field | 463 | stratified 80/10/10 (no leaf ids → near-duplicates may straddle splits) |
| Nitrogen deficiency in maize (Mendeley `g7xnn2bm4g`) | **backgrounds only** (see below) | 1,200 | — |

The nitrogen dataset is whole-canopy plot photography (N0 / N75 / NFull fertilizer rates), not leaf images, so it is
not used as labels by default. Its 1,200 real foliage/soil photos are used as backgrounds for compositing instead.
`build_manifest.py --include-canopy` adds N0→N-deficiency and NFull→healthy if you want them as labels anyway.

## Field robustness

PlantVillage is single leaves on grey paper; models trained on it alone score 99% on its test set and collapse on
field photos. Three things close the gap here:

1. **Background compositing** – half the PlantVillage training samples use the dataset's segmented (masked) leaf
   pasted onto a random real field background (canopy crops), with random scale and placement.
2. **Oversampling field data** – PlantDoc ×8 and the maize nutrient set ×10 per epoch, so ~30% of every epoch is
   real photography.
3. **Heavy augmentation** – RandomResizedCrop (scale 0.35–1), flips, rotation, strong colour jitter, blur,
   random erasing, mixup/cutmix.

Model selection uses the **mean of per-source val accuracies**, not overall accuracy (which PlantVillage would dominate).

## Results

Top-1 accuracy on held-out **test** splits (never used for model selection). 20 epochs, 224px, RTX 5090, ~13 min per model.

| Model | Params | ONNX | PlantVillage test (lab, n=10,709) | PlantDoc test (field, n=236) | Maize nutrient test (field, n=44) |
|---|---|---|---|---|---|
| MobileNetV3-Large fp32 **(shipped default)** | 4.26M | 17.0 MB | **99.5%** | **64.8%** (top-3 84.3%) | **93.2%** (top-3 100%) |
| MobileNetV3-Large int8 | 4.26M | 4.7 MB | 97.7% | 58.5% | 79.5% |
| MobileNetV3-Small fp32 | 1.56M | 6.3 MB | 98.2% | 58.5% (top-3 82.2%) | 90.9% |
| MobileNetV3-Small int8 | 1.56M | 1.9 MB | 91.0% | 48.3% | 77.3% |

Reading these numbers:

- **Lab vs field gap is real and expected.** 99.5% on PlantVillage is the number every PlantVillage paper reports; 65% on
  PlantDoc is the honest field number (published PlantVillage-only models score 15–30% on PlantDoc, so the
  compositing + oversampling recipe roughly doubles field accuracy). The Pi will see the field number, not the lab one.
- **PlantDoc test is tiny** (4–12 images per class), so per-class numbers are noisy. Systematic weak spots: tomato
  mosaic virus (10% recall — visually subtle), tomato bacterial spot ↔ septoria, potato early ↔ late blight,
  corn northern leaf blight ↔ gray leaf spot. These are pairs human agronomists also find hard from a single leaf.
- **The nutrient test split may be optimistic**: the Mendeley set has no leaf ids, so near-duplicate shots of the same
  leaf can land on both sides of the split.
- **int8 post-training quantization costs too much on MobileNetV3** (hardswish + squeeze-excite are hostile to static
  int8; a sweep of MinMax/Percentile/Entropy calibration and conv-only quantization in `src/quant_sweep.py` never got
  closer than −2 pts lab / −6 pts field). fp32 is fast enough on a Pi 4 (see below), so it is the default. If you need
  int8, the fix is quantization-aware training or a ReLU-only backbone such as MobileNetV2 / EfficientNet-Lite.

### Speed on the Pi 4

Measured here on x86 (1 thread): Large fp32 6 ms, Small fp32 2.5 ms. A Pi 4 is typically 10–20× slower, so expect roughly
**60–120 ms per frame for Large and 25–50 ms for Small** with ONNX Runtime on 64-bit Pi OS — either is far below the
~1–2 s cadence a camera-pointing workflow needs. Use `pi/small/` only if you want to run continuously at several frames
per second.

### Recommended follow-ups

1. **Collect ~50–100 photos per class with the actual Pi camera** in the real setting and fine-tune on them
   (`train.py --resume`, or add them as a new source in `build_manifest.py`). Nothing will move field accuracy more than
   in-domain data from the deployment camera.
2. Add an explicit "not a leaf / unknown" class from random non-leaf captures so the model can abstain.
3. Try `--img-size 256` or `efficientnet_lite0` if you want to trade Pi latency for accuracy.
