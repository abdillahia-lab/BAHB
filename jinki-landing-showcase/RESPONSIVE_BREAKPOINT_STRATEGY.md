# JINKI INTELLIGENCE - BREAKPOINT STRATEGY & IMPLEMENTATION GUIDE

## Quick Reference

### Breakpoint Map

```
┌─────────────────────────────────────────────────────────────────────┐
│ RESPONSIVE BREAKPOINT STRATEGY FOR JINKI INTELLIGENCE             │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│ MOBILE FIRST APPROACH - Build for mobile, enhance upward         │
└───────────────────────────────────────────────────────────────────┘

SIZE RANGE          DEVICE TYPE         VIEWPORT    GRID    FONT
─────────────────────────────────────────────────────────────────────
320px - 479px      Small Phones        xs          1 col   14px base
480px - 767px      Large Phones        sm          1-2 col 14px base
768px - 1023px     Tablets             md          2 col   15px base
1024px - 1199px    Tablet Landscape    lg          3 col   15px base
1200px - 1599px    Desktop             xl          4 col   16px base
1600px - 1919px    Large Desktop       2xl         4 col   16px base
1920px - 2559px    Ultra-Wide          3xl         4 col   17px base
2560px+            4K Monitors         4k          4 col   17px base

SPECIAL CASES:
─────────────────────────────────────────────────────────────────────
max-height: 600px  Landscape Mobile    -           compact spaces
(orientation: landscape)
```

---

## CSS Clamp Formula Reference

### Understanding Clamp

```
clamp(MIN_SIZE, PREFERRED_SIZE, MAX_SIZE)
```

Example: `clamp(1rem, 2vw, 2rem)`

**How it works:**
1. On viewport < 50vw: Use 1rem (minimum)
2. On viewport 50vw - 200vw: Use 2vw (scales with viewport)
3. On viewport > 200vw: Use 2rem (maximum)

### Pre-made Clamp Values

```css
/* TYPOGRAPHY */
--font-size-t1: clamp(2.5rem, 6vw, 4rem);        /* Hero H1 */
--font-size-t2: clamp(2rem, 4.5vw, 3rem);        /* Section H2 */
--font-size-t3: clamp(1.5rem, 3.5vw, 2.25rem);   /* Subsection H3 */
--font-size-t4: clamp(1.25rem, 2.5vw, 1.75rem);  /* Card title H3 */
--font-size-t5: clamp(1rem, 2vw, 1.375rem);      /* Body large */
--font-size-t6: clamp(0.9rem, 1.8vw, 1.125rem);  /* Body normal */
--font-size-t7: clamp(0.875rem, 1.5vw, 1rem);    /* Body small */
--font-size-t8: clamp(0.8125rem, 1.2vw, 0.9375rem); /* Caption */
--font-size-t9: clamp(0.75rem, 1vw, 0.875rem);   /* Micro/Label */

/* SPACING */
--space-xs: clamp(0.25rem, 0.5vw, 0.5rem);       /* 4-8px */
--space-sm: clamp(0.5rem, 1vw, 1rem);            /* 8-16px */
--space-md: clamp(1rem, 1.5vw, 1.5rem);          /* 16-24px */
--space-lg: clamp(1.5rem, 2.5vw, 2.5rem);        /* 24-40px */
--space-xl: clamp(2rem, 3.5vw, 3.5rem);          /* 32-56px */
--space-2xl: clamp(2.5rem, 5vw, 5rem);           /* 40-80px */
--space-3xl: clamp(3.5rem, 7vw, 7rem);           /* 56-112px */
--space-4xl: clamp(4.5rem, 9vw, 9rem);           /* 72-144px */

/* GAPS FOR GRIDS */
--gap-sm: clamp(0.75rem, 1.5vw, 1.5rem);         /* 12-24px */
--gap-md: clamp(1rem, 2vw, 2rem);                /* 16-32px */
--gap-lg: clamp(1.5rem, 3vw, 3rem);              /* 24-48px */
--gap-xl: clamp(2rem, 4vw, 4rem);                /* 32-64px */
```

