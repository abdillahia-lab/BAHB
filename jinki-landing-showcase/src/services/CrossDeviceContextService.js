/**
 * TEAM FUSION: Cross-Device Context Service
 * Synchronizes user context (scroll position, expanded sections, UI state) across devices and browser tabs
 * Uses IndexedDB for offline persistence + Broadcast Channel API for cross-tab communication
 *
 * Enterprise use case: Sales manager researches on desktop, shows phone to team, seamlessly continues
 */

const STORAGE_KEYS = {
  CONTEXT_STATE: 'jinki_context_state',
  DEVICE_ID: 'jinki_device_id',
  SYNC_TIMESTAMP: 'jinki_sync_timestamp',
  SYNC_HISTORY: 'jinki_sync_history'
}

const DB_NAME = 'JinkiContextDB'
const DB_VERSION = 1
const STORE_NAME = 'contextState'

class CrossDeviceContextService {
  constructor() {
    this.db = null
    this.broadcastChannel = null
    this.contextState = {}
    this.listeners = new Set()
    this.isSyncing = false
    this.lastSyncTime = 0
    this.deviceId = this.getOrCreateDeviceId()
    this.offlineMode = false

    this.initialize()
  }

  /**
   * Initialize service: setup IndexedDB, Broadcast Channel, and listeners
   */
  async initialize() {
    try {
      await this.initializeIndexedDB()
      this.initializeBroadcastChannel()
      await this.restoreContext()
      this.setupSyncInterval()
    } catch (error) {
      console.error('Failed to initialize CrossDeviceContextService:', error)
      this.offlineMode = true
    }
  }

