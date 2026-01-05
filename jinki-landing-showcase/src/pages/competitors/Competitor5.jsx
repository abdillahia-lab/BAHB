import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion'
import Lenis from 'lenis'
import './Competitor5.css'

const ease = [0.25, 0.1, 0.25, 1]

// ═══════════════════════════════════════════════════════════════
// NOIR ASCII EYE - Illuminated by dramatic spotlight
// ═══════════════════════════════════════════════════════════════
function NoirAsciiEye() {
  const [frame, setFrame] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })

  const eyeFrames = [
    [
      "            ░░░░░░░░░░░░            ",
      "        ░░▒▒▓▓██████▓▓▒▒░░        ",
      "      ░▒▓██            ██▓▒░      ",
      "    ░▒▓█    ▄▄████▄▄    █▓▒░    ",
      "   ░▓█   ▄██▀▀    ▀▀██▄   █▓░   ",
      "  ░▓█  ▄█▀   ●●●●   ▀█▄  █▓░  ",
      "  ▒█  ██   ●●▓▓▓▓●●   ██  █▒  ",
      "  ▓█  █   ●▓▓████▓▓●   █  █▓  ",
      "  ▓█  █   ●▓██▀▀██▓●   █  █▓  ",
      "  ▒█  ██   ●●▓▓▓▓●●   ██  █▒  ",
      "  ░▓█  ▀█▄   ●●●●   ▄█▀  █▓░  ",
      "   ░▓█   ▀██▄▄    ▄▄██▀   █▓░   ",
      "    ░▒▓█    ▀▀████▀▀    █▓▒░    ",
      "      ░▒▓██            ██▓▒░      ",
      "        ░░▒▒▓▓██████▓▓▒▒░░        ",
      "            ░░░░░░░░░░░░            ",
    ],
    [
      "            ▒▒▒▒▒▒▒▒▒▒▒▒            ",
      "        ▒▒▓▓████████████▓▓▒▒        ",
      "      ▒▓██                ██▓▒      ",
      "    ▒▓█      ▄▄████▄▄      █▓▒    ",
      "   ▒▓█    ▄██▀▀    ▀▀██▄    █▓▒   ",
      "  ▒▓█   ▄█▀    ○○○○    ▀█▄   █▓▒  ",
      "  ▓█   ██    ○○████○○    ██   █▓  ",
      "  █▓   █    ○████████○    █   ▓█  ",
      "  █▓   █    ○████████○    █   ▓█  ",
      "  ▓█   ██    ○○████○○    ██   █▓  ",
      "  ▒▓█   ▀█▄    ○○○○    ▄█▀   █▓▒  ",
      "   ▒▓█    ▀██▄▄    ▄▄██▀    █▓▒   ",
      "    ▒▓█      ▀▀████▀▀      █▓▒    ",
      "      ▒▓██                ██▓▒      ",
      "        ▒▒▓▓████████████▓▓▒▒        ",
      "            ▒▒▒▒▒▒▒▒▒▒▒▒            ",
    ],
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % eyeFrames.length)
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMousePos({ x, y })
  }

  return (
    <div className="noir-eye" onMouseMove={handleMouseMove}>
      {/* Dramatic spotlight that follows mouse */}
      <div
        className="noir-eye__spotlight"
        style={{
          '--spotlight-x': `${mousePos.x * 100}%`,
          '--spotlight-y': `${mousePos.y * 100}%`
        }}
      />

      {/* Volumetric light rays */}
      <div className="noir-eye__rays">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="noir-eye__ray"
            style={{ '--ray-angle': `${i * 45}deg` }}
          />
        ))}
      </div>

      <div className="noir-eye__container">
        <pre className="noir-eye__art">
          {eyeFrames[frame].map((line, i) => (
            <motion.span
              key={i}
              className="noir-eye__line"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02, duration: 0.4 }}
            >
              {line}
            </motion.span>
          ))}
        </pre>
      </div>

      {/* Film noir vignette */}
      <div className="noir-eye__vignette" />
    </div>
  )
}

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