---

## Component-Specific Breakpoints

### Hero Section Adaptation

```
DESKTOP (>1200px)
├─ Full layout with ASCII art + content side-by-side
├─ 4 stat columns (700px, 72hrs, 94%, 58%)
├─ Large h1: 4rem
└─ Full margin spacing

TABLET (768px-1023px)
├─ ASCII art above content
├─ 2x2 stat grid
├─ h1: clamp(1.75rem, 4vw, 3rem)
└─ Reduced padding

MOBILE (<768px)
├─ Stacked layout (ASCII on top)
├─ ASCII scaled to 75-85%
├─ 1-column stats (stacked)
├─ h1: clamp(1.75rem, 5vw, 2.5rem)
└─ Minimal padding
```

### Cards Grid Adaptation

```
DESKTOP (>1200px)
├─ 4-column grid
├─ 24px gap
├─ Full card height: 300px+
└─ 180px images

TABLET (768px-1023px)
├─ 2-column grid
├─ 16px gap
├─ 160px images
└─ Condensed padding

MOBILE (<768px)
├─ 1-column (full width)
├─ 12px gap
├─ 140px images
├─ 14px font for descriptions
└─ Minimal borders
```

### Platform Section Adaptation

```
DESKTOP (>1200px)
├─ 2-column layout (text | visual)
├─ Left-aligned text
├─ Centered visual element
├─ 80px gap
└─ Full feature list

TABLET (768px-1023px)
├─ 1-column stacked
├─ Center-aligned text
├─ Centered visual
├─ 40px gap
└─ Aligned features center

MOBILE (<768px)
├─ 1-column stacked
├─ Center text throughout
├─ Visual scaled down
├─ 24px gap
└─ Compact feature list
```

---

## Container Query Breakpoints

### Hero Section Container

```css
@container hero-section (min-width: 1200px) { ... }    /* Full layout */
@container hero-section (min-width: 768px) and
                        (max-width: 1199px) { ... }    /* Balanced */
@container hero-section (max-width: 767px) { ... }    /* Stacked */
```

### Card Container

```css
@container industry-card (min-width: 350px) { ... }    /* Full content */
@container industry-card (min-width: 250px) and
                        (max-width: 349px) { ... }    /* Condensed */
@container industry-card (max-width: 249px) { ... }   /* Minimal */
```

### Cards Grid Container

```css
@container cards-grid (min-width: 1200px) { ... }     /* 4 columns */
@container cards-grid (min-width: 992px) { ... }      /* 3 columns */
@container cards-grid (min-width: 768px) { ... }      /* 2 columns */
@container cards-grid (max-width: 767px) { ... }      /* 1 column */
```

---

## Media Query Quick Reference

### Standard Patterns

```css
/* Mobile only */
@media (max-width: 479px) { }

/* Mobile and up */
@media (min-width: 0px) { }

/* Tablet and up */
@media (min-width: 768px) { }

/* Desktop and up */
@media (min-width: 1200px) { }

/* Tablet only */
@media (min-width: 768px) and (max-width: 1023px) { }

/* Desktop only */
@media (min-width: 1200px) and (max-width: 1599px) { }

/* Wide screens */
@media (min-width: 1920px) { }
```

### Orientation-Based

```css
/* Landscape phones (height-constrained) */
@media (max-height: 600px) and (orientation: landscape) { }

/* Portrait phones */
@media (orientation: portrait) { }

/* Landscape tablets */
@media (orientation: landscape) and (min-height: 600px) { }
```

### Device Pixel Ratio (High DPI)

```css
/* Retina displays */
@media (min-resolution: 192dpi) { }

/* Pixel-perfect layouts */
@media (-webkit-min-device-pixel-ratio: 2) { }
```

### Pointer-Based

```css
/* Touch devices (coarse pointer) */
@media (pointer: coarse) {
  /* Remove :hover effects */
  /* Add :active feedback */
}

/* Mouse (fine pointer) */
@media (pointer: fine) {
  /* Add :hover effects */
  /* Smooth transitions */
}
```

