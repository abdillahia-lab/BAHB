import { useEffect, useRef } from 'react'
import './LandingPage3.css'

export default function LandingPage3() {
  const logoRef = useRef(null)

  // Smooth scroll
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
  }, [])

  // Nav scroll effect
  useEffect(() => {
    const nav = document.querySelector('.nav')
    const handleScroll = () => {
      if (window.scrollY > 50) {
        nav?.classList.add('nav--scrolled')
      } else {
        nav?.classList.remove('nav--scrolled')
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll reveal
  useEffect(() => {
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
    return () => observer.disconnect()
  }, [])

  return (
    <div className="page">
      {/* NAV */}
      <header className="nav">
        <div className="nav__inner">
          <a href="/" className="nav__logo">JINKI</a>
          <nav className="nav__links">
            <a href="#services">Services</a>
            <a href="#platform">Platform</a>
            <a href="#about">About</a>
          </nav>
          <a href="#contact" className="nav__cta">Contact</a>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero__logo-wrap">
          <img
            ref={logoRef}
            src="/jinki-logo.svg"
            alt="Jinki Intelligence"
            className="hero__logo"
          />
        </div>
        <h1 className="hero__headline">Omniscient</h1>
        <p className="hero__sub">
          Aerial intelligence and cybersecurity advisory for critical infrastructure.
        </p>
        <a href="#contact" className="hero__cta">Schedule Consultation</a>
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
        <p className="section__label reveal">Services</p>
        <h2 className="section__title reveal">Intelligence. Protection.</h2>
        <p className="section__text reveal">
          Comprehensive aerial inspection and cybersecurity solutions for enterprises that cannot afford to fail.
        </p>
        <div className="services">
          <div className="service reveal">
            <span className="service__number">01</span>
            <h3 className="service__title">Aerial Inspection</h3>
            <p className="service__text">Autonomous drone-based thermal and visual inspection for data centers, utilities, and critical infrastructure.</p>
          </div>
          <div className="service reveal">
            <span className="service__number">02</span>
            <h3 className="service__title">Threat Intelligence</h3>
            <p className="service__text">Real-time monitoring and analysis of emerging cyber threats targeting your industry.</p>
          </div>
          <div className="service reveal">
            <span className="service__number">03</span>
            <h3 className="service__title">Security Advisory</h3>
            <p className="service__text">Strategic guidance from former intelligence professionals and security architects.</p>
          </div>
          <div className="service reveal">
            <span className="service__number">04</span>
            <h3 className="service__title">Compliance</h3>
            <p className="service__text">SOC 2, ISO 27001, and NIST framework alignment with continuous validation.</p>
          </div>
        </div>
      </section>

      {/* PLATFORM */}
      <section id="platform" className="section">
        <p className="section__label reveal">Platform</p>
        <h2 className="section__title reveal">See everything.</h2>
        <p className="section__text reveal">
          A unified command center for aerial inspection data, security posture, and threat intelligence.
        </p>
        <div className="features">
          <div className="feature reveal">
            <span className="feature__number">01</span>
            <h3 className="feature__title">Thermal Analysis</h3>
            <p className="feature__text">Detect equipment anomalies before they become failures. AI-powered hotspot identification with 0.1°C precision.</p>
          </div>
          <div className="feature reveal">
            <span className="feature__number">02</span>
            <h3 className="feature__title">Perimeter Defense</h3>
            <p className="feature__text">Continuous aerial surveillance with automated intrusion detection and response protocols.</p>
          </div>
          <div className="feature reveal">
            <span className="feature__number">03</span>
            <h3 className="feature__title">Risk Scoring</h3>
            <p className="feature__text">Quantified risk metrics for every asset. Prioritize remediation based on business impact.</p>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section">
        <p className="section__label reveal">About</p>
        <h2 className="section__title reveal">From on high, all things.</h2>
        <p className="section__text reveal">
          Jinki Intelligence was founded by former intelligence officers and aerospace engineers with a single mission: protect critical infrastructure through superior visibility.
        </p>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section section--center">
        <p className="section__label reveal">Contact</p>
        <h2 className="section__title reveal">Ready?</h2>
        <p className="section__text reveal">
          Schedule a consultation with our team to discuss your infrastructure protection needs.
        </p>
        <a href="mailto:contact@jinki.ai" className="hero__cta reveal">Get Started</a>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer__inner">
          <span className="footer__logo">JINKI</span>
          <nav className="footer__links">
            <a href="#services">Services</a>
            <a href="#platform">Platform</a>
            <a href="#about">About</a>
          </nav>
          <span className="footer__copy">© 2024 Jinki Intelligence</span>
        </div>
      </footer>
    </div>
  )
}
