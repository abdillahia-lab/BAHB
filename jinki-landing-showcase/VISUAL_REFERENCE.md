# Visual Transition Reference Guide

A visual guide to help you choose the perfect transition for each section.

## 🎬 Section Transitions

### 1. Fade Down with Blur
```
BEFORE SCROLL          DURING SCROLL          AFTER SCROLL
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│             │        │    ▓▓▓▓▓    │        │             │
│             │   →    │   ▓Content▓ │   →    │   Content   │
│             │        │    ▓▓▓▓▓    │        │             │
└─────────────┘        └─────────────┘        └─────────────┘
  (Hidden, up)          (Blurred, fading)      (Clear, visible)
```
**Use for:** Trust bars, headers, subtle reveals
**Performance:** ⚡⚡⚡ Excellent
**Mobile:** ✅ Great

---

### 2. Wipe Reveal from Center
```
BEFORE                 DURING                 AFTER
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│█████████████│        │███│   │█████│        │             │
│█████████████│   →    │███│Con│█████│   →    │   Content   │
│█████████████│        │███│   │█████│        │             │
└─────────────┘        └─────────────┘        └─────────────┘
  (Fully masked)        (Wiping outward)       (Fully revealed)
```
**Use for:** Dramatic reveals, problem statements
**Performance:** ⚡⚡ Good
**Mobile:** ✅ Good

---

### 3. Fly In from Sides
```
BEFORE                 DURING                 AFTER
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│←Card    Card→        │  ← Card →   │        │  Card Card  │
│             │   →    │  ← Card →   │   →    │  Card Card  │
│←Card    Card→        │  ← Card →   │        │  Card Card  │
└─────────────┘        └─────────────┘        └─────────────┘
  (Off screen)          (Flying in)            (In position)
```
**Use for:** Solution cards, feature grids
**Performance:** ⚡⚡ Good
**Mobile:** ⚠️ Simplified (no rotation)

---

### 4. Zoom In from Satellite View
```
BEFORE                 DURING                 AFTER
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│             │        │             │        │             │
│   •  tiny   │   →    │   medium    │   →    │    LARGE    │
│             │        │             │        │             │
└─────────────┘        └─────────────┘        └─────────────┘
  (3x scaled)           (1.5x scaled)          (1x normal)
```
**Use for:** Maps, data visualizations
**Performance:** ⚡ Fair
**Mobile:** ⚠️ Simplified

---

### 5. Word by Word Fade
```
BEFORE                 DURING                 AFTER
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│             │        │  Ex Alto    │        │  Ex Alto    │
│             │   →    │  □□□□□□     │   →    │   Omnia     │
│             │        │             │        │             │
└─────────────┘        └─────────────┘        └─────────────┘
  (All hidden)          (Words appearing)      (All visible)
```
**Use for:** Taglines, mottos, quotes
**Performance:** ⚡⚡⚡ Excellent
**Mobile:** ✅ Great

---

### 6. Scale Zoom (Dramatic)
```
BEFORE                 DURING                 AFTER
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│             │        │    ▓▓▓▓     │        │             │
│     tiny    │   →    │   ▓▓▓▓▓     │   →    │   CONTENT   │
│             │        │  ▓CONTENT▓  │        │             │
└─────────────┘        └─────────────┘        └─────────────┘
  (0.7x, blurred)       (Scaling, clearing)    (1x, sharp)
```
**Use for:** CTAs, final conversion sections
**Performance:** ⚡⚡ Good
**Mobile:** ✅ Good

---

## 🎨 Background Effects

### Background Morph
```
SCROLL PROGRESS: 0%      50%                100%
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│  ░░░░░      │        │    ░░░░░    │        │      ░░░░░  │
│ ░CONTENT░   │   →    │  ░CONTENT░  │   →    │   ░CONTENT░ │
│  ░░░░░      │        │    ░░░░░    │        │      ░░░░░  │
└─────────────┘        └─────────────┘        └─────────────┘
 (Gradient left)        (Gradient center)      (Gradient right)
```

