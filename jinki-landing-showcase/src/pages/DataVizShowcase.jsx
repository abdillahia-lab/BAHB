import { motion } from 'framer-motion'
import { AnimatedCounter } from '../components/DataViz/AnimatedCounter'
import { BeforeAfterSlider } from '../components/DataViz/BeforeAfterSlider'
import { ParticleFlowSystem } from '../components/DataViz/ParticleFlowSystem'
import { TimelineAnimation } from '../components/DataViz/TimelineAnimation'
import { DroneInspectionSimulator } from '../components/DataViz/DroneInspectionSimulator'
import { Data3DLandscape } from '../components/DataViz/Data3DLandscape'
import { ScrollInfographic } from '../components/DataViz/ScrollInfographic'
import '../components/DataViz/DataVizStyles.css'

export default function DataVizShowcase() {
  // Timeline events for detection progression
  const detectionTimeline = [
    {
      id: 'init',
      icon: '🚁',
      title: 'Mission Initiated',
      time: '0:00',
      description: 'Drone deployment and system startup',
      details: [
        'Flight systems initialized',
        'Sensors calibrated',
        'Ground control verified'
      ],
      metrics: [
        { label: 'Status', value: 'Ready' },
        { label: 'Battery', value: '100%' }
      ]
    },
    {
      id: 'ascent',
      icon: '📈',
      title: 'Altitude Acquisition',
      time: '2:15',
      description: 'Rising to optimal inspection altitude',
      details: [
        'Ascending at 5 m/s',
        'GPS lock confirmed',
        'Signal strength: 95%'
      ],
      metrics: [
        { label: 'Altitude', value: '450m' },
        { label: 'Speed', value: '18 km/h' }
      ]
    },
    {
      id: 'scan',
      icon: '🔍',
      title: 'Area Coverage',
      time: '8:30',
      description: 'Systematic scanning of target infrastructure',
      details: [
        '94% area coverage achieved',
        '3 anomalies detected in sector A',
        'Thermal imaging active'
      ],
      metrics: [
        { label: 'Coverage', value: '94%' },
        { label: 'Anomalies', value: '3' }
      ]
    },
    {
      id: 'analysis',
      icon: '🎯',
      title: 'Real-time Analysis',
      time: '14:45',
      description: 'AI-powered anomaly detection and classification',
      details: [
        'Machine learning model confidence: 96.2%',
        'Risk assessment: Medium',
        '72-hour early warning issued'
      ],
      metrics: [
        { label: 'Accuracy', value: '96.2%' },
        { label: 'Confidence', value: 'High' }
      ]
    },
    {
      id: 'report',
      icon: '📊',
      title: 'Report Generated',
      time: '16:20',
      description: 'Comprehensive inspection report with recommendations',
      details: [
        'Full data export completed',
        'Preventive actions documented',
        'Cost analysis: $700K savings potential'
      ],
      metrics: [
        { label: 'Savings', value: '$700K' },
        { label: 'ROI', value: '58%' }
      ]
    }
  ]

  // 3D landscape data
  const landscapeData = [
    { label: 'Accuracy', value: 94, color: '#06f' },
    { label: 'Early Detection', value: 72, color: '#0ff' },
    { label: 'Cost Reduction', value: 58, color: '#0f0' },
    { label: 'Savings', value: 700, color: '#f0f' },
  ]

  // Infographic sections
  const infographicSections = [
    {
      id: 'impact',
      icon: '⚡',
      title: 'Business Impact',
      columns: [
        {
          text: 'Jinki Intelligence transforms infrastructure inspection with autonomous drone technology and AI-powered cybersecurity integration.',
          metrics: [
            { label: 'ROI', value: '58%' },
            { label: 'Reduction', value: '58%' }
          ]
        },
        {
          text: 'Real-time threat detection prevents costly failures and security breaches before they occur.',
          metrics: [
            { label: 'Early Detection', value: '72hrs' },
            { label: 'Accuracy', value: '94%' }
          ]
        }
      ]
    },
    {
      id: 'benefits',
      icon: '✨',
      title: 'Key Benefits',
      columns: [
        {
          text: '💰 Maximize financial returns with automated cost reduction and operational efficiency gains.',
          metrics: [
            { label: 'Savings', value: '$700K' }
          ]
        },
        {
          text: '🔒 Strengthen cybersecurity posture with integrated threat detection and prevention.',
          metrics: [
            { label: 'Threats', value: 'Detected' }
          ]
        },
        {
          text: '⚙️ Improve operational reliability through proactive maintenance and predictive analytics.',
          metrics: [
            { label: 'Uptime', value: '99.8%' }
          ]
        }
      ]
    }
  ]

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#0a0a1e', color: '#e0e0ff' }}>
      {/* Hero Section */}
      <motion.section
        className="dataviz-hero"
        style={{
          padding: '80px 40px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(10, 10, 30, 0.95) 0%, rgba(26, 26, 62, 0.95) 100%)',
          borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 style={{
          fontSize: '3.5rem',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #0066ff 0%, #00ffff 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}>
          DATAVIZ - Revolutionary Data Visualization
        </h1>
        <p style={{
          fontSize: '1.3rem',
          color: '#00ffff',
          maxWidth: '800px',
          margin: '0 auto',
          lineHeight: '1.8',
          textShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
        }}>
          Transform complex Jinki Intelligence metrics into compelling visual narratives
        </p>
      </motion.section>

      {/* Key Metrics - Animated Counters */}
      <motion.section
        style={{
          padding: '60px 40px',
          background: 'linear-gradient(180deg, rgba(10, 10, 30, 0.8) 0%, rgba(20, 20, 50, 0.8) 100%)',
          borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
        }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h2 style={{
          textAlign: 'center',
          fontSize: '2rem',
          marginBottom: '40px',
          color: '#0ff',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Core Metrics
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          {/* Cost Savings */}
          <motion.div
            style={{
              padding: '30px',
              background: 'rgba(0, 102, 255, 0.05)',
              border: '1px solid rgba(0, 255, 255, 0.2)',
              borderRadius: '8px',
              textAlign: 'center',
            }}
            whileHover={{ y: -10, boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)' }}
          >
            <p style={{ marginTop: 0, color: '#a0a0c0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Cost Savings</p>
            <AnimatedCounter
              value={700000}
              duration={3}
              easing="easeOutExpo"
              prefix="$"
              suffix="K"
              decimals={0}
              format={(n) => `$${(n / 1000).toFixed(0)}K`}
            />
          </motion.div>

          {/* Early Detection */}
          <motion.div
            style={{
              padding: '30px',
              background: 'rgba(0, 102, 255, 0.05)',
              border: '1px solid rgba(0, 255, 255, 0.2)',
              borderRadius: '8px',
              textAlign: 'center',
            }}
            whileHover={{ y: -10, boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)' }}
          >
            <p style={{ marginTop: 0, color: '#a0a0c0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Early Detection</p>
            <AnimatedCounter
              value={72}
              duration={2.5}
              easing="easeOutElastic"
              suffix=" Hours"
            />
          </motion.div>

          {/* Accuracy Rate */}
          <motion.div
            style={{
              padding: '30px',
              background: 'rgba(0, 102, 255, 0.05)',
              border: '1px solid rgba(0, 255, 255, 0.2)',
              borderRadius: '8px',
              textAlign: 'center',
            }}
            whileHover={{ y: -10, boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)' }}
          >
            <p style={{ marginTop: 0, color: '#a0a0c0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Accuracy</p>
            <AnimatedCounter
              value={94}
              duration={2.5}
              easing="easeOutQuad"
              suffix="%"
            />
          </motion.div>

          {/* Cost Reduction */}
          <motion.div
            style={{
              padding: '30px',
              background: 'rgba(0, 102, 255, 0.05)',
              border: '1px solid rgba(0, 255, 255, 0.2)',
              borderRadius: '8px',
              textAlign: 'center',
            }}
            whileHover={{ y: -10, boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)' }}
          >
            <p style={{ marginTop: 0, color: '#a0a0c0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Cost Reduction</p>
            <AnimatedCounter
              value={58}
              duration={2.5}
              easing="easeOutQuad"
              suffix="%"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Drone Inspection Simulator */}
      <motion.section
        style={{
          padding: '60px 40px',
          borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
        }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h2 style={{
          textAlign: 'center',
          fontSize: '2rem',
          marginBottom: '40px',
          color: '#0ff',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Real-time Inspection Simulation
        </h2>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <DroneInspectionSimulator
            duration={30000}
            autoPlay={true}
          />
        </div>
      </motion.section>

      {/* Particle Flow System */}
      <motion.section
        style={{
          padding: '60px 40px',
          borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
        }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h2 style={{
          textAlign: 'center',
          fontSize: '2rem',
          marginBottom: '40px',
          color: '#0ff',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Data Flow Visualization
        </h2>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <ParticleFlowSystem
            width={900}
            height={500}
            particleCount={200}
            speed={2.5}
            color="#0066ff"
            glowColor="#00ffff"
          />
        </div>
      </motion.section>

      {/* 3D Data Landscape */}
      <motion.section
        style={{
          padding: '60px 40px',
          borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
        }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h2 style={{
          textAlign: 'center',
          fontSize: '2rem',
          marginBottom: '40px',
          color: '#0ff',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          3D Metrics Landscape
        </h2>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          height: '600px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(0, 255, 255, 0.2)',
        }}>
          <Data3DLandscape
            width={1000}
            height={600}
            data={landscapeData}
            rotation={true}
            interactive={true}
          />
        </div>
      </motion.section>

      {/* Timeline Animation */}
      <motion.section
        style={{
          padding: '60px 40px',
          borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
        }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h2 style={{
          textAlign: 'center',
          fontSize: '2rem',
          marginBottom: '40px',
          color: '#0ff',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Detection Progression Timeline
        </h2>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <TimelineAnimation
            events={detectionTimeline}
            direction="vertical"
          />
        </div>
      </motion.section>

      {/* Scroll Infographic */}
      <motion.section
        style={{
          borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
        }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <ScrollInfographic sections={infographicSections} />
      </motion.section>

      {/* CTA Section */}
      <motion.section
        style={{
          padding: '60px 40px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(0, 255, 255, 0.05) 100%)',
          borderTop: '1px solid rgba(0, 255, 255, 0.2)',
        }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 style={{
          fontSize: '2rem',
          marginBottom: '20px',
          color: '#0ff',
          textTransform: 'uppercase',
        }}>
          Ready to Transform Your Data?
        </h2>
        <p style={{
          fontSize: '1.2rem',
          color: '#a0a0c0',
          marginBottom: '30px',
        }}>
          Deploy advanced data visualization for your Jinki Intelligence infrastructure
        </p>
        <button
          style={{
            padding: '15px 40px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: 'white',
            background: 'linear-gradient(135deg, #0066ff 0%, #00ffff 100%)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-3px)'
            e.target.style.boxShadow = '0 10px 30px rgba(0, 255, 255, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = 'none'
          }}
        >
          Explore Integration
        </button>
      </motion.section>
    </div>
  )
}
