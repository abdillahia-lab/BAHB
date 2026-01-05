/**
 * ROI Modal Wrapper - Handles modal presentation and state
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ROICalculator from './ROICalculator'
import './ROIModal.css'

export default function ROIModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="roi-modal__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.2 }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            className="roi-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <ROICalculator onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
