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
      <svg
        viewBox="0 0 1200 500"
        xmlns="http://www.w3.org/2000/svg"
        className="flow-svg"
      >
        <defs>
          {/* Gradients */}
          <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#0080ff" />
          </linearGradient>

          {/* Filters */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Glow */}
        <circle cx="600" cy="250" r="200" fill="url(#hubGlow)" className="hub-glow" />

        {/* Connection Paths - Inputs */}
        <path
          d="M 150 100 Q 350 100 500 200"
          className="flow-path flow-path--1"
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="2"
        />
        <path
          d="M 150 200 Q 300 200 500 220"
          className="flow-path flow-path--2"
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="2"
        />
        <path
          d="M 150 300 Q 300 300 500 280"
          className="flow-path flow-path--3"
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="2"
        />
        <path
          d="M 150 400 Q 350 400 500 300"
          className="flow-path flow-path--4"
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="2"
        />

        {/* Connection Paths - Outputs */}
        <path
          d="M 700 200 Q 850 100 1050 100"
          className="flow-path flow-path--5"
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="2"
        />
        <path
          d="M 700 220 Q 900 200 1050 200"
          className="flow-path flow-path--6"
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="2"
        />
        <path
          d="M 700 280 Q 900 300 1050 300"
          className="flow-path flow-path--7"
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="2"
        />
        <path
          d="M 700 300 Q 850 400 1050 400"
          className="flow-path flow-path--8"
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="2"
        />

        {/* Animated Particles */}
        <circle r="4" fill="#00d4ff" filter="url(#glow)" className="particle particle--1">
          <animateMotion dur="3s" repeatCount="indefinite" path="M 150 100 Q 350 100 500 200" />
        </circle>
        <circle r="4" fill="#00d4ff" filter="url(#glow)" className="particle particle--2">
          <animateMotion dur="3.2s" repeatCount="indefinite" path="M 150 200 Q 300 200 500 220" />
        </circle>
        <circle r="4" fill="#00d4ff" filter="url(#glow)" className="particle particle--3">
          <animateMotion dur="2.8s" repeatCount="indefinite" path="M 150 300 Q 300 300 500 280" />
        </circle>
        <circle r="4" fill="#00d4ff" filter="url(#glow)" className="particle particle--4">
          <animateMotion dur="3.4s" repeatCount="indefinite" path="M 150 400 Q 350 400 500 300" />
        </circle>
        <circle r="4" fill="#00d4ff" filter="url(#glow)" className="particle particle--5">
          <animateMotion dur="3s" repeatCount="indefinite" path="M 700 200 Q 850 100 1050 100" />
        </circle>
        <circle r="4" fill="#00d4ff" filter="url(#glow)" className="particle particle--6">
          <animateMotion dur="3.2s" repeatCount="indefinite" path="M 700 220 Q 900 200 1050 200" />
        </circle>
        <circle r="4" fill="#00d4ff" filter="url(#glow)" className="particle particle--7">
          <animateMotion dur="2.8s" repeatCount="indefinite" path="M 700 280 Q 900 300 1050 300" />
        </circle>
        <circle r="4" fill="#00d4ff" filter="url(#glow)" className="particle particle--8">
          <animateMotion dur="3.4s" repeatCount="indefinite" path="M 700 300 Q 850 400 1050 400" />
        </circle>

        {/* Central Hub */}
        <g className="flow-hub">
          {/* Outer ring */}
          <ellipse cx="600" cy="250" rx="120" ry="80" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.3" className="hub-ring hub-ring--outer" />
          {/* Inner ring */}
          <ellipse cx="600" cy="250" rx="90" ry="60" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.5" className="hub-ring hub-ring--inner" />
          {/* Core */}
          <circle cx="600" cy="250" r="50" fill="#0a0a0a" stroke="url(#cyanGradient)" strokeWidth="2" filter="url(#softGlow)" />
          <circle cx="600" cy="250" r="30" fill="url(#cyanGradient)" opacity="0.3" className="hub-core" />
          <circle cx="600" cy="250" r="15" fill="#00d4ff" opacity="0.8" className="hub-center" />
          {/* Hub Label */}
          <text x="600" y="340" textAnchor="middle" fill="#ffffff" fontSize="14" fontFamily="SF Pro Display, system-ui, sans-serif" fontWeight="600" letterSpacing="0.1em">
            JINKI HUB
          </text>
          <text x="600" y="358" textAnchor="middle" fill="#00d4ff" fontSize="10" fontFamily="SF Mono, monospace" opacity="0.7" letterSpacing="0.15em">
            INTELLIGENCE
          </text>
        </g>

        {/* Input Nodes */}
        <g className="flow-node flow-node--input flow-node--1">
          <circle cx="100" cy="100" r="30" fill="url(#nodeGlow)" />
          <circle cx="100" cy="100" r="24" fill="#0a0a0a" stroke="#00d4ff" strokeWidth="1.5" />
          <text x="100" y="104" textAnchor="middle" fill="#00d4ff" fontSize="16">✈</text>
          <text x="100" cy="145" textAnchor="middle" fill="#888" fontSize="10" fontFamily="SF Mono, monospace">DRONES</text>
        </g>

        <g className="flow-node flow-node--input flow-node--2">
          <circle cx="100" cy="200" r="30" fill="url(#nodeGlow)" />
          <circle cx="100" cy="200" r="24" fill="#0a0a0a" stroke="#00d4ff" strokeWidth="1.5" />
          <text x="100" y="204" textAnchor="middle" fill="#00d4ff" fontSize="16">📡</text>
          <text x="100" y="245" textAnchor="middle" fill="#888" fontSize="10" fontFamily="SF Mono, monospace">SENSORS</text>
        </g>

        <g className="flow-node flow-node--input flow-node--3">
          <circle cx="100" cy="300" r="30" fill="url(#nodeGlow)" />
          <circle cx="100" cy="300" r="24" fill="#0a0a0a" stroke="#00d4ff" strokeWidth="1.5" />
          <text x="100" y="304" textAnchor="middle" fill="#00d4ff" fontSize="16">⚠</text>
          <text x="100" y="345" textAnchor="middle" fill="#888" fontSize="10" fontFamily="SF Mono, monospace">THREATS</text>
        </g>

        <g className="flow-node flow-node--input flow-node--4">
          <circle cx="100" cy="400" r="30" fill="url(#nodeGlow)" />
          <circle cx="100" cy="400" r="24" fill="#0a0a0a" stroke="#00d4ff" strokeWidth="1.5" />
          <text x="100" y="404" textAnchor="middle" fill="#00d4ff" fontSize="16">🔒</text>
          <text x="100" y="445" textAnchor="middle" fill="#888" fontSize="10" fontFamily="SF Mono, monospace">SECURITY</text>
        </g>

        {/* Output Nodes */}
        <g className="flow-node flow-node--output flow-node--5">
          <circle cx="1100" cy="100" r="30" fill="url(#nodeGlow)" />
          <circle cx="1100" cy="100" r="24" fill="#0a0a0a" stroke="#00d4ff" strokeWidth="1.5" />
          <text x="1100" y="104" textAnchor="middle" fill="#00d4ff" fontSize="16">🔔</text>
          <text x="1100" y="145" textAnchor="middle" fill="#888" fontSize="10" fontFamily="SF Mono, monospace">ALERTS</text>
        </g>

        <g className="flow-node flow-node--output flow-node--6">
          <circle cx="1100" cy="200" r="30" fill="url(#nodeGlow)" />
          <circle cx="1100" cy="200" r="24" fill="#0a0a0a" stroke="#00d4ff" strokeWidth="1.5" />
          <text x="1100" y="204" textAnchor="middle" fill="#00d4ff" fontSize="16">📊</text>
          <text x="1100" y="245" textAnchor="middle" fill="#888" fontSize="10" fontFamily="SF Mono, monospace">REPORTS</text>
        </g>

        <g className="flow-node flow-node--output flow-node--7">
          <circle cx="1100" cy="300" r="30" fill="url(#nodeGlow)" />
          <circle cx="1100" cy="300" r="24" fill="#0a0a0a" stroke="#00d4ff" strokeWidth="1.5" />
          <text x="1100" y="304" textAnchor="middle" fill="#00d4ff" fontSize="16">💡</text>
          <text x="1100" y="345" textAnchor="middle" fill="#888" fontSize="10" fontFamily="SF Mono, monospace">INSIGHTS</text>
        </g>

        <g className="flow-node flow-node--output flow-node--8">
          <circle cx="1100" cy="400" r="30" fill="url(#nodeGlow)" />
          <circle cx="1100" cy="400" r="24" fill="#0a0a0a" stroke="#00d4ff" strokeWidth="1.5" />
          <text x="1100" y="404" textAnchor="middle" fill="#00d4ff" fontSize="16">📈</text>
          <text x="1100" y="445" textAnchor="middle" fill="#888" fontSize="10" fontFamily="SF Mono, monospace">RISK SCORE</text>
        </g>
      </svg>

      {/* Section Labels */}
      <div className="flow-labels">
        <span className="flow-label flow-label--input">DATA IN</span>
        <span className="flow-label flow-label--output">INTEL OUT</span>
      </div>
    </div>
  )
}
