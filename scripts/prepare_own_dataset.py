#!/usr/bin/env python3
"""Validate/prepare AgriEdge own field dataset structure."""

import subprocess
import sys
from pathlib import Path

if __name__ == "__main__":
    script = Path(__file__).parent / "prepare_dataset.py"
    cmd = [sys.executable, str(script), "own_field"] + sys.argv[1:]
    raise SystemExit(subprocess.call(cmd))
