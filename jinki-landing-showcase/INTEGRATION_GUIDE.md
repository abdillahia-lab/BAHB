# Premium Section Transitions - Integration Guide

This guide shows you how to integrate the new premium section transitions into your LandingPage3.jsx.

## 📦 Components Created

1. **SectionWrapper** - Wraps sections with transition effects
2. **HorizontalScroll** - Horizontal scrolling container with keyboard nav
3. **SectionProgress** - Vertical progress indicator (dots navigation)
4. **ScrollVideo** - Scroll-linked video scrubbing

## 🚀 Quick Start

### Step 1: Import Components

Add these imports at the top of `LandingPage3.jsx`:

```jsx
import SectionWrapper from '../components/SectionWrapper'
import HorizontalScroll from '../components/HorizontalScroll'
import SectionProgress from '../components/SectionProgress'
import ScrollVideo from '../components/ScrollVideo'
```

### Step 2: Define Section Configuration

Add this before the return statement in your component:

```jsx
const sections = [
  { id: 'hero', label: 'Home' },
  { id: 'trust', label: 'Trust' },
  { id: 'problem', label: 'Challenge' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'platform', label: 'Platform' },
  { id: 'coverage', label: 'Coverage' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' }
]
```

### Step 3: Wrap Sections

Wrap each section with `SectionWrapper` and specify the transition type:

#### Hero Section (No wrapper needed - already has effects)
```jsx
<section className="hero" ref={heroRef} id="hero">
  {/* existing content */}
</section>
```

#### Trust Bar → Fade Down
```jsx
<SectionWrapper id="trust" transition="fade-down" backgroundColor="var(--color-bg-secondary)">
  <section className="trust">
    {/* existing content */}
  </section>
</SectionWrapper>
```

#### Problem Section → Wipe Reveal
```jsx
<SectionWrapper id="problem" transition="wipe" backgroundColor="var(--color-bg-primary)">
  <section className="problem">
    {/* existing content */}
  </section>
</SectionWrapper>
```

#### Solutions Section → Fly In + Horizontal Scroll
```jsx
<SectionWrapper id="solutions" transition="fly-in" className="section-wrapper--bg-morph">
  <section className="solutions">
    <div className="solutions__container">
      <header className="solutions__header reveal">
        <span className="section-label">Capabilities</span>
        <h2 className="section-title">Comprehensive aerial intelligence.</h2>
        <p className="section-subtitle">Four critical detection systems working in continuous harmony.</p>
      </header>

      {/* Wrap grid in HorizontalScroll */}
      <HorizontalScroll title="Our Solutions">
        {[
          {
            icon: (/* SVG */),
            title: 'Thermal Mapping',
            desc: '0.1°C precision thermal imaging...',
            features: ['...']
          },
          // ... other solutions
        ].map((item, i) => (
          <article key={i} className="solution-card glass-panel">
            {/* existing card content */}
          </article>
        ))}
      </HorizontalScroll>
    </div>
  </section>
</SectionWrapper>
```

#### Platform Section → Gradient Shift
```jsx
<SectionWrapper id="platform" transition="fade-down" className="section-wrapper--gradient-shift">
  <section className="platform">
    {/* existing content */}
  </section>
</SectionWrapper>
```

#### Coverage Section → Zoom In
```jsx
<SectionWrapper id="coverage" transition="zoom-in" className="section-wrapper--particles">
  <section className="coverage">
    {/* existing content */}
  </section>
</SectionWrapper>
```

#### About Section → Word by Word Fade
```jsx
<SectionWrapper id="about" transition="word-fade">
  <section className="about">
    <div className="about__container reveal">
      <span className="section-label">About</span>
      <h2 className="about__motto">
        {/* Split words into spans */}
        <span className="word-reveal">Ex</span>{' '}
        <span className="word-reveal">Alto</span>{' '}
        <span className="word-reveal">Omnia</span>
      </h2>
      {/* rest of content */}
    </div>
  </section>
</SectionWrapper>
```

#### CTA Section → Scale Zoom
```jsx
<SectionWrapper id="contact" transition="scale-zoom">
  <section className="cta">
    {/* existing content */}
  </section>
</SectionWrapper>
```

### Step 4: Add Progress Indicator

Add the SectionProgress component at the end, before closing `</div>`:

```jsx
return (
  <div className={`page ${pageLoaded ? 'page--loaded' : 'page--loading'}`}>
    {/* All sections */}

    {/* Add Progress Indicator */}
    <SectionProgress sections={sections} />
  </div>
)
```

## 🎨 Optional: Snap Scrolling

