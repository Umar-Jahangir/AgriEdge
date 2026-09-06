#!/usr/bin/env python3
"""CLI entry point for dataset preparation scripts."""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

# Ensure repo root is on path
REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

from ai.datasets.registry import PREPARERS

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("prepare_dataset")


def main():
    parser = argparse.ArgumentParser(description="Prepare an AgriEdge Rover dataset")
    parser.add_argument(
        "dataset",
        choices=list(PREPARERS.keys()),
        help="Dataset key to prepare",
    )
    parser.add_argument("--input", type=Path, default=None, help="Override raw input path")
    parser.add_argument("--output", type=Path, default=None, help="Override processed output path")
    parser.add_argument(
        "--copy-files",
        action="store_true",
        help="Copy/symlink images into processed directory (default: manifests only)",
    )
    parser.add_argument("--summary", action="store_true", help="Print JSON summary after preparation")
    args = parser.parse_args()

    preparer_cls = PREPARERS[args.dataset]
    preparer = preparer_cls(input_path=args.input, output_path=args.output)
    result = preparer.prepare(copy_files=args.copy_files)

    status = "OK" if result.success else "FAILED"
    logger.info("[%s] %s: %s", status, args.dataset, result.message)

    if args.summary or not result.success:
        print(json.dumps(result.metadata.to_summary_dict(), indent=2))

    return 0 if result.success else 1


if __name__ == "__main__":
    raise SystemExit(main())
