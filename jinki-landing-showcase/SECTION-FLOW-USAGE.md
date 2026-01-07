# SECTION-FLOW Usage Guide

## Overview
Kong-style clean sections with generous but intentional spacing, optimal reading widths, and subtle visual separators.

---

## Quick Start

### 1. Import the CSS
```css
@import './src/styles/section-flow.css';
```

### 2. Basic Section Structure
```html
<!-- Hero Section - Maximum breathing room -->
<section class="section-kong-hero section-container--2xl">
  <div class="section-header">
    <h1 class="section-header__title">Welcome</h1>
    <p class="section-header__subtitle">Your journey begins here</p>
  </div>
</section>

<!-- Primary Content Section -->
<section class="section-kong-primary section-divider--top">
  <div class="section-container--2xl">
    <div class="section-header">
      <h2 class="section-header__title">Features</h2>
    </div>

    <div class="flow flow--lg">
      <p>Content with proper vertical rhythm...</p>
      <p>Automatically spaced using flow utility...</p>
    </div>
  </div>
</section>
```

---

## Section Spacing Patterns

### Hero Sections
```html
<!-- Full viewport hero with maximum breathing room -->
<section class="section-kong-hero">
  <!-- Content automatically centered vertically and horizontally -->
</section>
```
- **Padding**: `clamp(8rem, 3.43rem + 22.86vw, 24rem)` (128-384px)
- **Min Height**: 100vh
- **Use**: Landing page heroes, main introductions

### Primary Sections
```html
<!-- Important sections with generous spacing -->
<section class="section-kong-primary section-divider--top">
  <div class="section-container--2xl">
    <!-- Content -->
  </div>
</section>
```
- **Padding**: `clamp(5rem, 2.86rem + 10.71vw, 14rem)` (80-224px)
- **Border**: Subtle top divider
- **Use**: Key product features, main services, primary content

### Secondary Sections
```html
<!-- Standard sections with moderate spacing -->
<section class="section-kong-secondary">
  <div class="section-container--xl">
    <!-- Content -->
  </div>
</section>
```
- **Padding**: `clamp(4rem, 2.57rem + 7.14vw, 10rem)` (64-160px)
- **Use**: Supporting content, testimonials, additional features

### Compact Sections
```html
<!-- Minimal but not cramped spacing -->
<section class="section-kong-compact section-divider--both">
  <div class="section-container--lg">
    <!-- Content -->
  </div>
</section>
```
- **Padding**: `clamp(3rem, 2.13rem + 4.29vw, 7rem)` (48-112px)
- **Use**: Stats, logos, compact information

---

## Content Width Constraints

### Prose Content (Best for Reading)
```html
<!-- Perfect for blog posts, articles -->
<div class="section-container--prose">
  <article class="flow flow--md">
    <h2>Article Title</h2>
    <p>Optimal line length for comfortable reading...</p>
  </article>
</div>
```
- **Width**: 65ch (~520-650px)
- **Ideal**: Long-form content, blog posts, articles

### Standard Containers
```html
<!-- Small form/card -->
<div class="section-container--sm">...</div>  <!-- 480px max -->

<!-- Medium content block -->
<div class="section-container--md">...</div>  <!-- 672px max -->

<!-- Large general content -->
<div class="section-container--lg">...</div>  <!-- 896px max -->

<!-- Extra large (default) -->
<div class="section-container--xl">...</div>  <!-- 1152px max -->

<!-- Primary container -->
<div class="section-container--2xl">...</div> <!-- 1280px max -->

<!-- Wide layouts -->
<div class="section-container--3xl">...</div> <!-- 1440px max -->

<!-- Ultra-wide -->
<div class="section-container--4xl">...</div> <!-- 1600px max -->
```

---

## Section Dividers

### Border Dividers
```html
<!-- Subtle top border -->
<section class="section-divider--top">...</section>

<!-- Soft bottom border -->
<section class="section-divider--bottom-soft">...</section>

<!-- Medium strength both sides -->
<section class="section-divider--both">...</section>

<!-- Accent colored divider -->
<section class="section-divider--top-accent">...</section>
```

### Divider Elements
```html
<!-- Simple line divider -->
<hr class="divider-line" />

<!-- Gradient fade divider -->
<hr class="divider-line divider-line--gradient divider-line--space-lg" />

<!-- Accent glow divider -->
<hr class="divider-line divider-line--gradient-accent divider-line--space-md" />

<!-- Centered decorative divider -->
<hr class="divider-line divider-line--centered divider-line--accent" />

<!-- Wide centered with spacing -->
<hr class="divider-line divider-line--centered-wide divider-line--gradient divider-line--space-lg" />
```

