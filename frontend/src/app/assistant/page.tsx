'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import { assistantApi } from '@/lib/api/assistant'
import { useAuthStore } from '@/store/authStore'

interface Message {
  id?: number
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

export default function AssistantPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    loadHistory()
  }, [isAuthenticated, router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 加载历史记录
  const loadHistory = async () => {
    try {
      setLoadingHistory(true)
      // 获取最新的会话ID
      const conversations = await assistantApi.getConversations()
      
      // 处理返回格式：可能是 { list: [] } 或直接是数组
      let conversationList: any[] = []
      if (conversations && conversations.list) {
        conversationList = conversations.list
      } else if (Array.isArray(conversations)) {
        conversationList = conversations
      }
      
      if (conversationList.length > 0) {
        const latestSession = conversationList[0]
        const currentSessionId = latestSession.sessionId || latestSession.session_id
        setSessionId(currentSessionId)
        
        // 加载该会话的消息
        const history = await assistantApi.getMessages(currentSessionId)
        
        // 处理返回格式：可能是 { list: [] } 或直接是数组
        let messageList: any[] = []
        if (history && history.list) {
          messageList = history.list
        } else if (Array.isArray(history)) {
          messageList = history
        }
        
        if (messageList.length > 0) {
          setMessages(messageList.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            created_at: msg.created_at,
          })))
        }
      }
    } catch (error: any) {
      console.error('加载历史记录失败:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || loading) {
      return
    }

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const result = await assistantApi.sendMessage({
        content: userMessage.content,
        sessionId: sessionId || undefined,
      })

      if (result.sessionId) {
        setSessionId(result.sessionId)
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.message || result.content || '收到消息',
      }

      setMessages((prev) => [...prev, assistantMessage])
      
      // 消息已由后端保存，无需前端再次保存
    } catch (error: any) {
      console.error('发送消息失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '发送失败，请重试',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-80px-3rem)]">
        {/* 标题 - 固定高度 */}
        <div className="flex-shrink-0 mb-4">
          <h1 className="text-xl font-bold text-white text-center">AI助手</h1>
        </div>

        {/* 对话区域 - 占据剩余空间 */}
        <div className="card flex-1 flex flex-col overflow-hidden min-h-0">
          {/* 消息列表 - 可滚动，占据除输入框外的所有空间 */}
          <div className="flex-1 space-y-5 overflow-y-auto pr-2 min-h-0">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-white/50 text-sm">加载历史记录中...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-white/50 text-sm">开始对话吧...</div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="flex gap-3">
                  {message.role === 'user' ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-[#002FA7] flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-[#002FA7]/30 flex-shrink-0">
                        U
                      </div>
                      <div className="flex-1">
                        <div className="bg-bg-tertiary/80 rounded-xl p-4 text-sm leading-relaxed border border-border/30">
                          {message.content}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-[#98FF98] flex items-center justify-center text-gray-800 text-sm font-bold shadow-lg shadow-[#98FF98]/30 flex-shrink-0">
                        AI
                      </div>
                      <div className="flex-1">
                        <div className="bg-gradient-to-br from-bg-secondary to-bg-tertiary/50 rounded-xl p-4 text-sm leading-relaxed border border-border/30 whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#98FF98] flex items-center justify-center text-gray-800 text-sm font-bold shadow-lg shadow-[#98FF98]/30 flex-shrink-0">
                  AI
                </div>
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-bg-secondary to-bg-tertiary/50 rounded-xl p-4 text-sm leading-relaxed border border-border/30">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入框 - 固定高度 */}
          <form onSubmit={handleSend} className="flex gap-3 pt-4 pb-2 border-t border-border/30 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入您的问题..."
              className="input flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="发送消息"
              title="发送消息"
              className="bg-white text-black rounded-xl px-5 py-3 flex items-center justify-center hover:bg-white/90 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="sr-only">发送消息</span>
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}
