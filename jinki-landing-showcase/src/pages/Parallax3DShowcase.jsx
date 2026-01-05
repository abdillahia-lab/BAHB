import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import Lenis from 'lenis'
import {
  Parallax3DCard,
  VolumetricLightRays,
  InfiniteZoomParallax,
  TiltShiftDepthBlur,
  DepthText
} from '../components/Parallax3D'
import { useMouseTracking, useDeviceOrientation } from '../hooks/useMouseTracking'
import './Parallax3DShowcase.css'

const ease = [0.25, 0.1, 0.25, 1]

function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])
}

/**
 * PARALLAX3D: 3D Perspective Hero with Volumetric Rays
 */
function Hero3D() {
  const heroRef = useRef(null)
  const { containerRef, perspective } = useMouseTracking(1.0)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.85])
  const rotateHero = useTransform(scrollYProgress, [0, 1], [0, 15])

  return (
    <section ref={heroRef} className="hero-3d">
      <div className="hero-3d__background">
        <div className="hero-3d__grid" />
      </div>

      {/* VOLUMETRIC LIGHT RAYS */}
      <motion.div
        className="hero-3d__rays"
        style={{
          perspective: '1200px',
          transform: `rotateX(${perspective.rotateX * 0.3}deg) rotateY(${perspective.rotateY * 0.3}deg)`
        }}
      >
        <VolumetricLightRays intensity={0.6} />
      </motion.div>

      {/* 3D DEPTH TEXT */}
      <motion.div
        ref={containerRef}
        className="hero-3d__content"
        style={{
          y: heroY,
          opacity: heroOpacity,
          scale: heroScale,
          rotateX: perspective.rotateX * 0.5,
          rotateY: perspective.rotateY * 0.5
        }}
      >
        <motion.p
          className="hero-3d__eyebrow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease }}
        >
          PARALLAX3D Championship
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease }}
        >
          <DepthText
            text="3D Depth Mastery"
            layers={6}
            spacing={12}
          />
        </motion.div>

        <motion.p
          className="hero-3d__subtitle"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease }}
        >
          Revolutionary 3D perspective, mouse tracking, gyroscope integration,<br/>
          depth-based blur, and volumetric light rays.
        </motion.p>

        <motion.div
          className="hero-3d__cta"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8, ease }}
        >
          <button className="btn btn--3d">Experience 3D Depth</button>
          <button className="btn btn--3d-secondary">Learn More</button>
        </motion.div>
      </motion.div>

      {/* 3D FEATURE BADGES */}
      <motion.div
        className="hero-3d__badges"
        style={{
          perspective: '1200px',
          rotateX: perspective.rotateX * 0.2,
          rotateY: perspective.rotateY * 0.2
        }}
      >
        {[
          { icon: '◉', label: 'Mouse Tracking' },
          { icon: '∞', label: 'Infinite Zoom' },
          { icon: '◈', label: 'Depth Blur' }
        ].map((badge, i) => (
          <motion.div
            key={i}
            className="badge-3d"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 + i * 0.1, ease }}
          >
            <span className="badge-3d__icon">{badge.icon}</span>
            <span className="badge-3d__label">{badge.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

/**
 * PARALLAX3D: 3D Card Showcase
 */
function Cards3DShowcase() {
  const cards = [
    {
      title: 'CSS 3D Transforms',
      image: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=500&q=80',
      description: 'Transform-style preserve-3d with full perspective support',
      features: ['Flipping cards', '3D rotation', 'Depth layering'],
      backContent: 'Click to flip - See the 3D magic in action with realistic perspective transforms'
    },
    {
      title: 'Mouse Tracking Depth',
      image: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db3a?w=500&q=80',
      description: 'Real-time perspective shifts following cursor movement',
      features: ['Live tracking', 'Smooth interpolation', 'RAF optimized'],
      backContent: 'Move your mouse - Elements respond with 3D depth perspective'
    },
    {
      title: 'Gyroscope Integration',
      image: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500&q=80',
      description: 'Device orientation sensors for immersive mobile experience',
      features: ['Device sensors', 'Permission handling', 'Smooth orientation'],
      backContent: 'Tilt your device - Gyroscope-powered 3D depth effects'
    },
    {
      title: 'Depth-Based Blur',
      image: 'https://images.unsplash.com/photo-1559028615-cd4628902d4a?w=500&q=80',
      description: 'Tilt-shift focus with variable depth-of-field effects',
      features: ['Adaptive blur', 'Focus tracking', 'Smooth transitions'],
      backContent: 'Hover to change focus - Dynamic depth-of-field with blur effects'
    }
  ]

  return (
    <section className="cards-3d-showcase">
      <motion.div
        className="section__header"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease }}
      >
        <p className="section__eyebrow">Advanced Techniques</p>
        <h2>3D Depth Effects Library</h2>
        <p className="section__subtitle">Flip cards to see the revolutionary 3D transformations</p>
      </motion.div>

      <div className="cards-3d-grid">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, delay: i * 0.1, ease }}
          >
            <Parallax3DCard
              image={card.image}
              title={card.title}
              depth={0}
              isFlippable={true}
              mouseTracking={true}
              gyroTracking={true}
              backContent={card.backContent}
            >
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <div className="card-features">
                {card.features.map((f, idx) => (
                  <span key={idx} className="feature-tag">◉ {f}</span>
                ))}
              </div>
            </Parallax3DCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/**
 * PARALLAX3D: Infinite Zoom Scroll Section
 */
