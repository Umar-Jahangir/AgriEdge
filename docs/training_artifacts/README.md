# Training artifacts (tracked metrics only)

Small JSON/Markdown reports from training runs. **No** `.pt` / `.onnx` weights here.

| Path | Meaning |
|------|---------|
| `mobilenet_v3_small_cpu_phase1/` | Completed Main-PC CPU MobileNetV3-Small benchmark (real metrics) |
| `cpu_training_stop_notice.json` | EfficientNet-B0 CPU run stopped for GPU-laptop migration |
| `class_mapping.json` / `training_config_used.json` | Snapshot of disease label map + config used for that run |

Full weight files remain under local `models/disease/runs/` (gitignored).
