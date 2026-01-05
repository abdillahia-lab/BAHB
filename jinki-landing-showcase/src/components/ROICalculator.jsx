/**
 * ═══════════════════════════════════════════════════════════════
 * ROI CALCULATOR - Enterprise Lead Generation Engine
 * ═══════════════════════════════════════════════════════════════
 * Qualified lead capture for CFOs/CTOs
 * Conversion mechanism: Self-qualification + Email capture
 */

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './ROICalculator.css'

const INDUSTRY_MODELS = {
  dataCenter: {
    name: 'Data Centers',
    icon: '🏢',
    methods: [
      { label: 'Manual thermal walk-throughs', costPerInspection: 500, inspectionsPerYear: 12 },
      { label: 'External thermal contractor', costPerInspection: 2500, inspectionsPerYear: 4 },
    ],
    equipment: { label: 'Current monitoring cost/month', default: 500 },
    outageFrequency: { label: 'Outages per year', default: 2, unit: 'events' },
    outageAvgCost: 700000,
    jinkiCostAnnual: 85000,
    benefits: [
      '72-hour early anomaly detection',
      'Reduce outage frequency by 65%',
      'Save $504K/year in prevented downtime'
    ]
  },
  utility: {
    name: 'Electric Utilities',
    icon: '⚡',
    methods: [
      { label: 'Ground crew inspections', costPerInspection: 3000, inspectionsPerYear: 24 },
      { label: 'Helicopter surveys', costPerInspection: 4000, inspectionsPerYear: 4 },
    ],
    equipment: { label: 'Current monitoring cost/month', default: 800 },
    outageFrequency: { label: 'Defects missed per year', default: 12, unit: 'events' },
    outageAvgCost: 45000,
    jinkiCostAnnual: 95000,
    benefits: [
      '60% cost reduction vs helicopter',
      'Find 4.5x more defects',
      'RTK ±1cm accuracy for asset mapping'
    ]
  },
  agriculture: {
    name: 'Precision Agriculture',
    icon: '🌾',
    methods: [
      { label: 'Manual field scouting', costPerInspection: 800, inspectionsPerYear: 12 },
      { label: 'Agricultural consultant', costPerInspection: 2000, inspectionsPerYear: 6 },
    ],
    equipment: { label: 'Current monitoring cost/month', default: 400 },
    outageFrequency: { label: 'Crop loss events per year', default: 1, unit: 'events' },
    outageAvgCost: 150000,
    jinkiCostAnnual: 45000,
    benefits: [
      'Detect crop stress 14 days earlier',
      'NDVI multispectral imaging',
      '150% proven ROI from early intervention'
    ]
  },
  oilGas: {
    name: 'Oil & Gas',
    icon: '⛽',
    methods: [
      { label: 'Monthly manual inspections', costPerInspection: 5000, inspectionsPerYear: 12 },
      { label: 'Third-party inspection service', costPerInspection: 8000, inspectionsPerYear: 4 },
    ],
    equipment: { label: 'EPA compliance monitoring cost/month', default: 2000 },
    outageFrequency: { label: 'Methane incidents per year', default: 2, unit: 'events' },
    outageAvgCost: 500000,
    jinkiCostAnnual: 120000,
    benefits: [
      '99.2% detection rate',
      '14km daily coverage',
      'EPA compliance automation'
    ]
  }
}

