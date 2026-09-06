# Dataset Acquisition Status

**Generated:** 2026-09-06  
**Scope:** Acquisition, verification, and split preparation only — **no model training**.

## Summary Table

| Dataset | Acquisition | Status | Actual files/images | Classes | Annotations | Notes |
|---|---|---|---:|---:|---|---|
| PlantVillage | GitHub clone → `data/raw/plantvillage/color` (junction) | **[ACQUIRED]** | **54,305** color images | **38** disease/crop classes | Classification folders | Official labels preserved (`Crop___Disease`) |
| PlantDoc | GitHub zip (Windows path sanitization) | **[ACQUIRED]** | **2,579** extracted / **2,342** usable after verify | **28** classes | Classification train/test folders | OD repo not required for classification; CC BY 4.0 |
| IP102 | Official Google Drive via gdown + tar extract | **[ACQUIRED]** | **75,222** classification + **18,981** detection JPEGs | **102** pest classes | **18,976** VOC XML boxes | Academic use only |
| Maize Nutrient Deficiency | Mendeley API/S3 attempted | **[PENDING MANUAL DOWNLOAD]** | **0** | — | — | Browser accept/login required |
| Nitrogen Deficiency in Maize | Mendeley API/S3 attempted | **[PENDING MANUAL DOWNLOAD]** | **0** | — | — | Browser accept/login required |
| Own Field/Rover | Structure only | **[STRUCTURE ONLY]** | **0** | — | — | Folders created; no fabricated data |

## Disk Space

| Location | Approx size |
|---|---:|
| `data/raw/` | ~9.97 GB |
| `data/external/archives/` | ~10.77 GB |
| `data/own/` | ~0 GB |
| **Note** | PlantVillage uses a Windows junction into archives (avoid double-counting for capacity planning). Total new footprint ≈ **~15–18 GB** on `E:`. |

## Split Preparation Status

| Dataset | Split strategy | Train | Val | Test | Manifests |
|---|---|---:|---:|---:|---|
| PlantVillage | Stratified + leaf-group holdout (seed 42) | 37,163 | 7,951 | 9,191 | `data/splits/plantvillage/*.jsonl` |
| PlantDoc | Stratified by class (seed 42) | 1,625 | 339 | 378 | `data/splits/plantdoc/*.jsonl` |
| IP102 | **Official** `train.txt` / `val.txt` / `test.txt` | 45,095 | 7,508 | 22,619 | `data/splits/ip102/*.jsonl` |
| Maize Nutrient | Not run | — | — | — | Blocked on download |
| Nitrogen Maize | Not run | — | — | — | Blocked on download |

## Manual Downloads Required

### 1. Maize Nutrient Deficiency
1. Open https://data.mendeley.com/datasets/34gb2gr7p2/1  
2. Accept license / sign in if prompted  
3. Click **Download All**  
4. Extract into: `agriedge-rover/data/raw/maize_nutrient/`  
5. Run: `python scripts/prepare_dataset.py maize_nutrient --summary`  
   or `python scripts/create_splits.py --dataset maize_nutrient`

### 2. Nitrogen Deficiency in Maize
1. Open https://data.mendeley.com/datasets/g7xnn2bm4g/1  
2. Accept license / sign in if prompted  
3. Click **Download All**  
4. Extract into: `agriedge-rover/data/raw/maize_nitrogen/`  
5. Run: `python scripts/prepare_maize_nitrogen.py --summary`  
   or `python scripts/create_splits.py --dataset maize_nitrogen`

Automation attempted: Mendeley public API returned 400/404; S3 zip candidates returned 403. **No invented URLs used.**

## Commands Used

```bash
# PlantVillage (GitHub has full images under raw/color)
git clone --depth 1 https://github.com/spMohanty/PlantVillage-Dataset.git data/external/archives/PlantVillage-Dataset
python scripts/organize_plantvillage.py

# PlantDoc (zip + Windows filename sanitization)
python scripts/acquire_plantdoc.py

# IP102 (official Drive folder + extract tars)
python scripts/acquire_ip102.py
# then extract Classification/ip102_v1.1.tar and Detection VOC tars

# Mendeley (blocked)
python scripts/acquire_mendeley.py

# Splits + verify
python scripts/create_splits.py --dataset plantvillage
python scripts/create_splits.py --dataset plantdoc
python scripts/create_splits.py --dataset ip102
python scripts/verify_datasets.py
```

## What Remains Before Model Training

1. Manually download the two Mendeley maize datasets and run preparation  
2. Optionally clone PlantDoc Object-Detection repo if bbox disease detection is needed  
3. Sample corrupt-image audit on IP102 detection JPEGs (classification lists trusted)  
4. Then begin Phase 3: disease model training on PlantVillage (+ PlantDoc for robustness)

**Models trained in this task: none. Metrics: Not evaluated yet.**
