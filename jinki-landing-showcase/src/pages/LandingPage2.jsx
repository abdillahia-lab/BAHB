import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Hexagon, Crosshair, Radar, Satellite, Database, Cpu, Workflow, Layers, Shield, Leaf, Plane, Scan, Activity, Terminal, Binary, Network, ArrowUpRight } from 'lucide-react'
import './LandingPage2.css'

function LandingPage2() {
  const capabilities = [
    {
      icon: <Satellite size={32} />,
      title: 'Aerial Intelligence',
      description: 'Multi-spectral drone surveys with centimeter-level precision for topographic mapping and asset monitoring.',
      metric: '0.02m',
      metricLabel: 'Accuracy'
    },
    {
      icon: <Scan size={32} />,
      title: 'Thermal Inspections',
      description: 'AI-powered thermal analysis for predictive maintenance across industrial and energy infrastructure.',
      metric: '99.8%',
      metricLabel: 'Detection Rate'
    },
    {
      icon: <Shield size={32} />,
      title: 'Cyber Defense',
      description: 'Zero-trust security architecture and AI model protection for enterprise systems.',
      metric: '24/7',
      metricLabel: 'Monitoring'
    },
    {
      icon: <Leaf size={32} />,
      title: 'AgriTech Analytics',
      description: 'Precision agriculture with NDVI analysis, irrigation optimization, and yield forecasting.',
      metric: '+34%',
      metricLabel: 'Yield Increase'
    }
  ]

  const techStack = [
    { name: 'YOLOv12', category: 'Object Detection' },
    { name: 'SAM 3.0', category: 'Segmentation' },
    { name: 'RF-DETR', category: 'Real-time Analysis' },
    { name: 'Qwen-VL', category: 'Vision Language' },
    { name: 'Custom Models', category: 'Domain Specific' },
    { name: 'Edge AI', category: 'On-device' }
  ]

  const metrics = [
    { value: '2.4M+', label: 'Data Points Processed Daily' },
    { value: '<50ms', label: 'Real-time Latency' },
    { value: '150+', label: 'Enterprise Deployments' },
    { value: '99.99%', label: 'Platform Uptime' }
  ]

  return (
    <div className="lp2">
      <Link to="/" className="back-to-directory">
        <ArrowLeft size={18} />
        <span>Back to Directory</span>
      </Link>

      {/* Background Effects */}
      <div className="lp2-bg">
        <div className="hex-grid" />
        <div className="scan-line" />
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />
        <div className="glow-orb glow-orb-3" />
      </div>

      {/* Navigation */}
      <nav className="lp2-nav">
        <div className="container">
          <div className="nav-content">
            <div className="logo">
              <div className="logo-hex">
                <Hexagon size={36} strokeWidth={1.5} />
                <span className="logo-letter">J</span>
              </div>
              <div className="logo-text">
                <span className="logo-name">JINKI</span>
                <span className="logo-tagline">INTELLIGENCE</span>
              </div>
            </div>

            <div className="nav-links">
              <a href="#capabilities" className="nav-link">
                <span className="link-number">01</span>
                <span>Capabilities</span>
              </a>
              <a href="#technology" className="nav-link">
                <span className="link-number">02</span>
                <span>Technology</span>
              </a>
              <a href="#platform" className="nav-link">
                <span className="link-number">03</span>
                <span>Platform</span>
              </a>
              <a href="#contact" className="nav-link">
                <span className="link-number">04</span>
                <span>Contact</span>
              </a>
            </div>

            <div className="nav-actions">
              <button className="btn btn-ghost">
                <Terminal size={18} />
                <span>Portal</span>
              </button>
              <button className="btn btn-primary">
                <span>Request Access</span>
                <ArrowUpRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="lp2-hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-status">
              <Activity size={14} />
              <span>SYSTEM ONLINE</span>
              <span className="status-divider">/</span>
              <span>ALL MODULES OPERATIONAL</span>
            </div>

            <h1 className="hero-title">
              <span className="title-line">NEXT-GEN</span>
              <span className="title-line title-accent">INTELLIGENCE</span>
              <span className="title-line">SYSTEMS</span>
            </h1>

            <p className="hero-description">
              Advanced AI-powered surveillance, analysis, and security solutions
              for mission-critical operations. Built for precision. Designed for scale.
            </p>

            <div className="hero-actions">
              <button className="btn btn-primary btn-lg">
                <Crosshair size={20} />
                <span>Initiate Consultation</span>
              </button>
              <button className="btn btn-outline btn-lg">
                <span>View Capabilities</span>
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="hero-metrics">
              {metrics.map((metric, i) => (
                <div key={i} className="metric-item">
                  <span className="metric-value">{metric.value}</span>
                  <span className="metric-label">{metric.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-container">
              <div className="radar-ring radar-ring-1" />
              <div className="radar-ring radar-ring-2" />
              <div className="radar-ring radar-ring-3" />
              <div className="radar-sweep" />
              <div className="radar-center">
                <Radar size={48} />
              </div>

              <div className="data-point data-point-1">
                <div className="point-pulse" />
                <span>UAV-01</span>
              </div>
              <div className="data-point data-point-2">
                <div className="point-pulse" />
                <span>THERMAL</span>
              </div>
              <div className="data-point data-point-3">
                <div className="point-pulse" />
                <span>SENSOR-A</span>
              </div>
            </div>

            <div className="visual-sidebar">
              <div className="sidebar-module">
                <div className="module-header">
                  <Binary size={16} />
                  <span>LIVE FEED</span>
                </div>
                <div className="module-content">
                  <div className="feed-line" />
                  <div className="feed-line" />
                  <div className="feed-line" />
                </div>
              </div>
              <div className="sidebar-module">
                <div className="module-header">
                  <Network size={16} />
                  <span>NETWORK</span>
                </div>
                <div className="module-stats">
                  <div className="stat-bar">
                    <span>Bandwidth</span>
                    <div className="bar-fill" style={{width: '78%'}} />
                  </div>
                  <div className="stat-bar">
                    <span>Latency</span>
                    <div className="bar-fill" style={{width: '23%'}} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="lp2-capabilities" id="capabilities">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">
              <span className="tag-number">01</span>
              <span className="tag-line" />
              <span className="tag-text">CAPABILITIES</span>
            </div>
            <h2 className="section-title">MISSION-CRITICAL SOLUTIONS</h2>
            <p className="section-subtitle">
              Integrated intelligence systems engineered for precision, reliability, and actionable insights.
            </p>
          </div>

          <div className="capabilities-grid">
            {capabilities.map((cap, i) => (
              <div key={i} className="capability-card">
                <div className="card-index">0{i + 1}</div>
                <div className="card-icon">{cap.icon}</div>
                <h3 className="card-title">{cap.title}</h3>
                <p className="card-description">{cap.description}</p>
                <div className="card-metric">
                  <span className="metric-value">{cap.metric}</span>
                  <span className="metric-label">{cap.metricLabel}</span>
                </div>
                <div className="card-border" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="lp2-technology" id="technology">
        <div className="container">
          <div className="tech-grid">
            <div className="tech-content">
              <div className="section-tag">
                <span className="tag-number">02</span>
                <span className="tag-line" />
                <span className="tag-text">TECHNOLOGY</span>
              </div>
              <h2 className="section-title">POWERED BY CUTTING-EDGE AI</h2>
              <p className="tech-description">
                Our proprietary AI stack combines state-of-the-art computer vision,
                natural language processing, and edge computing to deliver real-time
                intelligence where it matters most.
              </p>

              <div className="tech-features">
                <div className="tech-feature">
                  <Cpu size={24} />
                  <div>
                    <h4>Edge Processing</h4>
                    <p>On-device inference with sub-50ms latency</p>
                  </div>
                </div>
                <div className="tech-feature">
                  <Workflow size={24} />
                  <div>
                    <h4>Pipeline Automation</h4>
                    <p>Automated data processing and analysis workflows</p>
                  </div>
                </div>
                <div className="tech-feature">
                  <Database size={24} />
                  <div>
                    <h4>Secure Storage</h4>
                    <p>End-to-end encrypted data management</p>
                  </div>
                </div>
                <div className="tech-feature">
                  <Layers size={24} />
                  <div>
                    <h4>Multi-Modal Fusion</h4>
                    <p>Integrated visual, thermal, and sensor data</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="tech-stack">
              <div className="stack-header">
                <span>// AI_MODELS</span>
              </div>
              <div className="stack-grid">
                {techStack.map((tech, i) => (
                  <div key={i} className="stack-item">
                    <span className="stack-name">{tech.name}</span>
                    <span className="stack-category">{tech.category}</span>
                  </div>
                ))}
              </div>
              <div className="stack-footer">
                <span className="footer-text">+ Custom domain-specific models</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="lp2-platform" id="platform">
        <div className="container">
          <div className="section-header centered">
            <div className="section-tag">
              <span className="tag-number">03</span>
              <span className="tag-line" />
              <span className="tag-text">PLATFORM</span>
            </div>
            <h2 className="section-title">UNIFIED COMMAND CENTER</h2>
            <p className="section-subtitle">
              A single platform to orchestrate all your aerial, ground, and cyber intelligence operations.
            </p>
          </div>

          <div className="platform-visual">
            <div className="platform-screen">
              <div className="screen-header">
                <div className="window-controls">
                  <span /><span /><span />
                </div>
                <span className="screen-title">JINKI COMMAND v3.2.1</span>
                <div className="screen-status">
                  <span className="status-indicator" />
                  <span>CONNECTED</span>
                </div>
              </div>
              <div className="screen-content">
                <div className="content-sidebar">
                  <div className="sidebar-item active">
                    <Radar size={18} />
                    <span>Live Monitor</span>
                  </div>
                  <div className="sidebar-item">
                    <Satellite size={18} />
                    <span>Fleet Status</span>
                  </div>
                  <div className="sidebar-item">
                    <Activity size={18} />
                    <span>Analytics</span>
                  </div>
                  <div className="sidebar-item">
                    <Shield size={18} />
                    <span>Security</span>
                  </div>
                </div>
                <div className="content-main">
                  <div className="main-header">
                    <h4>Active Operations</h4>
                    <span className="operation-count">12 ACTIVE</span>
                  </div>
                  <div className="operations-grid">
                    <div className="operation-card">
                      <div className="op-status live" />
                      <div className="op-info">
                        <span className="op-name">Site Survey - Alpha</span>
                        <span className="op-type">Aerial Mapping</span>
                      </div>
                      <span className="op-progress">78%</span>
                    </div>
                    <div className="operation-card">
                      <div className="op-status live" />
                      <div className="op-info">
                        <span className="op-name">Thermal Scan - Grid 7</span>
                        <span className="op-type">Infrastructure</span>
                      </div>
                      <span className="op-progress">45%</span>
                    </div>
                    <div className="operation-card">
                      <div className="op-status processing" />
                      <div className="op-info">
                        <span className="op-name">Security Audit</span>
                        <span className="op-type">Cyber Analysis</span>
                      </div>
                      <span className="op-progress">92%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="lp2-cta" id="contact">
        <div className="container">
          <div className="cta-content">
            <div className="cta-text">
              <h2>READY TO DEPLOY?</h2>
              <p>
                Connect with our solutions team to discuss your operational requirements
                and explore custom integration options.
              </p>
            </div>
            <div className="cta-actions">
              <button className="btn btn-primary btn-lg">
                <span>Schedule Briefing</span>
                <ArrowUpRight size={20} />
              </button>
              <button className="btn btn-outline btn-lg">
                <span>Download Specs</span>
              </button>
            </div>
          </div>
          <div className="cta-decoration">
            <div className="deco-line deco-line-1" />
            <div className="deco-line deco-line-2" />
            <div className="deco-line deco-line-3" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp2-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo">
                <div className="logo-hex">
                  <Hexagon size={28} strokeWidth={1.5} />
                  <span className="logo-letter">J</span>
                </div>
                <div className="logo-text">
                  <span className="logo-name">JINKI</span>
                  <span className="logo-tagline">INTELLIGENCE</span>
                </div>
              </div>
              <p className="footer-description">
                Next-generation intelligence systems for aerial, industrial, cyber, and agricultural operations.
              </p>
            </div>

            <div className="footer-links-grid">
              <div className="footer-links">
                <h4>Solutions</h4>
                <ul>
                  <li><a href="#">Aerial Surveying</a></li>
                  <li><a href="#">Thermal Inspections</a></li>
                  <li><a href="#">Cyber Security</a></li>
                  <li><a href="#">AgriTech</a></li>
                </ul>
              </div>
              <div className="footer-links">
                <h4>Platform</h4>
                <ul>
                  <li><a href="#">Command Center</a></li>
                  <li><a href="#">API Access</a></li>
                  <li><a href="#">Documentation</a></li>
                  <li><a href="#">Status</a></li>
                </ul>
              </div>
              <div className="footer-links">
                <h4>Company</h4>
                <ul>
                  <li><a href="#">About</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Contact</a></li>
                  <li><a href="#">Press</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 Jinki Intelligence. All rights reserved.</p>
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
