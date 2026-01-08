import { useEffect, useState, useRef } from 'react'
import './LandingPage3.css'

export default function LandingPage3() {
  const [navSolid, setNavSolid] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [scrollProgress, setScrollProgress] = useState(0)
  const [pageLoaded, setPageLoaded] = useState(false)
  const videoRef = useRef(null)
  const heroRef = useRef(null)
  const scrollProgressRef = useRef(null)

  useEffect(() => {
    // Page load entrance sequence
    const loadTimer = setTimeout(() => setPageLoaded(true), 100)

    // Scroll handler for nav and progress
    const handleScroll = () => {
      setNavSolid(window.scrollY > 60)

      // Calculate scroll progress
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = Math.min(scrollTop / docHeight, 1)
      setScrollProgress(progress)

      // Update scroll progress bar
      if (scrollProgressRef.current) {
        scrollProgressRef.current.style.transform = `scaleX(${progress})`
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Mouse tracking for 3D effects
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        setMousePos({ x, y })
      }
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    // Reveal animations with IntersectionObserver
    const reveals = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    reveals.forEach((el) => observer.observe(el))

    // Video autoplay
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }

    return () => {
      clearTimeout(loadTimer)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
      observer.disconnect()
    }
  }, [])

  // 3D transform based on mouse position
  const heroTransform = {
    transform: `perspective(1200px) rotateY(${mousePos.x * 3}deg) rotateX(${-mousePos.y * 3}deg)`
  }

  return (
    <div className={`page ${pageLoaded ? 'page--loaded' : 'page--loading'}`}>
      {/* Scroll Progress Indicator */}
      <div className="scroll-progress" ref={scrollProgressRef} />

      {/* ══════════════════════════════════════════════════════════════
          NAVIGATION - Glassmorphism Header
          ══════════════════════════════════════════════════════════════ */}
      <header className={`nav ${navSolid ? 'nav--glass' : ''}`}>
        <div className="nav__container">
          <a href="#" className="nav__brand">
            <div className="nav__logo">
              <svg viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
                <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="24" cy="24" r="3" fill="currentColor"/>
                <line x1="24" y1="0" x2="24" y2="8" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
                <line x1="24" y1="40" x2="24" y2="48" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
                <line x1="0" y1="24" x2="8" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
                <line x1="40" y1="24" x2="48" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
              </svg>
            </div>
            <span className="nav__wordmark">JINKI</span>
          </a>

          <nav className="nav__menu">
            <a href="#solutions" className="nav__link">Solutions</a>
            <a href="#platform" className="nav__link">Platform</a>
            <a href="#coverage" className="nav__link">Coverage</a>
            <a href="#about" className="nav__link">About</a>
          </nav>

          <a href="#contact" className="nav__cta liquid-metal">
            <span>Request Demo</span>
          </a>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          HERO - Immersive Video + Glassmorphism + 3D
          ══════════════════════════════════════════════════════════════ */}
      <section className="hero" ref={heroRef}>
        {/* Video Background Layer */}
        <div className="hero__video-container">
          <video
            ref={videoRef}
            className={`hero__video ${videoLoaded ? 'hero__video--loaded' : ''}`}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
          >
            <source
              src="https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4"
              type="video/mp4"
            />
          </video>
          <div className="hero__gradient-overlay" />
        </div>

        {/* Parallax Depth Layers */}
        <div className="hero__parallax-layer hero__parallax-layer--back">
          <div className="parallax-orb parallax-orb--cyan" />
          <div className="parallax-orb parallax-orb--gold" />
        </div>
        <div className="hero__parallax-layer hero__parallax-layer--mid">
          <div className="parallax-shape parallax-shape--1" />
          <div className="parallax-shape parallax-shape--2" />
        </div>
        <div className="hero__parallax-layer hero__parallax-layer--front">
          <div className="parallax-shape parallax-shape--3" />
          <div className="parallax-shape parallax-shape--4" />
        </div>

        {/* Hero Content */}
        <div className="hero__wrapper">
          <div className="hero__content" style={heroTransform}>
            <div className="hero__badge glass-panel">
              <span className="hero__badge-dot" />
              <span>Aerial Risk Intelligence</span>
            </div>

            <h1 className="hero__headline">
              <span className="hero__headline-line">See threats before</span>
              <span className="hero__headline-accent liquid-text">they become incidents.</span>
            </h1>

            <p className="hero__description">
              AI-powered drone surveillance protecting Virginia's critical
              data center infrastructure with thermal precision.
            </p>

            <div className="hero__actions">
              <a href="#contact" className="btn btn--primary liquid-metal">
                <span>Schedule Assessment</span>
                <svg className="btn__arrow" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="#platform" className="btn btn--glass glass-panel">
                <span>Watch Demo</span>
              </a>
            </div>
          </div>

          {/* Stats Bar - Glass Panel */}
          <div className="hero__stats glass-panel">
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
        </div>

        {/* Scroll Indicator */}
        <div className="hero__scroll">
          <div className="hero__scroll-track">
            <div className="hero__scroll-thumb" />
          </div>
          <span className="hero__scroll-text">Scroll</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TRUST BAR - Locations Served
          ══════════════════════════════════════════════════════════════ */}
      <section className="trust">
        <div className="trust__container">
          <span className="trust__label">Protecting Infrastructure Across</span>
          <div className="trust__list">
            <span>Loudoun County</span>
            <span className="trust__dot">•</span>
            <span>Prince William</span>
            <span className="trust__dot">•</span>
            <span>Fairfax</span>
            <span className="trust__dot">•</span>
            <span>Henrico</span>
            <span className="trust__dot">•</span>
            <span>I-95 Corridor</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PROBLEM - The Challenge
          ══════════════════════════════════════════════════════════════ */}
      <section className="problem">
        <div className="problem__container reveal">
          <div className="problem__metric">
            <span className="problem__number">13%</span>
            <span className="problem__caption">
              of global data center<br/>
              capacity is in<br/>
              Northern Virginia
            </span>
          </div>
          <div className="problem__content">
            <h2 className="problem__title">The stakes have never been higher.</h2>
            <p className="problem__text">
              With power demand doubling and thermal loads intensifying,
              traditional monitoring can't keep pace. Ground-level inspections
              miss critical rooftop threats. You need eyes in the sky.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SOLUTIONS - Capabilities Grid
          ══════════════════════════════════════════════════════════════ */}
      <section id="solutions" className="solutions">
        <div className="solutions__container">
          <header className="solutions__header reveal">
            <span className="section-label">Capabilities</span>
            <h2 className="section-title">Comprehensive aerial intelligence.</h2>
            <p className="section-subtitle">Four critical detection systems working in continuous harmony.</p>
          </header>

          <div className="solutions__grid">
            {[
              {
                icon: (
                  <svg viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="16" cy="16" r="3" fill="currentColor"/>
                  </svg>
                ),
                title: 'Thermal Mapping',
                desc: '0.1°C precision thermal imaging detects cooling failures, hotspots, and HVAC inefficiencies before they cascade.',
                features: ['Real-time heat signature analysis', 'Cooling system performance scoring', 'Predictive failure alerts']
              },
              {
                icon: (
                  <svg viewBox="0 0 32 32" fill="none">
                    <rect x="4" y="4" width="24" height="24" stroke="currentColor" strokeWidth="1.5" rx="2"/>
                    <line x1="4" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1"/>
                    <line x1="16" y1="4" x2="16" y2="28" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                ),
                title: 'Structural Analysis',
                desc: 'High-resolution imaging identifies roof damage, water pooling, and physical security vulnerabilities.',
                features: ['Roof membrane integrity scans', 'Solar panel efficiency monitoring', 'Perimeter breach detection']
              },
              {
                icon: (
                  <svg viewBox="0 0 32 32" fill="none">
                    <rect x="6" y="6" width="20" height="20" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="11" y="11" width="10" height="10" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="16" cy="16" r="2" fill="currentColor"/>
                  </svg>
                ),
                title: 'Equipment Monitoring',
                desc: 'Track generator status, transformer conditions, and external equipment health from above.',
                features: ['Diesel generator thermal checks', 'Transformer heat signatures', 'Equipment vibration analysis']
              },
              {
                icon: (
                  <svg viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M16 2 L16 16 L26 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
                title: 'Predictive Maintenance',
                desc: 'AI models analyze patterns to forecast failures 14-30 days before they occur.',
                features: ['Failure probability scoring', 'Maintenance window optimization', 'Parts lifecycle tracking']
              }
            ].map((item, i) => (
              <article key={i} className="solution-card glass-panel reveal" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="solution-card__icon">{item.icon}</div>
                <h3 className="solution-card__title">{item.title}</h3>
                <p className="solution-card__desc">{item.desc}</p>
                <ul className="solution-card__features">
                  {item.features.map((f, j) => (
                    <li key={j}>
                      <span className="check-icon">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PLATFORM - Dashboard Preview
          ══════════════════════════════════════════════════════════════ */}
      <section id="platform" className="platform">
        <div className="platform__container">
          <div className="platform__content reveal">
            <span className="section-label">Platform</span>
            <h2 className="section-title">Intelligence at a glance.</h2>
            <p className="platform__desc">
              A unified command interface designed for data center operations teams.
              No training required. Critical information surfaces automatically.
            </p>

            <div className="platform__features">
              <div className="platform-feature">
                <div className="platform-feature__icon glass-panel">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="12" cy="12" r="4" fill="currentColor"/>
                  </svg>
                </div>
                <div className="platform-feature__text">
                  <h4>Real-Time Dashboard</h4>
                  <p>Live facility status with automatic alert prioritization</p>
                </div>
              </div>

              <div className="platform-feature">
                <div className="platform-feature__icon glass-panel">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M3 12L7 8L11 14L17 6L21 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="7" cy="8" r="2" fill="currentColor"/>
                    <circle cx="17" cy="6" r="2" fill="currentColor"/>
                  </svg>
                </div>
                <div className="platform-feature__text">
                  <h4>Historical Analysis</h4>
                  <p>Trend tracking and comparative reporting across sites</p>
                </div>
              </div>

              <div className="platform-feature">
                <div className="platform-feature__icon glass-panel">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 9H17M7 13H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="platform-feature__text">
                  <h4>API Integration</h4>
                  <p>Direct feeds to your DCIM, BMS, and ticketing systems</p>
                </div>
              </div>
            </div>
          </div>

          <div className="platform__visual reveal">
            <div className="dashboard glass-panel">
              <div className="dashboard__header">
                <div className="dashboard__dots">
                  <span className="dashboard__dot dashboard__dot--red" />
                  <span className="dashboard__dot dashboard__dot--yellow" />
                  <span className="dashboard__dot dashboard__dot--green" />
                </div>
                <span className="dashboard__title">Facility Overview — Loudoun Campus</span>
              </div>
              <div className="dashboard__body">
                <div className="dashboard__status-list">
                  <div className="status-item status-item--ok">
                    <span className="status-item__indicator" />
                    <span>Thermal: Normal</span>
                  </div>
                  <div className="status-item status-item--warn">
                    <span className="status-item__indicator" />
                    <span>HVAC Unit 7: Monitor</span>
                  </div>
                  <div className="status-item status-item--ok">
                    <span className="status-item__indicator" />
                    <span>Perimeter: Secure</span>
                  </div>
                </div>
                <div className="dashboard__heatmap">
                  {[0.2, 0.35, 0.5, 0.3, 0.45, 0.65, 0.85, 0.6, 0.35, 0.4, 0.55, 0.45].map((heat, i) => (
                    <div
                      key={i}
                      className="heatmap-cell"
                      style={{ '--heat-intensity': heat }}
                    />
                  ))}
                </div>
                <div className="dashboard__footer">
                  Last scan: 4 minutes ago • Next: 11 minutes
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          COVERAGE - Geographic Reach
          ══════════════════════════════════════════════════════════════ */}
      <section id="coverage" className="coverage">
        <div className="coverage__container">
          <header className="coverage__header reveal">
            <span className="section-label">Coverage</span>
            <h2 className="section-title">Built for Virginia's data center corridor.</h2>
            <p className="section-subtitle">Rapid deployment across the region's highest-density infrastructure zones.</p>
          </header>

          <div className="coverage__map reveal">
            <svg className="coverage__map-svg" viewBox="0 0 600 280" preserveAspectRatio="xMidYMid meet">
              {/* Virginia outline simplified */}
              <path
                className="coverage__map-outline"
                d="M50,140 L90,85 L170,65 L255,50 L360,42 L465,55 L545,95 L535,155 L465,185 L360,205 L255,215 L155,210 L90,185 Z"
              />
              {/* Grid lines */}
              <g className="coverage__map-grid" opacity="0.1">
                {[0,1,2,3,4,5].map(i => (
                  <line key={`h${i}`} x1="50" y1={50 + i*40} x2="550" y2={50 + i*40} stroke="currentColor"/>
                ))}
                {[0,1,2,3,4,5,6].map(i => (
                  <line key={`v${i}`} x1={50 + i*85} y1="30" x2={50 + i*85} y2="250" stroke="currentColor"/>
                ))}
              </g>
            </svg>

            {/* Map Points */}
            <div className="map-marker map-marker--primary" style={{ left: '72%', top: '25%' }}>
              <span className="map-marker__pulse" />
              <span className="map-marker__dot" />
              <span className="map-marker__label">Northern Virginia</span>
            </div>
            <div className="map-marker" style={{ left: '55%', top: '55%' }}>
              <span className="map-marker__pulse" />
              <span className="map-marker__dot" />
              <span className="map-marker__label">I-95 Corridor</span>
            </div>
            <div className="map-marker" style={{ left: '38%', top: '48%' }}>
              <span className="map-marker__pulse" />
              <span className="map-marker__dot" />
              <span className="map-marker__label">Central VA</span>
            </div>
          </div>

          <div className="coverage__stats reveal">
            <div className="stat-card glass-panel">
              <span className="stat-card__value">2M+ sq ft</span>
              <span className="stat-card__label">Facility Coverage</span>
            </div>
            <div className="stat-card glass-panel">
              <span className="stat-card__value">45+</span>
              <span className="stat-card__label">Facilities Monitored</span>
            </div>
            <div className="stat-card glass-panel">
              <span className="stat-card__value">4hr</span>
              <span className="stat-card__label">Emergency Response</span>
            </div>
            <div className="stat-card glass-panel">
              <span className="stat-card__value">FAA Part 107</span>
              <span className="stat-card__label">Certified Operations</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          ABOUT - Company Story
          ══════════════════════════════════════════════════════════════ */}
      <section id="about" className="about">
        <div className="about__container reveal">
          <span className="section-label">About</span>
          <h2 className="about__motto">Ex Alto Omnia</h2>
          <p className="about__tagline">From on high, all things.</p>
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
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CTA - Final Call to Action
          ══════════════════════════════════════════════════════════════ */}
      <section id="contact" className="cta">
        <div className="cta__container reveal">
          <h2 className="cta__title">Protect your infrastructure.</h2>
          <p className="cta__desc">
            Schedule a site assessment to see how aerial intelligence can reduce
            your operational risk and extend equipment lifecycles.
          </p>
          <a href="mailto:ops@jinki.ai" className="btn btn--primary btn--lg liquid-metal">
            <span>Request Site Assessment</span>
            <svg className="btn__arrow" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <span className="cta__note">Typical assessment completed within 48 hours</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════════════════════ */}
      <footer className="footer">
        <div className="footer__container">
          <div className="footer__brand">
            <div className="footer__logo">
              <svg viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
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

          <div className="footer__legal">
            <span>© 2025 Jinki Intelligence</span>
            <span className="footer__sep">•</span>
            <span>FAA Part 107 Certified</span>
            <span className="footer__sep">•</span>
            <span>Virginia, USA</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
