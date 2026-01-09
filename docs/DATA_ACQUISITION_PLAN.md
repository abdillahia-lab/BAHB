# BAHB Power Infrastructure Data Acquisition Plan

## Executive Summary

This document outlines verified sources and strategies for acquiring additional training imagery for the BAHB power infrastructure detection model. Target categories include:
- **Data Centers**
- **Cooling Towers**
- **Substations**
- **Generators**

---

## 1. Verified Government & Research Sources

### 1.1 Department of Energy (DOE)

| Resource | URL | Data Type |
|----------|-----|-----------|
| DOE Data Explorer | https://www.osti.gov/dataexplorer/ | Research datasets |
| Open Energy Data | https://www.energy.gov/data/open-energy-data | Energy infrastructure data |
| Data.gov DOE Section | https://catalog.data.gov/organization/doe-gov | Federal datasets |
| US Energy Atlas | https://atlas.eia.gov/ | Geospatial energy data |

**Note:** DOE primarily provides geospatial/location data rather than imagery. Use coordinates to extract imagery from satellite sources.

### 1.2 HIFLD (Homeland Infrastructure Foundation-Level Data)

| Resource | URL | Access Level |
|----------|-----|--------------|
| HIFLD Open Data | https://hifld-geoplatform.opendata.arcgis.com/ | Public |
| HIFLD Secure | Via DHS GII Portal | Requires DUA approval |

**Available Datasets:**
- Electric Power Transmission Lines
- Electric Substations (location data)
- Electric Retail Service Territories

**Download Formats:** CSV, KML, Shapefile, GeoJSON, GeoTIFF

### 1.3 NREL (National Renewable Energy Laboratory)

| Resource | URL | Description |
|----------|-----|-------------|
| NREL Data Catalog | https://data.nrel.gov/ | DOE-funded research data |
| Grid Data Tools | https://www.nrel.gov/grid/grid-data-tools | Grid infrastructure models |
| NREL GitHub | https://github.com/nrel | Open source tools |

**Key Datasets:**
- Distribution Grid Atlas
- SMART-DS (Synthetic Models for Advanced Testing)
- Reliability Test System datasets

---

## 2. Academic & Research Datasets

### 2.1 Substation Equipment Datasets

