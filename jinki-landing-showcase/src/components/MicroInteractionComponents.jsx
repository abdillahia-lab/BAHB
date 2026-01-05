/**
 * MICROFEEDBACK - REACT COMPONENT LIBRARY
 * Ready-to-use micro-interaction components
 * Drop-in replacements for standard UI elements
 */

import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  buttonVariants,
  cardVariants,
  formFieldVariants,
  navigationVariants,
  loadingVariants,
  feedbackVariants,
  TIMING,
  springs,
} from '../utils/microInteractions'
import '../styles/micro-interactions.css'

// ═══════════════════════════════════════════════════════════════
// MICRO BUTTON COMPONENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Primary Button with scale, glow, and ripple effects
 */
export const MicroButton = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      onClick,
      disabled = false,
      size = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState([])
    const containerRef = useRef(null)

    const handleClick = useCallback(
      (e) => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const ripple = {
            id: Date.now(),
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          }
          setRipples([ripple])
          setTimeout(() => setRipples([]), 200)
        }
        onClick?.(e)
      },
      [onClick]
    )

    const sizeMap = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    }

    return (
      <motion.button
        ref={ref || containerRef}
        className={`micro-btn relative overflow-hidden ${sizeMap[size]} ${className}`}
        variants={buttonVariants[variant] || buttonVariants.primary}
        whileHover="hover"
        whileTap="tap"
        onClick={handleClick}
        disabled={disabled}
        {...props}
      >
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="micro-btn-ripple"
            initial={{
              width: 0,
              height: 0,
              left: ripple.x,
              top: ripple.y,
              opacity: 0.75,
            }}
            animate={{
              width: 500,
              height: 500,
              left: ripple.x - 250,
              top: ripple.y - 250,
              opacity: 0,
            }}
            transition={{ duration: TIMING.QUICK }}
          />
        ))}
        {children}
      </motion.button>
    )
  }
)

MicroButton.displayName = 'MicroButton'

// ═══════════════════════════════════════════════════════════════
// MICRO CARD COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * Card with hover lift, image zoom, and content slide
 */
export const MicroCard = React.forwardRef(
  (
    {
      children,
      image,
      title,
      description,
      onClick,
      hoverable = true,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        className={`micro-card rounded-lg overflow-hidden ${className}`}
        variants={hoverable ? cardVariants.container : {}}
        whileHover={hoverable ? 'hover' : undefined}
        initial="rest"
        {...props}
      >
        {image && (
          <div className="micro-card-image aspect-video overflow-hidden bg-gray-200">
            <motion.img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: TIMING.MEDIUM }}
            />
          </div>
        )}

        <motion.div className="micro-card-content p-6">
          {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
          {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
          {children}
        </motion.div>
      </motion.div>
    )
  }
)

MicroCard.displayName = 'MicroCard'

// ═══════════════════════════════════════════════════════════════
// MICRO INPUT COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * Input field with floating label, underline animation, and validation feedback
 */
