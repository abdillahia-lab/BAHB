/**
 * TEAM FUSION: useDeviceContextSync Hook
 * React hook for accessing and updating cross-device context sync
 *
 * Usage in components:
 * const { context, updateContext, scrollPosition, notes } = useDeviceContextSync()
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { contextService } from '../services/CrossDeviceContextService'

export function useDeviceContextSync() {
  const [context, setContext] = useState(contextService.getContext())
  const [syncStatus, setSyncStatus] = useState(contextService.getSyncStatus())
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const unsubscribeRef = useRef(null)

  // Subscribe to context changes
  useEffect(() => {
    const handleContextChange = (event, data) => {
      if (event === 'contextUpdated' || event === 'contextRestored') {
        setContext(data)
        setLastUpdate(Date.now())
      }
    }

    unsubscribeRef.current = contextService.onChange(handleContextChange)

    // Initial context load
    setContext(contextService.getContext())

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  // Update sync status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(contextService.getSyncStatus())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Update context helper
  const updateContext = useCallback((updates) => {
    contextService.updateContext(updates)
  }, [])

  // Toggle expanded section
  const toggleSection = useCallback((sectionId) => {
    contextService.toggleExpandedSection(sectionId)
  }, [])

  // Track scroll
  const updateScroll = useCallback((position) => {
    contextService.updateScrollPosition(position)
  }, [])

  // Update page
  const setActivePage = useCallback((pageName) => {
    contextService.updateActivePage(pageName)
  }, [])

  // Add note
  const addNote = useCallback((noteId, content, metadata) => {
    contextService.addNote(noteId, content, metadata)
  }, [])

  // Get formatted sync time
  const getSyncTimeDisplay = useCallback(() => {
    if (!syncStatus.lastSyncTime) return 'Never'

    const seconds = Math.floor((Date.now() - syncStatus.lastSyncTime) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }, [syncStatus.lastSyncTime])

  return {
    // State
    context,
    syncStatus,
    lastUpdate,

    // Utilities
    updateContext,
    toggleSection,
    updateScroll,
    setActivePage,
    addNote,

    // Derived
    scrollPosition: context.scrollPosition || 0,
    activePage: context.activePage || 'home',
    expandedSections: context.expandedSections || {},
    notes: context.notes || {},

    // UI helpers
    isSynced: syncStatus.lastSyncTime && (Date.now() - syncStatus.lastSyncTime) < 5000,
    isOnline: syncStatus.isOnline,
    syncTimeDisplay: getSyncTimeDisplay(),
    deviceType: syncStatus.deviceType,

    // Sync controls
    requestSync: contextService.requestSync.bind(contextService),
    clearContext: contextService.clearContext.bind(contextService)
  }
}

export default useDeviceContextSync