To enable snap scrolling (optional), wrap the entire page:

```jsx
return (
  <div className={`page snap-container ${pageLoaded ? 'page--loaded' : 'page--loading'}`}>
    {/* sections */}
  </div>
)
```

**Note:** Snap scrolling can be jarring. Test with users before enabling.

## 🎬 Optional: Scroll-Linked Video

Replace the hero video section with scroll-linked video:

```jsx
<ScrollVideo
  videoSrc="https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4"
  className="scroll-video-container--fullbleed"
/>
```

## 🎯 Transition Types Reference

| Transition | Effect | Best For |
|------------|--------|----------|
| `fade-down` | Fade in from top with blur | Trust, Platform |
| `wipe` | Center reveal wipe | Problem, dramatic reveals |
| `fly-in` | Cards fly from sides | Solutions, grids |
| `zoom-in` | Zoom from distance | Coverage, maps |
| `word-fade` | Word-by-word reveal | About, testimonials |
| `scale-zoom` | Dramatic scale in | CTA, final sections |

## 🌈 Background Effects

Add these classes to SectionWrapper for extra flair:

- `section-wrapper--bg-morph` - Morphing gradient background
- `section-wrapper--gradient-shift` - Shifting gradient
- `section-wrapper--particles` - Ambient particle field

Example:
```jsx
<SectionWrapper
  id="solutions"
  transition="fly-in"
  className="section-wrapper--bg-morph section-wrapper--particles"
>
```

## ⌨️ Keyboard Navigation

HorizontalScroll supports:
- **Arrow Left/Right** - Scroll cards
- **Home** - Jump to start
- **End** - Jump to end

SectionProgress supports:
- **Tab** - Navigate between dots
- **Enter/Space** - Jump to section

## 📱 Mobile Optimization

All components are fully responsive:
- HorizontalScroll uses touch swipe
- SectionProgress can switch to bottom bar on mobile
- Transitions are simplified on mobile for performance

## 🎪 Complete Example

Here's a minimal complete example:

```jsx
import { useEffect, useState, useRef } from 'react'
import './LandingPage3.css'
import SectionWrapper from '../components/SectionWrapper'
import SectionProgress from '../components/SectionProgress'
import HorizontalScroll from '../components/HorizontalScroll'

export default function LandingPage3() {
  // ... existing state and refs

  const sections = [
    { id: 'hero', label: 'Home' },
    { id: 'solutions', label: 'Solutions' },
    { id: 'contact', label: 'Contact' }
  ]

  return (
    <div className="page">
      {/* Hero - no wrapper */}
      <section className="hero" id="hero">
        {/* content */}
      </section>

      {/* Solutions - with transitions */}
      <SectionWrapper id="solutions" transition="fly-in">
        <section className="solutions">
          <HorizontalScroll>
            {/* cards */}
          </HorizontalScroll>
        </section>
      </SectionWrapper>

      {/* CTA - dramatic zoom */}
      <SectionWrapper id="contact" transition="scale-zoom">
        <section className="cta">
          {/* content */}
        </section>
      </SectionWrapper>

      {/* Progress indicator */}
      <SectionProgress sections={sections} />
    </div>
  )
}
```

## 🔧 Customization

### Change Transition Timing

Edit `SectionWrapper.css` transition durations:
```css
.section-wrapper--fade-down {
  transition: opacity 1.5s ...; /* Change from 1s to 1.5s */
}
```

### Custom Colors

Background colors are controlled via the `backgroundColor` prop:
```jsx
<SectionWrapper backgroundColor="#0a0a0f">
```

### Disable Transitions

Set `transition="none"`:
```jsx
<SectionWrapper transition="none">
```

## ⚠️ Important Notes

1. **IDs are Required** - Every section needs an `id` for navigation
2. **Performance** - Test on lower-end devices, disable effects if needed
3. **Accessibility** - All components support keyboard nav and reduced motion
4. **Browser Support** - Modern browsers only (Chrome 90+, Firefox 88+, Safari 14+)

## 🐛 Troubleshooting

**Transitions not working?**
- Check that SectionWrapper.css is imported
- Verify section IDs match configuration
- Check browser console for errors

**Horizontal scroll not smooth?**
- Ensure cards have `width` set (default: 400px)
- Check that parent has proper spacing

**Progress dots not updating?**
- Verify section IDs are correct
- Check that sections are in viewport

## 📚 Additional Resources

- All CSS custom properties are defined in LandingPage3.css
- Reduced motion preferences are automatically respected
- Touch gestures work automatically on mobile devices

---

**Need help?** Check the component source files for inline documentation and examples.