function FadeUp({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-120px' }}
      transition={{ duration: 1, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

function Counter({ value, suffix = '', prefix = '', label }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const num = parseFloat(value.toString().replace(/[^0-9.]/g, ''))
    const duration = 2000
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setDisplay(Math.floor(num * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    tick()
  }, [inView, value])

  return (
    <div ref={ref} className="noir-stat">
      <span className="noir-stat__value">{prefix}{display}{suffix}</span>
      <span className="noir-stat__label">{label}</span>
      <div className="noir-stat__glow" />
    </div>
  )
}

function NoirCard({ image, title, problem, solution, stats, index }) {
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })
  const y = useTransform(scrollYProgress, [0, 1], [60, -60])
  const smoothY = useSpring(y, { stiffness: 80, damping: 30 })

  return (
    <motion.div
      ref={ref}
      className="noir-card"
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 1, delay: index * 0.15, ease }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dramatic spotlight on hover */}
      <motion.div
        className="noir-card__spotlight"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.6 }}
      />

      <motion.div className="noir-card__image" style={{ y: smoothY }}>
        <img src={image} alt={title} loading="lazy"/>
        <div className="noir-card__image-overlay" />
      </motion.div>

      <div className="noir-card__content">
        <h3>{title}</h3>
        <div className="noir-card__divider" />

        <div className="noir-card__section">
          <span className="noir-card__label">THE DARKNESS</span>
          <p>{problem}</p>
        </div>

        <div className="noir-card__section">
          <span className="noir-card__label">THE LIGHT</span>
          <p>{solution}</p>
        </div>

        <div className="noir-card__stats">
          {stats.map((stat, i) => (
            <div key={i} className="noir-card__stat">
              <span className="noir-card__stat-value">{stat.value}</span>
              <span className="noir-card__stat-label">{stat.label}</span>
              <div className="noir-card__stat-glow" />
            </div>
          ))}
        </div>
      </div>

      {/* Film grain effect */}
      <div className="noir-card__grain" />
    </motion.div>
  )
}

