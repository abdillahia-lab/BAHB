import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import './DataVizStyles.css'

/**
 * DRONE INSPECTION SIMULATOR - Real-time data simulation
 * Visualizes drone inspection process with live data updates
 */
export function DroneInspectionSimulator({
  duration = 30000, // 30 seconds
  autoPlay = true,
  onProgress = () => {},
}) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [progress, setProgress] = useState(0)
  const [simulationData, setSimulationData] = useState({
    altitude: 0,
    speed: 0,
    signal: 0,
    coverage: 0,
    anomalies: 0,
    temperature: 0,
    battery: 100,
  })
  const animationRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    if (!isPlaying) return

    startTimeRef.current = performance.now()

    const animate = (currentTime) => {
      if (!startTimeRef.current) return

      const elapsed = currentTime - startTimeRef.current
      const newProgress = Math.min((elapsed / duration) * 100, 100)

      setProgress(newProgress)
      onProgress(newProgress)

      // Simulate data based on progress
      const t = newProgress / 100

      // Altitude rises then falls
      const altitude = Math.sin(t * Math.PI) * 150 + 50

      // Speed peaks mid-flight
      const speed = Math.sin(t * Math.PI) * 80 + 20

      // Signal strength gradually improves
      const signal = Math.min(t * 120, 100)

      // Coverage expands over time
      const coverage = t * 100

      // Anomalies detected at various points
      let anomalies = 0
      if (t > 0.2) anomalies = Math.floor(Math.sin(t * Math.PI * 3) * 5 + 3)

      // Temperature varies
      const temperature = 20 + Math.sin(t * Math.PI * 2) * 10

      // Battery drains
      const battery = Math.max(100 - t * 30, 0)

      setSimulationData({
        altitude: Math.round(altitude),
        speed: Math.round(speed),
        signal: Math.round(signal),
        coverage: Math.round(coverage),
        anomalies: Math.max(anomalies, 0),
        temperature: Math.round(temperature * 10) / 10,
        battery: Math.round(battery),
      })

      if (newProgress < 100) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsPlaying(false)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, duration])

  const handleReset = () => {
    setProgress(0)
    setSimulationData({
      altitude: 0,
      speed: 0,
      signal: 0,
      coverage: 0,
      anomalies: 0,
      temperature: 0,
      battery: 100,
    })
    setIsPlaying(autoPlay)
  }

  const DataGauge = ({ label, value, max = 100, unit = '' }) => {
    const percentage = (value / max) * 100
    const isWarning = percentage > 80
    const isCritical = percentage > 95

    return (
      <div className="data-gauge">
        <label className="gauge-label">{label}</label>
        <div className="gauge-container">
          <motion.div
            className={`gauge-fill ${isWarning ? 'warning' : ''} ${isCritical ? 'critical' : ''}`}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <motion.div
          className="gauge-value"
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
        >
          {value}
          {unit}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="drone-simulator">
      {/* Visualization viewport */}
      <motion.div
        className="simulator-viewport"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Drone position indicator */}
        <svg
          className="simulator-canvas"
          viewBox="0 0 800 600"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Grid background */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#0ff" strokeWidth="0.5" opacity="0.2" />
            </pattern>
          </defs>
          <rect width="800" height="600" fill="url(#grid)" />

          {/* Drone icon */}
          <motion.g
            animate={{
              x: 400 + (progress - 50) * 4,
              y: 100 + simulationData.altitude,
            }}
            transition={{ duration: 0.5 }}
          >
            <circle cx="0" cy="0" r="12" fill="#06f" opacity="0.8" />
            <circle cx="0" cy="0" r="15" fill="#0ff" opacity="0.3" />
            <path d="M -10 -5 L 10 -5 L 10 5 L -10 5 Z" fill="#06f" opacity="0.6" />
          </motion.g>

          {/* Coverage area */}
          <motion.circle
            cx="400"
            cy="350"
            r={50 + (simulationData.coverage / 100) * 150}
            fill="#06f"
            opacity="0.1"
            animate={{ opacity: simulationData.coverage > 0 ? 0.2 : 0.05 }}
          />

          {/* Signal strength indicators */}
          {[1, 2, 3, 4, 5].map((ring) => (
            <motion.circle
              key={ring}
              cx="400"
              cy="350"
              r={30 + ring * 20}
              fill="none"
              stroke="#0ff"
              opacity={(simulationData.signal / 100) * (1 - ring / 10)}
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          ))}

          {/* Anomalies detected */}
          {[...Array(simulationData.anomalies)].map((_, i) => {
            const angle = (i / Math.max(simulationData.anomalies, 1)) * Math.PI * 2
            const x = 400 + Math.cos(angle) * (100 + Math.random() * 150)
            const y = 350 + Math.sin(angle) * (100 + Math.random() * 150)

            return (
              <motion.g key={`anomaly-${i}`}>
                <circle cx={x} cy={y} r="8" fill="#f06" opacity="0.7" />
                <circle cx={x} cy={y} r="12" fill="none" stroke="#f06" opacity="0.5" />
              </motion.g>
            )
          })}
        </svg>
      </motion.div>

      {/* Data readouts */}
      <motion.div
        className="simulator-readouts"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="readouts-grid">
          <DataGauge label="Altitude" value={simulationData.altitude} max={200} unit=" m" />
          <DataGauge label="Speed" value={simulationData.speed} max={100} unit=" km/h" />
          <DataGauge label="Signal" value={simulationData.signal} max={100} unit="%" />
          <DataGauge label="Coverage" value={simulationData.coverage} max={100} unit="%" />
          <DataGauge label="Battery" value={simulationData.battery} max={100} unit="%" />
          <div className="data-gauge">
            <label className="gauge-label">Temperature</label>
            <div className="gauge-value">{simulationData.temperature}°C</div>
          </div>
          <div className="data-gauge">
            <label className="gauge-label">Anomalies Detected</label>
            <motion.div
              className="gauge-value"
              animate={{ scale: simulationData.anomalies > 0 ? 1.1 : 1 }}
            >
              {simulationData.anomalies}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Progress bar */}
      <motion.div className="simulator-progress">
        <div className="progress-label">Inspection Progress</div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <div className="progress-time">{Math.round(progress)}% Complete</div>
      </motion.div>

      {/* Controls */}
      <div className="simulator-controls">
        <button
          className="control-btn"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          className="control-btn"
          onClick={handleReset}
        >
          ↻ Reset
        </button>
      </div>
    </div>
  )
}

export default DroneInspectionSimulator
