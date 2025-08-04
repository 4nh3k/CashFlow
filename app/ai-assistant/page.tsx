'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Message {
  id: number
  type: 'user' | 'assistant'
  message: string
  timestamp: Date
  actionType?: 'create_transaction' | 'create_category' | 'create_wallet' | 'create_budget' | 'financial_insight'
  actionData?: any
  confidence?: number
}

interface ActionButtonProps {
  message: Message
  onAction: (action: string, data: any) => void
}

const ActionButton: React.FC<ActionButtonProps> = ({ message, onAction }) => {
  if (!message.actionType || !message.actionData) return null

  const getButtonText = () => {
    switch (message.actionType) {
      case 'create_transaction':
        return '💰 Tạo giao dịch'
      case 'create_category':
        return '🏷️ Tạo danh mục'
      case 'create_wallet':
        return '💳 Tạo ví'
      case 'create_budget':
        return '📊 Tạo ngân sách'
      default:
        return '✨ Thực hiện'
    }
  }

  const getButtonColor = () => {
    switch (message.actionType) {
      case 'create_transaction':
        return 'bg-green-600 hover:bg-green-700'
      case 'create_category':
        return 'bg-blue-600 hover:bg-blue-700'
      case 'create_wallet':
        return 'bg-purple-600 hover:bg-purple-700'
      case 'create_budget':
        return 'bg-orange-600 hover:bg-orange-700'
      default:
        return 'bg-gray-600 hover:bg-gray-700'
    }
  }

  return (
    <button
      onClick={() => onAction(message.actionType!, message.actionData)}
      className={`mt-3 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${getButtonColor()}`}
    >
      {getButtonText()}
    </button>
  )
}

