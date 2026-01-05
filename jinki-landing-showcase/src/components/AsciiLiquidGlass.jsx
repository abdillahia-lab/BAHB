import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * TITAN CHAMPION: GPU-Optimized ASCII Liquid Glass
 * - RAF-driven animation (no setInterval jank)
 * - Memoized frames prevent recreation
 * - Will-change hints for compositor
 * - Lazy-loadable for bundle splitting
 */

export const AsciiLiquidGlass = () => {
  const [frame, setFrame] = useState(0)
  const frameRequestRef = useRef(null)
  const animationStartRef = useRef(Date.now())

  // Memoized eye frames - prevents recreation on every render
  const eyeFrames = useMemo(() => [
    [
      "            ░░░░░░░░░░░░            ",
      "        ░░▒▒▓▓██████▓▓▒▒░░        ",
      "      ░▒▓██            ██▓▒░      ",
      "    ░▒▓█    ▄▄████▄▄    █▓▒░    ",
      "   ░▓█   ▄██▀▀    ▀▀██▄   █▓░   ",
      "  ░▓█  ▄█▀   ●●●●   ▀█▄  █▓░  ",
      "  ▒█  ██   ●●▓▓▓▓●●   ██  █▒  ",
      "  ▓█  █   ●▓▓████▓▓●   █  █▓  ",
      "  ▓█  █   ●▓██▀▀██▓●   █  █▓  ",
      "  ▒█  ██   ●●▓▓▓▓●●   ██  █▒  ",
      "  ░▓█  ▀█▄   ●●●●   ▄█▀  █▓░  ",
      "   ░▓█   ▀██▄▄    ▄▄██▀   █▓░   ",
      "    ░▒▓█    ▀▀████▀▀    █▓▒░    ",
      "      ░▒▓██            ██▓▒░      ",
      "        ░░▒▒▓▓██████▓▓▒▒░░        ",
      "            ░░░░░░░░░░░░            ",
    ],
    [
      "            ▒▒▒▒▒▒▒▒▒▒▒▒            ",
      "        ▒▒▓▓████████████▓▓▒▒        ",
      "      ▒▓██                ██▓▒      ",
      "    ▒▓█      ▄▄████▄▄      █▓▒    ",
      "   ▒▓█    ▄██▀▀    ▀▀██▄    █▓▒   ",
      "  ▒▓█   ▄█▀    ○○○○    ▀█▄   █▓▒  ",
      "  ▓█   ██    ○○████○○    ██   █▓  ",
      "  █▓   █    ○████████○    █   ▓█  ",
      "  █▓   █    ○████████○    █   ▓█  ",
      "  ▓█   ██    ○○████○○    ██   █▓  ",
      "  ▒▓█   ▀█▄    ○○○○    ▄█▀   █▓▒  ",
      "   ▒▓█    ▀██▄▄    ▄▄██▀    █▓▒   ",
      "    ▒▓█      ▀▀████▀▀      █▓▒    ",
      "      ▒▓██                ██▓▒      ",
      "        ▒▒▓▓████████████▓▓▒▒        ",
      "            ▒▒▒▒▒▒▒▒▒▒▒▒            ",
    ],
    [
      "            ▓▓▓▓▓▓▓▓▓▓▓▓            ",
      "        ▓▓██████████████████▓▓        ",
      "      ▓██▀                ▀██▓      ",
      "    ▓█▀      ▄▄▀▀▀▀▄▄      ▀█▓    ",
      "   ▓█     ▄▀▀        ▀▀▄     █▓   ",
      "  ▓█    ▄▀      ◐◐      ▀▄    █▓  ",
      "  █▓   █      ◐◐██◐◐      █   ▓█  ",
      "  █    █     ◐██████◐     █    █  ",
      "  █    █     ◐██████◐     █    █  ",
      "  █▓   █      ◐◐██◐◐      █   ▓█  ",
      "  ▓█    ▀▄      ◐◐      ▄▀    █▓  ",
      "   ▓█     ▀▀▄        ▄▀▀     █▓   ",
      "    ▓█▀      ▀▀▄▄▄▄▀▀      ▀█▓    ",
      "      ▓██▄                ▄██▓      ",
      "        ▓▓██████████████████▓▓        ",
      "            ▓▓▓▓▓▓▓▓▓▓▓▓            ",
    ],
  ], [])

  // GPU-OPTIMIZED: RAF-driven animation without setInterval
  useEffect(() => {
    const animate = (now) => {
      const elapsed = now - animationStartRef.current
      const newFrame = Math.floor((elapsed / 800) % eyeFrames.length)
      if (newFrame !== frame) {
        setFrame(newFrame)
      }
      frameRequestRef.current = requestAnimationFrame(animate)
    }
    frameRequestRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current)
      }
    }
  }, [frame, eyeFrames.length])

  const currentFrame = eyeFrames[frame]

  return (
    <div className="ascii-glass">
      <div className="ascii-glass__container">
        <pre className="ascii-glass__art">
          {currentFrame.map((line, i) => (
            <motion.span
              key={i}
              className="ascii-glass__line"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              style={{ willChange: 'opacity, transform' }}
            >
              {line}
            </motion.span>
          ))}
        </pre>
        <div className="ascii-glass__glow" />
        <div className="ascii-glass__reflection" />
      </div>
    </div>
  )
}

export default AsciiLiquidGlass
