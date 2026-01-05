/**
 * ════════════════════════════════════════════════════════════════
 * GUIDED TOUR COMPONENT
 * Multi-step onboarding tours with interactive highlights
 * ════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, X, HelpCircle } from 'lucide-react'
import { useGuidedTour } from './useSmartAssistance'
import { UI_PATTERNS } from './assistanceConfig'
import './GuidedTour.css'

export function GuidedTour({ id, steps, onStartChange, autoStart = true }) {
  const tour = useGuidedTour(id, steps)
  const [highlightElement, setHighlightElement] = useState(null)

  useEffect(() => {
    if (autoStart && !tour.isActive) {
      tour.startTour()
    }
  }, [autoStart, tour])

  useEffect(() => {
    if (tour.isActive && tour.currentStepData?.selector) {
      const element = document.querySelector(tour.currentStepData.selector)
      setHighlightElement(element)
    }
  }, [tour.isActive, tour.currentStep, tour.currentStepData])

  if (!tour.isActive) {
    return null
  }

  const tourStyle = UI_PATTERNS.GUIDED_TOUR
  const currentStep = tour.currentStepData

  return (
    <div className="guided-tour-container">
      {/* Overlay */}
      <motion.div
        className="tour-overlay"
        style={{
          opacity: tourStyle.overlayOpacity,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: tourStyle.overlayOpacity }}
        exit={{ opacity: 0 }}
        onClick={tour.skipTour}
      />

      {/* Highlight */}
      {highlightElement && (
        <div
          className="tour-highlight"
          style={{
            ...getElementPosition(highlightElement),
          }}
        >
          <div className="tour-highlight-inner" />
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tour.currentStep}
          className="tour-step-content"
          style={getStepPosition(highlightElement)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step Header */}
          <div className="tour-step-header">
            <div className="tour-step-title">
              {currentStep.title || `Step ${tour.currentStep + 1}`}
            </div>
            <button
              className="tour-close-btn"
              onClick={tour.skipTour}
              aria-label="Skip tour"
            >
              <X size={20} />
            </button>
          </div>

          {/* Step Body */}
          <div className="tour-step-body">
            <p>{currentStep.description}</p>
            {currentStep.action && (
              <div className="tour-action-hint">
                <span className="action-icon">👆</span>
                {currentStep.action}
              </div>
            )}
          </div>

          {/* Step Footer */}
          <div className="tour-step-footer">
            <div className="tour-progress">
              {tourStyle.stepIndicator && (
                <span className="step-count">
                  Step {tour.currentStep + 1} of {tour.totalSteps}
                </span>
              )}
              <div className="progress-dots">
                {Array.from({ length: tour.totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`progress-dot ${
                      i === tour.currentStep ? 'active' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="tour-controls">
              <button
                className="tour-btn tour-prev"
                onClick={tour.previousStep}
                disabled={tour.currentStep === 0}
                aria-label="Previous step"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                className="tour-btn tour-skip"
                onClick={tour.skipTour}
              >
                Skip
              </button>

              <button
                className="tour-btn tour-next"
                onClick={tour.nextStep}
                disabled={tour.currentStep === tour.totalSteps - 1}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Floating Trigger Button (if tour not active) */}
      {!tour.isActive && (
        <motion.button
          className="tour-trigger-btn"
          onClick={tour.startTour}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <HelpCircle size={20} />
          <span>Need help?</span>
        </motion.button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getElementPosition(element) {
  if (!element) return {}

  const rect = element.getBoundingClientRect()
  const padding = 8

  return {
    top: `${rect.top - padding}px`,
    left: `${rect.left - padding}px`,
    width: `${rect.width + padding * 2}px`,
    height: `${rect.height + padding * 2}px`,
  }
}

function getStepPosition(element) {
  if (!element) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }

  const rect = element.getBoundingClientRect()
  const contentWidth = 400
  const contentHeight = 200
  const offset = 20

  let top = rect.top - contentHeight - offset
  let left = rect.left + rect.width / 2 - contentWidth / 2

  // Ensure content stays within viewport
  if (top < offset) {
    top = rect.bottom + offset
  }

  if (left < offset) {
    left = offset
  }

  if (left + contentWidth > window.innerWidth - offset) {
    left = window.innerWidth - contentWidth - offset
  }

  return {
    top: `${top}px`,
    left: `${left}px`,
    position: 'fixed',
  }
}

export default GuidedTour
