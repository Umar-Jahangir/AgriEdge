# Disease models (local artifacts)

Place Phase-1 disease classifier outputs here after training (GPU laptop preferred).

## Expected layout after a successful run

```
models/disease/
  class_mapping.json          # optional copy; also under docs/
  training_config_used.json
  architecture_comparison.json
  runs/<timestamp>_<arch>/
    checkpoints/best.pt
    checkpoints/final.pt
    model.onnx
    evaluation_results.json
    training_history.json
    ...
```

## CPU Phase-1 note (Main PC)

- **MobileNetV3-Small** 3-epoch CPU benchmark **completed** with measured metrics.
  Tracked copies of small JSON results: `docs/training_artifacts/mobilenet_v3_small_cpu_phase1/`
- **EfficientNet-B0** CPU run was **stopped mid epoch-1** (workflow moved to GPU laptop).
  No EfficientNet checkpoint was saved. See `docs/training_artifacts/cpu_training_stop_notice.json`.

Do not commit `*.pt` / `*.onnx` / `runs/` — they are gitignored.

## GPU laptop next steps

1. Clone repo; acquire datasets separately (`data/raw/...`).
2. Verify `nvidia-smi` + PyTorch CUDA.
3. Re-run disease training (EfficientNet-B0 comparison + optional longer MobileNet).
4. Commit only docs/metrics updates to GitHub; keep weights local.
