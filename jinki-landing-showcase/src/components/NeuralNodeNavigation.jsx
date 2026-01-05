import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import '../styles/NeuralNetwork.css'

/**
 * NEURAL NODE NAVIGATION
 * Interactive navigation system with:
 * - Visual node network connecting sections
 * - Activation propagation on click
 * - Smooth transitions between nodes
 * - Real-time connection visualization
 */

export default function NeuralNodeNavigation({
  nodes = [
    { id: 'overview', icon: '◯', label: 'Overview', color: 'rgba(0, 255, 200, 0.8)' },
    { id: 'features', icon: '◆', label: 'Features', color: 'rgba(0, 200, 255, 0.8)' },
    { id: 'technology', icon: '▲', label: 'Technology', color: 'rgba(100, 255, 200, 0.8)' },
    { id: 'about', icon: '★', label: 'About', color: 'rgba(0, 255, 150, 0.8)' },
  ],
  onNodeClick = () => {},
  className = ''
}) {
  const [activeNode, setActiveNode] = useState(null)
  const [connections, setConnections] = useState([])
  const containerRef = useRef(null)
  const nodesRef = useRef({})

  // Calculate connections between nodes
  useEffect(() => {
    if (!containerRef.current) return

    const newConnections = []
    const nodeKeys = Object.keys(nodesRef.current)

    for (let i = 0; i < nodeKeys.length; i++) {
      for (let j = i + 1; j < nodeKeys.length; j++) {
        const nodeA = nodesRef.current[nodeKeys[i]]
        const nodeB = nodesRef.current[nodeKeys[j]]

        if (nodeA && nodeB) {
          newConnections.push({
            from: nodeKeys[i],
            to: nodeKeys[j],
            fromPos: {
              x: nodeA.offsetLeft + nodeA.offsetWidth / 2,
              y: nodeA.offsetTop + nodeA.offsetHeight / 2
            },
            toPos: {
              x: nodeB.offsetLeft + nodeB.offsetWidth / 2,
              y: nodeB.offsetTop + nodeB.offsetHeight / 2
            }
          })
        }
      }
    }

    setConnections(newConnections)
  }, [nodes])

  const handleNodeClick = (nodeId) => {
    setActiveNode(nodeId)
    onNodeClick(nodeId)
  }

  const handleMouseEnter = (nodeId) => {
    // Visual feedback handled by CSS
  }

  return (
    <div ref={containerRef} className={`neural-node-nav ${className}`}>
      {/* SVG Connections Layer */}
      <svg
        className="neural-connections-svg"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        {connections.map((conn, idx) => (
          <g key={idx}>
            {/* Connection line */}
            <line
              x1={conn.fromPos.x}
              y1={conn.fromPos.y}
              x2={conn.toPos.x}
              y2={conn.toPos.y}
              stroke={`rgba(0, 255, 200, ${activeNode ? 0.2 : 0.4})`}
              strokeWidth={activeNode === conn.from || activeNode === conn.to ? 2 : 1}
              className={activeNode === conn.from || activeNode === conn.to ? 'connection-active' : ''}
              style={{
                transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)'
              }}
            />
            {/* Synaptic pulse midpoint */}
            <circle
              cx={(conn.fromPos.x + conn.toPos.x) / 2}
              cy={(conn.fromPos.y + conn.toPos.y) / 2}
              r={activeNode === conn.from || activeNode === conn.to ? 3 : 1}
              fill={activeNode === conn.from || activeNode === conn.to ? 'rgba(0, 255, 200, 0.9)' : 'rgba(0, 255, 200, 0.3)'}
              style={{
                transition: 'all 0.3s ease'
              }}
            />
          </g>
        ))}
      </svg>

      {/* Node Elements */}
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          ref={(el) => {
            if (el) nodesRef.current[node.id] = el
          }}
          className="nav-node"
          onClick={() => handleNodeClick(node.id)}
          onMouseEnter={() => handleMouseEnter(node.id)}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          style={{
            cursor: 'pointer',
            position: 'relative',
            zIndex: 10
          }}
        >
          <motion.div
            className="nav-node-core"
            animate={{
              boxShadow: activeNode === node.id
                ? '0 0 40px rgba(0, 255, 200, 0.8), inset 0 0 30px rgba(0, 255, 200, 0.4)'
                : '0 0 20px rgba(0, 255, 200, 0.3), inset 0 0 20px rgba(0, 255, 200, 0.2)'
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.span
              animate={{
                opacity: activeNode === node.id ? 1 : 0.8,
                scale: activeNode === node.id ? 1.2 : 1
              }}
              transition={{ duration: 0.3 }}
            >
              {node.icon}
            </motion.span>
          </motion.div>

          <motion.div
            className="nav-node-glow"
            animate={{
              boxShadow: activeNode === node.id
                ? '0 0 0 15px rgba(0, 255, 200, 0.4)'
                : '0 0 0 0 rgba(0, 255, 200, 0)'
            }}
            transition={{ duration: 0.3 }}
          />

          <div className="nav-node-label">
            {node.label}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/**
 * NEURAL NODE SECTION WRAPPER
 * Wraps content sections to provide neural activation feedback
 */
export function NeuralSection({
  id,
  children,
  className = '',
  activated = false,
  onActivate = () => {}
}) {
  useEffect(() => {
    if (activated) {
      // Trigger visual feedback
      const element = document.querySelector(`[data-neural-section="${id}"]`)
      if (element) {
        element.classList.add('neural-active')
        setTimeout(() => {
          element.classList.remove('neural-active')
        }, 1000)
      }
    }
  }, [activated, id])

  return (
    <section
      data-neural-section={id}
      className={`neural-section ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <style>{`
        [data-neural-section] {
          position: relative;
        }

        [data-neural-section].neural-active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at center,
            rgba(0, 255, 200, 0.2) 0%,
            transparent 70%);
          pointer-events: none;
          animation: neural-activation-pulse 0.6s ease-out;
        }

        @keyframes neural-activation-pulse {
          0% {
            transform: scale(0.95);
            opacity: 1;
          }
          100% {
            transform: scale(1.15);
            opacity: 0;
          }
        }
      `}</style>
      {children}
    </section>
  )
}
