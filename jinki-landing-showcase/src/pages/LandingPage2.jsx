import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useMotionValue, useInView } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lottie from 'lottie-react'
import {
  ArrowLeft, ArrowRight, Sun, Moon, Play, ArrowUpRight,
  Scan, Thermometer, Map, Shield, Leaf, Cpu, Zap,
  Radio, Target, Layers, Globe, Lock,
  Satellite, Eye, Activity, ExternalLink, Menu, X,
  Award, FileCheck, Brain, ShieldCheck, CheckCircle2,
  ChevronRight, Sparkles
} from 'lucide-react'
import './LandingPage2.css'

gsap.registerPlugin(ScrollTrigger)

// Premium easing curves
const smoothEase = [0.22, 1, 0.36, 1]
const springConfig = { stiffness: 400, damping: 30 }

// Drone Lottie animation data (inline for performance)
const droneAnimationData = {
  "v": "5.7.4",
  "fr": 60,
  "ip": 0,
  "op": 180,
  "w": 400,
  "h": 400,
  "nm": "Drone",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "Propeller 1",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 80 },
        "r": { "a": 1, "k": [{ "t": 0, "s": [0], "e": [360] }, { "t": 30, "s": [360] }] },
        "p": { "a": 0, "k": [120, 150, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 0, "k": [100, 100, 100] }
      },
      "shapes": [{
        "ty": "el",
        "p": { "a": 0, "k": [0, 0] },
        "s": { "a": 0, "k": [60, 60] }
      }, {
        "ty": "st",
        "c": { "a": 0, "k": [0.388, 1, 0.125, 1] },
        "o": { "a": 0, "k": 100 },
        "w": { "a": 0, "k": 3 }
      }]
    },
    {
      "ddd": 0,
      "ind": 2,
      "ty": 4,
      "nm": "Propeller 2",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 80 },
        "r": { "a": 1, "k": [{ "t": 0, "s": [0], "e": [-360] }, { "t": 30, "s": [-360] }] },
        "p": { "a": 0, "k": [280, 150, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 0, "k": [100, 100, 100] }
      },
      "shapes": [{
        "ty": "el",
        "p": { "a": 0, "k": [0, 0] },
        "s": { "a": 0, "k": [60, 60] }
      }, {
        "ty": "st",
        "c": { "a": 0, "k": [0.388, 1, 0.125, 1] },
        "o": { "a": 0, "k": 100 },
        "w": { "a": 0, "k": 3 }
      }]
    },
    {
      "ddd": 0,
      "ind": 3,
      "ty": 4,
      "nm": "Body",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "p": { "a": 1, "k": [
          { "t": 0, "s": [200, 200, 0], "e": [200, 190, 0] },
          { "t": 90, "s": [200, 190, 0], "e": [200, 200, 0] },
          { "t": 180, "s": [200, 200, 0] }
        ]},
        "s": { "a": 0, "k": [100, 100, 100] }
      },
      "shapes": [{
        "ty": "rc",
        "p": { "a": 0, "k": [0, 0] },
        "s": { "a": 0, "k": [120, 40] },
        "r": { "a": 0, "k": 20 }
      }, {
        "ty": "fl",
        "c": { "a": 0, "k": [0.1, 0.1, 0.18, 1] }
      }]
    },
    {
      "ddd": 0,
      "ind": 4,
      "ty": 4,
      "nm": "Camera",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "p": { "a": 1, "k": [
          { "t": 0, "s": [200, 230, 0], "e": [200, 220, 0] },
          { "t": 90, "s": [200, 220, 0], "e": [200, 230, 0] },
          { "t": 180, "s": [200, 230, 0] }
        ]}
      },
      "shapes": [{
        "ty": "el",
        "p": { "a": 0, "k": [0, 0] },
        "s": { "a": 0, "k": [24, 24] }
      }, {
        "ty": "fl",
        "c": { "a": 0, "k": [0.024, 0.714, 0.831, 1] }
      }]
    },
    {
      "ddd": 0,
      "ind": 5,
      "ty": 4,
      "nm": "Scan Beam",
      "sr": 1,
      "ks": {
        "o": { "a": 1, "k": [
          { "t": 0, "s": [0], "e": [40] },
          { "t": 45, "s": [40], "e": [40] },
          { "t": 135, "s": [40], "e": [0] },
          { "t": 180, "s": [0] }
        ]},
        "p": { "a": 0, "k": [200, 280, 0] },
        "s": { "a": 1, "k": [
          { "t": 0, "s": [20, 20, 100], "e": [100, 100, 100] },
          { "t": 90, "s": [100, 100, 100], "e": [20, 20, 100] },
          { "t": 180, "s": [20, 20, 100] }
        ]}
      },
      "shapes": [{
        "ty": "el",
        "p": { "a": 0, "k": [0, 0] },
        "s": { "a": 0, "k": [200, 200] }
      }, {
        "ty": "fl",
        "c": { "a": 0, "k": [0.388, 1, 0.125, 0.3] }
      }]
    }
  ]
}

