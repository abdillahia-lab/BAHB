"""
BAHB Lighting Control System

Integration for DJI Searchlight S1 and auxiliary lighting.
Provides intelligent lighting management for power infrastructure inspection,
including automatic adjustment based on conditions and detection events.

DJI Searchlight S1 Specs:
- Max brightness: 2000 lumens
- Beam angle: Adjustable (narrow/wide)
- Control: Via PSDK
- Power: Drone battery (impacts flight time ~15%)
"""

import logging
import threading
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Callable, Any
from datetime import datetime, time
import math


class LightMode(Enum):
    """Searchlight operating modes."""
    OFF = "off"
    LOW = "low"            # 25% - Minimal illumination
    MEDIUM = "medium"      # 50% - Standard inspection
    HIGH = "high"          # 75% - Detailed investigation
    MAX = "max"            # 100% - Emergency/night ops
    STROBE = "strobe"      # Flashing - Emergency signal
    AUTO = "auto"          # Automatic based on ambient


class BeamPattern(Enum):
    """Searchlight beam patterns."""
    SPOT = "spot"          # Narrow, focused beam
    FLOOD = "flood"        # Wide area coverage
    HYBRID = "hybrid"      # Combination pattern


class LightTrigger(Enum):
    """Events that can trigger light changes."""
    MANUAL = "manual"
    AMBIENT_SENSOR = "ambient_sensor"
    DETECTION_EVENT = "detection_event"
    INVESTIGATION_START = "investigation_start"
    SHADOW_DETECTED = "shadow_detected"
    SCHEDULE = "schedule"
    EMERGENCY = "emergency"


@dataclass
class LightingConfig:
    """Lighting system configuration."""
    # Auto-mode thresholds (lux)
    ambient_low_threshold: float = 500.0      # Below this = turn on
    ambient_medium_threshold: float = 1000.0  # Below this = medium
    ambient_high_threshold: float = 5000.0    # Above this = off

    # Detection-triggered settings
    illuminate_on_critical: bool = True
    illuminate_on_investigation: bool = True
    investigation_brightness: LightMode = LightMode.HIGH
    investigation_pattern: BeamPattern = BeamPattern.SPOT

    # Shadow compensation
    shadow_compensation_enabled: bool = True
    shadow_detection_threshold: float = 0.3   # Darkness ratio

    # Battery management
    max_light_battery_usage_percent: float = 15.0
    disable_below_battery_percent: float = 25.0

    # Schedule (24h format)
    dawn_start: time = field(default_factory=lambda: time(5, 30))
    dawn_end: time = field(default_factory=lambda: time(7, 0))
    dusk_start: time = field(default_factory=lambda: time(18, 0))
    dusk_end: time = field(default_factory=lambda: time(20, 0))

    # Thermal sync
    thermal_preheat_enabled: bool = True
    thermal_preheat_duration_s: float = 3.0


@dataclass
class LightState:
    """Current lighting system state."""
    mode: LightMode = LightMode.OFF
    brightness_percent: float = 0.0
    beam_pattern: BeamPattern = BeamPattern.FLOOD
    angle_deg: float = -45.0  # Gimbal-aligned default

    # Sensor readings
    ambient_lux: float = 10000.0
    shadow_ratio: float = 0.0

    # Usage tracking
    active_since: Optional[str] = None
    total_on_time_s: float = 0.0
    estimated_battery_impact_percent: float = 0.0

    # Trigger history
    last_trigger: LightTrigger = LightTrigger.MANUAL
    last_change: Optional[str] = None


