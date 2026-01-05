/* ═══════════════════════════════════════════════════════════════
   TEAM 34 CHAMPION: MONOCHROME SUPREMACY
   300-Team Competition Winner | Apple-Level Minimalism
   ═══════════════════════════════════════════════════════════════ */

import { useEffect } from 'react'
import Lenis from 'lenis'
import './LandingPage3.css'

// Smooth scroll initialization
function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
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

export default function LandingPage3() {
  useSmoothScroll()

  return (
    <div className="page">
      {/* NAV - Minimal */}
      <header className="nav">
        <div className="nav__inner">
          <a href="/" className="nav__logo">
            <span className="nav__logo-text">JINKI</span>
          </a>
          <nav className="nav__links">
            <a href="#services">Services</a>
            <a href="#platform">Platform</a>
            <a href="#about">About</a>
          </nav>
          <a href="#contact" className="nav__cta">Contact</a>
        </div>
      </header>

      {/* HERO - Logo as absolute center */}
      <section className="hero">
        {/* The Logo - ONLY element with color */}
        <img
          src="/jinki-logo.svg"
          alt="Jinki Intelligence"
          className="hero__logo fade-up"
        />

        {/* Tagline */}
        <p className="hero__tagline fade-up fade-up-delay-1">
          Ex Alto Omnia
        </p>

        {/* Single word headline */}
        <h1 className="hero__headline fade-up fade-up-delay-2">
          Omniscient
        </h1>

        {/* Subheadline */}
        <p className="hero__sub fade-up fade-up-delay-3">
          Aerial intelligence and cybersecurity advisory
          for critical infrastructure.
        </p>

        {/* CTA - White outline only */}
        <a href="#contact" className="hero__cta fade-up fade-up-delay-4">
          Schedule Consultation
        </a>

        {/* Scroll indicator */}
        <div className="hero__scroll">
          <span>Scroll</span>
          <div className="hero__scroll-line" />
        </div>
      </section>

      {/* STATS */}
      <div className="stats">
        <div className="stat">
          <div className="stat__number">99.9%</div>
          <div className="stat__label">Uptime</div>
        </div>
        <div className="stat">
          <div className="stat__number">500+</div>
          <div className="stat__label">Deployments</div>
        </div>
        <div className="stat">
          <div className="stat__number">24/7</div>
          <div className="stat__label">Monitoring</div>
        </div>
        <div className="stat">
          <div className="stat__number">0</div>
          <div className="stat__label">Breaches</div>
        </div>
      </div>

      {/* SERVICES */}
      <section id="services" className="section">
        <p className="section__label">Services</p>
        <h2 className="section__title">
          Intelligence.<br />
          Protection.
        </h2>
        <p className="section__text">
          Comprehensive aerial inspection and cybersecurity
          solutions for enterprises that cannot afford to fail.
        </p>

        <div className="services">
          <div className="service">
            <span className="service__number">01</span>
            <h3 className="service__title">Aerial Inspection</h3>
            <p className="service__text">
              Autonomous drone-based thermal and visual inspection
              for data centers, utilities, and critical infrastructure.
            </p>
          </div>
          <div className="service">
            <span className="service__number">02</span>
            <h3 className="service__title">Threat Intelligence</h3>
            <p className="service__text">
              Real-time monitoring and analysis of emerging
              cyber threats targeting your industry.
            </p>
          </div>
          <div className="service">
            <span className="service__number">03</span>
            <h3 className="service__title">Security Advisory</h3>
            <p className="service__text">
              Strategic guidance from former intelligence
              professionals and security architects.
            </p>
          </div>
          <div className="service">
            <span className="service__number">04</span>
            <h3 className="service__title">Compliance</h3>
            <p className="service__text">
              SOC 2, ISO 27001, and NIST framework alignment
              with continuous validation.
            </p>
          </div>
        </div>
      </section>

      {/* PLATFORM */}
      <section id="platform" className="section">
        <p className="section__label">Platform</p>
        <h2 className="section__title">
          See everything.
        </h2>
        <p className="section__text">
          A unified command center for aerial inspection data,
          security posture, and threat intelligence—all in one view.
        </p>

        <div className="features">
          <div className="feature">
            <h3 className="feature__title">Thermal Analysis</h3>
            <p className="feature__text">
              Detect equipment anomalies before they become failures.
              AI-powered hotspot identification with 0.1°C precision.
            </p>
          </div>
          <div className="feature">
            <h3 className="feature__title">Perimeter Defense</h3>
            <p className="feature__text">
              Continuous aerial surveillance with automated
              intrusion detection and response protocols.
            </p>
          </div>
          <div className="feature">
            <h3 className="feature__title">Risk Scoring</h3>
            <p className="feature__text">
              Quantified risk metrics for every asset.
              Prioritize remediation based on business impact.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section">
        <p className="section__label">About</p>
        <h2 className="section__title">
          From on high,<br />
          all things.
        </h2>
        <p className="section__text">
          Jinki Intelligence was founded by former intelligence
          officers and aerospace engineers with a single mission:
          protect critical infrastructure through superior visibility.
        </p>
        <p className="section__text" style={{ marginTop: '24px' }}>
          We see what others cannot. We protect what matters most.
        </p>
      </section>

      {/* CONTACT CTA */}
      <section id="contact" className="section" style={{ textAlign: 'center' }}>
        <p className="section__label">Contact</p>
        <h2 className="section__title">
          Ready?
        </h2>
        <p className="section__text" style={{ margin: '0 auto 48px' }}>
          Schedule a consultation with our team to discuss
          your infrastructure protection needs.
        </p>
        <a href="mailto:contact@jinki.ai" className="hero__cta">
          Get Started
        </a>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer__inner">
          <span className="nav__logo-text" style={{ opacity: 0.5 }}>JINKI</span>
          <nav className="footer__links">
            <a href="#services">Services</a>
            <a href="#platform">Platform</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <span className="footer__copy">© 2024 Jinki Intelligence</span>
        </div>
      </footer>
    </div>
  )
}
