import { Request, Response } from 'express'
import { query, run } from '../db/connection'
import { success, error } from '../utils/response'
import { v4 as uuidv4 } from 'uuid'
import { getAvailableAssistantConfig, callAssistantAPI } from '../services/assistantService'

// 获取对话列表
export async function getConversations(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    // 获取所有会话ID
    const sessions = await query(
      `SELECT DISTINCT session_id, MAX(created_at) as last_message_time
       FROM chat_messages
       WHERE user_id = ?
       GROUP BY session_id
       ORDER BY last_message_time DESC`,
      [req.user.userId]
    ) as any[]

    success(res, {
      list: sessions.map((s) => ({
        sessionId: s.session_id,
        lastMessageTime: s.last_message_time,
      })),
      total: sessions.length,
    })
  } catch (err: any) {
    console.error('获取对话列表错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 获取对话消息
export async function getMessages(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    const { sessionId } = req.query

    if (!sessionId) {
      return error(res, '会话ID不能为空', 400)
    }

    const messages = await query(
      `SELECT * FROM chat_messages
       WHERE user_id = ? AND session_id = ?
       ORDER BY created_at ASC`,
      [req.user.userId, sessionId]
    )

    success(res, {
      list: messages,
      total: (messages as any[]).length,
    })
  } catch (err: any) {
    console.error('获取消息错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 发送消息
export async function sendMessage(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    const { content, sessionId, modelName } = req.body

    if (!content) {
      return error(res, '消息内容不能为空', 400)
    }

    const currentSessionId = sessionId || uuidv4()

    // 保存用户消息
    await run(
      `INSERT INTO chat_messages (user_id, session_id, role, content, model_name)
       VALUES (?, ?, 'user', ?, ?)`,
      [req.user.userId, currentSessionId, content, modelName || null]
    )

    // 获取历史消息（用于上下文）
    const historyMessages = await query(
      `SELECT role, content FROM chat_messages
       WHERE user_id = ? AND session_id = ?
       ORDER BY created_at ASC
       LIMIT 20`,
      [req.user.userId, currentSessionId]
    ) as Array<{ role: string; content: string }>

    // 转换为API格式
    const messages = historyMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }))

    // 获取可用的AI助手配置
    const aiConfig = await getAvailableAssistantConfig(modelName || undefined)

    if (!aiConfig) {
      const errorMsg = '没有可用的AI助手配置，请联系管理员'
      await run(
        `INSERT INTO chat_messages (user_id, session_id, role, content, model_name)
         VALUES (?, ?, 'assistant', ?, ?)`,
        [req.user.userId, currentSessionId, errorMsg, modelName || 'system']
      )
      return error(res, errorMsg, 503)
    }

    // 调用AI服务生成回复
    const result = await callAssistantAPI(aiConfig, messages, modelName || undefined)

    if (!result.success) {
      const errorMsg = result.error || 'AI服务调用失败'
      await run(
        `INSERT INTO chat_messages (user_id, session_id, role, content, model_name)
         VALUES (?, ?, 'assistant', ?, ?)`,
        [req.user.userId, currentSessionId, errorMsg, modelName || 'system']
      )
      return error(res, errorMsg, 500)
    }

    const assistantResponse = result.content || '抱歉，我无法生成回复。'

    // 保存AI回复
    await run(
      `INSERT INTO chat_messages (user_id, session_id, role, content, model_name)
       VALUES (?, ?, 'assistant', ?, ?)`,
      [req.user.userId, currentSessionId, assistantResponse, modelName || aiConfig.provider_name]
    )

    success(res, {
      sessionId: currentSessionId,
      message: assistantResponse,
    }, '消息发送成功')
  } catch (err: any) {
    console.error('发送消息错误:', err)
    error(res, err.message || '发送失败', 500)
  }
}

// 删除对话
export async function deleteConversation(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    const { sessionId } = req.params

    await run(
      'DELETE FROM chat_messages WHERE user_id = ? AND session_id = ?',
      [req.user.userId, sessionId]
    )

    success(res, null, '对话已删除')
  } catch (err: any) {
    console.error('删除对话错误:', err)
    error(res, err.message || '删除失败', 500)
  }
}

// 清空历史
export async function clearHistory(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    await run(
      'DELETE FROM chat_messages WHERE user_id = ?',
      [req.user.userId]
    )

    success(res, null, '历史记录已清空')
  } catch (err: any) {
    console.error('清空历史错误:', err)
    error(res, err.message || '清空失败', 500)
  }
}