function InfiniteZoomSection() {
  return (
    <section className="infinite-zoom-section">
      <motion.div
        className="section__header"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease }}
      >
        <p className="section__eyebrow">Scroll Experience</p>
        <h2>Infinite Zoom Parallax</h2>
        <p className="section__subtitle">Elements zoom as they approach the center of your viewport</p>
      </motion.div>

      <InfiniteZoomParallax speed={0.5} maxZoom={1.8}>
        <div className="zoom-content">
          <div className="zoom-card">
            <div className="zoom-card__icon">◉</div>
            <h3>Scroll to Expand</h3>
            <p>This element zooms infinitely as it approaches viewport center</p>
          </div>
        </div>
      </InfiniteZoomParallax>

      <InfiniteZoomParallax speed={0.3} maxZoom={1.5}>
        <div className="zoom-content">
          <div className="zoom-card zoom-card--alt">
            <div className="zoom-card__icon">∞</div>
            <h3>Variable Speed</h3>
            <p>Different scroll speeds create layered depth perception</p>
          </div>
        </div>
      </InfiniteZoomParallax>
    </section>
  )
}

/**
 * PARALLAX3D: Depth Comparison Section
 */
function DepthComparisonSection() {
  const [selectedDepth, setSelectedDepth] = useState(0)
  const { containerRef, perspective } = useMouseTracking(0.8)

  const depths = [0, -40, -80, -120]
  const labels = ['Foreground', 'Mid', 'Back', 'Far Back']

  return (
    <section className="depth-comparison">
      <motion.div
        className="section__header"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease }}
      >
        <p className="section__eyebrow">3D Depth Layers</p>
        <h2>Depth Perception Control</h2>
        <p className="section__subtitle">Use the controls to adjust depth and see blur effects</p>
      </motion.div>

      <motion.div
        ref={containerRef}
        className="depth-demo"
        style={{
          perspective: '1200px',
          transform: `rotateX(${perspective.rotateX * 0.2}deg) rotateY(${perspective.rotateY * 0.2}deg)`
        }}
      >
        <div className="depth-stage">
          {depths.map((depth, i) => (
            <motion.div
              key={i}
              className={`depth-layer ${selectedDepth === i ? 'is-active' : ''}`}
              style={{
                transform: `translateZ(${depth}px)`,
                filter: `blur(${Math.abs(depth) * 0.15}px)`,
                opacity: selectedDepth === i ? 1 : 0.4
              }}
              onClick={() => setSelectedDepth(i)}
            >
              <div className="depth-layer__content">
                <span className="depth-layer__number">{i + 1}</span>
                <h4>{labels[i]}</h4>
                <p>Z: {depth}px | Blur: {Math.abs(depth) * 0.15}px</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="depth-controls">
        {labels.map((label, i) => (
          <button
            key={i}
            className={`control-btn ${selectedDepth === i ? 'is-active' : ''}`}
            onClick={() => setSelectedDepth(i)}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}

/**
 * PARALLAX3D: Performance Metrics Section
 */
function PerformanceSection() {
  return (
    <section className="performance-section">
      <motion.div
        className="section__header"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease }}
      >
        <p className="section__eyebrow">Optimization</p>
        <h2>Performance Considerations</h2>
        <p className="section__subtitle">Production-ready 3D effects with mobile optimization</p>
      </motion.div>

      <div className="performance-grid">
        {[
          {
            title: 'GPU Acceleration',
            description: 'Hardware-accelerated transforms using translate3d and will-change',
            metric: '60 FPS'
          },
          {
            title: 'RAF Throttling',
            description: 'Mouse tracking optimized with requestAnimationFrame batching',
            metric: '<16ms'
          },
          {
            title: 'Memory Efficient',
            description: 'Minimal DOM updates, CSS-based transforms, no shader compilation',
            metric: '~2MB'
          },
          {
            title: 'Mobile Optimized',
            description: 'Responsive performance reduction, gyroscope permission handling',
            metric: '45+ FPS'
          },
          {
            title: 'Accessibility',
            description: 'Respects prefers-reduced-motion, fallback animations available',
            metric: 'WCAG AA'
          },
          {
            title: 'Browser Support',
            description: 'CSS 3D support with graceful degradation for older browsers',
            metric: '95%+'
          }
        ].map((item, i) => (
          <motion.div
            key={i}
            className="perf-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.08, ease }}
          >
            <div className="perf-card__metric">{item.metric}</div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/**
 * PARALLAX3D: Code Examples Section
 */
function CodeExamplesSection() {
  const [activeTab, setActiveTab] = useState(0)

  const examples = [
    {
      title: 'Mouse Tracking Hook',
      language: 'jsx',
      code: `import { useMouseTracking } from './hooks/useMouseTracking'

export function MyComponent() {
  const { containerRef, perspective } = useMouseTracking(0.8)

  return (
    <div ref={containerRef} style={{ perspective: '1200px' }}>
      <div style={{
        transform: \`
          rotateX(\${perspective.rotateX}deg)
          rotateY(\${perspective.rotateY}deg)
        \`
      }}>
        3D Content
      </div>
    </div>
  )
}`
    },
    {
      title: 'Gyroscope Integration',
      language: 'jsx',
      code: `import { useDeviceOrientation } from './hooks/useMouseTracking'

export function GyroComponent() {
  const { orientation, requestPermission } = useDeviceOrientation(0.6)

  return (
    <div style={{
      transform: \`
        rotateX(\${orientation.beta}deg)
        rotateY(\${orientation.alpha}deg)
      \`
    }}>
      Tilt device to rotate
    </div>
  )
}`
    },
    {
      title: '3D Card with Parallax',
      language: 'jsx',
      code: `import Parallax3DCard from './components/Parallax3D'

export function CardComponent() {
  return (
    <Parallax3DCard
      image="/image.jpg"
      title="3D Card"
      depth={0}
      isFlippable={true}
      mouseTracking={true}
      gyroTracking={true}
      backContent={<div>Back side</div>}
    >
      <h3>Front Content</h3>
      <p>This card has 3D depth effects</p>
    </Parallax3DCard>
  )
}`
    }
  ]

  return (
    <section className="code-examples">
      <motion.div
        className="section__header"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease }}
      >
        <p className="section__eyebrow">Implementation</p>
        <h2>Ready-to-Use Components</h2>
        <p className="section__subtitle">Copy-paste components with full TypeScript support</p>
      </motion.div>

      <div className="code-container">
        <div className="code-tabs">
          {examples.map((ex, i) => (
            <button
              key={i}
              className={`code-tab ${activeTab === i ? 'is-active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {ex.title}
            </button>
          ))}
        </div>

        <motion.pre
          className="code-block"
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <code>{examples[activeTab].code}</code>
        </motion.pre>
      </div>
    </section>
  )
}

/**
 * PARALLAX3D: Main Showcase Page
 */
export default function Parallax3DShowcase() {
  useSmoothScroll()

  return (
    <div className="showcase-page">
      {/* NAV */}
      <motion.header
        className="showcase-nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease }}
      >
        <div className="showcase-nav__inner">
          <a href="/" className="showcase-nav__logo">
            <span>PARALLAX3D</span>
          </a>
          <nav className="showcase-nav__links">
            <a href="#depth">3D Depth</a>
            <a href="#zoom">Infinite Zoom</a>
            <a href="#performance">Performance</a>
            <a href="#code">Implementation</a>
          </nav>
        </div>
      </motion.header>

      <Hero3D />
      <Cards3DShowcase />
      <InfiniteZoomSection />
      <DepthComparisonSection />
      <PerformanceSection />
      <CodeExamplesSection />

      {/* FOOTER */}
      <footer className="showcase-footer">
        <div className="showcase-footer__content">
          <p className="showcase-footer__title">PARALLAX3D Champion</p>
          <p className="showcase-footer__tagline">Revolutionary 3D Depth & Parallax Effects</p>
          <p className="showcase-footer__copy">© 2026 Jinki Intelligence. Building the future of aerial intelligence.</p>
        </div>
      </footer>
    </div>
  )
}
