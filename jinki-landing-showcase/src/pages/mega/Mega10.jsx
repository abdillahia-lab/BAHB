import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import './Mega10.css'

const ease = [0.25, 0.1, 0.25, 1]

// ═══════════════════════════════════════════════════════════════
// BLUEPRINT GRID - Technical drafting grid with coordinates
// ═══════════════════════════════════════════════════════════════
function BlueprintGrid() {
  return (
    <div className="blueprint-grid">
      <svg className="blueprint-grid__svg" width="100%" height="100%">
        <defs>
          <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(100, 200, 255, 0.15)" strokeWidth="0.5"/>
          </pattern>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#smallGrid)"/>
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(100, 200, 255, 0.3)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Coordinate markers */}
      <div className="blueprint-grid__coords">
        <div className="coord coord--x">X: 0.000m</div>
        <div className="coord coord--y">Y: 0.000m</div>
        <div className="coord coord--z">Z: +150.000m</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SCHEMATIC EYE - Technical wireframe eye diagram
// ═══════════════════════════════════════════════════════════════
function SchematicEye() {
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => (p + 1) % 3)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="schematic-eye">
      <svg viewBox="0 0 400 300" className="schematic-eye__svg">
        <defs>
          {/* Blueprint glow filter */}
          <filter id="blueprintGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Scan line animation */}
          <linearGradient id="scanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(100, 200, 255, 0)" />
            <stop offset="50%" stopColor="rgba(100, 200, 255, 0.8)" />
            <stop offset="100%" stopColor="rgba(100, 200, 255, 0)" />
          </linearGradient>
        </defs>

        {/* Main eye outline - almond shape */}
        <motion.path
          d="M 100 150 Q 100 100, 200 100 Q 300 100, 300 150 Q 300 200, 200 200 Q 100 200, 100 150"
          fill="none"
          stroke="#64c8ff"
          strokeWidth="2"
          strokeDasharray="5,5"
          filter="url(#blueprintGlow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease }}
        />

        {/* Iris outer circle */}
        <motion.circle
          cx="200"
          cy="150"
          r="50"
          fill="none"
          stroke="#64c8ff"
          strokeWidth="1.5"
          filter="url(#blueprintGlow)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1, delay: 0.5, ease }}
        />

        {/* Iris inner detail circles */}
        <motion.circle
          cx="200"
          cy="150"
          r="35"
          fill="none"
          stroke="#64c8ff"
          strokeWidth="1"
          opacity="0.6"
          strokeDasharray="3,3"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* Pupil */}
        <motion.circle
          cx="200"
          cy="150"
          r="20"
          fill="rgba(100, 200, 255, 0.2)"
          stroke="#64c8ff"
          strokeWidth="2"
          filter="url(#blueprintGlow)"
          animate={{ scale: [1, 0.9, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease }}
        />

        {/* Crosshair in pupil */}
        <line x1="200" y1="130" x2="200" y2="170" stroke="#64c8ff" strokeWidth="1" opacity="0.8"/>
        <line x1="180" y1="150" x2="220" y2="150" stroke="#64c8ff" strokeWidth="1" opacity="0.8"/>

        {/* Measurement lines - horizontal */}
        <g className="measurement-group">
          <line x1="80" y1="150" x2="100" y2="150" stroke="#64c8ff" strokeWidth="0.5" strokeDasharray="2,2"/>
          <line x1="300" y1="150" x2="320" y2="150" stroke="#64c8ff" strokeWidth="0.5" strokeDasharray="2,2"/>
          <line x1="85" y1="100" x2="85" y2="200" stroke="#64c8ff" strokeWidth="0.5"/>
          <line x1="82" y1="100" x2="88" y2="100" stroke="#64c8ff" strokeWidth="0.5"/>
          <line x1="82" y1="200" x2="88" y2="200" stroke="#64c8ff" strokeWidth="0.5"/>
          <text x="70" y="155" fill="#64c8ff" fontSize="10" className="measurement-text">100mm</text>
        </g>

        {/* Measurement lines - vertical */}
        <g className="measurement-group">
          <line x1="200" y1="80" x2="200" y2="100" stroke="#64c8ff" strokeWidth="0.5" strokeDasharray="2,2"/>
          <line x1="100" y1="85" x2="300" y2="85" stroke="#64c8ff" strokeWidth="0.5"/>
          <line x1="100" y1="82" x2="100" y2="88" stroke="#64c8ff" strokeWidth="0.5"/>
          <line x1="300" y1="82" x2="300" y2="88" stroke="#64c8ff" strokeWidth="0.5"/>
          <text x="185" y="75" fill="#64c8ff" fontSize="10" className="measurement-text">200mm</text>
        </g>

        {/* Section marker */}
        <g className="section-marker">
          <circle cx="200" cy="150" r="65" fill="none" stroke="#64c8ff" strokeWidth="0.5" opacity="0.3"/>
          <text x="270" y="150" fill="#64c8ff" fontSize="12" className="section-text">A-A'</text>
        </g>

        {/* Scan line animation */}
        <motion.rect
          x="100"
          y="0"
          width="200"
          height="20"
          fill="url(#scanGradient)"
          opacity="0.6"
          animate={{ y: [80, 220, 80] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        {/* Technical callouts */}
        <g className="callout-group">
          {/* Focal point callout */}
          <line x1="200" y1="150" x2="340" y2="50" stroke="#64c8ff" strokeWidth="0.5" strokeDasharray="2,2"/>
          <circle cx="340" cy="50" r="2" fill="#64c8ff"/>
          <text x="345" y="48" fill="#64c8ff" fontSize="9" className="callout-text">FOCAL POINT</text>
          <text x="345" y="58" fill="#64c8ff" fontSize="8" opacity="0.7" className="callout-text">λ: 550nm</text>

          {/* Aperture callout */}
          <line x1="220" y1="150" x2="340" y2="120" stroke="#64c8ff" strokeWidth="0.5" strokeDasharray="2,2"/>
          <circle cx="340" cy="120" r="2" fill="#64c8ff"/>
          <text x="345" y="120" fill="#64c8ff" fontSize="9" className="callout-text">APERTURE</text>
          <text x="345" y="130" fill="#64c8ff" fontSize="8" opacity="0.7" className="callout-text">Ø: 20mm</text>

          {/* Sensor callout */}
          <line x1="180" y1="150" x2="60" y2="120" stroke="#64c8ff" strokeWidth="0.5" strokeDasharray="2,2"/>
          <circle cx="60" cy="120" r="2" fill="#64c8ff"/>
          <text x="10" y="120" fill="#64c8ff" fontSize="9" className="callout-text">SENSOR ARRAY</text>
          <text x="10" y="130" fill="#64c8ff" fontSize="8" opacity="0.7" className="callout-text">2.4MP/s</text>
        </g>

        {/* Corner markers */}
        <g className="corner-markers" opacity="0.5">
          <path d="M 90 90 L 90 110 M 90 90 L 110 90" stroke="#64c8ff" strokeWidth="1"/>
          <path d="M 310 90 L 310 110 M 310 90 L 290 90" stroke="#64c8ff" strokeWidth="1"/>
          <path d="M 90 210 L 90 190 M 90 210 L 110 210" stroke="#64c8ff" strokeWidth="1"/>
          <path d="M 310 210 L 310 190 M 310 210 L 290 210" stroke="#64c8ff" strokeWidth="1"/>
        </g>

        {/* Status indicator */}
        <motion.circle
          cx="30"
          cy="30"
          r="5"
          fill="#64c8ff"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease }}
        />
        <text x="40" y="34" fill="#64c8ff" fontSize="10" className="status-text">ACTIVE</text>
      </svg>

      {/* Technical specs overlay */}
      <div className="schematic-eye__specs">
        <div className="spec-line">SPEC: JINKI-OPTICS-V3.2</div>
        <div className="spec-line">SCALE: 1:1</div>
        <div className="spec-line">VIEW: FRONTAL ELEVATION</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STRUCTURAL COUNTER - Counter with technical precision
// ═══════════════════════════════════════════════════════════════
function StructuralCounter({ value, suffix = '', prefix = '', label, unit = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const num = parseFloat(value.toString().replace(/[^0-9.]/g, ''))
    const duration = 1500
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(num * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    tick()
  }, [inView, value])

  return (
    <div ref={ref} className="structural-stat">
      <div className="structural-stat__blueprint">
        <svg viewBox="0 0 100 80" className="stat-blueprint">
          <rect x="5" y="5" width="90" height="70" fill="none" stroke="#64c8ff" strokeWidth="0.5" strokeDasharray="2,2"/>
          <line x1="5" y1="40" x2="95" y2="40" stroke="#64c8ff" strokeWidth="0.3" opacity="0.5"/>
          <motion.rect
            x="10"
            y="50"
            width="80"
            height="20"
            fill="rgba(100, 200, 255, 0.2)"
            stroke="#64c8ff"
            strokeWidth="1"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: inView ? 1 : 0 }}
            transition={{ duration: 1.5, ease }}
            style={{ transformOrigin: 'left' }}
          />
        </svg>
      </div>
      <div className="structural-stat__value">
        <span className="value-number">{prefix}{display}{suffix}</span>
        {unit && <span className="value-unit">{unit}</span>}
      </div>
      <div className="structural-stat__label">{label}</div>
      <div className="structural-stat__dimension">DIM: {display}{suffix}</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ISOMETRIC CARD - 3D architectural projection card
// ═══════════════════════════════════════════════════════════════
function IsometricCard({ image, title, problem, solution, stats, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      className="iso-card"
      initial={{ opacity: 0, y: 100 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay: index * 0.15, ease }}
    >
      {/* Blueprint border */}
      <div className="iso-card__border">
        <svg className="border-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect x="1" y="1" width="98" height="98" fill="none" stroke="#64c8ff" strokeWidth="0.3"/>
          <line x1="0" y1="0" x2="10" y2="0" stroke="#64c8ff" strokeWidth="1"/>
          <line x1="0" y1="0" x2="0" y2="10" stroke="#64c8ff" strokeWidth="1"/>
          <line x1="100" y1="0" x2="90" y2="0" stroke="#64c8ff" strokeWidth="1"/>
          <line x1="100" y1="0" x2="100" y2="10" stroke="#64c8ff" strokeWidth="1"/>
          <line x1="0" y1="100" x2="10" y2="100" stroke="#64c8ff" strokeWidth="1"/>
          <line x1="0" y1="100" x2="0" y2="90" stroke="#64c8ff" strokeWidth="1"/>
          <line x1="100" y1="100" x2="90" y2="100" stroke="#64c8ff" strokeWidth="1"/>
          <line x1="100" y1="100" x2="100" y2="90" stroke="#64c8ff" strokeWidth="1"/>
        </svg>
      </div>

      {/* Section marker */}
      <div className="iso-card__section">SEC. {String.fromCharCode(65 + index)}</div>

      <div className="iso-card__image">
        <img src={image} alt={title} loading="lazy"/>
        <div className="iso-card__overlay">
          <svg viewBox="0 0 300 200" className="overlay-svg">
            <line x1="0" y1="100" x2="300" y2="100" stroke="#64c8ff" strokeWidth="0.5" strokeDasharray="5,5" opacity="0.5"/>
            <line x1="150" y1="0" x2="150" y2="200" stroke="#64c8ff" strokeWidth="0.5" strokeDasharray="5,5" opacity="0.5"/>
          </svg>
        </div>
      </div>

      <div className="iso-card__content">
        <h3 className="iso-card__title">{title}</h3>

        <div className="iso-card__spec">
          <div className="spec-header">
            <span className="spec-number">SPEC-{(index + 1).toString().padStart(3, '0')}</span>
            <span className="spec-status">APPROVED</span>
          </div>
        </div>

        <div className="iso-card__block">
          <div className="block-label">
            <span className="label-icon">▲</span>
            <span>CHALLENGE ANALYSIS</span>
          </div>
          <p className="block-text">{problem}</p>
        </div>

        <div className="iso-card__block">
          <div className="block-label">
            <span className="label-icon">◆</span>
            <span>SOLUTION ARCHITECTURE</span>
          </div>
          <p className="block-text">{solution}</p>
        </div>

        <div className="iso-card__metrics">
          {stats.map((stat, i) => (
            <div key={i} className="metric">
              <div className="metric__blueprint">
                <svg viewBox="0 0 60 40">
                  <rect x="2" y="2" width="56" height="36" fill="none" stroke="#64c8ff" strokeWidth="0.5"/>
                  <line x1="5" y1="20" x2="55" y2="20" stroke="#64c8ff" strokeWidth="0.3"/>
                </svg>
              </div>
              <div className="metric__value">{stat.value}</div>
              <div className="metric__label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Drawing number */}
      <div className="iso-card__drawing-number">
        DWG: JNK-{(index + 1).toString().padStart(4, '0')}-A
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Mega10() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const industries = [
    {
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
      title: 'Data Centers',
      problem: '19% of outages stem from cooling failures. Average cost: $700K.',
      solution: 'Thermal monitoring with 0.05°C sensitivity detects hotspots 72 hours early.',
      stats: [{ value: '$700K', label: 'Avg Outage Cost' }, { value: '72hrs', label: 'Early Detection' }]
    },
    {
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80',
      title: 'Electric Utilities',
      problem: 'Ground crews miss 48% of defects. Helicopters cost $2,000+/hour.',
      solution: 'LiDAR at 2.4M points/sec. 60% cost reduction vs helicopter.',
      stats: [{ value: '60%', label: 'Cost Reduction' }, { value: '4.5x', label: 'More Defects' }]
    },
    {
      image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80',
      title: 'Precision Agriculture',
      problem: 'Crop stress visible to eye only after 14+ days of damage.',
      solution: 'NDVI multispectral imaging detects stress 14 days earlier.',
      stats: [{ value: '14 days', label: 'Earlier Detection' }, { value: '150%', label: 'Proven ROI' }]
    },
    {
      image: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=80',
      title: 'Oil & Gas',
      problem: 'EPA requires continuous methane monitoring. Manual inspection takes days.',
      solution: 'Optical Gas Imaging with 99.2% detection. 14km daily coverage.',
      stats: [{ value: '99.2%', label: 'Detection Rate' }, { value: '14km', label: 'Daily Coverage' }]
    }
  ]

  return (
    <div className="architect-page">
      {/* Blueprint grid background */}
      <BlueprintGrid />

      {/* Title block - standard architectural drawing title block */}
      <div className="title-block">
        <div className="title-block__main">
          <div className="title-block__row">
            <span className="label">PROJECT:</span>
            <span className="value">JINKI AERIAL INTELLIGENCE PLATFORM</span>
          </div>
          <div className="title-block__row">
            <span className="label">DRAWING:</span>
            <span className="value">SYSTEM OVERVIEW & SPECIFICATIONS</span>
          </div>
        </div>
        <div className="title-block__meta">
          <div className="meta-row">
            <span>SCALE: NTS</span>
            <span>DATE: 2026-01-05</span>
          </div>
          <div className="meta-row">
            <span>DWG NO: JNK-0001-MASTER</span>
            <span>REV: A</span>
          </div>
        </div>
      </div>

      {/* Navigation - blueprint style */}
      <motion.nav
        className="architect-nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease }}
      >
        <div className="architect-nav__inner">
          <div className="architect-nav__logo">
            <svg viewBox="0 0 40 40" className="logo-blueprint">
              <circle cx="20" cy="20" r="15" fill="none" stroke="#64c8ff" strokeWidth="1"/>
              <circle cx="20" cy="20" r="8" fill="none" stroke="#64c8ff" strokeWidth="1"/>
              <line x1="20" y1="5" x2="20" y2="15" stroke="#64c8ff" strokeWidth="1"/>
              <line x1="20" y1="25" x2="20" y2="35" stroke="#64c8ff" strokeWidth="1"/>
              <line x1="5" y1="20" x2="12" y2="20" stroke="#64c8ff" strokeWidth="1"/>
              <line x1="28" y1="20" x2="35" y2="20" stroke="#64c8ff" strokeWidth="1"/>
            </svg>
            <span>JINKI</span>
          </div>
          <div className="architect-nav__links">
            <a href="#section-a">SEC. A</a>
            <a href="#section-b">SEC. B</a>
            <a href="#section-c">SEC. C</a>
          </div>
          <a href="#contact" className="architect-btn">REQUEST DRAWINGS</a>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="architect-hero">
        <motion.div
          className="architect-hero__content"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          {/* Schematic eye centerpiece */}
          <motion.div
            className="architect-hero__schematic"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.3, ease }}
          >
            <SchematicEye />
          </motion.div>

          <motion.div
            className="architect-hero__text"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease }}
          >
            <div className="hero-eyebrow">
              <span className="eyebrow-line">─────</span>
              <span>TECHNICAL SPECIFICATION</span>
              <span className="eyebrow-line">─────</span>
            </div>

            <h1 className="architect-hero__title">
              <span className="title-line">AUTONOMOUS</span>
              <span className="title-line">AERIAL</span>
              <span className="title-line gradient-blueprint">INTELLIGENCE</span>
            </h1>

            <div className="architect-hero__tagline">
              <span className="tagline-marker">◆</span>
              <span>EX ALTO OMNIA — FROM ABOVE, ALL THINGS</span>
              <span className="tagline-marker">◆</span>
            </div>

            <p className="architect-hero__description">
              Military-adjacent inspection technology for critical infrastructure.<br/>
              Precision anomaly detection before catastrophic failure.
            </p>

            <motion.div
              className="architect-hero__actions"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2, ease }}
            >
              <a href="#contact" className="architect-btn architect-btn--primary">
                <span>REQUEST ASSESSMENT</span>
                <svg viewBox="0 0 20 20" className="btn-arrow">
                  <line x1="5" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="1"/>
                  <polyline points="11,6 15,10 11,14" fill="none" stroke="currentColor" strokeWidth="1"/>
                </svg>
              </a>
              <a href="#section-a" className="architect-btn architect-btn--secondary">
                <span>VIEW SPECIFICATIONS</span>
              </a>
            </motion.div>
          </motion.div>

          {/* Technical stats */}
          <motion.div
            className="architect-hero__stats"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.4, ease }}
          >
            <StructuralCounter value="700" prefix="$" suffix="K" label="AVG OUTAGE PREVENTED" unit="USD"/>
            <StructuralCounter value="72" suffix="hrs" label="EARLY DETECTION" unit="TIME"/>
            <StructuralCounter value="94" suffix="%" label="FAULT ACCURACY" unit="PCT"/>
            <StructuralCounter value="58" suffix="%" label="COST REDUCTION" unit="PCT"/>
          </motion.div>
        </motion.div>
      </section>

      {/* Industries Section */}
      <section id="section-a" className="architect-section">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease }}
        >
          <div className="section-header__marker">
            <svg viewBox="0 0 100 40">
              <line x1="0" y1="20" x2="30" y2="20" stroke="#64c8ff" strokeWidth="1"/>
              <circle cx="50" cy="20" r="8" fill="none" stroke="#64c8ff" strokeWidth="1"/>
              <text x="50" y="24" fill="#64c8ff" fontSize="10" textAnchor="middle" className="marker-text">A</text>
              <line x1="70" y1="20" x2="100" y2="20" stroke="#64c8ff" strokeWidth="1"/>
            </svg>
          </div>
          <h2 className="section-header__title">CRITICAL INFRASTRUCTURE INTELLIGENCE</h2>
          <p className="section-header__subtitle">Research-backed aerial protocols — field-proven architecture</p>
          <div className="section-header__notation">NOTE: ALL DIMENSIONS IN METRIC UNLESS OTHERWISE SPECIFIED</div>
        </motion.div>

        <div className="iso-cards">
          {industries.map((industry, i) => (
            <IsometricCard key={i} {...industry} index={i}/>
          ))}
        </div>
      </section>

      {/* Platform Section */}
      <section id="section-b" className="architect-section architect-section--platform">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease }}
        >
          <div className="section-header__marker">
            <svg viewBox="0 0 100 40">
              <line x1="0" y1="20" x2="30" y2="20" stroke="#64c8ff" strokeWidth="1"/>
              <circle cx="50" cy="20" r="8" fill="none" stroke="#64c8ff" strokeWidth="1"/>
              <text x="50" y="24" fill="#64c8ff" fontSize="10" textAnchor="middle" className="marker-text">B</text>
              <line x1="70" y1="20" x2="100" y2="20" stroke="#64c8ff" strokeWidth="1"/>
            </svg>
          </div>
          <h2 className="section-header__title">ENTERPRISE PLATFORM SPECIFICATIONS</h2>
          <p className="section-header__subtitle">Military-adjacent technology — IP55 all-weather rated</p>
        </motion.div>

        <div className="platform-grid">
          <motion.div
            className="platform-specs"
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease }}
          >
            <h3 className="specs-title">TECHNICAL SPECIFICATIONS</h3>

            <div className="spec-group">
              <div className="spec-group__header">
                <span className="spec-icon">●</span>
                <span>THERMAL IMAGING</span>
              </div>
              <div className="spec-detail">
                <span className="detail-label">Sensitivity:</span>
                <span className="detail-value">0.05°C</span>
              </div>
              <div className="spec-detail">
                <span className="detail-label">Range:</span>
                <span className="detail-value">-20°C to 150°C</span>
              </div>
            </div>

            <div className="spec-group">
              <div className="spec-group__header">
                <span className="spec-icon">●</span>
                <span>LiDAR SCANNING</span>
              </div>
              <div className="spec-detail">
                <span className="detail-label">Point Rate:</span>
                <span className="detail-value">2.4M pts/sec</span>
              </div>
              <div className="spec-detail">
                <span className="detail-label">Accuracy:</span>
                <span className="detail-value">±1cm RTK</span>
              </div>
            </div>

            <div className="spec-group">
              <div className="spec-group__header">
                <span className="spec-icon">●</span>
                <span>FLIGHT SYSTEMS</span>
              </div>
              <div className="spec-detail">
                <span className="detail-label">Endurance:</span>
                <span className="detail-value">59 minutes</span>
              </div>
              <div className="spec-detail">
                <span className="detail-label">Range:</span>
                <span className="detail-value">20km transmission</span>
              </div>
              <div className="spec-detail">
                <span className="detail-label">Rating:</span>
                <span className="detail-value">IP55 weather sealed</span>
              </div>
            </div>

            <div className="spec-group">
              <div className="spec-group__header">
                <span className="spec-icon">●</span>
                <span>MULTISPECTRAL NDVI</span>
              </div>
              <div className="spec-detail">
                <span className="detail-label">Bands:</span>
                <span className="detail-value">5-channel</span>
              </div>
              <div className="spec-detail">
                <span className="detail-label">Detection:</span>
                <span className="detail-value">14-day early stress</span>
              </div>
            </div>

            <div className="spec-group">
              <div className="spec-group__header">
                <span className="spec-icon">●</span>
                <span>OPTICAL GAS IMAGING</span>
              </div>
              <div className="spec-detail">
                <span className="detail-label">Detection:</span>
                <span className="detail-value">99.2% methane</span>
              </div>
              <div className="spec-detail">
                <span className="detail-label">Coverage:</span>
                <span className="detail-value">14km/day</span>
              </div>
            </div>

            <div className="spec-group">
              <div className="spec-group__header">
                <span className="spec-icon">●</span>
                <span>REDUNDANCY</span>
              </div>
              <div className="spec-detail">
                <span className="detail-label">Systems:</span>
                <span className="detail-value">Dual redundant</span>
              </div>
              <div className="spec-detail">
                <span className="detail-label">Uptime:</span>
                <span className="detail-value">99.7% SLA</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="platform-diagram"
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease }}
          >
            <svg viewBox="0 0 400 500" className="diagram-svg">
              <defs>
                <filter id="diagramGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Title */}
              <text x="200" y="30" fill="#64c8ff" fontSize="14" textAnchor="middle" className="diagram-title">
                SYSTEM ARCHITECTURE - ISOMETRIC VIEW
              </text>

              {/* Main platform body - isometric rectangle */}
              <g className="platform-body">
                <path
                  d="M 200 120 L 320 180 L 320 280 L 200 340 L 80 280 L 80 180 Z"
                  fill="rgba(100, 200, 255, 0.05)"
                  stroke="#64c8ff"
                  strokeWidth="2"
                  filter="url(#diagramGlow)"
                />
                {/* Top face */}
                <path
                  d="M 200 120 L 320 180 L 200 240 L 80 180 Z"
                  fill="rgba(100, 200, 255, 0.1)"
                  stroke="#64c8ff"
                  strokeWidth="1.5"
                />
              </g>

              {/* Internal systems */}
              <g className="internal-systems">
                {/* Thermal sensor */}
                <circle cx="150" cy="200" r="20" fill="rgba(255, 100, 100, 0.2)" stroke="#64c8ff" strokeWidth="1"/>
                <text x="150" y="205" fill="#64c8ff" fontSize="8" textAnchor="middle">THRM</text>

                {/* LiDAR */}
                <circle cx="250" cy="200" r="20" fill="rgba(100, 255, 100, 0.2)" stroke="#64c8ff" strokeWidth="1"/>
                <text x="250" y="205" fill="#64c8ff" fontSize="8" textAnchor="middle">LiDAR</text>

                {/* NDVI */}
                <circle cx="200" cy="240" r="20" fill="rgba(100, 100, 255, 0.2)" stroke="#64c8ff" strokeWidth="1"/>
                <text x="200" y="245" fill="#64c8ff" fontSize="8" textAnchor="middle">NDVI</text>
              </g>

              {/* Dimension lines */}
              <g className="dimensions">
                {/* Width */}
                <line x1="80" y1="360" x2="320" y2="360" stroke="#64c8ff" strokeWidth="0.5"/>
                <line x1="80" y1="355" x2="80" y2="365" stroke="#64c8ff" strokeWidth="0.5"/>
                <line x1="320" y1="355" x2="320" y2="365" stroke="#64c8ff" strokeWidth="0.5"/>
                <text x="200" y="380" fill="#64c8ff" fontSize="10" textAnchor="middle">850mm</text>

                {/* Height */}
                <line x1="60" y1="120" x2="60" y2="340" stroke="#64c8ff" strokeWidth="0.5"/>
                <line x1="55" y1="120" x2="65" y2="120" stroke="#64c8ff" strokeWidth="0.5"/>
                <line x1="55" y1="340" x2="65" y2="340" stroke="#64c8ff" strokeWidth="0.5"/>
                <text x="45" y="235" fill="#64c8ff" fontSize="10" textAnchor="middle" transform="rotate(-90, 45, 235)">
                  450mm
                </text>
              </g>

              {/* Callouts */}
              <g className="callouts">
                {/* Thermal callout */}
                <line x1="150" y1="220" x2="30" y2="280" stroke="#64c8ff" strokeWidth="0.5" strokeDasharray="2,2"/>
                <circle cx="30" cy="280" r="2" fill="#64c8ff"/>
                <text x="10" y="275" fill="#64c8ff" fontSize="9">THERMAL</text>
                <text x="10" y="285" fill="#64c8ff" fontSize="7" opacity="0.7">0.05°C</text>

                {/* LiDAR callout */}
                <line x1="250" y1="220" x2="370" y2="280" stroke="#64c8ff" strokeWidth="0.5" strokeDasharray="2,2"/>
                <circle cx="370" cy="280" r="2" fill="#64c8ff"/>
                <text x="320" y="275" fill="#64c8ff" fontSize="9">LiDAR</text>
                <text x="320" y="285" fill="#64c8ff" fontSize="7" opacity="0.7">2.4MP/s</text>

                {/* NDVI callout */}
                <line x1="200" y1="260" x2="200" y2="320" stroke="#64c8ff" strokeWidth="0.5" strokeDasharray="2,2"/>
                <circle cx="200" cy="320" r="2" fill="#64c8ff"/>
                <text x="180" y="315" fill="#64c8ff" fontSize="9">NDVI</text>
                <text x="180" y="325" fill="#64c8ff" fontSize="7" opacity="0.7">5-channel</text>
              </g>

              {/* Section cut line */}
              <line x1="20" y1="230" x2="380" y2="230" stroke="#64c8ff" strokeWidth="1" strokeDasharray="10,5"/>
              <text x="25" y="225" fill="#64c8ff" fontSize="10">A</text>
              <text x="370" y="225" fill="#64c8ff" fontSize="10">A'</text>

              {/* Notes */}
              <text x="200" y="420" fill="#64c8ff" fontSize="8" textAnchor="middle" opacity="0.7">
                SECTION A-A' SHOWS INTERNAL SENSOR ARRAY
              </text>
              <text x="200" y="435" fill="#64c8ff" fontSize="8" textAnchor="middle" opacity="0.7">
                ALL DIMENSIONS ±5mm UNLESS NOTED
              </text>
              <text x="200" y="450" fill="#64c8ff" fontSize="8" textAnchor="middle" opacity="0.7">
                MATERIAL: CARBON FIBER COMPOSITE | WEIGHT: 8.4kg
              </text>

              {/* Drawing info */}
              <text x="10" y="480" fill="#64c8ff" fontSize="7" opacity="0.5">
                DWG: JNK-PLATFORM-ISO-001 | SCALE: 1:10 | REV: A
              </text>
            </svg>
          </motion.div>
        </div>
      </section>

      {/* Advisory Section */}
      <section id="section-c" className="architect-section">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease }}
        >
          <div className="section-header__marker">
            <svg viewBox="0 0 100 40">
              <line x1="0" y1="20" x2="30" y2="20" stroke="#64c8ff" strokeWidth="1"/>
              <circle cx="50" cy="20" r="8" fill="none" stroke="#64c8ff" strokeWidth="1"/>
              <text x="50" y="24" fill="#64c8ff" fontSize="10" textAnchor="middle" className="marker-text">C</text>
              <line x1="70" y1="20" x2="100" y2="20" stroke="#64c8ff" strokeWidth="1"/>
            </svg>
          </div>
          <h2 className="section-header__title">ADVISORY & EXPERTISE</h2>
          <p className="section-header__subtitle">Enterprise security architecture meets aerial intelligence</p>
        </motion.div>

        <motion.div
          className="advisory-card"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease }}
        >
          <div className="advisory-card__border">
            <svg className="border-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <rect x="1" y="1" width="98" height="98" fill="none" stroke="#64c8ff" strokeWidth="0.5" strokeDasharray="5,5"/>
            </svg>
          </div>

          <div className="advisory-card__avatar">
            <svg viewBox="0 0 120 120" className="avatar-blueprint">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#64c8ff" strokeWidth="1.5"/>
              <circle cx="60" cy="60" r="45" fill="rgba(100, 200, 255, 0.05)"/>

              {/* Head outline */}
              <circle cx="60" cy="45" r="15" fill="none" stroke="#64c8ff" strokeWidth="1"/>

              {/* Body outline */}
              <path d="M 60 60 L 45 75 L 45 85" fill="none" stroke="#64c8ff" strokeWidth="1"/>
              <path d="M 60 60 L 75 75 L 75 85" fill="none" stroke="#64c8ff" strokeWidth="1"/>
              <path d="M 45 85 L 75 85" fill="none" stroke="#64c8ff" strokeWidth="1"/>

              {/* Crosshair */}
              <line x1="30" y1="60" x2="90" y2="60" stroke="#64c8ff" strokeWidth="0.5" opacity="0.5"/>
              <line x1="60" y1="30" x2="60" y2="90" stroke="#64c8ff" strokeWidth="0.5" opacity="0.5"/>
            </svg>
          </div>

          <div className="advisory-card__content">
            <h3 className="advisory-card__name">ABDILLAHI A.</h3>
            <div className="advisory-card__title">Principal Security Architect</div>

            <div className="advisory-card__spec-number">SPEC: ADV-001-PRINCIPAL</div>

            <p className="advisory-card__bio">
              Enterprise security architecture, AI governance, and risk management
              for critical infrastructure. Zero-trust frameworks and regulatory
              compliance for energy, utilities, and data center sectors.
            </p>

            <div className="advisory-card__certifications">
              <div className="cert-label">CERTIFICATIONS:</div>
              <div className="cert-list">
                {['CISSP', 'CCSP', 'AIGP', 'PMP'].map((cert, i) => (
                  <div key={cert} className="cert-badge">
                    <svg viewBox="0 0 80 30">
                      <rect x="1" y="1" width="78" height="28" fill="rgba(100, 200, 255, 0.1)" stroke="#64c8ff" strokeWidth="1"/>
                      <text x="40" y="20" fill="#64c8ff" fontSize="11" textAnchor="middle" className="cert-text">
                        {cert}
                      </text>
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            <div className="advisory-card__expertise">
              <div className="expertise-label">CORE EXPERTISE:</div>
              <div className="expertise-grid">
                <div className="expertise-item">
                  <span className="expertise-icon">▪</span>
                  <span>Zero-Trust Architecture</span>
                </div>
                <div className="expertise-item">
                  <span className="expertise-icon">▪</span>
                  <span>AI Risk Governance</span>
                </div>
                <div className="expertise-item">
                  <span className="expertise-icon">▪</span>
                  <span>Critical Infrastructure</span>
                </div>
                <div className="expertise-item">
                  <span className="expertise-icon">▪</span>
                  <span>Regulatory Compliance</span>
                </div>
              </div>
            </div>
          </div>

          <div className="advisory-card__footer">
            DWG: JNK-ADV-001 | STATUS: ACTIVE | CLEARANCE: APPROVED
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="architect-section architect-section--cta">
        <motion.div
          className="architect-cta"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease }}
        >
          <div className="architect-cta__border">
            <svg className="cta-border-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <rect x="2" y="2" width="96" height="96" fill="none" stroke="#64c8ff" strokeWidth="0.5"/>
              <line x1="0" y1="0" x2="15" y2="0" stroke="#64c8ff" strokeWidth="2"/>
              <line x1="0" y1="0" x2="0" y2="15" stroke="#64c8ff" strokeWidth="2"/>
              <line x1="100" y1="0" x2="85" y2="0" stroke="#64c8ff" strokeWidth="2"/>
              <line x1="100" y1="0" x2="100" y2="15" stroke="#64c8ff" strokeWidth="2"/>
              <line x1="0" y1="100" x2="15" y2="100" stroke="#64c8ff" strokeWidth="2"/>
              <line x1="0" y1="100" x2="0" y2="85" stroke="#64c8ff" strokeWidth="2"/>
              <line x1="100" y1="100" x2="85" y2="100" stroke="#64c8ff" strokeWidth="2"/>
              <line x1="100" y1="100" x2="100" y2="85" stroke="#64c8ff" strokeWidth="2"/>
            </svg>
          </div>

          <div className="architect-cta__diagram">
            <svg viewBox="0 0 200 100" className="cta-diagram">
              <defs>
                <filter id="ctaGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Triangle formation */}
              <motion.circle
                cx="100"
                cy="30"
                r="5"
                fill="#64c8ff"
                filter="url(#ctaGlow)"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.circle
                cx="70"
                cy="70"
                r="5"
                fill="#64c8ff"
                filter="url(#ctaGlow)"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.circle
                cx="130"
                cy="70"
                r="5"
                fill="#64c8ff"
                filter="url(#ctaGlow)"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}
              />

              <line x1="100" y1="30" x2="70" y2="70" stroke="#64c8ff" strokeWidth="1" strokeDasharray="3,3"/>
              <line x1="100" y1="30" x2="130" y2="70" stroke="#64c8ff" strokeWidth="1" strokeDasharray="3,3"/>
              <line x1="70" y1="70" x2="130" y2="70" stroke="#64c8ff" strokeWidth="1" strokeDasharray="3,3"/>
            </svg>
          </div>

          <h2 className="architect-cta__title">READY FOR DEPLOYMENT?</h2>

          <div className="architect-cta__tagline">
            <svg viewBox="0 0 300 2" className="tagline-line">
              <line x1="0" y1="1" x2="300" y2="1" stroke="#64c8ff" strokeWidth="1"/>
            </svg>
            <span>EX ALTO OMNIA — FROM ABOVE, ALL THINGS</span>
            <svg viewBox="0 0 300 2" className="tagline-line">
              <line x1="0" y1="1" x2="300" y2="1" stroke="#64c8ff" strokeWidth="1"/>
            </svg>
          </div>

          <p className="architect-cta__description">
            Schedule a technical consultation. Prevent the next million-dollar outage.
          </p>

          <div className="architect-cta__actions">
            <a href="tel:+15551234567" className="architect-btn architect-btn--primary architect-btn--lg">
              <span>INITIATE CONTACT</span>
              <svg viewBox="0 0 20 20" className="btn-icon">
                <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1"/>
                <path d="M 6 10 L 14 10 M 11 7 L 14 10 L 11 13" fill="none" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </a>
            <a href="mailto:contact@jinki.io" className="architect-btn architect-btn--secondary architect-btn--lg">
              <span>REQUEST DRAWINGS</span>
            </a>
          </div>

          <div className="architect-cta__spec">
            SPEC: CONSULTATION-REQUEST | TYPE: TECHNICAL ASSESSMENT | STATUS: AVAILABLE
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="architect-footer">
        <div className="architect-footer__inner">
          <div className="architect-footer__main">
            <div className="footer-logo">
              <svg viewBox="0 0 30 30" className="footer-logo-svg">
                <circle cx="15" cy="15" r="12" fill="none" stroke="#64c8ff" strokeWidth="1"/>
                <circle cx="15" cy="15" r="6" fill="none" stroke="#64c8ff" strokeWidth="1"/>
                <line x1="15" y1="3" x2="15" y2="9" stroke="#64c8ff" strokeWidth="1"/>
                <line x1="15" y1="21" x2="15" y2="27" stroke="#64c8ff" strokeWidth="1"/>
                <line x1="3" y1="15" x2="9" y2="15" stroke="#64c8ff" strokeWidth="1"/>
                <line x1="21" y1="15" x2="27" y2="15" stroke="#64c8ff" strokeWidth="1"/>
              </svg>
              <div>
                <div className="footer-logo__text">JINKI INTELLIGENCE</div>
                <div className="footer-logo__tagline">Ex Alto Omnia</div>
              </div>
            </div>
            <div className="footer-meta">
              <div className="footer-meta__line">
                <span>PROJECT: AERIAL INTELLIGENCE PLATFORM</span>
              </div>
              <div className="footer-meta__line">
                <span>DWG SET: MASTER-2026</span>
                <span>REV: A</span>
                <span>DATE: 2026-01-05</span>
              </div>
            </div>
          </div>
          <div className="architect-footer__bottom">
            <span>© 2026 JINKI INTELLIGENCE. ALL RIGHTS RESERVED.</span>
            <span>CONFIDENTIAL — NOT FOR REPRODUCTION WITHOUT AUTHORIZATION</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
