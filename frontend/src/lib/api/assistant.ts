import { api } from './client'

// AI助手相关API
export const assistantApi = {
  // 发送消息
  sendMessage: async (data: {
    content: string
    sessionId?: string
    modelName?: string
  }) => {
    return api.post('/assistant/send', {
      content: data.content,
      sessionId: data.sessionId,
      modelName: data.modelName,
    })
  },

  // 获取对话列表
  getConversations: async () => {
    return api.get('/assistant/conversations')
  },

  // 获取对话消息
  getMessages: async (sessionId: string) => {
    return api.get('/assistant/messages', { params: { sessionId } })
  },

  // 删除对话
  deleteConversation: async (sessionId: string) => {
    return api.delete(`/assistant/conversations/${sessionId}`)
  },

  // 清空历史
  clearHistory: async () => {
    return api.delete('/assistant/history')
  },
}
