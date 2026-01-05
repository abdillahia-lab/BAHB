/**
 * useVoiceSearch - Voice-Enabled Search Hook
 *
 * Handles:
 * - Voice-to-text search queries
 * - Real-time search results
 * - Search history
 * - Voice feedback for searches
 * - Multi-language search
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useVoiceCommand } from './useVoiceCommand'
import { useTextToSpeech } from './useTextToSpeech'

export function useVoiceSearch(options = {}) {
  const {
    enabled = true,
    language = 'en-US',
    onSearch = null,
    searchableContent = [],
    maxHistoryItems = 10,
  } = options

  const voiceCommand = useVoiceCommand({
    enabled,
    language,
    wakeWord: 'search for',
    onCommand: handleVoiceCommand,
  })

  const tts = useTextToSpeech({
    enabled,
    language,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('voice-search-history')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [isSearching, setIsSearching] = useState(false)
  const searchHistoryRef = useRef(searchHistory)

  // Handle voice command for search
  function handleVoiceCommand(command) {
    if (command.command === 'search' || command.transcript) {
      const query = command.transcript.replace(/search for\s*/i, '').trim()
      performSearch(query)
    }
  }

  // Perform search
  const performSearch = useCallback(
    (query) => {
      if (!query.trim()) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      setSearchQuery(query)

      // Add to history
      const newHistory = [query, ...searchHistoryRef.current]
        .filter((item, index, self) => self.indexOf(item) === index)
        .slice(0, maxHistoryItems)

      searchHistoryRef.current = newHistory
      setSearchHistory(newHistory)

      try {
        localStorage.setItem('voice-search-history', JSON.stringify(newHistory))
      } catch (e) {
        console.warn('Could not save search history:', e)
      }

      // Search through content
      const results = searchContent(query, searchableContent)
      setSearchResults(results)

      // Provide voice feedback
      if (tts.isSupported) {
        const resultCount = results.length
        const message =
          resultCount > 0
            ? `Found ${resultCount} result${resultCount !== 1 ? 's' : ''} for ${query}`
            : `No results found for ${query}`

        tts.announce(message, 'normal')
      }

      if (onSearch) {
        onSearch({
          query,
          results,
          resultCount: results.length,
        })
      }

      setIsSearching(false)
    },
    [searchableContent, onSearch, tts, maxHistoryItems]
  )

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
  }, [])

  // Clear history
  const clearHistory = useCallback(() => {
    setSearchHistory([])
    searchHistoryRef.current = []
    localStorage.removeItem('voice-search-history')
  }, [])

  // Perform text search
  function searchContent(query, content) {
    const lowerQuery = query.toLowerCase()

    return content
      .map((item) => {
        const titleMatch = item.title?.toLowerCase().includes(lowerQuery) ? 10 : 0
        const descriptionMatch = item.description?.toLowerCase().includes(lowerQuery) ? 5 : 0
        const contentMatch = item.content?.toLowerCase().includes(lowerQuery) ? 3 : 0

        const score = titleMatch + descriptionMatch + contentMatch

        return {
          ...item,
          score,
          relevance: score > 0 ? score : 0,
        }
      })
      .filter((item) => item.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
  }

  return {
    // State
    searchQuery,
    searchResults,
    searchHistory,
    isSearching,
    isListening: voiceCommand.isListening,

    // Controls
    performSearch,
    clearSearch,
    clearHistory,
    startVoiceSearch: voiceCommand.startListening,
    stopVoiceSearch: voiceCommand.stopListening,
  }
}

export default useVoiceSearch
