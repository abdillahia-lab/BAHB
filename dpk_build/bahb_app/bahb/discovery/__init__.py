"""Autonomous Discovery System for global infrastructure detection.

Team 41 breakthrough innovation: Automated data center detection
that eliminates manual discovery and achieves global coverage.

Capabilities:
- Grid-based global scanning
- AI-powered facility detection
- Automated classification
- Continuous monitoring
- Change detection and alerts
"""

from bahb.discovery.autonomous import (
    AutonomousDiscoverySystem,
    DiscoveryTask,
    DiscoveryResult,
    ScanRegion,
)
from bahb.discovery.scanner import GlobalScanner, ScanPriority
from bahb.discovery.classifier import FacilityClassifier

__all__ = [
    "AutonomousDiscoverySystem",
    "DiscoveryTask",
    "DiscoveryResult",
    "ScanRegion",
    "GlobalScanner",
    "ScanPriority",
    "FacilityClassifier",
]
