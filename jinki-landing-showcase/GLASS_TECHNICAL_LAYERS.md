# Premium Glass System - Technical Layer Structure

## 🏗️ Complete Layer Stack Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ LAYER 7: Top Edge Highlight (::before)                   ┃  │
│  ┃ • 40% height (expands to 50% on hover)                   ┃  │
│  ┃ • Gradient: white 15% → 8% → 3% → transparent            ┃  │
│  ┃ • Curved bottom edge (elliptical)                        ┃  │
│  ┃ • Inset box-shadows for side bevels                      ┃  │
│  ┃ • Opacity: 0.6 (→ 1.0 on hover)                          ┃  │
│  ┃ • z-index: 1                                              ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                   │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ LAYER 6: Your Content                                     ┃  │
│  ┃ • Text, images, buttons, etc.                             ┃  │
│  ┃ • Relative positioning                                    ┃  │
│  ┃ • z-index: auto (between ::before and ::after)           ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                   │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ LAYER 5: Inner Glow (::after)                             ┃  │
│  ┃ • Radial gradient from center                             ┃  │
│  ┃ • Cyan 8% → white 4% → transparent                        ┃  │
│  ┃ • mix-blend-mode: screen                                  ┃  │
│  ┃ • Opacity: 0 (→ 1 on hover)                               ┃  │
│  ┃ • z-index: 0                                               ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                   │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ LAYER 4: Bottom Edge Shadow (child element)               ┃  │
│  ┃ • 30% height at bottom                                    ┃  │
│  ┃ • Gradient: black 20% → 10% → transparent                 ┃  │
│  ┃ • Curved top edge (elliptical)                            ┃  │
│  ┃ • Opacity: 0.7 (→ 0.9 on hover)                           ┃  │
│  ┃ • z-index: 0                                               ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ LAYER 3: Glass Container Base                             ┃  │
│  ┃                                                            ┃  │
│  ┃  ┌──────────────────────────────────────────────────┐    ┃  │
│  ┃  │ 3a: Noise Texture (CSS fallback)                 │    ┃  │
│  ┃  │ • Repeating linear gradients (2px grid)          │    ┃  │
│  ┃  │ • Horizontal + vertical overlay                  │    ┃  │
│  ┃  │ • White 3% opacity                               │    ┃  │
│  ┃  └──────────────────────────────────────────────────┘    ┃  │
│  ┃                                                            ┃  │
│  ┃  ┌──────────────────────────────────────────────────┐    ┃  │
│  ┃  │ 3b: Refraction Gradient                          │    ┃  │
│  ┃  │ • 135deg diagonal gradient                       │    ┃  │
│  ┃  │ • 5 stops: 10% → 4% → 2% → 5% → 8%              │    ┃  │
│  ┃  │ • Simulates light refraction through glass       │    ┃  │
│  ┃  └──────────────────────────────────────────────────┘    ┃  │
│  ┃                                                            ┃  │
│  ┃  ┌──────────────────────────────────────────────────┐    ┃  │
│  ┃  │ 3c: Base Glass Tint                              │    ┃  │
│  ┃  │ • Solid white at 5% opacity                      │    ┃  │
│  ┃  │ • Foundation layer                               │    ┃  │
│  ┃  └──────────────────────────────────────────────────┘    ┃  │
│  ┃                                                            ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
├───────────────────────────────────────────────────────────────────┤
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ LAYER 2: Backdrop Filter Stack                            ┃  │
│  ┃                                                            ┃  │
│  ┃  blur(16px) → blur(20px) on hover                         ┃  │
│  ┃  saturate(180%) → saturate(200%) on hover                 ┃  │
│  ┃  brightness(105%) → brightness(108%) on hover             ┃  │
│  ┃  contrast(95%)                                            ┃  │
│  ┃                                                            ┃  │
│  ┃  Applied to everything BEHIND the element                 ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
├───────────────────────────────────────────────────────────────────┤
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ LAYER 1: SVG Noise Filter (applied via filter property)   ┃  │
│  ┃                                                            ┃  │
│  ┃  filter: url(#glass-noise)                                ┃  │
│  ┃  • feTurbulence: fractalNoise, baseFreq 0.9              ┃  │
│  ┃  • feColorMatrix: desaturate                             ┃  │
│  ┃  • feComponentTransfer: opacity 5%                       ┃  │
│  ┃  • feBlend: overlay mode                                 ┃  │
│  ┃                                                            ┃  │
│  ┃  Applied to entire element + children                     ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
├───────────────────────────────────────────────────────────────────┤
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ LAYER 0: Border + Shadows                                 ┃  │
│  ┃                                                            ┃  │
│  ┃  Border: 1px gradient border-image (3 stops)              ┃  │
│  ┃  Box-shadow (6 layers):                                   ┃  │
│  ┃  1. Inset top highlight (white 25%)                       ┃  │
│  ┃  2. Inset bottom shadow (black 15%)                       ┃  │
│  ┃  3. Ambient occlusion (0 2px 4px)                         ┃  │
│  ┃  4. Mid-depth shadow (0 8px 32px)                         ┃  │
│  ┃  5. Far-depth shadow (0 16px 64px)                        ┃  │
│  ┃  6. Cyan glow (0 0 80px)                                  ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
└───────────────────────────────────────────────────────────────────┘
                    Background Content (Video, Image, etc.)
```

## 📐 Depth Variant Specifications

### Surface Layer (.glass-panel--surface)
```
┌─────────────────────────────────────────┐
│ Z-INDEX: 3 (Closest to viewer)          │
├─────────────────────────────────────────┤
│ Blur:       12px → 14px (hover)         │
│ Brightness: 108% → 110% (hover)         │
│ Background: 8% opacity (brightest)      │
│ Border:     25% → 15% → 20%             │
│ Top Light:  20% → 10% → 4% (brightest)  │
│ Lift:       -1px on hover               │
│ Shadow:     4 layers                    │
│ Filter:     url(#glass-noise)           │
├─────────────────────────────────────────┤
│ USE FOR:                                 │
│ • Primary CTAs                           │
│ • Key metrics/stats                      │
│ • Hero elements                          │
│ • Prominent UI components                │
└─────────────────────────────────────────┘
```

### Elevated Layer (.glass-panel / default)
```
┌─────────────────────────────────────────┐
│ Z-INDEX: 2 (Mid-depth)                  │
├─────────────────────────────────────────┤
│ Blur:       16px → 20px (hover)         │
│ Brightness: 105% → 108% (hover)         │
│ Background: 5% opacity (balanced)       │
│ Border:     20% → 10% → 15%             │
│ Top Light:  15% → 8% → 3% (balanced)    │
│ Lift:       -2px on hover               │
│ Shadow:     6 layers                    │
│ Filter:     url(#glass-noise)           │
├─────────────────────────────────────────┤
│ USE FOR:                                 │
│ • Content cards                          │
│ • Standard panels                        │
│ • Navigation                             │
│ • Modal dialogs                          │
└─────────────────────────────────────────┘
```

### Floating Layer (.glass-panel--floating)
```
┌─────────────────────────────────────────┐
│ Z-INDEX: 1 (Furthest from viewer)       │
├─────────────────────────────────────────┤
│ Blur:       24px → 28px (hover)         │
│ Brightness: 103% → 105% (hover)         │
│ Background: 3% opacity (softest)        │
│ Border:     15% → 8% → 12%              │
│ Top Light:  10% → 5% → 2% (softest)     │
│ Lift:       -4px on hover               │
│ Shadow:     6 layers (largest spread)   │
│ Filter:     url(#glass-noise-strong)    │
├─────────────────────────────────────────┤
│ USE FOR:                                 │
│ • Background overlays                    │
│ • Atmospheric elements                   │
│ • Large dashboard panels                 │
│ • Full-screen modals                     │
└─────────────────────────────────────────┘
```

## 🎨 CSS Property Breakdown

### Background Stack (4 Layers)
```css
background:
  /* Layer 4: Horizontal noise lines */
  repeating-linear-gradient(
    0deg,
    rgba(255, 255, 255, 0.03) 0px,
    transparent 1px,
    transparent 2px
  ),
  /* Layer 3: Vertical noise lines */
  repeating-linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 0px,
    transparent 1px,
    transparent 2px
  ),
  /* Layer 2: Refraction gradient (5 stops) */
  linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(255, 255, 255, 0.05) 75%,
    rgba(255, 255, 255, 0.08) 100%
  ),
  /* Layer 1: Base glass tint */
  rgba(255, 255, 255, 0.05);
```

### Backdrop-Filter (4 Properties)
```css
backdrop-filter:
  blur(16px)          /* Frosted effect */
  saturate(180%)      /* Enhance colors */
  brightness(105%)    /* Lighten for visibility */
  contrast(95%);      /* Soften edges */
```

### Box-Shadow (6 Layers)
```css
box-shadow:
  /* 1. Top inner highlight */
  inset 0 1px 2px 0 rgba(255, 255, 255, 0.25),
  /* 2. Bottom inner shadow */
  inset 0 -1px 2px 0 rgba(0, 0, 0, 0.15),
  /* 3. Ambient occlusion */
  0 2px 4px rgba(0, 0, 0, 0.1),
  /* 4. Mid-range depth */
  0 8px 32px rgba(0, 0, 0, 0.3),
  /* 5. Far-range depth */
  0 16px 64px rgba(0, 0, 0, 0.2),
  /* 6. Cyan glow */
  0 0 80px rgba(6, 182, 212, 0.03);
```

### Border-Image Gradient
```css
border: 1px solid transparent;
border-image: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.2) 0%,    /* Top-left bright */
  rgba(255, 255, 255, 0.1) 50%,   /* Middle soft */
  rgba(255, 255, 255, 0.15) 100%  /* Bottom-right medium */
) 1;
```

## 🔬 Pseudo-Element Technical Details

### ::before (Top Edge Highlight)
```css
.glass-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;  /* Expands to 50% on hover */
  z-index: 1;

  /* Curved bottom edge (elliptical) */
  border-radius: inherit;
  border-bottom-left-radius: 50% 30%;   /* 50% horiz, 30% vert */
  border-bottom-right-radius: 50% 30%;

  /* Top-to-bottom fade gradient */
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.08) 30%,
    rgba(255, 255, 255, 0.03) 60%,
    transparent 100%
  );

  /* Side bevels via inset shadows */
  box-shadow:
    inset 2px 0 4px rgba(255, 255, 255, 0.1),   /* Left highlight */
    inset -2px 0 4px rgba(255, 255, 255, 0.1);  /* Right highlight */

  opacity: 0.6;  /* Increases to 1.0 on hover */
  pointer-events: none;
}
```

### ::after (Inner Glow)
```css
.glass-panel::after {
  content: '';
  position: absolute;
  inset: 1px;  /* 1px inside border */
  z-index: 0;
  border-radius: calc(16px - 1px);

  /* Radial glow from center */
  background: radial-gradient(
    ellipse at center,
    rgba(6, 182, 212, 0.08) 0%,    /* Cyan core */
    rgba(255, 255, 255, 0.04) 30%, /* White diffusion */
    transparent 70%                 /* Fade to transparent */
  );

  /* Screen blend mode for realistic light */
  mix-blend-mode: screen;

  opacity: 0;  /* Hidden by default, 1 on hover */
  pointer-events: none;
}
```

### Child Element (Bottom Edge Shadow)
```css
.glass-panel__edge-shadow {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30%;
  z-index: 0;

  /* Curved top edge (elliptical) */
  border-radius: inherit;
  border-top-left-radius: 50% 30%;
  border-top-right-radius: 50% 30%;

  /* Bottom-to-top fade gradient */
  background: linear-gradient(
    0deg,  /* Bottom to top */
    rgba(0, 0, 0, 0.2) 0%,
    rgba(0, 0, 0, 0.1) 40%,
    transparent 100%
  );

  opacity: 0.7;  /* Increases to 0.9 on hover */
  pointer-events: none;
}
```

## 🎭 Glass Text Technical Structure

```css
.glass-text {
  position: relative;
  display: inline-block;

  /* Gradient clip for shimmer */
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.85) 50%,
    rgba(255, 255, 255, 0.95) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  /* Multi-layer text shadow */
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.3),      /* Depth shadow */
    0 0 20px rgba(255, 255, 255, 0.1), /* White halo */
    0 0 40px rgba(6, 182, 212, 0.05);  /* Cyan glow */
}

