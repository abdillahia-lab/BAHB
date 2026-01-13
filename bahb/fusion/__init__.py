"""Multi-spectral data fusion engine.

Combines multiple data sources for comprehensive infrastructure monitoring:
- Optical imagery (Planet Labs, Maxar style)
- Thermal imaging (SatVu style)
- SAR radar (Capella/ICEYE style)
- IoT sensor data

Enables 24/7/365 monitoring regardless of weather or lighting conditions.
"""

from bahb.fusion.engine import MultiSpectralFusionEngine, FusedAnalysis
from bahb.fusion.sources import DataSource, SourceType, SourceConfig
from bahb.fusion.alignment import SpatialAligner, TemporalAligner

__all__ = [
    "MultiSpectralFusionEngine",
    "FusedAnalysis",
    "DataSource",
    "SourceType",
    "SourceConfig",
    "SpatialAligner",
    "TemporalAligner",
]
