import { Router } from 'express'
import {
  getCardCodes,
  generateCardCodes,
  deleteCardCode,
  batchDeleteCardCodes,
} from '../controllers/adminCardController'
import { authenticate } from '../middleware/auth'

const router = Router()

// 所有路由需要认证
router.use(authenticate)

// 获取卡密列表
router.get('/codes', getCardCodes)

// 生成卡密
router.post('/codes/generate', generateCardCodes)

// 删除卡密
router.delete('/codes/:id', deleteCardCode)

// 批量删除卡密
router.post('/codes/batch-delete', batchDeleteCardCodes)

export default router
