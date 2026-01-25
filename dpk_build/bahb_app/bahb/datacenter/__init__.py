"""Data center infrastructure detection and analysis module.

Based on competitive intelligence from Epoch AI and SatVu research.
Implements:
- Specialized facility detection (cooling, power, construction)
- Power capacity estimation via cooling unit analysis
- Compute capacity modeling (H100-equivalent calculations)
- Construction phase classification
"""

from bahb.datacenter.detector import DataCenterDetector, FacilityType
from bahb.datacenter.capacity import CapacityEstimator, PowerEstimate
from bahb.datacenter.construction import ConstructionTracker, ConstructionPhase

__all__ = [
    "DataCenterDetector",
    "FacilityType",
    "CapacityEstimator",
    "PowerEstimate",
    "ConstructionTracker",
    "ConstructionPhase",
]
