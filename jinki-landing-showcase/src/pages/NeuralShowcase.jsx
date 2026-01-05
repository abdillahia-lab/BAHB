import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import NeuralNetworkBackground from '../components/NeuralNetworkBackground'
import ParticleSwarmIntelligence from '../components/ParticleSwarmIntelligence'
import ConstellationVisualization from '../components/ConstellationVisualization'
import NeuralNodeNavigation, { NeuralSection } from '../components/NeuralNodeNavigation'
import GenerativePatterns from '../components/GenerativePatterns'
import AdaptiveLearningSystems, { LearningElement } from '../components/AdaptiveLearningSystems'
import '../styles/NeuralNetwork.css'

/**
 * NEURAL SHOWCASE PAGE
 * Comprehensive demonstration of all neural network-inspired design elements
 * for Jinki Intelligence AI-driven drone inspection + cybersecurity platform
 */

const navNodes = [
  { id: 'overview', icon: '◯', label: 'Overview', color: 'rgba(0, 255, 200, 0.8)' },
  { id: 'network', icon: '●', label: 'Neural Network', color: 'rgba(0, 200, 255, 0.8)' },
  { id: 'swarm', icon: '◆', label: 'Particle Swarm', color: 'rgba(100, 255, 200, 0.8)' },
  { id: 'constellation', icon: '★', label: 'Constellation', color: 'rgba(0, 255, 150, 0.8)' },
  { id: 'generative', icon: '▲', label: 'Generative', color: 'rgba(0, 255, 200, 0.8)' },
]

