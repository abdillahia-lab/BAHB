/* ════════════════════════════════════════════════════════════════════════════════
   TEAM CURSOR-EFFECTS - Integration Example
   Demonstrates all cursor effects features
   ════════════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react'
import CustomCursor from './CustomCursor'
import './CursorEffectsExample.css'

/**
 * CursorEffectsExample Component
 *
 * This component demonstrates all features of the custom cursor system:
 * - Basic cursor tracking
 * - Hover expansion on buttons
 * - Magnetic effect on special elements
 * - Click ripple feedback
 * - Trail particles
 */
export default function CursorEffectsExample() {
  const [cursorConfig, setCursorConfig] = useState({
    enableTrail: true,
    enableMagnetic: true,
    trailLength: 8,
    magneticStrength: 0.3,
  })

  return (
    <>
      {/* Custom Cursor Component */}
      <CustomCursor
        enableTrail={cursorConfig.enableTrail}
        enableMagnetic={cursorConfig.enableMagnetic}
        trailLength={cursorConfig.trailLength}
        magneticStrength={cursorConfig.magneticStrength}
      />

      <div className="cursor-demo">
        <div className="cursor-demo__container">
          <h1 className="cursor-demo__title">Custom Cursor Effects</h1>
          <p className="cursor-demo__subtitle">
            Experience professional cursor interactions
          </p>

          {/* Demo Grid */}
          <div className="cursor-demo__grid">

            {/* Basic Hover */}
            <div className="cursor-demo__card">
              <h3>Hover Expansion</h3>
              <p>Move your cursor over these buttons to see the ring expand</p>
              <div className="cursor-demo__buttons">
                <button className="cursor-demo__btn">
                  Primary Button
                </button>
                <button className="cursor-demo__btn cursor-demo__btn--secondary">
                  Secondary
                </button>
              </div>
            </div>

            {/* Magnetic Effect */}
            <div className="cursor-demo__card">
              <h3>Magnetic Attraction</h3>
              <p>These elements subtly pull toward your cursor</p>
              <div className="cursor-demo__magnetic-zone">
                <button className="cursor-demo__btn cursor-magnetic">
                  Magnetic Button
                </button>
                <div
                  className="cursor-demo__magnetic-card cursor-magnetic"
                  data-magnetic-strength="0.4"
                >
                  <span>Strong Magnet</span>
                </div>
                <div
                  className="cursor-demo__magnetic-card cursor-magnetic"
                  data-magnetic-strength="0.2"
                >
                  <span>Weak Magnet</span>
                </div>
              </div>
            </div>

            {/* Click Feedback */}
            <div className="cursor-demo__card">
              <h3>Click Ripple</h3>
              <p>Click anywhere to see the ripple effect</p>
              <div className="cursor-demo__click-area">
                <div className="cursor-demo__click-target">
                  Click Me!
                </div>
              </div>
            </div>

            {/* Trail Effect */}
            <div className="cursor-demo__card">
              <h3>Cursor Trail</h3>
              <p>Move your cursor quickly to see the trail particles</p>
              <div className="cursor-demo__trail-zone">
                <div className="cursor-demo__trail-path">
                  Move cursor here →
                </div>
              </div>
            </div>

          </div>

          {/* Controls */}
          <div className="cursor-demo__controls">
            <h3>Cursor Settings</h3>

            <label className="cursor-demo__control">
              <input
                type="checkbox"
                checked={cursorConfig.enableTrail}
                onChange={(e) => setCursorConfig({
                  ...cursorConfig,
                  enableTrail: e.target.checked
                })}
              />
              <span>Enable Trail Effect</span>
            </label>

            <label className="cursor-demo__control">
              <input
                type="checkbox"
                checked={cursorConfig.enableMagnetic}
                onChange={(e) => setCursorConfig({
                  ...cursorConfig,
                  enableMagnetic: e.target.checked
                })}
              />
              <span>Enable Magnetic Effect</span>
            </label>

            <label className="cursor-demo__control">
              <span>Trail Length: {cursorConfig.trailLength}</span>
              <input
                type="range"
                min="0"
                max="20"
                value={cursorConfig.trailLength}
                onChange={(e) => setCursorConfig({
                  ...cursorConfig,
                  trailLength: parseInt(e.target.value)
                })}
              />
            </label>

            <label className="cursor-demo__control">
              <span>Magnetic Strength: {cursorConfig.magneticStrength.toFixed(1)}</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={cursorConfig.magneticStrength}
                onChange={(e) => setCursorConfig({
                  ...cursorConfig,
                  magneticStrength: parseFloat(e.target.value)
                })}
              />
            </label>
          </div>

          {/* Usage Notes */}
          <div className="cursor-demo__notes">
            <h4>Implementation Notes:</h4>
            <ul>
              <li>✓ Performance optimized with GPU acceleration (transform only)</li>
              <li>✓ Automatically hidden on touch devices</li>
              <li>✓ Respects prefers-reduced-motion accessibility setting</li>
              <li>✓ Works with all interactive elements (a, button, etc.)</li>
              <li>✓ Add .cursor-magnetic class for magnetic effect</li>
              <li>✓ Use data-magnetic-strength attribute to control strength</li>
            </ul>
          </div>

        </div>
      </div>
    </>
  )
}
