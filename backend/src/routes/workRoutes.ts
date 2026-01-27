import { Router } from 'express'
import {
  getWorks,
  getWork,
  deleteWork,
  updateWork,
  downloadWork,
  shareWork,
  batchDeleteWorks,
  batchDownloadWorks,
} from '../controllers/workController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate) // 所有路由都需要认证

// 批量操作路由必须在单个操作路由之前，避免路由冲突
router.post('/batch-delete', batchDeleteWorks)
router.post('/batch-download', batchDownloadWorks)

router.get('/', getWorks)
router.get('/:id', getWork)
router.get('/:id/download', downloadWork)
router.post('/:id/share', shareWork)
router.delete('/:id', deleteWork)
router.put('/:id', updateWork)

export default router
