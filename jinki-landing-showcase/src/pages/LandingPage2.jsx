import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, Suspense, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Environment, MeshDistortMaterial, Sphere, MeshTransmissionMaterial, useTexture } from '@react-three/drei'
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useMotionValue } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import {
  ArrowLeft, ArrowRight, Sun, Moon, Play, ArrowUpRight,
  Scan, Thermometer, Map, Shield, Leaf, Cpu, Zap,
  Radio, Target, Layers, BarChart3, Globe, Lock,
  Satellite, Eye, Activity, ChevronDown, ExternalLink,
  Award, FileCheck, Brain, ShieldCheck, CheckCircle2
} from 'lucide-react'
import './LandingPage2.css'

gsap.registerPlugin(ScrollTrigger)

// Custom spring easing for premium feel
const springTransition = {
  type: "spring",
  stiffness: 100,
  damping: 15,
  mass: 1
}

const smoothEase = [0.22, 1, 0.36, 1]

// Liquid Glass 3D Sphere with reflections
function LiquidGlassSphere({ position = [0, 0, 0], scale = 1, color = "#06b6d4" }) {
  const meshRef = useRef()
  const materialRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.15
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.3
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshTransmissionMaterial
          ref={materialRef}
          backside
          samples={16}
          thickness={0.5}
          chromaticAberration={0.2}
          anisotropy={0.3}
          distortion={0.5}
          distortionScale={0.5}
          temporalDistortion={0.1}
          iridescence={1}
          iridescenceIOR={1}
          iridescenceThicknessRange={[0, 1400]}
          color={color}
          roughness={0.1}
          transmission={0.95}
        />
      </mesh>
    </Float>
  )
}

// Animated drone with reflective materials
function ReflectiveDrone({ mouse }) {
  const groupRef = useRef()
  const bodyRef = useRef()
  const propellerRefs = [useRef(), useRef(), useRef(), useRef()]

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (groupRef.current) {
      // Smooth mouse follow with spring physics
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, mouse.y * 0.15, 0.05)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mouse.x * 0.15, 0.05)
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.2
    }

    if (bodyRef.current) {
      bodyRef.current.rotation.y = t * 0.1
    }

    // Spin propellers
    propellerRefs.forEach((ref, i) => {
      if (ref.current) {
        ref.current.rotation.y = t * 15 * (i % 2 === 0 ? 1 : -1)
      }
    })
  })

  const armPositions = [
    [1.2, 0, 1.2],
    [-1.2, 0, 1.2],
    [1.2, 0, -1.2],
    [-1.2, 0, -1.2]
  ]

  return (
    <group ref={groupRef}>
      {/* Main Body - Sleek design */}
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
        <mesh ref={bodyRef}>
          <capsuleGeometry args={[0.3, 0.8, 8, 16]} />
          <meshStandardMaterial
            color="#1a1a2e"
            metalness={0.95}
            roughness={0.05}
            envMapIntensity={2}
          />
        </mesh>

        {/* Camera/Sensor pod */}
        <mesh position={[0, -0.35, 0.3]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#06b6d4"
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* LED Ring */}
        <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.35, 0.02, 8, 32]} />
          <meshStandardMaterial
            color="#9DFF20"
            emissive="#9DFF20"
            emissiveIntensity={2}
          />
        </mesh>
      </Float>

      {/* Arms and Propellers */}
      {armPositions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Arm */}
          <mesh rotation={[0, Math.atan2(pos[2], pos[0]), 0]}>
            <boxGeometry args={[1.5, 0.05, 0.08]} />
            <meshStandardMaterial color="#2a2a4e" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Motor housing */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.12, 0.15, 0.15, 16]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* Propeller */}
          <group ref={propellerRefs[i]} position={[0, 0.2, 0]}>
            <mesh rotation={[0, 0, 0]}>
              <boxGeometry args={[0.8, 0.01, 0.08]} />
              <meshStandardMaterial
                color="#06b6d4"
                transparent
                opacity={0.7}
                emissive="#06b6d4"
                emissiveIntensity={0.3}
              />
            </mesh>
          </group>
        </group>
      ))}

      {/* Data visualization rings */}
      {[1.8, 2.2, 2.6].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.1, 0, 0]}>
          <torusGeometry args={[radius, 0.008, 8, 64]} />
          <meshStandardMaterial
            color={i === 0 ? "#06b6d4" : i === 1 ? "#8b5cf6" : "#9DFF20"}
            emissive={i === 0 ? "#06b6d4" : i === 1 ? "#8b5cf6" : "#9DFF20"}
            emissiveIntensity={0.8}
            transparent
            opacity={0.6 - i * 0.15}
          />
        </mesh>
      ))}

      {/* Scanning beam effect */}
      <mesh position={[0, -1, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[1.5, 2, 32, 1, true]} />
        <meshStandardMaterial
          color="#06b6d4"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          emissive="#06b6d4"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  )
}

