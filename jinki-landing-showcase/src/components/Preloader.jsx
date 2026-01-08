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
    const startTime = Date.now()
    const MINIMUM_DURATION = 2500 // 2.5 seconds minimum for dramatic effect

    // Assets to preload
    const assetsToLoad = [
      // Video
      {
        type: 'video',
        url: 'https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4'
      },
      // Google Fonts (DM Sans)
      {
        type: 'font',
        family: 'DM Sans',
        weight: '300 900'
      }
    ]

    let loadedAssets = 0
    const totalAssets = assetsToLoad.length

    // Progress simulation for smooth animation
    let simulatedProgress = 0
    const progressInterval = setInterval(() => {
      simulatedProgress += Math.random() * 8 // Random increments for organic feel
      if (simulatedProgress > 90) simulatedProgress = 90 // Cap at 90% until real assets load
      setProgress(Math.floor(simulatedProgress))
    }, 100)

    // Asset loading functions
    const loadVideo = (url) => {
      return new Promise((resolve, reject) => {
        const video = document.createElement('video')
        video.preload = 'metadata'

        video.addEventListener('loadedmetadata', () => {
          resolve()
        })

        video.addEventListener('error', () => {
          console.warn('Video preload failed, continuing...')
          resolve() // Resolve anyway to not block preloader
        })

        video.src = url
      })
    }

    const loadFont = (family, weight) => {
      return new Promise((resolve) => {
        if (document.fonts && document.fonts.load) {
          document.fonts.load(`${weight} 16px "${family}"`).then(resolve).catch(() => {
            console.warn('Font preload failed, continuing...')
            resolve()
          })
        } else {
          // Fallback: just wait a bit
          setTimeout(resolve, 300)
        }
      })
    }

    // Load all assets
    const loadAssets = async () => {
      for (const asset of assetsToLoad) {
        try {
          if (asset.type === 'video') {
            await loadVideo(asset.url)
          } else if (asset.type === 'font') {
            await loadFont(asset.family, asset.weight)
          }

          loadedAssets++
          const realProgress = (loadedAssets / totalAssets) * 100

          // Update to real progress if it's higher than simulated
          setProgress(prev => Math.max(prev, Math.floor(realProgress)))
        } catch (error) {
          console.warn('Asset load error:', error)
          loadedAssets++
        }
      }

      // Ensure minimum display time for dramatic effect
      const elapsed = Date.now() - startTime
      const remainingTime = Math.max(0, MINIMUM_DURATION - elapsed)

      setTimeout(() => {
        clearInterval(progressInterval)
        setProgress(100)
        setPhase('complete')

        // Hold at 100% briefly, then exit
        setTimeout(() => {
          setPhase('exiting')

          // Notify parent after exit animation completes
          setTimeout(() => {
            if (onComplete) onComplete()
          }, 1200) // Match exit animation duration
        }, 400)
      }, remainingTime)
    }

    loadAssets()

    return () => {
      clearInterval(progressInterval)
    }
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
