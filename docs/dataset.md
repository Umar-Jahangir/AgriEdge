# AgriEdge Rover — Dataset Guide

This document describes **acquired** datasets after the acquisition phase.
Model training has **not** been performed. Metrics: **Not evaluated yet**.

Scientific rule: vision datasets detect **visible symptoms**. They do **not** measure soil NPK/pH/EC.

---

## Directory Layout

```
data/
├── raw/                 # Organized acquired datasets
│   ├── plantvillage/
│   ├── plantdoc/
│   ├── ip102/
│   ├── maize_nutrient/  # PENDING MANUAL
│   └── maize_nitrogen/  # PENDING MANUAL
├── external/archives/   # Clones, zips, Drive downloads
├── processed/           # dataset_metadata.json per dataset
├── splits/              # train/validation/test JSONL manifests
└── own/                 # Field/rover dataset structure only
```

Config: `config/datasets.yaml`

---

## 1. PlantVillage — [ACQUIRED]

| Field | Value |
|---|---|
| Purpose | Crop disease classification |
| AI model | `disease` |
| Source | https://github.com/spMohanty/PlantVillage-Dataset |
| Alt | https://huggingface.co/datasets/mohanty/PlantVillage |
| Version | GitHub master (color set under `raw/color`) |
| Images | **54,305** |
| Classes | **38** (official `Crop___Disease` labels) |
| Split | Stratified + leaf-group holdout, seed 42 → 37163 / 7951 / 9191 |
| Leakage | Group holdout via inferred leaf group from filename; official `leaf_grouping` also present in clone |
| Preprocessing (planned) | Resize 224×224 RGB at train time |
| Augmentation (planned) | Flip, rotation±15°, brightness/contrast — **training only** |
| License | Check repository / paper terms before redistribution |
| Limitations | Lab-controlled leaves; domain gap vs rover field images |
| Local path | `data/raw/plantvillage/color/` (junction to archives) |

### Actual classes (38)

See `data/processed/plantvillage/dataset_metadata.json` for full list and counts.
Examples: `Apple___Apple_scab`, `Tomato___Late_blight`, `Corn_(maize)___healthy`, …

---

## 2. PlantDoc — [ACQUIRED]

| Field | Value |
|---|---|
| Purpose | Real-world plant disease classification |
| AI model | `disease` (robustness) |
| Source | https://github.com/pratikkayal/PlantDoc-Dataset |
| OD repo | https://github.com/pratikkayal/PlantDoc-Object-Detection-Dataset (not downloaded this phase) |
| Images | **2,579** extracted; **2,342** passed preparation validation |
| Classes | **28** (original folder names preserved) |
| Split | Stratified 70/15/15, seed 42 → 1625 / 339 / 378 |
| Annotations | Classification folders; OD bounding boxes in separate repo |
| License | CC BY 4.0 |
| Windows note | Filenames containing `?` sanitized to `_` |
| Local path | `data/raw/plantdoc/train|test/<class>/` |

### Actual classes (28)

Apple Scab Leaf, Apple leaf, Apple rust leaf, Bell_pepper leaf, Bell_pepper leaf spot, Blueberry leaf, Cherry leaf, Corn Gray leaf spot, Corn leaf blight, Corn rust leaf, Peach leaf, Potato leaf early blight, Potato leaf late blight, Raspberry leaf, Soyabean leaf, Squash Powdery mildew leaf, Strawberry leaf, Tomato Early blight leaf, Tomato Septoria leaf spot, Tomato leaf, Tomato leaf bacterial spot, Tomato leaf late blight, Tomato leaf mosaic virus, Tomato leaf yellow virus, Tomato mold leaf, Tomato two spotted spider mites leaf, grape leaf, grape leaf black rot

---

## 3. IP102 — [ACQUIRED]

| Field | Value |
|---|---|
| Purpose | Insect pest classification + detection |
| AI model | `pest` |
| Source | https://github.com/xpwu95/IP102 |
| Data host | Official Google Drive folder (documented in README) |
| Classification images | **75,222** |
| Detection images | **18,981** JPEGs |
| Detection annotations | **18,976** VOC XML |
| Classes | **102** (from `classes.txt`) |
| Split | **Official** train/val/test lists → 45095 / 7508 / 22619 |
| Layout | `Classification/extracted/ip102_v1.1/{images,train.txt,val.txt,test.txt}` |
| License | Free for **academic** usage; contact author for other use |
| Local path | `data/raw/ip102/` |

Class names are the official pest names from `classes.txt` (normalized to snake_case in manifests).

---

## 4. Maize Nutrient Deficiency — [PENDING MANUAL DOWNLOAD]

| Field | Value |
|---|---|
| Source | https://doi.org/10.17632/34gb2gr7p2.1 |
| Status | Automation blocked (Mendeley API 400/404, S3 403) |
| Expected (from description, **not verified locally**) | Mg, K, N, P deficiency + Healthy |
| Action | Manual download → `data/raw/maize_nutrient/` |

**Do not invent labels.** Inspect folders after download.

---

## 5. Nitrogen Deficiency in Maize — [PENDING MANUAL DOWNLOAD]

| Field | Value |
|---|---|
| Source | https://doi.org/10.17632/g7xnn2bm4g.1 |
| Status | Automation blocked |
| Labels | **Unknown until download** — do not assume N0/N75/NFull |
| Action | Manual download → `data/raw/maize_nitrogen/` |

---

## 6. Own Field / Rover Dataset — [STRUCTURE ONLY]

Paths created:

```
data/own/images/
data/own/annotations/
data/own/metadata/
data/own/raw/
data/own/processed/
```

No images fabricated.

---

## Scripts

| Script | Role |
|---|---|
| `scripts/acquire_plantdoc.py` | Download/extract PlantDoc |
| `scripts/acquire_ip102.py` | Drive download IP102 |
| `scripts/acquire_mendeley.py` | Attempt maize datasets |
| `scripts/organize_plantvillage.py` | Link PlantVillage color set |
| `scripts/prepare_dataset.py` | Unified preparer CLI |
| `scripts/prepare_plantvillage.py` | Alias |
| `scripts/prepare_plantdoc.py` | Alias |
| `scripts/prepare_ip102.py` | Alias |
| `scripts/prepare_maize_nutrient.py` | Alias |
| `scripts/prepare_maize_nitrogen.py` | Alias → `data/raw/maize_nitrogen` |
| `scripts/create_splits.py` | Generate manifests |
| `scripts/verify_datasets.py` | Counts / status report |
| `scripts/finalize_ip102_meta.py` | Post-extract IP102 metadata |

---

## AI Task Mapping

| Model | Datasets ready now |
|---|---|
| Disease | PlantVillage + PlantDoc |
| Pest | IP102 |
| Nutrient (visual) | Waiting on Mendeley |
| Nitrogen (visual) | Waiting on Mendeley |
| Domain adaptation | Own field (future) |

See also: `docs/dataset_status.md`