// Interactive terrain with topography
function TopographicTerrain() {
  const meshRef = useRef()
  const geometryRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = -Math.PI / 3
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.05
    }

    // Animate vertices for wave effect
    if (geometryRef.current) {
      const positions = geometryRef.current.attributes.position
      const time = state.clock.elapsedTime

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        const z = Math.sin(x * 0.5 + time * 0.5) * 0.3 +
                  Math.cos(y * 0.5 + time * 0.3) * 0.3
        positions.setZ(i, z)
      }
      positions.needsUpdate = true
    }
  })

  return (
    <mesh ref={meshRef} position={[0, -1, 0]}>
      <planeGeometry ref={geometryRef} args={[8, 8, 32, 32]} />
      <meshStandardMaterial
        color="#06b6d4"
        wireframe
        transparent
        opacity={0.4}
        emissive="#06b6d4"
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}

// Main 3D Scene
function HeroScene({ mouse }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#06b6d4" />
      <pointLight position={[-10, -10, -5]} intensity={1} color="#8b5cf6" />
      <pointLight position={[0, 5, -10]} intensity={1.5} color="#9DFF20" />
      <spotLight
        position={[0, 10, 0]}
        intensity={1}
        color="#ffffff"
        angle={0.5}
        penumbra={0.5}
      />

      <ReflectiveDrone mouse={mouse} />
      <TopographicTerrain />

      {/* Floating data spheres */}
      {[...Array(6)].map((_, i) => (
        <Float key={i} speed={1 + i * 0.2} floatIntensity={0.5}>
          <mesh position={[
            Math.cos(i * Math.PI / 3) * 4,
            Math.sin(i * Math.PI / 3) * 2,
            Math.sin(i * Math.PI / 3) * 4
          ]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? "#06b6d4" : i % 3 === 1 ? "#8b5cf6" : "#9DFF20"}
              emissive={i % 3 === 0 ? "#06b6d4" : i % 3 === 1 ? "#8b5cf6" : "#9DFF20"}
              emissiveIntensity={2}
            />
          </mesh>
        </Float>
      ))}

      <Environment preset="night" />
    </>
  )
}

// Liquid Glass CTA Scene
function CTAScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={2} color="#9DFF20" />
      <pointLight position={[-5, -5, 5]} intensity={1} color="#06b6d4" />

      <LiquidGlassSphere position={[0, 0, 0]} scale={2} color="#9DFF20" />
      <LiquidGlassSphere position={[2.5, 1, -1]} scale={0.8} color="#06b6d4" />
      <LiquidGlassSphere position={[-2, -0.5, -1]} scale={0.6} color="#8b5cf6" />

      <Environment preset="city" />
    </>
  )
}

// Magnetic button component
function MagneticButton({ children, className, onClick }) {
  const buttonRef = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.15)
    y.set((e.clientY - centerY) * 0.15)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={buttonRef}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={springTransition}
    >
      {children}
    </motion.button>
  )
}

