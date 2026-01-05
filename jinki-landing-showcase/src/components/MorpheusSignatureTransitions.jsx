/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MORPHEUS: SIGNATURE TRANSITIONS COMPONENT
 * 3 Mind-Blowing Implementations Ready to Deploy
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  PortalTransition,
  AsciiToRenderedTransition,
  GlassShatterEffect,
  RealityDistortionScroll,
  MorphingEasings,
} from '../utils/advancedTransitions';
import '../styles/morpheusTransitions.css';

/**
 * SIGNATURE TRANSITION #1: ASCII TO RENDERED IMAGE
 * The Jinki cyber-eye morphs from ASCII art into a fully rendered image
 * This represents the transformation from data to vision
 */
export function AsciiToRenderedShowcase() {
  const [showRendered, setShowRendered] = useState(false);
  const asciiRef = useRef(null);
  const imageRef = useRef(null);
  const transitionRef = useRef(
    new AsciiToRenderedTransition({ duration: 1200 })
  );

  const handleTransform = async () => {
    if (showRendered) {
      // Reverse transition: rendered back to ASCII
      setShowRendered(false);
      if (imageRef.current) {
        imageRef.current.style.display = 'none';
      }
      if (asciiRef.current) {
        asciiRef.current.style.display = 'block';
      }
    } else {
      // Forward transition: ASCII to rendered
      await transitionRef.current.transform(asciiRef.current, imageRef.current);
      setShowRendered(true);
    }
  };

  const asciiArt = `
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
    ░░    ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄    ░░
    ░░   ██ JINKI VISION ██   ░░
    ░░    ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀    ░░
    ░░                        ░░
    ░░   ◉◉◉ ◉◉◉ ◉◉◉ ◉◉◉    ░░
    ░░   ◉▓▓ ▓▓▓ ▓▓▓ ▓▓◉    ░░
    ░░   ◉████████████████◉    ░░
    ░░   ◉████████████████◉    ░░
    ░░   ◉▓▓ ▓▓▓ ▓▓▓ ▓▓◉    ░░
    ░░   ◉◉◉ ◉◉◉ ◉◉◉ ◉◉◉    ░░
    ░░                        ░░
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  `;

  return (
    <div className="signature-transition ascii-to-rendered-demo">
      <div className="demo-header">
        <h3>Signature Transition #1: ASCII → Rendered</h3>
        <p>Watch the cyber-eye transform from digital art to full vision</p>
      </div>

      <div className="demo-container">
        <div className="morph-stage">
          <pre
            ref={asciiRef}
            className={`ascii-display ${!showRendered ? 'visible' : 'hidden'}`}
            style={{
              display: !showRendered ? 'block' : 'none',
              fontFamily: 'monospace',
              fontSize: '11px',
              lineHeight: '1.2',
              color: '#00b4d8',
              textShadow: '0 0 20px rgba(0, 180, 216, 0.8)',
              margin: 0,
              padding: '20px',
              background: 'rgba(0, 20, 40, 0.5)',
              border: '1px solid rgba(0, 180, 216, 0.3)',
              borderRadius: '12px',
            }}
          >
            {asciiArt}
          </pre>

          <div
            ref={imageRef}
            className={`rendered-display ${showRendered ? 'visible' : 'hidden'}`}
            style={{
              display: showRendered ? 'block' : 'none',
              width: '100%',
              height: '300px',
              background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.1) 0%, rgba(0, 40, 80, 0.2) 100%)',
              border: '2px solid rgba(0, 180, 216, 0.6)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              backdropFilter: 'blur(10px)',
              color: '#00e5ff',
              fontWeight: 'bold',
              boxShadow: '0 0 40px rgba(0, 180, 216, 0.3), inset 0 0 40px rgba(0, 180, 216, 0.1)',
            }}
          >
            ◉ JINKI VISION REALIZED
          </div>
        </div>

        <button
          onClick={handleTransform}
          className="morph-trigger-btn"
          style={{
            marginTop: '20px',
            padding: '12px 32px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#00e5ff',
            background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.1) 0%, rgba(0, 60, 100, 0.2) 100%)',
            border: '2px solid rgba(0, 180, 216, 0.5)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          {showRendered ? '← Transform Back to ASCII' : 'Transform to Rendered →'}
        </button>
      </div>
    </div>
  );
}

/**
 * SIGNATURE TRANSITION #2: PORTAL SECTION SHIFT
 * Sections transition through portal-like wormholes with reality distortion
 * Creates the illusion of stepping through dimensional gateways
 */
