import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import '../styles/NeuralNetwork.css'

/**
 * ADAPTIVE LEARNING SYSTEMS
 * Animations that adapt to user behavior:
 * - Tracks user interactions
 * - Adjusts animation speed/intensity based on engagement
 * - Memory of user preferences
 * - Predictive animations based on behavior patterns
 */

class BehaviorProfile {
  constructor() {
    this.interactions = []
    this.lastInteractionTime = Date.now()
    this.engagementLevel = 0.5 // 0-1
    this.preferredPace = 'normal' // slow, normal, fast
    this.interactionPatterns = {}
  }

  recordInteraction(type, value = 1) {
    const now = Date.now()
    this.interactions.push({
      type,
      value,
      timestamp: now
    })

    // Calculate engagement based on interaction frequency
    const recentInteractions = this.interactions.filter(
      i => now - i.timestamp < 10000 // Last 10 seconds
    ).length

    this.engagementLevel = Math.min(1, recentInteractions / 10)
    this.lastInteractionTime = now

    // Track patterns
    if (!this.interactionPatterns[type]) {
      this.interactionPatterns[type] = 0
    }
    this.interactionPatterns[type]++

    // Determine preferred pace
    const avgInterval = this.getAverageInteractionInterval()
    if (avgInterval < 500) {
      this.preferredPace = 'fast'
    } else if (avgInterval > 2000) {
      this.preferredPace = 'slow'
    } else {
      this.preferredPace = 'normal'
    }

    // Clean old interactions
    this.interactions = this.interactions.filter(
      i => now - i.timestamp < 30000 // Keep last 30 seconds
    )
  }

  getAverageInteractionInterval() {
    if (this.interactions.length < 2) return 1000

    let totalInterval = 0
    for (let i = 1; i < this.interactions.length; i++) {
      totalInterval += this.interactions[i].timestamp - this.interactions[i - 1].timestamp
    }
    return totalInterval / (this.interactions.length - 1)
  }

  getAnimationConfig() {
    const baseConfig = {
      slow: { duration: 1.5, delay: 0.4 },
      normal: { duration: 1, delay: 0.2 },
      fast: { duration: 0.6, delay: 0.1 }
    }

    const intensityMultiplier = 0.5 + this.engagementLevel
    const config = baseConfig[this.preferredPace]

    return {
      duration: config.duration / intensityMultiplier,
      delay: config.delay,
      intensity: this.engagementLevel
    }
  }

  getPredictedNextAction() {
    // Find most common interaction type in last 5 interactions
    if (this.interactions.length < 2) return null

    const recentInteractions = this.interactions.slice(-5)
    const typeCounts = {}

    recentInteractions.forEach(i => {
      typeCounts[i.type] = (typeCounts[i.type] || 0) + 1
    })

    let mostCommon = null
    let maxCount = 0
    for (const [type, count] of Object.entries(typeCounts)) {
      if (count > maxCount) {
        maxCount = count
        mostCommon = type
      }
    }

    return mostCommon
  }
}

export default function AdaptiveLearningSystems({
  children,
  className = ''
}) {
  const profileRef = useRef(new BehaviorProfile())
  const [animConfig, setAnimConfig] = useState({ duration: 1, delay: 0.2, intensity: 0.5 })
  const [nextAction, setNextAction] = useState(null)
  const configUpdateRef = useRef(null)

  // Track all user interactions
  useEffect(() => {
    const profile = profileRef.current

    const handleMouseMove = (e) => {
      profile.recordInteraction('mousemove')
    }

    const handleClick = (e) => {
      profile.recordInteraction('click')
    }

    const handleScroll = () => {
      profile.recordInteraction('scroll')
    }

    const handleResize = () => {
      profile.recordInteraction('resize')
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Update animation config based on behavior
  useEffect(() => {
    const profile = profileRef.current

    configUpdateRef.current = setInterval(() => {
      const config = profile.getAnimationConfig()
      setAnimConfig(config)

      const predicted = profile.getPredictedNextAction()
      setNextAction(predicted)
    }, 500)

    return () => {
      if (configUpdateRef.current) clearInterval(configUpdateRef.current)
    }
  }, [])

  return (
    <div className={`adaptive-learning-system ${className}`}>
      {/* Learning Status Indicator */}
      <div className="learning-indicator">
        <div className="learning-nodes">
          <span className="learning-node" />
          <span className="learning-node" />
          <span className="learning-node" />
        </div>
        <span style={{ marginLeft: '8px' }}>
          {profileRef.current.preferredPace.toUpperCase()}
          <span style={{
            marginLeft: '8px',
            opacity: 0.6,
            fontSize: '10px'
          }}>
            ({(animConfig.intensity * 100).toFixed(0)}%)
          </span>
        </span>
      </div>

      {/* Adaptive Content */}
      <AdaptiveContent
        animConfig={animConfig}
        nextAction={nextAction}
        engagementLevel={animConfig.intensity}
      >
        {children}
      </AdaptiveContent>
    </div>
  )
}

function AdaptiveContent({ animConfig, nextAction, engagementLevel, children }) {
  // Animate based on engagement level
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: animConfig.delay,
        duration: animConfig.duration
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: animConfig.duration,
        ease: 'easeOut'
      }
    }
  }

  // Predict animation
  const predictiveScale = nextAction === 'click' ? 1.05 : 1
  const predictiveOpacity = nextAction ? 1 : 0.85

  return (
    <motion.div
      className="adaptive-content"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        scale: predictiveScale,
        opacity: predictiveOpacity,
        transition: `all ${animConfig.duration}s ease-out`
      }}
    >
      {children}

      {/* Predictive Indicator - subtle hint of next likely action */}
      {nextAction && (
        <motion.div
          className="predictive-hint"
          animate={{
            opacity: [0, 0.5, 0],
            y: [0, -10, -20]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: 2
          }}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            fontSize: '12px',
            color: 'rgba(0, 255, 200, 0.6)',
            pointerEvents: 'none',
            zIndex: -1
          }}
        >
          {nextAction === 'click' && '↑ Interaction Detected'}
          {nextAction === 'scroll' && '↓ Scroll Detected'}
          {nextAction === 'mousemove' && '→ Motion Detected'}
        </motion.div>
      )}
    </motion.div>
  )
}

/**
 * LEARNING ANIMATION COMPONENT
 * Animated element that learns from user interaction
 */
export function LearningElement({
  children,
  onInteraction = () => {},
  adaptiveIntensity = 0.5,
  className = ''
}) {
  const [isHovered, setIsHovered] = useState(false)

  const variants = {
    rest: {
      scale: 1,
      opacity: 0.8
    },
    hover: {
      scale: 1 + adaptiveIntensity * 0.2,
      opacity: 1,
      transition: {
        duration: 0.3,
        type: 'spring',
        stiffness: 300 * (1 + adaptiveIntensity)
      }
    }
  }

  return (
    <motion.div
      className={`learning-element ${className}`}
      variants={variants}
      initial="rest"
      animate={isHovered ? 'hover' : 'rest'}
      onHoverStart={() => {
        setIsHovered(true)
        onInteraction('hover')
      }}
      onHoverEnd={() => {
        setIsHovered(false)
      }}
      onClick={() => onInteraction('click')}
      style={{
        cursor: 'pointer',
        position: 'relative'
      }}
    >
      {children}
    </motion.div>
  )
}
