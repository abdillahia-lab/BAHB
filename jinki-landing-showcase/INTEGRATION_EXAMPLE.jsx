/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  COMPLETE INTEGRATION EXAMPLE                                             ║
 * ║  How to integrate typography & micro-interactions into LandingPage3       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import React, { useEffect, useRef, useState } from 'react';
import NumberCounter, { useCounterOnView, PercentageCounter, LargeNumberCounter } from './components/NumberCounter';
import { useTextScramble, useCharacterReveal, useTypingEffect } from './hooks/useTextAnimations';
import {
  init3DCardTilt,
  initMagneticButton,
  initScrollProgress,
  initScrollAnimations,
  initSmoothScroll,
  initAllMicroInteractions
} from './components/microinteractions';

// Import both CSS files
import './pages/LandingPage3.css';
import './pages/typography-microinteractions.css';

function EnhancedLandingPage() {
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    // Mark page as loaded after mount
    setTimeout(() => setPageLoaded(true), 100);

    // Initialize all micro-interactions
    const cleanup = initAllMicroInteractions({
      card3D: {
        maxTilt: 12,
        perspective: 1000,
        scale: 1.03,
        glare: true,
      },
      magnetic: {
        strength: 15,
        distance: 120,
      },
      smoothScroll: {
        offset: 80,
        duration: 800,
      },
      scrollAnimations: {
        threshold: 0.15,
        once: true,
      },
    });

    return cleanup;
  }, []);

  return (
    <div className={`page ${pageLoaded ? 'page--loaded' : 'page--loading'}`}>
      {/* Scroll Progress Bar */}
      <div className="scroll-progress"></div>

      {/* Navigation */}
      <Nav />

      {/* Enhanced Hero Section */}
      <EnhancedHero />

      {/* Trust Bar */}
      <TrustBar />

      {/* Problem Section with Counter */}
      <EnhancedProblem />

      {/* Solutions with 3D Cards */}
      <EnhancedSolutions />

      {/* Platform Section */}
      <PlatformSection />

      {/* Coverage Section */}
      <CoverageSection />

      {/* About Section with Text Animation */}
      <EnhancedAbout />

      {/* CTA with Magnetic Button */}
      <EnhancedCTA />

      {/* Footer */}
      <Footer />
    </div>
  );
}


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENHANCED HERO SECTION
 * Features: Text scramble, character reveal, animated counters
 * ═══════════════════════════════════════════════════════════════════════════
 */

function EnhancedHero() {
  // Text scramble for main headline
  const mainHeadline = useTextScramble('Transform Healthcare', 2000, 300);

  // Character reveal for second line
  const subHeadlineChars = useCharacterReveal('With Intelligence', 40, true);

  // Typing effect for description
  const description = useTypingEffect(
    'Real-time monitoring, predictive analytics, and seamless integration.',
    80,
    1500
  );

  // Counter trigger
  const [statsRef, statsTriggered] = useCounterOnView(0.3);

  return (
    <section className="hero">
      <div className="hero__video-container">
        <video className="hero__video hero__video--loaded" autoPlay loop muted playsInline>
          <source src="/video/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="hero__gradient-overlay"></div>
      </div>

      <div className="hero__wrapper">
        <div className="hero__content">
          {/* Badge with pulse */}
          <div className="hero__badge glass-panel">
            <span className="hero__badge-dot"></span>
            <span>Now Live</span>
          </div>

          {/* Animated Headlines */}
          <div className="hero__headline">
            <h1 className="hero__headline-line type-7xl text-balance">
              {mainHeadline}
            </h1>

            <h2 className="hero__headline-accent type-7xl text-balance">
              {subHeadlineChars.map(({ char, delay, key }) => (
                <span
                  key={key}
                  className="char-reveal liquid-text"
                  style={{ animationDelay: `${delay}ms` }}
                >
                  {char}
                </span>
              ))}
            </h2>
          </div>

          {/* Description with typing effect */}
          <p className="hero__description type-lg text-pretty">
            {description}
            <span className="cursor-blink">|</span>
          </p>

          {/* Action Buttons with Ripple */}
          <div className="hero__actions">
            <a
              href="#demo"
              className="btn btn--primary btn--lg liquid-metal ripple hover-lift-glow"
            >
              <span>Request Demo</span>
              <svg className="btn__arrow" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
              </svg>
            </a>

            <a
              href="#features"
              className="btn btn--glass btn--lg ripple ripple-dark link-underline-slide"
            >
              <span>Learn More</span>
            </a>
          </div>
        </div>

        {/* Animated Stats Panel */}
        <div ref={statsRef} className="hero__stats glass-panel">
          <div className="hero__stat">
            <NumberCounter
              end={1250}
              start={0}
              duration={2500}
              trigger={statsTriggered}
              suffix="+"
              className="hero__stat-value counter--highlight font-tabular-nums"
            />
            <span className="hero__stat-label type-xs">Healthcare Facilities</span>
          </div>

          <div className="hero__stat-divider"></div>

          <div className="hero__stat">
            <PercentageCounter
              value={99.9}
              duration={2500}
              trigger={statsTriggered}
              decimals={1}
              className="hero__stat-value counter--highlight font-tabular-nums"
            />
            <span className="hero__stat-label type-xs">Uptime</span>
          </div>

          <div className="hero__stat-divider"></div>

          <div className="hero__stat">
            <LargeNumberCounter
              value={2500000}
              duration={2500}
              trigger={statsTriggered}
              className="hero__stat-value counter--highlight font-tabular-nums"
            />
            <span className="hero__stat-label type-xs">Lives Monitored</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="hero__scroll">
          <div className="hero__scroll-track">
            <div className="hero__scroll-thumb"></div>
          </div>
          <span className="hero__scroll-text type-xs">Scroll</span>
        </div>
      </div>
    </section>
  );
}


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENHANCED PROBLEM SECTION
 * Features: Animated counter with intersection observer
 * ═══════════════════════════════════════════════════════════════════════════
 */

