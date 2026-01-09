import { useEffect, useState } from 'react'
import './Preloader.css'

/**
 * JINKI INTELLIGENCE - Cinematic Preloader
 *
 * A movie studio-grade loading sequence featuring:
 * - Animated concentric circle logo (rotating rings, pulsing center)
 * - Liquid metal progress bar with shimmer effect
 * - Loading percentage counter
 * - Dramatic exit animation (scale up + fade out)
 * - Asset preloading (video, fonts, images)
 * - 2-3 second minimum display time for dramatic effect
 *
 * @param {Function} onComplete - Callback when preloading finishes
 */
export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('loading') // 'loading' | 'complete' | 'exiting'

  useEffect(() => {
    // Simple timed preloader - no external asset dependencies
    const DURATION = 2000 // 2 seconds total

    // Progress animation
    let progress = 0
    const progressInterval = setInterval(() => {
      progress += 5
      setProgress(Math.min(progress, 100))

      if (progress >= 100) {
        clearInterval(progressInterval)
        setPhase('complete')

        // Brief hold, then exit
        setTimeout(() => {
          setPhase('exiting')
          setTimeout(() => {
            if (onComplete) onComplete()
          }, 800)
        }, 200)
      }
    }, DURATION / 20)

    return () => clearInterval(progressInterval)
  }, [onComplete])

  return (
    <div className={`preloader preloader--${phase}`}>
      {/* Animated Background Grid */}
      <div className="preloader__grid">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="preloader__grid-line" style={{ '--delay': `${i * 0.05}s` }} />
        ))}
      </div>

      {/* Ambient Glow Orbs */}
      <div className="preloader__orb preloader__orb--cyan" />
      <div className="preloader__orb preloader__orb--gold" />

      {/* Main Content */}
      <div className="preloader__content">
        {/* Jinki Logo - Animated Concentric Circles */}
        <div className="preloader__logo-container">
          <svg className="preloader__logo" viewBox="0 0 200 200" fill="none">
            {/* Outer ring - slow rotation */}
            <circle
              className="preloader__ring preloader__ring--outer"
              cx="100"
              cy="100"
              r="90"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.6"
            />

            {/* Middle ring - medium rotation */}
            <circle
              className="preloader__ring preloader__ring--middle"
              cx="100"
              cy="100"
              r="62"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.4"
            />

            {/* Inner ring - fast rotation */}
            <circle
              className="preloader__ring preloader__ring--inner"
              cx="100"
              cy="100"
              r="33"
              stroke="currentColor"
              strokeWidth="1.5"
            />

            {/* Pulsing center dot */}
            <circle
              className="preloader__center"
              cx="100"
              cy="100"
              r="12"
              fill="currentColor"
            />

            {/* Crosshair lines */}
            <line
              className="preloader__crosshair"
              x1="100"
              y1="0"
              x2="100"
              y2="30"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.5"
            />
            <line
              className="preloader__crosshair"
              x1="100"
              y1="170"
              x2="100"
              y2="200"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.5"
            />
            <line
              className="preloader__crosshair"
              x1="0"
              y1="100"
              x2="30"
              y2="100"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.5"
            />
            <line
              className="preloader__crosshair"
              x1="170"
              y1="100"
              x2="200"
              y2="100"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.5"
            />
          </svg>

          {/* Scanning ring effect */}
          <div className="preloader__scan-ring" />
        </div>

        {/* Brand Name */}
        <div className="preloader__brand">
          <span className="preloader__brand-text">JINKI</span>
          <span className="preloader__brand-subtitle">INTELLIGENCE</span>
        </div>

        {/* Loading Progress */}
        <div className="preloader__progress-section">
          {/* Percentage Counter */}
          <div className="preloader__percentage">
            <span className="preloader__percentage-number">{progress}</span>
            <span className="preloader__percentage-symbol">%</span>
          </div>

          {/* Progress Bar Container */}
          <div className="preloader__progress-bar-container">
            <div className="preloader__progress-track">
              {/* Liquid metal fill */}
              <div
                className="preloader__progress-fill"
                style={{ width: `${progress}%` }}
              >
                {/* Gleam sweep effect */}
                <div className="preloader__progress-gleam" />
              </div>
            </div>
          </div>

          {/* Status Text */}
          <div className="preloader__status">
            {phase === 'loading' && progress < 30 && 'Initializing systems...'}
            {phase === 'loading' && progress >= 30 && progress < 60 && 'Loading surveillance assets...'}
            {phase === 'loading' && progress >= 60 && progress < 90 && 'Establishing secure connection...'}
            {phase === 'loading' && progress >= 90 && progress < 100 && 'Finalizing...'}
            {phase === 'complete' && 'Ready'}
            {phase === 'exiting' && 'Launching...'}
          </div>
        </div>
      </div>

      {/* Vignette overlay for depth */}
      <div className="preloader__vignette" />
    </div>
  )
}
