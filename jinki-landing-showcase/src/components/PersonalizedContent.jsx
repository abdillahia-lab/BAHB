/**
 * PersonalizedContent - Dynamic content ordering based on user profile
 * Shows personalized solutions, case studies, and testimonials
 */

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePersonalization } from '../context/PersonalizationContext'
import './PersonalizedContent.css'

export function PersonalizedSolutions() {
  const {
    rankedSolutions,
    trackInteraction,
    userProfile
  } = usePersonalization()

  useEffect(() => {
    trackInteraction('personalized-solutions', 'section_view')
  }, [])

  if (!rankedSolutions || rankedSolutions.length === 0) {
    return null
  }

  const handleSolutionClick = (solution) => {
    trackInteraction('personalized-solutions', 'solution_click', {
      solution_id: solution.item.id,
      solution_name: solution.item.name,
      relevance_score: solution.score
    })
  }

  return (
    <section className="personalized-solutions">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Recommended Solutions for Your Industry</h2>
          <p>Personalized based on your needs and industry best practices</p>
        </motion.div>

        <div className="solutions-grid">
          {rankedSolutions.slice(0, 3).map((item, idx) => (
            <motion.div
              key={item.item.id}
              className="solution-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              onClick={() => handleSolutionClick(item)}
            >
              <div className="solution-header">
                <div className="solution-icon">{item.item.icon}</div>
                <div className="solution-relevance">
                  <span className="relevance-badge">
                    {Math.round(item.score * 100)}% match
                  </span>
                </div>
              </div>

              <h3>{item.item.name}</h3>
              <p className="solution-description">{item.item.description}</p>

              <div className="solution-benefits">
                {item.item.keyBenefits.slice(0, 3).map((benefit, i) => (
                  <div key={i} className="benefit-item">
                    <span className="checkmark">✓</span>
                    {benefit}
                  </div>
                ))}
              </div>

              <div className="solution-footer">
                <div className="solution-metrics">
                  <span className="metric">
                    <strong>{item.item.estimatedROI}</strong> ROI
                  </span>
                  <span className="metric">
                    <strong>{item.item.implementationTime}</strong> setup
                  </span>
                </div>
                <button className="learn-more">
                  Learn More →
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Personalized Case Studies Section
 */
export function PersonalizedCaseStudies() {
  const {
    rankedCaseStudies,
    trackInteraction,
    detectedIndustry
  } = usePersonalization()

  useEffect(() => {
    trackInteraction('personalized-case-studies', 'section_view')
  }, [])

  if (!rankedCaseStudies || rankedCaseStudies.length === 0) {
    return null
  }

  const handleCaseStudyClick = (caseStudy) => {
    trackInteraction('personalized-case-studies', 'case_study_click', {
      case_study_id: caseStudy.item.id,
      company: caseStudy.item.companyName,
      industry: caseStudy.item.industry
    })
  }

  return (
    <section className="personalized-case-studies">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Real Results from Your Industry</h2>
          <p>See how similar companies achieved measurable improvements</p>
        </motion.div>

        <div className="case-studies-list">
          {rankedCaseStudies.map((item, idx) => (
            <motion.div
              key={item.item.id}
              className="case-study-card"
              initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
            >
              <div className="case-study-content">
                <div className="company-info">
                  <h3>{item.item.companyName}</h3>
                  <span className="industry-badge">{item.item.industry.replace(/_/g, ' ')}</span>
                </div>

                <div className="case-study-section">
                  <h4>Challenge</h4>
                  <p>{item.item.challenge}</p>
                </div>

                <div className="case-study-section">
                  <h4>Solution</h4>
                  <p>{item.item.solution}</p>
                </div>

                <div className="metrics-showcase">
                  {item.item.metrics.map((metric, i) => (
                    <div key={i} className="metric-card">
                      <div className="metric-improvement">
                        +{metric.improvement}%
                      </div>
                      <div className="metric-label">{metric.label}</div>
                      <div className="metric-value">{metric.value}</div>
                    </div>
                  ))}
                </div>

                <blockquote className="testimonial-quote">
                  "{item.item.testimonial}"
                  <footer>
                    — {item.item.testimonialAuthor}, {item.item.testimonialRole}
                  </footer>
                </blockquote>

                <button
                  className="read-case-study"
                  onClick={() => handleCaseStudyClick(item)}
                >
                  Read Full Case Study →
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Personalized Testimonials Section
 */
export function PersonalizedTestimonials() {
  const {
    rankedTestimonials,
    trackInteraction
  } = usePersonalization()

  useEffect(() => {
    trackInteraction('personalized-testimonials', 'section_view')
  }, [])

  if (!rankedTestimonials || rankedTestimonials.length === 0) {
    return null
  }

  return (
    <section className="personalized-testimonials">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Trusted by Industry Leaders</h2>
          <p>Hear directly from companies like yours</p>
        </motion.div>

        <div className="testimonials-grid">
          {rankedTestimonials.slice(0, 3).map((item, idx) => (
            <motion.div
              key={item.item.id}
              className="testimonial-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
            >
              <div className="testimonial-header">
                <img
                  src={item.item.imageUrl}
                  alt={item.item.author}
                  className="author-image"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
                <div className="author-info">
                  <h4>{item.item.author}</h4>
                  <p>{item.item.role} at {item.item.company}</p>
                </div>
              </div>

              <p className="testimonial-quote">
                "{item.item.quote}"
              </p>

              <div className="relevance-indicator">
                <span className="relevance-score">
                  {Math.round(item.score * 100)}% relevant for you
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * All Personalized Content
 */
export function PersonalizedContentSuite() {
  const { isLoading } = usePersonalization()

  if (isLoading) {
    return <div className="personalization-loading">Loading personalized content...</div>
  }

  return (
    <>
      <PersonalizedSolutions />
      <PersonalizedCaseStudies />
      <PersonalizedTestimonials />
    </>
  )
}

export default PersonalizedContentSuite
