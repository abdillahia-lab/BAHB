/* ═══════════════════════════════════════════════════════════════
   TEAM ASCII-2: DECODE SCRAMBLE EFFECT
   Elite 10-Agent Team | Premium Cyber-Intelligence Aesthetic
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react'
import './DecodeText.css'

/**
 * DecodeText - Premium ASCII scramble-to-reveal effect
 *
 * Creates a hacker-terminal decode effect where text starts as random
 * characters and "decodes" character-by-character to reveal the actual text.
 * Perfect for cyber-intelligence, tech, and premium digital aesthetics.
 *
 * Features:
 * - Character-by-character decode with scramble iterations
 * - Configurable decode speed and scramble intensity
 * - Cyan flash on character decode (Jinki brand color)
 * - Smooth transition from monospace to display font
 * - IntersectionObserver trigger (plays on scroll into view)
 * - Performance-optimized with RAF and minimal DOM updates
 */

const DecodeText = ({
  children,
  className = '',
  speed = 50, // ms between character decodes
  scrambleIterations = 3, // how many times each char scrambles before settling
  delay = 0, // initial delay before decode starts
  triggerOnView = true, // auto-start when scrolled into view
  onComplete = null, // callback when decode finishes
}) => {
  const elementRef = useRef(null)
  const [isDecoding, setIsDecoding] = useState(false)
  const [hasDecoded, setHasDecoded] = useState(false)
  const [displayText, setDisplayText] = useState('')
  const frameRef = useRef(null)

  // ASCII characters for scrambling (cyber aesthetic)
  const SCRAMBLE_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

  const getRandomChar = () => {
    return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
  }

  const decode = (text) => {
    if (!text || hasDecoded) return

    let frame = 0
    const targetText = text
    const textLength = targetText.length
    let decodedChars = 0

    const animate = () => {
      // Calculate which characters should be decoded by now
      const currentDecodeIndex = Math.floor(frame / scrambleIterations)

      // Build display string
      let result = ''
      for (let i = 0; i < textLength; i++) {
        if (i < currentDecodeIndex) {
          // Character is fully decoded
          result += targetText[i]
        } else if (i === currentDecodeIndex) {
          // Currently decoding this character (scramble it)
          result += getRandomChar()
        } else {
          // Not yet reached - show random char
          result += getRandomChar()
        }
      }

      setDisplayText(result)

      // Continue animation
      frame++
      if (currentDecodeIndex < textLength) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        // Decode complete
        setDisplayText(targetText)
        setIsDecoding(false)
        setHasDecoded(true)
        if (onComplete) onComplete()
      }
    }

    setIsDecoding(true)

    // Start with full scrambled text
    setDisplayText(targetText.split('').map(() => getRandomChar()).join(''))

    // Start decode after delay
    setTimeout(() => {
      frameRef.current = requestAnimationFrame(animate)
    }, delay)
  }

  // IntersectionObserver for scroll-triggered decode
  useEffect(() => {
    if (!triggerOnView || hasDecoded) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasDecoded) {
            const text = elementRef.current?.textContent || children
            decode(text)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.3 } // Start when 30% visible
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => {
      observer.disconnect()
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [children, triggerOnView, hasDecoded])

  return (
    <span
      ref={elementRef}
      className={`decode-text ${isDecoding ? 'decode-text--active' : ''} ${hasDecoded ? 'decode-text--complete' : ''} ${className}`}
      data-original={children}
    >
      {displayText || children}
    </span>
  )
}

export default DecodeText
