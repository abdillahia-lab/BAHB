# PSDK Feasibility Analysis for BAHB
## Mission-Critical Drone Functionality Assessment

**Document Control**
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2026-01-25 | Agent 4 - Feasibility Analysis | DRAFT - REQUIRES REVIEW |

**Platform Specifications:**
- **Aircraft:** DJI Matrice 4TD
- **SDK:** DJI Payload SDK (PSDK) v3.x - MANDATORY
- **Compute:** Manifold 3 (NVIDIA Orin NX, 100 TOPS) connected via E-Port
- **Current State:** All DJI calls are stubs (simulation mode)

---

# Executive Summary

This analysis evaluates the feasibility of implementing PSDK-based drone control for BAHB's autonomous infrastructure inspection system. The conclusion is:

**VERDICT: PSDK IMPLEMENTATION IS FEASIBLE WITH SIGNIFICANT CONSTRAINTS**

| Aspect | Feasibility | Confidence | Notes |
|--------|-------------|------------|-------|
| Basic Telemetry | HIGH | 95% | Proven Manifold 3 + PSDK integration |
| Camera Stream Access | HIGH | 90% | H30T streams accessible via PSDK |
| Gimbal Control | HIGH | 85% | Native PSDK support |
| Waypoint Missions | MEDIUM | 70% | Requires careful implementation |
| Virtual Stick | MEDIUM-LOW | 60% | Limited access vs MSDK, requires authority |
| Flight Control Override | LOW | 40% | RPIC always has priority (by design) |

**CRITICAL:** RPIC authority is NEVER compromised - this is DJI's design philosophy and a safety requirement.

---

# 1. PSDK Architecture Analysis

## 1.1 PSDK vs MSDK vs OSDK Comparison

### SDK Overview

| SDK | Platform | Connection | Primary Use Case |
|-----|----------|------------|------------------|
| **PSDK** | Onboard computer (Manifold) | E-Port / SkyPort | Payload integration, edge AI |
| **MSDK** | Mobile device (iOS/Android) | RC link | Mobile apps, operator interface |
| **OSDK** | Onboard computer (legacy) | UART/USB | Autonomous control (deprecated) |

**Key Insight:** PSDK is the correct choice for Manifold 3 on Matrice 4TD. DJI is transitioning away from OSDK toward PSDK for new platforms.

### PSDK Capabilities Summary

