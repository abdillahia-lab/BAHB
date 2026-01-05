import { useState, useEffect } from 'react'
import './ProgressiveLoader.css'

/**
 * LAZYMASTER: Progressive Loader
 * Shows optimistic UI states to reduce perceived latency
 *
 * Psychology: Users perceive loading as faster when they see progress
 */
export const ProgressiveLoader = ({
  stages = ['Initializing', 'Loading assets', 'Almost ready', 'Ready!'],
  stageDuration = 300,
  onComplete = () => {}
}) => {
  const [currentStage, setCurrentStage] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const totalDuration = stages.length * stageDuration
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100)
      const newStage = Math.min(
        Math.floor((elapsed / stageDuration)),
        stages.length - 1
      )

      setProgress(newProgress)
      setCurrentStage(newStage)

      if (newProgress < 100) {
        requestAnimationFrame(animate)
      } else {
        onComplete()
      }
    }

    const rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [stages.length, stageDuration, onComplete])

  return (
    <div className="progressive-loader">
      <div className="progressive-loader__bar">
        <div
          className="progressive-loader__fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="progressive-loader__text">
        {stages[currentStage]}
      </p>
    </div>
  )
}

/**
 * Skeleton with shimmer effect
 * More engaging than static loading states
 */
export const ShimmerSkeleton = ({ width = '100%', height = '100px', delay = 0, className = '' }) => {
  return (
    <div
      className={`shimmer-skeleton ${className}`}
      style={{
        width,
        height,
        animationDelay: `${delay}ms`
      }}
    >
      <div className="shimmer-skeleton__shimmer" />
    </div>
  )
}

/**
 * Content placeholder with multiple skeleton elements
 */
export const ContentSkeleton = ({ lines = 3, className = '' }) => {
  return (
    <div className={`content-skeleton ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerSkeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height="16px"
          delay={i * 100}
        />
      ))}
    </div>
  )
}

export default ProgressiveLoader
