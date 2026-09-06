#!/usr/bin/env python3
"""Prepare all configured datasets (skips missing downloads gracefully)."""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

from ai.datasets.registry import PREPARERS

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("prepare_all")


def main():
    results = {}
    for key, preparer_cls in PREPARERS.items():
        logger.info("--- Preparing %s ---", key)
        preparer = preparer_cls()
        result = preparer.prepare(copy_files=False)
        results[key] = result.metadata.to_summary_dict()
        logger.info("%s: %s", key, result.message)

    summary_path = REPO_ROOT / "data" / "processed" / "preparation_summary.json"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"\nSummary written to {summary_path}")
    pending = [k for k, v in results.items() if v["status"] == "pending_download"]
    processed = [k for k, v in results.items() if v["status"] == "processed"]
    print(f"Processed: {processed or 'none'}")
    print(f"Pending download: {pending or 'none'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
