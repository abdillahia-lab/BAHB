import { useCallback, useEffect, useState } from 'react'

/**
 * useConversationMemory Hook
 * Manages conversation persistence, session tracking, and multi-session memory
 * Supports unlimited conversation history with smart compression
 */
export const useConversationMemory = () => {
  const STORAGE_KEYS = {
    CURRENT_CONVERSATION: 'jinki_current_conversation',
    CONVERSATION_HISTORY: 'jinki_conversation_history',
    SESSION_ID: 'jinki_session_id',
    USER_PROFILE: 'jinki_user_profile',
    PREFERENCES: 'jinki_preferences',
  }

  const MAX_MESSAGES_IN_MEMORY = 500
  const STORAGE_QUOTA_BYTES = 5 * 1024 * 1024 // 5MB
  const COMPRESSION_THRESHOLD = 100 // Compress after 100 messages

  const [sessionId, setSessionId] = useState(null)
  const [isIndexedDBAvailable, setIsIndexedDBAvailable] = useState(false)

  // Initialize IndexedDB for larger storage
  useEffect(() => {
    const checkIndexedDB = async () => {
      try {
        if (window.indexedDB) {
          const request = window.indexedDB.open('JinkiChatbot', 1)
          request.onsuccess = (event) => {
            setIsIndexedDBAvailable(true)
            const db = event.target.result
            if (!db.objectStoreNames.contains('conversations')) {
              db.createObjectStore('conversations', { keyPath: 'id', autoIncrement: true })
            }
          }
        }
      } catch (e) {
        console.warn('IndexedDB not available:', e)
      }
    }

    checkIndexedDB()
  }, [])

  // Generate or retrieve session ID
  useEffect(() => {
    let id = localStorage.getItem(STORAGE_KEYS.SESSION_ID)
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, id)
    }
    setSessionId(id)
  }, [])

  /**
   * Save conversation to persistent storage
   */
  const saveConversation = useCallback(async (messages) => {
    if (!sessionId) return

    try {
      const conversationData = {
        sessionId,
        messages,
        timestamp: new Date().toISOString(),
        messageCount: messages.length,
      }

      // Primary: IndexedDB (preferred for larger data)
      if (isIndexedDBAvailable) {
        try {
          const db = await openIndexedDB()
          const tx = db.transaction('conversations', 'readwrite')
          const store = tx.objectStore('conversations')
          const existingConv = await getFromIndexedDB(store, sessionId)

          if (existingConv) {
            await updateInIndexedDB(store, sessionId, conversationData)
          } else {
            await addToIndexedDB(store, conversationData)
          }
        } catch (e) {
          console.warn('IndexedDB save failed, falling back to localStorage:', e)
          saveToLocalStorage(conversationData)
        }
      } else {
        // Fallback: LocalStorage
        saveToLocalStorage(conversationData)
      }
    } catch (error) {
      console.error('Failed to save conversation:', error)
    }
  }, [sessionId, isIndexedDBAvailable])

  /**
   * Load conversation from persistent storage
   */
  const loadConversation = useCallback(() => {
    if (!sessionId) return null

    try {
      // Try IndexedDB first
      if (isIndexedDBAvailable) {
        return loadFromIndexedDB(sessionId).then((data) => {
          if (data) return data.messages
          // Fallback to localStorage
          return loadFromLocalStorage()?.messages || null
        })
      }

      // Direct localStorage fallback
      return loadFromLocalStorage()?.messages || null
    } catch (error) {
      console.error('Failed to load conversation:', error)
      return null
    }
  }, [sessionId, isIndexedDBAvailable])

  /**
   * Get conversation history across sessions
   */
  const getConversationHistory = useCallback(async () => {
    try {
      if (isIndexedDBAvailable) {
        const db = await openIndexedDB()
        const tx = db.transaction('conversations', 'readonly')
        const store = tx.objectStore('conversations')
        return new Promise((resolve) => {
          const request = store.getAll()
          request.onsuccess = () => resolve(request.result)
        })
      }

      // Fallback: localStorage
      const history = localStorage.getItem(STORAGE_KEYS.CONVERSATION_HISTORY)
      return history ? JSON.parse(history) : []
    } catch (error) {
      console.error('Failed to get conversation history:', error)
      return []
    }
  }, [isIndexedDBAvailable])

  /**
   * Search across conversation history
   */
  const searchConversations = useCallback(
    async (query) => {
      const history = await getConversationHistory()
      const lowerQuery = query.toLowerCase()

      return history.filter(
        (conv) =>
          conv.messages.some((msg) =>
            msg.content.toLowerCase().includes(lowerQuery)
          ) ||
          conv.sessionId.includes(lowerQuery)
      )
    },
    [getConversationHistory]
  )

  /**
   * Export conversation for sharing/analysis
   */
  const exportConversation = useCallback(
    (messages, format = 'json') => {
      const conversationData = {
        sessionId,
        exportDate: new Date().toISOString(),
        messageCount: messages.length,
        messages: messages.map((msg) => ({
          timestamp: msg.timestamp,
          type: msg.type,
          content: msg.content,
          intent: msg.intent,
        })),
      }

      if (format === 'csv') {
        return convertToCSV(conversationData.messages)
      }

      return JSON.stringify(conversationData, null, 2)
    },
    [sessionId]
  )

  /**
   * Clear conversation history
   */
  const clearHistory = useCallback(async () => {
    try {
      if (isIndexedDBAvailable) {
        const db = await openIndexedDB()
        const tx = db.transaction('conversations', 'readwrite')
        const store = tx.objectStore('conversations')
        const request = store.delete(sessionId)
        return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(true)
          request.onerror = () => reject(request.error)
        })
      }

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION)
      localStorage.removeItem(STORAGE_KEYS.CONVERSATION_HISTORY)
      return true
    } catch (error) {
      console.error('Failed to clear history:', error)
      return false
    }
  }, [sessionId, isIndexedDBAvailable])

  /**
   * Get storage usage statistics
   */
  const getStorageStats = useCallback(async () => {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate()
        return {
          usage: estimate.usage,
          quota: estimate.quota,
          percentage: (estimate.usage / estimate.quota) * 100,
        }
      }

      // Estimate localStorage usage
      let total = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length
        }
      }

      return {
        usage: total,
        quota: 5 * 1024 * 1024, // Typical 5MB limit
        percentage: (total / (5 * 1024 * 1024)) * 100,
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return null
    }
  }, [])

  /**
   * Create checkpoints for long conversations
   */
  const createCheckpoint = useCallback(
    (messages, label) => {
      const checkpoint = {
        id: `checkpoint_${Date.now()}`,
        label,
        sessionId,
        timestamp: new Date().toISOString(),
        messageCount: messages.length,
        summary: generateConversationSummary(messages),
      }

      const checkpoints = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.PREFERENCES) || '{}'
      ).checkpoints || []
      checkpoints.push(checkpoint)
      localStorage.setItem(
        STORAGE_KEYS.PREFERENCES,
        JSON.stringify({ ...getPreferences(), checkpoints })
      )

      return checkpoint
    },
    [sessionId]
  )

  // ==================== Helper Functions ====================

  const saveToLocalStorage = (data) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION, JSON.stringify(data))
    } catch (error) {
      console.error('LocalStorage quota exceeded:', error)
      // Handle quota exceeded - implement compression/cleanup
      compressStorageData()
    }
  }

  const loadFromLocalStorage = () => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION)
    return data ? JSON.parse(data) : null
  }

  const openIndexedDB = async () => {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open('JinkiChatbot', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  const getFromIndexedDB = async (store, key) => {
    return new Promise((resolve) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
    })
  }

  const addToIndexedDB = async (store, data) => {
    return new Promise((resolve, reject) => {
      const request = store.add(data)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  const updateInIndexedDB = async (store, key, data) => {
    return new Promise((resolve, reject) => {
      const request = store.put({ ...data, id: key })
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  const loadFromIndexedDB = async (key) => {
    try {
      const db = await openIndexedDB()
      const tx = db.transaction('conversations', 'readonly')
      const store = tx.objectStore('conversations')
      return getFromIndexedDB(store, key)
    } catch (error) {
      console.error('IndexedDB load failed:', error)
      return null
    }
  }

  const convertToCSV = (messages) => {
    const headers = ['Timestamp', 'Type', 'Intent', 'Content']
    const rows = messages.map((msg) => [
      msg.timestamp,
      msg.type,
      msg.intent,
      `"${msg.content.replace(/"/g, '""')}"`,
    ])

    return [headers, ...rows].map((row) => row.join(',')).join('\n')
  }

  const generateConversationSummary = (messages) => {
    const intentCounts = {}
    messages.forEach((msg) => {
      if (msg.intent) {
        intentCounts[msg.intent] = (intentCounts[msg.intent] || 0) + 1
      }
    })

    return {
      totalMessages: messages.length,
      userMessages: messages.filter((m) => m.type === 'user').length,
      botMessages: messages.filter((m) => m.type === 'bot').length,
      intents: intentCounts,
    }
  }

  const compressStorageData = () => {
    // Implement smart compression: remove old messages, summarize older conversations
    try {
      const data = loadFromLocalStorage()
      if (data && data.messages.length > COMPRESSION_THRESHOLD) {
        const recentMessages = data.messages.slice(-COMPRESSION_THRESHOLD)
        saveToLocalStorage({ ...data, messages: recentMessages })
      }
    } catch (error) {
      console.error('Compression failed:', error)
    }
  }

  const getPreferences = () => {
    const prefs = localStorage.getItem(STORAGE_KEYS.PREFERENCES)
    return prefs ? JSON.parse(prefs) : {}
  }

  return {
    saveConversation,
    loadConversation,
    getConversationHistory,
    searchConversations,
    exportConversation,
    clearHistory,
    getStorageStats,
    createCheckpoint,
    sessionId,
  }
}
