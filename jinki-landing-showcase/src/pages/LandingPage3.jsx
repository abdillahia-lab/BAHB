import { useEffect, useState } from 'react'
import './LandingPage3.css'

export default function LandingPage3() {
  const [scrolled, setScrolled] = useState(false)
  const [activeMetric, setActiveMetric] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Reveal animations
    const reveals = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('revealed')),
      { threshold: 0.1 }
    )
    reveals.forEach((el) => observer.observe(el))

    // Metric rotation
    const interval = setInterval(() => setActiveMetric((p) => (p + 1) % 4), 3000)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  const metrics = [
    { value: '99.97%', label: 'Threat Detection Accuracy' },
    { value: '<15min', label: 'Full Facility Scan Time' },
    { value: '0.1°C', label: 'Thermal Precision' },
    { value: '24/7', label: 'Autonomous Monitoring' },
  ]

  return (
    <div className="page">
      {/* Navigation */}
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav__inner">
          <a href="/" className="nav__brand">
            <span className="nav__logo">◉</span>
            <span>JINKI</span>
          </a>
          <nav className="nav__links">
            <a href="#solutions">Solutions</a>
            <a href="#platform">Platform</a>
            <a href="#coverage">Coverage</a>
            <a href="#about">About</a>
          </nav>
          <a href="#contact" className="nav__cta">Request Assessment</a>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__grid"></div>
          <div className="hero__glow"></div>
        </div>
        <div className="hero__content">
          <div className="hero__eyebrow">Aerial Risk Intelligence for Data Centers</div>
          <h1 className="hero__title">
            See threats before<br />they become incidents.
          </h1>
          <p className="hero__subtitle">
            AI-powered drone surveillance protecting Virginia's critical data center infrastructure.
            Thermal anomalies. Equipment faults. Preventative insights. All from above.
          </p>
          <div className="hero__actions">
            <a href="#contact" className="btn btn--primary">
              <span>Schedule Site Assessment</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </a>
            <a href="#platform" className="btn btn--glass">Watch Demo</a>
          </div>
          <div className="hero__metrics">
            {metrics.map((m, i) => (
              <div key={i} className={`hero__metric ${i === activeMetric ? 'active' : ''}`}>
                <span className="hero__metric-value">{m.value}</span>
                <span className="hero__metric-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hero__visual">
          <div className="drone-display">
            <div className="drone-display__ring drone-display__ring--outer"></div>
            <div className="drone-display__ring drone-display__ring--mid"></div>
            <div className="drone-display__ring drone-display__ring--inner"></div>
            <div className="drone-display__core">
              <div className="drone-display__pulse"></div>
              <div className="drone-display__eye"></div>
            </div>
            <div className="drone-display__scan"></div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="trust-bar">
        <div className="trust-bar__inner">
          <span className="trust-bar__label">Protecting Infrastructure Across</span>
          <div className="trust-bar__locations">
            <span>Loudoun County</span>
            <span className="trust-bar__dot">•</span>
            <span>Prince William</span>
            <span className="trust-bar__dot">•</span>
            <span>Fairfax</span>
            <span className="trust-bar__dot">•</span>
            <span>Henrico</span>
            <span className="trust-bar__dot">•</span>
            <span>I-95 Corridor</span>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="problem reveal">
        <div className="problem__inner">
          <div className="problem__stat">
            <span className="problem__number">13%</span>
            <span className="problem__context">of global data center capacity<br/>is in Northern Virginia</span>
          </div>
          <div className="problem__content">
            <h2>The stakes have never been higher.</h2>
            <p>
              With power demand doubling in the next decade and thermal loads intensifying,
              Virginia's data centers face unprecedented operational risks. Traditional
              monitoring can't keep pace. Ground-level inspections miss critical rooftop
              and perimeter threats. You need eyes in the sky.
            </p>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="solutions" className="solutions">
        <div className="solutions__header reveal">
          <span className="label">Capabilities</span>
          <h2>Comprehensive aerial intelligence.</h2>
          <p>Four critical detection systems working in continuous harmony.</p>
        </div>
        <div className="solutions__grid">
          <article className="solution-card reveal">
            <div className="solution-card__icon">
              <svg viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2"/>
                <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="2"/>
                <circle cx="24" cy="24" r="4" fill="currentColor"/>
                <path d="M24 4V12M24 36V44M4 24H12M36 24H44" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3>Thermal Mapping</h3>
            <p>0.1°C precision thermal imaging detects cooling failures, hotspots, and HVAC inefficiencies before they cascade into outages.</p>
            <ul className="solution-card__features">
              <li>Real-time heat signature analysis</li>
              <li>Cooling system performance scoring</li>
              <li>Predictive failure alerts</li>
            </ul>
          </article>
          <article className="solution-card reveal">
            <div className="solution-card__icon">
              <svg viewBox="0 0 48 48" fill="none">
                <path d="M24 4L4 14V34L24 44L44 34V14L24 4Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M4 14L24 24M24 24L44 14M24 24V44" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3>Structural Analysis</h3>
            <p>High-resolution imaging identifies roof damage, water pooling, panel degradation, and physical security vulnerabilities.</p>
            <ul className="solution-card__features">
              <li>Roof membrane integrity scans</li>
              <li>Solar panel efficiency monitoring</li>
              <li>Perimeter breach detection</li>
            </ul>
          </article>
          <article className="solution-card reveal">
            <div className="solution-card__icon">
              <svg viewBox="0 0 48 48" fill="none">
                <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 24H32M24 16V32" stroke="currentColor" strokeWidth="2"/>
                <circle cx="16" cy="16" r="2" fill="currentColor"/>
                <circle cx="32" cy="16" r="2" fill="currentColor"/>
                <circle cx="16" cy="32" r="2" fill="currentColor"/>
                <circle cx="32" cy="32" r="2" fill="currentColor"/>
              </svg>
            </div>
            <h3>Equipment Monitoring</h3>
            <p>Track generator status, transformer conditions, and external equipment health without dispatching ground crews.</p>
            <ul className="solution-card__features">
              <li>Diesel generator thermal checks</li>
              <li>Transformer heat signatures</li>
              <li>Equipment vibration analysis</li>
            </ul>
          </article>
          <article className="solution-card reveal">
            <div className="solution-card__icon">
              <svg viewBox="0 0 48 48" fill="none">
                <path d="M24 4C13 4 4 13 4 24C4 35 13 44 24 44" stroke="currentColor" strokeWidth="2"/>
                <path d="M24 4C35 4 44 13 44 24" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4"/>
                <path d="M24 12V24L32 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Predictive Maintenance</h3>
            <p>AI models analyze historical patterns to forecast failures 14-30 days before they occur, enabling proactive intervention.</p>
            <ul className="solution-card__features">
              <li>Failure probability scoring</li>
              <li>Maintenance window optimization</li>
              <li>Parts lifecycle tracking</li>
            </ul>
          </article>
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
                <span className="platform__feature-icon">◉</span>
                <div>
                  <h4>Real-Time Dashboard</h4>
                  <p>Live facility status with automatic alert prioritization</p>
                </div>
              </div>
              <div className="platform__feature">
                <span className="platform__feature-icon">◎</span>
                <div>
                  <h4>Historical Analysis</h4>
                  <p>Trend tracking and comparative reporting across sites</p>
                </div>
              </div>
              <div className="platform__feature">
                <span className="platform__feature-icon">◈</span>
                <div>
                  <h4>API Integration</h4>
                  <p>Direct feeds to your DCIM, BMS, and ticketing systems</p>
                </div>
              </div>
            </div>
          </div>
          <div className="platform__visual reveal">
            <div className="glass-panel">
              <div className="glass-panel__header">
                <div className="glass-panel__dots">
                  <span></span><span></span><span></span>
                </div>
                <span className="glass-panel__title">Facility Overview — Loudoun Campus</span>
              </div>
              <div className="glass-panel__content">
                <div className="glass-panel__status">
                  <div className="status-item status-item--ok">
                    <span className="status-item__indicator"></span>
                    <span>Thermal: Normal</span>
                  </div>
                  <div className="status-item status-item--warning">
                    <span className="status-item__indicator"></span>
                    <span>HVAC Unit 7: Monitor</span>
                  </div>
                  <div className="status-item status-item--ok">
                    <span className="status-item__indicator"></span>
                    <span>Perimeter: Secure</span>
                  </div>
                </div>
                <div className="glass-panel__grid">
                  <div className="heatmap-cell" style={{'--heat': '0.2'}}></div>
                  <div className="heatmap-cell" style={{'--heat': '0.3'}}></div>
                  <div className="heatmap-cell" style={{'--heat': '0.4'}}></div>
                  <div className="heatmap-cell" style={{'--heat': '0.3'}}></div>
                  <div className="heatmap-cell" style={{'--heat': '0.5'}}></div>
                  <div className="heatmap-cell" style={{'--heat': '0.7'}}></div>
                  <div className="heatmap-cell" style={{'--heat': '0.8'}}></div>
                  <div className="heatmap-cell" style={{'--heat': '0.6'}}></div>
                  <div className="heatmap-cell" style={{'--heat': '0.3'}}></div>
                  <div className="heatmap-cell" style={{'--heat': '0.4'}}></div>
                  <div className="heatmap-cell" style={{'--heat': '0.5'}}></div>
                  <div className="heatmap-cell" style={{'--heat': '0.4'}}></div>
                </div>
                <div className="glass-panel__footer">
                  Last scan: 4 minutes ago • Next scheduled: 11 minutes
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section id="coverage" className="coverage">
        <div className="coverage__header reveal">
          <span className="label">Coverage</span>
          <h2>Built for Virginia's data center corridor.</h2>
          <p>Rapid deployment across the region's highest-density infrastructure zones.</p>
        </div>
        <div className="coverage__map reveal">
          <div className="map-visual">
            <div className="map-visual__state">
              <svg viewBox="0 0 400 200" className="virginia-outline">
                <path d="M50,100 L80,60 L150,50 L200,40 L280,30 L350,50 L380,80 L370,120 L320,140 L250,150 L180,160 L100,150 L60,130 Z"
                      fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <div className="map-visual__hotspot" style={{left: '65%', top: '35%'}}>
                <div className="hotspot__pulse"></div>
                <div className="hotspot__core"></div>
                <span className="hotspot__label">Northern Virginia<br/>Primary Zone</span>
              </div>
              <div className="map-visual__hotspot map-visual__hotspot--secondary" style={{left: '50%', top: '55%'}}>
                <div className="hotspot__pulse"></div>
                <div className="hotspot__core"></div>
                <span className="hotspot__label">I-95 Corridor</span>
              </div>
              <div className="map-visual__hotspot map-visual__hotspot--secondary" style={{left: '35%', top: '50%'}}>
                <div className="hotspot__pulse"></div>
                <div className="hotspot__core"></div>
                <span className="hotspot__label">Central Virginia</span>
              </div>
            </div>
          </div>
        </div>
        <div className="coverage__stats reveal">
          <div className="coverage__stat">
            <span className="coverage__stat-value">2M+ sq ft</span>
            <span className="coverage__stat-label">Facility Coverage</span>
          </div>
          <div className="coverage__stat">
            <span className="coverage__stat-value">45+</span>
            <span className="coverage__stat-label">Facilities Monitored</span>
          </div>
          <div className="coverage__stat">
            <span className="coverage__stat-value">4hr</span>
            <span className="coverage__stat-label">Emergency Response</span>
          </div>
          <div className="coverage__stat">
            <span className="coverage__stat-value">FAA Part 107</span>
            <span className="coverage__stat-label">Certified Operations</span>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="about">
        <div className="about__inner reveal">
          <span className="label">About</span>
          <h2>Ex Alto Omnia</h2>
          <p className="about__tagline">From on high, all things.</p>
          <p className="about__text">
            Jinki Intelligence was founded to solve a critical gap in data center operations:
            the inability to continuously monitor external infrastructure at scale. Our team
            combines aerospace engineering, computer vision expertise, and deep understanding
            of mission-critical facility operations.
          </p>
          <p className="about__text">
            We built our platform specifically for the unique demands of Northern Virginia's
            data center ecosystem—the world's largest concentration of digital infrastructure.
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
            <span>Request Site Assessment</span>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </a>
          <p className="cta__note">Typical assessment completed within 48 hours</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <span className="footer__logo">◉</span>
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
            <span>FAA Part 107 Certified</span>
            <span>Virginia, USA</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
