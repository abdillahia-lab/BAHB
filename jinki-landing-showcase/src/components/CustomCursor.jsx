/**
 * CustomCursor Component
 * Renders the custom cursor elements
 * Place this at the root of your app (in App.jsx or main layout)
 */

import { useCustomCursor } from '../hooks/useCustomCursor'
import './CustomCursor.css'

export function CustomCursor() {
  const { cursorRef, cursorDotRef, cursorState } = useCustomCursor()

  return (
    <>
      {/* Main cursor ring */}
      <div
        ref={cursorRef}
        className={`custom-cursor custom-cursor--${cursorState}`}
        aria-hidden="true"
      />

      {/* Cursor center dot */}
      <div
        ref={cursorDotRef}
        className={`custom-cursor-dot custom-cursor-dot--${cursorState}`}
        aria-hidden="true"
      />
    </>
  )
}
