import { useEffect, useState, useRef } from 'react'
import './LandingPage3.css'

export default function LandingPage3() {
  const [navSolid, setNavSolid] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setNavSolid(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Reveal animations
    const reveals = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
          }
        })
      },
      { threshold: 0.1 }
    )
    reveals.forEach((el) => observer.observe(el))

    // Video autoplay
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="page">
      {/* Navigation */}
      <header className={`nav ${navSolid ? 'nav--solid' : ''}`}>
        <div className="nav__inner">
          <a href="#" className="nav__brand">
            <svg className="nav__logo" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="1"/>
              <circle cx="20" cy="20" r="3" fill="currentColor"/>
              <line x1="20" y1="2" x2="20" y2="8" stroke="currentColor" strokeWidth="1"/>
              <line x1="20" y1="32" x2="20" y2="38" stroke="currentColor" strokeWidth="1"/>
              <line x1="2" y1="20" x2="8" y2="20" stroke="currentColor" strokeWidth="1"/>
              <line x1="32" y1="20" x2="38" y2="20" stroke="currentColor" strokeWidth="1"/>
            </svg>
            <span className="nav__wordmark">JINKI</span>
          </a>
          <nav className="nav__links">
            <a href="#solutions">Solutions</a>
            <a href="#platform">Platform</a>
            <a href="#coverage">Coverage</a>
            <a href="#about">About</a>
          </nav>
          <a href="#contact" className="nav__cta">Request Demo</a>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        {/* Video Background */}
        <div className="hero__video-wrap">
          <video
            ref={videoRef}
            className={`hero__video ${videoLoaded ? 'loaded' : ''}`}
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
          <div className="hero__overlay" />
        </div>

        {/* Hero Content */}
        <div className="hero__container">
          <div className="hero__content">
            <p className="hero__eyebrow">Aerial Risk Intelligence</p>
            <h1 className="hero__title">
              See threats before<br />
              <span className="hero__title-accent">they become incidents.</span>
            </h1>
            <p className="hero__subtitle">
              AI-powered drone surveillance protecting Virginia's critical
              data center infrastructure with thermal precision.
            </p>
            <div className="hero__buttons">
              <a href="#contact" className="btn btn--primary">
                Schedule Assessment
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M4 10H16M16 10L10 4M16 10L10 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </a>
              <a href="#platform" className="btn btn--secondary">Watch Demo</a>
            </div>
          </div>

          {/* Stats */}
          <div className="hero__stats">
            <div className="hero__stat">
              <span className="hero__stat-value">99.97%</span>
              <span className="hero__stat-label">Detection Accuracy</span>
            </div>
            <div className="hero__stat">
              <span className="hero__stat-value">&lt;15min</span>
              <span className="hero__stat-label">Full Facility Scan</span>
            </div>
            <div className="hero__stat">
              <span className="hero__stat-value">0.1°C</span>
              <span className="hero__stat-label">Thermal Precision</span>
            </div>
            <div className="hero__stat">
              <span className="hero__stat-value">24/7</span>
              <span className="hero__stat-label">Autonomous Ops</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero__scroll">
          <div className="hero__scroll-line" />
          <span>Scroll</span>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="trust-bar">
        <div className="trust-bar__inner">
          <span className="trust-bar__label">Protecting Infrastructure Across</span>
          <div className="trust-bar__locations">
            <span>Loudoun County</span>
            <span>•</span>
            <span>Prince William</span>
            <span>•</span>
            <span>Fairfax</span>
            <span>•</span>
            <span>Henrico</span>
            <span>•</span>
            <span>I-95 Corridor</span>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="problem reveal">
        <div className="problem__inner">
          <div className="problem__stat">
            <span className="problem__number">13%</span>
            <span className="problem__label">of global data center<br/>capacity is in<br/>Northern Virginia</span>
          </div>
          <div className="problem__content">
            <h2>The stakes have never been higher.</h2>
            <p>
              With power demand doubling and thermal loads intensifying,
              traditional monitoring can't keep pace. Ground-level inspections
              miss critical rooftop threats. You need eyes in the sky.
            </p>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="solutions" className="solutions">
        <div className="solutions__inner">
          <div className="solutions__header reveal">
            <span className="label">Capabilities</span>
            <h2>Comprehensive aerial intelligence.</h2>
            <p>Four critical detection systems working in continuous harmony.</p>
          </div>

          <div className="solutions__grid">
            {[
              {
                icon: '◎',
                title: 'Thermal Mapping',
                desc: '0.1°C precision thermal imaging detects cooling failures, hotspots, and HVAC inefficiencies before they cascade.',
                features: ['Real-time heat signature analysis', 'Cooling system performance scoring', 'Predictive failure alerts']
              },
              {
                icon: '◇',
                title: 'Structural Analysis',
                desc: 'High-resolution imaging identifies roof damage, water pooling, and physical security vulnerabilities.',
                features: ['Roof membrane integrity scans', 'Solar panel efficiency monitoring', 'Perimeter breach detection']
              },
              {
                icon: '▣',
                title: 'Equipment Monitoring',
                desc: 'Track generator status, transformer conditions, and external equipment health from above.',
                features: ['Diesel generator thermal checks', 'Transformer heat signatures', 'Equipment vibration analysis']
              },
              {
                icon: '◐',
                title: 'Predictive Maintenance',
                desc: 'AI models analyze patterns to forecast failures 14-30 days before they occur.',
                features: ['Failure probability scoring', 'Maintenance window optimization', 'Parts lifecycle tracking']
              }
            ].map((item, i) => (
              <article key={i} className="card reveal">
                <span className="card__icon">{item.icon}</span>
                <h3 className="card__title">{item.title}</h3>
                <p className="card__desc">{item.desc}</p>
                <ul className="card__list">
                  {item.features.map((f, j) => (
                    <li key={j}><span className="check">✓</span> {f}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Platform */}
      <section id="platform" className="platform">
        <div className="platform__inner">
          <div className="platform__content reveal">
            <span className="label">Platform</span>
            <h2>Intelligence at a glance.</h2>
            <p>
              A unified command interface designed for data center operations teams.
              No training required. Critical information surfaces automatically.
            </p>
            <div className="platform__features">
              <div className="platform__feature">
                <span className="platform__icon">◉</span>
                <div>
                  <h4>Real-Time Dashboard</h4>
                  <p>Live facility status with automatic alert prioritization</p>
                </div>
              </div>
              <div className="platform__feature">
                <span className="platform__icon">◎</span>
                <div>
                  <h4>Historical Analysis</h4>
                  <p>Trend tracking and comparative reporting across sites</p>
                </div>
              </div>
              <div className="platform__feature">
                <span className="platform__icon">◈</span>
                <div>
                  <h4>API Integration</h4>
                  <p>Direct feeds to your DCIM, BMS, and ticketing systems</p>
                </div>
              </div>
            </div>
          </div>

          <div className="platform__visual reveal">
            <div className="panel">
              <div className="panel__header">
                <div className="panel__dots">
                  <span className="dot dot--red" />
                  <span className="dot dot--yellow" />
                  <span className="dot dot--green" />
                </div>
                <span className="panel__title">Facility Overview — Loudoun Campus</span>
              </div>
              <div className="panel__body">
                <div className="panel__status">
                  <div className="status status--ok"><span className="status__dot" /> Thermal: Normal</div>
                  <div className="status status--warn"><span className="status__dot" /> HVAC Unit 7: Monitor</div>
                  <div className="status status--ok"><span className="status__dot" /> Perimeter: Secure</div>
                </div>
                <div className="panel__heatmap">
                  {[0.2, 0.3, 0.5, 0.3, 0.4, 0.6, 0.8, 0.6, 0.3, 0.4, 0.5, 0.4].map((h, i) => (
                    <div key={i} className="heatmap-cell" style={{ '--heat': h }} />
                  ))}
                </div>
                <div className="panel__footer">
                  Last scan: 4 minutes ago • Next: 11 minutes
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section id="coverage" className="coverage">
        <div className="coverage__inner">
          <div className="coverage__header reveal">
            <span className="label">Coverage</span>
            <h2>Built for Virginia's data center corridor.</h2>
            <p>Rapid deployment across the region's highest-density infrastructure zones.</p>
          </div>

          <div className="coverage__map reveal">
            <svg viewBox="0 0 600 300" className="map-svg">
              <path
                d="M60,150 L100,90 L180,70 L260,55 L360,45 L460,60 L540,100 L530,160 L460,190 L360,210 L260,220 L160,215 L100,190 Z"
                fill="rgba(6, 182, 212, 0.05)"
                stroke="rgba(6, 182, 212, 0.3)"
                strokeWidth="2"
              />
            </svg>
            <div className="map-point map-point--primary" style={{ left: '72%', top: '28%' }}>
              <span className="map-point__pulse" />
              <span className="map-point__dot" />
              <span className="map-point__label">Northern Virginia</span>
            </div>
            <div className="map-point" style={{ left: '55%', top: '55%' }}>
              <span className="map-point__pulse" />
              <span className="map-point__dot" />
              <span className="map-point__label">I-95 Corridor</span>
            </div>
            <div className="map-point" style={{ left: '38%', top: '48%' }}>
              <span className="map-point__pulse" />
              <span className="map-point__dot" />
              <span className="map-point__label">Central VA</span>
            </div>
          </div>

          <div className="coverage__stats reveal">
            <div className="stat-box">
              <span className="stat-box__value">2M+ sq ft</span>
              <span className="stat-box__label">Facility Coverage</span>
            </div>
            <div className="stat-box">
              <span className="stat-box__value">45+</span>
              <span className="stat-box__label">Facilities Monitored</span>
            </div>
            <div className="stat-box">
              <span className="stat-box__value">4hr</span>
              <span className="stat-box__label">Emergency Response</span>
            </div>
            <div className="stat-box">
              <span className="stat-box__value">FAA Part 107</span>
              <span className="stat-box__label">Certified Operations</span>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="about">
        <div className="about__inner reveal">
          <span className="label">About</span>
          <h2>Ex Alto Omnia</h2>
          <p className="about__tagline">From on high, all things.</p>
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
      </section>

      {/* CTA */}
      <section id="contact" className="cta">
        <div className="cta__inner reveal">
          <h2>Protect your infrastructure.</h2>
          <p>
            Schedule a site assessment to see how aerial intelligence can reduce
            your operational risk and extend equipment lifecycles.
          </p>
          <a href="mailto:ops@jinki.ai" className="btn btn--primary btn--lg">
            Request Site Assessment
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M4 10H16M16 10L10 4M16 10L10 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </a>
          <span className="cta__note">Typical assessment completed within 48 hours</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <svg className="footer__logo" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="1"/>
              <circle cx="20" cy="20" r="3" fill="currentColor"/>
            </svg>
            <span>JINKI INTELLIGENCE</span>
          </div>
          <nav className="footer__links">
            <a href="#solutions">Solutions</a>
            <a href="#platform">Platform</a>
            <a href="#coverage">Coverage</a>
            <a href="#about">About</a>
          </nav>
          <div className="footer__legal">
            <span>© 2025 Jinki Intelligence</span>
            <span>•</span>
            <span>FAA Part 107 Certified</span>
            <span>•</span>
            <span>Virginia, USA</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
