import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './ChatWidget.css'

// Backend API endpoint - same as SunLife
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:8004'

function ChatWidget({ cases = [], statistics = null, cityData = [] }) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    const userMessageText = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Add user message to UI immediately
    const userMessage = {
      id: Date.now(),
      text: userMessageText,
      sender: 'user',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // Prepare chat history for backend (last 20 messages = 10 request-response pairs)
      const chatHistory = messages
        .slice(-20)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }))

      // Prepare FNOL case data for context
      const fnolDataContext = {
        statistics: statistics ? {
          total: statistics.total,
          accepted: statistics.accepted,
          rejected: statistics.rejected,
          pending: statistics.pending
        } : null,
        cityData: cityData.slice(0, 10).map(city => ({
          city: city.city,
          state: city.state,
          total: city.total,
          accepted: city.accepted,
          rejected: city.rejected,
          pending: city.pending
        })),
        recentCases: cases.slice(0, 5).map(caseItem => ({
          claimId: caseItem.claimId,
          insuredName: caseItem.insuredName,
          status: caseItem.status,
          city: caseItem.city,
          state: caseItem.state,
          dateOfLoss: caseItem.dateOfLoss,
          finalOutcome: caseItem.finalOutcome
        }))
      }

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessageText,
          chat_history: chatHistory,
          context_type: 'dashboard',
          claims_data: fnolDataContext,
          client: 'munich' // Important: specify Munich Re client
        }),
      })

      const data = await response.json()

      if (data.success && data.response) {
        const assistantMessage = {
          id: Date.now() + 1,
          text: data.response,
          sender: 'assistant',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          text: data.error || 'Failed to get response from chat service. Please check if the backend is running.',
          sender: 'assistant',
          timestamp: new Date(),
          isError: true
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Failed to connect to the chat service. Please check if the backend is running.',
        sender: 'assistant',
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating chat button */}
      {!isOpen && (
        <button
          className="chat-float-button"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          💬
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="chat-widget">
          <div className="chat-header">
            <div className="chat-header-content">
              <h3>Chat Assistant</h3>
              <div className="chat-status">
                <span className="status-indicator"></span>
                <span>Online</span>
              </div>
            </div>
            <button
              className="chat-close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <p>Hello! I'm your Munich Re FNOL assistant. I can help you:</p>
                <ul>
                  <li>Understand FNOL case statistics</li>
                  <li>Analyze geographical distribution</li>
                  <li>Answer questions about the 20-stage workflow</li>
                  <li>Provide insights about case trends</li>
                </ul>
                <p>How can I help you today?</p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.sender === 'user' ? 'user-message' : 'assistant-message'} ${message.isError ? 'error-message' : ''}`}
              >
                <div className="message-content">
                  {message.sender === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                  ) : (
                    <p>{message.text}</p>
                  )}
                </div>
                <div className="message-timestamp">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message assistant-message">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-form" onSubmit={handleSend}>
            <input
              type="text"
              className="chat-input"
              placeholder="Type your message here..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="chat-send-button"
              disabled={isLoading || !inputMessage.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default ChatWidget

