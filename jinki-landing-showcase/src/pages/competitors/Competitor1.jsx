import { useState, useEffect } from 'react'
import './Competitor1.css'

// BRUTALIST COMPETITOR 1
// Raw. Unpolished. Maximum Impact.

function GridPattern() {
  return (
    <div className="brutal-grid">
      {Array.from({ length: 100 }).map((_, i) => (
        <div key={i} className="brutal-grid__cell" />
      ))}
    </div>
  )
}

function TypeWriter({ text, speed = 50 }) {
  const [displayed, setDisplayed] = useState('')
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayed(prev => prev + text[index])
        setIndex(i => i + 1)
      }, speed)
      return () => clearTimeout(timer)
    }
  }, [index, text, speed])

  return <span>{displayed}<span className="cursor">█</span></span>
}

function Glitch({ children }) {
  const [glitching, setGlitching] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true)
      setTimeout(() => setGlitching(false), 100)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className={glitching ? 'glitch-active' : ''} data-text={children}>
      {children}
    </span>
  )
}

export default function Competitor1() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const industries = [
    {
      num: '01',
      title: 'DATA CENTERS',
      stat: '$700K',
      detail: 'AVG OUTAGE COST',
      problem: '19% OF OUTAGES = COOLING FAILURES',
      solution: 'THERMAL MONITORING 0.05°C SENSITIVITY / 72HR EARLY DETECTION'
    },
    {
      num: '02',
      title: 'ELECTRIC UTILITIES',
      stat: '60%',
      detail: 'COST REDUCTION',
      problem: 'GROUND CREWS MISS 48% DEFECTS / $2000+/HR HELICOPTERS',
      solution: 'LIDAR 2.4M POINTS/SEC / 4.5X MORE DEFECTS FOUND'
    },
    {
      num: '03',
      title: 'AGRICULTURE',
      stat: '14 DAYS',
      detail: 'EARLIER DETECTION',
      problem: 'CROP STRESS VISIBLE AFTER 14+ DAYS DAMAGE',
      solution: 'NDVI MULTISPECTRAL IMAGING / 150% PROVEN ROI'
    },
    {
      num: '04',
      title: 'OIL & GAS',
      stat: '99.2%',
      detail: 'DETECTION RATE',
      problem: 'EPA REQUIRES CONTINUOUS METHANE MONITORING',
      solution: 'OPTICAL GAS IMAGING / 14KM DAILY COVERAGE'
    }
  ]

  return (
    <div className="brutal">
      {/* EXPOSED GRID BACKGROUND */}
      <GridPattern />

      {/* HEADER BAR */}
      <header className="brutal-header">
        <div className="brutal-header__status">
          <span className="brutal-header__indicator">●</span>
          SYSTEM ONLINE
        </div>
        <div className="brutal-header__logo">
          JINKI_INTELLIGENCE
        </div>
        <div className="brutal-header__time">
          {time.toLocaleTimeString('en-US', { hour12: false })}
        </div>
      </header>

      {/* HERO - MAXIMUM IMPACT */}
      <section className="brutal-hero">
        <div className="brutal-hero__container">
          {/* ASCII EYE - RAW */}
          <pre className="brutal-ascii">
{`    ███████████████████
    ███           ███
    ██   ███████   ██
    ██  █ ▓▓▓▓▓ █  ██
    ██  █ ▓███▓ █  ██
    ██  █ ▓▓▓▓▓ █  ██
    ██   ███████   ██
    ███           ███
    ███████████████████`}
          </pre>

          <div className="brutal-hero__text">
            <div className="brutal-tag">EX ALTO OMNIA</div>

            <h1 className="brutal-h1">
              <Glitch>FROM ABOVE</Glitch>
              <br />
              <span className="brutal-h1__red">ALL THINGS</span>
            </h1>

            <div className="brutal-subtitle">
              AUTONOMOUS AERIAL INTELLIGENCE
              <br />
              CRITICAL INFRASTRUCTURE
              <br />
              DETECT BEFORE CATASTROPHIC FAILURE
            </div>

            <div className="brutal-cta">
              <a href="#contact" className="brutal-btn brutal-btn--primary">
                SCHEDULE_ASSESSMENT
              </a>
              <a href="#industries" className="brutal-btn brutal-btn--outline">
                VIEW_SOLUTIONS
              </a>
            </div>
          </div>
        </div>

        {/* STATS BAR - EXPOSED */}
        <div className="brutal-stats">
          <div className="brutal-stat">
            <div className="brutal-stat__value">$700K</div>
            <div className="brutal-stat__label">AVG OUTAGE PREVENTED</div>
          </div>
          <div className="brutal-stat">
            <div className="brutal-stat__value">72HRS</div>
            <div className="brutal-stat__label">EARLY DETECTION</div>
          </div>
          <div className="brutal-stat">
            <div className="brutal-stat__value">94%</div>
            <div className="brutal-stat__label">FAULT ACCURACY</div>
          </div>
          <div className="brutal-stat">
            <div className="brutal-stat__value">58%</div>
            <div className="brutal-stat__label">COST REDUCTION</div>
          </div>
        </div>
      </section>

      {/* INDUSTRIES - ASYMMETRIC GRID */}
      <section id="industries" className="brutal-section">
        <div className="brutal-section__header">
          <div className="brutal-section__number">[SOLUTIONS]</div>
          <h2 className="brutal-h2">
            CRITICAL
            <br />
            INFRASTRUCTURE
            <br />
            <span className="brutal-h2__red">INTELLIGENCE</span>
          </h2>
        </div>

        <div className="brutal-industries">
          {industries.map((industry) => (
            <div key={industry.num} className="brutal-card">
              <div className="brutal-card__header">
                <div className="brutal-card__num">{industry.num}</div>
                <div className="brutal-card__title">{industry.title}</div>
              </div>

              <div className="brutal-card__stat">
                <div className="brutal-card__stat-value">{industry.stat}</div>
                <div className="brutal-card__stat-label">{industry.detail}</div>
              </div>

              <div className="brutal-card__section">
                <div className="brutal-card__label">///PROBLEM</div>
                <div className="brutal-card__text">{industry.problem}</div>
              </div>

              <div className="brutal-card__section">
                <div className="brutal-card__label">///SOLUTION</div>
                <div className="brutal-card__text">{industry.solution}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PLATFORM - EXPOSED STRUCTURE */}
      <section id="platform" className="brutal-section brutal-section--alt">
        <div className="brutal-platform">
          <div className="brutal-platform__left">
            <div className="brutal-section__number">[TECHNOLOGY]</div>
            <h2 className="brutal-h2">
              ENTERPRISE
              <br />
              GRADE
              <br />
              <span className="brutal-h2__red">PLATFORM</span>
            </h2>

            <div className="brutal-platform__desc">
              MILITARY-ADJACENT INSPECTION TECHNOLOGY
              <br />
              IP55 RATED ALL-WEATHER
              <br />
              REDUNDANT FLIGHT SYSTEMS
              <br />
              59-MINUTE ENDURANCE
            </div>

            <div className="brutal-features">
              <div className="brutal-feature">→ 0.05°C THERMAL SENSITIVITY</div>
              <div className="brutal-feature">→ LIDAR @ 2.4M PTS/SEC</div>
              <div className="brutal-feature">→ IP55 WEATHER SEALED</div>
              <div className="brutal-feature">→ REDUNDANT FLIGHT SYSTEMS</div>
              <div className="brutal-feature">→ 20KM TRANSMISSION RANGE</div>
              <div className="brutal-feature">→ ±1CM RTK ACCURACY</div>
            </div>
          </div>

          <div className="brutal-platform__right">
            <div className="brutal-box">
              <div className="brutal-box__header">
                JINKI_PLATFORM_V1.0
              </div>
              <div className="brutal-box__content">
                <div className="brutal-box__row">
                  <span>THERMAL</span>
                  <span>████████████</span>
                  <span>ONLINE</span>
                </div>
                <div className="brutal-box__row">
                  <span>LIDAR</span>
                  <span>████████████</span>
                  <span>ONLINE</span>
                </div>
                <div className="brutal-box__row">
                  <span>NDVI</span>
                  <span>████████████</span>
                  <span>ONLINE</span>
                </div>
                <div className="brutal-box__row">
                  <span>OGI</span>
                  <span>████████████</span>
                  <span>ONLINE</span>
                </div>
              </div>
              <div className="brutal-box__footer">
                UPTIME: 59MIN | ACCURACY: ±1CM RTK
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ADVISORY - MINIMAL */}
      <section id="advisory" className="brutal-section">
        <div className="brutal-section__header">
          <div className="brutal-section__number">[ADVISORY]</div>
          <h2 className="brutal-h2">
            CYBER & AI
            <br />
            <span className="brutal-h2__red">EXPERTISE</span>
          </h2>
        </div>

        <div className="brutal-advisor">
          <div className="brutal-advisor__header">
            <div className="brutal-advisor__id">
              <pre className="brutal-advisor__avatar">
{`┌─────┐
│ ◉ ◉ │
│  ▽  │
│ ─── │
└─────┘`}
              </pre>
            </div>
            <div className="brutal-advisor__info">
              <div className="brutal-advisor__name">ABDILLAHI A.</div>
              <div className="brutal-advisor__role">PRINCIPAL SECURITY ARCHITECT</div>
            </div>
          </div>

          <div className="brutal-advisor__bio">
            ENTERPRISE SECURITY ARCHITECTURE / AI GOVERNANCE / RISK MANAGEMENT
            FOR CRITICAL INFRASTRUCTURE / ZERO-TRUST FRAMEWORKS / REGULATORY
            COMPLIANCE FOR ENERGY / UTILITIES / DATA CENTER SECTORS
          </div>

          <div className="brutal-advisor__certs">
            {['CISSP', 'CCSP', 'AIGP', 'PMP'].map(cert => (
              <div key={cert} className="brutal-cert">[{cert}]</div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - HARD IMPACT */}
      <section id="contact" className="brutal-section brutal-section--cta">
        <div className="brutal-final">
          <div className="brutal-final__eye">
            <pre>
{`    ◉
   ╱ ╲
  ╱   ╲
 ◉─────◉`}
            </pre>
          </div>

          <h2 className="brutal-final__h2">
            READY TO SEE
            <br />
            <span className="brutal-h2__red">EVERYTHING?</span>
          </h2>

          <div className="brutal-final__tagline">
            EX ALTO OMNIA — FROM ABOVE, ALL THINGS
          </div>

          <div className="brutal-final__text">
            SCHEDULE CONSULTATION
            <br />
            PREVENT NEXT MILLION-DOLLAR OUTAGE
          </div>

          <div className="brutal-final__actions">
            <a href="tel:+15551234567" className="brutal-btn brutal-btn--primary brutal-btn--lg">
              CALL_NOW
            </a>
            <a href="mailto:contact@jinki.io" className="brutal-btn brutal-btn--outline brutal-btn--lg">
              EMAIL_US
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER - RAW */}
      <footer className="brutal-footer">
        <div className="brutal-footer__left">
          <div className="brutal-footer__logo">◉ JINKI_INTELLIGENCE</div>
          <div className="brutal-footer__tagline">EX ALTO OMNIA</div>
        </div>
        <div className="brutal-footer__right">
          © 2026 JINKI INTELLIGENCE / ALL RIGHTS RESERVED
        </div>
      </footer>
    </div>
  )
}