### Accessibility

```css
/* Users prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Users prefer high contrast */
@media (prefers-contrast: more) {
  /* Increase border thickness */
  /* More saturated colors */
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  /* We're already dark-first */
}
```

---

## Implementation Order

### 1. HTML Structure
```html
<section class="hero">
  <div class="hero__content">
    <h1>Title</h1>
  </div>
  <div class="hero__stats">
    <div class="stat">...</div>
  </div>
</section>
```

### 2. Base Styles (Mobile First)
```css
.hero {
  padding: 50px 1rem;
}

.hero h1 {
  font-size: var(--font-size-t1);
}

.hero__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--gap-md);
}
```

### 3. Tablet Enhancement
```css
@media (min-width: 768px) {
  .hero {
    padding: 80px 1.5rem;
  }

  .hero__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### 4. Desktop Enhancement
```css
@media (min-width: 1200px) {
  .hero {
    padding: 100px 2rem;
  }

  .hero__stats {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--gap-xl);
  }
}
```

### 5. Ultra-Wide Enhancement
```css
@media (min-width: 1920px) {
  .hero {
    max-width: 1600px;
    margin: 0 auto;
  }
}
```

### 6. Container Queries (Optional, more granular)
```css
@container hero-section (min-width: 1200px) {
  .hero h1 {
    font-size: 4rem;
  }
}
```

---

## Testing Checklist by Device

### Small Phones (320px)
- [ ] Hero title readable, not too large
- [ ] Stats single or 2-column grid
- [ ] Cards full width, images ~120px tall
- [ ] Buttons full width, 44px+ height
- [ ] No horizontal scrolling

### Standard Phones (375px)
- [ ] Hero layout optimal
- [ ] Cards properly spaced
- [ ] ASCII art visible at 75% scale
- [ ] 2-column stats grid works

### Large Phones (414px+)
- [ ] Same as standard phones
- [ ] Hero content balanced
- [ ] Stats might show 4 in row (test)

### Small Tablets (600px)
- [ ] Consider 2-column layout
- [ ] Hero content more prominent
- [ ] Stats 2x2 grid
- [ ] Cards 2-column if 4+ cards

### Standard Tablets (768px)
- [ ] Full tablet layout
- [ ] Hero likely 2-column or stacked
- [ ] Cards 2-column
- [ ] Platform section stacked with centered text
- [ ] All touch targets 44px+

### Tablet Landscape (1024px)
- [ ] 2-column hero if not already
- [ ] Cards 3-column
- [ ] Platform 1-column, centered
- [ ] Hero stats visible and spaced

### Desktop (1200px)
- [ ] Hero 2-column layout optimal
- [ ] Cards 4-column
- [ ] Platform 2-column (text | visual)
- [ ] Full spacing looks good
- [ ] No excessive side margins

### Large Desktop (1600px)
- [ ] Content centered with margins
- [ ] Typography scaled up appropriately
- [ ] Spacing feels generous
- [ ] No text lines exceed 80 characters

### Ultra-Wide (1920px+)
- [ ] Max-width containers limit width
- [ ] Generous side margins
- [ ] Cards maintain spacing
- [ ] Overall balance maintained

### Landscape Mobile (600px high)
- [ ] Minimal padding, content fits
- [ ] Buttons still clickable
- [ ] No vertical scrolling needed for hero
- [ ] ASCII art scaled appropriately

---

## CSS Property Alternatives

### For width scaling:

```css
/* Option 1: Percentage-based (fluid but imprecise) */
width: 80%;

/* Option 2: Max-width (better) */
max-width: 1200px;
width: 100%;

/* Option 3: Clamp (best, size-based) */
width: clamp(320px, 80vw, 1200px);
```

### For padding scaling:

```css
/* Option 1: Fixed pixels (not responsive) */
padding: 20px;

