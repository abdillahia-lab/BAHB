/* ═══════════════════════════════════════════════════════════════
   JINKI INTELLIGENCE - CHAMPIONSHIP IMPLEMENTATION
   7 Winning Teams Combined | Apple-Level Experience
   ═══════════════════════════════════════════════════════════════

   IMPLEMENTED:
   🏆 LOGO Magnetic Dimensional Presence (565/600)
   🏆 OPT-3 RAF Throttling (548/600)
   🏆 NAV Adaptive Smart Navigation (544/600)
   🏆 GLASS-1 Premium Card System (538/600)
   🏆 FLUID-2 Spring Stagger System (535/600)
   🏆 FLUID-3 Magnetic Button (520/600)
   🏆 OPT-1 CSS Containment (512/600)
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useCallback } from 'react'
import Lenis from 'lenis'
import { rafMonitor } from '../utils/rafMonitor'
import './LandingPage3.css'

// ═══════════════════════════════════════════════════════════════
// 🏆 TEAM OPT-3: Intelligent RAF Throttling with Idle Detection
// ═══════════════════════════════════════════════════════════════
function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    let rafId = null
    let isScrolling = false
    let idleTimeout = null
    let lastScrollTime = Date.now()

    function raf(time) {
      lenis.raf(time)
      const velocity = Math.abs(lenis.velocity)

      if (import.meta.env.DEV) {
        rafMonitor.recordFrame(velocity)
      }

      if (velocity > 0.01) {
        isScrolling = true
        lastScrollTime = Date.now()
        rafId = requestAnimationFrame(raf)
        if (idleTimeout) {
          clearTimeout(idleTimeout)
          idleTimeout = null
        }
      } else {
        if (Date.now() - lastScrollTime > 100) {
          isScrolling = false
          rafId = null
        } else {
          rafId = requestAnimationFrame(raf)
        }
      }
    }

    const startRAF = () => {
      if (!isScrolling && !rafId) {
        isScrolling = true
        lastScrollTime = Date.now()
        rafId = requestAnimationFrame(raf)
      }
    }

    window.addEventListener('wheel', startRAF, { passive: true })
    window.addEventListener('touchstart', startRAF, { passive: true })
    window.addEventListener('touchmove', startRAF, { passive: true })
    rafId = requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
      if (rafId) cancelAnimationFrame(rafId)
      if (idleTimeout) clearTimeout(idleTimeout)
      window.removeEventListener('wheel', startRAF)
      window.removeEventListener('touchstart', startRAF)
      window.removeEventListener('touchmove', startRAF)
    }
  }, [])
}

// ═══════════════════════════════════════════════════════════════
// 🏆 TEAM NAV: Scroll-Adaptive Navigation
// ═══════════════════════════════════════════════════════════════
function useAdaptiveNav() {
  useEffect(() => {
    const nav = document.querySelector('.nav')
    if (!nav) return

    const handleScroll = () => {
      if (window.scrollY > 50) {
        nav.classList.add('nav--scrolled')
      } else {
        nav.classList.remove('nav--scrolled')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
}

// ═══════════════════════════════════════════════════════════════
// 🏆 TEAM LOGO: Magnetic Cursor Attraction
// ═══════════════════════════════════════════════════════════════
function useMagneticLogo(logoRef) {
  useEffect(() => {
    const logo = logoRef.current
    if (!logo) return

    let rafId = null
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const handleMouseMove = (e) => {
      const rect = logo.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const distX = e.clientX - centerX
      const distY = e.clientY - centerY
      const distance = Math.sqrt(distX * distX + distY * distY)

      // Magnetic attraction within 300px
      if (distance < 300) {
        const strength = (300 - distance) / 300
        targetX = distX * strength * 0.15
        targetY = distY * strength * 0.15
      } else {
        targetX = 0
        targetY = 0
      }
    }

    const animate = () => {
      // Spring physics
      currentX += (targetX - currentX) * 0.1
      currentY += (targetY - currentY) * 0.1

      const rotateX = currentY * 0.02
      const rotateY = -currentX * 0.02

      logo.style.transform = `translateZ(0) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate(${currentX}px, ${currentY}px)`

      rafId = requestAnimationFrame(animate)
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    rafId = requestAnimationFrame(animate)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [logoRef])
}

// ═══════════════════════════════════════════════════════════════
// 🏆 TEAM FLUID-3: Magnetic Button with Cursor Glow
// ═══════════════════════════════════════════════════════════════
function useMagneticButtons() {
  useEffect(() => {
    const buttons = document.querySelectorAll('.hero__cta')

    const handleMouseMove = (e) => {
      buttons.forEach((btn) => {
        const rect = btn.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        btn.style.setProperty('--mouse-x', `${x}%`)
        btn.style.setProperty('--mouse-y', `${y}%`)
      })
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])
}

// ═══════════════════════════════════════════════════════════════
// 🏆 TEAM FLUID-2: Scroll-Triggered Reveals with IntersectionObserver
// ═══════════════════════════════════════════════════════════════
function useScrollReveal() {
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal, .reveal-stagger')

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

    return () => observer.disconnect()
  }, [])
}

export default function LandingPage3() {
  const logoRef = useRef(null)

  // Initialize all championship hooks
  useSmoothScroll()
  useAdaptiveNav()
  useMagneticLogo(logoRef)
  useMagneticButtons()
  useScrollReveal()

  return (
    <div className="page">
      {/* NAV - Adaptive Smart Navigation */}
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

      {/* HERO - Logo as Dimensional Center of Universe */}
      <section className="hero">
        {/* Logo Container with Magnetic Presence */}
        <div className="hero__logo-container">
          <div className="hero__logo-glow" />
          <img
            ref={logoRef}
            src="/jinki-logo.svg"
            alt="Jinki Intelligence"
            className="hero__logo fade-up"
          />
        </div>

        {/* Single word headline */}
        <h1 className="hero__headline fade-up fade-up-delay-1">
          Omniscient
        </h1>

        {/* Subheadline */}
        <p className="hero__sub fade-up fade-up-delay-2">
          Aerial intelligence and cybersecurity advisory
          for critical infrastructure.
        </p>

        {/* CTA - Magnetic Button with Cursor Glow */}
        <a href="#contact" className="hero__cta fade-up fade-up-delay-3">
          Schedule Consultation
        </a>

        {/* Scroll indicator */}
        <div className="hero__scroll fade-up fade-up-delay-4">
          <span>Scroll</span>
          <div className="hero__scroll-line" />
        </div>
      </section>

      {/* STATS - Scroll Reveal */}
      <div className="stats reveal reveal-stagger">
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

      {/* SERVICES - Glass Grid */}
      <section id="services" className="section">
        <p className="section__label reveal">Services</p>
        <h2 className="section__title reveal">
          Intelligence.<br />
          Protection.
        </h2>
        <p className="section__text reveal">
          Comprehensive aerial inspection and cybersecurity
          solutions for enterprises that cannot afford to fail.
        </p>

        <div className="services reveal-stagger reveal">
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

      {/* PLATFORM - Premium Glass Cards */}
      <section id="platform" className="section">
        <p className="section__label reveal">Platform</p>
        <h2 className="section__title reveal">
          See everything.
        </h2>
        <p className="section__text reveal">
          A unified command center for aerial inspection data,
          security posture, and threat intelligence—all in one view.
        </p>

        <div className="features">
          <div className="feature reveal">
            <h3 className="feature__title">Thermal Analysis</h3>
            <p className="feature__text">
              Detect equipment anomalies before they become failures.
              AI-powered hotspot identification with 0.1°C precision.
            </p>
          </div>
          <div className="feature reveal">
            <h3 className="feature__title">Perimeter Defense</h3>
            <p className="feature__text">
              Continuous aerial surveillance with automated
              intrusion detection and response protocols.
            </p>
          </div>
          <div className="feature reveal">
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
        <p className="section__label reveal">About</p>
        <h2 className="section__title reveal">
          From on high,<br />
          all things.
        </h2>
        <p className="section__text reveal">
          Jinki Intelligence was founded by former intelligence
          officers and aerospace engineers with a single mission:
          protect critical infrastructure through superior visibility.
        </p>
        <p className="section__text reveal" style={{ marginTop: '24px' }}>
          We see what others cannot. We protect what matters most.
        </p>
      </section>

      {/* CONTACT CTA */}
      <section id="contact" className="section" style={{ textAlign: 'center' }}>
        <p className="section__label reveal">Contact</p>
        <h2 className="section__title reveal">
          Ready?
        </h2>
        <p className="section__text reveal" style={{ margin: '0 auto 48px' }}>
          Schedule a consultation with our team to discuss
          your infrastructure protection needs.
        </p>
        <a href="mailto:contact@jinki.ai" className="hero__cta reveal">
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
