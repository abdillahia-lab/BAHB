import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Environment, MeshDistortMaterial, Sphere, OrbitControls } from '@react-three/drei'
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useInView } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowLeft, ArrowRight, Sun, Moon, Play, ArrowUpRight,
  Scan, Thermometer, Map, Shield, Leaf, Cpu, Zap,
  Radio, Target, Layers, BarChart3, Globe, Lock,
  Satellite, Eye, Activity, ChevronDown, ExternalLink
} from 'lucide-react'
import './LandingPage2.css'

gsap.registerPlugin(ScrollTrigger)

// 3D Drone Component
function AnimatedDrone({ mouse }) {
  const meshRef = useRef()
  const groupRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3
    }
    if (groupRef.current) {
      groupRef.current.rotation.x = mouse.y * 0.1
      groupRef.current.rotation.y = mouse.x * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      {/* Central Body */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <octahedronGeometry args={[1, 0]} />
          <MeshDistortMaterial
            color="#06b6d4"
            attach="material"
            distort={0.2}
            speed={2}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      </Float>

      {/* Orbiting Rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2, 0.02, 16, 100]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[2.5, 0.015, 16, 100]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 4, Math.PI / 2, Math.PI / 6]}>
        <torusGeometry args={[3, 0.01, 16, 100]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.3} />
      </mesh>

      {/* Data Points */}
      {[...Array(8)].map((_, i) => (
        <Float key={i} speed={1.5 + i * 0.2} floatIntensity={0.3}>
          <mesh position={[
            Math.cos(i * Math.PI / 4) * 3.5,
            Math.sin(i * Math.PI / 4) * 0.5,
            Math.sin(i * Math.PI / 4) * 3.5
          ]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#06b6d4" : "#8b5cf6"}
              emissive={i % 2 === 0 ? "#06b6d4" : "#8b5cf6"}
              emissiveIntensity={1}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

// Thermal Visualization Component
function ThermalSphere() {
  const meshRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <Sphere ref={meshRef} args={[2, 64, 64]}>
      <MeshDistortMaterial
        color="#ff6b35"
        attach="material"
        distort={0.4}
        speed={3}
        roughness={0.1}
        metalness={0.9}
      />
    </Sphere>
  )
}

// Scene Component
function Scene({ mouse }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
      <spotLight position={[0, 10, 0]} intensity={0.5} color="#10b981" />
      <AnimatedDrone mouse={mouse} />
      <Environment preset="night" />
    </>
  )
}

function LandingPage2() {
  const [isDark, setIsDark] = useState(true)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [activeService, setActiveService] = useState(0)
  const containerRef = useRef(null)
  const heroRef = useRef(null)
  const servicesRef = useRef(null)

  const isServicesInView = useInView(servicesRef, { once: false, amount: 0.3 })

  // Mouse tracking
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
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax on scroll
      gsap.to('.hero-3d-container', {
        y: 200,
        scrollTrigger: {
          trigger: '.lp2-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      })

      // Stats counter animation
      gsap.from('.stat-number', {
        textContent: 0,
        duration: 2,
        ease: 'power1.out',
        snap: { textContent: 1 },
        scrollTrigger: {
          trigger: '.stats-bar',
          start: 'top 80%',
        }
      })

      // Bento cards stagger
      gsap.fromTo('.bento-card',
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.bento-grid',
            start: 'top 75%'
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
      title: 'Aerial Intelligence',
      subtitle: 'Topographic Mapping & Surveying',
      description: 'Capture high-resolution orthomosaics and 3D terrain models with centimeter-level accuracy. From construction sites to mining operations.',
      icon: <Map size={32} />,
      color: '#06b6d4',
      stats: { accuracy: '2cm', coverage: '500ha/day', models: '3D/4D' },
      visual: 'topography'
    },
    {
      id: 'thermal',
      title: 'Thermal Scanning',
      subtitle: 'Predictive Infrastructure Analysis',
      description: 'AI-powered thermal imaging detects anomalies before failures occur. Solar panels, power lines, industrial equipment.',
      icon: <Thermometer size={32} />,
      color: '#f97316',
      stats: { detection: '99.8%', temp: '±0.1°C', range: '50m' },
      visual: 'thermal'
    },
    {
      id: 'cyber',
      title: 'Cyber Defense',
      subtitle: 'AI Security & Threat Detection',
      description: 'Zero-trust architecture protects your data and AI models. Continuous monitoring, penetration testing, compliance.',
      icon: <Shield size={32} />,
      color: '#8b5cf6',
      stats: { uptime: '99.99%', response: '<1min', threats: '0 day' },
      visual: 'cyber'
    },
    {
      id: 'agri',
      title: 'AgriTech Analytics',
      subtitle: 'Precision Crop Intelligence',
      description: 'NDVI analysis, irrigation optimization, and yield prediction. Transform farming with data-driven insights.',
      icon: <Leaf size={32} />,
      color: '#10b981',
      stats: { yield: '+34%', water: '-40%', roi: '300%' },
      visual: 'agriculture'
    }
  ]

  const techCapabilities = [
    { icon: <Cpu />, label: 'Edge AI', desc: '<50ms latency' },
    { icon: <Eye />, label: 'Computer Vision', desc: 'YOLOv12 + SAM3' },
    { icon: <Radio />, label: 'Multi-Spectral', desc: 'RGB + Thermal + NIR' },
    { icon: <Target />, label: 'RTK GPS', desc: '2cm precision' },
    { icon: <Layers />, label: '3D Modeling', desc: 'Point clouds' },
    { icon: <Lock />, label: 'Zero Trust', desc: 'E2E encrypted' }
  ]

  return (
    <div ref={containerRef} className={`lp2 ${isDark ? 'dark' : 'light'}`}>
      {/* Scroll Progress */}
      <motion.div className="scroll-progress" style={{ scaleX: smoothProgress }} />

      {/* Navigation */}
      <motion.nav
        className="nav"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
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
        </div>

        <div className="nav-actions">
          <motion.button
            className="theme-toggle"
            onClick={() => setIsDark(!isDark)}
            whileTap={{ scale: 0.9 }}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </motion.button>
          <motion.button
            className="nav-cta"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Get Demo</span>
            <ArrowUpRight size={16} />
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="lp2-hero">
        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Activity size={14} />
            <span>Trusted by 150+ enterprises</span>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Intelligence
            <br />
            <span className="title-gradient">From Above</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Drone surveying, thermal imaging, and AI analytics
            for industries that demand precision.
          </motion.p>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>Start Project</span>
              <ArrowRight size={18} />
            </motion.button>
            <motion.button
              className="btn-glass"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play size={18} />
              <span>See it in action</span>
            </motion.button>
          </motion.div>

          <motion.div
            className="scroll-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <span>Explore</span>
            <ChevronDown size={20} className="bounce" />
          </motion.div>
        </div>

        {/* 3D Canvas */}
        <div className="hero-3d-container">
          <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
            <Suspense fallback={null}>
              <Scene mouse={mousePosition} />
            </Suspense>
          </Canvas>
          <div className="hero-3d-overlay" />
        </div>

        {/* Floating Stats */}
        <div className="hero-stats">
          <motion.div
            className="stat-card"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
          >
            <Scan size={20} />
            <div>
              <span className="stat-value">2.4M+</span>
              <span className="stat-label">Acres Mapped</span>
            </div>
          </motion.div>
          <motion.div
            className="stat-card"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
          >
            <Zap size={20} />
            <div>
              <span className="stat-value">&lt;50ms</span>
              <span className="stat-label">AI Latency</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number" data-value="99.8">99.8</span>
              <span className="stat-unit">%</span>
              <span className="stat-desc">Detection Accuracy</span>
            </div>
            <div className="stat-item">
              <span className="stat-number" data-value="150">150</span>
              <span className="stat-unit">+</span>
              <span className="stat-desc">Enterprise Clients</span>
            </div>
            <div className="stat-item">
              <span className="stat-number" data-value="500">500</span>
              <span className="stat-unit">ha/day</span>
              <span className="stat-desc">Mapping Capacity</span>
            </div>
            <div className="stat-item">
              <span className="stat-number" data-value="24">24</span>
              <span className="stat-unit">/7</span>
              <span className="stat-desc">Support Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section ref={servicesRef} className="services-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">What We Do</span>
            <h2 className="section-title">
              Four Pillars of
              <span className="title-gradient"> Intelligence</span>
            </h2>
          </div>

          <div className="services-showcase">
            {/* Service Tabs */}
            <div className="services-tabs">
              {services.map((service, i) => (
                <motion.button
                  key={service.id}
                  className={`service-tab ${activeService === i ? 'active' : ''}`}
                  onClick={() => setActiveService(i)}
                  whileHover={{ x: 8 }}
                  style={{ '--accent': service.color }}
                >
                  <div className="tab-icon">{service.icon}</div>
                  <div className="tab-content">
                    <span className="tab-title">{service.title}</span>
                    <span className="tab-subtitle">{service.subtitle}</span>
                  </div>
                  <ArrowRight size={18} className="tab-arrow" />
                </motion.button>
              ))}
            </div>

            {/* Active Service Display */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeService}
                className="service-display"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                style={{ '--accent': services[activeService].color }}
              >
                <div className="display-visual">
                  {services[activeService].visual === 'thermal' && (
                    <div className="thermal-visual">
                      <div className="thermal-grid">
                        {[...Array(100)].map((_, i) => (
                          <div
                            key={i}
                            className="thermal-cell"
                            style={{
                              animationDelay: `${i * 0.02}s`,
                              '--heat': Math.random()
                            }}
                          />
                        ))}
                      </div>
                      <div className="thermal-overlay" />
                      <div className="thermal-hotspot" />
                    </div>
                  )}
                  {services[activeService].visual === 'topography' && (
                    <div className="topo-visual">
                      <svg viewBox="0 0 400 300" className="topo-lines">
                        {[...Array(12)].map((_, i) => (
                          <path
                            key={i}
                            d={`M0,${150 + i * 10} Q100,${130 + i * 10 + Math.sin(i) * 20} 200,${150 + i * 10} T400,${150 + i * 10}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            opacity={0.3 + i * 0.05}
                            className="topo-line"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          />
                        ))}
                      </svg>
                      <div className="topo-marker" />
                      <div className="topo-drone" />
                    </div>
                  )}
                  {services[activeService].visual === 'cyber' && (
                    <div className="cyber-visual">
                      <div className="cyber-grid">
                        {[...Array(50)].map((_, i) => (
                          <div
                            key={i}
                            className="cyber-node"
                            style={{
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                              animationDelay: `${Math.random() * 2}s`
                            }}
                          />
                        ))}
                      </div>
                      <div className="cyber-shield" />
                    </div>
                  )}
                  {services[activeService].visual === 'agriculture' && (
                    <div className="agri-visual">
                      <div className="agri-grid">
                        {[...Array(64)].map((_, i) => (
                          <div
                            key={i}
                            className="agri-cell"
                            style={{
                              '--health': 0.4 + Math.random() * 0.6,
                              animationDelay: `${i * 0.03}s`
                            }}
                          />
                        ))}
                      </div>
                      <div className="agri-overlay" />
                    </div>
                  )}
                </div>

                <div className="display-content">
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
                  <motion.button
                    className="display-cta"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>Learn More</span>
                    <ExternalLink size={16} />
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Tech Capabilities - Bento Grid */}
      <section className="capabilities-section">
        <div className="container">
          <div className="section-header center">
            <span className="section-tag">Technology</span>
            <h2 className="section-title">
              Built on
              <span className="title-gradient"> Cutting-Edge Stack</span>
            </h2>
          </div>

          <div className="bento-grid">
            <motion.div className="bento-card bento-large" whileHover={{ y: -8 }}>
              <div className="bento-icon">
                <Canvas style={{ width: 120, height: 120 }}>
                  <ambientLight intensity={0.5} />
                  <pointLight position={[5, 5, 5]} />
                  <Float speed={2}>
                    <Sphere args={[1, 32, 32]}>
                      <MeshDistortMaterial color="#06b6d4" distort={0.3} speed={2} />
                    </Sphere>
                  </Float>
                </Canvas>
              </div>
              <h3>Real-Time AI Processing</h3>
              <p>On-device inference with YOLOv12, SAM3, and custom models. Sub-50ms latency for mission-critical operations.</p>
              <div className="bento-tags">
                <span>Edge AI</span>
                <span>Computer Vision</span>
                <span>ML Ops</span>
              </div>
            </motion.div>

            {techCapabilities.slice(0, 4).map((cap, i) => (
              <motion.div
                key={i}
                className="bento-card"
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="bento-card-icon">{cap.icon}</div>
                <h4>{cap.label}</h4>
                <span className="bento-desc">{cap.desc}</span>
              </motion.div>
            ))}

            <motion.div className="bento-card bento-wide" whileHover={{ y: -8 }}>
              <div className="bento-visual">
                <div className="data-stream">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="stream-line" style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
              <div className="bento-info">
                <h3>Multi-Modal Data Fusion</h3>
                <p>RGB, thermal, multispectral, and LiDAR data combined for comprehensive insights.</p>
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
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="cta-content">
              <h2>Ready to see your data from above?</h2>
              <p>Book a demo flight or consultation with our team.</p>
              <div className="cta-buttons">
                <motion.button
                  className="btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Schedule Demo</span>
                  <ArrowRight size={18} />
                </motion.button>
                <motion.button
                  className="btn-outline"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Contact Sales</span>
                </motion.button>
              </div>
            </div>
            <div className="cta-3d">
              <Canvas>
                <ambientLight intensity={0.3} />
                <pointLight position={[5, 5, 5]} color="#06b6d4" />
                <Float speed={1.5}>
                  <ThermalSphere />
                </Float>
              </Canvas>
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
              <p>Intelligent aerial solutions for the enterprises that move the world.</p>
            </div>
            <div className="footer-links">
              <h4>Solutions</h4>
              <a href="#">Aerial Mapping</a>
              <a href="#">Thermal Inspection</a>
              <a href="#">Cyber Security</a>
              <a href="#">AgriTech</a>
            </div>
            <div className="footer-links">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-links">
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Jinki Intelligence. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage2
