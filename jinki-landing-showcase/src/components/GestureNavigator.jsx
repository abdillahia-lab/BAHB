// GESTURAL: Navigation via gestures
// Swipe between sections, draw gestures for navigation, shake for easter eggs

import { useEffect, useRef, useCallback, useState } from 'react'
import { useGestures } from '../hooks/useGestures'
import { GESTURE_TYPES } from '../utils/gestureConfig'

const GestureNavigator = ({
  sections = [],
  onSectionChange = () => {},
  enableDrawNavigation = true,
  enableEasterEggs = true,
}) => {
  const containerRef = useRef(null)
  const currentSectionRef = useRef(0)
  const [currentSection, setCurrentSection] = useState(0)
  const navigationHistoryRef = useRef([])
  const easterEggCounterRef = useRef(0)

  const { gestureState, stateMachine } = useGestures(containerRef, {
    enableSwipe: true,
    enableShake: enableEasterEggs,
    enableDraw: enableDrawNavigation,
    onSwipe: (data) => handleSwipeNavigation(data),
    onShake: (data) => triggerEasterEgg(data),
    onDraw: (data) => handleDrawNavigation(data),
  })

  // Handle swipe-based navigation
  const handleSwipeNavigation = useCallback((data) => {
    const { direction } = data
    const sectionCount = sections.length
    let newSection = currentSectionRef.current

    switch (direction) {
      case 'right':
      case 'up':
        // Go to previous section
        newSection = (currentSectionRef.current - 1 + sectionCount) % sectionCount
        break
      case 'left':
      case 'down':
        // Go to next section
        newSection = (currentSectionRef.current + 1) % sectionCount
        break
      default:
        return
    }

    navigateToSection(newSection)
  }, [sections.length])

  // Handle draw-based navigation (circle = home)
  const handleDrawNavigation = useCallback((data) => {
    if (!enableDrawNavigation) return

    const { shape } = data

    if (shape === 'circle') {
      // Draw a circle to go home
      navigateToSection(0)
    } else if (shape === 'zigzag') {
      // Zigzag pattern could trigger randomized navigation
      const random = Math.floor(Math.random() * sections.length)
      navigateToSection(random)
    }
  }, [enableDrawNavigation, sections.length])

  // Trigger easter egg on shake
  const triggerEasterEgg = useCallback(() => {
    easterEggCounterRef.current++

    // Fire custom event for easter egg handling
    const event = new CustomEvent('gesture-easter-egg', {
      detail: { count: easterEggCounterRef.current },
    })
    window.dispatchEvent(event)

    console.log(`Easter egg triggered! Count: ${easterEggCounterRef.current}`)

    // Visual feedback
    createEasterEggEffect()
  }, [])

  // Create visual effect for easter eggs
  const createEasterEggEffect = () => {
    const container = containerRef.current
    if (!container) return

    const effect = document.createElement('div')
    effect.className = 'easter-egg-effect'
    effect.innerHTML = '🎉'
    effect.style.cssText = `
      position: fixed;
      left: ${Math.random() * window.innerWidth}px;
      top: ${Math.random() * window.innerHeight}px;
      font-size: 40px;
      pointer-events: none;
      animation: easterEggBurst 1s ease-out forwards;
      z-index: 10000;
    `
    document.body.appendChild(effect)

    setTimeout(() => effect.remove(), 1000)
  }

  // Navigate to specific section
  const navigateToSection = useCallback((sectionIndex) => {
    if (sectionIndex === currentSectionRef.current) return

    currentSectionRef.current = sectionIndex
    setCurrentSection(sectionIndex)

    // Record navigation history
    navigationHistoryRef.current.push({
      from: navigationHistoryRef.current.length > 0
        ? navigationHistoryRef.current[navigationHistoryRef.current.length - 1].to
        : 0,
      to: sectionIndex,
      timestamp: Date.now(),
      gesture: stateMachine.recognizedGestures[stateMachine.recognizedGestures.length - 1],
    })

    onSectionChange({
      section: sectionIndex,
      sectionName: sections[sectionIndex]?.name || `Section ${sectionIndex}`,
      history: navigationHistoryRef.current,
    })

    // Scroll to section if element provided
    const sectionElement = document.getElementById(`section-${sectionIndex}`)
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' })
    }
  }, [sections, onSectionChange, stateMachine])

  // Navigation hints (can be displayed on UI)
  const getNavigationHints = () => {
    return {
      swipeRight: 'Swipe right or up for previous section',
      swipeLeft: 'Swipe left or down for next section',
      drawCircle: 'Draw a circle to go home',
      shake: 'Shake device for easter eggs',
      currentSection: currentSectionRef.current,
      totalSections: sections.length,
    }
  }

  // Get navigation history
  const getNavigationHistory = () => {
    return navigationHistoryRef.current
  }

  // Get easter egg count
  const getEasterEggCount = () => {
    return easterEggCounterRef.current
  }

  // Reset easter egg counter
  const resetEasterEggCounter = useCallback(() => {
    easterEggCounterRef.current = 0
  }, [])

  useEffect(() => {
    return () => {
      // Cleanup
      navigationHistoryRef.current = []
    }
  }, [])

  return {
    containerRef,
    currentSection,
    navigateToSection,
    getNavigationHints,
    getNavigationHistory,
    getEasterEggCount,
    resetEasterEggCounter,
    gestureState,
    stateMachine,
  }
}

export default GestureNavigator