export const MicroInput = React.forwardRef(
  (
    {
      label,
      value,
      onChange,
      error,
      success,
      type = 'text',
      maxLength,
      showCounter = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [charCount, setCharCount] = useState(value?.length || 0)

    const handleChange = useCallback(
      (e) => {
        setCharCount(e.target.value.length)
        onChange?.(e)
      },
      [onChange]
    )

    return (
      <motion.div className={`micro-input-wrapper mb-4 ${className}`}>
        <motion.input
          ref={ref}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={maxLength}
          placeholder=" "
          className="micro-input micro-input-fill w-full px-0 py-2 bg-transparent"
          {...props}
        />

        {label && (
          <motion.label
            className="micro-label"
            animate={{
              y: isFocused || value ? -24 : 0,
              fontSize: isFocused || value ? '0.75rem' : '1rem',
              color: isFocused ? '#007ACC' : 'rgba(0, 0, 0, 0.6)',
            }}
            transition={{ duration: TIMING.FAST }}
          >
            {label}
          </motion.label>
        )}

        {/* Character Counter */}
        {showCounter && maxLength && (
          <motion.div
            className="text-xs text-gray-500 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {charCount} / {maxLength}
          </motion.div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="micro-error-message mt-2"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: TIMING.FAST }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Checkmark */}
        <AnimatePresence>
          {success && !error && (
            <motion.div
              className="micro-success-checkmark inline-block ml-2"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ ...springs.snappy }}
            >
              ✓
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }
)

MicroInput.displayName = 'MicroInput'

// ═══════════════════════════════════════════════════════════════
// MICRO NAVIGATION COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * Navigation item with underline and hover effects
 */
export const MicroNavItem = React.forwardRef(
  (
    {
      children,
      active = false,
      onClick,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        className={`micro-nav-item ${active ? 'active' : ''} ${className}`}
        whileHover="hover"
        initial="rest"
        animate={active ? 'active' : 'rest'}
        variants={navigationVariants.navItem}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

MicroNavItem.displayName = 'MicroNavItem'

// ═══════════════════════════════════════════════════════════════
// LOADING SKELETON COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * Shimmer skeleton loader
 */
export const MicroSkeleton = ({
  width = '100%',
  height = '20px',
  count = 1,
  className = '',
  ...props
}) => {
  return (
    <div className={className} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="micro-shimmer rounded mb-2"
          style={{
            width,
            height,
            backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)`,
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// LOADING SPINNER COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * Animated spinner with customizable size and color
 */
export const MicroSpinner = ({ size = 'md', color = '#007ACC' }) => {
  const sizeMap = {
    sm: 24,
    md: 40,
    lg: 56,
  }

  return (
    <motion.svg
      width={sizeMap[size]}
      height={sizeMap[size]}
      viewBox="0 0 50 50"
      className="micro-spinner"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="31.4 125.6"
        opacity="0.7"
      />
    </motion.svg>
  )
}

// ═══════════════════════════════════════════════════════════════
// FEEDBACK TOAST COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * Toast notification with success, error, warning, info states
 */
export const MicroToast = ({
  message,
  type = 'info',
  onClose,
  duration = 5000,
  action,
}) => {
  React.useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const typeStyles = {
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: '✓', color: 'text-green-700' },
    error: { bg: 'bg-red-50', border: 'border-red-200', icon: '✕', color: 'text-red-700' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '⚠', color: 'text-yellow-700' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'ℹ', color: 'text-blue-700' },
  }

  const style = typeStyles[type]

  return (
    <motion.div
      className={`micro-toast ${style.bg} ${style.color} border ${style.border} rounded-lg p-4 flex items-center gap-3`}
      variants={feedbackVariants.toast}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <span className="text-xl font-bold">{style.icon}</span>
      <div className="flex-1">{message}</div>
      {action && (
        <MicroButton size="sm" variant="ghost" onClick={action.onClick}>
          {action.label}
        </MicroButton>
      )}
      <button
        onClick={onClose}
        className="text-lg font-bold opacity-50 hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SCROLL PROGRESS INDICATOR COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * Page scroll progress bar
 */
export const MicroScrollProgress = ({ useScroll }) => {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      className="micro-scroll-progress"
      style={{
        scaleX: scrollYProgress,
        transformOrigin: '0%',
      }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════
// HOVER REVEAL COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * Three-stage progressive hover reveal
 */
export const MicroHoverReveal = ({
  stage1Content,
  stage2Content,
  stage3Content,
  className = '',
}) => {
  const [hoverStage, setHoverStage] = useState(0)

  return (
    <motion.div
      className={`rounded-lg p-6 cursor-pointer ${className}`}
      onMouseEnter={() => setHoverStage(3)}
      onMouseLeave={() => setHoverStage(0)}
      animate={{
        scale: 1 + hoverStage * 0.01,
        opacity: 0.8 + hoverStage * 0.04,
      }}
      transition={{ duration: TIMING.QUICK }}
    >
      <AnimatePresence mode="wait">
        {hoverStage === 0 && (
          <motion.div
            key="stage0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {stage1Content}
          </motion.div>
        )}
        {hoverStage > 0 && (
          <motion.div
            key="stage1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {stage1Content}
          </motion.div>
        )}
        {hoverStage > 1 && (
          <motion.div
            key="stage2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {stage2Content}
          </motion.div>
        )}
        {hoverStage === 3 && (
          <motion.div
            key="stage3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {stage3Content}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FORM FEEDBACK COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * Animated form validation feedback
 */
export const MicroFormFeedback = ({ state = 'idle', message }) => {
  const states = {
    idle: null,
    loading: <MicroSpinner size="sm" />,
    success: '✓',
    error: '✕',
  }

  return (
    <AnimatePresence>
      {state !== 'idle' && (
        <motion.div
          className="flex items-center gap-2"
          variants={feedbackVariants.info}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <span className={`text-lg font-bold ${state === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {states[state]}
          </span>
          {message && <span className="text-sm">{message}</span>}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════════════════════
// DROPDOWN COMPONENT
// ═══════════════════════════════════════════════════════════════

/**
 * Dropdown menu with animated reveal
 */
export const MicroDropdown = ({ isOpen, items, onSelect, label = 'Select' }) => {
  return (
    <div className="relative inline-block">
      <button className="micro-nav-item px-4 py-2">{label}</button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="micro-dropdown absolute top-full mt-2 bg-white rounded-lg shadow-lg p-2 min-w-48"
            variants={navigationVariants.dropdownMenu}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {items.map((item, idx) => (
              <motion.button
                key={idx}
                className="micro-nav-item w-full text-left px-4 py-2"
                whileHover={{ backgroundColor: 'rgba(0, 122, 204, 0.1)' }}
                onClick={() => onSelect(item)}
              >
                {item.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default {
  MicroButton,
  MicroCard,
  MicroInput,
  MicroNavItem,
  MicroSkeleton,
  MicroSpinner,
  MicroToast,
  MicroScrollProgress,
  MicroHoverReveal,
  MicroFormFeedback,
  MicroDropdown,
}
