import { useEffect, useState, useRef, useCallback } from 'react'
import './LandingPage3.css'

export default function LandingPage3() {
  const [scrollY, setScrollY] = useState(0)
  const [navVisible, setNavVisible] = useState(true)
  const [navSolid, setNavSolid] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false)
  const lastScrollY = useRef(0)
  const videoRef = useRef(null)
  const heroRef = useRef(null)

  // Smooth scroll handler with parallax
  const handleScroll = useCallback(() => {
    const current = window.scrollY
    setScrollY(current)
    setNavVisible(current < lastScrollY.current || current < 100)
    setNavSolid(current > 50)
    lastScrollY.current = current
  }, [])

  // Custom cursor tracking
  const handleMouseMove = useCallback((e) => {
    setCursorPos({ x: e.clientX, y: e.clientY })
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    // Intersection Observer for section tracking and reveal animations
    const sections = document.querySelectorAll('section[id]')
    const reveals = document.querySelectorAll('.reveal')

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.3 }
    )

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    sections.forEach((section) => sectionObserver.observe(section))
    reveals.forEach((el) => revealObserver.observe(el))

    // Video autoplay handling
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
      sectionObserver.disconnect()
      revealObserver.disconnect()
    }
  }, [handleScroll, handleMouseMove])

  // Parallax calculation
  const heroParallax = Math.min(scrollY * 0.4, 300)
  const heroOpacity = Math.max(1 - scrollY / 600, 0)

  return (
    <div className="jinki-page">
      {/* Custom Cursor */}
      <div
        className={`cursor-glow ${isHoveringInteractive ? 'cursor-glow--active' : ''}`}
        style={{
          transform: `translate(${cursorPos.x - 16}px, ${cursorPos.y - 16}px)`
        }}
      />

      {/* Navigation */}
      <header className={`nav ${navVisible ? '' : 'nav--hidden'} ${navSolid ? 'nav--solid' : ''}`}>
        <div className="nav__container">
          <a
            href="#hero"
            className="nav__brand"
            onMouseEnter={() => setIsHoveringInteractive(true)}
            onMouseLeave={() => setIsHoveringInteractive(false)}
          >
            <div className="nav__logo-mark">
              <svg viewBox="0 0 40 40" className="nav__logo-svg">
                <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="1"/>
                <circle cx="20" cy="20" r="6" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                <circle cx="20" cy="20" r="3" fill="currentColor"/>
                <line x1="20" y1="2" x2="20" y2="8" stroke="currentColor" strokeWidth="1"/>
                <line x1="20" y1="32" x2="20" y2="38" stroke="currentColor" strokeWidth="1"/>
                <line x1="2" y1="20" x2="8" y2="20" stroke="currentColor" strokeWidth="1"/>
                <line x1="32" y1="20" x2="38" y2="20" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </div>
            <span className="nav__wordmark">JINKI</span>
          </a>

          <nav className="nav__links">
            {['Solutions', 'Platform', 'Coverage', 'About'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={`nav__link ${activeSection === item.toLowerCase() ? 'nav__link--active' : ''}`}
                onMouseEnter={() => setIsHoveringInteractive(true)}
                onMouseLeave={() => setIsHoveringInteractive(false)}
              >
                <span className="nav__link-text">{item}</span>
                <span className="nav__link-underline" />
              </a>
            ))}
          </nav>

          <a
            href="#contact"
            className="nav__cta"
            onMouseEnter={() => setIsHoveringInteractive(true)}
            onMouseLeave={() => setIsHoveringInteractive(false)}
          >
            <span>Request Demo</span>
            <svg className="nav__cta-arrow" viewBox="0 0 16 16" fill="none">
              <path d="M4 8H12M12 8L8 4M12 8L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </header>

      {/* Hero Section with Video Background */}
      <section id="hero" className="hero" ref={heroRef}>
        {/* Video Background */}
        <div className="hero__video-container">
          <video
            ref={videoRef}
            className={`hero__video ${videoLoaded ? 'hero__video--loaded' : ''}`}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect fill='%23000'/%3E%3C/svg%3E"
          >
            {/* Free 4K drone footage from Pexels - Aerial city view */}
            <source
              src="https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4"
              type="video/mp4"
            />
          </video>
          <div className="hero__video-overlay" />
          <div className="hero__gradient-overlay" />
        </div>

        {/* Parallax Background Elements */}
        <div
          className="hero__parallax-layer hero__parallax-layer--grid"
          style={{ transform: `translateY(${heroParallax * 0.5}px)` }}
        >
          <div className="hero__grid-pattern" />
        </div>

        {/* ASCII Art Accent */}
        <div
          className="hero__ascii-accent"
          style={{
            transform: `translateY(${heroParallax * 0.3}px)`,
            opacity: heroOpacity
          }}
        >
          <pre className="ascii-art">
{`    ╭──────────────────────────────╮
    │  ◉ AERIAL INTELLIGENCE GRID  │
    ├──────────────────────────────┤
    │  ┌─────┐   ┌─────┐   ┌─────┐ │
    │  │ ░░░ │───│ ▓▓▓ │───│ ███ │ │
    │  └──┬──┘   └──┬──┘   └──┬──┘ │
    │     │        │        │     │
    │     └────────┴────────┘     │
    │          ▼ DATA ▼           │
    ╰──────────────────────────────╯`}
          </pre>
        </div>

        {/* Hero Content */}
        <div
          className="hero__content"
          style={{
            transform: `translateY(${heroParallax}px)`,
            opacity: heroOpacity
          }}
        >
          <div className="hero__eyebrow">
            <span className="hero__eyebrow-line" />
            <span className="hero__eyebrow-text">Aerial Risk Intelligence</span>
            <span className="hero__eyebrow-line" />
          </div>

          <h1 className="hero__title">
            <span className="hero__title-line hero__title-line--1">
              <span className="hero__word">See</span>
              <span className="hero__word">threats</span>
            </span>
            <span className="hero__title-line hero__title-line--2">
              <span className="hero__word">before</span>
              <span className="hero__word">they</span>
            </span>
            <span className="hero__title-line hero__title-line--3">
              <span className="hero__word hero__word--accent">become</span>
              <span className="hero__word hero__word--accent">incidents.</span>
            </span>
          </h1>

          <p className="hero__subtitle">
            AI-powered drone surveillance protecting Virginia's critical
            data center infrastructure with thermal precision.
          </p>

          <div className="hero__actions">
            <a
              href="#contact"
              className="btn btn--primary"
              onMouseEnter={() => setIsHoveringInteractive(true)}
              onMouseLeave={() => setIsHoveringInteractive(false)}
            >
              <span className="btn__text">Schedule Assessment</span>
              <span className="btn__icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="btn__glow" />
            </a>
            <a
              href="#platform"
              className="btn btn--glass"
              onMouseEnter={() => setIsHoveringInteractive(true)}
              onMouseLeave={() => setIsHoveringInteractive(false)}
            >
              <span className="btn__play-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.14v14l11-7-11-7z"/>
                </svg>
              </span>
              <span className="btn__text">Watch Demo</span>
            </a>
          </div>
        </div>

        {/* Hero Stats Bar */}
        <div className="hero__stats" style={{ opacity: heroOpacity }}>
          <div className="hero__stat">
            <span className="hero__stat-value">99.97%</span>
            <span className="hero__stat-label">Detection Accuracy</span>
          </div>
          <div className="hero__stat-divider" />
          <div className="hero__stat">
            <span className="hero__stat-value">&lt;15min</span>
            <span className="hero__stat-label">Full Facility Scan</span>
          </div>
          <div className="hero__stat-divider" />
          <div className="hero__stat">
            <span className="hero__stat-value">0.1°C</span>
            <span className="hero__stat-label">Thermal Precision</span>
          </div>
          <div className="hero__stat-divider" />
          <div className="hero__stat">
            <span className="hero__stat-value">24/7</span>
            <span className="hero__stat-label">Autonomous Ops</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="hero__scroll-indicator">
          <div className="hero__scroll-mouse">
            <div className="hero__scroll-wheel" />
          </div>
          <span className="hero__scroll-text">Scroll to explore</span>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="trust-bar">
        <div className="trust-bar__container">
          <span className="trust-bar__label">Protecting Critical Infrastructure</span>
          <div className="trust-bar__marquee">
            <div className="trust-bar__track">
              {['Loudoun County', 'Prince William', 'Fairfax', 'Henrico', 'I-95 Corridor', 'Loudoun County', 'Prince William', 'Fairfax', 'Henrico', 'I-95 Corridor'].map((loc, i) => (
                <span key={i} className="trust-bar__item">
                  <span className="trust-bar__dot">◆</span>
                  {loc}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement with 3D Card */}
      <section id="problem" className="problem">
        <div className="problem__container">
          <div className="problem__3d-card reveal">
            <div className="problem__card-inner">
              <div className="problem__stat-side">
                <span className="problem__big-number">13%</span>
                <span className="problem__stat-context">of global data center<br/>capacity is in<br/>Northern Virginia</span>
              </div>
              <div className="problem__content-side">
                <h2 className="problem__heading">The stakes have never been higher.</h2>
                <p className="problem__text">
                  With power demand doubling and thermal loads intensifying,
                  traditional monitoring can't keep pace. Ground-level inspections
                  miss critical rooftop threats. You need eyes in the sky.
                </p>
                <div className="problem__accent-line" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section id="solutions" className="solutions">
        <div className="solutions__container">
          <div className="solutions__header reveal">
            <span className="section-label">Capabilities</span>
            <h2 className="section-title">Comprehensive aerial intelligence.</h2>
            <p className="section-subtitle">Four critical detection systems working in continuous harmony.</p>
          </div>

          <div className="solutions__grid">
            {[
              {
                icon: (
                  <svg viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="1"/>
                    <circle cx="32" cy="32" r="3" fill="currentColor"/>
                    <path d="M32 4V14M32 50V60M4 32H14M50 32H60" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                ),
                title: 'Thermal Mapping',
                description: '0.1°C precision thermal imaging detects cooling failures, hotspots, and HVAC inefficiencies before they cascade.',
                features: ['Real-time heat signature analysis', 'Cooling system performance scoring', 'Predictive failure alerts']
              },
              {
                icon: (
                  <svg viewBox="0 0 64 64" fill="none">
                    <path d="M32 4L4 18V46L32 60L60 46V18L32 4Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M4 18L32 32M32 32L60 18M32 32V60" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="32" cy="32" r="6" fill="currentColor" fillOpacity="0.3" stroke="currentColor"/>
                  </svg>
                ),
                title: 'Structural Analysis',
                description: 'High-resolution imaging identifies roof damage, water pooling, and physical security vulnerabilities.',
                features: ['Roof membrane integrity scans', 'Solar panel efficiency monitoring', 'Perimeter breach detection']
              },
              {
                icon: (
                  <svg viewBox="0 0 64 64" fill="none">
                    <rect x="8" y="8" width="48" height="48" rx="6" stroke="currentColor" strokeWidth="2"/>
                    <path d="M20 32H44M32 20V44" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="20" cy="20" r="4" fill="currentColor"/>
                    <circle cx="44" cy="20" r="4" fill="currentColor"/>
                    <circle cx="20" cy="44" r="4" fill="currentColor"/>
                    <circle cx="44" cy="44" r="4" fill="currentColor"/>
                  </svg>
                ),
                title: 'Equipment Monitoring',
                description: 'Track generator status, transformer conditions, and external equipment health from above.',
                features: ['Diesel generator thermal checks', 'Transformer heat signatures', 'Equipment vibration analysis']
              },
              {
                icon: (
                  <svg viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2"/>
                    <path d="M32 10V32L44 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="32" cy="32" r="4" fill="currentColor"/>
                  </svg>
                ),
                title: 'Predictive Maintenance',
                description: 'AI models analyze patterns to forecast failures 14-30 days before they occur.',
                features: ['Failure probability scoring', 'Maintenance window optimization', 'Parts lifecycle tracking']
              }
            ].map((solution, index) => (
              <article
                key={index}
                className="solution-card reveal"
                style={{ '--delay': `${index * 0.1}s` }}
                onMouseEnter={() => setIsHoveringInteractive(true)}
                onMouseLeave={() => setIsHoveringInteractive(false)}
              >
                <div className="solution-card__icon">{solution.icon}</div>
                <h3 className="solution-card__title">{solution.title}</h3>
                <p className="solution-card__description">{solution.description}</p>
                <ul className="solution-card__features">
                  {solution.features.map((feature, i) => (
                    <li key={i}>
                      <span className="solution-card__check">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="solution-card__shine" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Section with Glass Panel */}
      <section id="platform" className="platform">
        <div className="platform__container">
          <div className="platform__content reveal">
            <span className="section-label">Platform</span>
            <h2 className="section-title">Intelligence at a glance.</h2>
            <p className="section-subtitle">
              A unified command interface designed for data center operations teams.
              No training required. Critical information surfaces automatically.
            </p>

            <div className="platform__features">
              {[
                { icon: '◉', title: 'Real-Time Dashboard', desc: 'Live facility status with automatic alert prioritization' },
                { icon: '◎', title: 'Historical Analysis', desc: 'Trend tracking and comparative reporting across sites' },
                { icon: '◈', title: 'API Integration', desc: 'Direct feeds to your DCIM, BMS, and ticketing systems' }
              ].map((feature, i) => (
                <div key={i} className="platform__feature">
                  <span className="platform__feature-icon">{feature.icon}</span>
                  <div className="platform__feature-content">
                    <h4>{feature.title}</h4>
                    <p>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="platform__visual reveal">
            <div className="glass-panel">
              <div className="glass-panel__header">
                <div className="glass-panel__controls">
                  <span className="glass-panel__control glass-panel__control--close" />
                  <span className="glass-panel__control glass-panel__control--minimize" />
                  <span className="glass-panel__control glass-panel__control--maximize" />
                </div>
                <span className="glass-panel__title">Facility Overview — Loudoun Campus</span>
              </div>
              <div className="glass-panel__body">
                <div className="glass-panel__status-row">
                  <div className="status-badge status-badge--success">
                    <span className="status-badge__dot" />
                    <span>Thermal: Normal</span>
                  </div>
                  <div className="status-badge status-badge--warning">
                    <span className="status-badge__dot" />
                    <span>HVAC Unit 7: Monitor</span>
                  </div>
                  <div className="status-badge status-badge--success">
                    <span className="status-badge__dot" />
                    <span>Perimeter: Secure</span>
                  </div>
                </div>
                <div className="glass-panel__heatmap">
                  {[0.2, 0.3, 0.5, 0.3, 0.4, 0.6, 0.8, 0.6, 0.3, 0.4, 0.5, 0.4, 0.2, 0.3, 0.4, 0.3].map((heat, i) => (
                    <div key={i} className="heatmap-cell" style={{ '--heat': heat }} />
                  ))}
                </div>
                <div className="glass-panel__footer">
                  <span className="glass-panel__timestamp">Last scan: 4 minutes ago</span>
                  <span className="glass-panel__next">Next: 11 minutes</span>
                </div>
              </div>
            </div>
            <div className="glass-panel__reflection" />
          </div>
        </div>
      </section>

      {/* Coverage Map */}
      <section id="coverage" className="coverage">
        <div className="coverage__container">
          <div className="coverage__header reveal">
            <span className="section-label">Coverage</span>
            <h2 className="section-title">Built for Virginia's data center corridor.</h2>
            <p className="section-subtitle">Rapid deployment across the region's highest-density infrastructure zones.</p>
          </div>

          <div className="coverage__map-wrapper reveal">
            <div className="coverage__map">
              {/* Stylized Virginia Map */}
              <svg viewBox="0 0 600 300" className="coverage__svg">
                <defs>
                  <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(6, 182, 212, 0.1)" />
                    <stop offset="100%" stopColor="rgba(6, 182, 212, 0.02)" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                {/* Virginia outline */}
                <path
                  d="M60,150 L100,90 L180,70 L260,55 L360,45 L460,60 L540,100 L530,160 L460,190 L360,210 L260,220 L160,215 L100,190 Z"
                  fill="url(#mapGradient)"
                  stroke="rgba(6, 182, 212, 0.3)"
                  strokeWidth="2"
                />
                {/* Grid lines */}
                {[0,1,2,3,4].map(i => (
                  <line key={`h${i}`} x1="60" y1={70 + i*40} x2="540" y2={70 + i*40} stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1"/>
                ))}
                {[0,1,2,3,4,5,6].map(i => (
                  <line key={`v${i}`} x1={100 + i*70} y1="45" x2={100 + i*70} y2="220" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1"/>
                ))}
              </svg>

              {/* Hotspots */}
              <div className="coverage__hotspot coverage__hotspot--primary" style={{ left: '70%', top: '30%' }}>
                <div className="hotspot__rings">
                  <span className="hotspot__ring hotspot__ring--1" />
                  <span className="hotspot__ring hotspot__ring--2" />
                  <span className="hotspot__ring hotspot__ring--3" />
                </div>
                <div className="hotspot__core" />
                <div className="hotspot__label">
                  <strong>Northern Virginia</strong>
                  <span>Primary Zone</span>
                </div>
              </div>

              <div className="coverage__hotspot coverage__hotspot--secondary" style={{ left: '55%', top: '55%' }}>
                <div className="hotspot__rings">
                  <span className="hotspot__ring hotspot__ring--1" />
                  <span className="hotspot__ring hotspot__ring--2" />
                </div>
                <div className="hotspot__core" />
                <div className="hotspot__label">
                  <strong>I-95 Corridor</strong>
                </div>
              </div>

              <div className="coverage__hotspot coverage__hotspot--secondary" style={{ left: '40%', top: '50%' }}>
                <div className="hotspot__rings">
                  <span className="hotspot__ring hotspot__ring--1" />
                  <span className="hotspot__ring hotspot__ring--2" />
                </div>
                <div className="hotspot__core" />
                <div className="hotspot__label">
                  <strong>Central Virginia</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="coverage__stats reveal">
            {[
              { value: '2M+ sq ft', label: 'Facility Coverage' },
              { value: '45+', label: 'Facilities Monitored' },
              { value: '4hr', label: 'Emergency Response' },
              { value: 'FAA Part 107', label: 'Certified Operations' }
            ].map((stat, i) => (
              <div key={i} className="coverage__stat">
                <span className="coverage__stat-value">{stat.value}</span>
                <span className="coverage__stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="about__container">
          <div className="about__content reveal">
            <span className="section-label">About</span>
            <h2 className="about__motto">Ex Alto Omnia</h2>
            <p className="about__motto-translation">From on high, all things.</p>
            <div className="about__text">
              <p>
                Jinki Intelligence was founded to solve a critical gap in data center
                operations: the inability to continuously monitor external infrastructure
                at scale. Our team combines aerospace engineering, computer vision expertise,
                and deep understanding of mission-critical facility operations.
              </p>
              <p>
                We built our platform specifically for Northern Virginia's data center
                ecosystem—the world's largest concentration of digital infrastructure.
              </p>
            </div>
          </div>

          {/* ASCII Art Signature */}
          <div className="about__ascii reveal">
            <pre className="ascii-signature">
{`╔═══════════════════════════════════════╗
║                                       ║
║     ▄▄▄▄ ▄▄▄ ▄   ▄ ▄  ▄ ▄▄▄▄          ║
║       █    █  █▀▄ █ █▄▀    █          ║
║     ▄▄█  ▄▄█  █  ██ █  █ ▄▄█          ║
║                                       ║
║         I N T E L L I G E N C E       ║
║                                       ║
║    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     ║
║                                       ║
║      ◉ Aerial Risk Intelligence       ║
║      ◉ Data Center Protection         ║
║      ◉ Predictive Analytics           ║
║                                       ║
╚═══════════════════════════════════════╝`}
            </pre>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="cta">
        <div className="cta__container">
          <div className="cta__content reveal">
            <h2 className="cta__title">Protect your infrastructure.</h2>
            <p className="cta__subtitle">
              Schedule a site assessment to see how aerial intelligence
              can reduce your operational risk and extend equipment lifecycles.
            </p>
            <div className="cta__actions">
              <a
                href="mailto:ops@jinki.ai"
                className="btn btn--primary btn--lg"
                onMouseEnter={() => setIsHoveringInteractive(true)}
                onMouseLeave={() => setIsHoveringInteractive(false)}
              >
                <span className="btn__text">Request Site Assessment</span>
                <span className="btn__icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="btn__glow" />
              </a>
            </div>
            <p className="cta__note">Typical assessment completed within 48 hours</p>
          </div>
        </div>

        {/* CTA Background Effects */}
        <div className="cta__bg">
          <div className="cta__gradient" />
          <div className="cta__grid" />
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer__container">
          <div className="footer__brand">
            <div className="footer__logo">
              <svg viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="1"/>
                <circle cx="20" cy="20" r="3" fill="currentColor"/>
              </svg>
            </div>
            <span className="footer__wordmark">JINKI INTELLIGENCE</span>
          </div>

          <nav className="footer__nav">
            <a href="#solutions">Solutions</a>
            <a href="#platform">Platform</a>
            <a href="#coverage">Coverage</a>
            <a href="#about">About</a>
          </nav>

          <div className="footer__info">
            <span>© 2025 Jinki Intelligence</span>
            <span className="footer__divider">•</span>
            <span>FAA Part 107 Certified</span>
            <span className="footer__divider">•</span>
            <span>Virginia, USA</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