export default function Competitor5() {
  useSmoothScroll()

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.92])

  const industries = [
    {
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
      title: 'Data Centers',
      problem: 'Darkness falls. 19% of catastrophic outages begin with invisible thermal failures. $700K lost in shadows.',
      solution: 'Light reveals all. Thermal vision pierces the darkness with 0.05°C precision, illuminating danger 72 hours before disaster strikes.',
      stats: [{ value: '$700K', label: 'Prevented Loss' }, { value: '72hrs', label: 'Early Warning' }]
    },
    {
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80',
      title: 'Electric Utilities',
      problem: 'Blind in daylight. Ground crews miss 48% of critical defects. Helicopter surveillance burns $2,000 per hour.',
      solution: 'Eyes from above. LiDAR cuts through obscurity at 2.4M points per second. Truth costs 60% less.',
      stats: [{ value: '60%', label: 'Cost Slashed' }, { value: '4.5x', label: 'Defects Found' }]
    },
    {
      image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80',
      title: 'Precision Agriculture',
      problem: 'Silent suffering. Crops scream in frequencies invisible to the naked eye. 14 days of damage before anyone notices.',
      solution: 'Seeing the invisible. Multispectral vision detects plant stress 14 days before symptoms emerge from darkness.',
      stats: [{ value: '14 days', label: 'Faster Detection' }, { value: '150%', label: 'ROI Proven' }]
    },
    {
      image: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=80',
      title: 'Oil & Gas',
      problem: 'Invisible killers. Methane leaks haunt pipelines. EPA demands surveillance. Manual inspection crawls at a deadly pace.',
      solution: 'Light finds the hidden. Optical Gas Imaging with 99.2% detection accuracy. 14km covered daily. No shadow left unsearched.',
      stats: [{ value: '99.2%', label: 'Detection Rate' }, { value: '14km', label: 'Daily Sweep' }]
    }
  ]

  return (
    <div className="noir-page">
      {/* Film grain overlay */}
      <div className="noir-grain" />

      {/* Volumetric fog */}
      <div className="noir-fog" />

      {/* NAV */}
      <motion.header
        className="noir-nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease }}
      >
        <div className="noir-nav__inner">
          <a href="/" className="noir-nav__logo">
            <span className="noir-nav__logo-text">JINKI</span>
            <div className="noir-nav__logo-glow" />
          </a>
          <nav className="noir-nav__links">
            <a href="#industries">CASES</a>
            <a href="#platform">TECH</a>
            <a href="#advisory">ADVISOR</a>
          </nav>
          <a href="#contact" className="noir-btn noir-btn--primary">
            BEGIN
          </a>
        </div>
      </motion.header>

      {/* HERO */}
      <section ref={heroRef} className="noir-hero">
        {/* Multiple dramatic spotlights */}
        <div className="noir-hero__spotlight noir-hero__spotlight--1" />
        <div className="noir-hero__spotlight noir-hero__spotlight--2" />
        <div className="noir-hero__spotlight noir-hero__spotlight--3" />

        {/* Volumetric light beams */}
        <div className="noir-hero__beams">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="noir-hero__beam"
              style={{
                '--beam-delay': `${i * 0.3}s`,
                '--beam-duration': `${8 + i * 0.5}s`,
                left: `${10 + i * 8}%`
              }}
            />
          ))}
        </div>

        {/* Noir ASCII Eye */}
        <motion.div
          className="noir-hero__eye"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.3, ease }}
        >
          <NoirAsciiEye />
        </motion.div>

        <motion.div
          className="noir-hero__content"
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        >
          <motion.p
            className="noir-hero__tagline"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1, ease }}
          >
            EX ALTO OMNIA
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2, ease }}
          >
            In Darkness, <br/>
            <span className="noir-neon">We Illuminate</span>
          </motion.h1>

          <motion.p
            className="noir-hero__subtitle"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.5, ease }}
          >
            Autonomous aerial intelligence piercing through shadows.<br/>
            Detecting catastrophe before it emerges from the darkness.
          </motion.p>

          <motion.div
            className="noir-hero__actions"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.8, ease }}
          >
            <a href="#contact" className="noir-btn noir-btn--primary noir-btn--lg">
              <span>ILLUMINATE THE PATH</span>
              <div className="noir-btn__glow" />
            </a>
            <a href="#industries" className="noir-btn noir-btn--ghost noir-btn--lg">
              <span>EXPLORE THE SHADOWS</span>
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className="noir-hero__stats"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2.1, ease }}
        >
          <Counter value="700" prefix="$" suffix="K" label="Catastrophes Prevented"/>
          <Counter value="72" suffix="hrs" label="Before Darkness Falls"/>
          <Counter value="94" suffix="%" label="Precision in Shadows"/>
          <Counter value="58" suffix="%" label="Cost Vanished"/>
        </motion.div>

        {/* Vignette effect */}
        <div className="noir-hero__vignette" />
      </section>

      {/* INDUSTRIES */}
      <section id="industries" className="noir-section">
        <FadeUp className="noir-section__header">
          <p className="noir-section__eyebrow">CASE FILES</p>
          <h2>
            Where Shadows<br/>
            <span className="noir-neon">Meet Light</span>
          </h2>
          <p className="noir-section__subtitle">
            Every infrastructure has its darkness. We bring the spotlight.
          </p>
        </FadeUp>

        <div className="noir-cards">
          {industries.map((industry, i) => (
            <NoirCard key={i} {...industry} index={i}/>
          ))}
        </div>
      </section>

      {/* PLATFORM */}
      <section id="platform" className="noir-section noir-section--spotlight">
        {/* Dramatic spotlight for this section */}
        <div className="noir-section__spotlight-bg" />

        <div className="noir-platform">
          <FadeUp className="noir-platform__text">
            <p className="noir-section__eyebrow">ARSENAL</p>
            <h2>
              Tools of <br/>
              <span className="noir-neon">Illumination</span>
            </h2>
            <p className="noir-platform__lead">
              Military-grade vision. Weatherproof darkness-piercing optics.
              Redundant flight systems. 59 minutes of relentless surveillance.
            </p>
            <div className="noir-features">
              {[
                '0.05°C Thermal Vision',
                'LiDAR @ 2.4M pts/sec',
                'IP55 All-Weather',
                'Redundant Systems',
                '20km Transmission',
                '±1cm RTK Precision'
              ].map((f, i) => (
                <motion.div
                  key={i}
                  className="noir-feature"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease }}
                >
                  <span className="noir-feature__dot">●</span>
                  <span>{f}</span>
                  <div className="noir-feature__glow" />
                </motion.div>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.3} className="noir-platform__visual">
            <div className="noir-platform__screen">
              <div className="noir-platform__screen-glow" />
              <pre className="noir-platform__ascii">
{`╔════════════════════════════╗
║  ▓▓▓ JINKI PLATFORM ▓▓▓  ║
╠════════════════════════════╣
║                            ║
║  ◉ THERMAL    ▰▰▰▰▰▰▰▰▱▱ ║
║  ◉ LiDAR      ▰▰▰▰▰▰▰▰▰▱ ║
║  ◉ NDVI       ▰▰▰▰▰▰▰▰▱▱ ║
║  ◉ OGI        ▰▰▰▰▰▰▰▰▰▰ ║
║                            ║
║  ┌────────────────────┐   ║
║  │  ◈ 59min ENDURE ◈  │   ║
║  │  ◈ ±1cm ACCURACY ◈ │   ║
║  └────────────────────┘   ║
║                            ║
╚════════════════════════════╝`}
              </pre>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ADVISORY */}
      <section id="advisory" className="noir-section">
        <FadeUp className="noir-section__header">
          <p className="noir-section__eyebrow">THE GUIDE</p>
          <h2>
            Expert in <br/>
            <span className="noir-neon">Cyber Shadows</span>
          </h2>
          <p className="noir-section__subtitle">
            Security architecture forged in darkness
          </p>
        </FadeUp>

        <FadeUp delay={0.3} className="noir-advisor">
          <div className="noir-advisor__spotlight" />

          <div className="noir-advisor__avatar">
            <pre className="noir-advisor__ascii">
{`╔═══════╗
║ ◉   ◉ ║
║   ▽   ║
║ ─────ï║
╚═══════╝`}
            </pre>
            <div className="noir-advisor__avatar-glow" />
          </div>

          <h3>Abdillahi A.</h3>
          <p className="noir-advisor__role">SHADOW ARCHITECT</p>
          <div className="noir-advisor__divider" />

          <p className="noir-advisor__bio">
            Enterprise security forged in the trenches of critical infrastructure.
            AI governance where algorithms meet darkness. Zero-trust frameworks
            for energy grids, data centers, and utilities that never sleep.
            Risk management when failure means catastrophe.
          </p>

          <div className="noir-advisor__certs">
            {['CISSP', 'CCSP', 'AIGP', 'PMP'].map(c => (
              <div key={c} className="noir-cert">
                <span>{c}</span>
                <div className="noir-cert__glow" />
              </div>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* CTA */}
      <section id="contact" className="noir-section noir-section--cta">
        {/* Massive dramatic spotlight */}
        <div className="noir-cta__spotlight" />

        <FadeUp className="noir-cta">
          <motion.div
            className="noir-cta__icon"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <pre className="noir-cta__ascii">
{`    ◉
   ╱ ╲
  ╱   ╲
 ◉─────◉`}
            </pre>
            <div className="noir-cta__icon-glow" />
          </motion.div>

          <h2>
            Step Into<br/>
            <span className="noir-neon">The Light</span>
          </h2>

          <p className="noir-cta__tagline">Ex Alto Omnia — From Above, All Things</p>
          <p className="noir-cta__subtitle">
            The next million-dollar disaster is forming in darkness.<br/>
            Will you see it coming?
          </p>

          <div className="noir-cta__actions">
            <a href="tel:+15551234567" className="noir-btn noir-btn--primary noir-btn--xl">
              <span>CALL THE LIGHT</span>
              <div className="noir-btn__glow" />
            </a>
            <a href="mailto:contact@jinki.io" className="noir-btn noir-btn--ghost noir-btn--xl">
              <span>SEND A SIGNAL</span>
            </a>
          </div>
        </FadeUp>
      </section>

      {/* FOOTER */}
      <footer className="noir-footer">
        <div className="noir-footer__inner">
          <div className="noir-footer__brand">
            <span className="noir-footer__logo">
              ◉ JINKI INTELLIGENCE
              <div className="noir-footer__logo-glow" />
            </span>
            <span className="noir-footer__tagline">Ex Alto Omnia</span>
          </div>
          <span className="noir-footer__copy">
            © 2026 Jinki Intelligence. Illuminating the darkness.
          </span>
        </div>
      </footer>
    </div>
  )
}
