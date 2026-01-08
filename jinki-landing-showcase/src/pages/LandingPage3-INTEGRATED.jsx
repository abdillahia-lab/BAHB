/**
 * LandingPage3 - INTEGRATED VERSION
 * Complete implementation with Lenis Smooth Scroll + Custom Cursor + Magnetic Buttons
 *
 * This is a reference implementation showing how to integrate all premium UX features.
 * Copy the necessary parts to your existing LandingPage3.jsx
 */

import { useEffect, useState, useRef } from 'react'
import './LandingPage3.css'

// ══════════════════════════════════════════════════════════════
// PREMIUM UX IMPORTS
// ══════════════════════════════════════════════════════════════
import { useLenis } from '../hooks/useLenis'
import { CustomCursor } from '../components/CustomCursor'
import { MagneticButton, MagneticLink } from '../components/MagneticButton'
import { useMagneticButton } from '../hooks/useMagneticButton'

export default function LandingPage3() {
  const [navSolid, setNavSolid] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [scrollProgress, setScrollProgress] = useState(0)
  const [pageLoaded, setPageLoaded] = useState(false)
  const videoRef = useRef(null)
  const heroRef = useRef(null)
  const scrollProgressRef = useRef(null)

  // ══════════════════════════════════════════════════════════════
  // LENIS SMOOTH SCROLL INTEGRATION
  // ══════════════════════════════════════════════════════════════
  const lenis = useLenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    smoothTouch: false, // Better UX on mobile
  })

  useEffect(() => {
    // Page load entrance sequence
    const loadTimer = setTimeout(() => setPageLoaded(true), 100)

    // Lenis scroll event handler
    if (lenis) {
      lenis.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
        // Update nav state
        setNavSolid(scroll > 60)

        // Calculate scroll progress
        const scrollProgress = Math.min(scroll / limit, 1)
        setScrollProgress(scrollProgress)

        // Update scroll progress bar
        if (scrollProgressRef.current) {
          scrollProgressRef.current.style.transform = `scaleX(${scrollProgress})`
        }
      })
    }

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
      window.removeEventListener('mousemove', handleMouseMove)
      observer.disconnect()
    }
  }, [lenis])

  // 3D transform based on mouse position
  const heroTransform = {
    transform: `perspective(1200px) rotateY(${mousePos.x * 3}deg) rotateX(${-mousePos.y * 3}deg)`
  }

  return (
    <div className={`page ${pageLoaded ? 'page--loaded' : 'page--loading'}`}>
      {/* ══════════════════════════════════════════════════════════════
          CUSTOM CURSOR - Add to root level
          ══════════════════════════════════════════════════════════════ */}
      <CustomCursor />

      {/* Scroll Progress Indicator */}
      <div className="scroll-progress" ref={scrollProgressRef} />

      {/* ══════════════════════════════════════════════════════════════
          NAVIGATION - With Magnetic CTA Button
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

          {/* ═══ MAGNETIC BUTTON EXAMPLE ═══ */}
          <MagneticLink
            href="#contact"
            className="nav__cta liquid-metal"
            strength={0.4}
            radius={120}
          >
            <span>Request Demo</span>
          </MagneticLink>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION - With Magnetic Buttons
          ══════════════════════════════════════════════════════════════ */}
      <section className="hero" ref={heroRef}>
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

        {/* Parallax layers remain the same */}
        <div className="hero__parallax-layer hero__parallax-layer--back">
          <div className="parallax-orb parallax-orb--cyan" />
          <div className="parallax-orb parallax-orb--gold" />
        </div>

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

            {/* ═══ MAGNETIC BUTTONS IN HERO ═══ */}
            <div className="hero__actions">
              <MagneticLink
                href="#contact"
                className="btn btn--primary liquid-metal"
                strength={0.5}
                radius={150}
              >
                <span>Schedule Assessment</span>
                <svg className="btn__arrow" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </MagneticLink>

              <MagneticLink
                href="#platform"
                className="btn btn--glass glass-panel"
                strength={0.3}
                radius={120}
              >
                <span>Watch Demo</span>
              </MagneticLink>
            </div>
          </div>

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

        <div className="hero__scroll">
          <div className="hero__scroll-track">
            <div className="hero__scroll-thumb" />
          </div>
          <span className="hero__scroll-text">Scroll</span>
        </div>
      </section>

      {/* All other sections remain the same...
          Just replace regular <a> tags with <MagneticLink>
          for interactive elements you want to have magnetic effect */}

      {/* Trust Bar */}
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

      {/* CTA Section with Magnetic Button */}
      <section id="contact" className="cta">
        <div className="cta__container reveal">
          <h2 className="cta__title">Protect your infrastructure.</h2>
          <p className="cta__desc">
            Schedule a site assessment to see how aerial intelligence can reduce
            your operational risk and extend equipment lifecycles.
          </p>

          {/* ═══ MAGNETIC BUTTON IN CTA ═══ */}
          <MagneticLink
            href="mailto:ops@jinki.ai"
            className="btn btn--primary btn--lg liquid-metal"
            strength={0.6}
            radius={180}
          >
            <span>Request Site Assessment</span>
            <svg className="btn__arrow" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </MagneticLink>

          <span className="cta__note">Typical assessment completed within 48 hours</span>
        </div>
      </section>

      {/* Footer remains the same... */}
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