class SearchlightController:
    """
    Controls the DJI Searchlight S1.

    Features:
    - Automatic brightness based on ambient light
    - Detection-triggered illumination
    - Shadow compensation for inspection
    - Battery-aware operation
    - Integration with gimbal for coordinated pointing
    """

    # Brightness mappings
    BRIGHTNESS_MAP = {
        LightMode.OFF: 0,
        LightMode.LOW: 25,
        LightMode.MEDIUM: 50,
        LightMode.HIGH: 75,
        LightMode.MAX: 100
    }

    # Battery impact per hour at max brightness (percent)
    BATTERY_DRAIN_RATE_PER_HOUR = 15.0

    def __init__(
        self,
        config: Optional[LightingConfig] = None,
        dji_controller=None,
        simulation_mode: bool = False
    ):
        self.config = config or LightingConfig()
        self.dji = dji_controller
        self.simulation_mode = simulation_mode

        self.logger = logging.getLogger("BAHB.Searchlight")
        self.state = LightState()

        # Threading
        self._running = False
        self._auto_thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()

        # Callbacks
        self._state_callbacks: List[Callable[[LightState], None]] = []

    def start(self):
        """Start the lighting controller."""
        self.logger.info("Starting searchlight controller")
        self._running = True

        if self.state.mode == LightMode.AUTO:
            self._start_auto_mode()

    def stop(self):
        """Stop the lighting controller."""
        self.logger.info("Stopping searchlight controller")
        self._running = False
        self.set_mode(LightMode.OFF)

    # =========================================================================
    # BASIC CONTROLS
    # =========================================================================

    def set_mode(self, mode: LightMode, trigger: LightTrigger = LightTrigger.MANUAL) -> bool:
        """Set the light operating mode."""
        with self._lock:
            old_mode = self.state.mode
            self.state.mode = mode
            self.state.last_trigger = trigger
            self.state.last_change = datetime.now().isoformat()

            if mode == LightMode.OFF:
                self.state.brightness_percent = 0
                self.state.active_since = None
            elif mode == LightMode.AUTO:
                self._start_auto_mode()
            elif mode == LightMode.STROBE:
                self._start_strobe_mode()
            else:
                self.state.brightness_percent = self.BRIGHTNESS_MAP.get(mode, 0)
                if old_mode == LightMode.OFF:
                    self.state.active_since = datetime.now().isoformat()

            self._apply_brightness()
            self._notify_state_change()

            self.logger.info(f"Light mode: {mode.value} (trigger: {trigger.value})")
            return True

    def set_brightness(self, percent: float) -> bool:
        """Set brightness directly (0-100)."""
        percent = max(0, min(100, percent))

        with self._lock:
            self.state.brightness_percent = percent
            self.state.mode = LightMode.OFF if percent == 0 else LightMode.MEDIUM
            self._apply_brightness()

        return True

    def set_beam_pattern(self, pattern: BeamPattern) -> bool:
        """Set the beam pattern."""
        with self._lock:
            self.state.beam_pattern = pattern
            self._apply_beam_pattern()

        self.logger.info(f"Beam pattern: {pattern.value}")
        return True

    def set_angle(self, angle_deg: float) -> bool:
        """Set the light angle (-90 to 30 degrees)."""
        angle_deg = max(-90, min(30, angle_deg))

        with self._lock:
            self.state.angle_deg = angle_deg
            self._apply_angle()

        return True

    def sync_with_gimbal(self) -> bool:
        """Sync light angle with gimbal position."""
        if self.dji:
            # Get current gimbal angle and match
            # gimbal_pitch = self.dji.get_gimbal_pitch()
            # self.set_angle(gimbal_pitch)
            pass
        return True

    # =========================================================================
    # AUTOMATIC MODES
    # =========================================================================

    def _start_auto_mode(self):
        """Start automatic brightness adjustment."""
        if self._auto_thread and self._auto_thread.is_alive():
            return

        self._auto_thread = threading.Thread(target=self._auto_mode_loop, daemon=True)
        self._auto_thread.start()

    def _auto_mode_loop(self):
        """Auto mode adjustment loop."""
        import time as time_module

        while self._running and self.state.mode == LightMode.AUTO:
            self._adjust_for_ambient()
            time_module.sleep(1.0)  # Check every second

    def _adjust_for_ambient(self):
        """Adjust brightness based on ambient light."""
        lux = self.state.ambient_lux
        config = self.config

        with self._lock:
            if lux < config.ambient_low_threshold:
                target_brightness = 75  # HIGH
            elif lux < config.ambient_medium_threshold:
                target_brightness = 50  # MEDIUM
            elif lux < config.ambient_high_threshold:
                target_brightness = 25  # LOW
            else:
                target_brightness = 0   # OFF

            # Smooth transition
            current = self.state.brightness_percent
            if abs(current - target_brightness) > 5:
                step = 5 if target_brightness > current else -5
                self.state.brightness_percent = current + step
                self._apply_brightness()

    def _start_strobe_mode(self):
        """Start strobe pattern for emergency signaling."""
        # Would implement strobe timing
        pass

    # =========================================================================
    # DETECTION-TRIGGERED LIGHTING
    # =========================================================================

    def on_critical_detection(self, detection: Dict) -> bool:
        """
        Handle critical detection event.

        Automatically illuminates target for better imaging.
        """
        if not self.config.illuminate_on_critical:
            return False

        self.logger.info(f"Illuminating critical detection: {detection.get('class_name')}")

        # Boost brightness temporarily
        self.set_mode(LightMode.HIGH, trigger=LightTrigger.DETECTION_EVENT)
        self.set_beam_pattern(BeamPattern.SPOT)

        return True

    def on_investigation_start(self, target_lat: float, target_lon: float) -> bool:
        """
        Prepare lighting for investigation maneuver.

        Called by Investigator agent when starting detailed inspection.
        """
        if not self.config.illuminate_on_investigation:
            return False

        self.logger.info("Activating investigation lighting")

        self.set_mode(
            self.config.investigation_brightness,
            trigger=LightTrigger.INVESTIGATION_START
        )
        self.set_beam_pattern(self.config.investigation_pattern)
        self.sync_with_gimbal()

        return True

    def on_investigation_end(self):
        """Return to previous lighting state after investigation."""
        self.set_mode(LightMode.AUTO, trigger=LightTrigger.INVESTIGATION_START)

    # =========================================================================
    # SHADOW COMPENSATION
    # =========================================================================

    def analyze_frame_lighting(self, frame_brightness_map: List[List[float]]) -> Dict:
        """
        Analyze frame for shadow regions.

        Returns recommendation for lighting adjustment.
        """
        if not frame_brightness_map:
            return {"needs_light": False}

        # Calculate shadow ratio (simplified)
        total_pixels = sum(len(row) for row in frame_brightness_map)
        dark_pixels = sum(
            1 for row in frame_brightness_map
            for pixel in row
            if pixel < 0.3
        )

        shadow_ratio = dark_pixels / total_pixels if total_pixels > 0 else 0
        self.state.shadow_ratio = shadow_ratio

        needs_light = shadow_ratio > self.config.shadow_detection_threshold

        return {
            "needs_light": needs_light,
            "shadow_ratio": shadow_ratio,
            "recommended_brightness": 75 if shadow_ratio > 0.5 else 50
        }

    def compensate_shadows(self, analysis: Dict) -> bool:
        """Apply shadow compensation based on analysis."""
        if not self.config.shadow_compensation_enabled:
            return False

        if analysis.get("needs_light"):
            brightness = analysis.get("recommended_brightness", 50)
            self.set_brightness(brightness)
            self.state.last_trigger = LightTrigger.SHADOW_DETECTED
            self.logger.info(f"Shadow compensation: {brightness}%")
            return True

        return False

    # =========================================================================
    # THERMAL IMAGING SUPPORT
    # =========================================================================

    def preheat_for_thermal(self, duration_s: Optional[float] = None) -> bool:
        """
        Briefly illuminate target before thermal capture.

        Heating the target slightly can improve thermal contrast.
        """
        if not self.config.thermal_preheat_enabled:
            return False

        duration = duration_s or self.config.thermal_preheat_duration_s

        self.logger.info(f"Thermal preheat: {duration}s at max brightness")

        # Flash at max briefly
        original_mode = self.state.mode
        self.set_mode(LightMode.MAX)

        # Would use timer to restore
        # After duration, restore original

        return True

    # =========================================================================
    # BATTERY MANAGEMENT
    # =========================================================================

    def update_battery_level(self, battery_percent: float):
        """Update battery level for power management."""
        with self._lock:
            # Disable light if battery too low
            if battery_percent < self.config.disable_below_battery_percent:
                if self.state.mode != LightMode.OFF:
                    self.logger.warning(f"Disabling light - battery low ({battery_percent}%)")
                    self.set_mode(LightMode.OFF)

            # Calculate battery impact
            if self.state.active_since:
                # Simplified calculation
                on_time_hours = self.state.total_on_time_s / 3600
                avg_brightness = self.state.brightness_percent / 100
                self.state.estimated_battery_impact_percent = (
                    on_time_hours * self.BATTERY_DRAIN_RATE_PER_HOUR * avg_brightness
                )

    def get_estimated_flight_time_impact(self) -> float:
        """Get estimated reduction in flight time from light usage."""
        if self.state.mode == LightMode.OFF:
            return 0.0

        # At max brightness, ~15% battery per hour
        brightness_factor = self.state.brightness_percent / 100
        return brightness_factor * 0.15  # 15% reduction at max

    # =========================================================================
    # SCHEDULE-BASED OPERATION
    # =========================================================================

    def check_schedule(self) -> LightMode:
        """Check if current time requires lighting based on schedule."""
        now = datetime.now().time()
        config = self.config

        # Dawn period
        if config.dawn_start <= now <= config.dawn_end:
            return LightMode.MEDIUM

        # Dusk period
        if config.dusk_start <= now <= config.dusk_end:
            return LightMode.MEDIUM

        # Night (after dusk end, before dawn start)
        if now >= config.dusk_end or now <= config.dawn_start:
            return LightMode.HIGH

        # Daylight
        return LightMode.OFF

    def apply_schedule(self):
        """Apply lighting based on current schedule."""
        recommended = self.check_schedule()

        if self.state.mode == LightMode.AUTO:
            # Schedule influences auto mode
            pass
        else:
            self.set_mode(recommended, trigger=LightTrigger.SCHEDULE)

    # =========================================================================
    # DJI PSDK INTERFACE
    # =========================================================================

    def _apply_brightness(self):
        """Apply brightness to hardware via PSDK."""
        if self.simulation_mode:
            self.logger.debug(f"[SIM] Setting brightness: {self.state.brightness_percent}%")
            return

        if self.dji:
            # Real implementation via PSDK
            # self.dji.set_searchlight_brightness(self.state.brightness_percent)
            pass

    def _apply_beam_pattern(self):
        """Apply beam pattern to hardware."""
        if self.simulation_mode:
            self.logger.debug(f"[SIM] Setting beam: {self.state.beam_pattern.value}")
            return

        if self.dji:
            # self.dji.set_searchlight_beam(self.state.beam_pattern.value)
            pass

    def _apply_angle(self):
        """Apply light angle to hardware."""
        if self.simulation_mode:
            self.logger.debug(f"[SIM] Setting angle: {self.state.angle_deg}°")
            return

        if self.dji:
            # self.dji.set_searchlight_angle(self.state.angle_deg)
            pass

    # =========================================================================
    # STATE & CALLBACKS
    # =========================================================================

    def update_ambient_light(self, lux: float):
        """Update ambient light reading from sensor."""
        with self._lock:
            self.state.ambient_lux = lux

    def get_state(self) -> LightState:
        """Get current lighting state."""
        with self._lock:
            return self.state

    def register_callback(self, callback: Callable[[LightState], None]):
        """Register callback for state changes."""
        self._state_callbacks.append(callback)

    def _notify_state_change(self):
        """Notify callbacks of state change."""
        for callback in self._state_callbacks:
            try:
                callback(self.state)
            except Exception as e:
                self.logger.error(f"Callback error: {e}")


