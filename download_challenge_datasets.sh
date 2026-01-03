#!/bin/bash
# Download challenging infrastructure datasets for model stress testing
# These datasets contain difficult conditions: fog, night, damaged insulators, etc.

echo "=========================================="
echo "CHALLENGING INFRASTRUCTURE DATASETS"
echo "=========================================="

mkdir -p /home/user/BAHB/external_datasets
cd /home/user/BAHB/external_datasets

echo ""
echo "1. CPLID - Chinese Power Line Insulator Dataset"
echo "   Source: https://github.com/InsulatorData/InsulatorDataSet"
echo "   Contains: 600 normal + 248 defective insulator images"
echo ""
if [ ! -d "InsulatorDataSet" ]; then
    git clone https://github.com/InsulatorData/InsulatorDataSet.git
    echo "   [DOWNLOADED] CPLID dataset"
else
    echo "   [EXISTS] CPLID dataset already downloaded"
fi

echo ""
echo "2. Public Insulator Datasets (UPID unified)"
echo "   Source: https://github.com/heitorcfelix/public-insulator-datasets"
echo "   Contains: Merged datasets with augmentations"
echo ""
if [ ! -d "public-insulator-datasets" ]; then
    git clone https://github.com/heitorcfelix/public-insulator-datasets.git
    echo "   [DOWNLOADED] Public insulator datasets"
else
    echo "   [EXISTS] Public insulator datasets already downloaded"
fi

echo ""
echo "3. CPMID - Complex Power-grid Multi-scenario Insulator Dataset"
echo "   Source: https://github.com/RALabJieSun/Complex-Power-grid-Multi-scenario-Insulator-Dataset"
echo "   Contains: Multi-scenario challenging conditions"
echo ""
if [ ! -d "Complex-Power-grid-Multi-scenario-Insulator-Dataset" ]; then
    git clone https://github.com/RALabJieSun/Complex-Power-grid-Multi-scenario-Insulator-Dataset.git
    echo "   [DOWNLOADED] CPMID dataset"
else
    echo "   [EXISTS] CPMID dataset already downloaded"
fi

echo ""
echo "=========================================="
echo "ADDITIONAL DATASETS (require manual download):"
echo "=========================================="
echo ""
echo "Kaggle Datasets (need Kaggle API):"
echo "  - Insulator-DET: kaggle datasets download mazilishanglx/insulator-det"
echo "  - IDID Dataset: kaggle datasets download mazilishanglx/idid-dataset"
echo "  - CPLID Extended: kaggle datasets download mazilishanglx/cplid-dcplid-n"
echo ""
echo "IEEE DataPort (need IEEE account):"
echo "  - https://ieee-dataport.org/open-access/insulator-data-set-chinese-power-line-insulator-dataset-cplid"
echo ""

echo "=========================================="
echo "Dataset download complete!"
echo "Location: /home/user/BAHB/external_datasets"
ls -la /home/user/BAHB/external_datasets/
echo "=========================================="
