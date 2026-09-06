#!/usr/bin/env python3
"""Inspect disease dataset labels and document PlantDoc↔PlantVillage mapping."""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO))

from ai.disease.dataset import (  # noqa: E402
    assert_no_path_leakage,
    build_combined_split,
    build_label_mapping_document,
)
from ai.disease.label_mapping import EXCLUDED_PLANTDOC_CLASSES, PLANTDOC_TO_PLANTVILLAGE  # noqa: E402


def main() -> int:
    train, ts = build_combined_split("train")
    val, vs = build_combined_split("validation")
    test, es = build_combined_split("test")
    leakage = assert_no_path_leakage(train, val, test)
    doc = build_label_mapping_document(
        train,
        val,
        test,
        {
            "train": ts["plantdoc_stats"],
            "validation": vs["plantdoc_stats"],
            "test": es["plantdoc_stats"],
        },
    )
    doc["leakage_check"] = leakage
    doc["mapping_table"] = PLANTDOC_TO_PLANTVILLAGE
    doc["excluded"] = EXCLUDED_PLANTDOC_CLASSES

    out = REPO / "docs" / "disease_label_mapping.json"
    out.write_text(json.dumps(doc, indent=2), encoding="utf-8")
    print(json.dumps({
        "num_classes": doc["num_classes"],
        "split_counts": doc["split_counts"],
        "source_counts": doc["source_counts"],
        "leakage_ok": leakage["ok"],
        "plantdoc_mapped_train": ts["plantdoc_mapped_count"],
        "wrote": str(out),
    }, indent=2))
    if not leakage["ok"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
