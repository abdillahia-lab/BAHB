# Premium Section Transitions - Examples

This document provides complete, copy-paste examples for common scroll transition patterns.

## 📋 Table of Contents

1. [Basic Section Transitions](#basic-section-transitions)
2. [Horizontal Scroll Gallery](#horizontal-scroll-gallery)
3. [Scroll-Linked Video](#scroll-linked-video)
4. [Progressive Background Morphing](#progressive-background-morphing)
5. [Word-by-Word Text Reveal](#word-by-word-text-reveal)
6. [3D Card Flip Effect](#3d-card-flip-effect)
7. [Parallax Layers](#parallax-layers)
8. [Full Page Snap Scrolling](#full-page-snap-scrolling)

---

## Basic Section Transitions

### Fade Up on Scroll
```jsx
<SectionWrapper id="features" transition="fade-down">
  <section className="features">
    <h2>Our Features</h2>
    <p>Discover what makes us different</p>
  </section>
</SectionWrapper>
```

### Wipe Reveal
```jsx
<SectionWrapper id="problem" transition="wipe">
  <section className="problem">
    <div className="container">
      <h2>The Challenge</h2>
      <p>Traditional methods aren't enough anymore...</p>
    </div>
  </section>
</SectionWrapper>
```

### Scale Zoom (Dramatic Entrance)
```jsx
<SectionWrapper id="cta" transition="scale-zoom">
  <section className="cta">
    <h2>Ready to Get Started?</h2>
    <button className="btn btn--primary">Sign Up Now</button>
  </section>
</SectionWrapper>
```

---

## Horizontal Scroll Gallery

### Product Showcase
```jsx
<SectionWrapper id="products" transition="fly-in">
  <section className="products">
    <HorizontalScroll title="Our Products">
      {products.map((product) => (
        <div key={product.id} className="product-card glass-panel">
          <img src={product.image} alt={product.name} />
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <span className="price">${product.price}</span>
        </div>
      ))}
    </HorizontalScroll>
  </section>
</SectionWrapper>
```

### Testimonial Slider
```jsx
<HorizontalScroll title="What Our Customers Say">
  {testimonials.map((testimonial, i) => (
    <blockquote key={i} className="testimonial-card glass-panel">
      <p className="quote">"{testimonial.quote}"</p>
      <footer>
        <img src={testimonial.avatar} alt={testimonial.name} />
        <div>
          <cite>{testimonial.name}</cite>
          <span>{testimonial.role}</span>
        </div>
      </footer>
    </blockquote>
  ))}
</HorizontalScroll>
```

---

## Scroll-Linked Video

### Hero Video that Scrubs
```jsx
import ScrollVideo from '../components/ScrollVideo'

function HeroSection() {
  return (
    <ScrollVideo
      videoSrc="/videos/hero.mp4"
      poster="/images/hero-poster.jpg"
      className="scroll-video-container--fullbleed"
    />
  )
}
```

### Contained Video with Progress
```jsx
<section className="video-section">
  <div className="container">
    <h2>See How It Works</h2>
    <ScrollVideo
      videoSrc="/videos/product-demo.mp4"
      className="scroll-video-container--contained"
    />
  </div>
</section>
```

---

## Progressive Background Morphing

### Gradient Shift Between Sections
```jsx
<SectionWrapper
  id="journey"
  transition="fade-down"
  className="section-wrapper--gradient-shift"
>
  <section className="journey">
    <h2>Our Journey</h2>
    <div className="timeline">
      {/* Timeline content */}
    </div>
  </section>
</SectionWrapper>
```

### Ambient Particles
```jsx
<SectionWrapper
  id="technology"
  transition="zoom-in"
  className="section-wrapper--particles section-wrapper--bg-morph"
>
  <section className="technology">
    <h2>Cutting-Edge Technology</h2>
    {/* Content */}
  </section>
</SectionWrapper>
```

---

## Word-by-Word Text Reveal

### Motto or Tagline
```jsx
<SectionWrapper id="about" transition="word-fade">
  <section className="about">
    <h2 className="motto">
      <span className="word-reveal">Innovation</span>{' '}
      <span className="word-reveal">Through</span>{' '}
      <span className="word-reveal">Excellence</span>
    </h2>
  </section>
</SectionWrapper>
```

### JavaScript Helper
```jsx
// Helper function to split text into word spans
function splitWordsIntoSpans(text) {
  return text.split(' ').map((word, i) => (
    <span key={i} className="word-reveal">{word}</span>
  )).reduce((prev, curr) => [prev, ' ', curr])
}

// Usage
<h2>{splitWordsIntoSpans("Create Something Amazing")}</h2>
```

---

## 3D Card Flip Effect

### Feature Cards with Depth
```jsx
<SectionWrapper id="features" transition="fly-in">
  <section className="features perspective-container">
    <div className="features-grid stagger">
      {features.map((feature, i) => (
        <div key={i} className="feature-card glass-panel transform-3d animate-fade-up">
          <div className="feature-icon">{feature.icon}</div>
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
        </div>
      ))}
    </div>
  </section>
</SectionWrapper>
```

### Flip Cards on Hover
```jsx
<div className="flip-card-container perspective-container">
  <div className="flip-card">
    <div className="flip-card-front glass-panel">
      <h3>Front Side</h3>
    </div>
    <div className="flip-card-back glass-panel">
      <h3>Back Side</h3>
      <p>More details here...</p>
    </div>
  </div>
</div>

<style>{`
  .flip-card {
    position: relative;
    width: 100%;
    height: 300px;
    transform-style: preserve-3d;
    transition: transform 0.6s;
  }

  .flip-card-container:hover .flip-card {
    transform: rotateY(180deg);
  }

  .flip-card-front,
  .flip-card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
  }

  .flip-card-back {
    transform: rotateY(180deg);
  }
`}</style>
```

---

## Parallax Layers

### Multi-Layer Parallax
```jsx
<section className="parallax-section">
  <div className="parallax-slow">
    <img src="/images/layer-back.png" alt="Background" />
  </div>
  <div className="parallax-medium">
    <img src="/images/layer-mid.png" alt="Midground" />
  </div>
  <div className="parallax-fast">
    <h1>Welcome to Our Site</h1>
    <p>Scroll to explore</p>
  </div>
</section>

<style>{`
  .parallax-section {
    position: relative;
    height: 200vh;
    overflow: hidden;
  }

  .parallax-slow,
  .parallax-medium,
  .parallax-fast {
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }
`}</style>
```

---

## Full Page Snap Scrolling

### Complete Page Setup
```jsx
import { useState } from 'react'
import SectionWrapper from '../components/SectionWrapper'
import SectionProgress from '../components/SectionProgress'

export default function SnapScrollPage() {
  const sections = [
    { id: 'hero', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'contact', label: 'Contact' }
  ]

  return (
    <div className="page scroll-snap-container">
      {/* Hero */}
      <SectionWrapper id="hero" className="section-snap-item">
        <section className="hero">
          <h1>Welcome</h1>
          <p>Scroll to explore</p>
        </section>
      </SectionWrapper>

      {/* About */}
      <SectionWrapper
        id="about"
        transition="fade-down"
        className="section-snap-item"
      >
        <section className="about">
          <h2>About Us</h2>
          <p>We create amazing experiences</p>
        </section>
      </SectionWrapper>

      {/* Services */}
      <SectionWrapper
        id="services"
        transition="fly-in"
        className="section-snap-item"
      >
        <section className="services">
          <h2>Our Services</h2>
          <div className="services-grid">
            {/* Service cards */}
          </div>
        </section>
      </SectionWrapper>

      {/* Portfolio */}
      <SectionWrapper
        id="portfolio"
        transition="zoom-in"
        className="section-snap-item"
      >
        <section className="portfolio">
          <h2>Portfolio</h2>
          {/* Portfolio items */}
        </section>
      </SectionWrapper>

      {/* Contact */}
      <SectionWrapper
        id="contact"
        transition="scale-zoom"
        className="section-snap-item"
      >
        <section className="contact">
          <h2>Get In Touch</h2>
          <form>{/* Contact form */}</form>
        </section>
      </SectionWrapper>

      {/* Progress Indicator */}
      <SectionProgress sections={sections} />
    </div>
  )
}
```

---

## Advanced: Combined Effects

### Ultimate Section with All Features
```jsx
<SectionWrapper
  id="showcase"
  transition="fly-in"
  className="section-wrapper--bg-morph section-wrapper--particles section-wrapper--gradient-shift"
  backgroundColor="var(--color-bg-primary)"
>
  <section className="showcase">
    <div className="container">
      {/* Header with word reveal */}
      <h2 className="section-title">
        <span className="word-reveal">Ultimate</span>{' '}
        <span className="word-reveal">Showcase</span>
      </h2>

      {/* Horizontal scroll cards */}
      <HorizontalScroll title="Featured Items">
        {items.map((item, i) => (
          <div
            key={i}
            className="showcase-card glass-panel transform-3d gpu-accelerated"
          >
            <img src={item.image} alt={item.title} />
            <h3 className="text-gradient-animated">{item.title}</h3>
            <p>{item.description}</p>
          </div>
        ))}
      </HorizontalScroll>

      {/* Staggered feature list */}
      <div className="features-list stagger">
        {features.map((feature, i) => (
          <div key={i} className="feature-item animate-slide-left">
            <span className="feature-icon">{feature.icon}</span>
            <span className="feature-text">{feature.text}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
</SectionWrapper>
```

---

## Performance Tips

### Optimize with Intersection Observer
```jsx
import { useEffect, useRef, useState } from 'react'

function OptimizedSection({ children }) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={isVisible ? 'visible' : ''}>
      {isVisible && children}
    </div>
  )
}
```

### Lazy Load Heavy Content
```jsx
<SectionWrapper id="media" transition="fade-down">
  <section className="media">
    {isVisible && (
      <ScrollVideo
        videoSrc="/videos/heavy-video.mp4"
        className="scroll-video-container--contained"
      />
    )}
  </section>
</SectionWrapper>
```

---

## Accessibility Best Practices

### Respect Reduced Motion
```jsx
// All components automatically respect prefers-reduced-motion
// But you can also check manually:

import { useReducedMotion } from './hooks/useReducedMotion'

function MyComponent() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <SectionWrapper
      transition={prefersReducedMotion ? 'none' : 'fly-in'}
    >
      {/* content */}
    </SectionWrapper>
  )
}

// hooks/useReducedMotion.js
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const listener = (e) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', listener)

    return () => mediaQuery.removeEventListener('change', listener)
  }, [])

  return prefersReducedMotion
}
```

### Keyboard Navigation
All components support keyboard navigation out of the box:
- **HorizontalScroll**: Arrow keys, Home, End
- **SectionProgress**: Tab, Enter/Space
- All interactive elements have proper focus states

---

## Common Patterns Cheat Sheet

```jsx
// Simple fade section
<SectionWrapper id="simple" transition="fade-down">
  {/* content */}
</SectionWrapper>

// Horizontal gallery
<HorizontalScroll title="Gallery">
  {items.map(item => <Card key={item.id} {...item} />)}
</HorizontalScroll>

// Progress nav
<SectionProgress sections={[
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' }
]} />

// Scroll video
<ScrollVideo videoSrc="/video.mp4" />

// Staggered cards
<div className="grid stagger">
  {cards.map(card => (
    <div className="card animate-fade-up">{card.content}</div>
  ))}
</div>

// Parallax layers
<div className="parallax-slow">{/* slow layer */}</div>
<div className="parallax-medium">{/* medium layer */}</div>
<div className="parallax-fast">{/* fast layer */}</div>

// Snap scrolling
<div className="scroll-snap-container">
  <section className="scroll-snap-item">{/* section 1 */}</section>
  <section className="scroll-snap-item">{/* section 2 */}</section>
</div>
```

---

**Pro Tip**: Combine multiple effects sparingly. Too many animations can be overwhelming!
