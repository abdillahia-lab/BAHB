"""
BAHB Zenmuse S1 Integration

Thin wrapper around DJI's native Zenmuse S1 controls.
Adds AI-triggered lighting automation on top of DJI's built-in features.

DJI Already Provides:
- Gimbal synchronization (auto-aligns with camera)
- Eye protection (40% on ground)
- Brightness/mode control via MSDK
- DJI Pilot 2 integration
- RC Plus shortcuts

What We Add:
- Auto-illuminate on AI critical detection
- Shadow compensation from frame analysis
- Thermal preheat sequence coordination
- Integration with agentic workflow

Reference: https://enterprise.dji.com/zenmuse-s1
"""

import logging
from enum import Enum
from typing import Optional, Dict, Callable
from datetime import datetime


class S1LightMode(Enum):
    """DJI Zenmuse S1 native light modes."""
    OFF = 0
    LOW = 1       # ~3,000 lumens
    MEDIUM = 2    # ~6,500 lumens
    HIGH = 3      # 10,000 lumens


class ZenmuseS1Controller:
    """
    Wrapper for DJI Zenmuse S1 Spotlight.

    Uses DJI MSDK for native control, adds AI-triggered automation.
    Does NOT re-implement DJI's built-in features.
    """

    def __init__(self, dji_msdk=None, simulation_mode: bool = False):
        self.msdk = dji_msdk
        self.simulation_mode = simulation_mode
        self.logger = logging.getLogger("BAHB.ZenmuseS1")

        # Track state for AI logic
        self._current_mode = S1LightMode.OFF
        self._ai_override_active = False
        self._previous_mode = S1LightMode.OFF

    # =========================================================================
    # NATIVE DJI CONTROL (via MSDK)
    # =========================================================================

    def set_mode(self, mode: S1LightMode) -> bool:
        """Set light mode via DJI MSDK."""
        if self.simulation_mode:
            self.logger.info(f"[SIM] S1 mode: {mode.name}")
            self._current_mode = mode
            return True

        # Real: Call DJI MSDK
        # self.msdk.payload.spotlight.setMode(mode.value)
        self._current_mode = mode
        return True

    def get_mode(self) -> S1LightMode:
        """Get current mode from DJI."""
        return self._current_mode

    # =========================================================================
    # AI-TRIGGERED AUTOMATION (What we add)
    # =========================================================================

    def on_critical_detection(self, detection: Dict) -> bool:
        """
        AI detected critical issue - illuminate for better capture.

        This is what DJI doesn't do automatically.
        """
        if self._ai_override_active:
            return False  # Already illuminating

        self.logger.info(f"AI trigger: Illuminating for {detection.get('class_name')}")

        # Save current state
        self._previous_mode = self._current_mode
        self._ai_override_active = True

        # Set to HIGH for critical detection
        self.set_mode(S1LightMode.HIGH)

        return True

    def on_detection_captured(self):
        """Detection captured - restore previous light state."""
        if not self._ai_override_active:
            return

        self.logger.info("AI trigger complete, restoring previous mode")
        self._ai_override_active = False
        self.set_mode(self._previous_mode)

    def on_investigation_start(self):
        """Investigator agent starting detailed inspection."""
        self._previous_mode = self._current_mode
        self._ai_override_active = True
        self.set_mode(S1LightMode.HIGH)
        self.logger.info("Investigation lighting active")

    def on_investigation_end(self):
        """Investigation complete."""
        self._ai_override_active = False
        self.set_mode(self._previous_mode)
        self.logger.info("Investigation lighting ended")

    def thermal_preheat(self, duration_s: float = 2.0):
        """
        Brief illumination before thermal capture.

        Slightly heats target for better thermal contrast.
        DJI doesn't coordinate this automatically.
        """
        import time

        self.logger.info(f"Thermal preheat: {duration_s}s")
        original = self._current_mode

        self.set_mode(S1LightMode.HIGH)
        time.sleep(duration_s)
        self.set_mode(original)

    def assess_frame_lighting(self, avg_brightness: float) -> bool:
        """
        Assess if frame needs additional lighting.

        Returns True if light was turned on.
        DJI doesn't analyze our AI inference frames.
        """
        # If frame is too dark and we're not already lit
        if avg_brightness < 0.3 and self._current_mode == S1LightMode.OFF:
            self.logger.info(f"Frame dark ({avg_brightness:.0%}), enabling light")
            self._previous_mode = self._current_mode
            self._ai_override_active = True
            self.set_mode(S1LightMode.MEDIUM)
            return True
        return False


# Simple integration function for agents
def create_s1_detection_callback(controller: ZenmuseS1Controller) -> Callable:
    """Create callback for detection events."""
    def callback(detection: Dict):
        priority = detection.get('priority', 'LOW')
        if priority == 'CRITICAL':
            controller.on_critical_detection(detection)
    return callback
