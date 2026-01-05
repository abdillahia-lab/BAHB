import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X, Minimize2, Maximize2, Home } from 'lucide-react'
import { useContextualChatbot } from '../hooks/useContextualChatbot'
import { useIntentDetection } from '../hooks/useIntentDetection'
import { useConversationMemory } from '../hooks/useConversationMemory'
import { useLeadQualification } from '../hooks/useLeadQualification'
import '../styles/chatbot.css'

const JinkiContextualChatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Custom hooks for chatbot intelligence
  const { contextData, suggestedResponses } = useContextualChatbot()
  const { detectedIntent, confidence } = useIntentDetection(inputValue)
  const { saveConversation, loadConversation, clearHistory } = useConversationMemory()
  const { qualificationData, updateQualification } = useLeadQualification()

  // Initialize with conversation history
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const savedMessages = loadConversation()
      if (savedMessages && savedMessages.length > 0) {
        setMessages(savedMessages)
      } else {
        // First interaction - provide contextual greeting
        const greeting = generateContextualGreeting()
        setMessages([
          {
            id: Date.now(),
            type: 'bot',
            content: greeting,
            timestamp: new Date(),
            intent: 'greeting',
            suggestions: getInitialSuggestions(),
          },
        ])
      }
    }
  }, [isOpen])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Persist conversation on changes
  useEffect(() => {
    if (messages.length > 0) {
      saveConversation(messages)
    }
  }, [messages])

  const generateContextualGreeting = () => {
    const greetings = {
      pricing: "I see you're interested in our pricing. Let me help you find the right plan for your enterprise needs.",
      product: "Welcome to Jinki Intelligence! I'm here to help you understand how our drone inspection and cybersecurity solutions can protect your assets.",
      demo: "Great interest in seeing our platform in action! I can schedule a personalized demo for you.",
      support: "How can I assist you today? I'm here to help with any questions about our services.",
    }

    const intent = contextData.primaryIntent || 'product'
    return greetings[intent] || greetings.product
  }

  const getInitialSuggestions = () => {
    return [
      { text: 'Schedule a Demo', intent: 'demo' },
      { text: 'View Pricing', intent: 'pricing' },
      { text: 'Learn About Features', intent: 'features' },
      { text: 'Contact Support', intent: 'support' },
    ]
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      intent: detectedIntent,
      confidence: confidence,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const botResponse = generateBotResponse(userMessage)
      setMessages((prev) => [...prev, botResponse])
      setIsLoading(false)
    }, 800)

    // Track for lead qualification
    updateQualification(userMessage)
  }

  const generateBotResponse = (userMessage) => {
    const responseMap = {
      pricing: generatePricingResponse,
      demo: generateDemoResponse,
      support: generateSupportResponse,
      features: generateFeaturesResponse,
      qualification: generateQualificationResponse,
      general: generateGeneralResponse,
    }

    const responseGenerator = responseMap[userMessage.intent] || responseMap.general
    return responseGenerator(userMessage)
  }

  const generatePricingResponse = (msg) => ({
    id: Date.now() + 1,
    type: 'bot',
    content: `Based on your interest in pricing, I see you're looking at options for ${
      qualificationData.companySize || 'enterprise'
    } solutions. Our pricing model includes:\n\n• Starter: $2,500/month - Perfect for SMBs\n• Professional: $7,500/month - Mid-market focus\n• Enterprise: Custom pricing - Large-scale operations\n\nWould you like me to recommend a plan based on your specific needs?`,
    timestamp: new Date(),
    intent: 'pricing',
    suggestions: [
      { text: 'Tell me about your company', action: 'qualification' },
      { text: 'Schedule a pricing consultation', action: 'demo' },
      { text: 'Compare plans', action: 'features' },
    ],
  })

  const generateDemoResponse = (msg) => ({
    id: Date.now() + 1,
    type: 'bot',
    content: `I'd love to show you our platform in action! To schedule the perfect demo for your needs:\n\n1. What's your primary interest? (Drone Inspection / Cybersecurity / Both)\n2. How many assets would you be monitoring?\n3. What's your timeline for implementation?\n\nThis helps me tailor the demo to your specific use case.`,
    timestamp: new Date(),
    intent: 'demo',
    suggestions: [
      { text: 'Drone Inspection Demo', intent: 'demo' },
      { text: 'Cybersecurity Demo', intent: 'demo' },
      { text: 'Full Platform Tour', intent: 'demo' },
    ],
  })

  const generateSupportResponse = (msg) => ({
    id: Date.now() + 1,
    type: 'bot',
    content: `I'm here to help! I can assist with:\n\n• Technical troubleshooting\n• Feature guidance\n• Account management\n• Billing questions\n\nFor urgent issues, I can connect you with our support team immediately. What can I help you with?`,
    timestamp: new Date(),
    intent: 'support',
    suggestions: [
      { text: 'Technical Issue', action: 'support' },
      { text: 'Billing Question', action: 'support' },
      { text: 'Feature Help', action: 'support' },
      { text: 'Connect to Agent', action: 'handoff' },
    ],
  })

  const generateFeaturesResponse = (msg) => ({
    id: Date.now() + 1,
    type: 'bot',
    content: `Jinki Intelligence offers powerful capabilities:\n\n🚁 Drone Inspection\n• AI-powered defect detection\n• Real-time anomaly analysis\n• Automated reporting\n\n🔐 Cybersecurity Advisory\n• Enterprise threat assessment\n• Vulnerability management\n• Compliance monitoring\n\nWould you like to dive deeper into any specific feature?`,
    timestamp: new Date(),
    intent: 'features',
    suggestions: [
      { text: 'More on Drone Tech', intent: 'features' },
      { text: 'Security Details', intent: 'features' },
      { text: 'See Case Studies', intent: 'features' },
    ],
  })

  const generateQualificationResponse = (msg) => ({
    id: Date.now() + 1,
    type: 'bot',
    content: `Perfect! Let me understand your needs better:\n\n1. What industry are you in?\n2. How many facilities do you operate?\n3. What's your primary pain point?\n4. Budget range for solutions?`,
    timestamp: new Date(),
    intent: 'qualification',
  })

  const generateGeneralResponse = (msg) => ({
    id: Date.now() + 1,
    type: 'bot',
    content: `That's a great question! Based on what you're asking, I think you'd benefit from learning more about our ${
      contextData.primaryIntent || 'platform'
    }. ${suggestedResponses[0] || 'How can I help you today?'}`,
    timestamp: new Date(),
    intent: 'general',
  })

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.text)
    inputRef.current?.focus()
  }

  const handleHandoff = () => {
    const handoffMessage = {
      id: Date.now() + 1,
      type: 'bot',
      content: `Connecting you to our sales team... One moment please. A specialist will be with you shortly to discuss your ${
        qualificationData.needType || 'requirements'
      }.`,
      timestamp: new Date(),
      isHandoff: true,
    }
    setMessages((prev) => [...prev, handoffMessage])
    // Trigger actual handoff (e.g., Slack, phone, etc.)
  }

  return (
    <div className="jinki-chatbot-container">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          className="chatbot-fab"
          onClick={() => setIsOpen(true)}
          aria-label="Open chatbot"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`chatbot-window ${isMinimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-title">
              <h3>Jinki Assistant</h3>
              <p className="status-indicator">
                {isLoading ? 'Thinking...' : 'Ready to help'}
              </p>
            </div>
            <div className="chatbot-controls">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="control-btn"
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="control-btn"
                aria-label="Close chatbot"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="chatbot-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.type}`}>
                    <div className="message-content">
                      {msg.type === 'bot' && (
                        <div className="bot-avatar">
                          <Home size={16} />
                        </div>
                      )}
                      <div className="message-text">{msg.content}</div>
                    </div>

                    {/* Suggestions */}
                    {msg.suggestions && msg.type === 'bot' && (
                      <div className="message-suggestions">
                        {msg.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            className="suggestion-btn"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="message bot">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="chatbot-input-area">
                <div className="input-wrapper">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' && handleSendMessage()
                    }
                    placeholder="Ask about pricing, features, or request a demo..."
                    className="chatbot-input"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="send-btn"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <p className="input-hint">
                  Intent detected: {detectedIntent} ({Math.round(confidence * 100)}%)
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default JinkiContextualChatbot
