/**
 * MICROFEEDBACK - INTERACTIVE SHOWCASE
 * Demonstration of all micro-interaction components
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MicroButton,
  MicroCard,
  MicroInput,
  MicroNavItem,
  MicroSkeleton,
  MicroSpinner,
  MicroToast,
  MicroHoverReveal,
  MicroFormFeedback,
  MicroDropdown,
} from './MicroInteractionComponents'
import { TIMING, springs } from '../utils/microInteractions'

/**
 * Full showcase of all micro-interaction components
 */
export function MicroInteractionsShowcase() {
  const [activeSection, setActiveSection] = useState('buttons')
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [submitState, setSubmitState] = useState('idle')
  const [toast, setToast] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const sections = [
    { id: 'buttons', label: 'Buttons' },
    { id: 'cards', label: 'Cards' },
    { id: 'inputs', label: 'Inputs' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'loading', label: 'Loading' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'reveals', label: 'Hover Reveals' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitState('loading')

    await new Promise(r => setTimeout(r, 2000))

    setSubmitState('success')
    setToast({
      message: 'Form submitted successfully!',
      type: 'success',
    })

    setTimeout(() => setSubmitState('idle'), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      {/* Header */}
      <motion.div
        className="max-w-6xl mx-auto mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-white mb-2">
          MICROFEEDBACK
        </h1>
        <p className="text-gray-400">
          Exceptional micro-interactions for Jinki Intelligence
        </p>
      </motion.div>

      {/* Navigation */}
      <div className="max-w-6xl mx-auto mb-8">
        <motion.div
          className="flex gap-2 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {sections.map((section, i) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * TIMING.STAGGER_MINI }}
            >
              <MicroNavItem
                active={activeSection === section.id}
                onClick={() => setActiveSection(section.id)}
                className="text-white"
              >
                {section.label}
              </MicroNavItem>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Content Sections */}
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {/* BUTTONS SECTION */}
          {activeSection === 'buttons' && (
            <motion.div
              key="buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: TIMING.QUICK }}
              className="space-y-8"
            >
              <div className="bg-gray-800 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Button Variants</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <MicroButton variant="primary">Primary</MicroButton>
                  </div>
                  <div>
                    <MicroButton variant="secondary">Secondary</MicroButton>
                  </div>
                  <div>
                    <MicroButton variant="ghost">Ghost</MicroButton>
                  </div>
                  <div>
                    <MicroButton variant="glow">Glow</MicroButton>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mt-8 mb-4">Button Sizes</h3>
                <div className="flex gap-4">
                  <MicroButton size="sm">Small</MicroButton>
                  <MicroButton size="md">Medium</MicroButton>
                  <MicroButton size="lg">Large</MicroButton>
                </div>

                <h3 className="text-lg font-semibold text-white mt-8 mb-4">Interactive Demo</h3>
                <MicroButton
                  variant="glow"
                  onClick={() =>
                    setToast({
                      message: 'Button clicked! Great interaction!',
                      type: 'success',
                    })
                  }
                >
                  Click for Toast
                </MicroButton>
              </div>
            </motion.div>
          )}

          {/* CARDS SECTION */}
          {activeSection === 'cards' && (
            <motion.div
              key="cards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-gray-800 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Card Hover Effects</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <MicroCard
                      key={i}
                      title={`Card ${i}`}
                      description="Hover to see the lift and shadow effects"
                      image={`https://images.unsplash.com/photo-${1500000000000 + i}?w=400&h=300&fit=crop`}
                    >
                      <p className="text-sm text-gray-600">
                        This card includes image zoom and content slide animations.
                      </p>
                    </MicroCard>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* INPUTS SECTION */}
          {activeSection === 'inputs' && (
            <motion.div
              key="inputs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-gray-800 rounded-lg p-8 max-w-md">
                <h2 className="text-2xl font-bold text-white mb-6">Form Fields</h2>

                <form onSubmit={handleSubmit}>
                  <MicroInput
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    success={formData.name.length > 0}
                  />

                  <MicroInput
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    error={
                      formData.email &&
                      !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
                        ? 'Invalid email format'
                        : ''
                    }
                    success={
                      formData.email &&
                      formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
                    }
                  />

                  <MicroInput
                    label="Message"
                    value={formData.message || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    maxLength={100}
                    showCounter={true}
                  />

                  <MicroButton
                    type="submit"
                    variant="glow"
                    className="w-full"
                    disabled={submitState === 'loading'}
                  >
                    {submitState === 'loading' ? 'Submitting...' : 'Submit'}
                  </MicroButton>

                  <MicroFormFeedback
                    state={
                      submitState === 'success'
                        ? 'success'
                        : submitState === 'error'
                          ? 'error'
                          : 'idle'
                    }
                    message={
                      submitState === 'success' ? 'Form submitted!' : ''
                    }
                  />
                </form>
              </div>
            </motion.div>
          )}

          {/* NAVIGATION SECTION */}
          {activeSection === 'navigation' && (
            <motion.div
              key="navigation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-gray-800 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Navigation Items
                </h2>

                <div className="flex gap-2 flex-wrap mb-8">
                  {['Home', 'About', 'Services', 'Contact'].map((item) => (
                    <MicroNavItem
                      key={item}
                      active={false}
                      className="text-white"
                    >
                      {item}
                    </MicroNavItem>
                  ))}
                </div>

                <h3 className="text-lg font-semibold text-white mb-4">
                  Dropdown Menu
                </h3>
                <MicroDropdown
                  isOpen={dropdownOpen}
                  items={[
                    { label: 'Profile', value: 'profile' },
                    { label: 'Settings', value: 'settings' },
                    { label: 'Logout', value: 'logout' },
                  ]}
                  onSelect={(item) => {
                    console.log('Selected:', item)
                    setDropdownOpen(false)
                  }}
                  label="Account"
                />
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="micro-nav-item text-white mt-2"
                >
                  {dropdownOpen ? 'Close Menu' : 'Open Menu'}
                </button>
              </div>
            </motion.div>
          )}

          {/* LOADING SECTION */}
          {activeSection === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-gray-800 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Loading States
                </h2>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Spinner
                    </h3>
                    <div className="flex gap-4">
                      <MicroSpinner size="sm" />
                      <MicroSpinner size="md" />
                      <MicroSpinner size="lg" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Skeleton Loader
                    </h3>
                    {isLoading ? (
                      <MicroSkeleton count={3} height="20px" />
                    ) : (
                      <p className="text-gray-300">
                        Click button to show skeleton
                      </p>
                    )}
                    <MicroButton
                      onClick={() => {
                        setIsLoading(true)
                        setTimeout(() => setIsLoading(false), 3000)
                      }}
                      className="mt-4"
                    >
                      Simulate Loading
                    </MicroButton>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* FEEDBACK SECTION */}
          {activeSection === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-gray-800 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Feedback Messages
                </h2>

                <div className="space-y-4">
                  <MicroButton
                    variant="glow"
                    onClick={() =>
                      setToast({
                        message: 'Success! Operation completed.',
                        type: 'success',
                      })
                    }
                  >
                    Show Success Toast
                  </MicroButton>

                  <MicroButton
                    onClick={() =>
                      setToast({
                        message: 'Error! Something went wrong.',
                        type: 'error',
                      })
                    }
                  >
                    Show Error Toast
                  </MicroButton>

                  <MicroButton
                    onClick={() =>
                      setToast({
                        message: 'Warning! Please review.',
                        type: 'warning',
                      })
                    }
                  >
                    Show Warning Toast
                  </MicroButton>

                  <MicroButton
                    onClick={() =>
                      setToast({
                        message: 'Info: Feature is now available.',
                        type: 'info',
                      })
                    }
                  >
                    Show Info Toast
                  </MicroButton>
                </div>
              </div>
            </motion.div>
          )}

          {/* HOVER REVEALS SECTION */}
          {activeSection === 'reveals' && (
            <motion.div
              key="reveals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-gray-800 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Progressive Hover Reveals
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <MicroHoverReveal
                    stage1Content={
                      <div className="p-4 bg-blue-500 rounded text-white">
                        Stage 1: Hover Me
                      </div>
                    }
                    stage2Content={
                      <div className="p-4 bg-blue-600 rounded text-white">
                        Stage 2: More Info Revealed
                      </div>
                    }
                    stage3Content={
                      <div className="p-4 bg-blue-700 rounded text-white">
                        Stage 3: Full Details Displayed
                      </div>
                    }
                  />

                  <MicroHoverReveal
                    stage1Content={
                      <div className="text-gray-300">Hover for details</div>
                    }
                    stage2Content={
                      <div className="text-white font-semibold">
                        Product Information
                      </div>
                    }
                    stage3Content={
                      <div className="text-green-400">
                        Click to add to cart
                      </div>
                    }
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast Container */}
      <div className="fixed bottom-8 right-8 z-50">
        <AnimatePresence>
          {toast && (
            <MicroToast
              message={toast.message}
              type={toast.type}
              duration={5000}
              onClose={() => setToast(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default MicroInteractionsShowcase
