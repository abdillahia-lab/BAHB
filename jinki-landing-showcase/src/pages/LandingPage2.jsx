import { useState, useEffect, useRef, Suspense } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Float,
  Environment,
  MeshDistortMaterial,
  MeshTransmissionMaterial,
  Sphere,
  Box,
  Torus,
  OrbitControls,
  Stars,
  Trail,
  useGLTF,
  PerspectiveCamera
} from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { ArrowRight, Play, ChevronDown, Shield, Cpu, Eye, Target, Zap, Server, Building2, Leaf } from 'lucide-react'
import './LandingPage2.css'

// ============================================
// 3D COMPONENTS
// ============================================

function DroneModel({ mouse }) {
  const meshRef = useRef()
  const ringRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2
      meshRef.current.rotation.x = mouse.y * 0.3
      meshRef.current.rotation.z = mouse.x * 0.2
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -state.clock.elapsedTime * 0.5
    }
  })

  return (
    <group ref={meshRef}>
      {/* Main drone body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.8, 0.15, 0.8]} />
        <MeshTransmissionMaterial
          backside
          samples={16}
          resolution={512}
          transmission={0.95}
          roughness={0.1}
          thickness={0.5}
          ior={1.5}
          chromaticAberration={0.4}
          anisotropy={0.3}
          distortion={0.2}
          distortionScale={0.3}
          temporalDistortion={0.2}
          color="#4D49FC"
        />
      </mesh>

      {/* Core sphere */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial
          color="#4D49FC"
          emissive="#4D49FC"
          emissiveIntensity={2}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Propeller arms */}
      {[0, 90, 180, 270].map((angle, i) => (
        <group key={i} rotation={[0, (angle * Math.PI) / 180, 0]}>
          <mesh position={[0.5, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.5, 0.08, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.15, 0.02, 8, 32]} />
            <meshStandardMaterial
              color="#4D49FC"
              emissive="#4D49FC"
              emissiveIntensity={0.5}
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>
      ))}

      {/* Rotating scanning ring */}
      <group ref={ringRef}>
        <mesh position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.2, 0.01, 16, 100]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={1}
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>
    </group>
  )
}