/* Blurred ghost layer (uses data-text attribute) */
.glass-text::before {
  content: attr(data-text);
  position: absolute;
  left: 0;
  top: 0;
  z-index: -1;
  color: rgba(255, 255, 255, 0.3);
  filter: blur(8px);
  opacity: 0.6;  /* Increases to 0.8 on hover */
}
```

## ⚡ Performance Optimizations Applied

### Hardware Acceleration
```css
.glass-panel {
  transform: translateZ(0);         /* GPU layer */
  backface-visibility: hidden;      /* Prevent flicker */
  will-change: transform;           /* Hint to browser */
}
```

### Isolation Contexts
```css
.glass-panel {
  isolation: isolate;  /* Creates stacking context */
  overflow: hidden;    /* Contain pseudo-elements */
}
```

### Transition Properties
```css
/* Only animate transform-able properties */
transition:
  transform 0.3s var(--ease-out-expo),
  border-color 0.3s var(--ease-out-expo),
  box-shadow 0.3s var(--ease-out-expo),
  backdrop-filter 0.3s var(--ease-out-expo);
/* No transition on: width, height, position */
```

## 🎯 Z-Index Stack Summary

```
z-index: 9999  → Scroll progress indicator
z-index: 1000  → Navigation
z-index: 10    → Focused heatmap cells
z-index: 2     → Hero content / parallax front
z-index: 1     → Glass panel ::before (top highlight) / parallax mid
z-index: 0     → Glass panel ::after (inner glow) / edge shadow / parallax back
z-index: -1    → Glass text ::before (blurred ghost)
z-index: auto  → Most elements (default stacking)
```

## 📊 Property Value Progression

### Blur Intensity (Normal → Hover)
```
Surface:  12px → 14px  (+2px, subtle)
Elevated: 16px → 20px  (+4px, balanced)
Floating: 24px → 28px  (+4px, dramatic)
```

### Brightness (Normal → Hover)
```
Surface:  108% → 110%  (+2%, subtle brightening)
Elevated: 105% → 108%  (+3%, balanced brightening)
Floating: 103% → 105%  (+2%, subtle brightening)
```

### Transform Lift (Normal → Hover)
```
Surface:  0 → -1px  (subtle lift)
Elevated: 0 → -2px  (balanced lift)
Floating: 0 → -4px  (dramatic lift)
```

### Shadow Spread (Normal → Hover)
```
Surface:  8px → 16px   (mid-depth)
Elevated: 16px → 24px  (balanced)
Floating: 24px → 32px  (maximum depth)
```

## 🔍 Browser Rendering Pipeline

```
1. Layout Phase
   └─ Calculate element position/size

