import { useEffect, useState, useRef } from 'react'
import './LandingPage3.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Premium Components
import Preloader from '../components/Preloader'
import { CustomCursor } from '../components/CustomCursor'

// Premium Hooks
import { useLenis } from '../hooks/useLenis'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

export default function LandingPage3() {
  const [navSolid, setNavSolid] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [scrollProgress, setScrollProgress] = useState(0)
  const [pageLoaded, setPageLoaded] = useState(false)
  const [showPreloader, setShowPreloader] = useState(true)

  // Initialize Lenis smooth scroll
  useLenis()

  // Refs for GSAP animations
  const videoRef = useRef(null)
  const heroRef = useRef(null)
  const scrollProgressRef = useRef(null)
  const problemNumberRef = useRef(null)
  const solutionCardsRef = useRef([])
  const platformDashboardRef = useRef(null)
  const mapMarkersRef = useRef([])
  const ctaRef = useRef(null)

  // ══════════════════════════════════════════════════════════════
  // GSAP SCROLLTRIGGER ANIMATIONS
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    // Kill all existing ScrollTriggers on cleanup
    const ctx = gsap.context(() => {

      // ─────────────────────────────────────────────────────────
      // 1. HERO: DRAMATIC 3D PARALLAX - Multi-Layer Depth System
      // ─────────────────────────────────────────────────────────

      // Layer 0: Gradient Orbs (slowest - 0.1x scroll)
      gsap.to('.parallax-layer--0', {
        yPercent: 10,
        scale: 1.4,
        opacity: 0.3,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 2.5,
        }
      })

      // Layer 1: Large Geometric Shapes (0.2x scroll)
      gsap.to('.parallax-layer--1', {
        yPercent: 20,
        rotateZ: 45,
        scale: 1.3,
        opacity: 0.4,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 2,
        }
      })

      // Layer 2: Video Background (0.4x scroll)
      gsap.to('.hero__video-container', {
        yPercent: 40,
        scale: 1.2,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        }
      })

      // Layer 3: Medium Shapes + Grid (0.6x scroll)
      gsap.to('.parallax-layer--3', {
        yPercent: 60,
        opacity: 0.5,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        }
      })

      // Layer 4: Hero Content (1x - normal scroll with dramatic fade + scale)
      gsap.to('.hero__content', {
        opacity: 0,
        y: -80,
        scale: 0.85,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        }
      })

      // Stats bar fade
      gsap.to('.hero__stats', {
        opacity: 0,
        y: -60,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        }
      })

      // Layer 5: Floating Particles + Drone (1.3x - faster than scroll)
      gsap.to('.parallax-layer--5', {
        yPercent: 130,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5,
        }
      })

      // Depth fog intensifies
      gsap.to('.parallax-depth-fog', {
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        }
      })

      // Individual parallax elements animations
      gsap.to('.parallax-orb', {
        scale: 1.5,
        opacity: 0,
        stagger: 0.1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        }
      })

      gsap.to('.parallax-drone', {
        rotation: 360,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 2,
        }
      })

      // Scroll indicator fade
      gsap.to('.hero__scroll', {
        opacity: 0,
        y: 30,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: '20% top',
          scrub: 1,
        }
      })

      // ─────────────────────────────────────────────────────────
      // 2. HERO: Initial Load Animation
      // ─────────────────────────────────────────────────────────
      const heroTl = gsap.timeline({ delay: 0.3 })

      heroTl
        .from('.hero__badge', {
          opacity: 0,
          y: 30,
          duration: 1,
          ease: 'power4.out'
        })
        .from('.hero__headline-line', {
          opacity: 0,
          y: 50,
          duration: 1.2,
          ease: 'power4.out',
          stagger: 0.15
        }, '-=0.6')
        .from('.hero__headline-accent', {
          opacity: 0,
          y: 50,
          duration: 1.2,
          ease: 'power4.out'
        }, '-=0.9')
        .from('.hero__description', {
          opacity: 0,
          y: 30,
          duration: 1,
          ease: 'power4.out'
        }, '-=0.7')
        .from('.hero__actions .btn', {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: 'power4.out',
          stagger: 0.15
        }, '-=0.5')
        .from('.hero__stat', {
          opacity: 0,
          y: 40,
          duration: 1,
          ease: 'elastic.out(1, 0.75)',
          stagger: 0.1
        }, '-=0.4')
        .from('.hero__scroll', {
          opacity: 0,
          y: 20,
          duration: 0.8,
          ease: 'power2.out'
        }, '-=0.6')

      // ─────────────────────────────────────────────────────────
      // 3. PROBLEM: Animated Counter (0% → 13%)
      // ─────────────────────────────────────────────────────────
      if (problemNumberRef.current) {
        const counter = { value: 0 }

        gsap.to(counter, {
          value: 13,
          duration: 2.5,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: '.problem',
            start: 'top 75%',
            toggleActions: 'play none none none'
          },
          onUpdate: function() {
            if (problemNumberRef.current) {
              problemNumberRef.current.textContent = Math.round(counter.value) + '%'
            }
          }
        })
      }

      // Problem content reveal
      gsap.from('.problem__content', {
        opacity: 0,
        x: -60,
        duration: 1.2,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '.problem',
          start: 'top 70%',
          toggleActions: 'play none none none'
        }
      })

      gsap.from('.problem__metric', {
        opacity: 0,
        scale: 0.8,
        duration: 1.5,
        ease: 'elastic.out(1, 0.6)',
        scrollTrigger: {
          trigger: '.problem',
          start: 'top 70%',
          toggleActions: 'play none none none'
        }
      })

      // ─────────────────────────────────────────────────────────
      // 4. SOLUTIONS: Staggered 3D Card Reveals
      // ─────────────────────────────────────────────────────────
      gsap.from('.solutions__header', {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '.solutions',
          start: 'top 75%',
          toggleActions: 'play none none none'
        }
      })

      gsap.from('.solution-card', {
        opacity: 0,
        y: 80,
        rotationX: -25,
        rotationY: 15,
        scale: 0.9,
        duration: 1.2,
        ease: 'power4.out',
        stagger: {
          amount: 0.6,
          from: 'start'
        },
        scrollTrigger: {
          trigger: '.solutions__grid',
          start: 'top 75%',
          toggleActions: 'play none none none'
        }
      })

      // Add subtle hover animations for solution cards
      document.querySelectorAll('.solution-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -10,
            scale: 1.02,
            duration: 0.4,
            ease: 'power2.out'
          })
        })

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            scale: 1,
            duration: 0.4,
            ease: 'power2.out'
          })
        })
      })

      // ─────────────────────────────────────────────────────────
      // 5. PLATFORM: Dashboard Tilt Animation
      // ─────────────────────────────────────────────────────────
      gsap.from('.platform__content', {
        opacity: 0,
        x: -80,
        duration: 1.2,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '.platform',
          start: 'top 70%',
          toggleActions: 'play none none none'
        }
      })

      gsap.from('.platform-feature', {
        opacity: 0,
        x: -40,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: '.platform__features',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      })

      // Dashboard 3D tilt on scroll
      gsap.from('.dashboard', {
        opacity: 0,
        x: 100,
        rotationY: -20,
        rotationX: 10,
        scale: 0.85,
        duration: 1.5,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '.platform__visual',
          start: 'top 75%',
          toggleActions: 'play none none none'
        }
      })

      // Dashboard continuous tilt effect on scroll
      gsap.to('.dashboard', {
        rotationY: 5,
        rotationX: -3,
        ease: 'none',
        scrollTrigger: {
          trigger: '.platform',
          start: 'top 50%',
          end: 'bottom top',
          scrub: 2
        }
      })

      // Animate dashboard content
      gsap.from('.status-item', {
        opacity: 0,
        x: -30,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: '.dashboard',
          start: 'top 70%',
          toggleActions: 'play none none none'
        }
      })

      gsap.from('.heatmap-cell', {
        opacity: 0,
        scale: 0,
        duration: 0.8,
        ease: 'back.out(1.7)',
        stagger: {
          amount: 0.8,
          from: 'random'
        },
        scrollTrigger: {
          trigger: '.dashboard__heatmap',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      })

      // ─────────────────────────────────────────────────────────
      // 6. COVERAGE: Map Markers Sequential Animation
      // ─────────────────────────────────────────────────────────
      gsap.from('.coverage__header', {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '.coverage',
          start: 'top 75%',
          toggleActions: 'play none none none'
        }
      })

      // SVG map path draw animation
      gsap.from('.coverage__map-outline', {
        strokeDashoffset: 1000,
        strokeDasharray: 1000,
        duration: 2,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger: '.coverage__map',
          start: 'top 75%',
          toggleActions: 'play none none none'
        }
      })

      // Map grid fade in
      gsap.from('.coverage__map-grid', {
        opacity: 0,
        duration: 1.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.coverage__map',
          start: 'top 70%',
          toggleActions: 'play none none none'
        }
      })

      // Map markers animate in sequence
      gsap.from('.map-marker', {
        opacity: 0,
        scale: 0,
        y: -50,
        duration: 1,
        ease: 'elastic.out(1, 0.6)',
        stagger: 0.25,
        scrollTrigger: {
          trigger: '.coverage__map',
          start: 'top 65%',
          toggleActions: 'play none none none'
        }
      })

      // Pulse animations for markers
      gsap.to('.map-marker__pulse', {
        scale: 2,
        opacity: 0,
        duration: 2,
        ease: 'power2.out',
        repeat: -1,
        stagger: 0.3
      })

      // Stats cards reveal
      gsap.from('.stat-card', {
        opacity: 0,
        y: 60,
        rotationX: -15,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: '.coverage__stats',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      })

      // ─────────────────────────────────────────────────────────
      // 7. ABOUT: Elegant Reveal
      // ─────────────────────────────────────────────────────────
      gsap.from('.about__container', {
        opacity: 0,
        y: 80,
        duration: 1.5,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '.about',
          start: 'top 70%',
          toggleActions: 'play none none none'
        }
      })

      gsap.from('.about__motto', {
        opacity: 0,
        scale: 0.9,
        duration: 1.2,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '.about',
          start: 'top 65%',
          toggleActions: 'play none none none'
        }
      })

      gsap.from('.about__text p', {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.2,
        scrollTrigger: {
          trigger: '.about__text',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      })

      // ─────────────────────────────────────────────────────────
      // 8. CTA: Pinned Dramatic Scale + Opacity
      // ─────────────────────────────────────────────────────────
      gsap.from('.cta__container', {
        opacity: 0,
        scale: 0.85,
        duration: 1.5,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '.cta',
          start: 'top 70%',
          toggleActions: 'play none none none'
        }
      })

      // Pin CTA section for dramatic effect
      ScrollTrigger.create({
        trigger: '.cta',
        start: 'top 20%',
        end: 'bottom 80%',
        pin: false, // Set to true for pinning effect
        pinSpacing: false
      })

      gsap.from('.cta__title', {
        opacity: 0,
        y: 50,
        scale: 0.95,
        duration: 1.2,
        ease: 'elastic.out(1, 0.6)',
        scrollTrigger: {
          trigger: '.cta',
          start: 'top 65%',
          toggleActions: 'play none none none'
        }
      })

      gsap.from('.cta__desc', {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.cta',
          start: 'top 60%',
          toggleActions: 'play none none none'
        }
      })

      gsap.from('.cta .btn', {
        opacity: 0,
        scale: 0.9,
        y: 40,
        duration: 1.2,
        ease: 'elastic.out(1, 0.5)',
        scrollTrigger: {
          trigger: '.cta',
          start: 'top 55%',
          toggleActions: 'play none none none'
        }
      })

      gsap.from('.cta__note', {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.cta',
          start: 'top 50%',
          toggleActions: 'play none none none'
        }
      })

      // ─────────────────────────────────────────────────────────
      // 9. TRUST BAR: Infinite Marquee Effect (Optional)
      // ─────────────────────────────────────────────────────────
      gsap.from('.trust__container', {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.trust',
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      })

      // ─────────────────────────────────────────────────────────
      // 10. FOOTER: Slide Up
      // ─────────────────────────────────────────────────────────
      gsap.from('.footer__container', {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.footer',
          start: 'top 90%',
          toggleActions: 'play none none none'
        }
      })

      // ─────────────────────────────────────────────────────────
      // 11. HORIZONTAL SCROLL SECTION (Optional Enhancement)
      // ─────────────────────────────────────────────────────────
      // Uncomment below to add horizontal scroll to solutions grid
      /*
      const horizontalSections = gsap.utils.toArray('.solutions__grid')
      horizontalSections.forEach((section) => {
        const cards = section.querySelectorAll('.solution-card')

        gsap.to(cards, {
          xPercent: -100 * (cards.length - 1),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            pin: true,
            scrub: 1,
            snap: 1 / (cards.length - 1),
            end: () => '+=' + section.offsetWidth
          }
        })
      })
      */

    })

    return () => ctx.revert() // Cleanup all GSAP animations
  }, [])

  // ══════════════════════════════════════════════════════════════
  // STANDARD EFFECTS (Non-GSAP)
  // ══════════════════════════════════════════════════════════════
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
    let targetMouse = { x: 0, y: 0 }
    let currentMouse = { x: 0, y: 0 }
    let animationFrameId = null

    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2 // -1 to 1
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2 // -1 to 1
        targetMouse = { x, y }
        setMousePos({ x, y })
      }
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    // Smooth mouse parallax animation loop
    const animateMouseParallax = () => {
      // Smooth easing (lerp)
      const ease = 0.08
      currentMouse.x += (targetMouse.x - currentMouse.x) * ease
      currentMouse.y += (targetMouse.y - currentMouse.y) * ease

      // Apply parallax to each layer
      const layers = document.querySelectorAll('.parallax-layer')
      layers.forEach((layer) => {
        const speed = parseFloat(layer.getAttribute('data-mouse') || 0)
        const moveX = currentMouse.x * speed
        const moveY = currentMouse.y * speed

        // Apply subtle 3D rotation to layers
        const rotateY = currentMouse.x * 2
        const rotateX = -currentMouse.y * 2

        layer.style.transform = `
          translate3d(${moveX}px, ${moveY}px, 0)
          perspective(1200px)
          rotateY(${rotateY}deg)
          rotateX(${rotateX}deg)
        `
      })

      // Apply parallax to video container
      const videoContainer = document.querySelector('.hero__video-container')
      if (videoContainer) {
        const moveX = currentMouse.x * 30
        const moveY = currentMouse.y * 30
        videoContainer.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`
      }

      // Continue animation loop
      animationFrameId = requestAnimationFrame(animateMouseParallax)
    }
    animateMouseParallax()

    // Video autoplay
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }

    return () => {
      clearTimeout(loadTimer)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [])

  // 3D transform based on mouse position
  const heroTransform = {
    transform: `perspective(1200px) rotateY(${mousePos.x * 3}deg) rotateX(${-mousePos.y * 3}deg)`
  }

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════
          CINEMATIC PRELOADER
          ══════════════════════════════════════════════════════════════ */}
      {showPreloader && (
        <Preloader onComplete={() => setShowPreloader(false)} />
      )}

      {/* Custom Cursor - Premium magnetic effect */}
      <CustomCursor />

      <div className={`page ${pageLoaded ? 'page--loaded' : 'page--loading'} ${!showPreloader ? 'page--ready' : ''}`}>
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

        {/* ═══════════════════════════════════════════════════════════
            DRAMATIC 3D PARALLAX SYSTEM - 6 Depth Layers
            ═══════════════════════════════════════════════════════ */}

        {/* Layer 0: Back - Gradient Orbs (slowest 0.1x + mouse 10px) */}
        <div className="parallax-layer parallax-layer--0" data-speed="0.1" data-mouse="10">
          <div className="parallax-orb parallax-orb--cyan" />
          <div className="parallax-orb parallax-orb--gold" />
          <div className="parallax-orb parallax-orb--purple" />
        </div>

        {/* Layer 1: Large Geometric Shapes (0.2x + mouse 20px) */}
        <div className="parallax-layer parallax-layer--1" data-speed="0.2" data-mouse="20">
          <div className="parallax-shape parallax-shape--hexagon-1" />
          <div className="parallax-shape parallax-shape--circle-1" />
          <div className="parallax-shape parallax-shape--triangle-1" />
        </div>

        {/* Layer 2: Video Background (0.4x + mouse 30px) - Handled separately */}

        {/* Layer 3: Medium Shapes + Grid Lines (0.6x + mouse 40px) */}
        <div className="parallax-layer parallax-layer--3" data-speed="0.6" data-mouse="40">
          <div className="parallax-grid" />
          <div className="parallax-shape parallax-shape--hexagon-2" />
          <div className="parallax-shape parallax-shape--circle-2" />
          <div className="parallax-node parallax-node--1">
            <div className="node-core" />
            <div className="node-ring" />
          </div>
          <div className="parallax-node parallax-node--2">
            <div className="node-core" />
            <div className="node-ring" />
          </div>
        </div>

        {/* Layer 4: Content (1x - normal scroll) - Handled by hero__content */}

        {/* Layer 5: Front - Floating Particles + Drone (1.3x + mouse 60px - faster than scroll) */}
        <div className="parallax-layer parallax-layer--5" data-speed="1.3" data-mouse="60">
          {/* Particle System */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="parallax-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}

          {/* Orbiting Drone/Satellite SVG */}
          <div className="parallax-drone">
            <svg viewBox="0 0 64 64" fill="none">
              {/* Drone body */}
              <circle cx="32" cy="32" r="6" fill="currentColor" opacity="0.8"/>
              <circle cx="32" cy="32" r="4" stroke="currentColor" strokeWidth="1" fill="none"/>

              {/* Drone arms */}
              <line x1="32" y1="32" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
              <line x1="32" y1="32" x2="46" y2="18" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
              <line x1="32" y1="32" x2="18" y2="46" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
              <line x1="32" y1="32" x2="46" y2="46" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>

              {/* Propellers */}
              <circle cx="18" cy="18" r="4" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
              <circle cx="46" cy="18" r="4" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
              <circle cx="18" cy="46" r="4" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
              <circle cx="46" cy="46" r="4" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>

              {/* Scan lines */}
              <path d="M32 32 L32 10" stroke="currentColor" strokeWidth="0.5" opacity="0.3" strokeDasharray="2 2"/>
              <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4"/>
            </svg>
          </div>

          {/* Data connection lines */}
          <svg className="parallax-connections" viewBox="0 0 1920 1080" preserveAspectRatio="none">
            <line x1="20%" y1="20%" x2="80%" y2="80%" stroke="currentColor" strokeWidth="1" opacity="0.15" strokeDasharray="5 5"/>
            <line x1="80%" y1="20%" x2="20%" y2="80%" stroke="currentColor" strokeWidth="1" opacity="0.15" strokeDasharray="5 5"/>
            <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="currentColor" strokeWidth="1" opacity="0.1" strokeDasharray="3 3"/>
          </svg>
        </div>

        {/* Depth Fog Overlay - Creates atmospheric depth */}
        <div className="parallax-depth-fog" />

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
        <div className="problem__container">
          <div className="problem__metric">
            <span className="problem__number" ref={problemNumberRef}>0%</span>
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
          <header className="solutions__header">
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
              <article key={i} className="solution-card glass-panel">
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
          <div className="platform__content">
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

          <div className="platform__visual">
            <div className="dashboard glass-panel" ref={platformDashboardRef}>
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
          <header className="coverage__header">
            <span className="section-label">Coverage</span>
            <h2 className="section-title">Built for Virginia's data center corridor.</h2>
            <p className="section-subtitle">Rapid deployment across the region's highest-density infrastructure zones.</p>
          </header>

          <div className="coverage__map">
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

          <div className="coverage__stats">
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
        <div className="about__container">
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
        <div className="cta__container" ref={ctaRef}>
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
    </>
  )
}
