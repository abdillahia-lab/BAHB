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
      <svg viewBox="0 0 900 300" xmlns="http://www.w3.org/2000/svg" className="flow-svg">
        <defs>
          {/* Chrome gradient for hub */}
          <linearGradient id="chromeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8eaed" />
            <stop offset="50%" stopColor="#9aa0a6" />
            <stop offset="100%" stopColor="#5f6368" />
          </linearGradient>

          {/* Cyan gradient */}
          <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0" />
            <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Hub glow */}
          <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Central Hub Glow */}
        <circle cx="450" cy="150" r="100" fill="url(#hubGlow)" className="hub-glow" />

        {/* Connection Lines - Input */}
        <line x1="120" y1="80" x2="380" y2="130" stroke="#30363d" strokeWidth="1" className="flow-line" />
        <line x1="120" y1="150" x2="380" y2="150" stroke="#30363d" strokeWidth="1" className="flow-line" />
        <line x1="120" y1="220" x2="380" y2="170" stroke="#30363d" strokeWidth="1" className="flow-line" />

        {/* Connection Lines - Output */}
        <line x1="520" y1="130" x2="780" y2="80" stroke="#30363d" strokeWidth="1" className="flow-line" />
        <line x1="520" y1="150" x2="780" y2="150" stroke="#30363d" strokeWidth="1" className="flow-line" />
        <line x1="520" y1="170" x2="780" y2="220" stroke="#30363d" strokeWidth="1" className="flow-line" />

        {/* Animated flow particles */}
        <circle r="3" fill="#00d4ff" filter="url(#glow)" className="particle p1">
          <animate attributeName="cx" values="120;380" dur="2s" repeatCount="indefinite" />
          <animate attributeName="cy" values="80;130" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle r="3" fill="#00d4ff" filter="url(#glow)" className="particle p2">
          <animate attributeName="cx" values="120;380" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="cy" values="150;150" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle r="3" fill="#00d4ff" filter="url(#glow)" className="particle p3">
          <animate attributeName="cx" values="120;380" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="cy" values="220;170" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle r="3" fill="#00d4ff" filter="url(#glow)" className="particle p4">
          <animate attributeName="cx" values="520;780" dur="2s" repeatCount="indefinite" />
          <animate attributeName="cy" values="130;80" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle r="3" fill="#00d4ff" filter="url(#glow)" className="particle p5">
          <animate attributeName="cx" values="520;780" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="cy" values="150;150" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle r="3" fill="#00d4ff" filter="url(#glow)" className="particle p6">
          <animate attributeName="cx" values="520;780" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="cy" values="170;220" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0" dur="1.8s" repeatCount="indefinite" />
        </circle>

        {/* Central Hub */}
        <g className="hub">
          <circle cx="450" cy="150" r="60" fill="#161b22" stroke="#30363d" strokeWidth="2" />
          <circle cx="450" cy="150" r="45" fill="none" stroke="url(#chromeGradient)" strokeWidth="1" opacity="0.5" />
          <circle cx="450" cy="150" r="20" fill="#00d4ff" opacity="0.8" filter="url(#glow)" className="hub-core" />
          <circle cx="450" cy="150" r="8" fill="#fff" opacity="0.9" />
        </g>

        {/* Input Nodes */}
        <g className="node node-input n1">
          <circle cx="80" cy="80" r="28" fill="#161b22" stroke="#30363d" strokeWidth="1.5" />
          <text x="80" y="85" textAnchor="middle" fill="#8b949e" fontSize="11" fontWeight="500">Drones</text>
        </g>
        <g className="node node-input n2">
          <circle cx="80" cy="150" r="28" fill="#161b22" stroke="#30363d" strokeWidth="1.5" />
          <text x="80" y="155" textAnchor="middle" fill="#8b949e" fontSize="11" fontWeight="500">Sensors</text>
        </g>
        <g className="node node-input n3">
          <circle cx="80" cy="220" r="28" fill="#161b22" stroke="#30363d" strokeWidth="1.5" />
          <text x="80" y="225" textAnchor="middle" fill="#8b949e" fontSize="11" fontWeight="500">Threats</text>
        </g>

        {/* Output Nodes */}
        <g className="node node-output n4">
          <circle cx="820" cy="80" r="28" fill="#161b22" stroke="#30363d" strokeWidth="1.5" />
          <text x="820" y="85" textAnchor="middle" fill="#8b949e" fontSize="11" fontWeight="500">Alerts</text>
        </g>
        <g className="node node-output n5">
          <circle cx="820" cy="150" r="28" fill="#161b22" stroke="#30363d" strokeWidth="1.5" />
          <text x="820" y="155" textAnchor="middle" fill="#8b949e" fontSize="11" fontWeight="500">Reports</text>
        </g>
        <g className="node node-output n6">
          <circle cx="820" cy="220" r="28" fill="#161b22" stroke="#30363d" strokeWidth="1.5" />
          <text x="820" y="225" textAnchor="middle" fill="#8b949e" fontSize="11" fontWeight="500">Insights</text>
        </g>

        {/* Labels */}
        <text x="80" y="275" textAnchor="middle" fill="#6e7681" fontSize="9" fontWeight="600" letterSpacing="0.1em">INPUT</text>
        <text x="450" y="235" textAnchor="middle" fill="#00d4ff" fontSize="10" fontWeight="600" letterSpacing="0.15em">JINKI HUB</text>
        <text x="820" y="275" textAnchor="middle" fill="#6e7681" fontSize="9" fontWeight="600" letterSpacing="0.1em">OUTPUT</text>
      </svg>
    </div>
  )
}
