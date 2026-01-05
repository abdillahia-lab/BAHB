import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import './Mega5.css'

// Single dot that pulses - the only visual element
function VoidDot() {
  return (
    <motion.div
      className="void-dot"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.4, 0.6, 0.4]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}

export default function Mega5() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="void">
      {/* Nav - minimal */}
      <nav className="void-nav">
        <span className="void-nav__logo">JINKI</span>
      </nav>

      {/* Hero - massive space */}
      <section className="void-hero">
        <VoidDot />

        <motion.h1
          className="void-hero__title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        >
          Ex Alto Omnia
        </motion.h1>

        <motion.p
          className="void-hero__sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1 }}
        >
          From above, all things
        </motion.p>

        <motion.a
          href="#contact"
          className="void-cta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1.5 }}
        >
          Begin
        </motion.a>
      </section>

      {/* Single capability statement - extreme spacing */}
      <section className="void-capability">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2 }}
        >
          Autonomous aerial intelligence
        </motion.p>
      </section>

      {/* Single stat - massive negative space */}
      <section className="void-stat">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2 }}
        >
          <span className="void-stat__value">72</span>
          <span className="void-stat__label">Hours early detection</span>
        </motion.div>
      </section>

      {/* Platform - one line */}
      <section className="void-platform">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2 }}
        >
          0.05°C thermal sensitivity · 2.4M pts/sec LiDAR · ±1cm precision
        </motion.p>
      </section>

      {/* Advisory - minimal */}
      <section className="void-advisory">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2 }}
        >
          <p className="void-advisory__name">Abdillahi A.</p>
          <p className="void-advisory__title">Principal Security Architect</p>
          <p className="void-advisory__certs">CISSP · CCSP · AIGP · PMP</p>
        </motion.div>
      </section>

      {/* Final CTA - extreme simplicity */}
      <section id="contact" className="void-contact">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2 }}
        >
          <VoidDot />
          <h2 className="void-contact__title">See everything</h2>
          <div className="void-contact__actions">
            <a href="tel:+15551234567" className="void-link">Call</a>
            <span className="void-divider">·</span>
            <a href="mailto:contact@jinki.io" className="void-link">Email</a>
          </div>
        </motion.div>
      </section>

      {/* Footer - absolute minimum */}
      <footer className="void-footer">
        <span>JINKI</span>
        <span>2026</span>
      </footer>
    </div>
  )
}