class LightingAgent:
    """
    Agent wrapper for intelligent lighting control.

    Integrates with the agentic workflow system to provide
    autonomous lighting decisions.
    """

    def __init__(self, controller: SearchlightController, agent_state=None):
        self.controller = controller
        self.agent_state = agent_state
        self.logger = logging.getLogger("BAHB.Agent.Lighting")

    async def on_detection(self, detection: Dict):
        """Handle detection event from perception agent."""
        priority = detection.get('priority', 'LOW')
        confidence = detection.get('confidence', 0)

        # Critical detections get illuminated
        if priority == 'CRITICAL':
            self.controller.on_critical_detection(detection)

        # Low confidence detections might benefit from better lighting
        elif confidence < 0.6 and priority in ['HIGH', 'MEDIUM']:
            self.logger.info("Boosting light for low-confidence detection")
            self.controller.set_mode(LightMode.MEDIUM)

    async def on_investigation_start(self, params: Dict):
        """Handle investigation start from investigator agent."""
        self.controller.on_investigation_start(
            params.get('latitude', 0),
            params.get('longitude', 0)
        )

    async def on_investigation_end(self):
        """Handle investigation end."""
        self.controller.on_investigation_end()

    async def analyze_current_frame(self, frame) -> bool:
        """
        Analyze current camera frame for lighting needs.

        Returns True if lighting was adjusted.
        """
        # Would analyze actual frame brightness
        # For now, placeholder
        return False
