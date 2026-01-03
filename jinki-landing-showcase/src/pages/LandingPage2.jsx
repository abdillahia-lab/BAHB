import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react'
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { ArrowRight, Play, ChevronDown, Shield, Eye, Zap, Server, Building2, Leaf, Menu, X, Phone, Mail, Thermometer, Map, Check, Clock, AlertTriangle, TrendingUp, Droplets, Activity, Wind, Database, Lock, Cpu, Radio, Navigation, Target, Gauge, Layers, TreeDeciduous, Factory, Wheat, Sun } from 'lucide-react'
import './LandingPage2.css'

// Lazy load Spline for performance
const Spline = lazy(() => import('@splinetool/react-spline'))

// ============================================
// MAGNETIC CURSOR EFFECT
// Premium interaction following cursor
// ============================================
function MagneticCursor() {
  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  const springConfig = { damping: 25, stiffness: 700 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 200)
      cursorY.set(e.clientY - 200)
    }
    window.addEventListener('mousemove', moveCursor)
    return () => window.removeEventListener('mousemove', moveCursor)
  }, [])

  return (
    <motion.div
      className="magnetic-cursor"
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
      }}
    />
  )
}

// ============================================
// FLUID GRADIENT BACKGROUND
// Animated mesh gradient like Linear
// ============================================
function FluidBackground() {
  return (
    <div className="fluid-bg">
      <div className="fluid-bg__gradient fluid-bg__gradient--1" />
      <div className="fluid-bg__gradient fluid-bg__gradient--2" />
      <div className="fluid-bg__gradient fluid-bg__gradient--3" />
      <div className="fluid-bg__noise" />
    </div>
  )
}

// ============================================
// GLASS MORPHISM CARD
// Premium liquid glass effect
// ============================================
function GlassCard({ children, className = '', glow = true }) {
  return (
    <motion.div
      className={`glass-card ${className}`}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {glow && <div className="glass-card__glow" />}
      <div className="glass-card__border" />
      <div className="glass-card__content">
        {children}
      </div>
    </motion.div>
  )
}