/* Option 2: Media queries (works, more code) */
@media (min-width: 1024px) {
  padding: 30px;
}

/* Option 3: Clamp (best) */
padding: clamp(1rem, 2vw, 2rem);
```

### For font sizing:

```css
/* Option 1: Fixed pixels (not responsive) */
font-size: 18px;

/* Option 2: Media queries (works, verbose) */
@media (min-width: 768px) {
  font-size: 20px;
}

/* Option 3: Fluid (less control) */
font-size: 2vw;

/* Option 4: Clamp (best, responsive with limits) */
font-size: clamp(1rem, 2vw, 1.5rem);
```

---

## Performance Tips

### CSS Optimization

```css
/* Good: Container queries for component-level responsiveness */
@container industry-card (min-width: 350px) {
  .card__content {
    padding: 20px;
  }
}

/* Bad: Multiple media queries for same breakpoint */
@media (min-width: 1200px) { .card { ... } }
@media (min-width: 1200px) { .button { ... } }
@media (min-width: 1200px) { .input { ... } }
```

### Layout Shift Prevention

```css
/* Reserve space for images */
img {
  aspect-ratio: 16 / 9;
}

/* Fixed containers */
.stat {
  min-height: 100px;
}

/* CSS Containment */
.card {
  contain: layout style paint;
}
```

### JavaScript-Free Solutions

```css
/* Avoid JavaScript for breakpoints - use CSS only */
/* Container queries handle component-level responsiveness */
/* Media queries handle viewport-level responsiveness */
/* CSS clamp handles fluid scaling */
```

---

## Common Customizations

### Increase max container width to 1400px:

```css
.container {
  max-width: 1400px; /* was 1200px */
}

@media (min-width: 1400px) {
  .container {
    padding: 0 3rem;
  }
}
```

### Adjust card grid to 5 columns on ultra-wide:

```css
@media (min-width: 2560px) {
  .cards {
    grid-template-columns: repeat(5, 1fr);
  }
}
```

### Make typography slightly larger:

```css
:root {
  --font-size-t1: clamp(2.5rem, 7vw, 4.5rem); /* was 6vw, 4rem */
}
```

### Add more spacing on tablets:

```css
@media (min-width: 768px) and (max-width: 1023px) {
  :root {
    --gap-md: clamp(1.25rem, 2.5vw, 2.25rem); /* increase */
  }
}
```

---

## Browser DevTools Tips

### Chrome/Edge DevTools

1. Press F12 to open DevTools
2. Click device toggle (Ctrl+Shift+M)
3. Click "Edit" to add custom breakpoints
4. Right-click breakpoint → Add Breakpoint for:
   - 768px (tablet)
   - 1024px (tablet landscape)
   - 1200px (desktop)
   - 1920px (ultra-wide)

### Firefox DevTools

1. Press F12
2. Click responsive design mode (Ctrl+Shift+M)
3. Edit viewport width/height
4. Check "Touch Simulation" for touch testing

### Testing Tools

- Google Lighthouse (F12 → Lighthouse)
- PageSpeed Insights (pagespeed.web.dev)
- Responsive Design Checker
- BrowserStack for real devices

---

## Troubleshooting Guide

### Text too small on desktop?
→ Increase max value in clamp: `clamp(1rem, 2vw, 1.5rem)`

### Layout breaks at 768px?
→ Check if breakpoint applies, might need `(min-width: 769px)` or `(min-width: 768px)`

### Elements overlapping on mobile?
→ Reduce padding, check `contain` property, verify grid columns = 1

### Touch buttons too small?
→ Ensure min-height: 44px minimum, check padding

### CLS (layout shift) during load?
→ Add `aspect-ratio` to images, `min-height` to dynamic content

### Scrollbar causes jank?
→ Use `scrollbar-gutter: stable` on large screens

### Font looks blurry?
→ Add `-webkit-font-smoothing: antialiased` to body

---

This guide provides everything needed to implement and maintain the responsive design system for Jinki Intelligence. Refer to the detailed CSS files for complete implementation details.
