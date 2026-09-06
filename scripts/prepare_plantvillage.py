#!/usr/bin/env python3
"""Prepare PlantVillage dataset. Delegates to unified pipeline."""

import subprocess
import sys
from pathlib import Path

if __name__ == "__main__":
    script = Path(__file__).parent / "prepare_dataset.py"
    cmd = [sys.executable, str(script), "plantvillage"] + sys.argv[1:]
    raise SystemExit(subprocess.call(cmd))