From [DJI Developer Documentation](https://developer.dji.com/doc/payload-sdk-tutorial/en/function-set/basic-function/flight-control.html):

| Feature | PSDK Access | Limitations |
|---------|-------------|-------------|
| Telemetry subscription | FULL | All flight data accessible |
| Camera stream (H30T) | FULL | Decoded frames via hardware decoder |
| Gimbal control | FULL | Pitch, yaw, roll control |
| Waypoint mission | PARTIAL | Upload/execute, cannot modify mid-flight |
| Virtual stick | PARTIAL | Requires control authority, limited |
| Flight control override | LIMITED | RPIC always has priority |
| Obstacle avoidance | READ-ONLY | Cannot disable programmatically |
| RTH/Landing | TRIGGER ONLY | Can initiate, cannot prevent |

### Which SDK for BAHB?

**Recommendation: PSDK is MANDATORY and APPROPRIATE**

Rationale:
1. Manifold 3 is a payload - PSDK is designed for this
2. Edge AI processing requires onboard execution (PSDK provides this)
3. MSDK would require RC connection for control - unreliable
4. OSDK is deprecated for new DJI platforms

**Can both be used together?**
Yes, but with constraints:
- PSDK runs on Manifold 3 (onboard)
- MSDK can run on RC Plus 2 tablet simultaneously
- Control authority must be managed carefully
- Known bug: M300 MSDK+OSDK authority conflicts exist

## 1.2 PSDK Capabilities Detail

### Flight Control Access Level

Based on [DJI Control Authority Documentation](https://developer.dji.com/onboard-sdk/documentation/guides/component-guide-control-authority.html):

```
CONTROL AUTHORITY HIERARCHY (Highest to Lowest):

1. REMOTE CONTROLLER (RPIC) - ALWAYS HIGHEST
   - Flight mode switch override
   - Emergency RTH button
   - Stick inputs

2. DJI NATIVE SAFETY SYSTEMS
   - Obstacle avoidance
   - Geofencing
   - Battery failsafe
   - Link loss failsafe

3. MOBILE SDK (if active)
   - Virtual stick commands
   - Waypoint missions

4. PAYLOAD SDK / ONBOARD SDK
   - Virtual stick commands (if authority granted)
   - Waypoint missions
   - Gimbal/camera control

CRITICAL: RPIC can ALWAYS regain control via flight mode switch
```

### Camera/Gimbal Control

PSDK provides FULL access to:
- H30T wide camera stream (4K@30fps)
- H30T thermal stream (1280x1024@30fps)
- H30T zoom camera (up to 200x hybrid)
- Laser rangefinder data (1200m range)
- Gimbal attitude control (pitch: -90 to +30, yaw: +/-180)
- Zoom control (optical + digital)
- Photo/video capture commands

### Telemetry Access

| Data Type | Update Rate | Access Method |
|-----------|-------------|---------------|
| GPS position | 10 Hz | Subscription |
| Altitude (MSL/AGL) | 10 Hz | Subscription |
| Attitude (RPY) | 50 Hz | Subscription |
| Velocity | 10 Hz | Subscription |
| Battery state | 1 Hz | Subscription |
| RC link quality | 5 Hz | Subscription |
| Gimbal attitude | 50 Hz | Subscription |
| Obstacle distances | 10 Hz | Subscription |
| Flight mode | Event-driven | Callback |
| GPS satellite count | 1 Hz | Subscription |

### Waypoint Mission Support

From [PSDK Flight Control Documentation](https://developer.dji.com/doc/payload-sdk-tutorial/en/function-set/basic-function/flight-control.html):

| Capability | Supported | Notes |
|------------|-----------|-------|
| Upload mission | YES | Before or during flight |
| Start mission | YES | Triggers autonomous execution |
| Pause mission | YES | Holds position |
| Resume mission | YES | Continues from pause point |
| Stop mission | YES | Exits mission mode |
| Modify mid-flight | LIMITED | Cannot insert waypoints dynamically |
| Max waypoints | 65535 | Matrice 4TD limit |
| Waypoint actions | YES | Camera, gimbal actions at waypoints |

### Virtual Stick Availability

From [DJI Virtual Stick Documentation](https://developer.dji.com/doc/mobile-sdk-tutorial/en/tutorials/virtual-stick.html):

Virtual stick IS available via PSDK but with important constraints:

1. **Must obtain control authority** - RPIC can override
2. **Link loss = RTH** - Cannot continue autonomous on signal loss
3. **Coordinate modes:**
   - Body-fixed (relative to aircraft heading)
   - Ground-fixed (relative to north)
   - Position control (GPS coordinates)
   - Velocity control (m/s commands)

**CRITICAL LIMITATION:** Virtual stick via PSDK/OSDK may have authority conflicts. DJI has documented this as a "known bug they decided not to fix" for M300 series.

---

# 2. PSDK Integration Requirements

## 2.1 Hardware Interface

### E-Port Specifications

From [DJI Manifold 3 FAQ](https://enterprise.dji.com/manifold-3/faq):

| Specification | Value |
|---------------|-------|
| Interface | E-Port V2 |
| Connection | Coaxial cable |
| Power output | 13.6V / 17V / 24V (selectable) |
| Data protocol | UART + Ethernet |
| Bandwidth | Up to 100 Mbps Ethernet |
| Latency | ~5-10ms (data), ~120ms (video glass-to-glass) |

### E-Port Capabilities

From [arXiv research paper](https://arxiv.org/html/2405.06176v1):

| Capability | E-Port | SkyPort | Notes |
|------------|--------|---------|-------|
| Flight control | YES | NO | E-Port required |
| Payload control | YES | YES | Both support |
| Power integration | YES | YES | Both support |
| Telemetry access | YES | YES | Both support |
| Video to controller | NO | YES | SkyPort only |
| PSDK app execution | YES | YES | One port per app |

**IMPLICATION:** For full capabilities, some payloads require BOTH ports with two separate PSDK applications running in parallel.

### Communication Protocol

```
MANIFOLD 3 ←──E-Port V2──→ MATRICE 4TD
           │
           ├── UART: Control commands, telemetry
           ├── Ethernet: Video streams (H.265)
           └── Power: 13.6-24V DC

LATENCY BUDGET:
├── Command transmission: ~5ms
├── Video decode (NVDEC): ~8ms
├── AI inference: ~10ms (optimized)
├── Response: ~5ms
└── Total round-trip: ~28ms
```

### Bandwidth Limitations

| Stream | Bitrate | Notes |
|--------|---------|-------|
| Wide camera (4K) | 20-30 Mbps | H.265 encoded |
| Thermal camera | 8-12 Mbps | H.265 encoded |
| Zoom camera | 20-30 Mbps | H.265 encoded |
| Telemetry | <1 Mbps | Structured data |
| Command | <100 Kbps | Low bandwidth |
| **Total** | ~50-70 Mbps | Well within 100 Mbps limit |

## 2.2 Software Interface

### PSDK C/C++ API

From [DJI PSDK GitHub](https://github.com/dji-sdk/Payload-SDK):

```c
// PSDK is a C-based SDK
// Core initialization
T_DjiReturnCode DjiCore_Init(const T_DjiUserInfo *userInfo);

// Flight control
T_DjiReturnCode DjiFcSubscription_GetLatestValueOfTopic(
    E_DjiFcSubscriptionTopic topic,
    uint8_t *data, uint16_t dataSizeOfTopic,
    T_DjiDataTimestamp *timestamp);

// Gimbal control
T_DjiReturnCode DjiGimbalManager_Rotate(
    E_DjiMountPosition mountPosition,
    T_DjiGimbalManagerRotation rotation);

// Camera control
T_DjiReturnCode DjiCameraManager_StartShootPhoto(
    E_DjiMountPosition position,
    E_DjiCameraManagerPhotoShootingMode mode);

// Waypoint mission
T_DjiReturnCode DjiWaypointV2_UploadMission(
    T_DjiWaypointV2Mission *mission);
```

### Python Bindings Availability

**CRITICAL FINDING: NO OFFICIAL PYTHON BINDINGS**

Based on [DJI SDK Guide](https://enterprise-insights.dji.com/blog/dji-sdk-guide):

- DJI provides ONLY C/C++ SDK for PSDK
- No official Python wrapper exists
- Community projects exist but are NOT supported

**Options for BAHB:**

1. **Use C++ directly** (Recommended for safety-critical code)
   - Pros: Best performance, direct API access
   - Cons: Requires C++ expertise, different from existing Python codebase

2. **Create Python bindings** (Additional effort)
   - Pros: Integrates with existing BAHB Python code
   - Cons: Maintenance burden, potential for bugs
   - Tools: pybind11, ctypes, or SWIG

3. **IPC Architecture** (Recommended hybrid approach)
   - C++ PSDK service for flight control
   - Python BAHB code communicates via IPC (ZeroMQ, gRPC)
   - Pros: Clean separation, native performance for safety
   - Cons: Additional complexity

**RECOMMENDATION:** Option 3 - IPC Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  MANIFOLD 3                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐      ┌─────────────────────────┐  │
│  │ PSDK SERVICE (C++)  │◄────►│ BAHB AGENTS (Python)    │  │
│  │ - Flight control    │ ZMQ  │ - RF-DETR detection     │  │
│  │ - Gimbal control    │ IPC  │ - Thermal analysis      │  │
│  │ - Camera commands   │      │ - VLM analysis          │  │
│  │ - Telemetry sub     │      │ - Mission planning      │  │
│  └─────────────────────┘      └─────────────────────────┘  │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────┐                                    │
│  │ E-PORT V2           │                                    │
│  └─────────────────────┘                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Async/Callback Patterns

PSDK uses callback-based async pattern:

```c
// Subscription callback
T_DjiReturnCode MyTelemetryCallback(
    const uint8_t *data, uint16_t dataSize,
    const T_DjiDataTimestamp *timestamp)
{
    // Process telemetry asynchronously
    T_DjiFcSubscriptionFlightStatus *status =
        (T_DjiFcSubscriptionFlightStatus *)data;
    // ...
}

// Register callback
DjiFcSubscription_SubscribeTopic(
    DJI_FC_SUBSCRIPTION_TOPIC_FLIGHT_STATUS,
    DJI_DATA_SUBSCRIPTION_TOPIC_10_HZ,
    MyTelemetryCallback);
```

### Thread Safety Requirements

From PSDK documentation:

| Component | Thread Safety | Notes |
|-----------|---------------|-------|
| Telemetry callbacks | NOT thread-safe | Use mutex for shared data |
| Camera control | Thread-safe | Can call from any thread |
| Gimbal control | Thread-safe | Can call from any thread |
| Flight control | Thread-safe | Single authority at a time |
| PSDK initialization | NOT thread-safe | Single-threaded init required |

**CRITICAL REQUIREMENT:** All PSDK callbacks execute in PSDK's internal thread. BAHB must use proper synchronization primitives when sharing data between PSDK callbacks and Python inference threads.

---

# 3. Mission-Critical Reliability Analysis

## 3.1 Failure Mode Catalog

### PSDK Function Failure Modes

| Function | Failure Mode | Impact | Mitigation | Test Strategy |
|----------|-------------|--------|------------|---------------|
| **Camera Stream** | Connection loss | No video for AI | Reconnect logic, cached frame | Network interrupt test |
| **Camera Stream** | Decode error | Corrupted frame | Frame validation, skip | Corruption injection |
| **Camera Stream** | Latency spike | Stale detections | Timestamp validation | Latency injection |
| **Gimbal Control** | Command timeout | Stuck gimbal | Timeout + default position | Latency injection |
| **Gimbal Control** | Position error | Wrong framing | Position feedback validation | Drift simulation |
| **Waypoint Mission** | Upload fail | Mission abort | Retry + verify checksum | Corruption test |
| **Waypoint Mission** | Execution halt | Unexpected hover | Resume or RTH logic | Mid-mission interrupt |
| **Virtual Stick** | Authority loss | Command ignored | Detect + failsafe | Authority revocation |
| **Virtual Stick** | Link loss | Flyaway risk | DJI failsafe RTH | Link loss simulation |
| **Virtual Stick** | Command lag | Position overshoot | Rate limiting, prediction | Latency injection |
| **Telemetry** | Data corruption | Wrong position | Checksum verify, sanity check | Bit flip injection |
| **Telemetry** | Subscription loss | No status updates | Heartbeat monitor, resubscribe | Service restart |
| **GPS** | Signal loss | Position drift | Visual odometry backup | GPS denial test |
| **Battery State** | Incorrect reading | Unexpected landing | Cross-check voltage/current | Value corruption |

### Severity Classification

| Impact Level | Description | Example |
|--------------|-------------|---------|
| **CATASTROPHIC** | Loss of aircraft, injury | Flyaway, collision |
| **HAZARDOUS** | Emergency landing, major damage | Battery failure, motor stop |
| **MAJOR** | Mission abort, minor damage | GPS loss, camera failure |
| **MINOR** | Degraded performance | Thermal camera fail |
| **NO EFFECT** | No operational impact | Log write failure |

## 3.2 RPIC Safety Verification

### Scenario Analysis

#### What happens if BAHB code crashes mid-execution?

```
SCENARIO: Python inference crashes during waypoint mission

EXPECTED BEHAVIOR:
├── Manifold 3 PSDK service may or may not crash (depends on IPC)
├── DJI flight controller continues waypoint mission
├── RPIC still has full control via RC
├── DJI safety systems remain active (obstacle avoidance, geofence)
├── Link loss failsafe will trigger RTH if configured
└── Aircraft is SAFE

REQUIREMENT: PSDK service must be decoupled from BAHB inference
MITIGATION: Separate processes with IPC, watchdog restarts
```

#### What happens if Manifold 3 loses power?

```
SCENARIO: Manifold 3 sudden power loss during flight

EXPECTED BEHAVIOR:
├── PSDK service terminates immediately
├── DJI flight controller treats as "link loss" scenario
├── After timeout (configurable, default 3s): Failsafe activates
├── Failsafe action: RTH, Hover, or Land (per settings)
├── RPIC still has full control via RC
├── All DJI safety systems operational
└── Aircraft is SAFE

REQUIREMENT: Configure failsafe to RTH on SDK link loss
VERIFICATION: Test with actual power cut in tethered flight
```

#### What happens if E-Port connection drops?

```
SCENARIO: E-Port cable disconnect or communication failure

EXPECTED BEHAVIOR:
├── Same as Manifold 3 power loss (SDK link loss)
├── Failsafe timer starts
├── RPIC has full control
├── Waypoint mission may halt (depends on configuration)
└── Aircraft is SAFE

REQUIREMENT: Test E-Port resilience under vibration
MITIGATION: Secure cable routing, strain relief
```

#### Does DJI failsafe engage correctly?

```
DJI FAILSAFE HIERARCHY (from DJI documentation):

1. OBSTACLE AVOIDANCE
   - Always active (cannot be disabled by SDK)
   - Will override SDK commands to prevent collision

2. GEOFENCING
   - Always active (cannot be disabled by SDK)
   - Hard stop at boundaries

3. BATTERY FAILSAFE
   - 10-25% triggers auto-landing
   - Cannot be overridden by SDK

4. LINK LOSS FAILSAFE
   - 3-6 second timeout
   - Action configurable: RTH, Hover, Land
   - SDK can configure to "Hover" for continued autonomous

5. SDK FAILSAFE ACTION
   - When enabled: SDK failure = configured action
   - Recommended: Set to RTH for safety
```

#### Can RPIC always override via RC?

**ANSWER: YES - GUARANTEED BY DJI DESIGN**

From [DJI Control Authority Documentation](https://developer.dji.com/onboard-sdk/documentation/guides/component-guide-control-authority.html):

> "The remote controller has the highest priority for control authority, and can regain control from the mobile device or onboard computer at any time. This is always done by switching the Flight Mode Switch on the remote controller."

```
RPIC OVERRIDE METHODS:
├── Flight Mode Switch: Immediately regains control
├── RTH Button: Initiates return to home
├── Pause/Stop: Halts waypoint mission
├── Stick Input: Overrides when flight mode switched
└── Motor Stop (ground only): Emergency motor cutoff

VERIFICATION REQUIRED:
├── Test flight mode switch during virtual stick control
├── Test RTH button during waypoint mission
├── Test stick override after SDK authority obtained
└── Document switch positions and expected behavior
```

---

# 4. Testing Requirements

## 4.1 Unit Testing

### Mock PSDK Interfaces

Create comprehensive mocks for all PSDK functions:

```python
# tests/mocks/psdk_mock.py

class MockPSDKService:
    """Mock PSDK service for unit testing."""

    def __init__(self, failure_injection=None):
        self.failure_injection = failure_injection
        self._telemetry = {
            'latitude': 37.7749,
            'longitude': -122.4194,
            'altitude': 100.0,
            'battery_percent': 75,
            'gps_satellites': 16,
            'flight_mode': 'WAYPOINT',
        }
        self._gimbal_attitude = (0.0, -45.0, 0.0)  # roll, pitch, yaw
        self._mission_state = 'IDLE'

    async def get_telemetry(self):
        """Return mock telemetry."""
        if self.failure_injection == 'telemetry_timeout':
            raise TimeoutError("Telemetry timeout")
        if self.failure_injection == 'telemetry_corrupt':
            return {'latitude': float('nan'), 'longitude': 0}
        return self._telemetry

    async def set_gimbal_angle(self, pitch, yaw, roll=0):
        """Mock gimbal control."""
        if self.failure_injection == 'gimbal_timeout':
            raise TimeoutError("Gimbal command timeout")
        self._gimbal_attitude = (roll, pitch, yaw)
        return True

    async def upload_mission(self, waypoints):
        """Mock mission upload."""
        if self.failure_injection == 'upload_fail':
            return False
        if self.failure_injection == 'upload_corrupt':
            raise ValueError("Mission checksum mismatch")
        self._mission_state = 'UPLOADED'
        return True

    async def start_mission(self):
        """Mock mission start."""
        if self._mission_state != 'UPLOADED':
            raise RuntimeError("No mission uploaded")
        self._mission_state = 'EXECUTING'
        return True
```

### Failure Injection Tests

```python
# tests/test_psdk_failures.py

import pytest
from tests.mocks.psdk_mock import MockPSDKService

class TestPSDKFailures:
    """Test BAHB behavior under PSDK failures."""

    @pytest.mark.parametrize("failure_type", [
        "telemetry_timeout",
        "telemetry_corrupt",
        "gimbal_timeout",
        "upload_fail",
        "upload_corrupt",
    ])
    async def test_failure_handling(self, failure_type):
        """Test graceful degradation on each failure type."""
        mock_psdk = MockPSDKService(failure_injection=failure_type)

        # System should handle failure without crash
        try:
            if 'telemetry' in failure_type:
                await mock_psdk.get_telemetry()
            elif 'gimbal' in failure_type:
                await mock_psdk.set_gimbal_angle(-45, 0)
            elif 'upload' in failure_type:
                await mock_psdk.upload_mission([])
        except Exception as e:
            # Verify exception is logged and handled
            assert True  # Replace with actual handler verification

    async def test_consecutive_failures_trigger_failover(self):
        """Test that consecutive failures trigger failover."""
        mock_psdk = MockPSDKService(failure_injection="telemetry_timeout")
        failure_count = 0

        for _ in range(5):
            try:
                await mock_psdk.get_telemetry()
            except TimeoutError:
                failure_count += 1

        # Should trigger failover after 3 consecutive failures
        assert failure_count >= 3
        # Verify failover was triggered (mock verification)
```

### Code Coverage Requirements

| Path Type | Coverage Requirement | Notes |
|-----------|---------------------|-------|
| Happy path | 100% | All normal flows |
| Error handling | 100% | All catch blocks |
| Failover paths | 100% | All degradation modes |
| Safety-critical | 100% | All safety functions |
| Edge cases | 95%+ | Boundary conditions |

## 4.2 Integration Testing

### Hardware-in-the-Loop (HIL) Testing

```
HIL TEST SETUP:

┌─────────────────────────────────────────────────────────────┐
│  TEST BENCH                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │ MANIFOLD 3  │◄───►│ E-PORT SIM  │◄───►│ DJI ASST 2  │   │
│  │ (Physical)  │     │ (Breakout)  │     │ SIMULATOR   │   │
│  └─────────────┘     └─────────────┘     └─────────────┘   │
│        │                                       │            │
│        ▼                                       ▼            │
│  ┌─────────────┐                       ┌─────────────┐     │
│  │ BAHB CODE   │                       │ SIM DISPLAY │     │
│  │ (Running)   │                       │ (Visual)    │     │
│  └─────────────┘                       └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

HIL TEST CATEGORIES:

1. NORMAL OPERATIONS
   - Mission upload and execution
   - Gimbal/camera control sequence
   - Telemetry subscription accuracy
   - Photo/video capture

2. FAULT INJECTION
   - E-Port disconnect simulation
   - GPS degradation
   - Battery level manipulation
   - Link quality degradation

3. TIMING VERIFICATION
   - Command latency measurement
   - Telemetry update rate verification
   - Callback timing analysis
```

### Ground Tethered Tests

```
TETHERED TEST PROTOCOL:

EQUIPMENT:
├── Matrice 4TD with Manifold 3 installed
├── Tether system (prevents flyaway)
├── Ground power supply (bypasses battery)
├── RC Plus 2 with test firmware
└── Monitoring station

TEST SEQUENCE:
1. POWER-ON SEQUENCE
   - Verify PSDK initialization
   - Verify telemetry subscription
   - Verify camera stream acquisition

2. MOTOR SPINUP (tethered)
   - Limited throttle test
   - Vibration impact on E-Port
   - Telemetry accuracy under vibration

3. HOVER TEST (tethered, short)
   - Waypoint hover at 1m
   - Gimbal control responsiveness
   - Position hold accuracy

4. FAILURE INJECTION
   - E-Port disconnect during hover
   - Manifold power cut during operation
   - Verify failsafe activation

5. AUTHORITY TRANSFER
   - PSDK → RC override test
   - RC → PSDK authority grant
   - Emergency switch positions
```

### Simulated Flight Environment

Using DJI Assistant 2 Simulator:

```
SIMULATION TEST MATRIX:

| Test Case | Duration | Iterations | Pass Criteria |
|-----------|----------|------------|---------------|
| Normal mission | 30 min | 10 | 100% completion |
| Link loss at various points | 5 min | 20 | RTH activated |
| Low battery simulation | 10 min | 10 | Auto-land triggered |
| GPS denial | 10 min | 10 | Position hold or RTH |
| High wind simulation | 20 min | 10 | Stable flight |
| Obstacle encounter | 5 min | 20 | Avoidance active |
| Geofence breach attempt | 5 min | 10 | Hard stop at boundary |
```

## 4.3 System Testing

### End-to-End Mission Execution

```python
# tests/system/test_full_mission.py

class TestFullMission:
    """End-to-end mission execution tests."""

    @pytest.mark.system
    @pytest.mark.slow
    async def test_complete_inspection_mission(self, real_or_simulated_drone):
        """Test complete inspection mission flow."""

        # 1. Pre-flight checks
        preflight = await self.run_preflight_checks()
        assert preflight.all_passed, f"Preflight failed: {preflight.failures}"

        # 2. Mission upload
        mission = self.create_test_mission(waypoints=10)
        upload_result = await self.upload_mission(mission)
        assert upload_result.success
        assert upload_result.checksum_verified

        # 3. Mission execution
        execution = await self.execute_mission_with_monitoring()

        # Verify during execution:
        # - All waypoints visited
        # - Gimbal actions executed
        # - Detections recorded
        # - No safety alerts triggered

        assert execution.waypoints_completed == 10
        assert execution.safety_violations == 0
        assert execution.detection_count > 0

        # 4. RTH and landing
        rth_result = await self.execute_rth()
        assert rth_result.landing_successful
```

### Stress Testing (Long Duration)

```
STRESS TEST PROTOCOL:

DURATION: 8 hours continuous operation (simulated)

MONITORING:
├── Memory usage trend
├── CPU temperature
├── GPU memory fragmentation
├── PSDK connection stability
├── Telemetry dropout count
├── Frame drop rate
└── Detection latency trend

PASS CRITERIA:
├── No memory leaks (growth < 100MB over 8 hours)
├── Temperature stable (no throttling)
├── Zero PSDK reconnections
├── Telemetry dropout < 0.1%
├── Frame drop < 1%
├── Detection latency < 50ms p99
```

### Environmental Testing

| Condition | Test Method | Pass Criteria |
|-----------|-------------|---------------|
| Temperature (-10C to +45C) | Climate chamber | All functions operational |
| Vibration | Shaker table (100-400 Hz) | No E-Port disconnects |
| Humidity (up to 95% non-condensing) | Humidity chamber | No electrical faults |
| EMI (power line proximity) | Near HV equipment | GPS lock maintained |

## 4.4 Flight Testing

### Progressive Risk Approach

```
FLIGHT TEST PROGRESSION:

PHASE 1: TETHERED FLIGHT (Risk: Minimal)
├── Basic hover
├── Position hold accuracy
├── Gimbal control validation
├── Photo/video capture
└── Duration: 1-2 days

PHASE 2: LOW ALTITUDE VLOS (Risk: Low)
├── Short waypoint missions (5-10 waypoints)
├── Manual override verification
├── RTH testing
├── Camera stream validation
└── Duration: 2-3 days

PHASE 3: OPERATIONAL ALTITUDE VLOS (Risk: Medium)
├── Full inspection missions
├── All agent workflows
├── Thermal correlation
├── VLM analysis
└── Duration: 1 week

PHASE 4: EXTENDED OPERATIONS (Risk: Medium)
├── Multiple batteries
├── Various weather conditions
├── Different infrastructure types
└── Duration: 2 weeks

PHASE 5: PRODUCTION VALIDATION (Risk: Managed)
├── Real client site (supervised)
├── Full operational tempo
├── All safety procedures
└── Duration: Ongoing
```

### Manual Override Verification

```
OVERRIDE TEST CHECKLIST:

[ ] Flight mode switch (P → S → A) regains control
[ ] RTH button initiates return during waypoint
[ ] RTH button initiates return during virtual stick
[ ] Stick input overrides after mode switch
[ ] Pause button halts waypoint mission
[ ] Emergency motor stop on ground
[ ] RPIC can abort at any mission phase
[ ] No "stuck in autonomous" scenarios
```

### Emergency Procedure Validation

| Emergency | Test Method | Expected Result |
|-----------|-------------|-----------------|
| Manifold failure | Power cut during flight | Failsafe RTH |
| E-Port disconnect | Cable disconnect | Failsafe RTH |
| BAHB crash | Kill process | Mission continues, degraded |
| Low battery | Simulated drain | Auto RTH at threshold |
| Link loss | RC power off | Failsafe RTH after timeout |
| GPS loss | Simulated | Position hold or land |
| Obstacle | Simulated/real | Avoidance maneuver |

---

# 5. Code Quality Requirements

## 5.1 Safety-Critical Coding Standards

### MISRA-C Guidelines Applicability

For the C++ PSDK service layer:

| MISRA Rule Category | Applicability | Notes |
|---------------------|---------------|-------|
| Rule 1: Environment | HIGH | Compiler warnings as errors |
| Rule 2: Language extensions | MEDIUM | Avoid non-standard extensions |
| Rule 3: Documentation | HIGH | All functions documented |
| Rule 4: Character sets | LOW | Standard UTF-8 |
| Rule 5: Identifiers | MEDIUM | Meaningful names |
| Rule 6: Types | HIGH | Explicit type sizes |
| Rule 7: Constants | MEDIUM | Named constants |
| Rule 8: Declarations | HIGH | Single declaration per line |
| Rule 9: Initialization | HIGH | Always initialize |
| Rule 10: Arithmetic | HIGH | Overflow checks |
| Rule 11: Pointers | HIGH | Null checks |
| Rule 12: Expressions | MEDIUM | Parenthesize for clarity |
| Rule 13: Control flow | HIGH | No goto |
| Rule 14: Loops | MEDIUM | Bounded loops |
| Rule 15: Switch | HIGH | Default case always |
| Rule 16: Functions | HIGH | No recursion in flight code |

### Static Analysis Requirements

| Tool | Purpose | Required Coverage |
|------|---------|-------------------|
| clang-tidy | C++ style/bugs | All warnings clean |
| cppcheck | Static analysis | All warnings clean |
| flake8 | Python style | All warnings clean |
| mypy | Python types | 100% type coverage |
| bandit | Python security | No high/critical |
| pylint | Python quality | Score > 9.0 |

### Code Review Checklist

```
SAFETY-CRITICAL CODE REVIEW CHECKLIST:

[ ] ARCHITECTURE
    [ ] Clean separation of concerns
    [ ] No circular dependencies
    [ ] Fail-safe defaults

[ ] ERROR HANDLING
    [ ] All exceptions caught
    [ ] No empty catch blocks
    [ ] Logging in all error paths
    [ ] Graceful degradation

[ ] RESOURCE MANAGEMENT
    [ ] No memory leaks
    [ ] Proper cleanup on exit
    [ ] Timeout on all blocking calls
    [ ] Connection retry limits

[ ] THREAD SAFETY
    [ ] Proper synchronization
    [ ] No race conditions
    [ ] Deadlock-free design
    [ ] Atomic operations where needed

[ ] INPUT VALIDATION
    [ ] All inputs validated
    [ ] Bounds checking
    [ ] Type checking
    [ ] Sanity limits

[ ] SAFETY
    [ ] RPIC override preserved
    [ ] Failsafe paths tested
    [ ] No safety system bypass
    [ ] Audit logging complete
```

### Documentation Requirements

| Artifact | Required Content | Update Frequency |
|----------|------------------|------------------|
| API documentation | All public functions, parameters, return values, exceptions | Per change |
| Architecture docs | System diagrams, data flows, component interactions | Per major change |
| Safety analysis | Failure modes, mitigations, test coverage | Quarterly review |
| Operations manual | Setup, operation, troubleshooting, emergency procedures | Per release |
| Test reports | Test results, coverage metrics, known issues | Per test cycle |

## 5.2 Error Handling

### No Silent Failures Policy

```python
# WRONG: Silent failure
def get_telemetry():
    try:
        return psdk.get_telemetry()
    except:
        return None  # Silent failure!

# CORRECT: Logged failure with fallback
def get_telemetry():
    try:
        telemetry = psdk.get_telemetry()
        validate_telemetry(telemetry)
        return telemetry
    except PSDKTimeoutError as e:
        logger.error(f"Telemetry timeout: {e}")
        metrics.increment("telemetry_timeout")
        return get_cached_telemetry()  # Fallback
    except PSDKCorruptionError as e:
        logger.critical(f"Telemetry corruption: {e}")
        metrics.increment("telemetry_corruption")
        trigger_safety_alert("telemetry_corruption")
        return None  # Explicit None with alert
```

### Comprehensive Logging

```python
# Required log levels and usage:

logger.debug("Detailed diagnostic info")    # Development only
logger.info("Normal operational events")    # Standard operations
logger.warning("Degraded performance")      # Attention needed
logger.error("Function failure, recovered") # Investigation needed
logger.critical("Safety-relevant failure")  # Immediate attention

# Required log fields for safety events:
{
    "timestamp": "2026-01-25T10:30:00Z",
    "level": "CRITICAL",
    "component": "psdk_service",
    "event": "control_authority_lost",
    "telemetry": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "altitude": 100.0,
        "battery": 65
    },
    "action_taken": "failover_to_rth",
    "rpic_notified": true
}
```

### Graceful Degradation

```
DEGRADATION HIERARCHY (from BAHB failover.py):

Level 0: FULL CAPABILITY
├── All AI models active
├── All sensors streaming
├── All agents operational

Level 1: VLM DISABLED (first to go)
├── Qwen-VL analysis suspended
├── Detection continues
├── Thermal analysis continues

Level 2: SAM3 DISABLED
├── Segmentation suspended
├── Bounding box detection only
├── Thermal analysis continues

Level 3: THERMAL FUSION DISABLED
├── Visual detection only
├── No temperature correlation
├── DJI thermal still available

Level 4: TRACKING DISABLED
├── Per-frame detection only
├── No temporal smoothing

Level 5: DETECTION FALLBACK
├── Emergency model (YOLO-nano)
├── Reduced accuracy
├── High speed maintained

Level 6+: DETECTION DISABLED → MISSION ABORT
├── RTH initiated
├── DJI native only
├── Log preservation
```

### Failsafe Defaults

| System | Failsafe Default | Rationale |
|--------|------------------|-----------|
| Flight control | RTH | Return aircraft safely |
| Camera | Recording stopped, stream continues | Preserve safety view |
| Gimbal | Return to forward level | Known safe position |
| AI inference | Disable, DJI native only | Preserve flight safety |
| Logging | Emergency flush, preserve | Post-incident analysis |
| Alerts | RPIC notification | Human oversight |

---

# 6. PSDK Function Verification Matrix

## Current Implementation Status

| Function | Implemented | Unit Test | Integration Test | HIL Test | Flight Test | Status |
|----------|-------------|-----------|------------------|----------|-------------|--------|
| PSDK Initialization | STUB | PARTIAL | NO | NO | NO | **NOT STARTED** |
| Telemetry Subscription | STUB | PARTIAL | NO | NO | NO | **NOT STARTED** |
| GPS Position | STUB | YES (mock) | NO | NO | NO | **NOT STARTED** |
| Battery State | STUB | YES (mock) | NO | NO | NO | **NOT STARTED** |
| Flight Mode | STUB | YES (mock) | NO | NO | NO | **NOT STARTED** |
| RC Link Quality | STUB | YES (mock) | NO | NO | NO | **NOT STARTED** |
| Gimbal Attitude Read | STUB | YES (mock) | NO | NO | NO | **NOT STARTED** |
| Gimbal Control | STUB | YES (mock) | NO | NO | NO | **NOT STARTED** |
| Camera Stream Start | PARTIAL | YES (mock) | NO | NO | NO | **IN PROGRESS** |
| Camera Stream Stop | PARTIAL | YES (mock) | NO | NO | NO | **IN PROGRESS** |
| Photo Capture | STUB | NO | NO | NO | NO | **NOT STARTED** |
| Video Recording | STUB | NO | NO | NO | NO | **NOT STARTED** |
| Zoom Control | STUB | YES (mock) | NO | NO | NO | **NOT STARTED** |
| Waypoint Upload | STUB | PARTIAL | NO | NO | NO | **NOT STARTED** |
| Waypoint Start | STUB | PARTIAL | NO | NO | NO | **NOT STARTED** |
| Waypoint Pause | STUB | NO | NO | NO | NO | **NOT STARTED** |
| Waypoint Resume | STUB | NO | NO | NO | NO | **NOT STARTED** |
| Waypoint Stop | STUB | NO | NO | NO | NO | **NOT STARTED** |
| Virtual Stick Enable | STUB | NO | NO | NO | NO | **NOT STARTED** |
| Virtual Stick Control | STUB | NO | NO | NO | NO | **NOT STARTED** |
| Virtual Stick Disable | STUB | NO | NO | NO | NO | **NOT STARTED** |
| RTH Trigger | STUB | NO | NO | NO | NO | **NOT STARTED** |
| Emergency Land | STUB | NO | NO | NO | NO | **NOT STARTED** |
| Obstacle Avoidance State | STUB | NO | NO | NO | NO | **NOT STARTED** |
| Geofence State | STUB | NO | NO | NO | NO | **NOT STARTED** |
| Flight Control Authority | STUB | NO | NO | NO | NO | **NOT STARTED** |

## Verification Status Legend

| Symbol | Meaning |
|--------|---------|
| STUB | Code exists but returns mock values |
| PARTIAL | Some functionality implemented |
| YES (mock) | Test exists with mock data |
| NO | Not implemented |
| PENDING | Awaiting prerequisite |
| PASSED | Verified working |

---

# 7. Risk Assessment

## 7.1 Technical Risks

| Risk ID | Risk | Likelihood | Impact | Mitigation | Status |
|---------|------|------------|--------|------------|--------|
| TR-001 | PSDK learning curve underestimated | MEDIUM | HIGH | Allocate 4-6 weeks, DJI support contract | OPEN |
| TR-002 | Undocumented API behaviors | HIGH | MEDIUM | Extensive testing, community engagement | OPEN |
| TR-003 | PSDK version incompatibility | MEDIUM | HIGH | Lock versions, regression testing | OPEN |
| TR-004 | DJI support responsiveness | MEDIUM | MEDIUM | Enterprise support contract, backup plans | OPEN |
| TR-005 | Python bindings quality | HIGH | MEDIUM | Use IPC architecture instead | MITIGATED |
| TR-006 | Thread safety issues | MEDIUM | HIGH | Comprehensive concurrency testing | OPEN |
| TR-007 | Memory management complexity | MEDIUM | MEDIUM | Static analysis, leak detection | OPEN |
| TR-008 | Real-time performance | MEDIUM | HIGH | Profiling, optimization budget | OPEN |

## 7.2 Operational Risks

| Risk ID | Risk | Likelihood | Impact | Mitigation | Status |
|---------|------|------------|--------|------------|--------|
| OR-001 | Code failure during BVLOS | LOW | CATASTROPHIC | VLOS only initially, progressive testing | OPEN |
| OR-002 | Regulatory non-compliance | MEDIUM | HIGH | Legal review, documentation | OPEN |
| OR-003 | Insurance implications | MEDIUM | HIGH | Insurer approval before flight | OPEN |
| OR-004 | RPIC training adequacy | MEDIUM | HIGH | Comprehensive training program | OPEN |
| OR-005 | Emergency procedure gaps | LOW | HIGH | Document and drill all scenarios | OPEN |
| OR-006 | Field maintenance complexity | MEDIUM | MEDIUM | Clear procedures, spare parts | OPEN |

## 7.3 Risk Matrix

```
           │ NEGLIGIBLE │ MINOR │ MAJOR │ HAZARDOUS │ CATASTROPHIC
───────────┼────────────┼───────┼───────┼───────────┼─────────────
FREQUENT   │            │       │       │           │
───────────┼────────────┼───────┼───────┼───────────┼─────────────
LIKELY     │            │       │ TR-002│           │
───────────┼────────────┼───────┼───────┼───────────┼─────────────
POSSIBLE   │            │TR-004 │ TR-007│ TR-001    │
           │            │TR-005 │       │ TR-003    │
           │            │       │       │ TR-006    │
           │            │       │       │ TR-008    │
───────────┼────────────┼───────┼───────┼───────────┼─────────────
UNLIKELY   │            │       │ OR-006│ OR-002    │ OR-001
           │            │       │       │ OR-003    │
           │            │       │       │ OR-004    │
───────────┼────────────┼───────┼───────┼───────────┼─────────────
REMOTE     │            │       │       │ OR-005    │
```

---

# 8. Recommendations

## 8.1 Go/No-Go Criteria

### Before Starting PSDK Development

| Criterion | Requirement | Current Status |
|-----------|-------------|----------------|
| DJI Developer account | Enterprise tier | CHECK |
| PSDK license agreement | Signed | CHECK |
| Manifold 3 hardware | Available for development | CHECK |
| Matrice 4TD access | Available for testing | CHECK |
| DJI Assistant 2 | Installed, simulator verified | CHECK |
| Team C++ expertise | At least 1 senior engineer | **VERIFY** |
| Safety review | Architecture approved | **PENDING** |
| Schedule buffer | 50% schedule margin | **VERIFY** |

### Before Ground Testing

| Criterion | Requirement | Current Status |
|-----------|-------------|----------------|
| Unit test coverage | 100% safety paths | **NOT MET** |
| HIL testing complete | All normal paths | **NOT MET** |
| Static analysis clean | No critical warnings | **NOT MET** |
| Code review complete | 2 reviewers signed off | **NOT MET** |
| Safety documentation | FMEA complete | **PARTIAL** |
| Emergency procedures | Documented and reviewed | **PARTIAL** |
| Tether equipment | Available and tested | **VERIFY** |

### Before Flight Testing

| Criterion | Requirement | Current Status |
|-----------|-------------|----------------|
| Ground testing complete | All tests passed | **NOT MET** |
| Integration testing complete | All interfaces verified | **NOT MET** |
| RPIC override verified | In simulation | **NOT MET** |
| Failsafe verified | All scenarios tested | **NOT MET** |
| Insurance approval | Flight coverage confirmed | **VERIFY** |
| Weather limits defined | Documented | CHECK |
| Emergency landing sites | Identified and approved | **VERIFY** |
| Visual observer available | If required by regulations | **VERIFY** |

### Before Production Deployment

| Criterion | Requirement | Current Status |
|-----------|-------------|----------------|
| All flight tests passed | 20+ hours, no incidents | **NOT MET** |
| RPIC training complete | Certified operators | **NOT MET** |
| Maintenance procedures | Documented | **NOT MET** |
| Client site approval | Site survey complete | **NOT MET** |
| Regulatory compliance | All permits obtained | **VERIFY** |
| Support infrastructure | Spare parts, remote support | **NOT MET** |
| Incident response plan | Documented and trained | **NOT MET** |

## 8.2 Alternative Approaches

### If PSDK Proves Infeasible

#### Option A: MSDK-Only Approach

**Description:** Run all control logic on RC Plus 2 tablet via MSDK, with Manifold 3 only for AI inference.

**Pros:**
- MSDK is more mature and documented
- Official Android support
- Simpler authority management

**Cons:**
- Requires constant RC link for control
- Higher latency for AI-triggered actions
- More complex inter-device communication
- Not suitable for BVLOS

**Verdict:** BACKUP OPTION for initial deployment

#### Option B: Third-Party SDK Wrappers

**Description:** Use community-developed Python wrappers or commercial integration tools.

**Known Options:**
- [DJIControlClient](https://github.com/dkapur17/DJIControlClient) - Python wrapper (limited)
- Commercial integrators (Auterion, etc.)

**Pros:**
- Faster initial development
- Python compatibility

**Cons:**
- Not officially supported
- May lag PSDK updates
- Reliability unknown
- Support dependency

**Verdict:** NOT RECOMMENDED for safety-critical application

#### Option C: DJI FlightHub Integration

**Description:** Use DJI's cloud platform for mission management, with Manifold 3 for edge AI only.

**Pros:**
- DJI-supported solution
- Includes mission planning
- Fleet management features

**Cons:**
- Requires cloud connectivity
- Less real-time control
- Subscription costs
- Limited customization

**Verdict:** COMPLEMENTARY - use for mission planning, not real-time control

## 8.3 Recommended Implementation Roadmap

```
PHASE 1: FOUNDATION (Weeks 1-4)
├── Week 1: C++ PSDK service skeleton
├── Week 2: Telemetry subscription, basic camera
├── Week 3: Gimbal control, photo/video
├── Week 4: IPC layer (ZeroMQ to Python)
└── Deliverable: Basic telemetry and camera working

PHASE 2: CORE FUNCTIONS (Weeks 5-8)
├── Week 5: Waypoint mission upload/execute
├── Week 6: Mission pause/resume/stop
├── Week 7: Unit tests, failure injection
├── Week 8: HIL testing with simulator
└── Deliverable: Waypoint missions working in simulator

PHASE 3: ADVANCED FUNCTIONS (Weeks 9-12)
├── Week 9: Virtual stick implementation
├── Week 10: Authority management
├── Week 11: Failsafe integration
├── Week 12: Integration testing
└── Deliverable: Full function set in simulator

PHASE 4: VALIDATION (Weeks 13-16)
├── Week 13: Ground testing (tethered)
├── Week 14: Low altitude flight testing
├── Week 15: Operational flight testing
├── Week 16: Documentation, training
└── Deliverable: Flight-ready system

PHASE 5: PRODUCTION (Weeks 17+)
├── Client site validation
├── Progressive operational deployment
├── Continuous improvement
└── BVLOS preparation (future)
```

---

# 9. Conclusion

## Feasibility Summary

| Area | Feasibility | Confidence | Recommendation |
|------|-------------|------------|----------------|
| **PSDK Integration** | FEASIBLE | 80% | Proceed with IPC architecture |
| **Telemetry Access** | HIGH | 95% | Standard PSDK feature |
| **Camera/Gimbal** | HIGH | 90% | Well-documented APIs |
| **Waypoint Missions** | MEDIUM-HIGH | 75% | Core PSDK capability |
| **Virtual Stick** | MEDIUM | 60% | Proceed with caution |
| **Full Autonomy** | LIMITED | 40% | RPIC always required |

## Critical Success Factors

1. **IPC Architecture** - Separate PSDK service from Python AI code
2. **Comprehensive Testing** - Unit, integration, HIL, flight
3. **Failsafe-First Design** - Assume failure, design for recovery
4. **RPIC Training** - Operators must understand override procedures
5. **Progressive Deployment** - Simulation → Tethered → VLOS → Production

## Final Recommendation

**PROCEED WITH PSDK IMPLEMENTATION** following the phased roadmap above.

Key constraints to accept:
- RPIC always has override authority (by design)
- Virtual stick has limitations compared to MSDK
- C++ PSDK service is required (no Python shortcut)
- Testing will require significant simulator and flight time
- BVLOS operations require additional equipment and approvals

The technical foundation exists. Success depends on disciplined execution of the testing and validation phases.

---

# Appendix A: Sources

- [DJI Payload SDK GitHub](https://github.com/dji-sdk/Payload-SDK)
- [DJI PSDK Documentation](https://developer.dji.com/doc/payload-sdk-tutorial/en/)
- [DJI PSDK API Reference](https://developer.dji.com/doc/payload-sdk-api-reference/en/)
- [DJI Manifold 3 Product Page](https://enterprise.dji.com/manifold-3)
- [DJI Manifold 3 FAQ](https://enterprise.dji.com/manifold-3/faq)
- [DJI Control Authority Documentation](https://developer.dji.com/onboard-sdk/documentation/guides/component-guide-control-authority.html)
- [DJI Flight Controller Documentation](https://developer.dji.com/onboard-sdk/documentation/guides/component-guide-flight-control.html)
- [DJI Virtual Stick Tutorial](https://developer.dji.com/doc/mobile-sdk-tutorial/en/tutorials/virtual-stick.html)
- [DJI RTH Logic](https://support.dji.com/help/content?customId=en-us03400006776)
- [DJI SDK Guide](https://enterprise-insights.dji.com/blog/dji-sdk-guide)
- [arXiv: Custom Payloads on DJI Matrice](https://arxiv.org/html/2405.06176v1)
- [ABJ Academy: Manifold 3 Autonomous Operations](https://abjacademy.global/drone-blog/how-dji-manifold-3-powers-autonomous-drone-operations/)

---

**Document Status: DRAFT - REQUIRES SAFETY REVIEW BEFORE IMPLEMENTATION**

**Approval Signatures:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Chief Safety Officer | _____________ | _____________ | _____________ |
| Technical Lead | _____________ | _____________ | _____________ |
| Chief Pilot (RPIC) | _____________ | _____________ | _____________ |
| Project Manager | _____________ | _____________ | _____________ |
