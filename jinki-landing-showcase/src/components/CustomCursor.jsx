/* ════════════════════════════════════════════════════════════════════════════════
   TEAM CURSOR-EFFECTS - Custom Cursor Component
   Drop-in cursor enhancement with professional interactions
   ════════════════════════════════════════════════════════════════════════════════ */

import useCursorEffects from '../hooks/useCursorEffects'
import '../styles/cursor-effects.css'

/**
 * CustomCursor Component
 *
 * Features:
 * - Custom ring/dot cursor that follows mouse
 * - Hover expansion on interactive elements
 * - Magnetic attraction effect
 * - Smooth trailing particles
 * - Click ripple feedback
 * - Performance optimized with GPU acceleration
 * - Automatically hidden on touch devices
 * - Respects prefers-reduced-motion
 *
 * @param {Object} props - Component props
 * @param {boolean} props.enableTrail - Enable cursor trail effect (default: true)
 * @param {boolean} props.enableMagnetic - Enable magnetic effect (default: true)
 * @param {number} props.trailLength - Number of trail particles (default: 8)
 * @param {number} props.magneticStrength - Magnetic effect strength 0-1 (default: 0.3)
 */
export default function CustomCursor({
  enableTrail = true,
  enableMagnetic = true,
  trailLength = 8,
  magneticStrength = 0.3,
}) {
  const {
    cursorRef,
    dotRef,
    ringRef,
    isTouchDevice,
  } = useCursorEffects({
    enableTrail,
    enableMagnetic,
    trailLength,
    magneticStrength,
  })

  // Don't render on touch devices
  if (isTouchDevice) {
    return null
  }

  return (
    <div ref={cursorRef} className="custom-cursor">
      <div ref={dotRef} className="custom-cursor__dot" />
      <div ref={ringRef} className="custom-cursor__ring" />
    </div>
  )
}