export default function AIAssistantPage() {
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'assistant',
      message: '👋 Xin chào! Tôi là trợ lý AI tài chính của bạn.\n\nTôi có thể giúp bạn:\n• 💰 Tạo giao dịch: "Ăn tối 50k", "Thu lương 15 triệu"\n• 🏷️ Tạo danh mục: "Tạo danh mục du lịch"\n• 💳 Tạo ví: "Tạo ví tiết kiệm"\n• 📊 Tạo ngân sách: "Đặt ngân sách ăn uống 2 triệu/tháng"\n• 📈 Phân tích tài chính: "Chi tiêu tháng này thế nào?"\n\nHãy thử nói với tôi về giao dịch hoặc câu hỏi tài chính của bạn!',
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      message: inputMessage,
      timestamp: new Date(),
    }

    setChatMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.message,
          context: {}
        }),
      })

      if (response.ok) {
        const data = await response.json()

        const assistantMessage: Message = {
          id: Date.now() + 1,
          type: 'assistant',
          message: data.message,
          timestamp: new Date(),
          actionType: data.actionType,
          actionData: data.actionData,
          confidence: data.confidence
        }

        setChatMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error('Failed to get AI response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        message: '❌ Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
        timestamp: new Date(),
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async (actionType: string, actionData: any) => {
    setIsCreating(true)

    try {
      let endpoint = ''
      let successMessage = ''

      switch (actionType) {
        case 'create_transaction':
          endpoint = '/api/ai/create-transaction'
          successMessage = `✅ Đã tạo giao dịch ${actionData.amount?.toLocaleString('vi-VN')} VNĐ thành công!`
          break
        case 'create_category':
          endpoint = '/api/ai/create-category'
          successMessage = `✅ Đã tạo danh mục "${actionData.name}" thành công!`
          break
        case 'create_wallet':
          endpoint = '/api/ai/create-wallet'
          successMessage = `✅ Đã tạo ví "${actionData.name}" thành công!`
          break
        case 'create_budget':
          endpoint = '/api/ai/create-budget'
          successMessage = `✅ Đã tạo ngân sách ${actionData.amount?.toLocaleString('vi-VN')} VNĐ thành công!`
          break
        default:
          throw new Error('Unknown action type')
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionData),
      })

      if (response.ok) {
        const result = await response.json()

        let detailMessage = ''
        switch (actionType) {
          case 'create_transaction':
            detailMessage = `💰 Số tiền: ${result.amount?.toLocaleString('vi-VN')} VNĐ\n📝 Mô tả: ${result.description}\n🏷️ Danh mục: ${result.categoryId || 'Chưa phân loại'}\n💳 Ví: ${result.walletId || 'Ví chính'}\n📅 Ngày: ${new Date(result.date).toLocaleDateString('vi-VN')}`
            break
          case 'create_category':
            detailMessage = `🏷️ Tên: ${result.name}\n💸 Loại: ${result.defaultType === 'income' ? 'Thu nhập' : 'Chi tiêu'}\n🎨 Màu: ${result.color}`
            break
          case 'create_wallet':
            detailMessage = `💳 Tên ví: ${result.name}\n💰 Số dư: ${result.balance?.toLocaleString('vi-VN')} VNĐ`
            break
          case 'create_budget':
            detailMessage = `📊 Ngân sách: ${result.amount?.toLocaleString('vi-VN')} VNĐ\n� Chu kỳ: ${result.period === 'monthly' ? 'Hàng tháng' : 'Hàng tuần'}\n🏷️ Danh mục: ${result.categoryId}`
            break
          default:
            detailMessage = `ID: ${result.id || result._id}`
        }

        const successMsg: Message = {
          id: Date.now(),
          type: 'assistant',
          message: `${successMessage}\n\n${detailMessage}`,
          timestamp: new Date(),
        }
        setChatMessages(prev => [...prev, successMsg])
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Action error:', error)
      const errorMsg: Message = {
        id: Date.now(),
        type: 'assistant',
        message: `❌ Lỗi: ${error instanceof Error ? error.message : 'Không thể thực hiện thao tác'}`,
        timestamp: new Date(),
      }
      setChatMessages(prev => [...prev, errorMsg])
    } finally {
      setIsCreating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">🤖</span>
                </div>
                Trợ lý AI CashFlow
              </h1>
              <p className="text-gray-600 mt-1">
                Trò chuyện thông minh về tài chính cá nhân của bạn
              </p>
            </div>
            <Link
              href="/dashboard"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Về Dashboard
            </Link>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {chatMessages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {message.type === 'assistant' && (
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-xs">🤖</span>
                      </div>
                      <span className="text-xs font-medium text-gray-500">CashFlow AI</span>
                    </div>
                  )}

                  <p className="text-sm whitespace-pre-line leading-relaxed">
                    {message.message}
                  </p>

                  {message.confidence && message.confidence > 0.7 && (
                    <div className="mt-2 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      <span className="text-xs text-gray-500">
                        Độ tin cậy: {Math.round(message.confidence * 100)}%
                      </span>
                    </div>
                  )}

                  <ActionButton message={message} onAction={handleAction} />

                  <p className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('vi-VN')}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-xs">🤖</span>
                    </div>
                    <span className="text-xs font-medium text-gray-500">CashFlow AI</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">Đang suy nghĩ...</span>
                  </div>
                </div>
              </div>
            )}

            {isCreating && (
              <div className="flex justify-start">
                <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
                    <span className="text-sm font-medium">Đang tạo dữ liệu...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-6 border-t border-gray-200 bg-white">
            <div className="flex space-x-4">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn... (VD: 'Ăn tối 50k', 'Tạo danh mục du lịch')"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={isLoading || isCreating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nhấn Enter để gửi, Shift + Enter để xuống dòng
                </p>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || isCreating || !inputMessage.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center min-w-[100px]"
              >
                {isLoading || isCreating ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { text: 'Ăn tối 50k', icon: '🍽️', color: 'from-green-500 to-emerald-600' },
            { text: 'Thu lương 15 triệu', icon: '💰', color: 'from-blue-500 to-cyan-600' },
            { text: 'Tạo danh mục du lịch', icon: '🏷️', color: 'from-purple-500 to-pink-600' },
            { text: 'Chi tiêu tháng này?', icon: '📊', color: 'from-orange-500 to-red-600' },
          ].map((action, index) => (
            <button
              key={index}
              onClick={() => setInputMessage(action.text)}
              className={`bg-gradient-to-r ${action.color} text-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all text-left`}
            >
              <div className="text-2xl mb-2">{action.icon}</div>
              <div className="text-sm font-medium">{action.text}</div>
            </button>
          ))}
        </div>

        {/* Features Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🚀</span>
              Tính năng AI
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Hiểu tiếng Việt tự nhiên
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Tạo giao dịch thông minh
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Quản lý danh mục & ví
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                Phân tích tài chính
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">💡</span>
              Mẹo sử dụng
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Nói chuyện tự nhiên: "Ăn sáng 25k"</li>
              <li>• Hỏi về tài chính: "Chi bao nhiêu tháng này?"</li>
              <li>• Tạo danh mục: "Tạo danh mục du lịch"</li>
              <li>• Quản lý ví: "Tạo ví tiết kiệm"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
