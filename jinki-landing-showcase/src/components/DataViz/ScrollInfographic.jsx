import { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import './DataVizStyles.css'

/**
 * SCROLL-TRIGGERED INFOGRAPHIC
 * Story-driven data visualization with scroll-based animations
 */
export function ScrollInfographic({
  sections = [],
  container = null,
}) {
  const containerRef = useRef(container)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  return (
    <motion.div
      ref={containerRef}
      className="scroll-infographic"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {sections.map((section, index) => {
        const yOffset = useTransform(
          scrollYProgress,
          [0, 1],
          [100, -100]
        )

        const opacity = useTransform(
          scrollYProgress,
          [index * 0.25, (index + 0.5) * 0.25],
          [0, 1]
        )

        return (
          <motion.section
            key={section.id}
            className="infographic-section"
            style={{
              opacity,
              y: yOffset,
            }}
          >
            {/* Section title */}
            <motion.div
              className="section-header"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {section.icon && <span className="section-icon">{section.icon}</span>}
              <h2 className="section-title">{section.title}</h2>
            </motion.div>

            {/* Section content with columns */}
            <div className="section-content">
              {section.columns &&
                section.columns.map((column, colIndex) => (
                  <motion.div
                    key={colIndex}
                    className="content-column"
                    initial={{ opacity: 0, x: colIndex % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: colIndex * 0.15 }}
                  >
                    {column.graphic && (
                      <div className="column-graphic">{column.graphic}</div>
                    )}
                    {column.text && (
                      <p className="column-text">{column.text}</p>
                    )}
                    {column.metrics && (
                      <div className="column-metrics">
                        {column.metrics.map((metric, metricIndex) => (
                          <motion.div
                            key={metricIndex}
                            className="metric-badge"
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{
                              duration: 0.4,
                              delay: colIndex * 0.15 + metricIndex * 0.1,
                            }}
                          >
                            <span className="metric-value">{metric.value}</span>
                            <span className="metric-label">{metric.label}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
            </div>

            {/* Section CTA or accent */}
            {section.accent && (
              <motion.div
                className="section-accent"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {section.accent}
              </motion.div>
            )}
          </motion.section>
        )
      })}
    </motion.div>
  )
}

export default ScrollInfographic
