import { useState, useEffect, useRef, useCallback, Suspense, lazy, memo } from 'react'
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { ArrowRight, Play, ChevronDown, Shield, Eye, Zap, Server, Building2, Leaf, Menu, X, Phone, Mail, Thermometer, Map, Check, Clock, AlertTriangle, TrendingUp, Droplets, Activity, Wind, Database, Lock, Cpu, Radio, Navigation, Target, Gauge, Layers, TreeDeciduous, Factory, Wheat, Sun, Flame, CircleDot, Crosshair, Radar } from 'lucide-react'
import './LandingPage2.css'

// Lazy load Spline for performance
const Spline = lazy(() => import('@splinetool/react-spline'))

// ============================================
// BUILD VERSION - UNMISSABLE VERIFICATION
// ============================================
const BUILD_VERSION = 'PLATINUM-3.0'
const BUILD_DATE = 'January 3, 2026 - 18:45 UTC'
const BUILD_ID = 'M400-WEBGL-JITTER'

// ============================================
// WEBGL-STYLE FLUID BACKGROUND
// Interactive with mouse movement
// ============================================
function WebGLFluidBackground() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      })
    }
    const handleMouseDown = () => setIsPressed(true)
    const handleMouseUp = () => setIsPressed(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return (
    <div className="webgl-fluid">
      {/* Primary orb - follows cursor */}
      <motion.div
        className="webgl-fluid__orb webgl-fluid__orb--primary"
        animate={{
          x: mousePos.x * 0.5,
          y: mousePos.y * 0.5,
          scale: isPressed ? 1.3 : 1,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 30 }}
      />

      {/* Secondary orb - inverse movement */}
      <motion.div
        className="webgl-fluid__orb webgl-fluid__orb--secondary"
        animate={{
          x: mousePos.x * -0.3,
          y: mousePos.y * -0.3,
          scale: isPressed ? 0.8 : 1,
        }}
        transition={{ type: 'spring', stiffness: 40, damping: 25 }}
      />

      {/* Tertiary orb - diagonal movement */}
      <motion.div
        className="webgl-fluid__orb webgl-fluid__orb--tertiary"
        animate={{
          x: mousePos.x * 0.2,
          y: mousePos.y * -0.4,
        }}
        transition={{ type: 'spring', stiffness: 30, damping: 20 }}
      />

      {/* Grid overlay for military feel */}
      <div className="webgl-fluid__grid" />

      {/* Noise texture */}
      <div className="webgl-fluid__noise" />
    </div>
  )
}

