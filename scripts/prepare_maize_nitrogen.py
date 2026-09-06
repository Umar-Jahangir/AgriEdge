#!/usr/bin/env python3
"""Prepare Nitrogen Deficiency in Maize (alias for nitrogen_maize preparer)."""

import subprocess
import sys
from pathlib import Path

if __name__ == "__main__":
    script = Path(__file__).parent / "prepare_dataset.py"
    # Prefer data/raw/maize_nitrogen if present
    cmd = [sys.executable, str(script), "nitrogen_maize", "--input", "data/raw/maize_nitrogen"] + [
        a for a in sys.argv[1:] if a
    ]
    raise SystemExit(subprocess.call(cmd))
