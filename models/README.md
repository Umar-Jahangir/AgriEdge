# Models directory

Trained Edge AI artifacts live here **locally**. Large weight files are **not** committed to GitHub.

```
models/
  disease/     # Phase 1 crop-disease classifiers
  pest/        # Phase 2 (IP102) — not trained yet
  nutrient/    # Phase 3 — blocked on maize nutrient dataset
  nitrogen/    # Phase 4 — blocked on nitrogen maize dataset
```

## What belongs on disk (local / Pi / GPU laptop)

| Artifact | Example | GitHub |
|----------|---------|--------|
| Checkpoints | `*.pt`, `checkpoints/` | Ignored |
| ONNX export | `*.onnx` | Ignored |
| Run folders | `runs/<timestamp>_*/` | Ignored |
| Console logs | `*.log` | Ignored |
| Class mapping / metrics JSON | Prefer `docs/training_artifacts/` | Tracked there |
| This README / `.gitkeep` | — | Tracked |

## Sync strategy

1. **Train on GPU laptop** → write into `models/<task>/`.
2. **Share metrics/reports** via GitHub under `docs/` (JSON/Markdown only).
3. **Share weights** via private USB / cloud drive / Pi `scp` — not via git.
4. **Deploy to Raspberry Pi** by copying ONNX + class mapping onto the device.

See `docs/dev_workflow.md` for Main PC ↔ GPU laptop ↔ GitHub ↔ Pi roles.