// ============================================
// MAGNETIC CURSOR WITH TRAIL
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
      cursorX.set(e.clientX - 150)
      cursorY.set(e.clientY - 150)
    }
    window.addEventListener('mousemove', moveCursor)
    return () => window.removeEventListener('mousemove', moveCursor)
  }, [cursorX, cursorY])

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
// JITTER ANIMATION COMPONENT
// Figma Jitter-style micro-interactions
// ============================================
function JitterCard({ children, className = '', delay = 0 }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className={`jitter-card ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.34, 1.56, 0.64, 1] // Spring curve
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
        boxShadow: '0 30px 60px rgba(0, 200, 255, 0.15)'
      }}
    >
      <div className="jitter-card__glow" />
      <div className="jitter-card__border" />
      <div className="jitter-card__content">
        {children}
      </div>
    </motion.div>
  )
}

// ============================================
// ANIMATED COUNTER WITH SPRING
// ============================================
function AnimatedCounter({ value, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0
          const end = parseFloat(value.toString().replace(/[^0-9.]/g, ''))
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

  const displayValue = Number.isInteger(parseFloat(value))
    ? Math.floor(count)
    : count.toFixed(2)

  return (
    <span ref={ref} className="animated-counter">
      {prefix}{displayValue}{suffix}
    </span>
  )
}

// ============================================
// DJI MATRICE 400 RTK HERO
// Official CDN images with floating specs
// ============================================
function DroneHeroSection() {
  return (
    <div className="drone-hero">
      <div className="drone-hero__container">
        {/* Main drone image from official DJI CDN */}
        <motion.div
          className="drone-hero__image-wrapper"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <img
            src="https://www-cdn.djiits.com/cms/uploads/67bb8244fb64295b08f9186279ba5b35.png"
            alt="DJI Matrice 400 RTK Enterprise Drone"
            className="drone-hero__image"
            onError={(e) => {
              // Fallback to alternative CDN URL
              e.target.src = 'https://www-cdn.djiits.com/cms/uploads/2ed1e47f4631274604877fa57933c373.png'
            }}
          />

          {/* Floating spec badges */}
          <motion.div
            className="drone-hero__spec drone-hero__spec--1"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Clock size={16} />
            <span>59 min</span>
            <small>Flight Time</small>
          </motion.div>

          <motion.div
            className="drone-hero__spec drone-hero__spec--2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <Gauge size={16} />
            <span>6 kg</span>
            <small>Max Payload</small>
          </motion.div>

          <motion.div
            className="drone-hero__spec drone-hero__spec--3"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <Radio size={16} />
            <span>40 km</span>
            <small>O4 Transmission</small>
          </motion.div>

          <motion.div
            className="drone-hero__spec drone-hero__spec--4"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
          >
            <Crosshair size={16} />
            <span>±1 cm</span>
            <small>RTK Accuracy</small>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

// ============================================
// DATA CENTER THERMAL VISUALIZATION
// Interactive hot/cold aisle thermal grid
// ============================================
function DataCenterVisualization() {
  const [activeRack, setActiveRack] = useState(null)

  const racks = [
    { id: 1, name: 'Rack A1', temp: 22, status: 'optimal', x: 0, y: 0 },
    { id: 2, name: 'Rack A2', temp: 28, status: 'normal', x: 1, y: 0 },
    { id: 3, name: 'Rack A3', temp: 35, status: 'warning', x: 2, y: 0 },
    { id: 4, name: 'Rack A4', temp: 48, status: 'critical', x: 3, y: 0 },
    { id: 5, name: 'Rack B1', temp: 24, status: 'optimal', x: 0, y: 1 },
    { id: 6, name: 'Rack B2', temp: 26, status: 'normal', x: 1, y: 1 },
    { id: 7, name: 'Rack B3', temp: 31, status: 'warning', x: 2, y: 1 },
    { id: 8, name: 'Rack B4', temp: 25, status: 'optimal', x: 3, y: 1 },
  ]

  return (
    <div className="viz viz--datacenter">
      <div className="viz__header">
        <Thermometer size={20} />
        <span>THERMAL MONITORING - LIVE</span>
      </div>

      <div className="datacenter-grid">
        {/* Cold Aisle Label */}
        <div className="datacenter-aisle datacenter-aisle--cold">
          <span>COLD AISLE</span>
          <small>18-20°C</small>
        </div>

        {/* Rack Grid */}
        <div className="datacenter-racks">
          {racks.map((rack) => (
            <motion.div
              key={rack.id}
              className={`datacenter-rack datacenter-rack--${rack.status}`}
              onHoverStart={() => setActiveRack(rack.id)}
              onHoverEnd={() => setActiveRack(null)}
              whileHover={{ scale: 1.05 }}
              style={{
                gridColumn: rack.x + 1,
                gridRow: rack.y + 1,
              }}
            >
              <div className="datacenter-rack__thermal" />
              <span className="datacenter-rack__temp">{rack.temp}°C</span>

              <AnimatePresence>
                {activeRack === rack.id && (
                  <motion.div
                    className="datacenter-rack__tooltip"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <strong>{rack.name}</strong>
                    <span>Temp: {rack.temp}°C</span>
                    <span>Status: {rack.status.toUpperCase()}</span>
                    {rack.status === 'critical' && (
                      <span className="datacenter-rack__alert">ASHRAE VIOLATION</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Hot Aisle Label */}
        <div className="datacenter-aisle datacenter-aisle--hot">
          <span>HOT AISLE</span>
          <small>35-45°C</small>
        </div>
      </div>

      {/* ASHRAE Legend */}
      <div className="datacenter-legend">
        <div className="datacenter-legend__item datacenter-legend__item--optimal">
          <span />
          18-27°C (ASHRAE)
        </div>
        <div className="datacenter-legend__item datacenter-legend__item--warning">
          <span />
          27-35°C (Warning)
        </div>
        <div className="datacenter-legend__item datacenter-legend__item--critical">
          <span />
          35°C+ (Critical)
        </div>
      </div>
    </div>
  )
}

// ============================================
// POWER LINE LIDAR VISUALIZATION
// SVG transmission line with vegetation detection
// ============================================
function PowerLineVisualization() {
  return (
    <div className="viz viz--powerline">
      <div className="viz__header">
        <Radar size={20} />
        <span>LIDAR SCAN - CORRIDOR ANALYSIS</span>
      </div>

      <svg viewBox="0 0 400 200" className="powerline-svg">
        {/* Background grid */}
        <defs>
          <pattern id="powerlineGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 200, 255, 0.1)" strokeWidth="0.5"/>
          </pattern>

          {/* Vegetation gradient */}
          <linearGradient id="vegGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#166534" stopOpacity="0.4"/>
          </linearGradient>

          {/* Danger zone gradient */}
          <linearGradient id="dangerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
          </linearGradient>
        </defs>

        <rect width="400" height="200" fill="url(#powerlineGrid)"/>

        {/* Transmission towers */}
        <g className="powerline-tower">
          <rect x="45" y="60" width="10" height="120" fill="#374151"/>
          <polygon points="50,30 30,60 70,60" fill="#374151"/>
          <line x1="30" y1="50" x2="70" y2="50" stroke="#6b7280" strokeWidth="3"/>
          <line x1="25" y1="70" x2="75" y2="70" stroke="#6b7280" strokeWidth="3"/>
        </g>

        <g className="powerline-tower">
          <rect x="345" y="60" width="10" height="120" fill="#374151"/>
          <polygon points="350,30 330,60 370,60" fill="#374151"/>
          <line x1="330" y1="50" x2="370" y2="50" stroke="#6b7280" strokeWidth="3"/>
          <line x1="325" y1="70" x2="375" y2="70" stroke="#6b7280" strokeWidth="3"/>
        </g>

        {/* Power lines with animation */}
        <path
          d="M 75 50 Q 200 80 325 50"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2"
          className="powerline-wire"
        />
        <path
          d="M 75 70 Q 200 100 325 70"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2"
          className="powerline-wire powerline-wire--2"
        />

        {/* Vegetation - safe */}
        <ellipse cx="120" cy="175" rx="25" ry="20" fill="url(#vegGradient)"/>
        <ellipse cx="280" cy="170" rx="30" ry="25" fill="url(#vegGradient)"/>

        {/* Vegetation - ENCROACHMENT */}
        <ellipse cx="200" cy="130" rx="35" ry="40" fill="url(#vegGradient)" className="powerline-encroachment"/>

        {/* Danger zone */}
        <rect x="165" y="60" width="70" height="80" fill="url(#dangerGradient)" className="powerline-danger"/>

        {/* MVCD clearance indicator */}
        <line x1="200" y1="100" x2="200" y2="130" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,2"/>
        <text x="205" y="118" fill="#ef4444" fontSize="8" fontWeight="bold">2.1m</text>

        {/* Alert box */}
        <g className="powerline-alert">
          <rect x="145" y="5" width="110" height="22" rx="4" fill="#ef4444"/>
          <text x="200" y="19" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">
            NERC FAC-003 VIOLATION
          </text>
        </g>
      </svg>

      <div className="powerline-stats">
        <div className="powerline-stat">
          <span className="powerline-stat__value">2,418</span>
          <span className="powerline-stat__label">Spans Analyzed</span>
        </div>
        <div className="powerline-stat powerline-stat--alert">
          <span className="powerline-stat__value">23</span>
          <span className="powerline-stat__label">MVCD Violations</span>
        </div>
        <div className="powerline-stat">
          <span className="powerline-stat__value">4.5m</span>
          <span className="powerline-stat__label">Min Clearance (230kV)</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// AGRICULTURE NDVI VISUALIZATION
// Color-coded field zones with water stress
// ============================================
function AgricultureVisualization() {
  const [activeZone, setActiveZone] = useState(null)

  const zones = [
    { id: 1, ndvi: 0.82, cwsi: 0.12, status: 'healthy', label: 'Zone A' },
    { id: 2, ndvi: 0.45, cwsi: 0.58, status: 'stressed', label: 'Zone B' },
    { id: 3, ndvi: 0.71, cwsi: 0.22, status: 'healthy', label: 'Zone C' },
    { id: 4, ndvi: 0.28, cwsi: 0.78, status: 'critical', label: 'Zone D' },
    { id: 5, ndvi: 0.65, cwsi: 0.35, status: 'moderate', label: 'Zone E' },
    { id: 6, ndvi: 0.78, cwsi: 0.18, status: 'healthy', label: 'Zone F' },
  ]

  const getNDVIColor = (ndvi) => {
    if (ndvi >= 0.7) return 'var(--success)'
    if (ndvi >= 0.5) return 'var(--warning)'
    if (ndvi >= 0.3) return '#f97316'
    return 'var(--critical)'
  }

  return (
    <div className="viz viz--agriculture">
      <div className="viz__header">
        <Wheat size={20} />
        <span>NDVI ANALYSIS - FIELD HEALTH</span>
      </div>

      <div className="agriculture-container">
        {/* Field grid */}
        <div className="agriculture-field">
          {zones.map((zone) => (
            <motion.div
              key={zone.id}
              className={`agriculture-zone agriculture-zone--${zone.status}`}
              onHoverStart={() => setActiveZone(zone.id)}
              onHoverEnd={() => setActiveZone(null)}
              whileHover={{ scale: 1.05 }}
              style={{
                backgroundColor: getNDVIColor(zone.ndvi),
                opacity: 0.7 + (zone.ndvi * 0.3)
              }}
            >
              <span className="agriculture-zone__label">{zone.label}</span>
              <span className="agriculture-zone__ndvi">{zone.ndvi.toFixed(2)}</span>

              <AnimatePresence>
                {activeZone === zone.id && (
                  <motion.div
                    className="agriculture-zone__tooltip"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <strong>{zone.label}</strong>
                    <div>NDVI: {zone.ndvi.toFixed(2)}</div>
                    <div>CWSI: {zone.cwsi.toFixed(2)}</div>
                    <div className={`agriculture-zone__status agriculture-zone__status--${zone.status}`}>
                      {zone.status.toUpperCase()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* NDVI Scale */}
        <div className="agriculture-scale">
          <div className="agriculture-scale__bar" />
          <div className="agriculture-scale__labels">
            <span>0.0<br/><small>Bare</small></span>
            <span>0.3<br/><small>Sparse</small></span>
            <span>0.5<br/><small>Moderate</small></span>
            <span>0.7<br/><small>Healthy</small></span>
            <span>1.0<br/><small>Dense</small></span>
          </div>
        </div>
      </div>

      <div className="agriculture-insights">
        <div className="agriculture-insight agriculture-insight--alert">
          <AlertTriangle size={16} />
          <span>Zone D requires immediate irrigation (CWSI: 0.78)</span>
        </div>
        <div className="agriculture-insight">
          <TrendingUp size={16} />
          <span>+12% yield forecast in healthy zones</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// OIL & GAS PIPELINE VISUALIZATION
// Thermal profiling with gas detection
// ============================================
function OilGasVisualization() {
  return (
    <div className="viz viz--oilgas">
      <div className="viz__header">
        <Flame size={20} />
        <span>PIPELINE THERMAL - OGI SCAN</span>
      </div>

      <svg viewBox="0 0 400 180" className="oilgas-svg">
        <defs>
          <linearGradient id="pipeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6"/>
            <stop offset="30%" stopColor="#22c55e"/>
            <stop offset="50%" stopColor="#eab308"/>
            <stop offset="70%" stopColor="#ef4444"/>
            <stop offset="100%" stopColor="#3b82f6"/>
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Main pipeline */}
        <rect x="20" y="70" width="360" height="20" rx="10" fill="url(#pipeGradient)"/>

        {/* Pipeline supports */}
        <rect x="60" y="90" width="8" height="40" fill="#374151"/>
        <rect x="140" y="90" width="8" height="40" fill="#374151"/>
        <rect x="220" y="90" width="8" height="40" fill="#374151"/>
        <rect x="300" y="90" width="8" height="40" fill="#374151"/>

        {/* Thermal hotspot - flange leak */}
        <circle cx="200" cy="80" r="25" fill="none" stroke="#ef4444" strokeWidth="3" filter="url(#glow)" className="oilgas-hotspot"/>
        <circle cx="200" cy="80" r="15" fill="#ef4444" opacity="0.5" className="oilgas-hotspot-inner"/>

        {/* Hotspot label */}
        <g className="oilgas-label">
          <rect x="160" y="25" width="80" height="30" rx="4" fill="rgba(239, 68, 68, 0.9)"/>
          <text x="200" y="38" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">FLANGE LEAK</text>
          <text x="200" y="50" fill="white" fontSize="11" textAnchor="middle" fontWeight="bold">87°C</text>
        </g>

        {/* Gas plume detection */}
        <g className="oilgas-plume">
          <ellipse cx="280" cy="55" rx="30" ry="20" fill="rgba(168, 85, 247, 0.4)"/>
          <ellipse cx="285" cy="45" rx="20" ry="15" fill="rgba(168, 85, 247, 0.3)"/>
          <ellipse cx="290" cy="38" rx="12" ry="10" fill="rgba(168, 85, 247, 0.2)"/>
        </g>

        {/* Gas detection label */}
        <g className="oilgas-gas-label">
          <rect x="250" y="5" width="80" height="22" rx="4" fill="rgba(168, 85, 247, 0.9)"/>
          <text x="290" y="19" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">CH₄ DETECTED</text>
        </g>

        {/* Normal temperature indicators */}
        <text x="60" y="65" fill="#22c55e" fontSize="8" textAnchor="middle">32°C</text>
        <text x="340" y="65" fill="#3b82f6" fontSize="8" textAnchor="middle">28°C</text>

        {/* Ground line */}
        <line x1="0" y1="140" x2="400" y2="140" stroke="#374151" strokeWidth="2"/>
        <rect x="0" y="140" width="400" height="40" fill="#1f2937" opacity="0.5"/>
      </svg>

      <div className="oilgas-stats">
        <div className="oilgas-stat">
          <span className="oilgas-stat__value">14 km</span>
          <span className="oilgas-stat__label">Scanned Today</span>
        </div>
        <div className="oilgas-stat oilgas-stat--alert">
          <span className="oilgas-stat__value">2</span>
          <span className="oilgas-stat__label">Anomalies Found</span>
        </div>
        <div className="oilgas-stat">
          <span className="oilgas-stat__value">99.2%</span>
          <span className="oilgas-stat__label">Detection Rate</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN LANDING PAGE COMPONENT
// ============================================
export default function LandingPage2() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeIndustry, setActiveIndustry] = useState('datacenter')
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
      icon: <Server size={28} />,
      title: 'Data Centers',
      description: 'Prevent $540K/hour downtime with thermal anomaly detection. ASHRAE compliance monitoring with 0.03°C sensitivity.',
      stats: [
        { value: '540', suffix: 'K', prefix: '$', label: 'Hourly Downtime Cost' },
        { value: '0.03', suffix: '°C', label: 'Detection Sensitivity' },
        { value: '24', suffix: 'hr', label: 'Early Warning' },
      ],
      visualization: <DataCenterVisualization />,
    },
    {
      id: 'utilities',
      icon: <Zap size={28} />,
      title: 'Electric Utilities',
      description: '60% cost reduction vs helicopters. NERC FAC-003 compliance with LiDAR vegetation analysis.',
      stats: [
        { value: '60', suffix: '%', label: 'Cost Reduction' },
        { value: '4.5', suffix: 'x', label: 'More Defects Found' },
        { value: '14', suffix: ' mi', label: 'Daily Capacity' },
      ],
      visualization: <PowerLineVisualization />,
    },
    {
      id: 'agriculture',
      icon: <Leaf size={28} />,
      title: 'Precision Agriculture',
      description: 'Detect crop stress 14 days before visible symptoms. NDVI and CWSI analysis for 150%+ ROI.',
      stats: [
        { value: '150', suffix: '%', label: 'Documented ROI' },
        { value: '14', suffix: ' days', label: 'Early Detection' },
        { value: '25', suffix: '%', label: 'Water Savings' },
      ],
      visualization: <AgricultureVisualization />,
    },
    {
      id: 'oilgas',
      icon: <Factory size={28} />,
      title: 'Oil & Gas',
      description: 'Optical Gas Imaging (OGI) for methane detection. Pipeline thermal profiling with API 653 compliance.',
      stats: [
        { value: '99.2', suffix: '%', label: 'Detection Rate' },
        { value: '14', suffix: ' km', label: 'Pipeline/Day' },
        { value: '87', suffix: '°C', label: 'Hotspot Detection' },
      ],
      visualization: <OilGasVisualization />,
    },
  ]

  const team = [
    {
      name: 'Abdillahi A.',
      role: 'Cyber & AI Security Advisor',
      description: 'Enterprise security architecture, AI governance, and risk management for critical infrastructure.',
      credentials: 'CISSP • CCSP • AIGP • PMP',
    },
  ]

  return (
    <div className="jinki-v3">
      {/* VERSION BANNER - UNMISSABLE */}
      <div className="version-banner">
        <div className="version-banner__pulse" />
        <span className="version-banner__id">{BUILD_ID}</span>
        <span className="version-banner__text">
          PLATINUM BUILD {BUILD_VERSION} | {BUILD_DATE} | WebGL Fluid + Jitter Animations + Real M400 RTK
        </span>
      </div>

      <WebGLFluidBackground />
      <MagneticCursor />

      {/* Navigation */}
      <header className={`nav-v3 ${scrolled ? 'nav-v3--scrolled' : ''}`}>
        <div className="nav-v3__container">
          <a href="/" className="nav-v3__logo">
            <div className="nav-v3__logo-icon">
              <svg viewBox="0 0 32 32">
                <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="16" cy="16" r="4" fill="currentColor"/>
                <circle cx="16" cy="8" r="2" fill="currentColor" opacity="0.5"/>
                <circle cx="22" cy="12" r="2" fill="currentColor" opacity="0.5"/>
                <circle cx="22" cy="20" r="2" fill="currentColor" opacity="0.5"/>
                <circle cx="16" cy="24" r="2" fill="currentColor" opacity="0.5"/>
                <circle cx="10" cy="20" r="2" fill="currentColor" opacity="0.5"/>
                <circle cx="10" cy="12" r="2" fill="currentColor" opacity="0.5"/>
              </svg>
            </div>
            <span className="nav-v3__logo-text">JINKI</span>
            <span className="nav-v3__logo-badge">INTELLIGENCE</span>
          </a>

          <nav className={`nav-v3__menu ${menuOpen ? 'nav-v3__menu--open' : ''}`}>
            <a href="#platform">Platform</a>
            <a href="#industries">Industries</a>
            <a href="#technology">Technology</a>
            <a href="#team">Team</a>
          </nav>

          <div className="nav-v3__actions">
            <a href="#contact" className="btn-v3 btn-v3--primary">
              <span>Request Demo</span>
              <ArrowRight size={16} />
            </a>
            <button className="nav-v3__toggle" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        className="hero-v3"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        <div className="hero-v3__container">
          <motion.div
            className="hero-v3__content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="hero-v3__badge">
              <span className="hero-v3__badge-dot" />
              Enterprise Drone Intelligence
            </div>

            <h1 className="hero-v3__title">
              <span className="hero-v3__title-line">Autonomous</span>
              <span className="hero-v3__title-line hero-v3__title-line--accent">Inspection</span>
              <span className="hero-v3__title-line">Intelligence</span>
            </h1>

            <p className="hero-v3__description">
              Military-grade thermal imaging and LiDAR inspection for critical infrastructure.
              Powered by the DJI Matrice 400 RTK with 59-minute flight time and ±1cm positioning.
            </p>

            <div className="hero-v3__ctas">
              <a href="#contact" className="btn-v3 btn-v3--primary btn-v3--large">
                <span>Schedule Assessment</span>
                <ArrowRight size={18} />
              </a>
              <a href="#platform" className="btn-v3 btn-v3--secondary btn-v3--large">
                <Play size={18} />
                <span>Watch Demo</span>
              </a>
            </div>
          </motion.div>

          <motion.div
            className="hero-v3__drone"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <DroneHeroSection />
          </motion.div>
        </div>

        <motion.div
          className="hero-v3__scroll"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown size={24} />
          <span>Scroll to explore</span>
        </motion.div>
      </motion.section>

      {/* Industries Section */}
      <section id="industries" className="industries-v3">
        <div className="industries-v3__container">
          <motion.div
            className="industries-v3__header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Industry Solutions</h2>
            <p>Specialized inspection protocols for critical infrastructure sectors</p>
          </motion.div>

          {/* Industry Tabs */}
          <div className="industries-v3__tabs">
            {industries.map((industry) => (
              <button
                key={industry.id}
                className={`industries-v3__tab ${activeIndustry === industry.id ? 'industries-v3__tab--active' : ''}`}
                onClick={() => setActiveIndustry(industry.id)}
              >
                {industry.icon}
                <span>{industry.title}</span>
              </button>
            ))}
          </div>

          {/* Active Industry Content */}
          <AnimatePresence mode="wait">
            {industries.map((industry) => (
              activeIndustry === industry.id && (
                <motion.div
                  key={industry.id}
                  className="industries-v3__content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="industries-v3__info">
                    <h3>{industry.title}</h3>
                    <p>{industry.description}</p>

                    <div className="industries-v3__stats">
                      {industry.stats.map((stat, idx) => (
                        <div key={idx} className="industries-v3__stat">
                          <span className="industries-v3__stat-value">
                            {stat.prefix}<AnimatedCounter value={stat.value} suffix={stat.suffix} />
                          </span>
                          <span className="industries-v3__stat-label">{stat.label}</span>
                        </div>
                      ))}
                    </div>

                    <a href="#contact" className="btn-v3 btn-v3--primary">
                      <span>Learn More</span>
                      <ArrowRight size={16} />
                    </a>
                  </div>

                  <div className="industries-v3__viz">
                    {industry.visualization}
                  </div>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="team-v3">
        <div className="team-v3__container">
          <motion.div
            className="team-v3__header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Leadership</h2>
            <p>Enterprise security expertise meets aerial intelligence</p>
          </motion.div>

          <div className="team-v3__grid">
            {team.map((member, idx) => (
              <JitterCard key={idx} delay={idx * 0.1}>
                <div className="team-v3__member">
                  <div className="team-v3__avatar">
                    <Shield size={32} />
                  </div>
                  <h3>{member.name}</h3>
                  <span className="team-v3__role">{member.role}</span>
                  <p>{member.description}</p>
                  <div className="team-v3__credentials">
                    {member.credentials}
                  </div>
                </div>
              </JitterCard>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-v3">
        <div className="contact-v3__container">
          <JitterCard className="contact-v3__card">
            <div className="contact-v3__content">
              <h2>Ready to Modernize Your Inspections?</h2>
              <p>Schedule a consultation to discuss your infrastructure monitoring needs.</p>

              <div className="contact-v3__buttons">
                <a href="tel:+15551234567" className="btn-v3 btn-v3--primary btn-v3--large">
                  <Phone size={18} />
                  <span>Call Now</span>
                </a>
                <a href="mailto:contact@jinki.io" className="btn-v3 btn-v3--secondary btn-v3--large">
                  <Mail size={18} />
                  <span>Email Us</span>
                </a>
              </div>
            </div>
          </JitterCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-v3">
        <div className="footer-v3__container">
          <div className="footer-v3__brand">
            <span className="footer-v3__logo">JINKI INTELLIGENCE</span>
            <span className="footer-v3__tagline">Autonomous Inspection. Intelligent Analysis.</span>
          </div>
          <div className="footer-v3__copy">
            © 2026 Jinki Intelligence. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
