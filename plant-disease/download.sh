#!/bin/bash
set -u
R=/workspace/plant-disease/raw
cd $R
echo "[1/4] PlantVillage data.zip (2.1GB)"
curl -sL -o plantvillage.zip "https://huggingface.co/datasets/mohanty/PlantVillage/resolve/main/data.zip" && echo "  pv done $(du -h plantvillage.zip|cut -f1)"
mkdir -p pv_meta
for f in color_train color_test segmented_train segmented_test; do
  curl -sL -o pv_meta/$f.txt "https://huggingface.co/datasets/mohanty/PlantVillage/resolve/main/splits/$f.txt"
done
curl -sL -o pv_meta/leaf-map.json "https://huggingface.co/datasets/mohanty/PlantVillage/resolve/main/leaf_grouping/leaf-map.json"
echo "  pv meta done"
echo "[2/4] PlantDoc"
curl -sL -o plantdoc.zip "https://codeload.github.com/pratikkayal/PlantDoc-Dataset/zip/refs/heads/master" && echo "  plantdoc done $(du -h plantdoc.zip|cut -f1)"
echo "[3/4] Maize nutrient deficiency (512MB)"
curl -sL -o maize_nutrient.zip "https://data.mendeley.com/public-files/datasets/g7xnn2bm4g/files/0caeb722-2a0e-4690-9f23-84f3230f2218/file_downloaded" && echo "  maize done $(du -h maize_nutrient.zip|cut -f1)"
echo "ALL DONE"
