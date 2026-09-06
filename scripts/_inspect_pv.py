#!/usr/bin/env python3
"""Quick inspect of PlantVillage GitHub clone for real images vs LFS pointers."""
from pathlib import Path

pv = Path(r"E:\Hackathon\21SIH2026\Project\agriedge-rover\data\external\archives\PlantVillage-Dataset")
print("exists", pv.exists())
if not pv.exists():
    raise SystemExit(1)
print("top:", [p.name for p in pv.iterdir()][:30])
# Find any jpg > 1KB
count = 0
lfs = 0
samples = []
for p in pv.rglob("*"):
    if not p.is_file():
        continue
    if p.suffix.lower() in {".jpg", ".jpeg", ".png"}:
        sz = p.stat().st_size
        if sz < 200:
            # possible LFS pointer
            try:
                head = p.read_text(errors="ignore")[:80]
                if "git-lfs" in head or "oid sha256" in head:
                    lfs += 1
                    continue
            except Exception:
                pass
        count += 1
        if len(samples) < 5:
            samples.append((str(p.relative_to(pv)), sz))
print("real_images_approx", count)
print("lfs_pointers_approx", lfs)
print("samples", samples)
