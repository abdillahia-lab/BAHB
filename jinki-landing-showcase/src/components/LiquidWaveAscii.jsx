import { useState, useEffect } from 'react'

/**
 * LAZYMASTER: Lazy-loaded Liquid Wave ASCII
 * Dynamically imported to reduce initial bundle
 */

export const LiquidWaveAscii = () => {
  const [offset, setOffset] = useState(0)
  const wave = '░▒▓█▓▒░  '

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(o => (o + 1) % wave.length)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const generateWaveLine = (rowOffset) => {
    let line = ''
    for (let i = 0; i < 50; i++) {
      const charIndex = (i + offset + rowOffset) % wave.length
      line += wave[charIndex]
    }
    return line
  }

  return (
    <div className="liquid-wave">
      {[0, 2, 4, 6, 8].map(rowOffset => (
        <div key={rowOffset} className="liquid-wave__row">
          {generateWaveLine(rowOffset)}
        </div>
      ))}
    </div>
  )
}
