import { useMemo } from 'react'

/**
 * TITAN CHAMPION: GPU-Optimized Liquid Wave ASCII
 * - CSS-driven animation (no JS re-renders)
 * - Memoized wave lines
 * - GPU compositor hints
 * - Lazy-loadable for bundle splitting
 */

export const LiquidWaveAscii = () => {
  // Memoize wave lines - prevent recalculation on every render
  const waveLines = useMemo(() => {
    const wave = '░▒▓█▓▒░  '
    const rows = []
    for (let rowOffset = 0; rowOffset < 5; rowOffset++) {
      let line = ''
      for (let i = 0; i < 50; i++) {
        const charIndex = (i + rowOffset) % wave.length
        line += wave[charIndex]
      }
      rows.push(line)
    }
    return rows
  }, [])

  return (
    <div className="liquid-wave">
      {waveLines.map((line, idx) => (
        <div
          key={idx}
          className="liquid-wave__row"
          style={{
            willChange: 'transform',
            contain: 'layout paint',
            transform: 'translateZ(0)',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  )
}

export default LiquidWaveAscii
