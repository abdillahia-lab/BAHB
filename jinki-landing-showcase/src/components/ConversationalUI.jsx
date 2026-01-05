/**
 * ═══════════════════════════════════════════════════════════════
 * CONVERSATIONAL UI COMPONENT
 * ═══════════════════════════════════════════════════════════════
 * Natural language interface with multi-turn conversation handling
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { processNLQuery } from '../utils/nlpPipeline'
import { generateResponse } from '../utils/responseGenerator'
import './ConversationalUI.css'

export default function ConversationalUI({ onNavigate = null }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'bot',
      text: 'Hello! I\'m CONVERSATIONAL UI for Jinki Intelligence. Ask me anything about our enterprise drone and cybersecurity solutions.\n\n💡 Try: "Show me thermal cameras" or "Take me to pricing"',
      timestamp: new Date(),
      sentiment: 'positive',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationContext, setConversationContext] = useState({
    industryFocus: null,
    featureFocus: null,
    sentiment: 'neutral',
  })
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // ─────────────────────────────────────────────────────────────
  // AUTO-SCROLL TO LATEST MESSAGE
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─────────────────────────────────────────────────────────────
  // FOCUS INPUT WHEN OPENED
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // ─────────────────────────────────────────────────────────────
  // PROCESS USER MESSAGE
  // ─────────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return

    // Add user message to conversation
    const userMsg = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: userMessage,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      // Process natural language
      const nlpResult = processNLQuery(userMessage, conversationContext)

      // Update context with new information
      if (nlpResult.entities.length > 0) {
        setConversationContext(prev => ({
          ...prev,
          lastEntities: nlpResult.entities,
          sentiment: nlpResult.sentiment,
        }))
      }

      // Generate response
      const botResponse = generateResponse(nlpResult, messages)

      // Simulate processing delay for natural feel
      await new Promise(resolve => setTimeout(resolve, 500))

      // Handle navigation actions
      if (botResponse.intent === 'navigate' && onNavigate) {
        onNavigate(nlpResult.navigation?.route)
      }

      // Add bot message
      const botMsg = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        text: botResponse.text,
        timestamp: new Date(),
        intent: botResponse.intent,
        sentiment: botResponse.sentiment,
        urgency: botResponse.urgency,
        actions: botResponse.suggestedActions,
        nlpMetadata: {
          confidence: nlpResult.confidence,
          entities: nlpResult.entities,
          reformulated: nlpResult.reformulatedQuery,
        },
      }

      setMessages(prev => [...prev, botMsg])
    } catch (error) {
      console.error('Error generating response:', error)

      const errorMsg = {
        id: `error-${Date.now()}`,
        type: 'bot',
        text: 'I encountered an issue processing your request. Please try rephrasing or contact our team directly.',
        timestamp: new Date(),
        sentiment: 'neutral',
      }

      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }, [conversationContext, messages, onNavigate])

  // ─────────────────────────────────────────────────────────────
  // HANDLE ENTER KEY
  // ─────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(input)
    }
  }, [input, handleSendMessage])

  // ─────────────────────────────────────────────────────────────
  // SUGGESTED QUICK PROMPTS
  // ─────────────────────────────────────────────────────────────
  const quickPrompts = useMemo(() => [
    { text: '🔥 Show thermal cameras', query: 'Show me thermal imaging capabilities' },
    { text: '📍 Navigate to pricing', query: 'Take me to pricing' },
    { text: '🚜 Agriculture solutions', query: 'What solutions do you have for agriculture?' },
    { text: '⚡ Utility costs', query: 'How much can utilities save?' },
  ], [])

  // ─────────────────────────────────────────────────────────────
  // RENDER MESSAGE WITH MARKDOWN & ACTIONS
  // ─────────────────────────────────────────────────────────────
  const renderMessage = (message) => {
    const isBot = message.type === 'bot'
    const lines = message.text.split('\n')

    return (
      <motion.div
        key={message.id}
        className={`message ${isBot ? 'message--bot' : 'message--user'}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="message__avatar">
          {isBot ? (
            <div className="avatar--bot">
              <span className="avatar__icon">◉</span>
            </div>
          ) : (
            <div className="avatar--user">
              <span className="avatar__icon">👤</span>
            </div>
          )}
        </div>

        <div className="message__content">
          <div className="message__text">
            {lines.map((line, idx) => {
              // Convert markdown-like formatting
              let formatted = line
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

              return (
                <div
                  key={idx}
                  className="message__line"
                  dangerouslySetInnerHTML={{ __html: formatted }}
                />
              )
            })}
          </div>

          {/* Sentiment indicator */}
          {message.sentiment && isBot && (
            <div className={`message__sentiment message__sentiment--${message.sentiment}`}>
              {message.sentiment === 'positive' && '✓'}
              {message.sentiment === 'negative' && '!'}
              {message.sentiment === 'neutral' && '—'}
            </div>
          )}

          {/* Suggested Actions */}
          {message.actions && message.actions.length > 0 && (
            <div className="message__actions">
              {message.actions.map((action, idx) => (
                <motion.button
                  key={idx}
                  className="action-button"
                  onClick={() => {
                    if (action.action === 'navigate') {
                      onNavigate?.(action.target)
                    } else if (action.action === 'contact') {
                      handleSendMessage(`I'd like to ${action.target === 'sales' ? 'get a quote' : 'schedule a consultation'}`)
                    } else {
                      handleSendMessage(action.label)
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {action.label}
                </motion.button>
              ))}
            </div>
          )}

          {/* Confidence score (debug) */}
          {message.nlpMetadata && message.nlpMetadata.confidence < 0.7 && (
            <div className="message__debug">
              💡 Alternative query: {message.nlpMetadata.reformulated}
            </div>
          )}
        </div>

        <div className="message__timestamp">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </motion.div>
    )
  }

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        className="chat-button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="chat-button__icon">
          {isOpen ? '✕' : '💬'}
        </span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-window"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header__content">
                <h3>CONVERSATIONAL UI</h3>
                <p className="chat-header__subtitle">Enterprise Intelligence Assistant</p>
              </div>
              <button
                className="chat-header__close"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.length === 1 && !isLoading && (
                <div className="quick-prompts">
                  <p className="quick-prompts__label">Quick prompts:</p>
                  {quickPrompts.map((prompt, idx) => (
                    <motion.button
                      key={idx}
                      className="quick-prompt"
                      onClick={() => handleSendMessage(prompt.query)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      {prompt.text}
                    </motion.button>
                  ))}
                </div>
              )}

              {messages.map(renderMessage)}

              {isLoading && (
                <motion.div
                  className="message message--bot message--loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="message__avatar">
                    <div className="avatar--bot">
                      <span className="avatar__icon">◉</span>
                    </div>
                  </div>
                  <div className="message__content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-area">
              <div className="chat-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  className="chat-input"
                  placeholder="Ask about thermal imaging, pricing, industries, or anything else..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  autoComplete="off"
                />
                <motion.button
                  className="chat-send"
                  onClick={() => handleSendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>→</span>
                </motion.button>
              </div>
              <p className="chat-input-hint">
                💡 Try: "Show thermal cameras", "What's the ROI?", "How do I get started?"
              </p>
            </div>

            {/* Footer */}
            <div className="chat-footer">
              <p>Powered by Advanced NLP • Multi-turn conversation • Sentiment-aware responses</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
