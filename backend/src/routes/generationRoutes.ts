import { Router } from 'express'
import {
  createGenerationTask,
  getTaskStatus,
  cancelTask,
  getImageModels,
} from '../controllers/generationController'
import { authenticate } from '../middleware/auth'

const router = Router()

// 公开接口：获取图片模型列表（不需要认证）
router.get('/image-models', getImageModels)

// 需要认证的路由
router.use(authenticate)

router.post('/text-to-image', createGenerationTask)
router.post('/image-to-image', createGenerationTask)
router.post('/text-to-video', createGenerationTask)
router.post('/image-to-video', createGenerationTask)
router.get('/tasks/:id', getTaskStatus)
router.post('/tasks/:id/cancel', cancelTask)

export default router
