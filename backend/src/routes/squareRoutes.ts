import { Router } from 'express'
import {
  getSquareWorks,
  likeWork,
  viewWork,
} from '../controllers/squareController'
import { authenticate } from '../middleware/auth'

const router = Router()

// 获取广场作品列表（不需要认证）
router.get('/works', getSquareWorks)

// 点赞作品（需要认证）
router.post('/works/:id/like', authenticate, likeWork)

// 浏览作品（不需要认证）
router.post('/works/:id/view', viewWork)

export default router
