"""Construction phase tracking for data center facilities.

Monitors construction progress from satellite/drone imagery using:
- Site preparation detection
- Foundation and structural analysis
- MEP (Mechanical/Electrical/Plumbing) installation tracking
- Commissioning indicators
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional

import numpy as np
from loguru import logger

from bahb.core.types import Detection, GeoLocation


class ConstructionPhase(Enum):
    """Data center construction phases."""
    PLANNING = "planning"              # Land acquisition, permits
    SITE_PREP = "site_preparation"     # Clearing, grading
    FOUNDATION = "foundation"          # Concrete, underground
    STRUCTURAL = "structural"          # Steel, building shell
    MEP_ROUGH = "mep_rough"           # Mechanical/electrical rough-in
    MEP_FINISH = "mep_finish"         # Final MEP installation
    COMMISSIONING = "commissioning"    # Testing, certifications
    OPERATIONAL = "operational"        # Live and running
    EXPANSION = "expansion"            # Adding capacity


@dataclass
class ConstructionMilestone:
    """Construction milestone observation."""
    phase: ConstructionPhase
    observed_date: datetime
    confidence: float
    indicators: list[str]
    location: Optional[GeoLocation] = None
    notes: str = ""


@dataclass
class ConstructionTimeline:
    """Timeline of construction progress."""
    facility_id: str
    milestones: list[ConstructionMilestone] = field(default_factory=list)
    current_phase: ConstructionPhase = ConstructionPhase.PLANNING
    completion_percentage: float = 0.0
    estimated_completion: Optional[datetime] = None
    construction_start: Optional[datetime] = None

    def add_milestone(self, milestone: ConstructionMilestone) -> None:
        """Add milestone and update current phase."""
        self.milestones.append(milestone)
        self.milestones.sort(key=lambda m: m.observed_date)

        # Update current phase to latest
        if milestone.phase.value > self.current_phase.value:
            self.current_phase = milestone.phase

        # Update completion percentage
        phase_percentages = {
            ConstructionPhase.PLANNING: 5,
            ConstructionPhase.SITE_PREP: 15,
            ConstructionPhase.FOUNDATION: 30,
            ConstructionPhase.STRUCTURAL: 50,
            ConstructionPhase.MEP_ROUGH: 70,
            ConstructionPhase.MEP_FINISH: 85,
            ConstructionPhase.COMMISSIONING: 95,
            ConstructionPhase.OPERATIONAL: 100,
        }
        self.completion_percentage = phase_percentages.get(self.current_phase, 0)


class ConstructionTracker:
    """
    Track data center construction progress from imagery.

    Analyzes visual indicators to determine construction phase:
    - Site prep: Cleared land, excavation equipment
    - Foundation: Concrete pads, underground utilities
    - Structural: Steel frames, building shell
    - MEP: Cooling equipment, electrical infrastructure
    - Commissioning: Operational indicators
    """

    # Detection indicators for each phase
    PHASE_INDICATORS = {
        ConstructionPhase.SITE_PREP: [
            "excavator", "bulldozer", "grader", "cleared_land",
            "construction_fence", "site_trailer",
        ],
        ConstructionPhase.FOUNDATION: [
            "concrete_pour", "rebar", "foundation_forms",
            "underground_utility", "concrete_truck",
        ],
        ConstructionPhase.STRUCTURAL: [
            "steel_frame", "crane", "building_shell",
            "roof_structure", "wall_panels",
        ],
        ConstructionPhase.MEP_ROUGH: [
            "hvac_ductwork", "electrical_conduit", "piping",
            "generator_pad", "transformer_pad",
        ],
        ConstructionPhase.MEP_FINISH: [
            "chiller", "cooling_tower", "transformer",
            "generator", "switchgear", "ups",
        ],
        ConstructionPhase.COMMISSIONING: [
            "active_cooling", "operational_chiller",
            "lit_building", "vehicle_activity",
        ],
        ConstructionPhase.OPERATIONAL: [
            "thermal_signature", "continuous_operation",
            "maintenance_vehicle", "delivery_truck",
        ],
    }

    # Typical duration for each phase (days)
    TYPICAL_PHASE_DURATION = {
        ConstructionPhase.PLANNING: 180,
        ConstructionPhase.SITE_PREP: 60,
        ConstructionPhase.FOUNDATION: 90,
        ConstructionPhase.STRUCTURAL: 120,
        ConstructionPhase.MEP_ROUGH: 90,
        ConstructionPhase.MEP_FINISH: 60,
        ConstructionPhase.COMMISSIONING: 30,
    }

    def __init__(self):
        self._timelines: dict[str, ConstructionTimeline] = {}
        self._observation_history: dict[str, list[dict]] = {}

    def analyze_construction_phase(
        self,
        detections: list[Detection],
        thermal_active: bool = False,
        location: Optional[GeoLocation] = None,
    ) -> tuple[ConstructionPhase, float, list[str]]:
        """
        Determine construction phase from detected objects.

        Args:
            detections: Object detections from imagery
            thermal_active: Whether thermal signature indicates operation
            location: Geographic location

        Returns:
            Tuple of (phase, confidence, indicators)
        """
        detected_classes = {d.class_name.lower() for d in detections}

        # Score each phase based on indicator matches
        phase_scores = {}

        for phase, indicators in self.PHASE_INDICATORS.items():
            matched = detected_classes.intersection(set(indicators))
            if matched:
                # Score based on number and confidence of matches
                score = len(matched) / len(indicators)

                # Weight by detection confidence
                relevant_dets = [d for d in detections if d.class_name.lower() in indicators]
                if relevant_dets:
                    avg_conf = np.mean([d.confidence for d in relevant_dets])
                    score *= avg_conf

                phase_scores[phase] = {
                    "score": score,
                    "indicators": list(matched),
                }

        if not phase_scores:
            return ConstructionPhase.PLANNING, 0.0, []

        # Determine most likely phase
        # Later phases take precedence if scored similarly
        best_phase = None
        best_score = 0
        best_indicators = []

        phase_order = list(ConstructionPhase)
        for phase in reversed(phase_order):
            if phase in phase_scores:
                if phase_scores[phase]["score"] >= best_score * 0.8:
                    best_phase = phase
                    best_score = phase_scores[phase]["score"]
                    best_indicators = phase_scores[phase]["indicators"]

        # Override to operational if thermal signature detected
        if thermal_active and best_phase != ConstructionPhase.OPERATIONAL:
            if best_phase in [ConstructionPhase.MEP_FINISH, ConstructionPhase.COMMISSIONING]:
                best_phase = ConstructionPhase.OPERATIONAL
                best_indicators.append("thermal_signature")
                best_score = max(best_score, 0.8)

        return best_phase or ConstructionPhase.PLANNING, best_score, best_indicators

    def update_timeline(
        self,
        facility_id: str,
        detections: list[Detection],
        thermal_active: bool = False,
        observation_date: Optional[datetime] = None,
        location: Optional[GeoLocation] = None,
    ) -> ConstructionTimeline:
        """
        Update construction timeline with new observation.

        Args:
            facility_id: Unique facility identifier
            detections: Current detections
            thermal_active: Thermal operational indicator
            observation_date: Date of observation
            location: Geographic location

        Returns:
            Updated timeline
        """
        obs_date = observation_date or datetime.now()

        # Get or create timeline
        if facility_id not in self._timelines:
            self._timelines[facility_id] = ConstructionTimeline(facility_id=facility_id)

        timeline = self._timelines[facility_id]

        # Analyze current phase
        phase, confidence, indicators = self.analyze_construction_phase(
            detections, thermal_active, location
        )

        # Create milestone if phase changed or high confidence observation
        should_add = False

        if not timeline.milestones:
            should_add = True
            timeline.construction_start = obs_date
        elif phase != timeline.current_phase:
            should_add = True
        elif confidence > 0.8:
            # High confidence observation of same phase
            last_obs = timeline.milestones[-1].observed_date
            if (obs_date - last_obs).days > 7:  # Weekly updates
                should_add = True

        if should_add:
            milestone = ConstructionMilestone(
                phase=phase,
                observed_date=obs_date,
                confidence=confidence,
                indicators=indicators,
                location=location,
            )
            timeline.add_milestone(milestone)

            # Estimate completion
            timeline.estimated_completion = self._estimate_completion(timeline)

            logger.info(
                f"Facility {facility_id}: Phase updated to {phase.value} "
                f"({timeline.completion_percentage:.0f}% complete)"
            )

        # Store observation history
        if facility_id not in self._observation_history:
            self._observation_history[facility_id] = []

        self._observation_history[facility_id].append({
            "date": obs_date.isoformat(),
            "phase": phase.value,
            "confidence": confidence,
            "indicators": indicators,
        })

        return timeline

    def _estimate_completion(self, timeline: ConstructionTimeline) -> Optional[datetime]:
        """Estimate completion date based on progress."""
        if not timeline.construction_start:
            return None

        if timeline.current_phase == ConstructionPhase.OPERATIONAL:
            return timeline.milestones[-1].observed_date

        # Calculate remaining phases
        current_idx = list(ConstructionPhase).index(timeline.current_phase)
        operational_idx = list(ConstructionPhase).index(ConstructionPhase.OPERATIONAL)

        remaining_days = 0
        for phase in list(ConstructionPhase)[current_idx + 1:operational_idx + 1]:
            remaining_days += self.TYPICAL_PHASE_DURATION.get(phase, 30)

        # Adjust based on observed pace
        if len(timeline.milestones) >= 2:
            # Calculate average phase duration from observations
            durations = []
            for i in range(1, len(timeline.milestones)):
                delta = (
                    timeline.milestones[i].observed_date -
                    timeline.milestones[i-1].observed_date
                ).days
                durations.append(delta)

            if durations:
                pace_factor = np.mean(durations) / 60  # vs typical 60-day phase
                remaining_days = int(remaining_days * pace_factor)

        latest_obs = timeline.milestones[-1].observed_date
        return latest_obs + timedelta(days=remaining_days)

    def get_timeline(self, facility_id: str) -> Optional[ConstructionTimeline]:
        """Get timeline for a facility."""
        return self._timelines.get(facility_id)

    def detect_construction_anomalies(
        self,
        facility_id: str,
    ) -> list[dict]:
        """
        Detect anomalies in construction progress.

        Returns list of potential issues:
        - Stalled construction (no progress)
        - Regression (earlier phase detected)
        - Unusually fast progress
        """
        timeline = self._timelines.get(facility_id)
        if not timeline or len(timeline.milestones) < 2:
            return []

        anomalies = []

        # Check for stalled construction
        if timeline.current_phase != ConstructionPhase.OPERATIONAL:
            latest = timeline.milestones[-1]
            days_since_update = (datetime.now() - latest.observed_date).days

            if days_since_update > 90:
                anomalies.append({
                    "type": "stalled_construction",
                    "severity": "high" if days_since_update > 180 else "medium",
                    "description": f"No progress detected in {days_since_update} days",
                    "last_phase": latest.phase.value,
                    "days_stalled": days_since_update,
                })

        # Check for regression (unlikely but possible misdetection)
        phases = [m.phase for m in timeline.milestones]
        phase_values = [list(ConstructionPhase).index(p) for p in phases]

        for i in range(1, len(phase_values)):
            if phase_values[i] < phase_values[i-1]:
                anomalies.append({
                    "type": "phase_regression",
                    "severity": "low",
                    "description": f"Phase appeared to regress from {phases[i-1].value} to {phases[i].value}",
                    "observation_date": timeline.milestones[i].observed_date.isoformat(),
                    "note": "May indicate detection error or demolition/rebuild",
                })

        # Check for unusually fast progress
        if len(timeline.milestones) >= 3:
            total_days = (
                timeline.milestones[-1].observed_date -
                timeline.milestones[0].observed_date
            ).days
            phases_completed = len(set(phases))

            if total_days > 0:
                days_per_phase = total_days / phases_completed
                if days_per_phase < 20:  # Less than 20 days per phase
                    anomalies.append({
                        "type": "rapid_construction",
                        "severity": "info",
                        "description": f"Unusually fast progress: {days_per_phase:.0f} days/phase",
                        "note": "May indicate aggressive timeline or detection gaps",
                    })

        return anomalies

    def generate_construction_report(
        self,
        facility_id: str,
    ) -> dict:
        """Generate comprehensive construction progress report."""
        timeline = self._timelines.get(facility_id)

        if not timeline:
            return {"error": f"No timeline found for facility {facility_id}"}

        # Build phase history
        phase_history = []
        for milestone in timeline.milestones:
            phase_history.append({
                "phase": milestone.phase.value,
                "date": milestone.observed_date.isoformat(),
                "confidence": f"{milestone.confidence:.1%}",
                "indicators": milestone.indicators,
            })

        # Calculate metrics
        if timeline.construction_start and len(timeline.milestones) > 1:
            elapsed_days = (
                timeline.milestones[-1].observed_date -
                timeline.construction_start
            ).days
        else:
            elapsed_days = 0

        return {
            "facility_id": facility_id,
            "summary": {
                "current_phase": timeline.current_phase.value,
                "completion_percentage": timeline.completion_percentage,
                "construction_start": timeline.construction_start.isoformat()
                                      if timeline.construction_start else None,
                "estimated_completion": timeline.estimated_completion.isoformat()
                                        if timeline.estimated_completion else None,
                "elapsed_days": elapsed_days,
            },
            "phase_history": phase_history,
            "milestones_count": len(timeline.milestones),
            "anomalies": self.detect_construction_anomalies(facility_id),
            "observations": self._observation_history.get(facility_id, [])[-10:],
        }

    def compare_facilities(
        self,
        facility_ids: list[str],
    ) -> dict:
        """Compare construction progress across multiple facilities."""
        comparisons = []

        for fid in facility_ids:
            timeline = self._timelines.get(fid)
            if timeline:
                comparisons.append({
                    "facility_id": fid,
                    "current_phase": timeline.current_phase.value,
                    "completion": timeline.completion_percentage,
                    "start_date": timeline.construction_start.isoformat()
                                  if timeline.construction_start else None,
                    "est_completion": timeline.estimated_completion.isoformat()
                                     if timeline.estimated_completion else None,
                    "milestone_count": len(timeline.milestones),
                })

        # Sort by completion
        comparisons.sort(key=lambda x: x["completion"], reverse=True)

        return {
            "facilities_compared": len(comparisons),
            "comparison": comparisons,
            "most_advanced": comparisons[0] if comparisons else None,
            "least_advanced": comparisons[-1] if comparisons else None,
        }
