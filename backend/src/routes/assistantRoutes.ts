import { Router } from 'express'
import {
  getConversations,
  getMessages,
  sendMessage,
  deleteConversation,
  clearHistory,
} from '../controllers/assistantController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate) // 所有路由都需要认证

router.get('/conversations', getConversations)
router.get('/messages', getMessages)
router.post('/send', sendMessage)
router.delete('/conversations/:sessionId', deleteConversation)
router.delete('/history', clearHistory)

export default router