  /**
   * Setup IndexedDB for offline-safe storage
   */
  initializeIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('IndexedDB failed to open')
        this.offlineMode = true
        reject(request.error)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB initialized for context sync')
        resolve()
      }
    })
  }

  /**
   * Setup Broadcast Channel for cross-tab communication
   */
  initializeBroadcastChannel() {
    try {
      this.broadcastChannel = new BroadcastChannel('jinki-context-sync')
      this.broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data

        if (type === 'CONTEXT_UPDATED') {
          this.contextState = payload
          this.notifyListeners('contextUpdated', payload)
        } else if (type === 'DEVICE_SYNC_REQUEST') {
          this.broadcastContext()
        } else if (type === 'SYNC_COMPLETE') {
          this.lastSyncTime = Date.now()
          this.notifyListeners('syncComplete', payload)
        }
      }
      console.log('Broadcast Channel initialized for cross-tab sync')
    } catch (error) {
      console.warn('Broadcast Channel not supported:', error)
    }
  }

  /**
   * Get or create a unique device ID
   * Used to distinguish between user's own devices vs. other users
   */
  getOrCreateDeviceId() {
    let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID)

    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId)
    }

    return deviceId
  }

  /**
   * Identify device type (desktop, tablet, mobile)
   */
  getDeviceType() {
    const width = window.innerWidth
    const ua = navigator.userAgent.toLowerCase()

    if (ua.includes('ipad') || (width >= 768 && width < 1024)) return 'tablet'
    if (width < 768) return 'mobile'
    return 'desktop'
  }

  /**
   * Update context with new state
   * Automatically persists to IndexedDB and broadcasts to other tabs
   */
  updateContext(updates) {
    this.contextState = {
      ...this.contextState,
      ...updates,
      lastUpdated: Date.now(),
      deviceId: this.deviceId,
      deviceType: this.getDeviceType()
    }

    // Persist to IndexedDB
    this.saveToIndexedDB(this.contextState)

    // Persist to localStorage (for immediate cross-tab access)
    localStorage.setItem(STORAGE_KEYS.CONTEXT_STATE, JSON.stringify(this.contextState))

    // Broadcast to other tabs
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'CONTEXT_UPDATED',
        payload: this.contextState
      })
    }

    // Notify listeners
    this.notifyListeners('contextUpdated', this.contextState)
  }

  /**
   * Save context to IndexedDB (offline storage)
   */
  saveToIndexedDB(state) {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const request = store.put({
        id: 'current',
        state,
        timestamp: Date.now()
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Restore context from IndexedDB on page load
   */
  async restoreContext() {
    // Try localStorage first (fastest)
    const stored = localStorage.getItem(STORAGE_KEYS.CONTEXT_STATE)
    if (stored) {
      try {
        this.contextState = JSON.parse(stored)
        this.notifyListeners('contextRestored', this.contextState)
        return
      } catch (error) {
        console.error('Failed to parse stored context:', error)
      }
    }

    // Fallback to IndexedDB
    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get('current')

        request.onsuccess = () => {
          if (request.result) {
            this.contextState = request.result.state
            this.notifyListeners('contextRestored', this.contextState)
          }
          resolve()
        }

        request.onerror = () => {
          console.error('Failed to restore from IndexedDB')
          resolve()
        }
      })
    }
  }

  /**
   * Broadcast current context to other tabs
   */
  broadcastContext() {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'CONTEXT_UPDATED',
        payload: this.contextState
      })
    }
  }

  /**
   * Request sync from other tabs (in case context changed)
   */
  requestSync() {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'DEVICE_SYNC_REQUEST'
      })
    }
  }

  /**
   * Get current context state
   */
  getContext() {
    return { ...this.contextState }
  }

  /**
   * Track specific UI elements (e.g., expanded sections)
   */
  toggleExpandedSection(sectionId) {
    const expandedSections = this.contextState.expandedSections || {}
    expandedSections[sectionId] = !expandedSections[sectionId]

    this.updateContext({
      expandedSections
    })
  }

  /**
   * Track scroll position
   */
  updateScrollPosition(position) {
    this.updateContext({
      scrollPosition: position
    })
  }

  /**
   * Track active tab/page
   */
  updateActivePage(pageName) {
    this.updateContext({
      activePage: pageName,
      pageViewTime: Date.now()
    })
  }

  /**
   * Add user notes/annotations that persist across devices
   */
  addNote(noteId, content, metadata = {}) {
    const notes = this.contextState.notes || {}
    notes[noteId] = {
      content,
      created: Date.now(),
      ...metadata
    }

    this.updateContext({ notes })
  }

  /**
   * Get all notes
   */
  getNotes() {
    return this.contextState.notes || {}
  }

  /**
   * Setup periodic sync check (every 30 seconds)
   * Ensures context stays fresh across devices
   */
  setupSyncInterval() {
    setInterval(() => {
      const timeSinceLastSync = Date.now() - this.lastSyncTime

      // If 30+ seconds since last sync, request from other tabs
      if (timeSinceLastSync > 30000) {
        this.requestSync()
      }
    }, 30000)
  }

  /**
   * Register listener for context changes
   */
  onChange(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data)
      } catch (error) {
        console.error('Listener error:', error)
      }
    })
  }

  /**
   * Clear all context data (for privacy/logout)
   */
  async clearContext() {
    this.contextState = {}
    localStorage.removeItem(STORAGE_KEYS.CONTEXT_STATE)

    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.clear()

        request.onsuccess = () => {
          this.notifyListeners('contextCleared', {})
          resolve()
        }
      })
    }
  }

  /**
   * Get sync status for UI indicators
   */
  getSyncStatus() {
    return {
      isOnline: navigator.onLine,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      deviceId: this.deviceId,
      deviceType: this.getDeviceType(),
      isOfflineMode: this.offlineMode
    }
  }

  /**
   * Export context as JSON (for debugging/support)
   */
  exportContext() {
    return {
      context: this.contextState,
      syncStatus: this.getSyncStatus(),
      timestamp: Date.now()
    }
  }
}

// Create singleton instance
export const contextService = new CrossDeviceContextService()

export default CrossDeviceContextService