2. Paint Phase
   ├─ Paint background layers (4 layers)
   ├─ Paint border-image gradient
   └─ Paint pseudo-elements (::before, ::after)

3. Composite Phase
   ├─ Apply backdrop-filter to background
   ├─ Apply SVG noise filter
   ├─ Composite box-shadows (6 layers)
   ├─ Apply transform (translateY)
   └─ Final composite with GPU acceleration
```

## 🎨 Color Opacity Reference

### White Opacities (Glass Background)
```
0.15 = 15% → Very bright highlight (top edge peak)
0.12 = 12% → Bright highlight (surface panel)
0.10 = 10% → Medium highlight (refraction peaks)
0.08 = 8%  → Balanced glass (surface base)
0.06 = 6%  → Standard glass (elevated)
0.05 = 5%  → Subtle glass (base tint)
0.04 = 4%  → Light glass (floating)
0.03 = 3%  → Very light (noise, floating)
0.02 = 2%  → Barely visible (refraction low)
```

### Black Opacities (Shadows/Depth)
```
0.4  = 40% → Maximum shadow (floating hover)
0.35 = 35% → Heavy shadow (elevated hover)
0.3  = 30% → Strong shadow (base depth)
0.25 = 25% → Medium shadow
0.2  = 20% → Standard shadow (edge bottom)
0.15 = 15% → Light shadow (inner bottom)
0.12 = 12% → Very light shadow (ambient)
0.1  = 10% → Subtle shadow (edge fade)
```

### Cyan Opacities (Glow/Accent)
```
0.1  = 10% → Maximum glow (hover)
0.08 = 8%  → Strong glow (inner core)
0.06 = 6%  → Medium glow (floating hover)
0.05 = 5%  → Standard glow (base)
0.03 = 3%  → Subtle glow (ambient)
0.02 = 2%  → Very subtle glow (floating)
```

## 🧮 Mathematical Relationships

### Golden Ratio in Heights
```
Top highlight:    40% → 50% (φ ≈ 0.618 of full height)
Bottom shadow:    30% (complements top at ~70%)
Inner glow:       100% (full coverage, radial falloff)
```

### Blur Progression (Powers of 2)
```
Surface:  12px = 2³ + 2²
Elevated: 16px = 2⁴
Floating: 24px = 2⁴ + 2³
Hover adds: +2px (surface), +4px (elevated/floating)
```

### Shadow Layer Distances
```
Layer 1 (ambient):  2px   (2¹)
Layer 2 (mid):      8px   (2³)
Layer 3 (far):      16px  (2⁴)
Layer 4 (hover):    24px  (2³ × 3)
Layer 5 (hover):    32px  (2⁵)
```

---

## 📚 Complete CSS Class Reference

```
GLASS PANELS:
.glass-panel                    → Base glass (16px blur)
.glass-panel--surface           → Surface layer (12px blur)
.glass-panel--elevated          → Alias for base (explicit naming)
.glass-panel--floating          → Floating layer (24px blur)
.glass-panel__edge-shadow       → Optional bottom shadow child

GLASS TEXT:
.glass-text                     → Frosted text effect
.glass-text--glow               → Frosted text with cyan glow

REQUIRED SVG FILTERS:
#glass-noise                    → Standard noise (baseFreq 0.9)
#glass-noise-strong             → Strong noise (baseFreq 1.2)
```

---

**Total CSS Lines:** 515 lines (177-692 in LandingPage3.css)
**Total Layers:** 7 layers per glass panel (including pseudo-elements)
**Total Properties:** 15+ CSS properties per variant
**Browser Support:** Modern browsers (Chrome 76+, Firefox 103+, Safari 9+, Edge 79+)