// ============================================
// ANIMATED COUNTER
// Count up animation for statistics
// ============================================
function AnimatedCounter({ value, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0
          const end = parseFloat(value.replace(/[^0-9.]/g, ''))
          const duration = 2000
          const increment = end / (duration / 16)

          const timer = setInterval(() => {
            start += increment
            if (start >= end) {
              setCount(end)
              clearInterval(timer)
            } else {
              setCount(start)
            }
          }, 16)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return (
    <span ref={ref}>
      {prefix}{typeof count === 'number' ? (count % 1 === 0 ? Math.floor(count) : count.toFixed(1)) : count}{suffix}
    </span>
  )
}

// ============================================
// REAL DJI MATRICE 400 SHOWCASE
// Using verified working image URLs
// ============================================
function DroneHero() {
  return (
    <div className="drone-hero">
      <div className="drone-hero__image-container">
        <motion.img
          src="https://www-cdn.djiits.com/cms/uploads/4d6128a30991074b6bad20e7e13a0c62.png"
          alt="DJI Matrice 400 RTK Enterprise Drone"
          className="drone-hero__image"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <div className="drone-hero__glow" />
      </div>

      {/* Floating spec badges */}
      <motion.div
        className="drone-spec-badge drone-spec-badge--flight"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Clock size={16} />
        <div>
          <span className="drone-spec-badge__value">59 min</span>
          <span className="drone-spec-badge__label">Flight Time</span>
        </div>
      </motion.div>

      <motion.div
        className="drone-spec-badge drone-spec-badge--payload"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Gauge size={16} />
        <div>
          <span className="drone-spec-badge__value">6 kg</span>
          <span className="drone-spec-badge__label">Payload</span>
        </div>
      </motion.div>

      <motion.div
        className="drone-spec-badge drone-spec-badge--range"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Radio size={16} />
        <div>
          <span className="drone-spec-badge__value">40 km</span>
          <span className="drone-spec-badge__label">O4 Transmission</span>
        </div>
      </motion.div>

      <motion.div
        className="drone-spec-badge drone-spec-badge--accuracy"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Target size={16} />
        <div>
          <span className="drone-spec-badge__value">±1 cm</span>
          <span className="drone-spec-badge__label">RTK Accuracy</span>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================
// DATA CENTER THERMAL VISUALIZATION
// Based on real research: ASHRAE standards, $540K/hr downtime
// ============================================
function DataCenterViz() {
  const [activeRack, setActiveRack] = useState(null)

  const racks = [
    { id: 1, temp: 24, status: 'normal', name: 'Rack A1' },
    { id: 2, temp: 32, status: 'warning', name: 'Rack A2' },
    { id: 3, temp: 45, status: 'critical', name: 'Rack A3' },
    { id: 4, temp: 22, status: 'normal', name: 'Rack B1' },
    { id: 5, temp: 28, status: 'elevated', name: 'Rack B2' },
    { id: 6, temp: 23, status: 'normal', name: 'Rack B3' },
  ]

  return (
    <div className="datacenter-viz">
      <div className="datacenter-viz__header">
        <span className="datacenter-viz__live">● LIVE THERMAL SCAN</span>
        <span className="datacenter-viz__camera">FLIR Zenmuse H30T • 0.03°C Sensitivity</span>
      </div>

      <div className="datacenter-viz__floor">
        {/* Cold aisle */}
        <div className="datacenter-viz__aisle datacenter-viz__aisle--cold">
          <span>COLD AISLE</span>
          <span>18°C</span>
        </div>

        {/* Racks */}
        <div className="datacenter-viz__racks">
          {racks.map((rack) => (
            <motion.div
              key={rack.id}
              className={`datacenter-rack datacenter-rack--${rack.status}`}
              onHoverStart={() => setActiveRack(rack.id)}
              onHoverEnd={() => setActiveRack(null)}
              whileHover={{ scale: 1.05 }}
            >
              <div className="datacenter-rack__thermal" />
              <span className="datacenter-rack__temp">{rack.temp}°C</span>

              <AnimatePresence>
                {activeRack === rack.id && (
                  <motion.div
                    className="datacenter-rack__tooltip"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <strong>{rack.name}</strong>
                    <span>Temperature: {rack.temp}°C</span>
                    <span>Status: {rack.status.toUpperCase()}</span>
                    {rack.status === 'critical' && (
                      <span className="datacenter-rack__alert">
                        ΔT +20°C above ASHRAE limit
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Hot aisle */}
        <div className="datacenter-viz__aisle datacenter-viz__aisle--hot">
          <span>HOT AISLE</span>
          <span>35°C</span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="datacenter-viz__stats">
        <div className="datacenter-stat">
          <AlertTriangle size={16} className="text-critical" />
          <span>1 Critical</span>
        </div>
        <div className="datacenter-stat">
          <Activity size={16} className="text-warning" />
          <span>2 Warnings</span>
        </div>
        <div className="datacenter-stat">
          <Check size={16} className="text-success" />
          <span>3 Normal</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// POWER LINE INSPECTION VISUALIZATION
// Based on research: vegetation encroachment, NERC FAC-003
// ============================================
function PowerLineViz() {
  return (
    <div className="powerline-viz">
      <div className="powerline-viz__header">
        <span className="powerline-viz__live">● LiDAR SCAN</span>
        <span className="powerline-viz__sensor">Zenmuse L2 • 45 pts/m²</span>
      </div>

      <div className="powerline-viz__scene">
        {/* Transmission towers */}
        <svg className="powerline-viz__svg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
          {/* Ground */}
          <path d="M0 180 Q100 170 200 175 T400 180 L400 200 L0 200 Z" fill="#1a3d1a" />

          {/* Tower 1 */}
          <g className="tower">
            <rect x="60" y="80" width="8" height="100" fill="#64748b" />
            <polygon points="64,80 45,100 83,100" fill="#64748b" />
            <line x1="40" y1="90" x2="88" y2="90" stroke="#22d3ee" strokeWidth="2" />
          </g>

          {/* Tower 2 */}
          <g className="tower">
            <rect x="310" y="70" width="8" height="110" fill="#64748b" />
            <polygon points="314,70 295,90 333,90" fill="#64748b" />
            <line x1="290" y1="80" x2="338" y2="80" stroke="#22d3ee" strokeWidth="2" />
          </g>

          {/* Power lines with sag */}
          <path d="M88 90 Q200 120 290 80" stroke="#22d3ee" strokeWidth="2" fill="none" className="powerline-wire" />
          <path d="M88 90 Q200 125 290 80" stroke="#22d3ee" strokeWidth="1.5" fill="none" opacity="0.6" />

          {/* Vegetation - encroachment zone */}
          <g className="vegetation-danger">
            <ellipse cx="180" cy="145" rx="35" ry="25" fill="#dc2626" opacity="0.3" />
            <ellipse cx="180" cy="150" rx="30" ry="30" fill="#22c55e" />
            <text x="180" y="125" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">
              ENCROACHMENT
            </text>
            <text x="180" y="135" textAnchor="middle" fill="#ef4444" fontSize="8">
              2.1m clearance (min: 4.5m)
            </text>
          </g>

          {/* Safe vegetation */}
          <ellipse cx="100" cy="165" rx="20" ry="15" fill="#22c55e" opacity="0.8" />
          <ellipse cx="320" cy="168" rx="25" ry="12" fill="#22c55e" opacity="0.8" />
        </svg>

        {/* Classification legend */}
        <div className="powerline-viz__legend">
          <div className="powerline-legend-item">
            <span className="legend-dot legend-dot--conductor" />
            <span>Conductors</span>
          </div>
          <div className="powerline-legend-item">
            <span className="legend-dot legend-dot--structure" />
            <span>Structures</span>
          </div>
          <div className="powerline-legend-item">
            <span className="legend-dot legend-dot--vegetation" />
            <span>Vegetation</span>
          </div>
          <div className="powerline-legend-item">
            <span className="legend-dot legend-dot--danger" />
            <span>MVCD Violation</span>
          </div>
        </div>
      </div>

      <div className="powerline-viz__stats">
        <div className="powerline-stat">
          <span className="powerline-stat__value">2,418</span>
          <span className="powerline-stat__label">Spans Analyzed</span>
        </div>
        <div className="powerline-stat powerline-stat--alert">
          <span className="powerline-stat__value">23</span>
          <span className="powerline-stat__label">NERC Violations</span>
        </div>
        <div className="powerline-stat">
          <span className="powerline-stat__value">±2cm</span>
          <span className="powerline-stat__label">Accuracy</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// AGRICULTURE NDVI VISUALIZATION
// Based on research: real NDVI thresholds, CWSI
// ============================================
function AgricultureViz() {
  const [selectedZone, setSelectedZone] = useState(null)

  const zones = [
    { id: 1, ndvi: 0.82, status: 'healthy', label: 'Zone A', cwsi: 0.15 },
    { id: 2, ndvi: 0.45, status: 'stressed', label: 'Zone B', cwsi: 0.58 },
    { id: 3, ndvi: 0.71, status: 'healthy', label: 'Zone C', cwsi: 0.22 },
    { id: 4, ndvi: 0.28, status: 'critical', label: 'Zone D', cwsi: 0.78 },
    { id: 5, ndvi: 0.65, status: 'moderate', label: 'Zone E', cwsi: 0.35 },
    { id: 6, ndvi: 0.78, status: 'healthy', label: 'Zone F', cwsi: 0.18 },
  ]

  const getNdviColor = (ndvi) => {
    if (ndvi >= 0.7) return '#22c55e'
    if (ndvi >= 0.5) return '#84cc16'
    if (ndvi >= 0.3) return '#eab308'
    return '#ef4444'
  }

  return (
    <div className="agriculture-viz">
      <div className="agriculture-viz__header">
        <span className="agriculture-viz__live">● MULTISPECTRAL SCAN</span>
        <span className="agriculture-viz__sensor">MicaSense RedEdge-P • 5-Band</span>
      </div>

      <div className="agriculture-viz__field">
        <div className="agriculture-viz__grid">
          {zones.map((zone) => (
            <motion.div
              key={zone.id}
              className={`agriculture-zone agriculture-zone--${zone.status}`}
              style={{ backgroundColor: getNdviColor(zone.ndvi) }}
              onHoverStart={() => setSelectedZone(zone.id)}
              onHoverEnd={() => setSelectedZone(null)}
              whileHover={{ scale: 1.05 }}
            >
              <span className="agriculture-zone__ndvi">{zone.ndvi.toFixed(2)}</span>

              <AnimatePresence>
                {selectedZone === zone.id && (
                  <motion.div
                    className="agriculture-zone__tooltip"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <strong>{zone.label}</strong>
                    <span>NDVI: {zone.ndvi.toFixed(2)}</span>
                    <span>CWSI: {zone.cwsi.toFixed(2)}</span>
                    {zone.cwsi > 0.5 && (
                      <span className="agriculture-zone__alert">
                        Water stress detected
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* NDVI Scale */}
        <div className="agriculture-viz__scale">
          <div className="ndvi-scale">
            <div className="ndvi-scale__bar" />
            <div className="ndvi-scale__labels">
              <span>0</span>
              <span>0.3</span>
              <span>0.5</span>
              <span>0.7</span>
              <span>1.0</span>
            </div>
          </div>
          <span className="ndvi-scale__title">NDVI Index</span>
        </div>
      </div>

      <div className="agriculture-viz__stats">
        <div className="agriculture-stat">
          <Wheat size={16} className="text-success" />
          <div>
            <span className="agriculture-stat__value">847 ha</span>
            <span className="agriculture-stat__label">Healthy Canopy</span>
          </div>
        </div>
        <div className="agriculture-stat agriculture-stat--alert">
          <Droplets size={16} />
          <div>
            <span className="agriculture-stat__value">156 ha</span>
            <span className="agriculture-stat__label">Irrigation Needed</span>
          </div>
        </div>
        <div className="agriculture-stat">
          <TrendingUp size={16} />
          <div>
            <span className="agriculture-stat__value">+12%</span>
            <span className="agriculture-stat__label">Yield Forecast</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// OIL & GAS THERMAL VISUALIZATION
// Distinct from others - pipeline/refinery focus
// ============================================
function OilGasViz() {
  return (
    <div className="oilgas-viz">
      <div className="oilgas-viz__header">
        <span className="oilgas-viz__live">● THERMAL + GAS DETECTION</span>
        <span className="oilgas-viz__sensor">H30T + OGI Sensor</span>
      </div>

      <div className="oilgas-viz__scene">
        {/* Pipeline schematic */}
        <svg viewBox="0 0 400 200" className="oilgas-viz__svg">
          {/* Main pipeline */}
          <path
            d="M20 100 L120 100 L140 80 L260 80 L280 100 L380 100"
            stroke="#64748b"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />

          {/* Pipeline interior */}
          <path
            d="M20 100 L120 100 L140 80 L260 80 L280 100 L380 100"
            stroke="#1e293b"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />

          {/* Thermal hotspot 1 - Flange */}
          <g className="oilgas-hotspot oilgas-hotspot--critical">
            <circle cx="120" cy="100" r="20" fill="url(#thermalGradient1)" />
            <text x="120" y="70" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold">
              87°C
            </text>
            <text x="120" y="130" textAnchor="middle" fill="#94a3b8" fontSize="8">
              Flange Leak
            </text>
          </g>

          {/* Thermal hotspot 2 - Valve */}
          <g className="oilgas-hotspot oilgas-hotspot--warning">
            <circle cx="280" cy="100" r="15" fill="url(#thermalGradient2)" />
            <text x="280" y="75" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold">
              62°C
            </text>
            <text x="280" y="125" textAnchor="middle" fill="#94a3b8" fontSize="8">
              Valve Stress
            </text>
          </g>

          {/* Storage tank */}
          <rect x="320" y="140" width="60" height="50" rx="4" fill="#334155" />
          <rect x="325" y="145" width="50" height="40" rx="2" fill="#1e293b" />
          <text x="350" y="170" textAnchor="middle" fill="#64748b" fontSize="8">
            Tank 7A
          </text>

          {/* Gas plume detection */}
          <g className="gas-plume">
            <ellipse cx="200" cy="50" rx="30" ry="15" fill="#a855f7" opacity="0.3" />
            <ellipse cx="210" cy="45" rx="20" ry="10" fill="#a855f7" opacity="0.4" />
            <text x="200" y="30" textAnchor="middle" fill="#a855f7" fontSize="9" fontWeight="bold">
              CH₄ DETECTED
            </text>
          </g>

          {/* Gradients */}
          <defs>
            <radialGradient id="thermalGradient1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
            </radialGradient>
            <radialGradient id="thermalGradient2">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <div className="oilgas-viz__stats">
        <div className="oilgas-stat oilgas-stat--critical">
          <span className="oilgas-stat__value">2</span>
          <span className="oilgas-stat__label">Thermal Anomalies</span>
        </div>
        <div className="oilgas-stat oilgas-stat--warning">
          <span className="oilgas-stat__value">1</span>
          <span className="oilgas-stat__label">Gas Emission</span>
        </div>
        <div className="oilgas-stat">
          <span className="oilgas-stat__value">14.2 km</span>
          <span className="oilgas-stat__label">Pipeline Scanned</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// INDUSTRY CARDS WITH REAL STATS
// Research-backed statistics for each
// ============================================
function IndustryCard({ industry }) {
  const visualizations = {
    datacenter: <DataCenterViz />,
    utilities: <PowerLineViz />,
    agriculture: <AgricultureViz />,
    oilgas: <OilGasViz />,
  }

  return (
    <motion.div
      className={`industry-section industry-section--${industry.id}`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
    >
      <div className="industry-section__content">
        <div className="industry-section__icon">{industry.icon}</div>
        <h3>{industry.title}</h3>
        <p className="industry-section__description">{industry.description}</p>

        <div className="industry-section__stats">
          {industry.stats.map((stat, i) => (
            <div key={i} className="industry-stat-card">
              <span className="industry-stat-card__value">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              </span>
              <span className="industry-stat-card__label">{stat.label}</span>
            </div>
          ))}
        </div>

        <ul className="industry-section__features">
          {industry.features.map((feature, i) => (
            <li key={i}><Check size={16} /> {feature}</li>
          ))}
        </ul>
      </div>

      <div className="industry-section__visualization">
        {visualizations[industry.id]}
      </div>
    </motion.div>
  )
}

// ============================================
// MAIN LANDING PAGE
// ============================================
export default function LandingPage2() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const industries = [
    {
      id: 'datacenter',
      icon: <Server size={32} />,
      title: 'Data Centers',
      description: 'Prevent catastrophic failures with aerial thermal imaging. Detect hotspots invisible to visual inspection before they cause $540K/hour downtime.',
      stats: [
        { value: '540', suffix: 'K', prefix: '$', label: 'Avg. Hourly Downtime Cost' },
        { value: '0.03', suffix: '°C', label: 'Detection Sensitivity' },
        { value: '15', suffix: '°C', label: 'Critical ΔT Threshold' },
      ],
      features: [
        'ASHRAE compliance monitoring (18-27°C)',
        'Hot/cold aisle thermal mapping',
        'CRAC unit performance analysis',
        'Predictive failure detection',
      ],
    },
    {
      id: 'utilities',
      icon: <Zap size={32} />,
      title: 'Electric Utilities',
      description: 'Reduce inspection costs by 60% while achieving NERC FAC-003 compliance. LiDAR detects vegetation encroachment with centimeter accuracy.',
      stats: [
        { value: '60', suffix: '%', label: 'Cost Reduction vs. Helicopter' },
        { value: '23', suffix: '%', label: 'Outages from Vegetation' },
        { value: '4.5', suffix: 'm', label: 'Min Clearance (230kV)' },
      ],
      features: [
        'NERC FAC-003-4 compliance verification',
        'Corona discharge UV detection',
        'Vegetation MVCD analysis',
        'Transformer thermal profiling',
      ],
    },
    {
      id: 'agriculture',
      icon: <Leaf size={32} />,
      title: 'Precision Agriculture',
      description: 'Detect crop stress 2 weeks before visible symptoms. NDVI and thermal analysis deliver 150%+ ROI through optimized inputs.',
      stats: [
        { value: '150', suffix: '%', label: 'Documented ROI' },
        { value: '25', suffix: '%', label: 'Water Efficiency Gain' },
        { value: '2', suffix: ' weeks', label: 'Early Stress Detection' },
      ],
      features: [
        'NDVI vegetation health indexing',
        'CWSI water stress monitoring',
        'Variable rate prescription maps',
        'Irrigation efficiency analysis',
      ],
    },
    {
      id: 'oilgas',
      icon: <Factory size={32} />,
      title: 'Oil & Gas',
      description: 'Methane detection and thermal inspection of pipelines, refineries, and tank farms. API 653 compliant reporting.',
      stats: [
        { value: '87', suffix: '°C', label: 'Flange Leak Detection' },
        { value: '14', suffix: ' km', label: 'Pipeline/Day Capacity' },
        { value: '99.2', suffix: '%', label: 'Defect Detection Rate' },
      ],
      features: [
        'Optical gas imaging (OGI)',
        'Pipeline right-of-way monitoring',
        'Tank shell thermal profiling',
        'API 653 inspection support',
      ],
    },
  ]

  const capabilities = [
    {
      icon: <Eye size={24} />,
      title: 'Visual Inspection',
      description: '4K aerial imagery with AI defect detection. Survey entire facilities in hours.',
      specs: ['20MP sensor', '4K/60fps video', 'AI anomaly detection'],
    },
    {
      icon: <Thermometer size={24} />,
      title: 'Thermal Analysis',
      description: 'Radiometric imaging reveals faults invisible to the eye. ±0.03°C sensitivity.',
      specs: ['1280×1024 resolution', '±0.03°C NETD', 'Real-time streaming'],
    },
    {
      icon: <Layers size={24} />,
      title: 'LiDAR Mapping',
      description: 'Survey-grade 3D point clouds with centimeter accuracy. 8-class automation.',
      specs: ['45 pts/m² density', '±2cm RTK accuracy', 'DEM/DSM/CHM output'],
    },
    {
      icon: <Shield size={24} />,
      title: 'Cyber & AI Advisory',
      description: 'Zero Trust architecture and AI governance for critical infrastructure.',
      specs: ['Zero Trust design', 'AI risk assessment', 'Compliance audits'],
      credentials: 'CISSP • CCSP • AIGP • PMP',
    },
  ]

  return (
    <div className="jinki">
      {/* VERSION BANNER - Remove after verification */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
        color: 'white',
        padding: '8px 16px',
        fontSize: '12px',
        fontFamily: 'monospace',
        textAlign: 'center',
        fontWeight: 'bold'
      }}>
        🚀 PLATINUM BUILD v2.0 | Jan 3, 2026 | Spline 3D + Real DJI Matrice 400 RTK + NDVI/Thermal Viz
      </div>

      <FluidBackground />
      <MagneticCursor />

      {/* Navigation */}
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav__container">
          <a href="/" className="nav__logo">
            <svg viewBox="0 0 32 32" className="nav__logo-icon">
              <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <circle cx="16" cy="16" r="4" fill="currentColor"/>
            </svg>
            <span className="nav__logo-text">JINKI</span>
          </a>

          <nav className={`nav__menu ${menuOpen ? 'nav__menu--open' : ''}`}>
            <a href="#capabilities">Capabilities</a>
            <a href="#industries">Industries</a>
            <a href="#technology">Technology</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="nav__actions">
            <a href="tel:+15551234567" className="nav__phone">
              <Phone size={16} />
              <span>(555) 123-4567</span>
            </a>
            <a href="#contact" className="btn btn--primary">Get Quote</a>
            <button className="nav__toggle" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="hero">
        <motion.div className="hero__content" style={{ opacity: heroOpacity, scale: heroScale }}>
          <motion.div
            className="hero__badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="hero__badge-dot" />
            <span>Powered by DJI Matrice 400 RTK</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Enterprise Drone
            <br />
            <span className="hero__gradient-text">Intelligence</span>
          </motion.h1>

          <motion.p
            className="hero__subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Thermal imaging, LiDAR mapping, and AI analytics for data centers,
            utilities, and critical infrastructure. Detect failures before they cost
            you $540,000 per hour.
          </motion.p>

          <motion.div
            className="hero__cta"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <a href="#contact" className="btn btn--primary btn--lg">
              Schedule Inspection <ArrowRight size={18} />
            </a>
            <a href="#industries" className="btn btn--glass btn--lg">
              <Play size={16} /> See Industries
            </a>
          </motion.div>

          <motion.div
            className="hero__proof"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="hero__proof-item">
              <span className="hero__proof-value">2.4M+</span>
              <span className="hero__proof-label">Acres Surveyed</span>
            </div>
            <div className="hero__proof-item">
              <span className="hero__proof-value">99.8%</span>
              <span className="hero__proof-label">Detection Rate</span>
            </div>
            <div className="hero__proof-item">
              <span className="hero__proof-value">&lt;24hr</span>
              <span className="hero__proof-label">Report Delivery</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero__visual"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
        >
          <DroneHero />
        </motion.div>

        <a href="#capabilities" className="hero__scroll">
          <ChevronDown size={24} />
        </a>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="section">
        <div className="container">
          <div className="section__header">
            <span className="section__label">Capabilities</span>
            <h2>Four Core Services</h2>
            <p>Multi-sensor inspection platform for critical infrastructure</p>
          </div>

          <div className="capabilities-grid">
            {capabilities.map((cap, i) => (
              <GlassCard key={i} className="capability-card">
                <div className="capability-card__icon">{cap.icon}</div>
                <h3>{cap.title}</h3>
                <p>{cap.description}</p>
                <ul className="capability-card__specs">
                  {cap.specs.map((spec, j) => (
                    <li key={j}><Check size={14} /> {spec}</li>
                  ))}
                </ul>
                {cap.credentials && (
                  <div className="capability-card__credentials">
                    {cap.credentials}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Industries - Each with DISTINCT visualization */}
      <section id="industries" className="section section--industries">
        <div className="container">
          <div className="section__header section__header--center">
            <span className="section__label">Industries</span>
            <h2>Built for Critical Operations</h2>
            <p>Research-backed solutions for sectors where downtime costs millions</p>
          </div>

          {industries.map((industry, i) => (
            <IndustryCard key={industry.id} industry={industry} />
          ))}
        </div>
      </section>

      {/* Technology - Real Matrice 400 imagery */}
      <section id="technology" className="section section--dark">
        <div className="container">
          <div className="tech-showcase">
            <div className="tech-showcase__content">
              <span className="section__label">Platform</span>
              <h2>DJI Matrice 400 RTK</h2>
              <p className="tech-showcase__lead">
                The newest enterprise flagship drone. 59-minute flight time,
                6kg payload capacity, and O4 transmission up to 40km.
              </p>

              <div className="tech-showcase__features">
                <div className="tech-feature">
                  <Navigation size={20} />
                  <div>
                    <strong>Omnidirectional Sensing</strong>
                    <span>LiDAR + mmWave radar for wire-level obstacle avoidance</span>
                  </div>
                </div>
                <div className="tech-feature">
                  <Target size={20} />
                  <div>
                    <strong>RTK Positioning</strong>
                    <span>±1cm horizontal, ±1.5cm vertical accuracy</span>
                  </div>
                </div>
                <div className="tech-feature">
                  <Cpu size={20} />
                  <div>
                    <strong>7 Simultaneous Payloads</strong>
                    <span>H30T, L2 LiDAR, P1 photogrammetry, and more</span>
                  </div>
                </div>
                <div className="tech-feature">
                  <Wind size={20} />
                  <div>
                    <strong>IP55 Weather Rating</strong>
                    <span>Operates in rain, wind up to 15m/s</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="tech-showcase__image">
              <img
                src="https://www-cdn.djiits.com/cms/uploads/65de88444af3186c29fcd9df398325d5.png"
                alt="DJI Matrice 400 RTK with payload"
              />
              <div className="tech-showcase__image-glow" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="section">
        <div className="container">
          <GlassCard className="cta-card" glow={true}>
            <div className="cta-card__content">
              <h2>Ready to Prevent Your Next $540K Outage?</h2>
              <p>
                Schedule a 30-minute discovery call. We'll discuss your infrastructure,
                your challenges, and whether aerial inspection is right for you.
              </p>
              <a href="mailto:hello@jinki.io" className="btn btn--primary btn--lg">
                Schedule Discovery Call <ArrowRight size={18} />
              </a>
              <span className="cta-card__note">Usually respond within 4 hours</span>
            </div>
            <div className="cta-card__contact">
              <div className="cta-contact-item">
                <Mail size={20} />
                <div>
                  <strong>Email</strong>
                  <span>hello@jinki.io</span>
                </div>
              </div>
              <div className="cta-contact-item">
                <Phone size={20} />
                <div>
                  <strong>Phone</strong>
                  <span>(555) 123-4567</span>
                </div>
              </div>
              <div className="cta-contact-item">
                <Clock size={20} />
                <div>
                  <strong>Response</strong>
                  <span>Within 4 hours</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer__grid">
            <div className="footer__brand">
              <a href="/" className="nav__logo">
                <svg viewBox="0 0 32 32" className="nav__logo-icon">
                  <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <circle cx="16" cy="16" r="4" fill="currentColor"/>
                </svg>
                <span className="nav__logo-text">JINKI</span>
              </a>
              <p>Critical infrastructure inspection and cybersecurity advisory.</p>
            </div>
            <div className="footer__links">
              <div>
                <h4>Services</h4>
                <a href="#capabilities">Visual Inspection</a>
                <a href="#capabilities">Thermal Analysis</a>
                <a href="#capabilities">LiDAR Mapping</a>
                <a href="#capabilities">Cyber Advisory</a>
              </div>
              <div>
                <h4>Industries</h4>
                <a href="#industries">Data Centers</a>
                <a href="#industries">Electric Utilities</a>
                <a href="#industries">Agriculture</a>
                <a href="#industries">Oil & Gas</a>
              </div>
              <div>
                <h4>Contact</h4>
                <a href="mailto:hello@jinki.io">hello@jinki.io</a>
                <a href="tel:+15551234567">(555) 123-4567</a>
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            <span>© 2026 Jinki Intelligence. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
