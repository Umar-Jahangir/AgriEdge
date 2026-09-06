# Own Field / Rover Dataset — Placeholder Structure

**Status:** STRUCTURE ONLY — no images fabricated.

This dataset will be collected later using the physical AgriEdge Rover
(Raspberry Pi camera + ESP32 sensors + zone metadata).

## Directories

```
data/own/
├── images/          # Crop/leaf/field captures from Pi camera
├── annotations/     # Human labels / bounding boxes (future)
├── metadata/        # zone_id, timestamp, sensor reading links
├── raw/             # Unprocessed field dumps
└── processed/       # Training-ready samples after labeling
```

## Intended metadata schema (per sample)

```json
{
  "id": "own-001",
  "timestamp": "ISO-8601",
  "zone_id": "ZONE_A",
  "image_path": "images/...",
  "sensor_reading_id": null,
  "human_label": null,
  "notes": null
}
```

Do not place synthetic/fake images here.
