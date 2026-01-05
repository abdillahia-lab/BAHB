import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * LAZYMASTER: Lazy-loaded ASCII Liquid Glass
 * Dynamically imported to reduce initial bundle
 */

export const AsciiLiquidGlass = () => {
  const [frame, setFrame] = useState(0)
  const chars = ['░', '▒', '▓', '█', '▄', '▀', '■', '□', '▪', '▫', '●', '○', '◐', '◑', '◒', '◓']
  const waveChars = ['~', '≈', '∼', '≋', '〰', '∿']

  const eyeFrames = [
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
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % eyeFrames.length)
    }, 800)
    return () => clearInterval(interval)
  }, [])

  const currentFrame = eyeFrames[frame]
  const ease = [0.25, 0.1, 0.25, 1]

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
