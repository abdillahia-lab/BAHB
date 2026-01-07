import { useEffect, useRef } from 'react'
import './FlowDiagram.css'

export default function FlowDiagram() {
  const containerRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('flow-visible')
          }
        })
      },
      { threshold: 0.2 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div className="flow-diagram" ref={containerRef}>
      <svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" className="flow-svg">
        <defs>
          {/* Chrome gradient */}
          <linearGradient id="chrome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e8eaed" />
            <stop offset="50%" stopColor="#808080" />
            <stop offset="100%" stopColor="#c0c0c0" />
          </linearGradient>

          {/* Cyan core gradient */}
          <radialGradient id="cyanCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#80ffff" />
            <stop offset="100%" stopColor="#00d4ff" />
          </radialGradient>

          {/* Hub ambient glow */}
          <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#00d4ff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </radialGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Strong glow for core */}
          <filter id="coreGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Line gradient */}
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#30363d" />
            <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#30363d" />
          </linearGradient>
        </defs>

        {/* Hub ambient glow */}
        <circle cx="450" cy="160" r="120" fill="url(#hubGlow)" className="hub-ambient" />

        {/* Connection Lines - Input */}
        <line x1="140" y1="80" x2="370" y2="140" stroke="#30363d" strokeWidth="2" className="flow-line" />
        <line x1="140" y1="160" x2="370" y2="160" stroke="#30363d" strokeWidth="2" className="flow-line" />
        <line x1="140" y1="240" x2="370" y2="180" stroke="#30363d" strokeWidth="2" className="flow-line" />

        {/* Connection Lines - Output */}
        <line x1="530" y1="140" x2="760" y2="80" stroke="#30363d" strokeWidth="2" className="flow-line" />
        <line x1="530" y1="160" x2="760" y2="160" stroke="#30363d" strokeWidth="2" className="flow-line" />
        <line x1="530" y1="180" x2="760" y2="240" stroke="#30363d" strokeWidth="2" className="flow-line" />

        {/* Animated particles - Input */}
        <circle r="4" fill="#00d4ff" filter="url(#glow)" className="particle">
          <animate attributeName="cx" values="140;370" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="cy" values="80;140" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle r="4" fill="#00d4ff" filter="url(#glow)" className="particle">
          <animate attributeName="cx" values="140;370" dur="2.8s" repeatCount="indefinite" begin="0.3s" />
          <animate attributeName="cy" values="160;160" dur="2.8s" repeatCount="indefinite" begin="0.3s" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2.8s" repeatCount="indefinite" begin="0.3s" />
        </circle>
        <circle r="4" fill="#00d4ff" filter="url(#glow)" className="particle">
          <animate attributeName="cx" values="140;370" dur="2.3s" repeatCount="indefinite" begin="0.6s" />
          <animate attributeName="cy" values="240;180" dur="2.3s" repeatCount="indefinite" begin="0.6s" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2.3s" repeatCount="indefinite" begin="0.6s" />
        </circle>

        {/* Animated particles - Output */}
        <circle r="4" fill="#00d4ff" filter="url(#glow)" className="particle">
          <animate attributeName="cx" values="530;760" dur="2.5s" repeatCount="indefinite" begin="1.2s" />
          <animate attributeName="cy" values="140;80" dur="2.5s" repeatCount="indefinite" begin="1.2s" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite" begin="1.2s" />
        </circle>
        <circle r="4" fill="#00d4ff" filter="url(#glow)" className="particle">
          <animate attributeName="cx" values="530;760" dur="2.8s" repeatCount="indefinite" begin="1.5s" />
          <animate attributeName="cy" values="160;160" dur="2.8s" repeatCount="indefinite" begin="1.5s" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2.8s" repeatCount="indefinite" begin="1.5s" />
        </circle>
        <circle r="4" fill="#00d4ff" filter="url(#glow)" className="particle">
          <animate attributeName="cx" values="530;760" dur="2.3s" repeatCount="indefinite" begin="1.8s" />
          <animate attributeName="cy" values="180;240" dur="2.3s" repeatCount="indefinite" begin="1.8s" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2.3s" repeatCount="indefinite" begin="1.8s" />
        </circle>

        {/* Central Hub - Orbital Rings like logo */}
        <g className="hub">
          {/* Outer orbital ring */}
          <ellipse cx="450" cy="160" rx="70" ry="25" fill="none" stroke="url(#chrome)" strokeWidth="4"
                   transform="rotate(-10, 450, 160)" className="hub-ring ring-outer" />
          {/* Inner orbital ring */}
          <ellipse cx="450" cy="160" rx="55" ry="20" fill="none" stroke="url(#chrome)" strokeWidth="3"
                   transform="rotate(8, 450, 160)" className="hub-ring ring-inner" opacity="0.7" />

          {/* Hub body */}
          <circle cx="450" cy="160" r="40" fill="#0d1117" stroke="url(#chrome)" strokeWidth="3" />
          <circle cx="450" cy="160" r="30" fill="none" stroke="#30363d" strokeWidth="1" />

          {/* Cyan core with glow */}
          <circle cx="450" cy="160" r="22" fill="url(#cyanCore)" filter="url(#coreGlow)" className="hub-core" />
          <circle cx="450" cy="160" r="10" fill="#00d4ff" />
          <circle cx="450" cy="160" r="5" fill="#ffffff" opacity="0.9" />

          {/* Highlight */}
          <circle cx="443" cy="152" r="4" fill="#ffffff" opacity="0.6" />
        </g>

        {/* Input Nodes */}
        <g className="node n1">
          <circle cx="100" cy="80" r="32" fill="#161b22" stroke="#30363d" strokeWidth="2" />
          <text x="100" y="76" textAnchor="middle" fill="#00d4ff" fontSize="14">✈</text>
          <text x="100" y="92" textAnchor="middle" fill="#8b949e" fontSize="9" fontWeight="500">Drones</text>
        </g>
        <g className="node n2">
          <circle cx="100" cy="160" r="32" fill="#161b22" stroke="#30363d" strokeWidth="2" />
          <text x="100" y="156" textAnchor="middle" fill="#00d4ff" fontSize="14">📡</text>
          <text x="100" y="172" textAnchor="middle" fill="#8b949e" fontSize="9" fontWeight="500">Sensors</text>
        </g>
        <g className="node n3">
          <circle cx="100" cy="240" r="32" fill="#161b22" stroke="#30363d" strokeWidth="2" />
          <text x="100" y="236" textAnchor="middle" fill="#00d4ff" fontSize="14">⚠</text>
          <text x="100" y="252" textAnchor="middle" fill="#8b949e" fontSize="9" fontWeight="500">Threats</text>
        </g>

        {/* Output Nodes */}
        <g className="node n4">
          <circle cx="800" cy="80" r="32" fill="#161b22" stroke="#30363d" strokeWidth="2" />
          <text x="800" y="76" textAnchor="middle" fill="#00d4ff" fontSize="14">🔔</text>
          <text x="800" y="92" textAnchor="middle" fill="#8b949e" fontSize="9" fontWeight="500">Alerts</text>
        </g>
        <g className="node n5">
          <circle cx="800" cy="160" r="32" fill="#161b22" stroke="#30363d" strokeWidth="2" />
          <text x="800" y="156" textAnchor="middle" fill="#00d4ff" fontSize="14">📊</text>
          <text x="800" y="172" textAnchor="middle" fill="#8b949e" fontSize="9" fontWeight="500">Reports</text>
        </g>
        <g className="node n6">
          <circle cx="800" cy="240" r="32" fill="#161b22" stroke="#30363d" strokeWidth="2" />
          <text x="800" y="236" textAnchor="middle" fill="#00d4ff" fontSize="14">💡</text>
          <text x="800" y="252" textAnchor="middle" fill="#8b949e" fontSize="9" fontWeight="500">Insights</text>
        </g>

        {/* Labels */}
        <text x="100" y="300" textAnchor="middle" fill="#6e7681" fontSize="10" fontWeight="600" letterSpacing="0.1em">DATA IN</text>
        <text x="450" y="235" textAnchor="middle" fill="#00d4ff" fontSize="11" fontWeight="600" letterSpacing="0.15em">JINKI HUB</text>
        <text x="800" y="300" textAnchor="middle" fill="#6e7681" fontSize="10" fontWeight="600" letterSpacing="0.1em">INTEL OUT</text>
      </svg>
    </div>
  )
}
