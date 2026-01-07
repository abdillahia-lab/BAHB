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
      <div className="flow-container">
        {/* Input Column */}
        <div className="flow-column flow-column--input">
          <div className="flow-node" data-tooltip="MQ-9 Reaper feeds, DJI patrol units, autonomous reconnaissance">
            <div className="flow-node__icon">✈</div>
            <div className="flow-node__label">Drones</div>
          </div>
          <div className="flow-node" data-tooltip="Radar arrays, thermal imaging, acoustic detection systems">
            <div className="flow-node__icon">📡</div>
            <div className="flow-node__label">Sensors</div>
          </div>
          <div className="flow-node" data-tooltip="Unidentified aircraft, perimeter breach, signal anomaly detected">
            <div className="flow-node__icon">⚠</div>
            <div className="flow-node__label">Threats</div>
          </div>
          <span className="flow-column__label">DATA IN</span>
        </div>

        {/* Connection Lines - Left */}
        <div className="flow-lines flow-lines--left">
          <svg viewBox="0 0 100 200" preserveAspectRatio="none">
            <path d="M0,30 Q50,30 100,100" className="flow-path" />
            <path d="M0,100 Q50,100 100,100" className="flow-path" />
            <path d="M0,170 Q50,170 100,100" className="flow-path" />
            <circle r="4" className="flow-dot">
              <animateMotion dur="2s" repeatCount="indefinite" path="M0,30 Q50,30 100,100" />
            </circle>
            <circle r="4" className="flow-dot">
              <animateMotion dur="2.2s" repeatCount="indefinite" begin="0.3s" path="M0,100 Q50,100 100,100" />
            </circle>
            <circle r="4" className="flow-dot">
              <animateMotion dur="1.8s" repeatCount="indefinite" begin="0.6s" path="M0,170 Q50,170 100,100" />
            </circle>
          </svg>
        </div>

        {/* Central Hub */}
        <div className="flow-hub">
          <div className="flow-hub__rings">
            <div className="flow-hub__ring flow-hub__ring--outer"></div>
            <div className="flow-hub__ring flow-hub__ring--inner"></div>
          </div>
          <div className="flow-hub__core">
            <div className="flow-hub__glow"></div>
            <div className="flow-hub__center"></div>
          </div>
          <span className="flow-hub__label">JINKI</span>
        </div>

        {/* Connection Lines - Right */}
        <div className="flow-lines flow-lines--right">
          <svg viewBox="0 0 100 200" preserveAspectRatio="none">
            <path d="M0,100 Q50,30 100,30" className="flow-path" />
            <path d="M0,100 Q50,100 100,100" className="flow-path" />
            <path d="M0,100 Q50,170 100,170" className="flow-path" />
            <circle r="4" className="flow-dot">
              <animateMotion dur="2s" repeatCount="indefinite" begin="1s" path="M0,100 Q50,30 100,30" />
            </circle>
            <circle r="4" className="flow-dot">
              <animateMotion dur="2.2s" repeatCount="indefinite" begin="1.3s" path="M0,100 Q50,100 100,100" />
            </circle>
            <circle r="4" className="flow-dot">
              <animateMotion dur="1.8s" repeatCount="indefinite" begin="1.6s" path="M0,100 Q50,170 100,170" />
            </circle>
          </svg>
        </div>

        {/* Output Column */}
        <div className="flow-column flow-column--output">
          <div className="flow-node" data-tooltip="PRIORITY: Unknown drone detected in protected airspace sector 7">
            <div className="flow-node__icon">🔔</div>
            <div className="flow-node__label">Alerts</div>
          </div>
          <div className="flow-node" data-tooltip="Daily threat assessment, incident timeline, compliance analytics">
            <div className="flow-node__icon">📊</div>
            <div className="flow-node__label">Reports</div>
          </div>
          <div className="flow-node" data-tooltip="Pattern: 3x activity increase detected at 0200hrs weekly">
            <div className="flow-node__icon">💡</div>
            <div className="flow-node__label">Insights</div>
          </div>
          <span className="flow-column__label">INTEL OUT</span>
        </div>
      </div>
    </div>
  )
}