**Divider Styles:**
- `divider-line` - Basic subtle line
- `divider-line--soft` - Slightly more visible
- `divider-line--medium` - Medium thickness (2px)
- `divider-line--strong` - Thick (4px)
- `divider-line--accent` - Cyan glow effect
- `divider-line--gradient` - Fades in/out
- `divider-line--gradient-accent` - Gradient with cyan glow

---

## Flow Utilities (Internal Spacing)

### Auto Spacing Between Elements
```html
<div class="flow flow--lg">
  <h2>Title</h2>        <!-- No top margin -->
  <p>Paragraph 1</p>    <!-- Automatic top margin -->
  <p>Paragraph 2</p>    <!-- Automatic top margin -->
  <button>CTA</button>  <!-- Automatic top margin -->
</div>
```

**Flow Sizes:**
- `flow--3xs` - `clamp(0.25rem, ..., 0.3125rem)` - 4-5px
- `flow--2xs` - `clamp(0.5rem, ..., 0.625rem)` - 8-10px
- `flow--xs` - `clamp(0.75rem, ..., 1rem)` - 12-16px
- `flow--sm` - `clamp(1rem, ..., 1.5rem)` - 16-24px
- `flow--md` - `clamp(1.5rem, ..., 2.5rem)` - 24-40px (default)
- `flow--lg` - `clamp(2rem, ..., 4rem)` - 32-64px
- `flow--xl` - `clamp(3rem, ..., 7rem)` - 48-112px
- `flow--2xl` - `clamp(4rem, ..., 10rem)` - 64-160px

### Skip Flow Spacing
```html
<div class="flow flow--md">
  <h2>Title</h2>
  <p class="flow-exception">No margin above this</p>
  <p>Normal spacing resumes</p>
</div>
```

---

## Section Headers & Footers

### Section Headers
```html
<!-- Centered header with generous bottom margin -->
<div class="section-header">
  <h2 class="section-header__title">Our Services</h2>
  <p class="section-header__subtitle">What we offer</p>
</div>

<!-- Left-aligned header -->
<div class="section-header section-header--left">
  <h2 class="section-header__title">Latest Posts</h2>
</div>
```

### Section Footers
```html
<!-- Centered footer with generous top margin -->
<div class="section-footer">
  <button class="btn">Learn More</button>
</div>

<!-- Right-aligned footer -->
<div class="section-footer section-footer--right">
  <a href="/more">See all →</a>
</div>
```

---

## Spacing Utilities

### Block Margins
```html
<!-- Margin on both top and bottom -->
<div class="margin-block-lg">Generous vertical spacing</div>

<!-- Margin only on top -->
<div class="margin-block-start-xl">Large space above</div>

<!-- Margin only on bottom -->
<div class="margin-block-end-md">Medium space below</div>
```

**Sizes**: xs, sm, md, lg, xl, 2xl

### Gap (Flex/Grid)
```html
<!-- Flexbox with spacing -->
<div class="flex gap-md">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Grid with spacing -->
<div class="grid gap-lg">
  <div>Card 1</div>
  <div>Card 2</div>
</div>
```

**Sizes**: xs, sm, md, lg, xl, 2xl

---

## Complete Page Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <link rel="stylesheet" href="./src/styles/section-flow.css">
</head>
<body>

  <!-- HERO -->
  <section class="section-kong-hero">
    <div class="section-container--2xl">
      <div class="section-header">
        <h1 class="section-header__title">Jinki Intelligence</h1>
        <p class="section-header__subtitle">AI-Powered Solutions</p>
      </div>
      <button class="btn">Get Started</button>
    </div>
  </section>

  <!-- FEATURES - Primary Section -->
  <section class="section-kong-primary section-divider--top">
    <div class="section-container--2xl">
      <div class="section-header">
        <h2 class="section-header__title">Features</h2>
      </div>

      <div class="grid gap-lg">
        <div class="section-kong-card flow flow--sm">
          <h3>Feature 1</h3>
          <p>Description with proper flow spacing...</p>
        </div>
        <div class="section-kong-card flow flow--sm">
          <h3>Feature 2</h3>
          <p>Description with proper flow spacing...</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Decorative Divider -->
  <hr class="divider-line divider-line--gradient divider-line--space-lg" />

  <!-- TESTIMONIALS - Secondary Section -->
  <section class="section-kong-secondary">
    <div class="section-container--xl">
      <div class="section-header">
        <h2 class="section-header__title">Testimonials</h2>
      </div>

      <div class="flow flow--xl">
        <blockquote class="flow flow--sm">
          <p>Amazing product!</p>
          <cite>- Happy Customer</cite>
        </blockquote>
      </div>
    </div>
  </section>

  <!-- STATS - Compact Section -->
  <section class="section-kong-compact section-divider--both">
    <div class="section-container--2xl">
      <div class="stats grid gap-xl">
        <div class="stat">
          <div class="stat__number">99%</div>
          <div class="stat__label">Satisfaction</div>
        </div>
        <div class="stat">
          <div class="stat__number">10K+</div>
          <div class="stat__label">Users</div>
        </div>
      </div>
    </div>
  </section>

  <!-- BLOG - Prose Content -->
  <section class="section-kong-secondary">
    <article class="section-container--prose">
      <div class="section-header section-header--left">
        <h2 class="section-header__title">Latest Article</h2>
      </div>

      <div class="flow flow--md">
        <p>Optimal reading width for comfortable long-form content...</p>
        <p>Each paragraph flows naturally with consistent rhythm...</p>
        <p>The reader's eye moves smoothly down the page...</p>
      </div>

      <div class="section-footer section-footer--left">
        <a href="/blog">Read more →</a>
      </div>
    </article>
  </section>

  <!-- Accent Divider -->
  <hr class="divider-line divider-line--centered-wide divider-line--gradient-accent divider-line--space-lg" />

  <!-- CTA - Sandwich Section -->
  <section class="section-kong-sandwich">
    <div class="section-container--lg">
      <div class="section-header">
        <h2 class="section-header__title">Ready to Get Started?</h2>
        <p class="section-header__subtitle">Join thousands of satisfied users</p>
      </div>

      <div class="section-footer">
        <button class="btn btn--primary">Start Free Trial</button>
      </div>
    </div>
  </section>