| Dataset | Source | Size | Format |
|---------|--------|------|--------|
| **15-class Substation Dataset** | [Figshare](https://figshare.com/articles/dataset/A_YOLO_Annotated_15-class_Ground_Truth_Dataset_for_Substation_Equipment/24060960) | 7,539 images, 213,566 annotations | YOLO |
| Electrical Substation Objects | [Roboflow](https://universe.roboflow.com/object-detection-wfvzt/electrical-substation-objects) | 30 images | Multiple formats |
| Substation Equipment Det-2 | [Roboflow](https://universe.roboflow.com/substation-equipment-florence2-datasets/substation-equipment-det-2/) | 335 images | Instance segmentation |

### 2.2 Cooling Tower Datasets

| Dataset | Source | Description |
|---------|--------|-------------|
| **TowerScout** | [GitHub](https://github.com/TowerScout/TowerScout) | Cooling tower detection from aerial/satellite imagery |
| Lancet Study Dataset | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2589750024000943) | 2,051 images, 7,292 annotated cooling towers |

**TowerScout Details:**
- UC Berkeley project (Hal Varian Award Winner 2021)
- Used in 12+ Legionnaires' disease outbreak investigations
- Validated by Utah DHHS and LA County

### 2.3 Power Plant & Generator Datasets

| Dataset | Source | Size | Classes |
|---------|--------|------|---------|
| Wind Turbine Detection | [Figshare](https://figshare.com/projects/Object_Detection_Dataset_for_Overhead_Images_of_Wind_Turbines/86861) | 1,742 images | Wind turbines (YOLOv3) |
| Power Plants Damage Detection | [Dataset Ninja](https://datasetninja.com/power-plants-damage-detection) | 431+ images | Turbines, solar panels |
| Electric Pylon Detection | Research | 1,500 images | Electric pylons |

---

## 3. Satellite Imagery Sources

### 3.1 Free/Open Sources

| Platform | Resolution | Coverage | Access |
|----------|------------|----------|--------|
| **Google Earth Engine** | 10-30m | Global | Free for research |
| **Sentinel-2** | 10-60m | Global, 5-day revisit | Free (ESA) |
| **Landsat 8/9** | 30m | Global | Free (USGS) |
| **Sentinel Hub** | Multiple | Global | Free tier available |
| **NAIP** | 1m | US only | Free |

### 3.2 Commercial Sources (Higher Resolution)

| Provider | Resolution | Notes |
|----------|------------|-------|
| Maxar | 30cm | Premium pricing |
| Planet | 3-5m | Daily imagery |
| Nearmap | 5-7cm | Urban areas |

### 3.3 Data Center Imagery

| Source | Description |
|--------|-------------|
| **Epoch AI Data Centers** | https://epoch.ai/data/data-centers |
| Tracks AI data center construction via satellite imagery |
| Includes location, owner, power estimates, cooling equipment |

---

## 4. OpenStreetMap Infrastructure Extraction

### 4.1 Available Power Infrastructure Tags

```
power=substation     - 1+ million globally mapped
power=generator      - Generators
power=plant          - Power plants
man_made=cooling_tower - Cooling towers
power=transformer    - Transformers
power=line           - Transmission lines (7M+ km mapped)
```

### 4.2 Extraction Tools

| Tool | Purpose | URL |
|------|---------|-----|
| **Open Infrastructure Map** | Visualization | https://openinframap.org/ |
| **earth-osm** | Python extraction API | GitHub |
| **OSMnx** | Python extraction | pip install osmnx |
| **Overpass API** | Query OSM data | https://overpass-turbo.eu/ |

### 4.3 Extraction Strategy

1. Query OSM for infrastructure locations
2. Extract coordinates for substations, cooling towers, generators
3. Use coordinates to download satellite imagery tiles
4. Manual verification and annotation

---

## 5. Data Acquisition Pipeline

### Phase 1: Location Data Collection (Week 1-2)

```python
# Example: Extract substation locations from OSM
import osmnx as ox

# Get substations in target area
tags = {'power': 'substation'}
substations = ox.features_from_place("California, USA", tags)

# Get cooling towers
tags = {'man_made': 'cooling_tower'}
cooling_towers = ox.features_from_place("California, USA", tags)
```

### Phase 2: Imagery Extraction (Week 2-4)

```python
# Example: Download Sentinel-2 imagery via Google Earth Engine
import ee
ee.Initialize()

# Define area of interest from coordinates
aoi = ee.Geometry.Point([lon, lat]).buffer(500)

# Get Sentinel-2 imagery
s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
    .filterBounds(aoi) \
    .filterDate('2024-01-01', '2024-12-31') \
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
```

### Phase 3: Annotation (Week 4-6)

- Use Roboflow for collaborative annotation
- CVAT for self-hosted annotation
- Label Studio as alternative

### Phase 4: Dataset Integration (Week 6-8)

- Merge with existing BAHB dataset
- Validate annotations
- Split train/val/test
- Retrain model

---

## 6. Recommended Priority Actions

### Immediate (High Impact, Low Effort)

1. **Download Figshare 15-class Substation Dataset**
   - 7,539 images, YOLO-ready
   - Direct compatibility with current pipeline

2. **Clone TowerScout Repository**
   - Pre-trained cooling tower detection
   - Extract training data approach

3. **Access Roboflow Datasets**
   - Electrical Substation Objects
   - Substation Equipment Det-2

### Short-term (2-4 weeks)

4. **OSM + Satellite Pipeline**
   - Extract 500+ substation locations
   - Download corresponding Sentinel-2/NAIP imagery
   - Manual annotation

5. **HIFLD Integration**
   - Download transmission line data
   - Cross-reference with imagery

### Medium-term (1-2 months)

6. **Data Center Imagery**
   - Use Epoch AI database for locations
   - Manual satellite imagery collection
   - Annotate cooling systems, generators

7. **Partner Outreach**
   - Contact utility companies for imagery access
   - Academic collaboration opportunities

---

## 7. Target Dataset Expansion

| Category | Current | Target | Sources |
|----------|---------|--------|---------|
| Substations | ~200 | 1,000+ | Figshare, OSM+Satellite |
| Cooling Towers | 0 | 500+ | TowerScout, OSM |
| Generators | ~100 | 500+ | Wind turbine datasets, OSM |
| Data Centers | 0 | 200+ | Epoch AI, Manual |
| Transformers | ~300 | 800+ | Figshare, Roboflow |

---

## 8. References

### Government Sources
- [DOE Open Energy Data](https://www.energy.gov/data/open-energy-data)
- [HIFLD Open Data](https://hifld-geoplatform.opendata.arcgis.com/)
- [CISA Infrastructure Datasets](https://www.cisa.gov/resources-tools/resources/mapping-your-infrastructure-datasets-infrastructure-identification)
- [US Energy Atlas](https://atlas.eia.gov/)

### Research Datasets
- [Figshare Substation Dataset](https://figshare.com/articles/dataset/A_YOLO_Annotated_15-class_Ground_Truth_Dataset_for_Substation_Equipment/24060960)
- [TowerScout GitHub](https://github.com/TowerScout/TowerScout)
- [Wind Turbine Dataset](https://figshare.com/projects/Object_Detection_Dataset_for_Overhead_Images_of_Wind_Turbines/86861)

### Satellite Imagery
- [Google Earth Engine](https://earthengine.google.com/)
- [Sentinel Hub](https://www.sentinel-hub.com/)
- [NREL Data Catalog](https://data.nrel.gov/)

### Tools
- [Open Infrastructure Map](https://openinframap.org/)
- [Roboflow Universe](https://universe.roboflow.com/)
- [Overpass Turbo](https://overpass-turbo.eu/)

---

*Document created: 2026-01-08*
*BAHB Power Infrastructure Detection Project*
