# Data directory (local only)

Large datasets are **not** stored in GitHub.

```
data/
  raw/         # downloaded / extracted datasets (gitignored)
  external/    # archives / clones (gitignored)
  processed/   # prepared copies / metadata caches (gitignored)
  splits/      # train/val/test JSONL manifests (gitignored — regenerate)
  own/         # optional own-field capture structure
```

## Reacquire on a new machine (e.g. GPU laptop)

1. Install Python deps: `pip install -r ai/requirements.txt`
2. Follow `docs/dataset.md` and `config/datasets.yaml`
3. Run acquisition scripts under `scripts/` (PlantVillage, PlantDoc, IP102, …)
4. Run prepare / split scripts as documented in `docs/dataset_status.md`
5. Verify: `python scripts/final_verify_acquired.py`

Manual Mendeley downloads (if still required):

- Maize Nutrient → `data/raw/maize_nutrient/`
- Nitrogen Maize → `data/raw/maize_nitrogen/`

Tracked in git: this README, `config/datasets.yaml`, preparers under `ai/datasets/`, and docs — **not** the image files.
