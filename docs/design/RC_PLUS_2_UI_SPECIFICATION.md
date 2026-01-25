# BAHB RC Plus 2 Display UI Specification

**Document Version:** 1.0
**Created:** 2026-01-25
**Platform:** DJI RC Plus 2 Enterprise (7" 1920x1200, 1400 nits)
**Status:** DESIGN SPECIFICATION

---

## Executive Summary

This document defines the UI/UX design for BAHB's infrastructure inspection overlay on the DJI RC Plus 2 remote controller. The design philosophy is **COMPLEMENT, NOT DUPLICATE** - leveraging DJI's excellent built-in capabilities while adding BAHB's unique value.

### Design Principles

1. **Safety First** - Critical information must be immediately visible
2. **Minimal Cognitive Load** - RPIC is flying; don't overwhelm
3. **Outdoor Readability** - 1400 nit display, but glare is real
4. **Quick Action** - One tap to investigate, two taps max for any action
5. **Non-Intrusive** - Never block DJI's flight-critical displays

---

## 1. Information Hierarchy

### Tier 1: Always Visible (Critical Safety)
```
Priority: IMMEDIATE ATTENTION REQUIRED
Location: Dedicated screen zones, cannot be dismissed
Update Rate: Real-time (30 FPS)

- Critical anomaly alerts (flashing)
- AI system connection status
- Active inspection indicator
```

### Tier 2: Glanceable (Operational Awareness)
```
Priority: CHECK PERIODICALLY
Location: Status bar, minimal footprint
Update Rate: 1 Hz

- Detection count
- FPS / system performance
- Anomaly queue count with severity indicator
- Thermal correlation status
```

### Tier 3: On-Demand (Detailed Information)
```
Priority: ACCESS WHEN NEEDED
Location: Slide-out panels, modal overlays
Trigger: User gesture or button press

- Anomaly list with details
- VLM analysis text
- Detection confidence breakdown
- Mission progress
- System diagnostics
```

### Tier 4: Post-Flight (Reference)
```
Priority: REVIEW LATER
Location: Not shown during flight

- Full reports
- Historical data
- Configuration
```

---

## 2. Screen Layout Architecture

### 2.1 Master Layout (1920x1200)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              STATUS BAR (48px)                               │
│ [●] AI Connected │ INSPECTING │ Detections: 12 │ Anomalies: 3 │ 35 FPS     │
├────┬────────────────────────────────────────────────────────────────────────┤
│    │                                                                        │
│ C  │                                                                        │
│ O  │                                                                        │
│ N  │                          DJI FPV VIDEO FEED                            │
│ T  │                                                                        │
│ R  │              ┌──────────────────────────────────────┐                  │
│ O  │              │     BAHB DETECTION OVERLAY           │                  │
│ L  │              │  (Bounding boxes, labels, thermal)   │                  │
│    │              └──────────────────────────────────────┘                  │
│ 72 │                                                                        │
│ px │                                                                        │
│    │                                                    ┌─────────────────┐ │
│    │                                                    │ THERMAL PANEL   │ │
│    │                                                    │ Max: 87°C       │ │
│    │                                                    │ ΔT: 42°C        │ │
│    │                                                    └─────────────────┘ │
├────┴────────────────────────────────────────────────────────────────────────┤
│                              BOTTOM BAR (40px)                               │
│ Detection: transformer ✓  │  [DJI Battery] [DJI GPS] [DJI Signal]          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 With Anomaly Panel Expanded

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              STATUS BAR (48px)                               │
├────┬───────────────────────────────────────────────────────────┬────────────┤
│    │                                                           │  ANOMALY   │
│ C  │                                                           │  PANEL     │
│ O  │                                                           │  (280px)   │
│ N  │                     DJI FPV VIDEO FEED                    │            │
│ T  │                                                           │ ┌────────┐ │
│ R  │              + BAHB DETECTION OVERLAY                     │ │ CRIT   │ │
│ O  │                                                           │ │ Hotspot│ │
│ L  │                                                           │ │ 95°C   │ │
│    │                                                           │ └────────┘ │
│    │                                                           │ ┌────────┐ │
│    │                                                           │ │ HIGH   │ │
│    │                                                           │ │ Damage │ │
│    │                                                           │ │ 87%    │ │
│    │                                                           │ └────────┘ │
├────┴───────────────────────────────────────────────────────────┴────────────┤
│                              BOTTOM BAR (40px)                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Investigation Mode (Full Focus)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [X CLOSE]                 INVESTIGATION MODE                    [CONFIRM]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌─────────────────────────────────┐  ┌─────────────────────────────────┐│
│    │                                 │  │                                 ││
│    │         RGB SNAPSHOT            │  │       THERMAL SNAPSHOT          ││
│    │                                 │  │                                 ││
│    │      (with detection box)       │  │     (with temperature map)      ││
│    │                                 │  │                                 ││
│    └─────────────────────────────────┘  └─────────────────────────────────┘│
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │ VLM ANALYSIS                                                        │ │
│    │ "Transformer showing elevated temperature (87°C) on bushing A.      │ │
│    │  Pattern consistent with internal resistance or oil degradation.    │ │
│    │  Recommend thermographic follow-up within 7 days."                  │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│    [CAPTURE HI-RES]  [ADD NOTE]  [SET WAYPOINT]  [DISMISS - NOT ANOMALY]  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Specifications

### 3.1 Status Bar (Top)

```
Height: 48px
Background: rgba(0, 0, 0, 0.75) with 4px blur
Position: Fixed top, full width

┌─────────────────────────────────────────────────────────────────────────────┐
│ [●] AI System │ INSPECTING │ Det: 12 │ ⚠ 3 │ 35 FPS │ 68% GPU             │
└─────────────────────────────────────────────────────────────────────────────┘
  │       │           │          │      │       │          │
  │       │           │          │      │       │          └── GPU Memory %
  │       │           │          │      │       └── Inference FPS
  │       │           │          │      └── Anomaly count (color = max severity)
  │       │           │          └── Detection count
  │       │           └── Inspection state
  │       └── Manifold connection (green/red/yellow)
  └── Status indicator dot

State Colors:
- Connected + Active:  ● Green dot, "INSPECTING" in cyan
- Connected + Idle:    ● Green dot, "READY" in gray
- Disconnected:        ● Red dot, "DISCONNECTED" in red
- Error:               ● Yellow dot, "AI ERROR" flashing
```

### 3.2 Control Panel (Left Side)

```
Width: 72px
Background: rgba(0, 0, 0, 0.8)
Position: Left edge, below status bar, above bottom bar
Button Size: 56x56px with 8px spacing

┌──────┐
│  ▶   │  Start/Stop Inspection
│      │  Green = Start, Red = Stop (active)
├──────┤
│  📷  │  Capture Snapshot
│      │  Triggers RGB + Thermal + Metadata
├──────┤
│  🌡️  │  Thermal Overlay Toggle
│      │  Full opacity = ON, 50% = OFF
├──────┤
│  ⚠️  │  Anomaly Panel Toggle
│ [3]  │  Badge shows count, color = severity
├──────┤
│  🔍  │  Investigation Mode
│      │  Visible only when anomaly selected
├──────┤
│  📊  │  VLM Analysis Panel
│      │  Shows/hides AI description
└──────┘

Physical Button Mapping (RC Plus 2):
- C1 Button: Toggle Inspection (same as ▶)
- C2 Button: Capture Snapshot (same as 📷)
- 5D Press: Toggle Thermal (same as 🌡️)
- Volume Up: Cycle through anomalies
```

### 3.3 Detection Overlay (Main Canvas)

```
Position: Overlays DJI FPV, full video area
Coordinate System: Normalized [0,1] from AI → scaled to view dimensions

BOX STYLES BY DETECTION TYPE:

1. Infrastructure Equipment (Normal State)
   ┌─────────────────────────┐
   │                         │
   │                         │  Color: Cyan (#00C8AA)
   │                         │  Stroke: 3px solid
   │                         │  Corners: 4px radius
   └─────────────────────────┘
   transformer 94%              Label: Above box, black bg

2. Infrastructure Equipment (Selected/Tracked)
   ╔═════════════════════════╗
   ║                         ║
   ║                         ║  Color: White (#FFFFFF)
   ║                         ║  Stroke: 4px solid
   ║                         ║  Animated corners
   ╚═════════════════════════╝

3. Defect Detection (Non-Critical)
   ┌┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐
   ┊                         ┊
   ┊                         ┊  Color: Orange (#FFA000)
   ┊                         ┊  Stroke: 3px dashed
   ┊                         ┊
   └┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┘
   corrosion 78%

4. Anomaly - HIGH Severity
   ╔═════════════════════════╗
   ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║
   ║▓                       ▓║  Color: Orange-Red (#FF6600)
   ║▓                       ▓║  Stroke: 4px solid
   ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║  Fill: 10% opacity
   ╚═════════════════════════╝  Pulsing glow effect
   ⚠ HOTSPOT 87°C

5. Anomaly - CRITICAL Severity
   ╔═╦═════════════════════╦═╗
   ║█║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║█║
   ║█║▓   FLASH BORDER    ▓║█║  Color: Red (#FF2222)
   ║█║▓                   ▓║█║  Stroke: 5px, flashing
   ║█║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║█║  Fill: 15% opacity
   ╚═╩═════════════════════╩═╝  ALERT SOUND + HAPTIC
   🔴 CRITICAL: 102°C

Corner Accent Drawing (all boxes):
   ┌──┐                    ┌──┐
   │                          │
   │                          │   20px corner accents
                                  2px thicker than box stroke

THERMAL CORRELATION INDICATOR:
   When detection has thermal data:
   ┌─────────────────────────┐
   │                      🌡️ │  Small thermal icon
   │                    87°C │  Temperature in corner
   │                         │  Color matches temp severity
   └─────────────────────────┘
```

### 3.4 Thermal Information Panel

```
Position: Top-right corner, 16px margin
Size: 200x140px
Background: rgba(0, 0, 0, 0.85), 12px radius
Visibility: When thermal overlay enabled

┌─────────────────────────┐
│ 🌡️ THERMAL              │  Header: White, 14sp bold
├─────────────────────────┤
│ Max: 87°C          ████ │  Value: Color-coded
│ Min: 22°C          ████ │  Bar: Visual temperature
│ Mean: 45°C         ████ │
│ ΔT: 65°C           ⚠️   │  Warning icon if >30°C
├─────────────────────────┤
│ Hotspots: 3             │  Count of detected hotspots
└─────────────────────────┘

Temperature Color Scale:
- < 40°C:   Green  (#64FF64)
- 40-60°C:  Yellow (#FFFF00)
- 60-80°C:  Orange (#FFA500)
- 80-100°C: Red    (#FF4444)
- > 100°C:  White on Red bg (CRITICAL)
```

### 3.5 Anomaly Panel (Right Slide-Out)

```
Width: 280px
Position: Right edge, slides in/out
Background: rgba(0, 0, 0, 0.9)
Trigger: Button tap or swipe from right edge

┌───────────────────────────────┐
│ ANOMALIES (3)          [X]   │  Header with close button
├───────────────────────────────┤
│ ┌─────────────────────────┐  │
│ │▓█ CRITICAL             │  │  Severity bar (left edge)
│ │   Thermal Hotspot       │  │  Type in CAPS
│ │   Transformer #3        │  │  Associated equipment
│ │   102°C (ΔT: 80°C)      │  │  Key metric
│ │   10:34:22        [→]   │  │  Timestamp + action button
│ └─────────────────────────┘  │
│                               │
│ ┌─────────────────────────┐  │
│ │▓▓ HIGH                  │  │  Orange bar
│ │   Surface Damage        │  │
│ │   Insulator cluster     │  │
│ │   Conf: 87%             │  │
│ │   10:32:15        [→]   │  │
│ └─────────────────────────┘  │
│                               │
│ ┌─────────────────────────┐  │
│ │░░ MEDIUM               │  │  Yellow bar
│ │   Corrosion Detected    │  │
│ │   Switchgear housing    │  │
│ │   Conf: 72%             │  │
│ │   10:28:44        [→]   │  │
│ └─────────────────────────┘  │
│                               │
│ [SCROLL FOR MORE...]          │
└───────────────────────────────┘

Anomaly Card States:
- Default: Dark background
- Selected: Lighter background + border highlight
- New (unviewed): Subtle pulse animation
- Dismissed: Fade out animation

Tap Actions:
- Card tap: Select anomaly, highlight in overlay
- [→] button: Enter Investigation Mode
- Swipe left: Dismiss (with confirmation)
```

### 3.6 VLM Analysis Panel (Bottom Slide-Up)

```
Height: 180px (collapsed) / 320px (expanded)
Position: Bottom, above bottom bar
Trigger: VLM button or anomaly investigation

┌─────────────────────────────────────────────────────────────────────────────┐
│ AI ANALYSIS                                            [▼ COLLAPSE]        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ "The transformer unit shows significantly elevated thermal signature        │
│  (87°C) concentrated on the upper bushing connection. This 42°C            │
│  differential from ambient suggests potential internal resistance           │
│  buildup or degraded oil condition. The pattern is consistent with         │
│  early-stage connection deterioration."                                     │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ RECOMMENDATIONS:                                                            │
│ • Schedule detailed thermographic inspection within 7 days                  │
│ • Review maintenance history for this unit                                  │
│ • Compare with baseline thermal profile if available                        │
│                                                                             │
│ [ACCEPT & LOG]        [REQUEST CLARIFICATION]        [DISMISS]             │
└─────────────────────────────────────────────────────────────────────────────┘

Typography:
- Analysis text: 16sp, line height 1.4, white
- Recommendations: 14sp, bullet points, cyan
- Buttons: 14sp bold, pill-shaped

Scroll behavior: Vertical scroll if content exceeds panel height
```

### 3.7 Alert Notification (Modal)

```
For CRITICAL anomalies - interrupts workflow

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                           ⚠️  CRITICAL ALERT  ⚠️                            │
│                                                                             │
│    ┌───────────────────────────────────────────────────────────────────┐   │
│    │                                                                   │   │
│    │                         [THUMBNAIL]                               │   │
│    │                                                                   │   │
│    └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                    THERMAL HOTSPOT DETECTED                                 │
│                    Temperature: 102°C (CRITICAL)                            │
│                    Location: Transformer Unit #3                            │
│                                                                             │
│    ┌─────────────────────┐              ┌─────────────────────┐            │
│    │   INVESTIGATE NOW   │              │     ACKNOWLEDGE     │            │
│    │   (Enter Focus Mode)│              │   (Continue Flight) │            │
│    └─────────────────────┘              └─────────────────────┘            │
│                                                                             │
│                         [ ] Don't show for 30 seconds                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Behavior:
- Full screen overlay with semi-transparent background
- Haptic feedback: 3 strong pulses
- Audio: Distinct alert tone (configurable)
- Auto-dismiss: Never (requires user action)
- Timeout option: User can suppress similar alerts temporarily

Button States:
- INVESTIGATE NOW: Primary (cyan fill)
- ACKNOWLEDGE: Secondary (outline only)
```

### 3.8 RPIC Confirmation Dialog

```
For actions requiring pilot confirmation

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         CONFIRM ACTION                                      │
│                                                                             │
│         The AI recommends capturing detailed imagery of this                │
│         anomaly using the zoom camera at 50x magnification.                 │
│                                                                             │
│         This will:                                                          │
│         • Pause current flight path                                         │
│         • Activate zoom camera                                              │
│         • Capture 4 high-resolution images                                  │
│         • Resume previous flight mode                                       │
│                                                                             │
│         Estimated time: ~30 seconds                                         │
│                                                                             │
│    ┌─────────────────────┐              ┌─────────────────────┐            │
│    │      APPROVE        │              │       CANCEL        │            │
│    └─────────────────────┘              └─────────────────────┘            │
│                                                                             │
│            Confidence: 87%  |  Similar actions approved: 12                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

For high-confidence (>90%) recommendations, show:
"AI suggests: [ACTION]. Auto-executing in 5...4...3... [CANCEL]"
```

---

## 4. Color Specification

### 4.1 Core Palette

```
BRAND COLORS
────────────────────────────────
Primary        #00A8CC  (Cyan)           - Main accent, active states
Primary Dark   #007799  (Dark Cyan)      - Pressed states
Accent         #00FFD4  (Bright Cyan)    - Highlights, counts

BACKGROUND COLORS
────────────────────────────────
Background     #121212  (Near Black)     - App background
Panel BG       rgba(0,0,0,0.85)          - Overlay panels
Card BG        #1E1E1E  (Dark Gray)      - Cards, list items
Card Selected  #2A2A2A  (Medium Gray)    - Selected state

TEXT COLORS
────────────────────────────────
Primary Text   #FFFFFF  (White)          - Main content
Secondary Text #AAAAAA  (Light Gray)     - Labels, hints
Disabled Text  #666666  (Dark Gray)      - Disabled items

SEVERITY COLORS
────────────────────────────────
Critical       #FF2222  (Bright Red)     - Immediate danger
High           #FF6600  (Orange-Red)     - Urgent attention
Medium         #FFAA00  (Orange)         - Monitor closely
Low            #FFDD00  (Yellow)         - Note for review
Info           #00AAFF  (Light Blue)     - Informational

STATUS COLORS
────────────────────────────────
Connected      #00DD00  (Green)          - Good connection
Warning        #FFAA00  (Orange)         - System warning
Error          #FF4444  (Red)            - System error
Offline        #888888  (Gray)           - Disconnected

DETECTION CLASS COLORS
────────────────────────────────
Equipment      #00C8AA  (Teal)           - transformer, insulator, etc.
Structure      #8888FF  (Light Blue)     - tower, pole, structure
Defect         #FFA000  (Orange)         - damage, corrosion, leak
Hotspot        #FF6B35  (Red-Orange)     - thermal anomaly

TEMPERATURE SCALE
────────────────────────────────
Cold           #4488FF  (Blue)           - Below ambient
Normal         #44FF44  (Green)          - Expected range
Warm           #FFFF00  (Yellow)         - Elevated
Hot            #FFA500  (Orange)         - Warning threshold
Critical       #FF0000  (Red)            - Danger threshold
```

### 4.2 Outdoor Visibility Considerations

```
CONTRAST REQUIREMENTS (WCAG AA minimum, AAA preferred)

For 1400 nit display in bright sunlight:
- Text on panels: 7:1 contrast ratio minimum
- Status indicators: 10:1 contrast ratio
- Alert elements: Use both color AND shape/animation

ANTI-GLARE MEASURES
- All critical text has dark background/shadow
- No pure white backgrounds (use #F0F0F0 max)
- Avoid thin fonts (<600 weight for critical info)
- Animated elements use high-contrast colors

COLORBLIND ACCESSIBILITY
- Never rely on color alone
- Severity uses: Color + Icon + Position + Shape
  CRITICAL: Red + 🔴 + Flashing border + Double line
  HIGH:     Orange + ⚠️ + Thick border + Dashed line
  MEDIUM:   Yellow + ⚡ + Normal border + Solid line
  LOW:      Blue + ℹ️ + Thin border + Dotted line
```

---

## 5. Typography Specification

### 5.1 Font Stack

```
PRIMARY FONT: Roboto (Android default, excellent readability)

Fallback: sans-serif (system default)

MONOSPACE: Roboto Mono (for technical data, temperatures)

Fallback: monospace
```

### 5.2 Type Scale

```
HIERARCHY                  SIZE    WEIGHT    USE CASE
────────────────────────────────────────────────────────
Display Large              32sp    700       Alert titles
Display Medium             24sp    700       Panel headers
Title Large                20sp    600       Section headers
Title Medium               18sp    600       Card titles
Body Large                 16sp    400       Primary content
Body Medium                14sp    400       Secondary content
Label Large                14sp    500       Button text
Label Medium               12sp    500       Badges, tags
Caption                    10sp    400       Timestamps, hints

SPECIFIC APPLICATIONS
────────────────────────────────────────────────────────
Detection label            14sp    700       "transformer 94%"
Temperature value          18sp    700       "87°C"
Anomaly type              16sp    600       "THERMAL HOTSPOT"
VLM analysis text         16sp    400       AI description
Status bar items          14sp    500       System status
Button text               14sp    700       Action buttons
```

### 5.3 Text Rendering Rules

```
LINE HEIGHT
- Body text: 1.4x font size
- Single-line labels: 1.0x
- Multi-line descriptions: 1.5x

TRUNCATION
- Detection labels: Ellipsis after 20 chars
- Anomaly descriptions: 2 lines max, ellipsis
- VLM text: Scrollable, no truncation

SHADOWS (for overlay text)
- Color: rgba(0, 0, 0, 0.8)
- Offset: 1px, 1px
- Blur: 2px
```

---

## 6. Interaction Patterns

### 6.1 Touch Gestures

```
SINGLE TAP
────────────────────────────────────────────
Location          Action
────────────────────────────────────────────
Detection box     Select detection, show details in panel
Anomaly card      Select, highlight in overlay
Control button    Activate function
Panel header      Collapse/expand panel
VLM panel         Expand to full height

DOUBLE TAP
────────────────────────────────────────────
Location          Action
────────────────────────────────────────────
Detection box     Enter Investigation Mode for that item
Anomaly card      Enter Investigation Mode
Video feed        (Reserved for DJI zoom control)

LONG PRESS (500ms)
────────────────────────────────────────────
Location          Action
────────────────────────────────────────────
Detection box     Show context menu (Dismiss, Track, Investigate)
Anomaly card      Show context menu (Delete, Edit Note, Share)
Capture button    Burst capture (5 frames)

SWIPE
────────────────────────────────────────────
Direction         Action
────────────────────────────────────────────
Left on anomaly   Dismiss with confirmation
Right from edge   Open anomaly panel
Left from panel   Close panel
Up from bottom    Show VLM panel
Down on VLM       Minimize VLM panel

PINCH (Reserved for DJI)
- DO NOT OVERRIDE - Used for video zoom
```

### 6.2 Physical Button Mapping

```
RC PLUS 2 BUTTON CONFIGURATION
════════════════════════════════════════════════════════════════

Button          Default DJI Function    BAHB Override
────────────────────────────────────────────────────────────────
C1              Customizable            Toggle Inspection
C2              Customizable            Capture Snapshot
5D Button       Gimbal control          (Press) Toggle Thermal
Left Dial       Gimbal tilt             No override
Right Dial      Zoom                    No override
Camera Button   Photo/Video             No override (use BAHB capture)
Record Button   Start/Stop recording    No override

BUTTON FEEDBACK
────────────────────────────────────────────────────────────────
C1 Press        Haptic: Single pulse    Audio: Click
C2 Press        Haptic: Double pulse    Audio: Shutter sound
Anomaly Alert   Haptic: Triple pulse    Audio: Alert chime

BUTTON STATES (shown on UI)
────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────┐
│  C1: Start Inspection    C2: Capture        │
│  [Currently: IDLE]       [Ready]            │
└─────────────────────────────────────────────┘
Small hint bar at bottom of control panel showing button mappings
```

### 6.3 Interaction Flow Diagrams

```
FLOW 1: Start Inspection
════════════════════════════════════════════════════════════════

     ┌─────────┐
     │  IDLE   │
     └────┬────┘
          │
    [C1 or ▶ tap]
          │
          ▼
    ┌───────────┐     No        ┌─────────────────┐
    │ AI System ├──────────────►│ Show Error:     │
    │ Connected?│               │ "Connect to AI" │
    └─────┬─────┘               └─────────────────┘
          │ Yes
          ▼
    ┌───────────────┐
    │ Show "Starting│
    │ Inspection..."│
    └───────┬───────┘
            │
    [WebSocket: start_inspection]
            │
            ▼
    ┌───────────────┐
    │ Status bar:   │
    │ "INSPECTING"  │
    │ Button: Red ■ │
    └───────────────┘


FLOW 2: Anomaly Detection → Investigation
════════════════════════════════════════════════════════════════

    [AI Detects Anomaly]
            │
            ▼
    ┌───────────────────┐
    │ Add to overlay    │
    │ with severity box │
    └─────────┬─────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
CRITICAL           HIGH/MEDIUM/LOW
    │                   │
    ▼                   ▼
┌──────────────┐   ┌──────────────────┐
│ MODAL ALERT  │   │ Add to anomaly   │
│ with haptic  │   │ panel list       │
│ + audio      │   │ Update badge: +1 │
└──────┬───────┘   └────────┬─────────┘
       │                    │
       ▼                    │
[User: INVESTIGATE]         │
       │                    │
       ├────────────────────┤
       │                    │
       ▼                    ▼
┌─────────────────────────────────────┐
│         INVESTIGATION MODE          │
│  - Freeze frame capture             │
│  - Side-by-side RGB + Thermal       │
│  - VLM analysis displayed           │
│  - Action buttons available         │
└─────────────────────────────────────┘


FLOW 3: VLM Analysis Request
════════════════════════════════════════════════════════════════

    [Detection with confidence < 85%]
           OR
    [User taps VLM button]
            │
            ▼
    ┌─────────────────┐
    │ Show "Analyzing │
    │ with AI..."     │
    │ (spinner)       │
    └────────┬────────┘
             │
    [WebSocket: Request VLM for frame]
             │
    [50-100ms latency]
             │
             ▼
    ┌─────────────────────────────────────┐
    │ VLM Panel slides up                 │
    │                                     │
    │ "The [equipment] shows [finding].   │
    │  Recommend: [action]"               │
    │                                     │
    │ [ACCEPT]  [CLARIFY]  [DISMISS]     │
    └─────────────────────────────────────┘
```

---

## 7. Animation Specifications

### 7.1 Transition Timings

```
DURATIONS
────────────────────────────────────────────
Fast            150ms       Button feedback, hover states
Normal          250ms       Panel slide, fade transitions
Slow            400ms       Modal appearance, emphasis

EASING CURVES
────────────────────────────────────────────
Standard        ease-out    Most transitions
Decelerate      ease-out    Entering elements
Accelerate      ease-in     Exiting elements
Spring          spring()    Bouncy emphasis (alerts)
```

### 7.2 Detection Box Animations

```
NEW DETECTION APPEARANCE
────────────────────────────────────────────
1. Scale from 0.8 to 1.0 (200ms, ease-out)
2. Opacity from 0 to 1 (150ms)
3. Corner accents draw in (100ms delay, 200ms duration)

DETECTION DISAPPEARANCE (object leaves frame)
────────────────────────────────────────────
1. Opacity fade to 0 (200ms)
2. No scale change (prevents jarring)

ANOMALY PULSE (CRITICAL)
────────────────────────────────────────────
Continuous loop:
1. Border opacity: 100% → 60% → 100%
2. Duration: 800ms
3. Glow radius: 0px → 8px → 0px
4. Color: #FF2222 constant

SELECTION HIGHLIGHT
────────────────────────────────────────────
1. Border color transition: class color → white
2. Corner accent scale: 1.0 → 1.2
3. Duration: 200ms
```

### 7.3 Panel Animations

```
SLIDE IN (from right)
────────────────────────────────────────────
1. TranslateX: 280px → 0px
2. Duration: 250ms
3. Easing: ease-out
4. Background overlay fades in simultaneously

SLIDE OUT
────────────────────────────────────────────
1. TranslateX: 0px → 280px
2. Duration: 200ms
3. Easing: ease-in

EXPAND/COLLAPSE (VLM panel)
────────────────────────────────────────────
1. Height: 180px ↔ 320px
2. Duration: 300ms
3. Content opacity fades during transition
```

---

## 8. Accessibility Considerations

### 8.1 Visual Accessibility

```
CONTRAST RATIOS (all meet WCAG AA, most meet AAA)
────────────────────────────────────────────
Text on dark panel:       White (#FFF) on rgba(0,0,0,0.85) = 16:1
Status text:              Cyan (#00FFD4) on black = 12:1
Critical alert:           White on Red (#FF2222) = 5.5:1
Warning text:             Orange (#FFA500) on black = 7.8:1

COLORBLIND SUPPORT
────────────────────────────────────────────
Severity is indicated by:
1. Color (primary indicator)
2. Icon (🔴 ⚠️ ⚡ ℹ️)
3. Border style (solid, dashed, dotted)
4. Position in list (critical always first)
5. Label text ("CRITICAL", "HIGH", etc.)

ICON + TEXT PAIRING
────────────────────────────────────────────
- Never use icon alone for critical functions
- All icons have text labels
- Tooltip on long-press shows full description
```

### 8.2 Motor Accessibility

```
TOUCH TARGET SIZES
────────────────────────────────────────────
Minimum touch target: 48x48dp (Android guideline)
Recommended: 56x56dp for primary actions
Control buttons: 56x56dp (meets guideline)
Anomaly cards: Full width, 72dp min height

GESTURE ALTERNATIVES
────────────────────────────────────────────
Every gesture has button alternative:
- Swipe to dismiss → Long press → Dismiss button
- Edge swipe → Panel toggle button
- Double tap → Investigate button

PHYSICAL BUTTON ACCESS
────────────────────────────────────────────
All critical functions accessible via physical buttons:
- C1: Primary action (Start/Stop)
- C2: Secondary action (Capture)
- Volume: Navigate anomalies
```

### 8.3 Cognitive Load Reduction

```
INFORMATION DENSITY MANAGEMENT
────────────────────────────────────────────
Flight Mode     Max Detections Shown    Panel State
────────────────────────────────────────────
Normal          10 boxes                Available
Investigation   3 boxes (focused)       Expanded
Critical Alert  1 box (anomaly only)    Hidden

PROGRESSIVE DISCLOSURE
────────────────────────────────────────────
Level 1 (Always): Box + Label + Severity color
Level 2 (Tap): Confidence, thermal data, track ID
Level 3 (Panel): Full description, recommendations
Level 4 (Investigate): All data, VLM analysis

ALERT FATIGUE PREVENTION
────────────────────────────────────────────
- Suppress duplicate alerts for 30 seconds
- Batch similar anomalies (e.g., "3 hotspots on transformer")
- Allow "snooze" for non-critical alerts
- Daily limit on INFO-level notifications
```

---

## 9. Voice Feedback System

### 9.1 Audio Alerts

```
ALERT SOUNDS
────────────────────────────────────────────
Event                   Sound               Volume
────────────────────────────────────────────
Critical anomaly        3-tone alert        100%
High anomaly            2-tone alert        80%
Medium anomaly          Single chime        60%
Inspection started      Confirmation beep   70%
Inspection stopped      Double beep         70%
Snapshot captured       Shutter click       50%
AI system connected     Startup tone        60%
AI system error         Error tone          90%

CONFIGURATION
────────────────────────────────────────────
- Master volume tied to system volume
- Individual sounds can be disabled
- "Silent except critical" mode available
```

### 9.2 Text-to-Speech (Optional)

```
TTS ANNOUNCEMENTS (disabled by default)
────────────────────────────────────────────
Event                   Speech
────────────────────────────────────────────
Critical anomaly        "Critical alert: [type] detected"
Inspection complete     "Inspection complete. [N] anomalies found."
VLM analysis ready      "AI analysis available"

TTS SETTINGS
────────────────────────────────────────────
- Enable/disable per event type
- Voice: System default
- Speed: 1.2x (faster for urgent info)
- Language: Match system locale
```

---

## 10. State Management

### 10.1 Application States

```
STATE DIAGRAM
════════════════════════════════════════════════════════════════

                    ┌─────────────┐
                    │ INITIALIZING│
                    └──────┬──────┘
                           │
                    [AI Connected]
                           │
                           ▼
    ┌───────────────────────────────────────────────────────┐
    │                                                       │
    │   ┌─────────┐        [Start]        ┌───────────┐   │
    │   │  IDLE   │ ──────────────────► │ INSPECTING │   │
    │   │         │ ◄────────────────── │            │   │
    │   └─────────┘        [Stop]         └─────┬─────┘   │
    │                                           │         │
    │                                    [Anomaly]        │
    │                                           │         │
    │                                           ▼         │
    │                                   ┌──────────────┐  │
    │                                   │INVESTIGATING │  │
    │                                   │              │  │
    │                                   └──────────────┘  │
    │                                                     │
    └───────────────────────────────────────────────────────┘
                           │
                    [AI Disconnected]
                           │
                           ▼
                    ┌─────────────┐
                    │ DISCONNECTED│
                    └─────────────┘


STATE PROPERTIES
────────────────────────────────────────────
State           UI Elements Active          Actions Available
────────────────────────────────────────────
INITIALIZING    Loading spinner only        None
DISCONNECTED    Error message, retry btn    Retry connection
IDLE            All panels, Start btn       Start inspection
INSPECTING      Overlay active, Stop btn    Stop, Capture, Investigate
INVESTIGATING   Focus mode, full panels     Confirm, Dismiss, Capture
```

### 10.2 Data Synchronization

```
WEBSOCKET MESSAGE HANDLING
────────────────────────────────────────────

Message Type         Update Frequency    UI Update
────────────────────────────────────────────
inspection_result    30 Hz               Detection overlay (immediate)
system_status        1 Hz                Status bar (batched)
alert                On event            Modal + panel (immediate)
vlm_analysis         On request          VLM panel (immediate)

BUFFERING STRATEGY
────────────────────────────────────────────
- Detection results: Triple buffer (render, update, receive)
- Anomalies: Append-only list, max 50 items
- System status: Latest value only

OFFLINE HANDLING
────────────────────────────────────────────
- Cache last 10 anomalies locally
- Show "Reconnecting..." in status bar
- Retry connection every 2 seconds
- After 30 seconds: Show full disconnect modal
```

---

## 11. Implementation Recommendations

### 11.1 Technology Stack

```
RECOMMENDED ARCHITECTURE: Native Android with Compose UI
════════════════════════════════════════════════════════════════

Rendering Layer
├── Jetpack Compose          - UI components, panels, dialogs
├── Canvas API               - Detection overlay (performance-critical)
└── DJI UX SDK Widgets       - FPV, battery, GPS (native integration)

Communication Layer
├── OkHttp + WebSocket       - Manifold 3 connection
├── Kotlin Flow              - Reactive data streams
└── kotlinx.serialization    - JSON parsing

State Management
├── ViewModel + StateFlow    - UI state
├── Room Database            - Local anomaly cache
└── DataStore                - User preferences

DJI Integration
├── DJI Mobile SDK v5        - Flight control, camera
└── DJI UX SDK v5            - Pre-built widgets

WHY NATIVE OVER HYBRID (WebView/React Native)?
────────────────────────────────────────────
1. 30 FPS overlay rendering requires native Canvas
2. DJI SDK integration is complex, native-only
3. Physical button events require native handlers
4. Lower latency for safety-critical UI
5. Better memory management for long inspections
```

### 11.2 Rendering Architecture

```
DETECTION OVERLAY RENDERING PIPELINE
════════════════════════════════════════════════════════════════

[WebSocket]  ──►  [Ring Buffer]  ──►  [UI Thread]  ──►  [Canvas]
    │                 │                    │               │
    │  30 Hz          │  Triple Buffer     │  60 Hz        │  GPU
    │  JSON           │  Detection[]       │  Draw calls   │  Render

OPTIMIZATION TECHNIQUES
────────────────────────────────────────────
1. Pre-allocate Paint objects (avoid GC during draw)
2. Use hardware acceleration (canvas.isHardwareAccelerated)
3. Dirty region invalidation (only redraw changed areas)
4. Object pooling for Detection/BoundingBox objects
5. Batch similar draw calls (group boxes by color)

FRAME BUDGET
────────────────────────────────────────────
Target: 60 FPS (16.67ms per frame)
- Detection overlay draw: < 4ms
- Panel rendering: < 2ms
- State updates: < 1ms
- Buffer remaining: 9ms for system/DJI
```

### 11.3 WebSocket Protocol

```
CONNECTION MANAGEMENT
════════════════════════════════════════════════════════════════

Endpoint: ws://192.168.42.3:8080/ws/inspection

Connection Flow:
1. Establish WebSocket connection
2. Receive initial system_status
3. Send start_inspection command
4. Receive inspection_result stream (30 Hz)
5. Receive alert events (on detection)
6. Send stop_inspection command
7. Receive session summary
8. Close connection (or keep-alive for next session)

RECONNECTION STRATEGY
────────────────────────────────────────────
Attempt    Delay      Action
────────────────────────────────────────────
1          0ms        Immediate retry
2          1000ms     Show "Reconnecting..."
3          2000ms     -
4          4000ms     -
5          8000ms     Show "Connection lost" modal
6+         10000ms    Continue retrying

MESSAGE COMPRESSION
────────────────────────────────────────────
- Enable per-message deflate for inspection_result
- Estimated bandwidth: 50 KB/s at 30 FPS
- Fallback to uncompressed if CPU constrained
```

### 11.4 Memory Management

```
MEMORY BUDGET (8GB device, targeting 2GB app usage)
════════════════════════════════════════════════════════════════

Component               Allocation      Notes
────────────────────────────────────────────
DJI SDK                 400 MB          Video decoding, flight control
Detection overlay       100 MB          Bitmap cache, paint objects
Anomaly cache           50 MB           50 anomalies × 1MB images
UI components           150 MB          Compose, ViewModels
WebSocket buffers       20 MB           Ring buffers
System overhead         280 MB          Dalvik, OS
────────────────────────────────────────────
Total                   1000 MB         Well under budget

MEMORY OPTIMIZATION
────────────────────────────────────────────
1. Use thumbnail images in anomaly list (256x256)
2. Release full-res images when not in Investigation mode
3. Limit detection history to 300 frames (10 seconds)
4. Clear VLM analysis text older than 5 minutes
5. Use WeakReferences for cached overlays
```

### 11.5 Testing Strategy

```
UNIT TESTS
────────────────────────────────────────────
- Detection coordinate scaling
- Severity color mapping
- WebSocket message parsing
- State transitions

INTEGRATION TESTS
────────────────────────────────────────────
- WebSocket connection/reconnection
- DJI widget integration
- Physical button event handling
- Panel animation completion

UI TESTS (Espresso + Compose Test)
────────────────────────────────────────────
- Touch gesture recognition
- Anomaly card interactions
- Modal dialog flows
- Accessibility compliance

PERFORMANCE TESTS
────────────────────────────────────────────
- Overlay rendering at 30+ FPS
- Memory usage under 2GB
- Battery drain < 15%/hour
- Touch response < 100ms

FIELD TESTS
────────────────────────────────────────────
- Outdoor visibility (sunny conditions)
- Gloved touch operation
- Physical button reliability
- Long-duration stability (2+ hours)
```

---

## 12. Wireframe Summary (ASCII Art)

### 12.1 Normal Inspection View

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ [●] AI Connected │ INSPECTING │ Detections: 8 │ ⚠ 2 │ 35 FPS │ 62% GPU       ║
╠════╦══════════════════════════════════════════════════════════════════════════╣
║    ║                                                                          ║
║ ▶  ║                           DJI FPV VIDEO                                  ║
║────║                                                                          ║
║ 📷 ║        ┌──────────────────┐                                              ║
║────║        │                  │                                              ║
║ 🌡️ ║        │   transformer    │                  ┌────────────────────────┐  ║
║────║        │   94%            │                  │ 🌡️ THERMAL             │  ║
║ ⚠️ ║        └──────────────────┘                  │ Max: 67°C              │  ║
║[2] ║                                              │ Min: 22°C              │  ║
║────║            ╔══════════════════════╗          │ ΔT: 45°C ⚠️            │  ║
║ 📊 ║            ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║          │ Hotspots: 2            │  ║
║    ║            ║▓ insulator  87%    ▓║          └────────────────────────┘  ║
║    ║            ║▓ [THERMAL: 67°C]   ▓║                                       ║
║    ║            ╚══════════════════════╝                                       ║
║    ║                                                                          ║
╠════╩══════════════════════════════════════════════════════════════════════════╣
║ Last: insulator (HIGH) │ C1: Stop │ C2: Capture │ [🔋] [📡] [📶]             ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### 12.2 Anomaly Panel Open

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ [●] AI Connected │ INSPECTING │ Det: 5 │ ⚠ 3 │ 32 FPS                         ║
╠════╦══════════════════════════════════════════════════════╦═══════════════════╣
║    ║                                                      ║ ANOMALIES (3) [X] ║
║ ■  ║                                                      ╠═══════════════════╣
║────║             DJI FPV VIDEO                            ║ ▓█ CRITICAL       ║
║ 📷 ║                                                      ║    Hotspot 87°C   ║
║────║             + BAHB Overlay                           ║    Transformer #2 ║
║ 🌡️ ║                                                      ║    10:34:22  [→]  ║
║────║    ╔═══════════════════════════════════╗             ╠───────────────────╣
║ ⚠️ ║    ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║             ║ ▓▓ HIGH           ║
║[3] ║    ║▓  SELECTED ANOMALY 87°C         ▓║             ║    Damage         ║
║────║    ║▓  (highlighted box)             ▓║             ║    Insulator      ║
║ 📊 ║    ╚═══════════════════════════════════╝             ║    10:32:15  [→]  ║
║    ║                                                      ╠───────────────────╣
║    ║                                                      ║ ░░ MEDIUM         ║
║    ║                                                      ║    Corrosion      ║
║    ║                                                      ║    10:28:44  [→]  ║
╠════╩══════════════════════════════════════════════════════╩═══════════════════╣
║ Selected: Hotspot @ Transformer │ [Investigate] │ [🔋] [📡] [📶]             ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### 12.3 Critical Alert Modal

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║
║▓                                                                             ▓║
║▓                      ⚠️  CRITICAL ALERT  ⚠️                                  ▓║
║▓                                                                             ▓║
║▓      ┌─────────────────────────────────────────────────────────────┐       ▓║
║▓      │                                                             │       ▓║
║▓      │                   [RGB + THERMAL THUMBNAIL]                 │       ▓║
║▓      │                                                             │       ▓║
║▓      └─────────────────────────────────────────────────────────────┘       ▓║
║▓                                                                             ▓║
║▓                      THERMAL HOTSPOT DETECTED                               ▓║
║▓                                                                             ▓║
║▓                      Temperature: 102°C (CRITICAL)                          ▓║
║▓                      Equipment: Transformer Unit #3                         ▓║
║▓                      Delta-T: 80°C above ambient                            ▓║
║▓                                                                             ▓║
║▓      ┌───────────────────────┐      ┌───────────────────────┐              ▓║
║▓      │   INVESTIGATE NOW     │      │     ACKNOWLEDGE       │              ▓║
║▓      │   (Enter Focus Mode)  │      │   (Continue Flight)   │              ▓║
║▓      └───────────────────────┘      └───────────────────────┘              ▓║
║▓                                                                             ▓║
║▓                      [ ] Suppress similar for 30 seconds                    ▓║
║▓                                                                             ▓║
║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### 12.4 Investigation Mode

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ [X CLOSE]           🔍 INVESTIGATION MODE           [✓ CONFIRM ANOMALY]       ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐    ║
║  │                                 │  │                                 │    ║
║  │                                 │  │     ████████████████████        │    ║
║  │      RGB CAPTURE                │  │     ██ THERMAL MAP  ██         │    ║
║  │                                 │  │     ██  MAX: 102°C  ██         │    ║
║  │      [detection highlighted]    │  │     ████████████████████        │    ║
║  │                                 │  │                                 │    ║
║  └─────────────────────────────────┘  └─────────────────────────────────┘    ║
║                                                                               ║
║  ┌───────────────────────────────────────────────────────────────────────┐   ║
║  │ 🤖 AI ANALYSIS                                                        │   ║
║  │                                                                       │   ║
║  │ "Significant thermal anomaly detected on transformer unit. The       │   ║
║  │  102°C reading represents an 80°C differential from ambient,         │   ║
║  │  indicating severe internal resistance or imminent failure.          │   ║
║  │  Pattern suggests connection degradation at bushing terminal."       │   ║
║  │                                                                       │   ║
║  │ RECOMMENDATIONS:                                                      │   ║
║  │ • Immediate de-energization recommended                               │   ║
║  │ • Notify maintenance dispatch                                         │   ║
║  │ • Capture additional angles before departing                          │   ║
║  └───────────────────────────────────────────────────────────────────────┘   ║
║                                                                               ║
║  [📷 CAPTURE HI-RES]  [📝 ADD NOTE]  [📍 MARK LOCATION]  [❌ FALSE POSITIVE] ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 13. Design Tokens Export

### 13.1 Android Resources (colors.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Brand Colors -->
    <color name="bahb_primary">#00A8CC</color>
    <color name="bahb_primary_dark">#007799</color>
    <color name="bahb_accent">#00FFD4</color>

    <!-- Background Colors -->
    <color name="bahb_background">#121212</color>
    <color name="panel_background">#D9000000</color>
    <color name="card_background">#1E1E1E</color>
    <color name="card_selected">#2A2A2A</color>

    <!-- Text Colors -->
    <color name="text_primary">#FFFFFF</color>
    <color name="text_secondary">#AAAAAA</color>
    <color name="text_disabled">#666666</color>

    <!-- Severity Colors -->
    <color name="severity_critical">#FF2222</color>
    <color name="severity_high">#FF6600</color>
    <color name="severity_medium">#FFAA00</color>
    <color name="severity_low">#FFDD00</color>
    <color name="severity_info">#00AAFF</color>

    <!-- Status Colors -->
    <color name="status_connected">#00DD00</color>
    <color name="status_warning">#FFAA00</color>
    <color name="status_error">#FF4444</color>
    <color name="status_offline">#888888</color>

    <!-- Detection Colors -->
    <color name="detection_equipment">#00C8AA</color>
    <color name="detection_structure">#8888FF</color>
    <color name="detection_defect">#FFA000</color>
    <color name="detection_hotspot">#FF6B35</color>

    <!-- Temperature Colors -->
    <color name="thermal_cold">#4488FF</color>
    <color name="thermal_normal">#44FF44</color>
    <color name="thermal_warm">#FFFF00</color>
    <color name="thermal_hot">#FFA500</color>
    <color name="thermal_critical">#FF0000</color>
</resources>
```

### 13.2 Dimension Resources (dimens.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Status Bar -->
    <dimen name="status_bar_height">48dp</dimen>
    <dimen name="bottom_bar_height">40dp</dimen>

    <!-- Control Panel -->
    <dimen name="control_panel_width">72dp</dimen>
    <dimen name="control_button_size">56dp</dimen>
    <dimen name="control_button_spacing">8dp</dimen>

    <!-- Anomaly Panel -->
    <dimen name="anomaly_panel_width">280dp</dimen>
    <dimen name="anomaly_card_height">72dp</dimen>
    <dimen name="severity_indicator_width">6dp</dimen>

    <!-- Detection Overlay -->
    <dimen name="box_stroke_width">3dp</dimen>
    <dimen name="box_corner_accent">20dp</dimen>
    <dimen name="box_corner_radius">4dp</dimen>
    <dimen name="label_padding">4dp</dimen>

    <!-- Thermal Panel -->
    <dimen name="thermal_panel_width">200dp</dimen>
    <dimen name="thermal_panel_height">140dp</dimen>

    <!-- VLM Panel -->
    <dimen name="vlm_panel_collapsed">180dp</dimen>
    <dimen name="vlm_panel_expanded">320dp</dimen>

    <!-- Touch Targets -->
    <dimen name="min_touch_target">48dp</dimen>
    <dimen name="preferred_touch_target">56dp</dimen>

    <!-- Spacing -->
    <dimen name="spacing_xs">4dp</dimen>
    <dimen name="spacing_sm">8dp</dimen>
    <dimen name="spacing_md">12dp</dimen>
    <dimen name="spacing_lg">16dp</dimen>
    <dimen name="spacing_xl">24dp</dimen>

    <!-- Corner Radius -->
    <dimen name="radius_sm">4dp</dimen>
    <dimen name="radius_md">8dp</dimen>
    <dimen name="radius_lg">12dp</dimen>
    <dimen name="radius_full">999dp</dimen>
</resources>
```

---

## 14. Summary Checklist

### Design Requirements Met

- [x] Information hierarchy (4 tiers defined)
- [x] Visual design specifications
- [x] Overlay positioning (does not block DJI elements)
- [x] Color coding for severity levels
- [x] Box styles for different detection types
- [x] Contrast requirements for outdoor use
- [x] Touch gesture specifications
- [x] Quick actions for anomaly investigation
- [x] RPIC confirmation dialogs
- [x] Voice feedback options
- [x] AI model status indicators
- [x] Detection confidence visualization
- [x] Thermal correlation indicators
- [x] Mission progress (in status bar)
- [x] Alert presentation (modal + panel)
- [x] Anomaly queue/list
- [x] Quick capture triggers
- [x] Investigation mode activation
- [x] Detailed wireframes (ASCII art)
- [x] Interaction flow diagrams
- [x] Color/typography specifications
- [x] Accessibility considerations
- [x] Implementation recommendations

### Key Design Decisions

1. **Native Android** over hybrid for performance and DJI integration
2. **Minimal overlay** during normal flight to reduce cognitive load
3. **Progressive disclosure** - details on demand
4. **Physical buttons** for critical actions (safety)
5. **Non-blocking panels** that slide over, not replace, video
6. **High contrast** colors optimized for outdoor visibility
7. **Multi-modal feedback** (visual + audio + haptic) for alerts

---

**Document Status:** COMPLETE
**Next Steps:** Implementation in Kotlin/Compose
**Review Date:** Before development sprint
