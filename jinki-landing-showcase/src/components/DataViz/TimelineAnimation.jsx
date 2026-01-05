import { motion } from 'framer-motion'
import { useState } from 'react'
import './DataVizStyles.css'

/**
 * TIMELINE ANIMATION - Detection progression visualization
 * Vertical/horizontal timeline with staggered animations and detail reveals
 */
export function TimelineAnimation({
  events = [],
  direction = 'vertical', // 'vertical' or 'horizontal'
  animated = true,
}) {
  const [expandedId, setExpandedId] = useState(null)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: {
      opacity: 0,
      x: direction === 'horizontal' ? -30 : 0,
      y: direction === 'vertical' ? -30 : 0,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  }

  const dotVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
    hover: { scale: 1.3, boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)' },
  }

  return (
    <motion.div
      className={`timeline-container timeline-${direction}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.5 }}
    >
      {direction === 'vertical' ? (
        <div className="timeline-vertical">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              className={`timeline-item ${expandedId === event.id ? 'expanded' : ''}`}
              variants={itemVariants}
              onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
            >
              {/* Timeline dot and line */}
              <motion.div className="timeline-marker" variants={dotVariants}>
                <motion.div
                  className="timeline-dot"
                  whileHover="hover"
                  initial="hidden"
                  animate="visible"
                >
                  {event.icon && <span className="dot-icon">{event.icon}</span>}
                </motion.div>
                {index < events.length - 1 && <div className="timeline-line"></div>}
              </motion.div>

              {/* Timeline content */}
              <motion.div className="timeline-content">
                <div className="content-header">
                  <h3 className="content-title">{event.title}</h3>
                  {event.time && <span className="content-time">{event.time}</span>}
                </div>

                {/* Description - always visible */}
                <p className="content-description">{event.description}</p>

                {/* Details - reveal on click */}
                <motion.div
                  className="content-details"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{
                    opacity: expandedId === event.id ? 1 : 0,
                    height: expandedId === event.id ? 'auto' : 0,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {event.details && (
                    <div className="details-text">
                      {Array.isArray(event.details) ? (
                        <ul>
                          {event.details.map((detail, i) => (
                            <li key={i}>{detail}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>{event.details}</p>
                      )}
                    </div>
                  )}

                  {/* Metrics if provided */}
                  {event.metrics && (
                    <div className="details-metrics">
                      {event.metrics.map((metric, i) => (
                        <div key={i} className="metric-item">
                          <span className="metric-label">{metric.label}</span>
                          <span className="metric-value">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="timeline-horizontal">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              className={`timeline-item horizontal ${expandedId === event.id ? 'expanded' : ''}`}
              variants={itemVariants}
              onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
            >
              {/* Horizontal timeline dot */}
              <motion.div className="timeline-marker" variants={dotVariants}>
                <motion.div
                  className="timeline-dot"
                  whileHover="hover"
                  initial="hidden"
                  animate="visible"
                >
                  {event.icon && <span className="dot-icon">{event.icon}</span>}
                </motion.div>
              </motion.div>

              {/* Horizontal timeline content */}
              <motion.div className="timeline-content">
                <div className="content-header">
                  <h3 className="content-title">{event.title}</h3>
                  {event.time && <span className="content-time">{event.time}</span>}
                </div>

                <p className="content-description">{event.description}</p>

                {/* Expandable details */}
                <motion.div
                  className="content-details"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{
                    opacity: expandedId === event.id ? 1 : 0,
                    height: expandedId === event.id ? 'auto' : 0,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {event.details && (
                    <div className="details-text">
                      {Array.isArray(event.details) ? (
                        <ul>
                          {event.details.map((detail, i) => (
                            <li key={i}>{detail}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>{event.details}</p>
                      )}
                    </div>
                  )}

                  {event.metrics && (
                    <div className="details-metrics">
                      {event.metrics.map((metric, i) => (
                        <div key={i} className="metric-item">
                          <span className="metric-label">{metric.label}</span>
                          <span className="metric-value">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default TimelineAnimation