function EnhancedProblem() {
  const [ref, hasTriggered] = useCounterOnView(0.4);

  return (
    <section className="problem">
      <div className="problem__container">
        <div ref={ref} className="problem__metric animate-on-scroll">
          <span className="problem__number type-7xl font-tabular-nums">
            <NumberCounter
              end={73}
              trigger={hasTriggered}
              suffix="%"
              duration={2000}
              className="counter--highlight"
            />
          </span>
          <span className="problem__caption type-sm text-balance">
            of critical incidents go undetected until it's too late
          </span>
        </div>

        <div className="problem__content animate-on-scroll animate-on-scroll--delay-2">
          <h2 className="problem__title type-4xl text-balance">
            Healthcare monitoring shouldn't be reactive
          </h2>
          <p className="problem__text type-lg text-pretty">
            Traditional systems only alert after problems occur. By then, it's often too late.
            Jinki's AI-powered platform predicts issues before they become critical, giving your
            team the time they need to act.
          </p>
        </div>
      </div>
    </section>
  );
}


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENHANCED SOLUTIONS SECTION
 * Features: 3D card tilt, hover lift, icon animations
 * ═══════════════════════════════════════════════════════════════════════════
 */

function EnhancedSolutions() {
  return (
    <section className="solutions">
      <div className="solutions__container">
        <div className="solutions__header animate-on-scroll">
          <span className="section-label type-sm">Solutions</span>
          <h2 className="section-title type-5xl text-balance">
            Four Pillars of Intelligent Care
          </h2>
          <p className="section-subtitle type-lg text-balance">
            Comprehensive monitoring powered by real-time AI
          </p>
        </div>

        <div className="solutions__grid">
          <SolutionCard
            icon={MonitorIcon}
            title="Real-Time Monitoring"
            description="Track vital signs, equipment status, and environmental conditions 24/7."
            features={[
              'Sub-second latency',
              'Multi-parameter tracking',
              'Automated escalation',
            ]}
            delay="0.1s"
          />

          <SolutionCard
            icon={BrainIcon}
            title="Predictive Analytics"
            description="AI models predict deterioration hours before conventional alerts."
            features={[
              'Machine learning models',
              'Pattern recognition',
              'Risk stratification',
            ]}
            delay="0.2s"
          />

          <SolutionCard
            icon={IntegrationIcon}
            title="Seamless Integration"
            description="Works with your existing EMR, devices, and workflows."
            features={[
              'HL7 & FHIR support',
              'Vendor agnostic',
              'Zero downtime deployment',
            ]}
            delay="0.3s"
          />

          <SolutionCard
            icon={TeamIcon}
            title="Team Coordination"
            description="Keep everyone in sync with intelligent notifications."
            features={[
              'Role-based alerts',
              'Multi-channel delivery',
              'Escalation protocols',
            ]}
            delay="0.4s"
          />
        </div>
      </div>
    </section>
  );
}