export function PortalSectionTransition() {
  const [activeSection, setActiveSection] = useState(0);
  const sections = [
    {
      id: 0,
      title: 'Thermal Intelligence',
      description: 'Detect infrastructure anomalies 72 hours before failure with precision thermal imaging.',
      icon: '🌡️',
      color: 'rgba(0, 180, 216, 0.1)',
    },
    {
      id: 1,
      title: 'LiDAR Precision',
      description: 'Capture 2.4M points per second for millimeter-accurate 3D mapping.',
      icon: '📡',
      color: 'rgba(0, 100, 180, 0.1)',
    },
    {
      id: 2,
      title: 'Multispectral Vision',
      description: 'See beyond visible light with NDVI and custom spectral imaging.',
      icon: '👁️',
      color: 'rgba(0, 60, 120, 0.1)',
    },
    {
      id: 3,
      title: 'Real-time Analytics',
      description: 'Process and analyze 59 minutes of continuous flight data instantly.',
      icon: '⚡',
      color: 'rgba(0, 150, 200, 0.1)',
    },
  ];

  const portalTransition = useRef(new PortalTransition({ duration: 800 }));

  const handleSectionChange = async (newIndex) => {
    const sectionElement = document.querySelector('.portal-content');
    if (sectionElement && newIndex !== activeSection) {
      await portalTransition.current.applyPortal(sectionElement, 'forward');
      setActiveSection(newIndex);
    }
  };

  const currentSection = sections[activeSection];

  return (
    <div className="signature-transition portal-section-demo">
      <div className="demo-header">
        <h3>Signature Transition #2: Portal Section Shift</h3>
        <p>Seamless section transitions through dimensional portals</p>
      </div>

      <div className="demo-container">
        <div
          className="portal-content transition-liquid"
          style={{
            background: currentSection.color,
            border: '2px solid rgba(0, 180, 216, 0.4)',
            borderRadius: '12px',
            padding: '40px',
            minHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>
            {currentSection.icon}
          </div>
          <h4
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#00e5ff',
              marginBottom: '16px',
              textShadow: '0 0 20px rgba(0, 180, 216, 0.4)',
            }}
          >
            {currentSection.title}
          </h4>
          <p
            style={{
              fontSize: '16px',
              color: '#c9d1d9',
              lineHeight: '1.6',
              maxWidth: '500px',
            }}
          >
            {currentSection.description}
          </p>
        </div>

        <div className="section-nav" style={{ marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {sections.map((section, idx) => (
            <button
              key={section.id}
              onClick={() => handleSectionChange(idx)}
              className={`section-dot ${activeSection === idx ? 'active' : ''}`}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: activeSection === idx ? '2px solid #00e5ff' : '2px solid rgba(0, 180, 216, 0.3)',
                background: activeSection === idx ? 'rgba(0, 229, 255, 0.3)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              aria-label={`Go to section ${idx + 1}`}
            />
          ))}
        </div>

        <div
          className="section-counter"
          style={{
            marginTop: '20px',
            fontSize: '14px',
            color: '#8b949e',
            textAlign: 'center',
          }}
        >
          {activeSection + 1} / {sections.length}
        </div>
      </div>
    </div>
  );
}

/**
 * SIGNATURE TRANSITION #3: LIQUID GLASS MORPHING
 * Interactive state morphing with glass shattering and reformation effects
 * Elements flow and crystallize between states
 */
export function LiquidGlassMorph() {
  const [morphState, setMorphState] = useState('liquid');
  const [isAnimating, setIsAnimating] = useState(false);
  const glassEffect = useRef(new GlassShatterEffect({ duration: 800, fragmentCount: 16 }));

  const states = {
    liquid: {
      shape: 'border-radius: 50%',
      label: 'LIQUID STATE',
      description: 'Fluid. Adaptive. Morphing.',
      color: 'rgba(0, 180, 216, 0.2)',
      borderColor: 'rgba(0, 180, 216, 0.6)',
      size: '200px',
    },
    crystal: {
      shape: 'border-radius: 0%',
      label: 'CRYSTALLIZED',
      description: 'Structured. Solid. Formed.',
      color: 'rgba(0, 100, 180, 0.2)',
      borderColor: 'rgba(0, 100, 180, 0.8)',
      size: '240px',
    },
    shattered: {
      shape: 'clip-path: polygon(0 0, 85% 0, 100% 15%, 100% 100%, 15% 100%, 0 85%)',
      label: 'REFORMED',
      description: 'Shattered. Reintegrated. Whole.',
      color: 'rgba(100, 180, 216, 0.2)',
      borderColor: 'rgba(100, 180, 216, 0.8)',
      size: '220px',
    },
  };

  const handleMorphing = async () => {
    if (isAnimating) return;

    setIsAnimating(true);

    const states_array = Object.keys(states);
    const currentIdx = states_array.indexOf(morphState);
    const nextIdx = (currentIdx + 1) % states_array.length;
    const nextState = states_array[nextIdx];

    const morphElement = document.querySelector('.morph-glass-element');
    if (morphElement) {
      await glassEffect.current.shatter(morphElement);
    }

    setMorphState(nextState);
    setIsAnimating(false);
  };

  const currentState = states[morphState];

  return (
    <div className="signature-transition liquid-glass-demo">
      <div className="demo-header">
        <h3>Signature Transition #3: Liquid Glass Morphing</h3>
        <p>Watch matter flow, shatter, and reform through dimensional states</p>
      </div>

      <div className="demo-container">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Morphing glass element */}
          <motion.div
            className="morph-glass-element transition-glass"
            style={{
              width: currentState.size,
              height: currentState.size,
              background: currentState.color,
              border: `3px solid ${currentState.borderColor}`,
              backdropFilter: 'blur(10px)',
              boxShadow: `0 0 60px ${currentState.borderColor}, inset 0 0 40px rgba(0, 180, 216, 0.2)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'center',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            key={morphState}
          >
            <div
              style={{
                fontSize: '48px',
                fontWeight: '900',
                color: '#00e5ff',
                textShadow: '0 0 20px rgba(0, 180, 216, 0.6)',
              }}
            >
              ◆
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#00e5ff',
                letterSpacing: '0.1em',
              }}
            >
              {currentState.label}
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#8b949e',
                fontStyle: 'italic',
              }}
            >
              {currentState.description}
            </div>
          </motion.div>

          {/* Background shimmer effect */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle, ${currentState.borderColor} 0%, transparent 70%)`,
              opacity: 0.3,
              pointerEvents: 'none',
              transition: 'all 0.8s ease',
            }}
          />
        </div>

        {/* Control buttons */}
        <div style={{ marginTop: '40px', textAlign: 'center', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleMorphing}
            disabled={isAnimating}
            className="morph-action-btn"
            style={{
              padding: '12px 28px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#00e5ff',
              background: `linear-gradient(135deg, ${currentState.color} 0%, rgba(0, 60, 100, 0.2) 100%)`,
              border: `2px solid ${currentState.borderColor}`,
              borderRadius: '8px',
              cursor: isAnimating ? 'not-allowed' : 'pointer',
              opacity: isAnimating ? 0.6 : 1,
              transition: 'all 0.3s ease',
            }}
          >
            {isAnimating ? 'MORPHING...' : 'MORPH STATE'}
          </button>

          <div
            style={{
              padding: '12px 20px',
              fontSize: '13px',
              color: '#8b949e',
              background: 'rgba(0, 20, 40, 0.4)',
              border: '1px solid rgba(0, 180, 216, 0.2)',
              borderRadius: '8px',
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
            }}
          >
            STATE: {morphState.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * INTEGRATED TRANSITIONS SHOWCASE
 * Complete component showing all signature transitions
 */
export default function MorpheusSignatureTransitions() {
  useEffect(() => {
    // Initialize reality distortion scroll effect (optional)
    const distortion = new RealityDistortionScroll({ intensity: 0.3 });
    const cleanup = distortion.init();

    return () => cleanup?.();
  }, []);

  return (
    <div className="morpheus-showcase">
      <style>{`
        .morpheus-showcase {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px;
        }

        .morpheus-showcase h2 {
          font-size: 42px;
          font-weight: 900;
          text-align: center;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #00e5ff 0%, #00b4d8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .morpheus-showcase > p {
          font-size: 18px;
          color: #8b949e;
          text-align: center;
          margin-bottom: 60px;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .signature-transition {
          margin-bottom: 80px;
          padding: 40px;
          background: linear-gradient(135deg, rgba(0, 20, 40, 0.3) 0%, rgba(0, 40, 60, 0.2) 100%);
          border: 1px solid rgba(0, 180, 216, 0.2);
          border-radius: 16px;
          backdrop-filter: blur(20px);
        }

        .demo-header {
          margin-bottom: 40px;
          text-align: center;
        }

        .demo-header h3 {
          font-size: 24px;
          font-weight: 700;
          color: #00e5ff;
          margin-bottom: 8px;
          text-shadow: 0 0 20px rgba(0, 180, 216, 0.3);
        }

        .demo-header p {
          font-size: 15px;
          color: #8b949e;
          margin: 0;
        }

        .demo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .morph-stage {
          width: 100%;
          min-height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .ascii-display,
        .rendered-display {
          width: 100%;
          max-width: 600px;
        }

        .portal-content {
          width: 100%;
          max-width: 800px;
        }

        @media (max-width: 768px) {
          .signature-transition {
            padding: 24px;
          }

          .demo-header h3 {
            font-size: 20px;
          }

          .morpheus-showcase h2 {
            font-size: 32px;
          }
        }
      `}</style>

      <h2>MORPHEUS Signature Transitions</h2>
      <p>
        Reality-bending page transitions leveraging the View Transitions API.
        Watch digital matter transform through dimensions.
      </p>

      <AsciiToRenderedShowcase />
      <PortalSectionTransition />
      <LiquidGlassMorph />
    </div>
  );
}