export default function ROICalculator({ onClose = null }) {
  const [step, setStep] = useState('industry') // industry -> method -> costs -> results -> email
  const [selectedIndustry, setSelectedIndustry] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [customCosts, setCustomCosts] = useState({})
  const [emailData, setEmailData] = useState({ email: '', company: '', name: '' })
  const [submitted, setSubmitted] = useState(false)

  const currentIndustry = selectedIndustry ? INDUSTRY_MODELS[selectedIndustry] : null

  // Calculate ROI
  const roiData = useMemo(() => {
    if (!currentIndustry || !selectedMethod) return null

    const method = currentIndustry.methods[selectedMethod]
    const currentAnnualInspection = method.costPerInspection * method.inspectionsPerYear
    const currentEquipmentCost = (customCosts[`${selectedIndustry}_equipment`] || currentIndustry.equipment.default) * 12
    const preventedOutages = (customCosts[`${selectedIndustry}_frequency`] || currentIndustry.outageFrequency.default) * 0.65 // 65% reduction
    const preventedDowntimeCost = preventedOutages * currentIndustry.outageAvgCost

    const currentTotalAnnual = currentAnnualInspection + currentEquipmentCost + (currentIndustry.outageFrequency.default * currentIndustry.outageAvgCost)
    const jinkiTotalAnnual = currentIndustry.jinkiCostAnnual

    const annualSavings = (currentAnnualInspection + preventedDowntimeCost) - jinkiTotalAnnual
    const paybackMonths = jinkiTotalAnnual / (annualSavings / 12)
    const roi = ((annualSavings - jinkiTotalAnnual) / jinkiTotalAnnual) * 100

    return {
      currentMethod: method.label,
      currentAnnualInspection,
      currentEquipmentCost,
      currentTotalAnnual,
      jinkiTotalAnnual,
      annualSavings,
      paybackMonths: Math.max(1, paybackMonths),
      roi: Math.max(0, roi),
      preventedDowntimeSavings: preventedDowntimeCost
    }
  }, [selectedIndustry, selectedMethod, customCosts])

  const handleIndustrySelect = (key) => {
    setSelectedIndustry(key)
    setSelectedMethod(null)
    setStep('method')
  }

  const handleMethodSelect = (methodIndex) => {
    setSelectedMethod(methodIndex)
    setStep('review')
  }

  const handleCalculate = () => {
    setStep('results')
  }

  const handleEmailSubmit = () => {
    if (emailData.email && emailData.company && emailData.name) {
      // In production, this would call an API endpoint
      console.log('Lead captured:', { ...emailData, industry: currentIndustry.name, roi: roiData })
      setSubmitted(true)
      // Simulate email delivery
      setTimeout(() => {
        setStep('confirmation')
      }, 800)
    }
  }

  const resetCalculator = () => {
    setStep('industry')
    setSelectedIndustry(null)
    setSelectedMethod(null)
    setCustomCosts({})
    setEmailData({ email: '', company: '', name: '' })
    setSubmitted(false)
  }

  return (
    <div className="roi-calculator">
      <AnimatePresence mode="wait">
        {/* STEP 1: INDUSTRY SELECTION */}
        {step === 'industry' && (
          <motion.div
            key="industry"
            className="roi-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="roi-header">
              <h2>See Your ROI</h2>
              <p>Which industry matches your operation?</p>
            </div>

            <div className="roi-grid">
              {Object.entries(INDUSTRY_MODELS).map(([key, industry]) => (
                <motion.button
                  key={key}
                  className="roi-card"
                  onClick={() => handleIndustrySelect(key)}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="roi-card__icon">{industry.icon}</span>
                  <span className="roi-card__name">{industry.name}</span>
                  <span className="roi-card__arrow">→</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 2: METHOD SELECTION */}
        {step === 'method' && currentIndustry && (
          <motion.div
            key="method"
            className="roi-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="roi-header">
              <button className="roi-back" onClick={() => setStep('industry')}>← Back</button>
              <h2>{currentIndustry.name}</h2>
              <p>What's your current inspection method?</p>
            </div>

            <div className="roi-methods">
              {currentIndustry.methods.map((method, idx) => (
                <motion.button
                  key={idx}
                  className="roi-method"
                  onClick={() => handleMethodSelect(idx)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="roi-method__label">{method.label}</span>
                  <span className="roi-method__cost">
                    ${method.costPerInspection.toLocaleString()}/inspection × {method.inspectionsPerYear}/yr
                  </span>
                  <span className="roi-method__annual">
                    ≈ ${(method.costPerInspection * method.inspectionsPerYear).toLocaleString()}/year
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 3: REVIEW & CONFIRM */}
        {step === 'review' && currentIndustry && selectedMethod !== null && (
          <motion.div
            key="review"
            className="roi-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="roi-header">
              <button className="roi-back" onClick={() => setStep('method')}>← Back</button>
              <h2>Confirming Details</h2>
              <p>These numbers will be used for your ROI calculation</p>
            </div>

            <div className="roi-summary">
              <div className="roi-summary__item">
                <span className="roi-summary__label">Industry</span>
                <span className="roi-summary__value">{currentIndustry.name}</span>
              </div>
              <div className="roi-summary__item">
                <span className="roi-summary__label">Current Method</span>
                <span className="roi-summary__value">{currentIndustry.methods[selectedMethod].label}</span>
              </div>
              <div className="roi-summary__item">
                <span className="roi-summary__label">Est. Annual Cost</span>
                <span className="roi-summary__value">
                  ${(currentIndustry.methods[selectedMethod].costPerInspection * currentIndustry.methods[selectedMethod].inspectionsPerYear).toLocaleString()}
                </span>
              </div>
            </div>

            <motion.button
              className="btn btn--primary roi-cta"
              onClick={handleCalculate}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Calculate ROI
            </motion.button>
          </motion.div>
        )}

        {/* STEP 4: RESULTS (Before Email) */}
        {step === 'results' && roiData && (
          <motion.div
            key="results"
            className="roi-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="roi-header">
              <h2>Your ROI Analysis</h2>
              <p className="roi-subtitle">{currentIndustry.name} with {currentIndustry.methods[selectedMethod].label}</p>
            </div>

            {/* Key Metrics */}
            <div className="roi-metrics">
              <motion.div
                className="roi-metric roi-metric--primary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span className="roi-metric__label">Annual Savings</span>
                <span className="roi-metric__value">${roiData.annualSavings.toLocaleString()}</span>
              </motion.div>

              <motion.div
                className="roi-metric"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="roi-metric__label">Year 1 ROI</span>
                <span className="roi-metric__value">{roiData.roi.toFixed(0)}%</span>
              </motion.div>

              <motion.div
                className="roi-metric"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="roi-metric__label">Payback Period</span>
                <span className="roi-metric__value">{roiData.paybackMonths.toFixed(1)} months</span>
              </motion.div>
            </div>

            {/* Breakdown */}
            <div className="roi-breakdown">
              <h3>Cost Comparison</h3>
              <div className="roi-breakdown__row">
                <span>Current annual cost:</span>
                <span className="roi-breakdown__current">${roiData.currentTotalAnnual.toLocaleString()}</span>
              </div>
              <div className="roi-breakdown__row">
                <span>Jinki annual cost:</span>
                <span>${roiData.jinkiTotalAnnual.toLocaleString()}</span>
              </div>
              <div className="roi-breakdown__row roi-breakdown__total">
                <span>Net annual benefit:</span>
                <span className="roi-breakdown__savings">${roiData.annualSavings.toLocaleString()}</span>
              </div>
            </div>

            {/* Benefits List */}
            <div className="roi-benefits">
              <h3>Additional Benefits</h3>
              <ul>
                {currentIndustry.benefits.map((benefit, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                  >
                    <span className="roi-benefit-check">✓</span>
                    {benefit}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* CTA: Get Report */}
            <motion.button
              className="btn btn--primary roi-cta"
              onClick={() => setStep('email')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Get Your Report
            </motion.button>
          </motion.div>
        )}

        {/* STEP 5: EMAIL CAPTURE */}
        {step === 'email' && roiData && (
          <motion.div
            key="email"
            className="roi-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="roi-header">
              <h2>Get Your ROI Report</h2>
              <p>We'll email your detailed analysis + implementation roadmap</p>
            </div>

            <form className="roi-form" onSubmit={(e) => { e.preventDefault(); handleEmailSubmit(); }}>
              <div className="roi-form__group">
                <label htmlFor="name">Full Name*</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={emailData.name}
                  onChange={(e) => setEmailData({ ...emailData, name: e.target.value })}
                  required
                />
              </div>

              <div className="roi-form__group">
                <label htmlFor="company">Company Name*</label>
                <input
                  id="company"
                  type="text"
                  placeholder="Your company"
                  value={emailData.company}
                  onChange={(e) => setEmailData({ ...emailData, company: e.target.value })}
                  required
                />
              </div>

              <div className="roi-form__group">
                <label htmlFor="email">Work Email*</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={emailData.email}
                  onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                  required
                />
              </div>

              <motion.button
                type="submit"
                className="btn btn--primary roi-cta"
                disabled={submitted}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {submitted ? 'Sending...' : 'Send My Report'}
              </motion.button>
            </form>

            <p className="roi-form__disclaimer">
              We'll send a PDF report to your email. Unsubscribe anytime.
            </p>
          </motion.div>
        )}

        {/* STEP 6: CONFIRMATION */}
        {step === 'confirmation' && (
          <motion.div
            key="confirmation"
            className="roi-step roi-step--success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="roi-success">
              <motion.div
                className="roi-success__icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                ✓
              </motion.div>
              <h2>Report Sent!</h2>
              <p>Check {emailData.email} for your detailed ROI analysis</p>
              <p className="roi-success__subtitle">
                A sales consultant will reach out within 24 hours to discuss implementation.
              </p>

              <motion.button
                className="btn btn--ghost"
                onClick={resetCalculator}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Calculate Another Industry
              </motion.button>

              {onClose && (
                <button className="roi-close" onClick={onClose}>×</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close button (visible during results) */}
      {step === 'results' && onClose && (
        <button className="roi-close" onClick={onClose}>×</button>
      )}
    </div>
  )
}