function SolutionCard({ icon: Icon, title, description, features, delay }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const cleanup = init3DCardTilt(cardRef.current, {
      maxTilt: 10,
      perspective: 1000,
      scale: 1.02,
      glare: true,
    });

    return cleanup;
  }, []);

  return (
    <div
      ref={cardRef}
      className="solution-card glass-panel card-3d animate-on-scroll hover-lift"
      style={{ animationDelay: delay }}
    >
      <div className="card-3d-content">
        <div className="card-3d-shine"></div>

        <div className="solution-card__icon icon-bounce">
          <Icon />
        </div>

        <h3 className="solution-card__title type-xl">{title}</h3>

        <p className="solution-card__desc type-base text-pretty">
          {description}
        </p>

        <ul className="solution-card__features">
          {features.map((feature, i) => (
            <li key={i}>
              <span className="check-icon">✓</span>
              <span className="type-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENHANCED ABOUT SECTION
 * Features: Text animations, gradient text
 * ═══════════════════════════════════════════════════════════════════════════
 */

function EnhancedAbout() {
  return (
    <section className="about">
      <div className="about__container animate-on-scroll">
        <h2 className="about__motto type-6xl text-balance text-shimmer">
          Care with Confidence
        </h2>

        <p className="about__tagline type-xl text-gradient-animate">
          Technology that puts people first
        </p>

        <div className="about__text">
          <p className="type-lg text-pretty">
            Founded by healthcare professionals who experienced the limitations of traditional
            monitoring firsthand, Jinki Intelligence was built to solve real problems with
            intelligent technology.
          </p>

          <p className="type-lg text-pretty">
            Our platform combines cutting-edge AI with healthcare expertise to deliver a system
            that's powerful yet intuitive, comprehensive yet focused on what matters most: patient care.
          </p>
        </div>
      </div>
    </section>
  );
}


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENHANCED CTA SECTION
 * Features: Magnetic button, ripple effect
 * ═══════════════════════════════════════════════════════════════════════════
 */

function EnhancedCTA() {
  const btnRef = useRef(null);

  useEffect(() => {
    const cleanup = initMagneticButton(btnRef.current, {
      strength: 20,
      distance: 120,
    });

    return cleanup;
  }, []);

  return (
    <section className="cta">
      <div className="cta__container animate-on-scroll">
        <h2 className="cta__title type-5xl text-balance">
          Ready to transform your healthcare monitoring?
        </h2>

        <p className="cta__desc type-lg text-balance">
          Join over 1,250 healthcare facilities using Jinki Intelligence to deliver better care.
        </p>

        <button
          ref={btnRef}
          className="btn btn--primary btn--lg liquid-metal ripple btn-magnetic hover-lift-glow"
        >
          <span>Request a Demo</span>
          <svg className="btn__arrow" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
          </svg>
        </button>

        <span className="cta__note type-sm">
          No credit card required • 30-day free trial
        </span>
      </div>
    </section>
  );
}


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PLACEHOLDER COMPONENTS (Use your existing Nav, TrustBar, etc.)
 * ═══════════════════════════════════════════════════════════════════════════
 */

function Nav() {
  return (
    <nav className="nav nav--glass">
      <div className="nav__container">
        <a href="#" className="nav__brand">
          <div className="nav__logo icon-rotate">
            <svg viewBox="0 0 40 40" fill="currentColor">
              <circle cx="20" cy="20" r="18" opacity="0.1"/>
              <path d="M20 8 L32 20 L20 32 L8 20 Z" />
            </svg>
          </div>
          <span className="nav__wordmark type-sm">JINKI</span>
        </a>

        <div className="nav__menu">
          <a href="#solutions" className="nav__link link-underline-slide type-sm">Solutions</a>
          <a href="#platform" className="nav__link link-underline-slide type-sm">Platform</a>
          <a href="#about" className="nav__link link-underline-slide type-sm">About</a>
          <a href="#contact" className="nav__cta liquid-metal ripple type-sm">Get Started</a>
        </div>
      </div>
    </nav>
  );
}

function TrustBar() {
  return (
    <section className="trust">
      <div className="trust__container">
        <span className="trust__label type-xs">Trusted by leading institutions</span>
        <div className="trust__list">
          <span className="type-sm">Stanford Health</span>
          <span className="trust__dot">•</span>
          <span className="type-sm">Mayo Clinic</span>
          <span className="trust__dot">•</span>
          <span className="type-sm">Johns Hopkins</span>
        </div>
      </div>
    </section>
  );
}

function PlatformSection() {
  return <section className="platform">{/* Your existing platform section */}</section>;
}

function CoverageSection() {
  return <section className="coverage">{/* Your existing coverage section */}</section>;
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__brand">
          <div className="footer__logo icon-pulse">
            <svg viewBox="0 0 32 32" fill="currentColor">
              <circle cx="16" cy="16" r="14" opacity="0.1"/>
              <path d="M16 6 L26 16 L16 26 L6 16 Z" />
            </svg>
          </div>
          <span className="footer__wordmark type-xs">JINKI INTELLIGENCE</span>
        </div>

        <nav className="footer__nav">
          <a href="#privacy" className="link-underline-slide type-sm">Privacy</a>
          <a href="#terms" className="link-underline-slide type-sm">Terms</a>
          <a href="#contact" className="link-underline-slide type-sm">Contact</a>
        </nav>

        <div className="footer__legal">
          <span className="type-xs">© 2024 Jinki Intelligence</span>
          <span className="footer__sep">•</span>
          <span className="type-xs">All rights reserved</span>
        </div>
      </div>
    </footer>
  );
}


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ICON COMPONENTS (Placeholder - use your actual icons)
 * ═══════════════════════════════════════════════════════════════════════════
 */

const MonitorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const BrainIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4 4 4 0 0 0 4-4V6a4 4 0 0 0-4-4z" />
    <path d="M8 14v4a4 4 0 0 0 8 0v-4" />
  </svg>
);

const IntegrationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <circle cx="6" cy="6" r="2" />
    <circle cx="18" cy="6" r="2" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
    <line x1="8" y1="6" x2="10" y2="10" />
    <line x1="16" y1="6" x2="14" y2="10" />
    <line x1="8" y1="18" x2="10" y2="14" />
    <line x1="16" y1="18" x2="14" y2="14" />
  </svg>
);

const TeamIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);


export default EnhancedLandingPage;