function LandingPage2() {
  const [isDark, setIsDark] = useState(true)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [activeService, setActiveService] = useState(0)
  const [cursorVariant, setCursorVariant] = useState('default')
  const containerRef = useRef(null)
  const heroRef = useRef(null)
  const videoRef = useRef(null)

  // Smooth mouse tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Auto-rotate services
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveService(prev => (prev + 1) % 4)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  // GSAP animations with smooth easing
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax hero elements
      gsap.to('.hero-3d-container', {
        y: 300,
        ease: 'none',
        scrollTrigger: {
          trigger: '.lp2-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5
        }
      })

      // Video parallax
      gsap.to('.hero-video', {
        scale: 1.2,
        ease: 'none',
        scrollTrigger: {
          trigger: '.lp2-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 2
        }
      })

      // Stats counter with spring
      gsap.from('.stat-number', {
        textContent: 0,
        duration: 2.5,
        ease: 'expo.out',
        snap: { textContent: 1 },
        scrollTrigger: {
          trigger: '.stats-bar',
          start: 'top 85%',
        }
      })

      // Bento cards with stagger
      gsap.fromTo('.bento-card',
        { y: 100, opacity: 0, rotateX: -15 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 1,
          stagger: 0.12,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: '.bento-grid',
            start: 'top 80%'
          }
        }
      )

      // Credential cards fly in
      gsap.fromTo('.credential-card',
        { x: -100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: '.credentials-section',
            start: 'top 75%'
          }
        }
      )

      // Topography lines drawing
      gsap.fromTo('.topo-path',
        { strokeDashoffset: 1000 },
        {
          strokeDashoffset: 0,
          duration: 3,
          stagger: 0.2,
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: '.topo-visual',
            start: 'top 80%'
          }
        }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const { scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 50, damping: 20 })

  const services = [
    {
      id: 'aerial',
      title: 'Aerial Surveying',
      subtitle: 'Topographic Mapping & 3D Modeling',
      description: 'Precision drone surveying with RTK GPS accuracy. Generate high-resolution orthomosaics, digital elevation models, and volumetric analysis for construction, mining, and land development.',
      icon: <Map size={28} />,
      color: '#06b6d4',
      stats: { accuracy: '±2cm RTK', coverage: '500ha/day', output: 'DSM/DTM/Ortho' },
      visual: 'topography'
    },
    {
      id: 'thermal',
      title: 'Thermal Inspection',
      subtitle: 'Predictive Infrastructure Analytics',
      description: 'AI-powered thermal imaging for solar farms, substations, data centers, and industrial facilities. Detect anomalies before failures occur with radiometric precision.',
      icon: <Thermometer size={28} />,
      color: '#f97316',
      stats: { sensitivity: '±0.03°C', detection: '99.8%', reporting: 'Real-time' },
      visual: 'thermal'
    },
    {
      id: 'cyber',
      title: 'Cyber & AI Advisory',
      subtitle: 'Strategic Security Consulting',
      description: 'Enterprise security strategy, risk assessment, and AI governance. Leveraging CISSP, CCSP, AIGP, and PMP expertise to protect your digital assets and AI implementations.',
      icon: <ShieldCheck size={28} />,
      color: '#8b5cf6',
      stats: { frameworks: 'NIST/ISO', focus: 'AI Governance', approach: 'Risk-Based' },
      visual: 'cyber'
    },
    {
      id: 'agri',
      title: 'AgriTech Intelligence',
      subtitle: 'Precision Agriculture Analytics',
      description: 'NDVI analysis, crop health monitoring, irrigation optimization, and yield prediction. Transform farming operations with actionable aerial intelligence.',
      icon: <Leaf size={28} />,
      color: '#10b981',
      stats: { yield: '+34%', water: '-40%', coverage: '1000ha+' },
      visual: 'agriculture'
    }
  ]

  const credentials = [
    { cert: 'CISSP', name: 'Certified Information Systems Security Professional', icon: <Shield size={24} /> },
    { cert: 'CCSP', name: 'Certified Cloud Security Professional', icon: <Globe size={24} /> },
    { cert: 'AIGP', name: 'AI Governance Professional', icon: <Brain size={24} /> },
    { cert: 'PMP', name: 'Project Management Professional', icon: <FileCheck size={24} /> }
  ]

  const techCapabilities = [
    { icon: <Cpu />, label: 'Edge AI', desc: 'On-device inference', stat: '<50ms' },
    { icon: <Eye />, label: 'Computer Vision', desc: 'Object detection', stat: 'YOLOv12' },
    { icon: <Radio />, label: 'Multi-Spectral', desc: 'RGB + Thermal + NIR', stat: '5-band' },
    { icon: <Target />, label: 'RTK GPS', desc: 'Survey-grade', stat: '±2cm' },
    { icon: <Layers />, label: '3D Modeling', desc: 'Point clouds & mesh', stat: '10M pts' },
    { icon: <Lock />, label: 'Zero Trust', desc: 'End-to-end encrypted', stat: 'AES-256' }
  ]

  return (
    <div ref={containerRef} className={`lp2 ${isDark ? 'dark' : 'light'}`}>
      {/* SVG Filters for Liquid Glass Effect */}
      <svg className="svg-filters">
        <defs>
          <filter id="liquid-glass">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Scroll Progress */}
      <motion.div className="scroll-progress" style={{ scaleX: smoothProgress }} />

      {/* Navigation */}
      <motion.nav
        className="nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: smoothEase }}
      >
        <Link to="/" className="nav-back">
          <ArrowLeft size={18} />
          <span>Directory</span>
        </Link>

        <div className="nav-logo">
          <div className="logo-icon">
            <Satellite size={20} />
          </div>
          <span className="logo-text">JINKI</span>
          <span className="logo-tagline">INTELLIGENCE</span>
        </div>

        <div className="nav-links">
          <a href="#services" className="nav-link">Services</a>
          <a href="#technology" className="nav-link">Technology</a>
          <a href="#advisory" className="nav-link">Advisory</a>
        </div>

        <div className="nav-actions">
          <motion.button
            className="theme-toggle"
            onClick={() => setIsDark(!isDark)}
            whileTap={{ scale: 0.9, rotate: 180 }}
            transition={springTransition}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </motion.button>
          <MagneticButton className="nav-cta">
            <span>Get Started</span>
            <ArrowUpRight size={16} />
          </MagneticButton>
        </div>
      </motion.nav>

      {/* Hero Section with Video Background */}
      <section ref={heroRef} className="lp2-hero">
        {/* Video Background */}
        <div className="hero-video-container">
          <video
            ref={videoRef}
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            poster="https://images.pexels.com/videos/3129671/free-video-3129671.jpg"
          >
            <source src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4" type="video/mp4" />
          </video>
          <div className="hero-video-overlay" />
          <div className="hero-gradient-overlay" />
        </div>

        {/* Animated Grid Background */}
        <div className="hero-grid">
          {[...Array(100)].map((_, i) => (
            <div key={i} className="grid-cell" style={{ animationDelay: `${i * 0.02}s` }} />
          ))}
        </div>

        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, ...springTransition }}
          >
            <div className="badge-pulse" />
            <Activity size={14} />
            <span>Autonomous Intelligence Systems</span>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: smoothEase }}
          >
            <span className="title-line">Precision</span>
            <span className="title-line title-accent">From Above</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8, ease: smoothEase }}
          >
            Drone surveying, thermal imaging, and strategic cyber advisory
            for enterprises that demand excellence.
          </motion.p>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <MagneticButton className="btn-primary btn-glow">
              <span>Start Your Mission</span>
              <ArrowRight size={18} />
            </MagneticButton>
            <MagneticButton className="btn-glass">
              <Play size={18} />
              <span>Watch Demo</span>
            </MagneticButton>
          </motion.div>

          <motion.div
            className="hero-scroll"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <span>Explore</span>
            <div className="scroll-line">
              <div className="scroll-dot" />
            </div>
          </motion.div>
        </div>

        {/* 3D Canvas */}
        <div className="hero-3d-container">
          <Canvas camera={{ position: [0, 2, 10], fov: 50 }} dpr={[1, 2]}>
            <Suspense fallback={null}>
              <HeroScene mouse={mousePosition} />
            </Suspense>
          </Canvas>
        </div>

        {/* Floating metric cards */}
        <motion.div
          className="hero-metrics"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <div className="metric-card liquid-glass">
            <Scan size={20} />
            <div className="metric-info">
              <span className="metric-value">2.4M+</span>
              <span className="metric-label">Acres Surveyed</span>
            </div>
          </div>
          <div className="metric-card liquid-glass">
            <Zap size={20} />
            <div className="metric-info">
              <span className="metric-value">&lt;50ms</span>
              <span className="metric-label">AI Latency</span>
            </div>
          </div>
          <div className="metric-card liquid-glass">
            <Shield size={20} />
            <div className="metric-info">
              <span className="metric-value">Zero</span>
              <span className="metric-label">Breaches</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">99.8</span>
              <span className="stat-unit">%</span>
              <span className="stat-desc">Detection Accuracy</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">150</span>
              <span className="stat-unit">+</span>
              <span className="stat-desc">Enterprise Clients</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">500</span>
              <span className="stat-unit">ha/day</span>
              <span className="stat-desc">Survey Capacity</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">24</span>
              <span className="stat-unit">/7</span>
              <span className="stat-desc">Operations Center</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <div className="container">
          <div className="section-header">
            <motion.span
              className="section-tag"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              What We Deliver
            </motion.span>
            <motion.h2
              className="section-title"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Four Pillars of
              <span className="title-gradient"> Intelligence</span>
            </motion.h2>
          </div>

          <div className="services-showcase">
            <div className="services-tabs">
              {services.map((service, i) => (
                <motion.button
                  key={service.id}
                  className={`service-tab ${activeService === i ? 'active' : ''}`}
                  onClick={() => setActiveService(i)}
                  whileHover={{ x: 12, scale: 1.02 }}
                  transition={springTransition}
                  style={{ '--accent': service.color }}
                >
                  <div className="tab-indicator" />
                  <div className="tab-icon">{service.icon}</div>
                  <div className="tab-content">
                    <span className="tab-title">{service.title}</span>
                    <span className="tab-subtitle">{service.subtitle}</span>
                  </div>
                  <ArrowRight size={18} className="tab-arrow" />
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeService}
                className="service-display"
                initial={{ opacity: 0, x: 80, rotateY: -5 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                exit={{ opacity: 0, x: -80, rotateY: 5 }}
                transition={{ duration: 0.6, ease: smoothEase }}
                style={{ '--accent': services[activeService].color }}
              >
                <div className="display-visual">
                  {services[activeService].visual === 'thermal' && (
                    <div className="thermal-visual">
                      <div className="thermal-grid">
                        {[...Array(144)].map((_, i) => (
                          <div
                            key={i}
                            className="thermal-cell"
                            style={{
                              animationDelay: `${Math.random() * 2}s`,
                              '--heat': Math.random(),
                              '--x': i % 12,
                              '--y': Math.floor(i / 12)
                            }}
                          />
                        ))}
                      </div>
                      <div className="thermal-scanner" />
                      <div className="thermal-hotspots">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="hotspot"
                            style={{
                              left: `${20 + Math.random() * 60}%`,
                              top: `${20 + Math.random() * 60}%`,
                              animationDelay: `${i * 0.3}s`
                            }}
                          >
                            <span className="hotspot-temp">{65 + Math.floor(Math.random() * 30)}°C</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {services[activeService].visual === 'topography' && (
                    <div className="topo-visual">
                      <svg viewBox="0 0 400 300" className="topo-svg">
                        <defs>
                          <linearGradient id="topoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
                          </linearGradient>
                        </defs>
                        {[...Array(15)].map((_, i) => (
                          <path
                            key={i}
                            className="topo-path"
                            d={`M0,${100 + i * 12}
                               Q50,${80 + i * 12 + Math.sin(i) * 30}
                               100,${100 + i * 12}
                               T200,${90 + i * 12 + Math.cos(i) * 25}
                               T300,${100 + i * 12}
                               T400,${95 + i * 12}`}
                            fill="none"
                            stroke="url(#topoGrad)"
                            strokeWidth={2 - i * 0.1}
                            strokeDasharray="1000"
                            opacity={0.9 - i * 0.05}
                          />
                        ))}
                        {/* Elevation markers */}
                        {[...Array(5)].map((_, i) => (
                          <g key={i}>
                            <circle
                              cx={80 + i * 70}
                              cy={120 + Math.sin(i * 2) * 40}
                              r="6"
                              fill="#06b6d4"
                              className="topo-marker"
                            />
                            <text
                              x={80 + i * 70}
                              y={140 + Math.sin(i * 2) * 40}
                              fill="#06b6d4"
                              fontSize="10"
                              textAnchor="middle"
                            >
                              {450 + i * 50}m
                            </text>
                          </g>
                        ))}
                      </svg>
                      <div className="topo-drone-path">
                        <div className="topo-drone-icon">
                          <Satellite size={24} />
                        </div>
                      </div>
                      <div className="topo-3d-effect" />
                    </div>
                  )}

                  {services[activeService].visual === 'cyber' && (
                    <div className="cyber-visual">
                      <div className="cyber-network">
                        {[...Array(30)].map((_, i) => (
                          <div
                            key={i}
                            className="cyber-node"
                            style={{
                              left: `${10 + Math.random() * 80}%`,
                              top: `${10 + Math.random() * 80}%`,
                              animationDelay: `${Math.random() * 3}s`,
                              '--size': 0.5 + Math.random() * 0.5
                            }}
                          />
                        ))}
                        <svg className="cyber-connections">
                          {[...Array(20)].map((_, i) => (
                            <line
                              key={i}
                              x1={`${Math.random() * 100}%`}
                              y1={`${Math.random() * 100}%`}
                              x2={`${Math.random() * 100}%`}
                              y2={`${Math.random() * 100}%`}
                              stroke="#8b5cf6"
                              strokeWidth="1"
                              opacity="0.3"
                              className="cyber-line"
                            />
                          ))}
                        </svg>
                      </div>
                      <div className="cyber-shield-container">
                        <div className="cyber-shield-ring" />
                        <div className="cyber-shield-ring delay-1" />
                        <div className="cyber-shield-ring delay-2" />
                        <ShieldCheck size={48} className="cyber-shield-icon" />
                      </div>
                      <div className="cyber-data-stream">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="data-packet" style={{ animationDelay: `${i * 0.2}s` }}>
                            {Array(8).fill(0).map(() => Math.round(Math.random())).join('')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {services[activeService].visual === 'agriculture' && (
                    <div className="agri-visual">
                      <div className="agri-field">
                        {[...Array(100)].map((_, i) => (
                          <div
                            key={i}
                            className="agri-cell"
                            style={{
                              '--health': 0.3 + Math.random() * 0.7,
                              '--delay': i * 0.02,
                              animationDelay: `${i * 0.02}s`
                            }}
                          />
                        ))}
                      </div>
                      <div className="agri-legend">
                        <span className="legend-title">NDVI Index</span>
                        <div className="legend-bar" />
                        <div className="legend-labels">
                          <span>Low</span>
                          <span>High</span>
                        </div>
                      </div>
                      <div className="agri-stats">
                        <div className="agri-stat">
                          <Leaf size={16} />
                          <span>Health: 87%</span>
                        </div>
                        <div className="agri-stat">
                          <Activity size={16} />
                          <span>Growth: +12%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="display-content">
                  <div className="display-icon" style={{ color: services[activeService].color }}>
                    {services[activeService].icon}
                  </div>
                  <h3>{services[activeService].title}</h3>
                  <p>{services[activeService].description}</p>
                  <div className="display-stats">
                    {Object.entries(services[activeService].stats).map(([key, value]) => (
                      <div key={key} className="display-stat">
                        <span className="ds-value">{value}</span>
                        <span className="ds-label">{key}</span>
                      </div>
                    ))}
                  </div>
                  <MagneticButton className="display-cta">
                    <span>Explore {services[activeService].title}</span>
                    <ExternalLink size={16} />
                  </MagneticButton>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Credentials Section - Advisory Focus */}
      <section id="advisory" className="credentials-section">
        <div className="container">
          <div className="section-header center">
            <span className="section-tag">Advisory Credentials</span>
            <h2 className="section-title">
              Certified
              <span className="title-gradient"> Expertise</span>
            </h2>
            <p className="section-desc">
              Strategic security consulting backed by industry-leading certifications
            </p>
          </div>

          <div className="credentials-grid">
            {credentials.map((cred, i) => (
              <motion.div
                key={cred.cert}
                className="credential-card liquid-glass"
                whileHover={{ y: -10, scale: 1.02 }}
                transition={springTransition}
              >
                <div className="credential-icon">{cred.icon}</div>
                <div className="credential-cert">{cred.cert}</div>
                <div className="credential-name">{cred.name}</div>
                <CheckCircle2 size={20} className="credential-check" />
              </motion.div>
            ))}
          </div>

          <div className="advisory-services">
            <motion.div
              className="advisory-card liquid-glass"
              whileHover={{ scale: 1.01 }}
              transition={springTransition}
            >
              <div className="advisory-header">
                <Brain size={32} />
                <h3>AI Governance & Risk</h3>
              </div>
              <p>Navigate AI implementation with confidence. From ethical frameworks to regulatory compliance, we help organizations deploy AI responsibly.</p>
              <ul className="advisory-list">
                <li><CheckCircle2 size={16} /> AI Ethics & Bias Assessment</li>
                <li><CheckCircle2 size={16} /> Model Risk Management</li>
                <li><CheckCircle2 size={16} /> Regulatory Compliance (EU AI Act)</li>
                <li><CheckCircle2 size={16} /> AI Security Architecture</li>
              </ul>
            </motion.div>

            <motion.div
              className="advisory-card liquid-glass"
              whileHover={{ scale: 1.01 }}
              transition={springTransition}
            >
              <div className="advisory-header">
                <ShieldCheck size={32} />
                <h3>Enterprise Security</h3>
              </div>
              <p>Comprehensive security strategy aligned with your business objectives. Zero-trust architecture, cloud security, and incident response planning.</p>
              <ul className="advisory-list">
                <li><CheckCircle2 size={16} /> Security Architecture Review</li>
                <li><CheckCircle2 size={16} /> Cloud Security (AWS/Azure/GCP)</li>
                <li><CheckCircle2 size={16} /> Penetration Testing</li>
                <li><CheckCircle2 size={16} /> Compliance (SOC2, ISO 27001)</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tech Capabilities - Bento Grid */}
      <section id="technology" className="capabilities-section">
        <div className="container">
          <div className="section-header center">
            <span className="section-tag">Technology Stack</span>
            <h2 className="section-title">
              Built on
              <span className="title-gradient"> Innovation</span>
            </h2>
          </div>

          <div className="bento-grid">
            <motion.div
              className="bento-card bento-large liquid-glass"
              whileHover={{ y: -12 }}
              transition={springTransition}
            >
              <div className="bento-3d">
                <Canvas dpr={[1, 2]}>
                  <ambientLight intensity={0.5} />
                  <pointLight position={[5, 5, 5]} color="#9DFF20" intensity={2} />
                  <LiquidGlassSphere position={[0, 0, 0]} scale={1.5} color="#06b6d4" />
                  <Environment preset="city" />
                </Canvas>
              </div>
              <div className="bento-content">
                <h3>Real-Time AI Processing</h3>
                <p>Edge computing with on-device inference. YOLOv12, SAM3, and custom models running at sub-50ms latency for mission-critical operations.</p>
                <div className="bento-tags">
                  <span>Edge AI</span>
                  <span>Computer Vision</span>
                  <span>MLOps</span>
                </div>
              </div>
            </motion.div>

            {techCapabilities.map((cap, i) => (
              <motion.div
                key={i}
                className="bento-card liquid-glass"
                whileHover={{ y: -8, scale: 1.03 }}
                transition={springTransition}
              >
                <div className="bento-card-icon">{cap.icon}</div>
                <h4>{cap.label}</h4>
                <span className="bento-desc">{cap.desc}</span>
                <span className="bento-stat">{cap.stat}</span>
              </motion.div>
            ))}

            <motion.div
              className="bento-card bento-wide liquid-glass"
              whileHover={{ y: -8 }}
              transition={springTransition}
            >
              <div className="bento-visual">
                <div className="data-stream">
                  {[...Array(30)].map((_, i) => (
                    <div
                      key={i}
                      className="stream-line"
                      style={{
                        animationDelay: `${i * 0.08}s`,
                        '--hue': 180 + i * 5
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="bento-info">
                <h3>Multi-Modal Data Fusion</h3>
                <p>RGB, thermal, multispectral, and LiDAR data streams unified in real-time for comprehensive situational awareness.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <motion.div
            className="cta-card"
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: smoothEase }}
          >
            <div className="cta-3d">
              <Canvas dpr={[1, 2]}>
                <Suspense fallback={null}>
                  <CTAScene />
                </Suspense>
              </Canvas>
            </div>
            <div className="cta-content">
              <h2>Ready to elevate your operations?</h2>
              <p>Schedule a consultation or demo flight with our team.</p>
              <div className="cta-buttons">
                <MagneticButton className="btn-primary btn-glow">
                  <span>Schedule Demo</span>
                  <ArrowRight size={18} />
                </MagneticButton>
                <MagneticButton className="btn-outline">
                  <span>Contact Advisory</span>
                </MagneticButton>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp2-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="nav-logo">
                <div className="logo-icon">
                  <Satellite size={20} />
                </div>
                <span className="logo-text">JINKI</span>
              </div>
              <p>Intelligent aerial solutions and strategic advisory for enterprises that demand excellence.</p>
              <div className="footer-certs">
                {credentials.map(c => (
                  <span key={c.cert} className="footer-cert">{c.cert}</span>
                ))}
              </div>
            </div>
            <div className="footer-links">
              <h4>Solutions</h4>
              <a href="#">Aerial Surveying</a>
              <a href="#">Thermal Inspection</a>
              <a href="#">Cyber Advisory</a>
              <a href="#">AgriTech</a>
            </div>
            <div className="footer-links">
              <h4>Advisory</h4>
              <a href="#">AI Governance</a>
              <a href="#">Security Strategy</a>
              <a href="#">Compliance</a>
              <a href="#">Risk Assessment</a>
            </div>
            <div className="footer-links">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
              <a href="#">Contact</a>
            </div>
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
