#!/usr/bin/env python3
"""Prepare Maize Nutrient Deficiency dataset."""

import subprocess
import sys
from pathlib import Path

if __name__ == "__main__":
    script = Path(__file__).parent / "prepare_dataset.py"
    cmd = [sys.executable, str(script), "maize_nutrient"] + sys.argv[1:]
    raise SystemExit(subprocess.call(cmd))
