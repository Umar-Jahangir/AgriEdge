#!/usr/bin/env python3
"""
Create reproducible train/validation/test splits for acquired datasets.

Uses existing preparers where possible. Prefer official splits when present.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO))

# Map raw dirs to preparer keys / input overrides
MAPPING = {
    "plantvillage": {
        "preparer": "plantvillage",
        "input": REPO / "data" / "raw" / "plantvillage",
    },
    "plantdoc": {
        "preparer": "plantdoc",
        "input": REPO / "data" / "raw" / "plantdoc",
    },
    "ip102": {
        "preparer": "ip102",
        "input": REPO / "data" / "raw" / "ip102",
    },
    "maize_nutrient": {
        "preparer": "maize_nutrient",
        "input": REPO / "data" / "raw" / "maize_nutrient",
    },
    "maize_nitrogen": {
        "preparer": "nitrogen_maize",
        "input": REPO / "data" / "raw" / "maize_nitrogen",
    },
}


def main() -> int:
    from ai.datasets.registry import PREPARERS

    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", choices=list(MAPPING.keys()) + ["all"], default="all")
    parser.add_argument("--copy-files", action="store_true")
    args = parser.parse_args()

    keys = list(MAPPING.keys()) if args.dataset == "all" else [args.dataset]
    summary = {}
    for key in keys:
        cfg = MAPPING[key]
        preparer_cls = PREPARERS[cfg["preparer"]]
        inp = cfg["input"]
        if not inp.exists() or not any(inp.rglob("*")):
            summary[key] = {"status": "skipped", "reason": f"No data at {inp}"}
            print(f"[SKIP] {key}: no data")
            continue
        preparer = preparer_cls(input_path=inp)
        result = preparer.prepare(copy_files=args.copy_files)
        summary[key] = result.metadata.to_summary_dict()
        print(f"[{'OK' if result.success else 'FAIL'}] {key}: {result.message}")

    out = REPO / "data" / "processed" / "splits_summary.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"Summary: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