function FloatingOrbs() {
  const group = useRef()

  useFrame((state) => {
    group.current.rotation.y = state.clock.elapsedTime * 0.05
  })

  const orbs = [
    { pos: [3, 1, -2], scale: 0.3, color: '#4D49FC' },
    { pos: [-3, -1, -3], scale: 0.2, color: '#00ff88' },
    { pos: [2, -2, -4], scale: 0.15, color: '#ff6b6b' },
    { pos: [-2, 2, -2], scale: 0.25, color: '#4D49FC' },
    { pos: [0, 3, -5], scale: 0.4, color: '#00ff88' },
  ]

  return (
    <group ref={group}>
      {orbs.map((orb, i) => (
        <Float key={i} speed={1.5 + i * 0.2} rotationIntensity={0.5} floatIntensity={1}>
          <mesh position={orb.pos}>
            <sphereGeometry args={[orb.scale, 32, 32]} />
            <MeshDistortMaterial
              color={orb.color}
              emissive={orb.color}
              emissiveIntensity={0.5}
              distort={0.4}
              speed={2}
              roughness={0.1}
              metalness={0.8}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

function GridFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
      <planeGeometry args={[50, 50, 50, 50]} />
      <meshStandardMaterial
        color="#0a0a1a"
        wireframe
        transparent
        opacity={0.15}
      />
    </mesh>
  )
}

function ParticleField() {
  const particlesRef = useRef()
  const count = 500

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20

    const color = new THREE.Color(Math.random() > 0.5 ? '#4D49FC' : '#00ff88')
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.01
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}

function HeroScene({ mouse }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
      <ambientLight intensity={0.2} />
      <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1} color="#4D49FC" />
      <spotLight position={[-10, -10, -10]} angle={0.3} penumbra={1} intensity={0.5} color="#00ff88" />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#ffffff" />

      <Suspense fallback={null}>
        <DroneModel mouse={mouse} />
        <FloatingOrbs />
        <ParticleField />
        <GridFloor />
        <Stars radius={100} depth={50} count={2000} factor={4} fade speed={1} />
        <Environment preset="night" />
      </Suspense>

      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.001, 0.001]}
        />
        <Vignette
          offset={0.3}
          darkness={0.6}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

function LandingPage2() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef()
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  useEffect(() => {
    const handleMouse = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  const capabilities = [
    {
      icon: <Eye size={28} />,
      title: 'Infrastructure Inspection',
      tagline: 'See What Others Miss',
      description: 'Autonomous drones with centimeter-level precision detect equipment degradation before it becomes an outage.',
      stats: { value: '99.8%', label: 'Detection Rate' }
    },
    {
      icon: <Zap size={28} />,
      title: 'Thermal Analytics',
      tagline: 'Heat Reveals Truth',
      description: 'Radiometric imaging with ±0.03°C sensitivity predicts failures weeks in advance.',
      stats: { value: '±0.03°C', label: 'Sensitivity' }
    },
    {
      icon: <Target size={28} />,
      title: 'Precision Mapping',
      tagline: 'Survey-Grade Accuracy',
      description: 'RTK-GPS delivers ±2cm accuracy for engineering-grade deliverables.',
      stats: { value: '±2cm', label: 'RTK Accuracy' }
    },
    {
      icon: <Shield size={28} />,
      title: 'Security Advisory',
      tagline: 'Zero Trust Architecture',
      description: 'CISSP-certified team builds resilient security postures for critical infrastructure.',
      stats: { value: 'Zero', label: 'Breaches' }
    }
  ]

  const industries = [
    { icon: <Zap size={24} />, name: 'Electric Utilities', clients: '12 of top 20 US utilities' },
    { icon: <Server size={24} />, name: 'Data Centers', clients: 'Hyperscale operators' },
    { icon: <Building2 size={24} />, name: 'Oil & Gas', clients: '3 continents' },
    { icon: <Leaf size={24} />, name: 'Agriculture', clients: '500,000+ acres' }
  ]

  const credentials = [
    { badge: 'CISSP', name: 'Certified Information Systems Security Professional', desc: 'The gold standard. Only 150,000 worldwide.' },
    { badge: 'CCSP', name: 'Certified Cloud Security Professional', desc: 'Protecting cloud and hybrid environments.' },
    { badge: 'AIGP', name: 'AI Governance Professional', desc: 'Ethics, compliance, and risk management for AI.' },
    { badge: 'PMP', name: 'Project Management Professional', desc: 'Delivering on time and on budget.' }
  ]

  return (
    <div ref={containerRef} className="jinki-ultra">
      {/* Hero with Real 3D */}
      <section className="hero-section">
        <motion.div className="hero-canvas" style={{ opacity }}>
          <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
            <HeroScene mouse={mousePos} />
          </Canvas>
        </motion.div>

        <div className="hero-overlay">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <motion.div
              className="hero-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <span className="badge-dot" />
              <span>Now serving Fortune 500 utilities</span>
            </motion.div>

            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              Critical Infrastructure
              <br />
              <span className="gradient-text">Deserves Critical Attention</span>
            </motion.h1>

            <motion.p
              className="hero-description"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.3 }}
            >
              Autonomous drone inspection and enterprise security advisory for utilities,
              data centers, and critical infrastructure operators.
            </motion.p>

            <motion.div
              className="hero-cta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.5 }}
            >
              <a href="#contact" className="btn-primary">
                <span>Schedule Inspection</span>
                <ArrowRight size={18} />
              </a>
              <button className="btn-ghost">
                <Play size={18} />
                <span>Watch Demo</span>
              </button>
            </motion.div>

            <motion.div
              className="hero-stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.8 }}
            >
              <div className="stat">
                <span className="stat-value">2.4M+</span>
                <span className="stat-label">Acres Surveyed</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-value">99.8%</span>
                <span className="stat-label">Detection Rate</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-value">Zero</span>
                <span className="stat-label">Security Breaches</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="scroll-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            <ChevronDown size={24} />
          </motion.div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="capabilities-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-tag">Capabilities</span>
            <h2>Four Pillars of <span className="gradient-text">Operational Intelligence</span></h2>
          </motion.div>

          <div className="capabilities-grid">
            {capabilities.map((cap, i) => (
              <motion.div
                key={i}
                className="capability-card"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="card-glow" />
                <div className="card-icon">{cap.icon}</div>
                <span className="card-tagline">{cap.tagline}</span>
                <h3>{cap.title}</h3>
                <p>{cap.description}</p>
                <div className="card-stat">
                  <span className="stat-value">{cap.stats.value}</span>
                  <span className="stat-label">{cap.stats.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="industries-section">
        <div className="container">
          <motion.div
            className="section-header center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-tag">Industries</span>
            <h2>Built for <span className="gradient-text">Critical Operations</span></h2>
            <p className="section-desc">
              We specialize in industries where downtime isn't an inconvenience—it's a crisis.
            </p>
          </motion.div>

          <div className="industries-grid">
            {industries.map((ind, i) => (
              <motion.div
                key={i}
                className="industry-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="industry-icon">{ind.icon}</div>
                <h3>{ind.name}</h3>
                <span className="industry-clients">{ind.clients}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials Section */}
      <section id="about" className="credentials-section">
        <div className="container">
          <div className="credentials-layout">
            <motion.div
              className="credentials-content"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="section-tag">Why Jinki</span>
              <h2>15 Years Protecting <span className="gradient-text">Critical Infrastructure</span></h2>
              <p className="lead">
                We're infrastructure specialists who understand that a single point of failure
                can affect millions of people.
              </p>

              <div className="credentials-list">
                {credentials.map((cred, i) => (
                  <motion.div
                    key={i}
                    className="credential-item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="cred-badge">{cred.badge}</div>
                    <div className="cred-info">
                      <strong>{cred.name}</strong>
                      <span>{cred.desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="credentials-visual"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <div className="shield-graphic">
                <div className="shield-ring r1" />
                <div className="shield-ring r2" />
                <div className="shield-ring r3" />
                <div className="shield-core">
                  <Shield size={48} />
                </div>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="shield-node" style={{ '--i': i }} />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="tech-section">
        <div className="container">
          <motion.div
            className="section-header center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-tag">Technology</span>
            <h2>Technology That <span className="gradient-text">Actually Works</span></h2>
          </motion.div>

          <div className="tech-grid">
            <motion.div
              className="tech-card featured"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="tech-orb">
                <Cpu size={32} />
              </div>
              <h3>Edge AI Processing</h3>
              <p>On-device inference at 50ms latency. No cloud dependency. Air-gapped option available.</p>
              <div className="tech-tags">
                <span>Sub-50ms</span>
                <span>Air-gapped</span>
              </div>
            </motion.div>

            {[
              { icon: <Eye size={22} />, name: 'Computer Vision', spec: 'YOLOv8+' },
              { icon: <Target size={22} />, name: 'RTK Positioning', spec: '±2cm' },
              { icon: <Shield size={22} />, name: 'Zero Trust', spec: 'AES-256' }
            ].map((tech, i) => (
              <motion.div
                key={i}
                className="tech-card"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="tech-icon">{tech.icon}</div>
                <h4>{tech.name}</h4>
                <span className="tech-spec">{tech.spec}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="cta-section">
        <div className="container">
          <motion.div
            className="cta-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Ready to See What You've Been Missing?</h2>
            <p>
              Schedule a 30-minute discovery call. No pressure, no pitch deck—just a
              conversation between professionals.
            </p>
            <div className="cta-actions">
              <a href="mailto:hello@jinki.io" className="btn-primary btn-lg">
                <span>Schedule Discovery Call</span>
                <ArrowRight size={18} />
              </a>
            </div>
            <span className="cta-note">Usually respond within 4 hours</span>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="logo">
                <span className="logo-mark">J</span>
                <div className="logo-text">
                  <span className="logo-name">Jinki</span>
                  <span className="logo-tag">Intelligence</span>
                </div>
              </div>
              <p>Critical infrastructure inspection and enterprise security advisory.</p>
              <div className="footer-certs">
                <span>CISSP</span>
                <span>CCSP</span>
                <span>AIGP</span>
                <span>PMP</span>
              </div>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>Capabilities</h4>
                <a href="#capabilities">Infrastructure Inspection</a>
                <a href="#capabilities">Thermal Analytics</a>
                <a href="#capabilities">Precision Mapping</a>
                <a href="#capabilities">Security Advisory</a>
              </div>
              <div className="footer-col">
                <h4>Industries</h4>
                <a href="#industries">Electric Utilities</a>
                <a href="#industries">Data Centers</a>
                <a href="#industries">Oil & Gas</a>
                <a href="#industries">Agriculture</a>
              </div>
              <div className="footer-col">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Jinki Intelligence. All rights reserved.</span>
            <div className="footer-legal">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage2