### Gradient Shift
```
SCROLL PROGRESS: 0%      50%                100%
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│█████████████│        │▓▓▓▓▓▓▓▓▓▓▓▓▓│        │░░░░░░░░░░░░░│
│████Content██│   →    │▓▓▓Content▓▓▓│   →    │░░░Content░░░│
│█████████████│        │▓▓▓▓▓▓▓▓▓▓▓▓▓│        │░░░░░░░░░░░░░│
└─────────────┘        └─────────────┘        └─────────────┘
  (Dark)                (Medium)               (Light)
```

### Ambient Particles
```
SCROLL PROGRESS: 0%      50%                100%
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│ ·  ·  ·     │        │ · · · · · · │        │· · · · · · ·│
│   Content   │   →    │ · Content · │   →    │· ·Content· ·│
│ ·  ·  ·     │        │ · · · · · · │        │· · · · · · ·│
└─────────────┘        └─────────────┘        └─────────────┘
  (Few particles)       (Medium density)       (High density)
```

---

## 🔄 Horizontal Scroll

### Desktop View
```
┌──────────────────────────────────────────────┐
│ ◀ [Card 1] [Card 2] [Card 3→              ▶ │
│   ─────────────────────────                  │
│   Progress: ████████░░░░░░░░ 60%            │
└──────────────────────────────────────────────┘
```

### Mobile View
```
┌─────────────────┐
│ ◀ [Card 1]    ▶ │
│   ──────         │
│   Progress: 33%  │
└─────────────────┘
```

**Features:**
- Touch swipe support
- Keyboard navigation (←→ Home End)
- Progress indicator
- Snap scrolling
- Navigation buttons

---

## 📍 Section Progress

### Desktop (Right Side)
```
                              ┌─────┐
                              │  ○  │ Home
                              │  ●  │ About ← Active
                              │  ○  │ Services
                              │  ○  │ Contact
                              └─────┘
```

### Mobile (Bottom Bar)
```
┌───────────────────────────────────────────────┐
│                    ○ ● ○ ○                    │
└───────────────────────────────────────────────┘
```

**Features:**
- Active section highlighting
- Click to jump
- Tooltips on hover
- Animated transitions

---

## 🎬 Scroll-Linked Video

### Scroll Position vs Video Frame
```
SCROLL: 0%          25%             50%             75%            100%
┌───────┐         ┌───────┐       ┌───────┐       ┌───────┐      ┌───────┐
│Frame 1│    →    │Frame 5│   →   │Frame10│   →   │Frame15│  →   │Frame20│
└───────┘         └───────┘       └───────┘       └───────┘      └───────┘
```

**Brightness & Scale Changes:**
```
TOP:     ┌───────────┐  Brightness: 40%, Scale: 1.00
         │███████████│
         │███Video███│
         │███████████│
         └───────────┘

MIDDLE:  ┌───────────┐  Brightness: 55%, Scale: 1.025
         │░░░░░░░░░░░│
         │░░Video░░░░│
         │░░░░░░░░░░░│
         └───────────┘

BOTTOM:  ┌───────────┐  Brightness: 70%, Scale: 1.05
         │           │
         │   Video   │
         │           │
         └───────────┘
```

---

## 🎯 Combining Effects

### Example: Ultimate Section
```
┌─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │  Background Morph + Particles Active    │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  ← │ Card 1  │  │ Card 2  │  │ Card 3  │ → │
│    └─────────┘  └─────────┘  └─────────┘   │
│          (Flying in from sides)              │
│                                              │
│    ○ Word ○ by ○ word ○ reveal ○            │
│                                              │
└─────────────────────────────────────────────┘
     (Gradient shifting underneath)
```

---

## 📐 Responsive Breakpoints

### Desktop (1024px+)
```
┌─────────────────────────────────────────────────┐
│  Full transitions, 3D effects, complex animations
│  Progress dots on right side
│  Blur effects enabled
└─────────────────────────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌─────────────────────────────────┐
│  Simplified 3D effects
│  Reduced blur
│  Progress dots on right
└─────────────────────────────────┘
```

### Mobile (< 768px)
```
┌───────────────┐
│  No 3D
│  No blur
│  Touch optimized
│  Progress: bottom
└───────────────┘
```

---

## 🎨 Color & Opacity Changes

### Fade Transitions
```
Opacity Scale:
0%   25%  50%  75%  100%
│    │    │    │    │
▁▁▁▃▃▃▅▅▅▇▇▇███
```