// SVG Thermal Visualization Component
function ThermalVisualization() {
  const [cells, setCells] = useState([])

  useEffect(() => {
    const generateCells = () => {
      const newCells = []
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 20; x++) {
          const baseHeat = Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.5 + 0.5
          const noise = Math.random() * 0.2
          newCells.push({
            x, y,
            heat: Math.min(1, Math.max(0, baseHeat + noise)),
            isHotspot: baseHeat > 0.7 && Math.random() > 0.8
          })
        }
      }
      setCells(newCells)
    }
    generateCells()
    const interval = setInterval(generateCells, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <svg viewBox="0 0 400 320" className="thermal-svg">
      <defs>
        <linearGradient id="thermalGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="25%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="75%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {cells.map((cell, i) => (
        <rect
          key={i}
          x={cell.x * 20}
          y={cell.y * 20}
          width="19"
          height="19"
          rx="2"
          fill={`hsl(${Math.floor(240 - cell.heat * 200)}, 80%, ${30 + cell.heat * 40}%)`}
          opacity={0.8 + cell.heat * 0.2}
          className="thermal-cell"
          style={{ animationDelay: `${i * 10}ms` }}
        />
      ))}

      {cells.filter(c => c.isHotspot).map((cell, i) => (
        <g key={`hotspot-${i}`} className="hotspot-marker">
          <circle
            cx={cell.x * 20 + 10}
            cy={cell.y * 20 + 10}
            r="15"
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            filter="url(#glow)"
          />
          <circle
            cx={cell.x * 20 + 10}
            cy={cell.y * 20 + 10}
            r="25"
            fill="none"
            stroke="#f97316"
            strokeWidth="1"
            opacity="0.5"
            className="hotspot-pulse"
          />
          <text
            x={cell.x * 20 + 10}
            y={cell.y * 20 - 20}
            fill="#f97316"
            fontSize="10"
            textAnchor="middle"
            fontWeight="bold"
          >
            {Math.floor(60 + cell.heat * 40)}°C
          </text>
        </g>
      ))}

      <line x1="0" y1="0" x2="400" y2="0" stroke="#f97316" strokeWidth="3" className="scan-line" opacity="0.8" />
    </svg>
  )
}

// SVG Topographic Visualization
function TopographyVisualization() {
  const contours = []
  for (let i = 0; i < 20; i++) {
    const y = 50 + i * 12
    const amplitude = 30 - i * 1.2
    const frequency = 0.02 + i * 0.002
    let path = `M 0 ${y}`
    for (let x = 0; x <= 400; x += 10) {
      const noise = Math.sin(x * frequency + i) * amplitude
      const noise2 = Math.cos(x * frequency * 1.5 + i * 0.5) * amplitude * 0.5
      path += ` L ${x} ${y + noise + noise2}`
    }
    contours.push({ path, elevation: 200 + i * 50, opacity: 0.3 + (i / 20) * 0.7 })
  }

  return (
    <svg viewBox="0 0 400 300" className="topo-svg">
      <defs>
        <linearGradient id="topoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="topoGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {contours.map((contour, i) => (
        <path
          key={i}
          d={contour.path}
          fill="none"
          stroke="url(#topoGrad)"
          strokeWidth={1.5 - i * 0.05}
          opacity={contour.opacity}
          className="topo-line"
          style={{ animationDelay: `${i * 100}ms` }}
          filter="url(#topoGlow)"
        />
      ))}

      {[80, 160, 240, 320].map((x, i) => (
        <g key={i} className="elevation-marker">
          <circle cx={x} cy={120 + Math.sin(i) * 30} r="6" fill="#06b6d4" />
          <text x={x} y={145 + Math.sin(i) * 30} fill="#06b6d4" fontSize="10" textAnchor="middle" fontWeight="600">
            {450 + i * 75}m
          </text>
        </g>
      ))}

      <g className="drone-flight">
        <circle r="8" fill="#9DFF20" filter="url(#topoGlow)">
          <animateMotion dur="6s" repeatCount="indefinite" path="M-20,60 Q100,30 200,70 T420,50" />
        </circle>
        <circle r="20" fill="none" stroke="#9DFF20" strokeWidth="1" opacity="0.4">
          <animateMotion dur="6s" repeatCount="indefinite" path="M-20,60 Q100,30 200,70 T420,50" />
          <animate attributeName="r" values="20;35;20" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  )
}