export default function NeuralShowcase() {
  const [activeNav, setActiveNav] = useState(null)
  const containerRef = useRef(null)

  const handleNavClick = (nodeId) => {
    setActiveNav(nodeId)
    // Scroll to section
    const section = document.getElementById(nodeId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div ref={containerRef} className="neural-showcase-container">
      {/* Background Generative Pattern - Fixed */}
      <GenerativePatterns
        gridSize={20}
        hue={180}
        saturation={100}
        scrollInfluence={0.2}
        updateSpeed={3}
        className="neural-showcase-bg"
      />

      {/* Navigation Header */}
      <motion.header
        className="neural-showcase-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(10px)',
          background: 'rgba(8, 16, 32, 0.5)',
          borderBottom: '1px solid rgba(0, 255, 200, 0.2)'
        }}
      >
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'rgba(0, 255, 200, 0.9)',
            letterSpacing: '2px',
            margin: 0,
            textTransform: 'uppercase'
          }}>
            JINKI NEURAL INTELLIGENCE
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'rgba(0, 255, 200, 0.6)',
            marginTop: '8px',
            letterSpacing: '1px'
          }}>
            AI-DRIVEN DRONE INSPECTION + CYBERSECURITY
          </p>
        </div>

        <NeuralNodeNavigation
          nodes={navNodes}
          onNodeClick={handleNavClick}
          className="neural-showcase-nav"
        />
      </motion.header>

      {/* SECTION 1: Overview with Neural Network Background */}
      <NeuralSection id="overview" className="neural-showcase-section">
        <section
          style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <NeuralNetworkBackground
            nodeCount={60}
            connectionDistance={180}
            hue={180}
            saturation={100}
            lightness={50}
            autoActivate={true}
            className="neural-bg-full"
          />

          <motion.div
            className="neural-hero-content"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            style={{
              position: 'relative',
              zIndex: 10,
              textAlign: 'center',
              maxWidth: '600px',
              padding: '40px'
            }}
          >
            <h2 style={{
              fontSize: '48px',
              fontWeight: 700,
              color: 'rgba(0, 255, 200, 1)',
              letterSpacing: '3px',
              marginBottom: '20px',
              textTransform: 'uppercase'
            }}>
              Neural Intelligence
            </h2>
            <p style={{
              fontSize: '18px',
              color: 'rgba(0, 255, 200, 0.7)',
              lineHeight: '1.8',
              letterSpacing: '1px'
            }}>
              Advanced AI networks learning and adapting in real-time to protect your critical infrastructure with neural-inspired intelligence.
            </p>
          </motion.div>
        </section>
      </NeuralSection>

      {/* SECTION 2: Neural Network Visualization */}
      <NeuralSection id="network" className="neural-showcase-section">
        <section
          style={{
            minHeight: '100vh',
            padding: '80px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(8, 16, 32, 0.3)'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false }}
            style={{ textAlign: 'center', marginBottom: '60px', width: '100%' }}
          >
            <h2 style={{
              fontSize: '42px',
              fontWeight: 700,
              color: 'rgba(0, 255, 200, 0.9)',
              marginBottom: '16px',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}>
              Connected Intelligence
            </h2>
            <p style={{
              fontSize: '16px',
              color: 'rgba(0, 255, 200, 0.6)',
              maxWidth: '600px',
              margin: '0 auto',
              letterSpacing: '1px'
            }}>
              Billions of neural connections firing in concert, each activation propagating intelligence through the network.
            </p>
          </motion.div>

          <div style={{
            width: '100%',
            height: '600px',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(0, 255, 200, 0.2)',
            border: '1px solid rgba(0, 255, 200, 0.3)',
            marginBottom: '60px'
          }}>
            <NeuralNetworkBackground
              nodeCount={80}
              connectionDistance={200}
              hue={180}
              saturation={100}
              lightness={50}
              autoActivate={true}
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: false }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '30px',
              width: '100%',
              maxWidth: '1200px'
            }}
          >
            {[
              { title: 'Activation', desc: 'Nodes fire with precision timing' },
              { title: 'Propagation', desc: 'Signals cascade through networks' },
              { title: 'Learning', desc: 'Connections strengthen with use' },
              { title: 'Adaptation', desc: 'Networks evolve in real-time' }
            ].map((item, idx) => (
              <LearningElement key={idx}>
                <div style={{
                  padding: '30px',
                  background: 'linear-gradient(135deg, rgba(0, 255, 200, 0.1), rgba(0, 200, 255, 0.05))',
                  border: '1px solid rgba(0, 255, 200, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'rgba(0, 255, 200, 0.9)',
                    marginBottom: '12px',
                    letterSpacing: '1px'
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(0, 255, 200, 0.6)',
                    lineHeight: '1.6'
                  }}>
                    {item.desc}
                  </p>
                </div>
              </LearningElement>
            ))}
          </motion.div>
        </section>
      </NeuralSection>

      {/* SECTION 3: Particle Swarm Intelligence */}
      <NeuralSection id="swarm" className="neural-showcase-section">
        <section
          style={{
            minHeight: '100vh',
            padding: '80px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false }}
            style={{ textAlign: 'center', marginBottom: '60px', width: '100%' }}
          >
            <h2 style={{
              fontSize: '42px',
              fontWeight: 700,
              color: 'rgba(0, 255, 200, 0.9)',
              marginBottom: '16px',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}>
              Swarm Intelligence
            </h2>
            <p style={{
              fontSize: '16px',
              color: 'rgba(0, 255, 200, 0.6)',
              maxWidth: '600px',
              margin: '0 auto',
              letterSpacing: '1px'
            }}>
              Distributed algorithms learning collective behavior - separation, alignment, cohesion. Move your mouse to guide the swarm.
            </p>
          </motion.div>

          <div style={{
            width: '100%',
            height: '600px',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(0, 255, 200, 0.2)',
            border: '1px solid rgba(0, 255, 200, 0.3)',
            marginBottom: '60px'
          }}>
            <ParticleSwarmIntelligence
              particleCount={120}
              hue={180}
              saturation={100}
              separationWeight={1.5}
              alignmentWeight={1}
              cohesionWeight={1}
              seekWeight={0.8}
            />
          </div>
        </section>
      </NeuralSection>

      {/* SECTION 4: Constellation Data Visualization */}
      <NeuralSection id="constellation" className="neural-showcase-section">
        <section
          style={{
            minHeight: '100vh',
            padding: '80px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(8, 16, 32, 0.3)'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false }}
            style={{ textAlign: 'center', marginBottom: '60px', width: '100%' }}
          >
            <h2 style={{
              fontSize: '42px',
              fontWeight: 700,
              color: 'rgba(0, 255, 200, 0.9)',
              marginBottom: '16px',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}>
              Data Constellations
            </h2>
            <p style={{
              fontSize: '16px',
              color: 'rgba(0, 255, 200, 0.6)',
              maxWidth: '600px',
              margin: '0 auto',
              letterSpacing: '1px'
            }}>
              Complex data relationships visualized as networks of interconnected stars. Hover to explore clusters.
            </p>
          </motion.div>

          <ConstellationVisualization
            width={1000}
            height={600}
            hue={180}
            saturation={100}
            showLabels={true}
            interactive={true}
          />
        </section>
      </NeuralSection>

      {/* SECTION 5: Generative Patterns */}
      <NeuralSection id="generative" className="neural-showcase-section">
        <section
          style={{
            minHeight: '100vh',
            padding: '80px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false }}
            style={{ textAlign: 'center', marginBottom: '60px', width: '100%' }}
          >
            <h2 style={{
              fontSize: '42px',
              fontWeight: 700,
              color: 'rgba(0, 255, 200, 0.9)',
              marginBottom: '16px',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}>
              Generative Growth
            </h2>
            <p style={{
              fontSize: '16px',
              color: 'rgba(0, 255, 200, 0.6)',
              maxWidth: '600px',
              margin: '0 auto',
              letterSpacing: '1px'
            }}>
              Organic patterns that evolve with your scroll, influenced by your interaction with the page in real-time.
            </p>
          </motion.div>

          <div style={{
            width: '100%',
            height: '600px',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(0, 255, 200, 0.2)',
            border: '1px solid rgba(0, 255, 200, 0.3)'
          }}>
            <GenerativePatterns
              gridSize={25}
              hue={180}
              saturation={100}
              scrollInfluence={0.4}
              updateSpeed={2}
            />
          </div>
        </section>
      </NeuralSection>

      {/* SECTION 6: Summary */}
      <section
        style={{
          minHeight: '100vh',
          padding: '80px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(8, 16, 32, 0.5)',
          textAlign: 'center'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: false }}
        >
          <h2 style={{
            fontSize: '48px',
            fontWeight: 700,
            color: 'rgba(0, 255, 200, 0.9)',
            marginBottom: '24px',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>
            The Future of Intelligence
          </h2>
          <p style={{
            fontSize: '18px',
            color: 'rgba(0, 255, 200, 0.7)',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.8',
            letterSpacing: '1px',
            marginBottom: '40px'
          }}>
            Neural-inspired AI combined with swarm intelligence, adaptive learning, and real-time visualization creates an unprecedented level of drone inspection and cybersecurity protection.
          </p>
          <AdaptiveLearningSystems>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '16px 48px',
                fontSize: '16px',
                fontWeight: 600,
                color: 'rgba(0, 255, 200, 0.9)',
                background: 'linear-gradient(135deg, rgba(0, 255, 200, 0.2), rgba(0, 200, 255, 0.1))',
                border: '2px solid rgba(0, 255, 200, 0.5)',
                borderRadius: '8px',
                cursor: 'pointer',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 20px rgba(0, 255, 200, 0.3)'
              }}
              onHover
            >
              Explore Jinki Neural
            </motion.button>
          </AdaptiveLearningSystems>
        </motion.div>
      </section>

      <style>{`
        .neural-showcase-container {
          position: relative;
          background: #081020;
          color: rgba(0, 255, 200, 0.9);
          font-family: 'Courier New', monospace;
          overflow-x: hidden;
        }

        .neural-showcase-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          pointer-events: none;
        }

        .neural-showcase-section {
          position: relative;
          z-index: 1;
        }

        .neural-bg-full {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .neural-hero-content {
          background: linear-gradient(135deg,
            rgba(8, 16, 32, 0.8),
            rgba(8, 16, 32, 0.6));
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 255, 200, 0.3);
          border-radius: 10px;
          padding: 60px 40px;
        }

        @media (max-width: 768px) {
          .neural-showcase-section {
            padding: 60px 20px !important;
          }

          .neural-hero-content {
            padding: 40px 20px !important;
          }

          h2 {
            font-size: 32px !important;
          }

          p {
            font-size: 14px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}
