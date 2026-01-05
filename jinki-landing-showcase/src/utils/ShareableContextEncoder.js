/**
 * TEAM FUSION: Shareable Context Encoder
 * Encodes UI state into shareable URLs and decodes them on receipt
 *
 * Example:
 * Normal URL:    https://jinki-intelligence.com/
 * Context URL:   https://jinki-intelligence.com/?ctx=eyJzY3JvbGw6MTIzNCxzZWN0aW9uOidjYnMifQ
 *
 * This allows enterprise buyers to share specific views with their team
 */

class ShareableContextEncoder {
  /**
   * Encode context object into a compact, URL-safe string
   * Uses base64url encoding for maximum compatibility
   */
  static encodeContext(context) {
    try {
      // Whitelist only essential properties for sharing
      const shareableContext = {
        scroll: context.scrollPosition || 0,
        section: context.activePage || 'home',
        expanded: context.expandedSections || {},
        notes: context.notes ? this.sanitizeNotes(context.notes) : {},
        filters: context.filters || {}
      }

      // Convert to compact JSON
      const json = JSON.stringify(shareableContext)

      // Compress using base64url encoding (URL-safe)
      const encoded = btoa(json)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

      return encoded
    } catch (error) {
      console.error('Failed to encode context:', error)
      return null
    }
  }

  /**
   * Decode context from URL parameter
   */
  static decodeContext(encodedString) {
    try {
      // Restore base64 padding if needed
      let padded = encodedString
      const padding = 4 - (encodedString.length % 4)
      if (padding !== 4) {
        padded = encodedString + '='.repeat(padding)
      }

      // Convert from base64url to base64
      const base64 = padded
        .replace(/-/g, '+')
        .replace(/_/g, '/')

      // Decode
      const json = atob(base64)
      const context = JSON.parse(json)

      return context
    } catch (error) {
      console.error('Failed to decode context:', error)
      return null
    }
  }

  /**
   * Generate shareable link with context
   * @param {string} baseUrl - Base URL (e.g., "https://jinki-intelligence.com/")
   * @param {object} context - Context object to encode
   * @param {object} options - Additional options (e.g., utm_source, utm_medium)
   */
  static generateShareableLink(baseUrl, context, options = {}) {
    const encodedContext = this.encodeContext(context)

    if (!encodedContext) {
      return baseUrl // Fallback to base URL
    }

    const url = new URL(baseUrl)

    // Add context parameter
    url.searchParams.set('ctx', encodedContext)

    // Add optional tracking parameters
    if (options.utm_source) url.searchParams.set('utm_source', options.utm_source)
    if (options.utm_medium) url.searchParams.set('utm_medium', 'shared-context')
    if (options.utm_campaign) url.searchParams.set('utm_campaign', options.utm_campaign)

    // Add metadata
    if (options.sharedBy) url.searchParams.set('shared_by', options.sharedBy)
    if (options.sharedAt) url.searchParams.set('shared_at', options.sharedAt)

    return url.toString()
  }

  /**
   * Extract shareable context from current URL
   */
  static extractContextFromURL() {
    const params = new URLSearchParams(window.location.search)
    const encodedContext = params.get('ctx')

    if (!encodedContext) {
      return null
    }

    return this.decodeContext(encodedContext)
  }

  /**
   * Update URL with new context (for browser history)
   */
  static updateURLWithContext(context) {
    const encodedContext = this.encodeContext(context)

    if (!encodedContext) return

    const url = new URL(window.location)
    url.searchParams.set('ctx', encodedContext)

    // Use replaceState to avoid creating history entries for every scroll
    window.history.replaceState(
      { context },
      '',
      url.toString()
    )
  }

  /**
   * Copy shareable link to clipboard
   */
  static async copyShareableLink(context, message = 'Link copied to clipboard!') {
    try {
      const link = this.generateShareableLink(
        window.location.origin + window.location.pathname,
        context,
        {
          utm_source: 'jinki-app',
          utm_campaign: 'context-share',
          sharedAt: new Date().toISOString()
        }
      )

      await navigator.clipboard.writeText(link)
      return { success: true, link, message }
    } catch (error) {
      console.error('Failed to copy link:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Share via native share API (if available)
   */
  static async shareContext(context, title = 'Check this out on Jinki Intelligence') {
    if (!navigator.share) {
      // Fallback to copy
      return this.copyShareableLink(context)
    }

    try {
      const link = this.generateShareableLink(
        window.location.origin + window.location.pathname,
        context,
        {
          utm_source: 'jinki-app',
          utm_campaign: 'native-share'
        }
      )

      await navigator.share({
        title,
        text: `View my curated content from Jinki Intelligence: ${context.activePage || 'homepage'}`,
        url: link
      })

      return { success: true }
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled share
        return { success: false, cancelled: true }
      }

      console.error('Share failed:', error)
      // Fallback to copy
      return this.copyShareableLink(context)
    }
  }

  /**
   * Sanitize notes to remove sensitive data before sharing
   */
  static sanitizeNotes(notes) {
    const sanitized = {}

    Object.entries(notes).forEach(([key, note]) => {
      // Remove personal/sensitive fields
      sanitized[key] = {
        content: note.content,
        created: note.created,
        // Don't include: device info, IP, personal metadata
      }
    })

    return sanitized
  }

  /**
   * Generate readable share preview
   */
  static getSharePreview(context) {
    const sections = Object.keys(context.expandedSections || {})
      .filter(k => context.expandedSections[k])
      .slice(0, 3)

    const notesCount = Object.keys(context.notes || {}).length

    return {
      page: context.activePage || 'Homepage',
      scrollDepth: context.scrollPosition ? `${Math.round((context.scrollPosition / window.innerHeight) * 100)}%` : 'Top',
      sections: sections.length > 0 ? sections : ['Main content'],
      notes: notesCount > 0 ? `${notesCount} note${notesCount > 1 ? 's' : ''}` : 'No notes',
      summary: `${context.activePage || 'Homepage'} • ${notesCount} notes • ${sections.length} sections`
    }
  }
}

export default ShareableContextEncoder
