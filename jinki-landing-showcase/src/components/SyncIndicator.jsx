/**
 * TEAM FUSION: Sync Indicator Component
 * Visual feedback showing sync status and device awareness
 *
 * Shows:
 * - Sync status (synced, syncing, offline)
 * - Last sync time
 * - Device type (desktop, mobile, tablet)
 * - Active collaborators/devices
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import useDeviceContextSync from '../hooks/useDeviceContextSync'
import './SyncIndicator.css'

export function SyncIndicator({ compact = false, position = 'top-right' }) {
  const { syncStatus, syncTimeDisplay, isSynced, isOnline, deviceType } = useDeviceContextSync()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  // Show notification when sync completes
  useEffect(() => {
    if (isSynced && !showNotification) {
      setShowNotification(true)
      const timeout = setTimeout(() => setShowNotification(false), 3000)
      return () => clearTimeout(timeout)
    }
  }, [isSynced])

  const getStatusColor = () => {
    if (!isOnline) return '#ef4444' // red
    if (isSynced) return '#10b981' // green
    if (syncStatus.isSyncing) return '#f59e0b' // amber
    return '#6b7280' // gray
  }

  const getStatusText = () => {
    if (!isOnline) return 'Offline'
    if (syncStatus.isSyncing) return 'Syncing...'
    if (isSynced) return 'Synced'
    return `Last sync ${syncTimeDisplay}`
  }

  const getDeviceEmoji = () => {
    switch (deviceType) {
      case 'mobile':
        return '📱'
      case 'tablet':
        return '📱'
      case 'desktop':
      default:
        return '💻'
    }
  }

  if (compact) {
    return (
      <div className={`sync-indicator-compact sync-indicator-${position}`}>
        <motion.div
          className="sync-dot"
          animate={{
            opacity: isSynced ? 1 : 0.6,
            scale: syncStatus.isSyncing ? [1, 1.1, 1] : 1
          }}
          transition={{
            duration: syncStatus.isSyncing ? 0.8 : 0,
            repeat: syncStatus.isSyncing ? Infinity : 0
          }}
          style={{ backgroundColor: getStatusColor() }}
          title={getStatusText()}
        />
      </div>
    )
  }

  return (
    <motion.div
      className={`sync-indicator-container sync-indicator-${position}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <motion.button
        className="sync-indicator-button"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="sync-status">
          <motion.span
            className="sync-icon"
            animate={{
              opacity: syncStatus.isSyncing ? [1, 0.5, 1] : 1,
              rotate: syncStatus.isSyncing ? [0, 180, 360] : 0
            }}
            transition={{
              duration: syncStatus.isSyncing ? 1 : 0,
              repeat: syncStatus.isSyncing ? Infinity : 0
            }}
            style={{
              color: getStatusColor(),
              fontSize: '16px'
            }}
          >
            {!isOnline ? '⚡' : syncStatus.isSyncing ? '🔄' : '✓'}
          </motion.span>

          <span className="sync-text">
            {getStatusText()}
          </span>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} />
          </motion.div>
        </div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="sync-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="sync-info">
              <div className="info-row">
                <span className="label">Status:</span>
                <span className="value">
                  <span
                    className="status-dot"
                    style={{ backgroundColor: getStatusColor() }}
                  />
                  {getStatusText()}
                </span>
              </div>

              <div className="info-row">
                <span className="label">Device:</span>
                <span className="value">
                  {getDeviceEmoji()} {deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}
                </span>
              </div>

              <div className="info-row">
                <span className="label">Last Sync:</span>
                <span className="value">{syncTimeDisplay}</span>
              </div>

              {!isOnline && (
                <div className="info-row warning">
                  <span>⚠️ Currently offline - using cached data</span>
                </div>
              )}
            </div>

            <div className="sync-actions">
              <motion.button
                className="action-button"
                onClick={() => {
                  setIsExpanded(false)
                }}
                whileHover={{ backgroundColor: '#f3f4f6' }}
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNotification && (
          <motion.div
            className="sync-notification"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            ✓ Synced across devices
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default SyncIndicator
