"""Data center infrastructure detection using satellite and drone imagery.

Based on competitive intelligence from:
- Epoch AI Frontier Data Centers Hub methodology
- SatVu thermal imaging capabilities
- Planet Labs/Maxar optical detection patterns

Implements specialized detection for:
- Cooling infrastructure (chillers, cooling towers, dry coolers)
- Power distribution (substations, transformers, generators)
- Construction phases (site prep, foundation, structural, MEP, commissioning)
- Facility classification (hyperscale, colocation, edge, enterprise)
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional

import numpy as np
from numpy.typing import NDArray
from loguru import logger

from bahb.core.types import BoundingBox, Detection, GeoLocation


class FacilityType(Enum):
    """Data center facility type classification."""
    HYPERSCALE = "hyperscale"          # 100+ MW (Google, Meta, Microsoft, AWS)
    COLOCATION = "colocation"          # 10-100 MW (Equinix, Digital Realty)
    EDGE = "edge"                      # 1-10 MW (regional/metro)
    ENTERPRISE = "enterprise"          # <1 MW (corporate on-premise)
    AI_TRAINING = "ai_training"        # Specialized AI compute (xAI, OpenAI)
    CRYPTO_MINING = "crypto_mining"    # Bitcoin/crypto operations
    UNKNOWN = "unknown"


class CoolingType(Enum):
    """Cooling infrastructure type."""
    CHILLER = "chiller"                # Air-cooled chillers
    COOLING_TOWER = "cooling_tower"    # Evaporative cooling towers
    DRY_COOLER = "dry_cooler"          # Dry/hybrid coolers
    CRAC = "crac"                      # Computer room AC
    CRAH = "crah"                      # Computer room air handler
    LIQUID_COOLING = "liquid_cooling"  # Direct liquid cooling
    IMMERSION = "immersion"            # Immersion cooling tanks


class PowerInfraType(Enum):
    """Power infrastructure type."""
    SUBSTATION = "substation"          # Utility substation
    TRANSFORMER = "transformer"        # Power transformers
    GENERATOR = "generator"            # Backup generators
    UPS = "ups"                        # UPS systems
    SWITCHGEAR = "switchgear"          # Electrical switchgear
    PDU = "pdu"                        # Power distribution units
    SOLAR_ARRAY = "solar_array"        # On-site solar generation
    BATTERY_STORAGE = "battery_storage"  # Grid-scale batteries


@dataclass
class CoolingUnit:
    """Detected cooling infrastructure unit."""
    id: str
    type: CoolingType
    bbox: BoundingBox
    confidence: float
    estimated_capacity_mw: float
    location: Optional[GeoLocation] = None
    thermal_signature: Optional[float] = None  # Operating temperature
    operational_status: str = "unknown"  # active, idle, maintenance


@dataclass
class PowerUnit:
    """Detected power infrastructure unit."""
    id: str
    type: PowerInfraType
    bbox: BoundingBox
    confidence: float
    estimated_capacity_mva: float
    location: Optional[GeoLocation] = None
    thermal_signature: Optional[float] = None


@dataclass
class DataCenterFacility:
    """Complete data center facility analysis."""
    id: str
    name: Optional[str] = None
    facility_type: FacilityType = FacilityType.UNKNOWN
    location: Optional[GeoLocation] = None

    # Infrastructure counts
    cooling_units: list[CoolingUnit] = field(default_factory=list)
    power_units: list[PowerUnit] = field(default_factory=list)
    building_count: int = 0

    # Capacity estimates
    estimated_power_mw: float = 0.0
    estimated_it_load_mw: float = 0.0
    estimated_cooling_capacity_mw: float = 0.0
    estimated_pue: float = 1.4  # Default industry average

    # AI compute estimates (H100-equivalent)
    estimated_gpu_count: int = 0
    estimated_compute_pflops: float = 0.0

    # Financial estimates
    estimated_capital_cost_usd: float = 0.0
    estimated_opex_annual_usd: float = 0.0

    # Construction status
    construction_phase: str = "operational"
    completion_percentage: float = 100.0

    # Timestamps
    first_observed: Optional[datetime] = None
    last_updated: Optional[datetime] = None

    # Confidence metrics
    confidence_score: float = 0.0
    data_sources: list[str] = field(default_factory=list)


class DataCenterDetector:
    """
    Specialized detector for data center infrastructure.

    Uses multi-spectral analysis combining:
    - Optical imagery for structural detection
    - Thermal imagery for operational status
    - SAR for all-weather monitoring

    Methodology based on Epoch AI's Frontier Data Centers Hub:
    - Cooling capacity model for power estimation
    - AI chip model for compute estimation
    - Capital cost model for investment tracking
    """

    # Cooling capacity estimates (MW per unit type)
    COOLING_CAPACITY_MW = {
        CoolingType.CHILLER: 1.5,          # Large air-cooled chiller
        CoolingType.COOLING_TOWER: 2.0,    # Evaporative tower cell
        CoolingType.DRY_COOLER: 0.8,       # Dry cooler unit
        CoolingType.CRAC: 0.1,             # Room-level AC
        CoolingType.CRAH: 0.2,             # Room-level handler
        CoolingType.LIQUID_COOLING: 0.5,   # Per rack
        CoolingType.IMMERSION: 0.3,        # Per tank
    }

    # Power infrastructure capacity (MVA per unit)
    POWER_CAPACITY_MVA = {
        PowerInfraType.SUBSTATION: 50.0,
        PowerInfraType.TRANSFORMER: 10.0,
        PowerInfraType.GENERATOR: 2.5,
        PowerInfraType.UPS: 1.0,
        PowerInfraType.SWITCHGEAR: 5.0,
        PowerInfraType.PDU: 0.5,
        PowerInfraType.SOLAR_ARRAY: 0.1,   # Per panel group
        PowerInfraType.BATTERY_STORAGE: 2.0,
    }

    # Detection class mappings from YOLO model
    CLASS_MAPPINGS = {
        # Cooling
        "chiller": CoolingType.CHILLER,
        "cooling_tower": CoolingType.COOLING_TOWER,
        "dry_cooler": CoolingType.DRY_COOLER,
        "hvac_unit": CoolingType.CRAC,
        "air_handler": CoolingType.CRAH,
        "cooling_fan": CoolingType.DRY_COOLER,

        # Power
        "transformer": PowerInfraType.TRANSFORMER,
        "substation": PowerInfraType.SUBSTATION,
        "generator": PowerInfraType.GENERATOR,
        "switchgear": PowerInfraType.SWITCHGEAR,
        "solar_panel": PowerInfraType.SOLAR_ARRAY,
        "battery_container": PowerInfraType.BATTERY_STORAGE,
    }

    def __init__(
        self,
        cooling_overhead: float = 0.85,
        peak_pue: float = 1.4,
        default_h100_power_kw: float = 0.7,
        capital_cost_per_gw: float = 44e9,
    ):
        """
        Initialize data center detector.

        Args:
            cooling_overhead: Cooling efficiency factor (default 0.85)
            peak_pue: Peak Power Usage Effectiveness (default 1.4)
            default_h100_power_kw: Power per H100-equivalent GPU (0.7 kW)
            capital_cost_per_gw: $ per GW of server power ($44B default)
        """
        self.cooling_overhead = cooling_overhead
        self.peak_pue = peak_pue
        self.h100_power_kw = default_h100_power_kw
        self.capital_cost_per_gw = capital_cost_per_gw

        # H100 performance metrics
        self.h100_fp16_tflops = 1979  # FP16 tensor TFLOPS
        self.h100_fp8_tflops = 3958   # FP8 tensor TFLOPS

        # Detection history for tracking
        self._facility_history: dict[str, DataCenterFacility] = {}

        logger.info("DataCenterDetector initialized with Epoch AI methodology")

    def analyze_facility(
        self,
        detections: list[Detection],
        thermal_data: Optional[NDArray] = None,
        location: Optional[GeoLocation] = None,
        facility_id: Optional[str] = None,
    ) -> DataCenterFacility:
        """
        Analyze detected infrastructure to characterize a data center facility.

        Uses Epoch AI's methodology:
        1. Count and classify cooling units
        2. Estimate power capacity from cooling
        3. Estimate IT load and compute capacity
        4. Calculate capital costs

        Args:
            detections: YOLO detections from imagery
            thermal_data: Optional thermal imagery for operational analysis
            location: Geographic location
            facility_id: Optional ID for tracking over time

        Returns:
            DataCenterFacility with comprehensive analysis
        """
        facility_id = facility_id or str(uuid.uuid4())[:8]

        # Classify detections into cooling and power infrastructure
        cooling_units = []
        power_units = []

        for det in detections:
            class_name = det.class_name.lower()

            # Check if it's cooling infrastructure
            if class_name in self.CLASS_MAPPINGS:
                mapped_type = self.CLASS_MAPPINGS[class_name]

                if isinstance(mapped_type, CoolingType):
                    capacity = self.COOLING_CAPACITY_MW.get(mapped_type, 0.5)

                    # Adjust capacity based on detection size (larger = more capacity)
                    size_factor = self._estimate_size_factor(det.bbox)
                    adjusted_capacity = capacity * size_factor

                    cooling_unit = CoolingUnit(
                        id=f"cool_{len(cooling_units):03d}",
                        type=mapped_type,
                        bbox=det.bbox,
                        confidence=det.confidence,
                        estimated_capacity_mw=adjusted_capacity,
                        location=location,
                    )

                    # Add thermal signature if available
                    if thermal_data is not None:
                        cooling_unit.thermal_signature = self._get_thermal_signature(
                            thermal_data, det.bbox
                        )
                        cooling_unit.operational_status = self._assess_operational_status(
                            cooling_unit.thermal_signature, mapped_type
                        )

                    cooling_units.append(cooling_unit)

                elif isinstance(mapped_type, PowerInfraType):
                    capacity = self.POWER_CAPACITY_MVA.get(mapped_type, 1.0)
                    size_factor = self._estimate_size_factor(det.bbox)

                    power_unit = PowerUnit(
                        id=f"pwr_{len(power_units):03d}",
                        type=mapped_type,
                        bbox=det.bbox,
                        confidence=det.confidence,
                        estimated_capacity_mva=capacity * size_factor,
                        location=location,
                    )

                    if thermal_data is not None:
                        power_unit.thermal_signature = self._get_thermal_signature(
                            thermal_data, det.bbox
                        )

                    power_units.append(power_unit)

        # Calculate capacity estimates using Epoch AI's cooling capacity model
        total_cooling_capacity = sum(u.estimated_capacity_mw for u in cooling_units)

        # Epoch AI formula: Total Facility Power = (Cooling Capacity / Overhead) × Peak PUE
        estimated_facility_power = (total_cooling_capacity / self.cooling_overhead) * self.peak_pue

        # IT load is typically 60-70% of total facility power (accounting for cooling overhead)
        estimated_it_load = estimated_facility_power / self.peak_pue

        # GPU count estimation using Epoch AI's AI chip model
        # Assuming modern AI data center with high GPU density
        gpu_count = int((estimated_it_load * 1000) / self.h100_power_kw)

        # Compute capacity in PFLOPS (FP16)
        compute_pflops = (gpu_count * self.h100_fp16_tflops) / 1000

        # Capital cost using Epoch AI's $44B/GW methodology
        # Server power (GW) → Total cost
        server_power_gw = estimated_it_load / 1000
        capital_cost = server_power_gw * self.capital_cost_per_gw

        # Operational cost estimate (rough: $50/MWh × 8760 hours × PUE)
        electricity_rate = 50  # $/MWh
        annual_opex = estimated_facility_power * electricity_rate * 8760

        # Determine facility type based on power capacity
        facility_type = self._classify_facility_type(estimated_facility_power, gpu_count)

        # Calculate confidence based on detection quality
        if cooling_units or power_units:
            avg_confidence = np.mean(
                [u.confidence for u in cooling_units] +
                [u.confidence for u in power_units]
            )
        else:
            avg_confidence = 0.0

        facility = DataCenterFacility(
            id=facility_id,
            facility_type=facility_type,
            location=location,
            cooling_units=cooling_units,
            power_units=power_units,
            building_count=self._estimate_building_count(detections),
            estimated_power_mw=estimated_facility_power,
            estimated_it_load_mw=estimated_it_load,
            estimated_cooling_capacity_mw=total_cooling_capacity,
            estimated_pue=self.peak_pue,
            estimated_gpu_count=gpu_count,
            estimated_compute_pflops=compute_pflops,
            estimated_capital_cost_usd=capital_cost,
            estimated_opex_annual_usd=annual_opex,
            first_observed=datetime.now(),
            last_updated=datetime.now(),
            confidence_score=avg_confidence,
            data_sources=["optical", "thermal"] if thermal_data is not None else ["optical"],
        )

        # Store in history for tracking
        self._facility_history[facility_id] = facility

        logger.info(
            f"Facility {facility_id} analyzed: {facility_type.value}, "
            f"{estimated_facility_power:.1f} MW, {gpu_count:,} GPUs, "
            f"${capital_cost/1e9:.2f}B capital"
        )

        return facility

    def _estimate_size_factor(self, bbox: BoundingBox) -> float:
        """Estimate equipment size factor from bounding box."""
        area = bbox.width * bbox.height
        # Normalize to typical equipment size (10000 sq pixels = 1.0)
        return max(0.5, min(3.0, area / 10000))

    def _get_thermal_signature(
        self,
        thermal_data: NDArray,
        bbox: BoundingBox,
    ) -> float:
        """Extract thermal signature for a detected region."""
        x1, y1 = int(max(0, bbox.x1)), int(max(0, bbox.y1))
        x2 = int(min(thermal_data.shape[1], bbox.x2))
        y2 = int(min(thermal_data.shape[0], bbox.y2))

        if x2 <= x1 or y2 <= y1:
            return 0.0

        region = thermal_data[y1:y2, x1:x2]
        return float(np.mean(region))

    def _assess_operational_status(
        self,
        thermal_signature: float,
        cooling_type: CoolingType,
    ) -> str:
        """Assess operational status from thermal signature."""
        # Thresholds based on SatVu thermal analysis research
        thresholds = {
            CoolingType.CHILLER: (25, 45),      # Active range
            CoolingType.COOLING_TOWER: (20, 40),
            CoolingType.DRY_COOLER: (25, 50),
            CoolingType.CRAC: (15, 30),
            CoolingType.CRAH: (15, 30),
        }

        low, high = thresholds.get(cooling_type, (20, 40))

        if thermal_signature < low:
            return "idle"
        elif thermal_signature > high:
            return "high_load"
        else:
            return "active"

    def _classify_facility_type(
        self,
        power_mw: float,
        gpu_count: int,
    ) -> FacilityType:
        """Classify facility type based on capacity."""
        if power_mw >= 100:
            # Check if AI-focused (high GPU density)
            if gpu_count > 50000:
                return FacilityType.AI_TRAINING
            return FacilityType.HYPERSCALE
        elif power_mw >= 10:
            return FacilityType.COLOCATION
        elif power_mw >= 1:
            return FacilityType.EDGE
        else:
            return FacilityType.ENTERPRISE

    def _estimate_building_count(self, detections: list[Detection]) -> int:
        """Estimate number of data hall buildings from detections."""
        building_classes = {"building", "data_hall", "facility", "warehouse"}
        buildings = [d for d in detections if d.class_name.lower() in building_classes]
        return max(1, len(buildings))

    def track_facility_changes(
        self,
        facility_id: str,
        new_analysis: DataCenterFacility,
    ) -> dict:
        """
        Track changes in facility over time.

        Returns change analysis comparing current state to history.
        """
        if facility_id not in self._facility_history:
            return {"status": "new", "changes": []}

        previous = self._facility_history[facility_id]
        changes = []

        # Power capacity change
        power_delta = new_analysis.estimated_power_mw - previous.estimated_power_mw
        if abs(power_delta) > 5:  # >5 MW change is significant
            changes.append({
                "metric": "power_capacity",
                "previous": previous.estimated_power_mw,
                "current": new_analysis.estimated_power_mw,
                "delta": power_delta,
                "percentage": (power_delta / previous.estimated_power_mw * 100)
                              if previous.estimated_power_mw > 0 else 0,
            })

        # Cooling unit count change
        cooling_delta = len(new_analysis.cooling_units) - len(previous.cooling_units)
        if cooling_delta != 0:
            changes.append({
                "metric": "cooling_units",
                "previous": len(previous.cooling_units),
                "current": len(new_analysis.cooling_units),
                "delta": cooling_delta,
            })

        # GPU count change
        gpu_delta = new_analysis.estimated_gpu_count - previous.estimated_gpu_count
        if abs(gpu_delta) > 1000:
            changes.append({
                "metric": "gpu_count",
                "previous": previous.estimated_gpu_count,
                "current": new_analysis.estimated_gpu_count,
                "delta": gpu_delta,
            })

        # Update history
        self._facility_history[facility_id] = new_analysis

        return {
            "status": "updated",
            "facility_id": facility_id,
            "time_delta": (new_analysis.last_updated - previous.last_updated).total_seconds()
                          if previous.last_updated else 0,
            "changes": changes,
            "expansion_detected": power_delta > 10 or cooling_delta > 2,
        }

    def generate_facility_report(self, facility: DataCenterFacility) -> dict:
        """Generate comprehensive facility analysis report."""
        return {
            "summary": {
                "facility_id": facility.id,
                "facility_type": facility.facility_type.value,
                "location": facility.location.to_dict() if facility.location else None,
                "confidence": f"{facility.confidence_score:.1%}",
            },
            "infrastructure": {
                "cooling_units": len(facility.cooling_units),
                "power_units": len(facility.power_units),
                "buildings": facility.building_count,
                "cooling_types": list(set(u.type.value for u in facility.cooling_units)),
                "power_types": list(set(u.type.value for u in facility.power_units)),
            },
            "capacity_estimates": {
                "total_facility_power_mw": round(facility.estimated_power_mw, 1),
                "it_load_mw": round(facility.estimated_it_load_mw, 1),
                "cooling_capacity_mw": round(facility.estimated_cooling_capacity_mw, 1),
                "pue": facility.estimated_pue,
            },
            "compute_estimates": {
                "gpu_count_h100_equivalent": facility.estimated_gpu_count,
                "compute_capacity_pflops": round(facility.estimated_compute_pflops, 1),
                "percentage_global_ai_compute": round(
                    (facility.estimated_gpu_count / 16_000_000) * 100, 2
                ),  # ~16M H100e globally
            },
            "financial_estimates": {
                "capital_cost_usd": f"${facility.estimated_capital_cost_usd/1e9:.2f}B",
                "annual_opex_usd": f"${facility.estimated_opex_annual_usd/1e6:.1f}M",
                "cost_per_gpu": round(
                    facility.estimated_capital_cost_usd / max(1, facility.estimated_gpu_count)
                ),
            },
            "methodology": {
                "cooling_model": "Epoch AI Cooling Capacity Model",
                "power_formula": "Total = (Cooling / Overhead) × Peak PUE",
                "capital_model": "$44B per GW server power",
                "accuracy": "±50% (80% confidence within 1.5× factor)",
            },
            "timestamps": {
                "first_observed": facility.first_observed.isoformat()
                                  if facility.first_observed else None,
                "last_updated": facility.last_updated.isoformat()
                                if facility.last_updated else None,
            },
            "data_sources": facility.data_sources,
        }