### Transform Scale
```
Scale:
0.7  0.8  0.9  1.0  1.1
│    │    │    │    │
·    ○    ◯    ●    ◉
```

### Blur Amount
```
Blur (px):
10   7.5  5.0  2.5  0
│    │    │    │    │
████ ▓▓▓▓ ▒▒▒▒ ░░░░ ----
```

---

## ⚡ Performance Visualization

### Frame Rate Targets
```
60 FPS ████████████████████████████████████ Target
30 FPS ████████████████                    Acceptable
15 FPS ████████                            Poor

Desktop: ████████████████████████████████████
Tablet:  ███████████████████████████████
Mobile:  ██████████████████████████
```

### Load Times
```
Component      Load Time
─────────────────────────────
SectionWrapper   ██ 2KB
HorizontalScroll ███ 3KB
SectionProgress  ██ 2KB
ScrollVideo      ████ 4KB
Transitions CSS  ████ 4KB
─────────────────────────────
Total:          ███████ 15KB
```

---

## 🎪 Animation Timing

### Transition Durations
```
instant  fast    normal  slow
0.08s    0.15s   0.3s    0.5s
│        │       │       │
├────────┼───────┼───────┤
Quick    Standard        Cinematic
feedback animations      effects
```

### Easing Functions
```
ease-out-expo:   ─────╮
                      ╰──────

ease-out-quart:  ────╮
                     ╰─────

ease-elastic:    ──╮ ╭─╮
                   ╰─╯ ╰──
```

---

## 🎯 Section Flow Example

Complete landing page flow:

```
┌─ HERO ────────────────────────────────────┐
│  No wrapper (has own effects)              │
│  Video background, 3D transforms           │
└────────────────────────────────────────────┘
              ↓ fade-down
┌─ TRUST ───────────────────────────────────┐
│  Location list with subtle entrance        │
└────────────────────────────────────────────┘
              ↓ wipe
┌─ PROBLEM ─────────────────────────────────┐
│  Dramatic center reveal                    │
└────────────────────────────────────────────┘
              ↓ fly-in
┌─ SOLUTIONS ───────────────────────────────┐
│  Horizontal scroll cards                   │
│  + Background morph + Particles            │
└────────────────────────────────────────────┘
              ↓ fade-down
┌─ PLATFORM ────────────────────────────────┐
│  Dashboard preview                         │
│  + Gradient shift                          │
└────────────────────────────────────────────┘
              ↓ zoom-in
┌─ COVERAGE ────────────────────────────────┐
│  Map zooms from satellite                  │
│  + Ambient particles                       │
└────────────────────────────────────────────┘
              ↓ word-fade
┌─ ABOUT ───────────────────────────────────┐
│  Motto reveals word by word                │
└────────────────────────────────────────────┘
              ↓ scale-zoom
┌─ CTA ─────────────────────────────────────┐
│  Dramatic scale entrance                   │
└────────────────────────────────────────────┘

[Progress Dots] ──────────────────────────────────▶
```

---

## 📱 Touch Gestures

### Horizontal Scroll
```
┌─────────────────┐
│ ←══ Swipe ══→   │
│   [Card View]   │
└─────────────────┘
```

### Vertical Sections
```
      ↑
      ║
      ║ Scroll
      ║
      ↓
```

### Progress Dots
```
┌───┐
│ ○ │ ← Tap to jump
│ ● │
│ ○ │
└───┘
```

---

## 🎨 Color Intensity Guide

```
Background Effects Intensity:

0%   ░░░░░░░░░░░░░░░░░░░  Transparent
25%  ░░░░░░░▒▒▒░░░░░░░░  Subtle glow
50%  ░░▒▒▒▒▓▓▓▓▓▒▒▒▒░░  Moderate
75%  ▒▒▓▓▓▓████▓▓▓▓▒▒  Strong
100% ▓▓████████████▓▓  Maximum
```

---

**Pro Tips:**

1. **Start subtle** - One effect per section
2. **Build hierarchy** - More dramatic towards CTA
3. **Test mobile** - Simplify for touch devices
4. **Respect motion** - Always honor reduced-motion
5. **Performance first** - Profile on real devices

---

*Use this guide to quickly visualize how each transition will look before implementing.*