// SVG Cyber Security Visualization
function CyberVisualization() {
  const nodes = []
  const connections = []

  for (let i = 0; i < 25; i++) {
    const angle = (i / 25) * Math.PI * 2
    const radius = 80 + (i % 3) * 40
    nodes.push({
      x: 200 + Math.cos(angle) * radius,
      y: 150 + Math.sin(angle) * radius,
      size: 4 + Math.random() * 4,
      delay: i * 100
    })
  }

  for (let i = 0; i < nodes.length; i++) {
    const targets = [
      (i + 1) % nodes.length,
      (i + 5) % nodes.length,
      (i + 8) % nodes.length
    ]
    targets.forEach(t => {
      if (Math.random() > 0.5) {
        connections.push({ from: i, to: t })
      }
    })
  }

  return (
    <svg viewBox="0 0 400 300" className="cyber-svg">
      <defs>
        <radialGradient id="shieldGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
        <filter id="cyberGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Shield rings */}
      {[60, 90, 120].map((r, i) => (
        <circle
          key={i}
          cx="200"
          cy="150"
          r={r}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="1"
          opacity={0.3 - i * 0.08}
          className="shield-ring"
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}

      {/* Connections */}
      {connections.map((conn, i) => (
        <line
          key={i}
          x1={nodes[conn.from].x}
          y1={nodes[conn.from].y}
          x2={nodes[conn.to].x}
          y2={nodes[conn.to].y}
          stroke="#8b5cf6"
          strokeWidth="1"
          opacity="0.3"
          className="cyber-connection"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}

      {/* Nodes */}
      {nodes.map((node, i) => (
        <g key={i} className="cyber-node" style={{ animationDelay: `${node.delay}ms` }}>
          <circle
            cx={node.x}
            cy={node.y}
            r={node.size}
            fill="#8b5cf6"
            filter="url(#cyberGlow)"
          />
          <circle
            cx={node.x}
            cy={node.y}
            r={node.size + 8}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="1"
            opacity="0.3"
            className="node-pulse"
          />
        </g>
      ))}

      {/* Central shield icon */}
      <g className="central-shield" filter="url(#cyberGlow)">
        <circle cx="200" cy="150" r="30" fill="url(#shieldGrad)" />
        <path
          d="M200 125 L220 140 L220 160 L200 175 L180 160 L180 140 Z"
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2"
        />
        <path
          d="M200 140 L208 148 L192 148 Z"
          fill="#8b5cf6"
        />
      </g>

      {/* Data packets */}
      {[0, 1, 2].map(i => (
        <circle key={i} r="3" fill="#9DFF20" className="data-packet">
          <animateMotion
            dur={`${2 + i * 0.5}s`}
            repeatCount="indefinite"
            path={`M${nodes[i * 5].x},${nodes[i * 5].y} L200,150 L${nodes[(i * 5 + 10) % 25].x},${nodes[(i * 5 + 10) % 25].y}`}
          />
        </circle>
      ))}
    </svg>
  )
}

// SVG Agriculture Visualization
function AgricultureVisualization() {
  const cells = []
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 16; x++) {
      const health = 0.3 + Math.sin(x * 0.5) * Math.cos(y * 0.4) * 0.3 + Math.random() * 0.4
      cells.push({ x, y, health: Math.min(1, Math.max(0, health)) })
    }
  }

  return (
    <svg viewBox="0 0 400 300" className="agri-svg">
      <defs>
        <linearGradient id="ndviGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>

      {cells.map((cell, i) => (
        <rect
          key={i}
          x={cell.x * 25}
          y={cell.y * 22}
          width="23"
          height="20"
          rx="3"
          fill={`hsl(${cell.health * 120}, 70%, ${25 + cell.health * 25}%)`}
          className="agri-cell"
          style={{ animationDelay: `${i * 15}ms` }}
        />
      ))}

      {/* Legend */}
      <rect x="120" y="275" width="160" height="12" rx="6" fill="url(#ndviGrad)" />
      <text x="100" y="285" fill="currentColor" fontSize="9" opacity="0.6">Low</text>
      <text x="290" y="285" fill="currentColor" fontSize="9" opacity="0.6">High</text>
      <text x="200" y="270" fill="currentColor" fontSize="10" textAnchor="middle" fontWeight="600">NDVI Index</text>

      {/* Stats overlay */}
      <g className="agri-stats">
        <rect x="10" y="10" width="90" height="50" rx="8" fill="rgba(0,0,0,0.5)" />
        <text x="20" y="30" fill="#10b981" fontSize="11" fontWeight="600">Health: 87%</text>
        <text x="20" y="48" fill="#10b981" fontSize="11" fontWeight="600">Growth: +12%</text>
      </g>

      {/* Drone path */}
      <path
        d="M0 130 Q100 80 200 130 T400 110"
        fill="none"
        stroke="#9DFF20"
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.5"
      />
      <circle r="6" fill="#9DFF20">
        <animateMotion dur="8s" repeatCount="indefinite" path="M0 130 Q100 80 200 130 T400 110" />
      </circle>
    </svg>
  )
}

// Magnetic Button Component
function MagneticButton({ children, className, onClick, href }) {
  const buttonRef = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.2)
    y.set((e.clientY - centerY) * 0.2)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const Component = href ? motion.a : motion.button

  return (
    <Component
      ref={buttonRef}
      href={href}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", ...springConfig }}
    >
      {children}
    </Component>
  )
}

function LandingPage2() {
  const [isDark, setIsDark] = useState(true)
  const [activeService, setActiveService] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const containerRef = useRef(null)
  const heroRef = useRef(null)

  // Handle scroll for navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-rotate services
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveService(prev => (prev + 1) % 4)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.stat-number', {
        textContent: 0,
        duration: 2,
        ease: 'power2.out',
        snap: { textContent: 1 },
        scrollTrigger: {
          trigger: '.stats-bar',
          start: 'top 85%',
        }
      })

      gsap.fromTo('.bento-card',
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.bento-grid',
            start: 'top 80%'
          }
        }
      )

      gsap.fromTo('.credential-card',
        { x: -60, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'back.out(1.5)',
          scrollTrigger: {
            trigger: '.credentials-grid',
            start: 'top 80%'
          }
        }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const { scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  const services = [
    {
      id: 'aerial',
      title: 'Aerial Surveying',
      subtitle: 'Topographic Mapping & 3D Modeling',
      description: 'Precision drone surveying with RTK GPS accuracy. Generate high-resolution orthomosaics, digital elevation models, and volumetric analysis.',
      icon: <Map size={24} />,
      color: '#06b6d4',
      stats: { accuracy: '±2cm', coverage: '500ha/day', output: 'DSM/DTM' },
      Visual: TopographyVisualization
    },
    {
      id: 'thermal',
      title: 'Thermal Inspection',
      subtitle: 'Predictive Infrastructure Analytics',
      description: 'AI-powered thermal imaging for solar farms, substations, and industrial facilities. Detect anomalies before failures occur.',
      icon: <Thermometer size={24} />,
      color: '#f97316',
      stats: { sensitivity: '±0.03°C', detection: '99.8%', speed: 'Real-time' },
      Visual: ThermalVisualization
    },
    {
      id: 'cyber',
      title: 'Cyber & AI Advisory',
      subtitle: 'Strategic Security Consulting',
      description: 'Enterprise security strategy and AI governance. CISSP, CCSP, AIGP, and PMP certified expertise for your digital transformation.',
      icon: <ShieldCheck size={24} />,
      color: '#8b5cf6',
      stats: { frameworks: 'NIST/ISO', focus: 'AI Gov', certs: '4 Major' },
      Visual: CyberVisualization
    },
    {
      id: 'agri',
      title: 'AgriTech Intelligence',
      subtitle: 'Precision Agriculture Analytics',
      description: 'NDVI analysis, crop health monitoring, and yield prediction. Transform farming with data-driven aerial intelligence.',
      icon: <Leaf size={24} />,
      color: '#10b981',
      stats: { yield: '+34%', water: '-40%', roi: '300%' },
      Visual: AgricultureVisualization
    }
  ]

  const credentials = [
    { cert: 'CISSP', name: 'Certified Information Systems Security Professional', icon: <Shield size={20} /> },
    { cert: 'CCSP', name: 'Certified Cloud Security Professional', icon: <Globe size={20} /> },
    { cert: 'AIGP', name: 'AI Governance Professional', icon: <Brain size={20} /> },
    { cert: 'PMP', name: 'Project Management Professional', icon: <FileCheck size={20} /> }
  ]

  const techCapabilities = [
    { icon: <Cpu />, label: 'Edge AI', stat: '<50ms' },
    { icon: <Eye />, label: 'Vision AI', stat: 'YOLOv12' },
    { icon: <Radio />, label: 'Multi-Spectral', stat: '5-band' },
    { icon: <Target />, label: 'RTK GPS', stat: '±2cm' },
    { icon: <Layers />, label: '3D Models', stat: '10M pts' },
    { icon: <Lock />, label: 'Zero Trust', stat: 'AES-256' }
  ]

  const ActiveVisual = services[activeService].Visual

  return (
    <div ref={containerRef} className={`lp2 ${isDark ? 'dark' : 'light'}`}>
      {/* Progress Bar */}
      <motion.div className="scroll-progress" style={{ scaleX: smoothProgress }} />

      {/* Premium Navigation */}
      <motion.nav
        className={`nav ${scrolled ? 'scrolled' : ''} ${mobileMenuOpen ? 'menu-open' : ''}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: smoothEase }}
      >
        <Link to="/" className="nav-back">
          <ArrowLeft size={16} />
          <span>Back</span>
        </Link>

        <div className="nav-brand">
          <div className="logo-mark">
            <Satellite size={18} />
          </div>
          <div className="logo-text">
            <span className="logo-name">JINKI</span>
            <span className="logo-tag">INTELLIGENCE</span>
          </div>
        </div>

        <div className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <a href="#services" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
            <span>Services</span>
            <ChevronRight size={14} className="link-arrow" />
          </a>
          <a href="#advisory" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
            <span>Advisory</span>
            <ChevronRight size={14} className="link-arrow" />
          </a>
          <a href="#technology" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
            <span>Technology</span>
            <ChevronRight size={14} className="link-arrow" />
          </a>
        </div>

        <div className="nav-actions">
          <motion.button
            className="theme-toggle"
            onClick={() => setIsDark(!isDark)}
            whileTap={{ scale: 0.9, rotate: 180 }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </motion.button>

          <MagneticButton className="nav-cta desktop-only">
            <Sparkles size={14} />
            <span>Get Started</span>
          </MagneticButton>

          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="lp2-hero">
        <div className="hero-bg">
          {/* Drone Video Background */}
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            poster="https://images.pexels.com/videos/3015510/free-video-3015510.jpg?auto=compress&cs=tinysrgb&w=1920"
          >
            <source src="https://videos.pexels.com/video-files/3015510/3015510-uhd_2560_1440_24fps.mp4" type="video/mp4" />
          </video>
          <div className="video-overlay" />
          <div className="hero-grid-pattern" />
        </div>

        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="badge-dot" />
            <span>Autonomous Intelligence</span>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="title-line">Precision</span>
            <span className="title-line gradient-text">From Above</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Drone surveying, thermal imaging, and strategic cyber advisory
            for enterprises that demand excellence.
          </motion.p>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <MagneticButton className="btn-primary">
              <span>Start Your Mission</span>
              <ArrowRight size={16} />
            </MagneticButton>
            <MagneticButton className="btn-secondary">
              <Play size={16} />
              <span>Watch Demo</span>
            </MagneticButton>
          </motion.div>
        </div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="drone-container">
            <Lottie
              animationData={droneAnimationData}
              loop={true}
              className="drone-lottie"
            />
          </div>
          <div className="visual-rings">
            <div className="ring ring-1" />
            <div className="ring ring-2" />
            <div className="ring ring-3" />
          </div>
        </motion.div>

        <motion.div
          className="hero-metrics"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          {[
            { icon: <Scan size={18} />, value: '2.4M+', label: 'Acres Surveyed' },
            { icon: <Zap size={18} />, value: '<50ms', label: 'AI Latency' },
            { icon: <Shield size={18} />, value: 'Zero', label: 'Breaches' }
          ].map((metric, i) => (
            <div key={i} className="metric-card">
              {metric.icon}
              <span className="metric-value">{metric.value}</span>
              <span className="metric-label">{metric.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            {[
              { num: '99.8', unit: '%', label: 'Detection Accuracy' },
              { num: '150', unit: '+', label: 'Enterprise Clients' },
              { num: '500', unit: 'ha/day', label: 'Survey Capacity' },
              { num: '24', unit: '/7', label: 'Operations' }
            ].map((stat, i) => (
              <div key={i} className="stat-item">
                <span className="stat-number">{stat.num}</span>
                <span className="stat-unit">{stat.unit}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Our Services</span>
            <h2 className="section-title">
              Four Pillars of <span className="gradient-text">Intelligence</span>
            </h2>
          </div>

          <div className="services-grid">
            <div className="services-tabs">
              {services.map((service, i) => (
                <motion.button
                  key={service.id}
                  className={`service-tab ${activeService === i ? 'active' : ''}`}
                  onClick={() => setActiveService(i)}
                  whileHover={{ x: 8 }}
                  style={{ '--accent': service.color }}
                >
                  <span className="tab-indicator" />
                  <span className="tab-icon">{service.icon}</span>
                  <div className="tab-text">
                    <span className="tab-title">{service.title}</span>
                    <span className="tab-subtitle">{service.subtitle}</span>
                  </div>
                  <ArrowRight size={16} className="tab-arrow" />
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeService}
                className="service-display"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4, ease: smoothEase }}
                style={{ '--accent': services[activeService].color }}
              >
                <div className="display-visual">
                  <ActiveVisual />
                </div>
                <div className="display-content">
                  <span className="display-icon">{services[activeService].icon}</span>
                  <h3>{services[activeService].title}</h3>
                  <p>{services[activeService].description}</p>
                  <div className="display-stats">
                    {Object.entries(services[activeService].stats).map(([key, val]) => (
                      <div key={key} className="stat-pill">
                        <span className="pill-value">{val}</span>
                        <span className="pill-label">{key}</span>
                      </div>
                    ))}
                  </div>
                  <MagneticButton className="display-cta">
                    <span>Learn More</span>
                    <ExternalLink size={14} />
                  </MagneticButton>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Credentials Section */}
      <section id="advisory" className="credentials-section">
        <div className="container">
          <div className="section-header center">
            <span className="section-tag">Advisory Credentials</span>
            <h2 className="section-title">
              Certified <span className="gradient-text">Expertise</span>
            </h2>
            <p className="section-desc">
              Strategic security consulting backed by industry-leading certifications
            </p>
          </div>

          <div className="credentials-grid">
            {credentials.map((cred) => (
              <div key={cred.cert} className="credential-card">
                <span className="cred-icon">{cred.icon}</span>
                <span className="cred-cert">{cred.cert}</span>
                <span className="cred-name">{cred.name}</span>
                <CheckCircle2 size={18} className="cred-check" />
              </div>
            ))}
          </div>

          <div className="advisory-cards">
            {[
              {
                icon: <Brain size={28} />,
                title: 'AI Governance & Risk',
                desc: 'Navigate AI implementation with confidence. Ethical frameworks, regulatory compliance, and responsible deployment.',
                items: ['AI Ethics Assessment', 'Model Risk Management', 'EU AI Act Compliance', 'AI Security Architecture']
              },
              {
                icon: <ShieldCheck size={28} />,
                title: 'Enterprise Security',
                desc: 'Comprehensive security strategy aligned with business objectives. Zero-trust, cloud security, and incident response.',
                items: ['Security Architecture', 'Cloud Security (AWS/Azure/GCP)', 'Penetration Testing', 'SOC2, ISO 27001']
              }
            ].map((card, i) => (
              <div key={i} className="advisory-card">
                <div className="card-header">
                  {card.icon}
                  <h3>{card.title}</h3>
                </div>
                <p>{card.desc}</p>
                <ul className="card-list">
                  {card.items.map((item, j) => (
                    <li key={j}>
                      <CheckCircle2 size={14} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="tech-section">
        <div className="container">
          <div className="section-header center">
            <span className="section-tag">Technology</span>
            <h2 className="section-title">
              Built on <span className="gradient-text">Innovation</span>
            </h2>
          </div>

          <div className="bento-grid">
            <div className="bento-card bento-large">
              <div className="bento-visual">
                <div className="ai-orb">
                  <div className="orb-core" />
                  <div className="orb-ring" />
                  <div className="orb-ring delay-1" />
                  <div className="orb-ring delay-2" />
                </div>
              </div>
              <h3>Real-Time AI Processing</h3>
              <p>Edge computing with on-device inference. Sub-50ms latency for mission-critical operations.</p>
              <div className="bento-tags">
                <span>Edge AI</span>
                <span>Computer Vision</span>
                <span>MLOps</span>
              </div>
            </div>

            {techCapabilities.map((cap, i) => (
              <div key={i} className="bento-card">
                <span className="bento-icon">{cap.icon}</span>
                <h4>{cap.label}</h4>
                <span className="bento-stat">{cap.stat}</span>
              </div>
            ))}

            <div className="bento-card bento-wide">
              <div className="data-visual">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="data-bar" style={{ '--i': i, '--h': 20 + Math.random() * 60 }} />
                ))}
              </div>
              <div className="bento-info">
                <h3>Multi-Modal Data Fusion</h3>
                <p>RGB, thermal, multispectral, and LiDAR unified in real-time.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2>Ready to elevate your operations?</h2>
              <p>Schedule a consultation or demo flight with our team.</p>
              <div className="cta-buttons">
                <MagneticButton className="btn-primary">
                  <span>Schedule Demo</span>
                  <ArrowRight size={16} />
                </MagneticButton>
                <MagneticButton className="btn-outline">
                  <span>Contact Advisory</span>
                </MagneticButton>
              </div>
            </div>
            <div className="cta-visual">
              <div className="cta-orbs">
                <div className="cta-orb orb-a" />
                <div className="cta-orb orb-b" />
                <div className="cta-orb orb-c" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp2-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="nav-brand">
                <div className="logo-mark"><Satellite size={18} /></div>
                <div className="logo-text">
                  <span className="logo-name">JINKI</span>
                </div>
              </div>
              <p>Intelligent aerial solutions and strategic advisory for enterprises that demand excellence.</p>
              <div className="footer-certs">
                {credentials.map(c => (
                  <span key={c.cert} className="cert-badge">{c.cert}</span>
                ))}
              </div>
            </div>
            {[
              { title: 'Solutions', links: ['Aerial Surveying', 'Thermal Inspection', 'Cyber Advisory', 'AgriTech'] },
              { title: 'Advisory', links: ['AI Governance', 'Security Strategy', 'Compliance', 'Risk Assessment'] },
              { title: 'Company', links: ['About', 'Careers', 'Blog', 'Contact'] }
            ].map((col, i) => (
              <div key={i} className="footer-col">
                <h4>{col.title}</h4>
                {col.links.map(link => (
                  <a key={link} href="#">{link}</a>
                ))}
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <span>© 2026 Jinki Intelligence. All rights reserved.</span>
            <div className="footer-legal">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage2
