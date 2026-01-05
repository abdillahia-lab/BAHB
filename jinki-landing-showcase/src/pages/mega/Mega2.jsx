import { useState, useEffect, useRef } from 'react'
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Lenis from 'lenis'
import './Mega2.css'

// ═══════════════════════════════════════════════════════════════
// DATAVIZ COMPETITOR - Information visualization genius
// Data becomes the visual - charts, graphs, real-time metrics
// ═══════════════════════════════════════════════════════════════

function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])
}

// Real-time metric counter with live animation
function LiveMetric({ value, label, unit = '', trend = 0, format = 'number' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, amount: 0.3 })
  const [display, setDisplay] = useState(0)
  const [trendValue, setTrendValue] = useState(trend)

  useEffect(() => {
    if (!inView) return
    const targetValue = typeof value === 'number' ? value : parseFloat(value)
    const duration = 2000
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(targetValue * eased)
      if (progress < 1) requestAnimationFrame(animate)
    }
    animate()

    // Simulate live fluctuation
    const fluctuate = setInterval(() => {
      setTrendValue(Math.random() * 4 - 2)
    }, 3000)

    return () => clearInterval(fluctuate)
  }, [inView, value])

  const formatValue = (val) => {
    if (format === 'currency') return `$${Math.floor(val).toLocaleString()}`
    if (format === 'percent') return `${Math.floor(val)}%`
    if (format === 'decimal') return val.toFixed(1)
    return Math.floor(val).toLocaleString()
  }

  return (
    <div ref={ref} className="live-metric">
      <div className="live-metric__indicator">
        <span className={`pulse ${trendValue > 0 ? 'pulse--up' : 'pulse--down'}`}></span>
        LIVE
      </div>
      <div className="live-metric__value">
        {formatValue(display)}
        {unit && <span className="live-metric__unit">{unit}</span>}
      </div>
      <div className="live-metric__label">{label}</div>
      <div className="live-metric__trend">
        <span className={trendValue >= 0 ? 'trend-up' : 'trend-down'}>
          {trendValue >= 0 ? '↗' : '↘'} {Math.abs(trendValue).toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

// Animated line chart
function LineChart({ data, label, color = '#00d9ff' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 1500
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const p = Math.min(elapsed / duration, 1)
      setProgress(p)
      if (p < 1) requestAnimationFrame(animate)
    }
    animate()
  }, [inView])

  const width = 400
  const height = 120
  const padding = 20
  const max = Math.max(...data)
  const min = Math.min(...data)

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((val - min) / (max - min)) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  const visiblePoints = points.split(' ').slice(0, Math.floor(data.length * progress)).join(' ')

  return (
    <div ref={ref} className="line-chart">
      <div className="line-chart__label">{label}</div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + ratio * (height - padding * 2)}
            x2={width - padding}
            y2={padding + ratio * (height - padding * 2)}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}

        {/* Area under line */}
        <motion.path
          d={`M ${visiblePoints} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
          fill={`url(#gradient-${label})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: inView ? 0.2 : 0 }}
          transition={{ duration: 1 }}
        />

        {/* Line */}
        <motion.polyline
          points={visiblePoints}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Gradient */}
        <defs>
          <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="line-chart__stats">
        <span className="stat-item">Min: {min}</span>
        <span className="stat-item">Max: {max}</span>
        <span className="stat-item">Avg: {(data.reduce((a,b) => a+b, 0) / data.length).toFixed(1)}</span>
      </div>
    </div>
  )
}

// Radial progress gauge
function RadialGauge({ value, max, label, color = '#00d9ff' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 1800
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const p = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setProgress(eased)
      if (p < 1) requestAnimationFrame(animate)
    }
    animate()
  }, [inView])

  const percentage = (value / max) * 100
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (circumference * percentage * progress) / 100

  return (
    <div ref={ref} className="radial-gauge">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Background circle */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="12"
        />

        {/* Progress circle */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />

        {/* Center text */}
        <text x="70" y="65" textAnchor="middle" className="gauge-value">
          {Math.floor(value * progress)}
        </text>
        <text x="70" y="82" textAnchor="middle" className="gauge-percent">
          {Math.floor(percentage * progress)}%
        </text>
      </svg>
      <div className="radial-gauge__label">{label}</div>
    </div>
  )
}

