import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './Mega9.css'

// ═══════════════════════════════════════════════════════════════
// MATRIX CODE RAIN - Background digital rain effect
// ═══════════════════════════════════════════════════════════════
function MatrixRain() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%"\'#&_(),.;:?!\\|{}<>[]^~'
    const fontSize = 14
    const columns = canvas.width / fontSize
    const drops = Array(Math.floor(columns)).fill(1)

    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#0F0'
      ctx.font = fontSize + 'px monospace'

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 33)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="matrix-rain" />
}

// ═══════════════════════════════════════════════════════════════
// TYPEWRITER EFFECT - Character-by-character typing
// ═══════════════════════════════════════════════════════════════
function Typewriter({ text, delay = 0, speed = 30, onComplete, className = '' }) {
  const [displayedText, setDisplayedText] = useState('')
  const [started, setStarted] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(startTimer)
  }, [delay])

  useEffect(() => {
    if (!started) return

    if (displayedText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1))
      }, speed)
      return () => clearTimeout(timer)
    } else if (onComplete) {
      onComplete()
    }
  }, [displayedText, text, speed, started, onComplete])

  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setCursorVisible(v => !v)
    }, 530)
    return () => clearInterval(cursorTimer)
  }, [])

  return (
    <span className={className}>
      {displayedText}
      <span className={`cursor ${cursorVisible ? 'visible' : ''}`}>█</span>
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════
// BOOT SEQUENCE - Initial system boot animation
// ═══════════════════════════════════════════════════════════════
function BootSequence({ onComplete }) {
  const [lines, setLines] = useState([])
  const [currentLine, setCurrentLine] = useState(0)

  const bootLines = [
    '> INITIALIZING JINKI OS v4.2.1',
    '> LOADING CORE MODULES................ [OK]',
    '> MOUNTING AERIAL INTELLIGENCE SYSTEM. [OK]',
    '> CALIBRATING THERMAL SENSORS......... [OK]',
    '> ESTABLISHING SECURE CONNECTION...... [OK]',
    '> LIDAR ARRAY ONLINE.................. [OK]',
    '> MULTISPECTRAL IMAGING ACTIVE........ [OK]',
    '> ALL SYSTEMS OPERATIONAL',
    '',
    '> ACCESS GRANTED',
    ''
  ]

  useEffect(() => {
    if (currentLine >= bootLines.length) {
      setTimeout(onComplete, 500)
      return
    }

    const timer = setTimeout(() => {
      setLines(prev => [...prev, bootLines[currentLine]])
      setCurrentLine(prev => prev + 1)
    }, 150)

    return () => clearTimeout(timer)
  }, [currentLine, onComplete])

  return (
    <motion.div
      className="boot-sequence"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="boot-content">
        {lines.map((line, i) => (
          <div key={i} className="boot-line">
            {line}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TERMINAL SECTION - Reusable terminal-style section
// ═══════════════════════════════════════════════════════════════
function TerminalSection({ command, children, delay = 0 }) {
  const [show, setShow] = useState(false)

  return (
    <motion.div
      className="terminal-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, delay }}
      onAnimationComplete={() => setShow(true)}
    >
      <div className="terminal-header">
        <span className="terminal-prompt">user@jinki:~$</span>
        {show && <Typewriter text={command} speed={40} />}
      </div>
      <div className="terminal-content">
        {children}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM MONITOR - htop-style stats display
// ═══════════════════════════════════════════════════════════════
function SystemMonitor() {
  const [progress, setProgress] = useState({
    detection: 0,
    accuracy: 0,
    coverage: 0,
    uptime: 0
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => ({
        detection: Math.min(prev.detection + 2, 94),
        accuracy: Math.min(prev.accuracy + 2.5, 99.2),
        coverage: Math.min(prev.coverage + 1.5, 72),
        uptime: Math.min(prev.uptime + 1.8, 99.8)
      }))
    }, 50)

    return () => clearInterval(interval)
  }, [])

  const createBar = (percent) => {
    const filled = Math.floor(percent / 5)
    const empty = 20 - filled
    return '█'.repeat(filled) + '░'.repeat(empty)
  }

  return (
    <div className="system-monitor">
      <div className="monitor-header">
╔══════════════════════════════════════════════════════════╗
║  JINKI INTELLIGENCE :: SYSTEM STATUS :: LIVE METRICS    ║
╚══════════════════════════════════════════════════════════╝
      </div>
      <div className="monitor-stats">
        <div className="stat-line">
          <span className="stat-label">DETECTION RATE   </span>
          <span className="stat-bar">[{createBar(progress.detection)}]</span>
          <span className="stat-value"> {progress.detection.toFixed(1)}%</span>
        </div>
        <div className="stat-line">
          <span className="stat-label">ACCURACY         </span>
          <span className="stat-bar">[{createBar(progress.accuracy)}]</span>
          <span className="stat-value"> {progress.accuracy.toFixed(1)}%</span>
        </div>
        <div className="stat-line">
          <span className="stat-label">COVERAGE (hrs)   </span>
          <span className="stat-bar">[{createBar(progress.coverage)}]</span>
          <span className="stat-value"> {progress.coverage.toFixed(0)}h</span>
        </div>
        <div className="stat-line">
          <span className="stat-label">SYSTEM UPTIME    </span>
          <span className="stat-bar">[{createBar(progress.uptime)}]</span>
          <span className="stat-value"> {progress.uptime.toFixed(1)}%</span>
        </div>
      </div>
      <div className="monitor-footer">
        <span className="status-ok">[OPTIMAL]</span> All systems operational
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// GLITCH TEXT - Cyberpunk glitch effect
// ═══════════════════════════════════════════════════════════════
function GlitchText({ children, className = '' }) {
  return (
    <span className={`glitch ${className}`} data-text={children}>
      {children}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Mega9() {
  const [bootComplete, setBootComplete] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (bootComplete) {
      setTimeout(() => setShowContent(true), 300)
    }
  }, [bootComplete])

  const industries = [
    {
      title: 'DATA_CENTER',
      problem: 'Cooling failures cause 19% of outages. Avg cost: $700K per incident.',
      solution: 'Thermal monitoring @ 0.05°C sensitivity. 72hr early detection.',
      metrics: { prevented: '$700K', detection: '72hrs', accuracy: '94%' }
    },
    {
      title: 'ELECTRIC_GRID',
      problem: 'Ground crews miss 48% of defects. Helicopter inspection: $2K+/hour.',
      solution: 'LiDAR @ 2.4M points/sec. 60% cost reduction vs aerial survey.',
      metrics: { reduction: '60%', coverage: '14km/day', defects: '4.5x' }
    },
    {
      title: 'AGRICULTURE',
      problem: 'Crop stress visible after 14+ days of damage accumulation.',
      solution: 'NDVI multispectral imaging. Stress detection 14 days earlier.',
      metrics: { early: '14 days', roi: '150%', coverage: '500ac/hr' }
    },
    {
      title: 'OIL_GAS',
      problem: 'EPA requires continuous methane monitoring. Manual takes days.',
      solution: 'Optical Gas Imaging. 99.2% detection rate. 14km daily coverage.',
      metrics: { detection: '99.2%', range: '14km', compliance: '100%' }
    }
  ]

  if (!bootComplete) {
    return (
      <div className="mega9">
        <MatrixRain />
        <BootSequence onComplete={() => setBootComplete(true)} />
      </div>
    )
  }

  return (
    <div className="mega9">
      <MatrixRain />

      {/* Scan lines overlay */}
      <div className="scanlines" />
      <div className="vignette" />

      <AnimatePresence>
        {showContent && (
          <motion.div
            className="terminal-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* HEADER */}
            <motion.header
              className="terminal-nav"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="nav-content">
                <div className="nav-brand">
                  <span className="prompt-symbol">&gt;</span>
                  <GlitchText className="brand-text">JINKI_OS</GlitchText>
                </div>
                <nav className="nav-links">
                  <a href="#scan">&gt; SCAN</a>
                  <a href="#systems">&gt; SYSTEMS</a>
                  <a href="#intel">&gt; INTEL</a>
                  <a href="#connect">&gt; CONNECT</a>
                </nav>
              </div>
            </motion.header>

            {/* HERO */}
            <section className="hero-terminal">
              <motion.div
                className="hero-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="terminal-window">
                  <div className="window-header">
                    <span className="window-dot red"></span>
                    <span className="window-dot yellow"></span>
                    <span className="window-dot green"></span>
                    <span className="window-title">jinki@aerial-intelligence</span>
                  </div>
                  <div className="window-content">
                    <div className="command-line">
                      <span className="prompt">[root@jinki]#</span>
                      <span className="command">./initialize_surveillance.sh</span>
                    </div>
                    <div className="output">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        <pre className="ascii-logo">
{`
    ██╗██╗███╗   ██╗██╗  ██╗██╗
    ██║██║████╗  ██║██║ ██╔╝██║
    ██║██║██╔██╗ ██║█████╔╝ ██║
    ██║██║██║╚██╗██║██╔═██╗ ██║
    ██║██║██║ ╚████║██║  ██╗██║
    ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝

    EX ALTO OMNIA :: FROM ABOVE, ALL THINGS
`}
                        </pre>
                      </motion.div>
                      <motion.div
                        className="hero-text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4 }}
                      >
                        <p className="system-msg">
                          &gt; AUTONOMOUS AERIAL INTELLIGENCE FOR CRITICAL INFRASTRUCTURE
                        </p>
                        <p className="system-msg">
                          &gt; DETECT ANOMALIES BEFORE CATASTROPHIC FAILURE
                        </p>
                        <p className="system-msg">
                          &gt; MILITARY-GRADE SENSORS :: ALL-WEATHER OPERATIONS
                        </p>
                      </motion.div>
                      <motion.div
                        className="hero-actions"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                      >
                        <a href="#connect" className="btn-terminal primary">
                          <span className="btn-prompt">&gt;_</span> INITIATE_CONTACT
                        </a>
                        <a href="#scan" className="btn-terminal secondary">
                          <span className="btn-prompt">$</span> RUN_DIAGNOSTICS
                        </a>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* SYSTEM MONITOR */}
            <section className="monitor-section">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <SystemMonitor />
              </motion.div>
            </section>

            {/* INDUSTRIES */}
            <section id="scan" className="industries-terminal">
              <TerminalSection command="cat /var/log/industries/report.txt">
                <div className="industries-grid">
                  {industries.map((industry, i) => (
                    <motion.div
                      key={industry.title}
                      className="industry-block"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                    >
                      <div className="block-header">
                        ┌─[<span className="industry-title">{industry.title}</span>]
                      </div>
                      <div className="block-content">
                        <div className="info-line">
                          <span className="label">PROBLEM:</span> {industry.problem}
                        </div>
                        <div className="info-line">
                          <span className="label">SOLUTION:</span> {industry.solution}
                        </div>
                        <div className="metrics">
                          {Object.entries(industry.metrics).map(([key, value]) => (
                            <div key={key} className="metric-item">
                              <span className="metric-key">{key}:</span>
                              <span className="metric-value">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="block-footer">└─[<span className="status">OPERATIONAL</span>]</div>
                    </motion.div>
                  ))}
                </div>
              </TerminalSection>
            </section>

            {/* PLATFORM */}
            <section id="systems" className="platform-terminal">
              <TerminalSection command="systemctl status jinki-platform">
                <div className="platform-grid">
                  <div className="platform-specs">
                    <div className="spec-header">
                      ╔════════════════════════════════════════╗
                      ║    HARDWARE SPECIFICATIONS v4.2.1      ║
                      ╚════════════════════════════════════════╝
                    </div>
                    <div className="spec-list">
                      {[
                        { name: 'THERMAL_SENSOR', value: '0.05°C sensitivity' },
                        { name: 'LIDAR_ARRAY', value: '2.4M points/sec' },
                        { name: 'WEATHER_RATING', value: 'IP55 sealed' },
                        { name: 'FLIGHT_SYSTEMS', value: 'Redundant' },
                        { name: 'TRANSMISSION', value: '20km range' },
                        { name: 'RTK_PRECISION', value: '±1cm accuracy' },
                        { name: 'ENDURANCE', value: '59 minutes' },
                        { name: 'PAYLOAD', value: 'Multi-sensor' }
                      ].map((spec, i) => (
                        <motion.div
                          key={spec.name}
                          className="spec-line"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.08 }}
                        >
                          <span className="spec-name">{spec.name}</span>
                          <span className="spec-dots">{'·'.repeat(20)}</span>
                          <span className="spec-value">[{spec.value}]</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div className="platform-visual">
                    <pre className="drone-ascii">
{`
       ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
      ███████████████████
     ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

    ◉────────────────◉
    │  ╔══════════╗  │
    │  ║ ▓▓▓▓▓▓▓▓ ║  │
    │  ║ ▓ JINKI▓ ║  │
    │  ║ ▓▓▓▓▓▓▓▓ ║  │
    │  ╚══════════╝  │
    ◉────────────────◉

     ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
    ███████████████████
     ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

    [SYSTEM: ONLINE]
    [STATUS: READY]
`}
                    </pre>
                  </div>
                </div>
              </TerminalSection>
            </section>

            {/* ADVISORY */}
            <section id="intel" className="advisory-terminal">
              <TerminalSection command="grep -r 'expertise' /home/advisory/*">
                <div className="advisory-content">
                  <div className="profile-terminal">
                    <div className="profile-header">
                      ┌──[ADVISORY_BOARD]──────────────────────────┐
                    </div>
                    <div className="profile-body">
                      <pre className="profile-avatar">
{`    ╔═══════╗
    ║ ▓▓▓▓▓ ║
    ║ ▓◉ ◉▓ ║
    ║ ▓  ▽ ▓ ║
    ║ ▓▔▔▔▔▓ ║
    ╚═══════╝`}
                      </pre>
                      <div className="profile-info">
                        <h3 className="profile-name">ABDILLAHI A.</h3>
                        <div className="profile-role">PRINCIPAL_SECURITY_ARCHITECT</div>
                        <div className="profile-bio">
                          <p>&gt; Enterprise security architecture for critical infrastructure</p>
                          <p>&gt; AI governance & zero-trust frameworks</p>
                          <p>&gt; Risk management: Energy, Utilities, Data Centers</p>
                          <p>&gt; Regulatory compliance & threat modeling</p>
                        </div>
                        <div className="profile-certs">
                          <span className="cert-badge">CISSP</span>
                          <span className="cert-badge">CCSP</span>
                          <span className="cert-badge">AIGP</span>
                          <span className="cert-badge">PMP</span>
                        </div>
                      </div>
                    </div>
                    <div className="profile-footer">
                      └────────────────────────────────────────────┘
                    </div>
                  </div>
                </div>
              </TerminalSection>
            </section>

            {/* CTA */}
            <section id="connect" className="cta-terminal">
              <motion.div
                className="cta-content"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <div className="terminal-window cta-window">
                  <div className="window-header">
                    <span className="window-dot red"></span>
                    <span className="window-dot yellow"></span>
                    <span className="window-dot green"></span>
                    <span className="window-title">connection-request.sh</span>
                  </div>
                  <div className="window-content">
                    <pre className="cta-ascii">
{`
  ╔═══════════════════════════════════════╗
  ║                                       ║
  ║   ESTABLISH SECURE CONNECTION?        ║
  ║                                       ║
  ║   > PREVENT MILLION-DOLLAR OUTAGES    ║
  ║   > DETECT FAILURES 72 HOURS EARLY    ║
  ║   > ENTERPRISE-GRADE INTELLIGENCE     ║
  ║                                       ║
  ╚═══════════════════════════════════════╝
`}
                    </pre>
                    <div className="cta-prompt">
                      <p className="cta-text">
                        <GlitchText>&gt;&gt; EX ALTO OMNIA - FROM ABOVE, ALL THINGS &lt;&lt;</GlitchText>
                      </p>
                      <div className="cta-actions">
                        <a href="tel:+15551234567" className="btn-terminal primary large">
                          <span className="btn-prompt">&gt;_</span> VOICE_CHANNEL
                        </a>
                        <a href="mailto:contact@jinki.io" className="btn-terminal secondary large">
                          <span className="btn-prompt">$</span> DATA_CHANNEL
                        </a>
                      </div>
                      <div className="cta-status">
                        <span className="status-indicator blink">●</span> AWAITING INPUT...
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* FOOTER */}
            <footer className="footer-terminal">
              <div className="footer-content">
                <div className="footer-line">
                  <span className="prompt">[JINKI_INTELLIGENCE]#</span>
                  <span>EX ALTO OMNIA</span>
                </div>
                <div className="footer-line">
                  <span className="muted">© 2026 Jinki Intelligence. All systems operational.</span>
                </div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
