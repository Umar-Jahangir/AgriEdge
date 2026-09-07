# Plant disease classifier on Raspberry Pi 4

Files needed on the Pi: `predict.py`, `labels.json`, `model_fp32.onnx` (MobileNetV3-Large, the default).

| File | Use when |
|---|---|
| `model_fp32.onnx` | **default** – best accuracy, ~60–120 ms/frame on a Pi 4 |
| `model_int8.onnx` | 3.6× smaller and ~30% faster, but loses ~2 pts lab / ~6 pts field accuracy |
| `small/model_fp32.onnx` | MobileNetV3-Small: ~2.5× faster than Large, ~1.3 pts lab / ~6 pts field lower accuracy |
| `small/model_int8.onnx` | fastest, noticeably less accurate – only for very tight latency budgets |

## Setup (Raspberry Pi OS Bookworm, 64-bit)

```bash
sudo apt update && sudo apt install -y python3-picamera2 python3-pip python3-venv
python3 -m venv --system-site-packages ~/plant-venv     # system-site so picamera2 is visible
source ~/plant-venv/bin/activate
pip install -r requirements.txt
```

`onnxruntime` publishes aarch64 wheels, so this works on 64-bit Pi OS only. On 32-bit, use `pip install onnxruntime` from piwheels.

## Run

```bash
python3 predict.py --image test_leaf.jpg     # sanity check without the camera
python3 predict.py --once                    # one capture
python3 predict.py --interval 1              # continuous, one classification per second
python3 predict.py --model model_int8.onnx   # faster, less accurate (see table above)
python3 predict.py --model small/model_fp32.onnx --labels small/labels.json
```

Output per capture: inference time and the top-3 classes with probabilities.

## Tips for good predictions

- Fill the frame with **one leaf**. The model was trained on leaf close-ups; a wide shot of a whole plant will not work.
- Even, diffuse light. Avoid hard shadows and blown-out highlights.
- Confidence below ~50% on the top class usually means "not sure" — reposition and retry.
- The model only knows the crops/conditions in `labels.json`; anything else is forced into the nearest class.
