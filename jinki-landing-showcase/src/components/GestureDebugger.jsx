// GESTURAL: Debug and monitoring interface for gesture recognition
// Real-time display of gesture states, debug info, and performance metrics

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './GestureDebugger.css'

const GestureDebugger = ({ stateMachine, visible = false, compact = false }) => {
  const [debugInfo, setDebugInfo] = useState(null)
  const [recentGestures, setRecentGestures] = useState([])
  const [isVisible, setIsVisible] = useState(visible)
  const updateIntervalRef = useRef(null)

  useEffect(() => {
    const updateDebugInfo = () => {
      if (!stateMachine) return

      setDebugInfo(stateMachine.debugInfo())
      setRecentGestures(stateMachine.getRecentGestures(5))
    }

    updateDebugInfo()
    updateIntervalRef.current = setInterval(updateDebugInfo, 100)

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [stateMachine])

  if (!isVisible || !debugInfo) return null

  return (
    <AnimatePresence>
      <motion.div
        className={`gesture-debugger ${compact ? 'compact' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="debugger-header">
          <h3>Gesture Debugger</h3>
          <button
            className="debugger-close"
            onClick={() => setIsVisible(false)}
          >
            ✕
          </button>
        </div>

        <div className="debugger-content">
          {/* State Info */}
          <div className="debug-section">
            <h4>Current State</h4>
            <div className="debug-line">
              <span className="debug-label">State:</span>
              <span className="debug-value">{debugInfo.state}</span>
            </div>
            <div className="debug-line">
              <span className="debug-label">Duration:</span>
              <span className="debug-value">{debugInfo.duration}ms</span>
            </div>
            <div className="debug-line">
              <span className="debug-label">Distance:</span>
              <span className="debug-value">{debugInfo.distance.toFixed(1)}px</span>
            </div>
            <div className="debug-line">
              <span className="debug-label">Velocity:</span>
              <span className="debug-value">{debugInfo.velocity.toFixed(3)}px/ms</span>
            </div>
          </div>

          {/* Touch Info */}
          <div className="debug-section">
            <h4>Touch Input</h4>
            <div className="debug-line">
              <span className="debug-label">Active Touches:</span>
              <span className="debug-value">{debugInfo.touchCount}</span>
            </div>
            <div className="debug-line">
              <span className="debug-label">Recognized Gestures:</span>
              <span className="debug-value">{debugInfo.gestureCount}</span>
            </div>
          </div>

          {/* Recent Gestures */}
          {!compact && recentGestures.length > 0 && (
            <div className="debug-section">
              <h4>Recent Gestures</h4>
              <div className="gestures-list">
                {recentGestures.map((gesture, index) => (
                  <motion.div
                    key={index}
                    className="gesture-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <span className="gesture-type">{gesture.type}</span>
                    {gesture.direction && (
                      <span className="gesture-direction">({gesture.direction})</span>
                    )}
                    <span className="gesture-time">
                      {new Date(gesture.timestamp).toLocaleTimeString()}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Info */}
          <div className="debug-section">
            <h4>Performance</h4>
            <div className="debug-line">
              <span className="debug-label">FPS:</span>
              <span className="debug-value">
                {typeof window !== 'undefined' && window.__PERF__
                  ? window.__PERF__.fps
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        {!visible && (
          <button
            className="debugger-toggle"
            onClick={() => setIsVisible(true)}
            title="Show Gesture Debugger"
          >
            G
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default GestureDebugger
