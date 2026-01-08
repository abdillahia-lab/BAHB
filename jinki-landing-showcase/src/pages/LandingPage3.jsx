import { useEffect } from 'react'
import './LandingPage3.css'

export default function LandingPage3() {
  useEffect(() => {
    // Smooth scroll
    document.documentElement.style.scrollBehavior = 'smooth'

    // Nav scroll effect
    const nav = document.querySelector('.nav')
    const handleScroll = () => {
      nav?.classList.toggle('nav--scrolled', window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Scroll reveal
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

    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="page">
      {/* NAV */}
      <header className="nav">
        <div className="nav__inner">
          <a href="/" className="nav__brand">JINKI</a>
          <nav className="nav__links">
            <a href="#services">Services</a>
            <a href="#platform">Platform</a>
            <a href="#about">About</a>
          </nav>
          <a href="#contact" className="nav__cta">Get Started</a>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero__content">
          <div className="hero__badge">Aerial Intelligence</div>
          <h1 className="hero__title">
            <span className="hero__title-main">Omniscient</span>
            <span className="hero__title-sub">See Everything. Know Everything.</span>
          </h1>
          <p className="hero__desc">
            Advanced aerial surveillance and cybersecurity intelligence for critical infrastructure protection.
          </p>
          <div className="hero__actions">
            <a href="#contact" className="btn btn--primary">Request Demo</a>
            <a href="#platform" className="btn btn--ghost">Learn More</a>
          </div>
        </div>
        <div className="hero__visual">
          <div className="orb">
            <div className="orb__ring orb__ring--1"></div>
            <div className="orb__ring orb__ring--2"></div>
            <div className="orb__ring orb__ring--3"></div>
            <div className="orb__core">
              <div className="orb__glow"></div>
              <div className="orb__center"></div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="stat reveal">
          <span className="stat__value">99.9%</span>
          <span className="stat__label">System Uptime</span>
        </div>
        <div className="stat reveal">
          <span className="stat__value">500+</span>
          <span className="stat__label">Active Deployments</span>
        </div>
        <div className="stat reveal">
          <span className="stat__value">24/7</span>
          <span className="stat__label">Live Monitoring</span>
        </div>
        <div className="stat reveal">
          <span className="stat__value">Zero</span>
          <span className="stat__label">Security Breaches</span>
        </div>
      </section>

      {/* FLOW SECTION */}
      <section className="flow-section">
        <div className="flow-section__header reveal">
          <span className="label">Intelligence Pipeline</span>
          <h2>Data In. Insights Out.</h2>
          <p>Your data sources flow through our intelligence hub, transformed into actionable security insights.</p>
        </div>
        <div className="flow reveal">
          <div className="flow__col">
            <div className="flow__item">
              <div className="flow__icon">●</div>
              <span>Sources</span>
            </div>
            <div className="flow__item">
              <div className="flow__icon">●</div>
              <span>Sensors</span>
            </div>
            <div className="flow__item">
              <div className="flow__icon">●</div>
              <span>Feeds</span>
            </div>
          </div>
          <div className="flow__lines flow__lines--in">
            <svg viewBox="0 0 100 120" preserveAspectRatio="none">
              <path d="M0,20 C50,20 50,60 100,60" />
              <path d="M0,60 C50,60 50,60 100,60" />
              <path d="M0,100 C50,100 50,60 100,60" />
            </svg>
          </div>
          <div className="flow__hub">
            <div className="flow__hub-ring"></div>
            <div className="flow__hub-core"></div>
            <span>JINKI</span>
          </div>
          <div className="flow__lines flow__lines--out">
            <svg viewBox="0 0 100 120" preserveAspectRatio="none">
              <path d="M0,60 C50,60 50,20 100,20" />
              <path d="M0,60 C50,60 50,60 100,60" />
              <path d="M0,60 C50,60 50,100 100,100" />
            </svg>
          </div>
          <div className="flow__col">
            <div className="flow__item">
              <div className="flow__icon">●</div>
              <span>Alerts</span>
            </div>
            <div className="flow__item">
              <div className="flow__icon">●</div>
              <span>Reports</span>
            </div>
            <div className="flow__item">
              <div className="flow__icon">●</div>
              <span>Insights</span>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="services-section">
        <div className="services-section__header reveal">
          <span className="label">What We Do</span>
          <h2>Intelligence. Protection.</h2>
        </div>
        <div className="services-grid">
          <article className="service-card reveal">
            <span className="service-card__num">01</span>
            <h3>Aerial Surveillance</h3>
            <p>Autonomous monitoring and inspection for critical infrastructure and high-value assets.</p>
          </article>
          <article className="service-card reveal">
            <span className="service-card__num">02</span>
            <h3>Threat Detection</h3>
            <p>Real-time identification and analysis of security threats before they become incidents.</p>
          </article>
          <article className="service-card reveal">
            <span className="service-card__num">03</span>
            <h3>Security Advisory</h3>
            <p>Expert guidance from intelligence professionals and security architects.</p>
          </article>
          <article className="service-card reveal">
            <span className="service-card__num">04</span>
            <h3>Compliance</h3>
            <p>SOC 2, ISO 27001, and NIST framework alignment with continuous validation.</p>
          </article>
        </div>
      </section>

      {/* PLATFORM */}
      <section id="platform" className="platform-section">
        <div className="platform-section__header reveal">
          <span className="label">Platform</span>
          <h2>See Everything.</h2>
          <p>A unified command center for aerial data, security posture, and threat intelligence.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card reveal">
            <div className="feature-card__icon">◉</div>
            <h3>Real-Time Analysis</h3>
            <p>Instant processing of aerial and sensor data with AI-powered anomaly detection.</p>
          </div>
          <div className="feature-card reveal">
            <div className="feature-card__icon">◎</div>
            <h3>Unified Dashboard</h3>
            <p>Single pane of glass for all security metrics, alerts, and intelligence feeds.</p>
          </div>
          <div className="feature-card reveal">
            <div className="feature-card__icon">◈</div>
            <h3>Automated Response</h3>
            <p>Pre-configured playbooks trigger instant countermeasures when threats are detected.</p>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="about-section">
        <div className="about-section__content reveal">
          <span className="label">About</span>
          <h2>Ex Alto Omnia</h2>
          <p className="about-section__lead">From on high, all things.</p>
          <p>Jinki Intelligence was founded by former intelligence officers and aerospace engineers with a single mission: protect critical infrastructure through superior visibility.</p>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="cta-section">
        <div className="cta-section__content reveal">
          <h2>Ready to See Everything?</h2>
          <p>Schedule a consultation to discuss your infrastructure protection needs.</p>
          <a href="mailto:contact@jinki.ai" className="btn btn--primary btn--lg">Get Started</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer__inner">
          <span className="footer__brand">JINKI</span>
          <nav className="footer__links">
            <a href="#services">Services</a>
            <a href="#platform">Platform</a>
            <a href="#about">About</a>
          </nav>
          <span className="footer__copy">© 2025 Jinki Intelligence</span>
        </div>
      </footer>
    </div>
  )
}