// Heat map grid
function HeatMap({ title, data }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  const getColor = (value) => {
    if (value > 80) return '#00ff88'
    if (value > 60) return '#00d9ff'
    if (value > 40) return '#ffd700'
    if (value > 20) return '#ff6b35'
    return '#ff3366'
  }

  return (
    <div ref={ref} className="heat-map">
      <div className="heat-map__title">{title}</div>
      <div className="heat-map__grid">
        {data.map((row, i) => (
          <div key={i} className="heat-map__row">
            {row.map((value, j) => (
              <motion.div
                key={j}
                className="heat-map__cell"
                style={{ backgroundColor: getColor(value) }}
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: (i * row.length + j) * 0.02, duration: 0.3 }}
              >
                <span className="cell-value">{value}</span>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
      <div className="heat-map__legend">
        <span style={{ background: '#ff3366' }}>Critical</span>
        <span style={{ background: '#ff6b35' }}>Low</span>
        <span style={{ background: '#ffd700' }}>Medium</span>
        <span style={{ background: '#00d9ff' }}>High</span>
        <span style={{ background: '#00ff88' }}>Optimal</span>
      </div>
    </div>
  )
}

// Bar chart comparison
function BarChart({ data, label }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  const max = Math.max(...data.map(d => d.value))

  return (
    <div ref={ref} className="bar-chart">
      <div className="bar-chart__label">{label}</div>
      <div className="bar-chart__bars">
        {data.map((item, i) => (
          <div key={i} className="bar-item">
            <div className="bar-container">
              <motion.div
                className="bar-fill"
                initial={{ height: 0 }}
                animate={inView ? { height: `${(item.value / max) * 100}%` } : {}}
                transition={{ delay: i * 0.1, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <span className="bar-value">{item.value}</span>
              </motion.div>
            </div>
            <div className="bar-label">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Real-time data stream
function DataStream() {
  const [logs, setLogs] = useState([])
  const scrollRef = useRef(null)

  useEffect(() => {
    const messages = [
      { type: 'success', text: 'Thermal scan complete - 0 hotspots detected' },
      { type: 'info', text: 'LiDAR mapping: 2.4M points/sec - on target' },
      { type: 'warning', text: 'Wind gust detected - autopilot compensating' },
      { type: 'success', text: 'Powerline inspection: sector 4 complete' },
      { type: 'info', text: 'NDVI analysis: crop stress index normal' },
      { type: 'success', text: 'OGI scan complete - no leaks detected' },
      { type: 'info', text: 'RTK GPS: ±0.8cm accuracy maintained' },
      { type: 'success', text: 'Mission waypoint 12/15 reached' },
    ]

    const interval = setInterval(() => {
      const msg = messages[Math.floor(Math.random() * messages.length)]
      setLogs(prev => [...prev.slice(-5), {
        ...msg,
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString()
      }])
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="data-stream">
      <div className="data-stream__header">
        <span className="stream-title">LIVE MISSION TELEMETRY</span>
        <span className="stream-indicator">
          <span className="pulse pulse--active"></span>
          STREAMING
        </span>
      </div>
      <div className="data-stream__logs" ref={scrollRef}>
        {logs.map((log) => (
          <motion.div
            key={log.id}
            className={`log-entry log-entry--${log.type}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="log-time">{log.timestamp}</span>
            <span className="log-text">{log.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Dashboard metric card
function MetricCard({ title, value, unit, change, chart }) {
  return (
    <motion.div
      className="metric-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="metric-card__header">
        <span className="metric-card__title">{title}</span>
        <span className={`metric-card__change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
        </span>
      </div>
      <div className="metric-card__value">
        {value}<span className="metric-card__unit">{unit}</span>
      </div>
      {chart && <div className="metric-card__chart">{chart}</div>}
    </motion.div>
  )
}

export default function Mega2() {
  useSmoothScroll()

  // Sample data
  const detectionData = [45, 52, 48, 61, 58, 72, 68, 79, 85, 88, 91, 94]
  const costSavingsData = [120, 180, 240, 310, 420, 580, 720, 890, 1050, 1280, 1450, 1680]
  const efficiencyData = [62, 65, 71, 74, 78, 82, 85, 88, 90, 92, 94, 96]

  const heatMapData = [
    [94, 91, 88, 95, 92, 89, 93],
    [87, 90, 92, 88, 91, 94, 90],
    [91, 88, 89, 92, 90, 88, 91],
    [93, 95, 91, 89, 93, 92, 94],
    [88, 91, 94, 90, 89, 91, 88],
  ]

  const industryComparison = [
    { label: 'Manual', value: 48 },
    { label: 'Helicopter', value: 72 },
    { label: 'Ground', value: 35 },
    { label: 'Jinki', value: 94 },
  ]

  return (
    <div className="page dataviz-page">
      {/* Animated grid background */}
      <div className="grid-bg">
        <div className="grid-lines"></div>
      </div>

      {/* HEADER */}
      <motion.header
        className="header"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="header__inner">
          <div className="header__logo">
            <span className="logo-icon">◉</span>
            <span className="logo-text">JINKI</span>
            <span className="logo-badge">INTELLIGENCE</span>
          </div>
          <nav className="header__nav">
            <a href="#metrics">Metrics</a>
            <a href="#performance">Performance</a>
            <a href="#dashboard">Dashboard</a>
          </nav>
          <button className="btn btn--primary">
            <span className="pulse pulse--white"></span>
            Live Demo
          </button>
        </div>
      </motion.header>

      {/* HERO - Dashboard Style */}
      <section className="hero-dashboard">
        <motion.div
          className="hero-dashboard__content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="hero-dashboard__eyebrow">
            <span className="pulse pulse--cyan"></span>
            REAL-TIME INTELLIGENCE PLATFORM
          </div>
          <h1 className="hero-dashboard__title">
            Data-Driven <span className="gradient-text">Aerial Intelligence</span>
          </h1>
          <p className="hero-dashboard__subtitle">
            Every mission generates 2.4M data points per second. Turn overwhelming data into actionable insights.
          </p>
        </motion.div>

        {/* Live metrics grid */}
        <div className="metrics-grid">
          <LiveMetric value={94.2} label="Fault Detection Rate" unit="%" format="decimal" trend={2.3} />
          <LiveMetric value={700000} label="Avg Outage Prevented" format="currency" trend={-0.5} />
          <LiveMetric value={58} label="Cost Reduction" unit="%" format="number" trend={1.8} />
          <LiveMetric value={72} label="Early Warning" unit="hrs" format="number" trend={3.2} />
        </div>

        {/* Mini charts */}
        <div className="hero-charts">
          <LineChart data={detectionData} label="Detection Accuracy (%)" color="#00ff88" />
          <LineChart data={costSavingsData} label="Cost Savings ($K)" color="#00d9ff" />
          <LineChart data={efficiencyData} label="Operational Efficiency (%)" color="#ffd700" />
        </div>
      </section>

      {/* PERFORMANCE DASHBOARD */}
      <section id="performance" className="section-dashboard">
        <motion.div
          className="section-header"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span className="section-eyebrow">PERFORMANCE METRICS</span>
          <h2>Industry-Leading Precision</h2>
          <p>Validated across 1,200+ missions spanning 47,000 inspection hours</p>
        </motion.div>

        <div className="dashboard-grid">
          {/* Radial gauges */}
          <div className="gauge-group">
            <RadialGauge value={94} max={100} label="Detection Accuracy" color="#00ff88" />
            <RadialGauge value={88} max={100} label="System Uptime" color="#00d9ff" />
            <RadialGauge value={96} max={100} label="Data Quality" color="#ffd700" />
            <RadialGauge value={91} max={100} label="Client Satisfaction" color="#ff6b35" />
          </div>

          {/* Heat map */}
          <div className="dashboard-section">
            <HeatMap
              title="Thermal Accuracy by Sector (%)"
              data={heatMapData}
            />
          </div>

          {/* Bar chart */}
          <div className="dashboard-section">
            <BarChart
              data={industryComparison}
              label="Defect Detection Comparison (%)"
            />
          </div>

          {/* Data stream */}
          <div className="dashboard-section">
            <DataStream />
          </div>
        </div>
      </section>

      {/* INDUSTRY SOLUTIONS */}
      <section id="solutions" className="section-industries">
        <motion.div
          className="section-header"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span className="section-eyebrow">INDUSTRY SOLUTIONS</span>
          <h2>Proven ROI Across Sectors</h2>
        </motion.div>

        <div className="industry-cards">
          <MetricCard
            title="Data Centers"
            value="$700K"
            unit="/outage prevented"
            change={12.3}
            chart={
              <div className="mini-chart">
                {[72, 84, 78, 91, 88, 95].map((h, i) => (
                  <div key={i} className="mini-bar" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            }
          />

          <MetricCard
            title="Electric Utilities"
            value="60"
            unit="% cost reduction"
            change={8.7}
            chart={
              <div className="mini-chart">
                {[65, 71, 68, 78, 82, 88].map((h, i) => (
                  <div key={i} className="mini-bar" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            }
          />

          <MetricCard
            title="Agriculture"
            value="14"
            unit=" days earlier"
            change={15.2}
            chart={
              <div className="mini-chart">
                {[58, 64, 72, 79, 85, 91].map((h, i) => (
                  <div key={i} className="mini-bar" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            }
          />

          <MetricCard
            title="Oil & Gas"
            value="99.2"
            unit="% detection"
            change={6.4}
            chart={
              <div className="mini-chart">
                {[88, 91, 89, 94, 96, 99].map((h, i) => (
                  <div key={i} className="mini-bar" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            }
          />
        </div>
      </section>

      {/* TECHNOLOGY SPECS */}
      <section className="section-specs">
        <motion.div
          className="section-header"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span className="section-eyebrow">TECHNICAL SPECIFICATIONS</span>
          <h2>Military-Grade Precision</h2>
        </motion.div>

        <div className="specs-grid">
          <div className="spec-card">
            <div className="spec-icon">🌡️</div>
            <div className="spec-value">0.05°C</div>
            <div className="spec-label">Thermal Sensitivity</div>
            <div className="spec-chart">
              <svg width="100%" height="40" viewBox="0 0 200 40">
                <motion.rect
                  x="0" y="15" height="10" rx="5"
                  initial={{ width: 0 }}
                  whileInView={{ width: 190 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.2 }}
                  fill="url(#temp-gradient)"
                />
                <defs>
                  <linearGradient id="temp-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00d9ff" />
                    <stop offset="100%" stopColor="#ff3366" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <div className="spec-card">
            <div className="spec-icon">📡</div>
            <div className="spec-value">2.4M</div>
            <div className="spec-label">LiDAR pts/sec</div>
            <div className="spec-chart">
              <svg width="100%" height="40" viewBox="0 0 200 40">
                {[...Array(20)].map((_, i) => (
                  <motion.circle
                    key={i}
                    cx={10 + i * 10}
                    cy="20"
                    r="2"
                    fill="#00ff88"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  />
                ))}
              </svg>
            </div>
          </div>

          <div className="spec-card">
            <div className="spec-icon">🎯</div>
            <div className="spec-value">±1cm</div>
            <div className="spec-label">RTK Accuracy</div>
            <div className="spec-chart">
              <svg width="100%" height="40" viewBox="0 0 200 40">
                <motion.circle
                  cx="100" cy="20" r="15"
                  stroke="#ffd700" strokeWidth="2" fill="none"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                />
                <circle cx="100" cy="20" r="3" fill="#ffd700" />
              </svg>
            </div>
          </div>

          <div className="spec-card">
            <div className="spec-icon">⚡</div>
            <div className="spec-value">59min</div>
            <div className="spec-label">Flight Time</div>
            <div className="spec-chart">
              <svg width="100%" height="40" viewBox="0 0 200 40">
                <motion.path
                  d="M 10,20 Q 100,5 190,20"
                  stroke="#00d9ff" strokeWidth="3" fill="none"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5 }}
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-cta">
        <motion.div
          className="cta-dashboard"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="cta-dashboard__stats">
            <div className="stat-large">
              <span className="stat-large__value">2.4M+</span>
              <span className="stat-large__label">Data Points/Second</span>
            </div>
            <div className="stat-large">
              <span className="stat-large__value">47K+</span>
              <span className="stat-large__label">Inspection Hours</span>
            </div>
            <div className="stat-large">
              <span className="stat-large__value">$42M+</span>
              <span className="stat-large__label">Losses Prevented</span>
            </div>
          </div>

          <h2>Transform Data Into Decisions</h2>
          <p>Schedule a live demonstration. See your infrastructure through data-driven eyes.</p>

          <div className="cta-actions">
            <button className="btn btn--cta">
              <span className="pulse pulse--white"></span>
              Request Live Dashboard
            </button>
            <button className="btn btn--ghost">View Sample Report</button>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <span className="footer__logo">◉ JINKI INTELLIGENCE</span>
            <span className="footer__tagline">Data-Driven Aerial Intelligence</span>
          </div>
          <div className="footer__stats">
            <span>2.4M pts/sec</span>
            <span>94% accuracy</span>
            <span>$42M+ saved</span>
          </div>
          <span className="footer__copy">© 2026 Jinki Intelligence. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