</body>
</html>
```

---

## Design Principles

### 1. Generous But Not Wasteful
- Spacing scales with viewport size using `clamp()`
- Maintains visual breathing room without excessive whitespace
- Larger spacing for important sections, moderate for supporting content

### 2. Consistent Vertical Rhythm
- All spacing values follow a mathematical scale
- Predictable relationships between sizes (xs → sm → md → lg → xl)
- Flow utilities ensure consistent gaps between elements

### 3. Optimal Reading Widths
- Prose containers limit line length to 65 characters
- Prevents eye strain from overly long lines
- Improves reading comprehension and retention

### 4. Clear Visual Hierarchy
- Primary sections have more padding than secondary
- Dividers provide subtle visual breaks
- Section headers/footers have generous margins

### 5. Kong-Style Clean Aesthetic
- Minimal but purposeful borders
- Subtle divider colors
- Ample whitespace for modern, premium feel
- Backdrop blur effects for depth

---

## Responsive Behavior

### Desktop (1920px+)
- Maximum spacing values
- Wide content containers
- Generous padding

### Tablet (768px - 1023px)
- Moderate spacing reduction
- Optimized for touch targets
- Maintained visual hierarchy

### Mobile (< 768px)
- Compact but readable spacing
- Single-column layouts
- Simplified dividers

### Small Mobile (< 480px)
- Minimal padding
- Essential spacing only
- Focus on content readability

---

## Accessibility Features

### High Contrast Mode
- Enhanced divider visibility
- Stronger border colors

### Reduced Motion
- Removes all transitions
- Maintains spacing and layout

### Print Styles
- Fixed spacing values for consistent printing
- Black borders for clarity
- Page break management

---

## Best Practices

### ✅ DO
- Use `.flow` for automatic vertical spacing
- Combine section styles: `section-kong-primary section-divider--top`
- Choose container widths based on content type
- Use prose containers for text-heavy content
- Layer dividers: borders + decorative lines

### ❌ DON'T
- Mix multiple section spacing classes
- Override spacing with inline styles
- Ignore max-width constraints for text
- Use fixed pixel values instead of custom properties
- Nest flow containers (causes compounding margins)

---

## Custom Property Reference

### Section Padding (Vertical)
- `--section-py-xs` - 32-64px
- `--section-py-sm` - 48-112px
- `--section-py-md` - 64-160px (default)
- `--section-py-lg` - 80-224px
- `--section-py-xl` - 96-288px
- `--section-py-2xl` - 128-384px

### Section Padding (Horizontal)
- `--section-px-mobile` - 16-24px
- `--section-px-tablet` - 24-40px
- `--section-px-desktop` - 32-64px
- `--section-px-wide` - 48-112px

### Content Widths
- `--content-width-prose` - 65ch
- `--content-width-xs` - 320px
- `--content-width-sm` - 480px
- `--content-width-md` - 672px
- `--content-width-lg` - 896px
- `--content-width-xl` - 1152px
- `--content-width-2xl` - 1280px
- `--content-width-3xl` - 1440px
- `--content-width-4xl` - 1600px

### Divider Colors
- `--divider-subtle` - rgba(255, 255, 255, 0.06)
- `--divider-soft` - rgba(255, 255, 255, 0.1)
- `--divider-medium` - rgba(255, 255, 255, 0.15)
- `--divider-strong` - rgba(255, 255, 255, 0.25)
- `--divider-accent` - rgba(0, 212, 255, 0.2)

---

## Team SECTION-FLOW
Optimizing visual rhythm and spacing for premium user experiences.
