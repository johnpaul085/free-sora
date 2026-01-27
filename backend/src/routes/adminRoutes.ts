import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth'
import {
  getUsers,
  getUserById,
  updateUser,
  resetPassword,
  batchOperation,
} from '../controllers/adminUserController'
import {
  getApiConfigs,
  getApiConfigById,
  createApiConfig,
  updateApiConfig,
  deleteApiConfig,
  testApiConfig,
} from '../controllers/adminApiConfigController'
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
} from '../controllers/adminOrderController'
import {
  getCommissions,
  updateCommissionStatus,
} from '../controllers/adminCommissionController'
import {
  getStatistics,
} from '../controllers/adminStatisticsController'
import {
  getSystemConfigs,
  getSystemConfig,
  updateSystemConfig,
} from '../controllers/adminSystemConfigController'
import {
  getReviewWorks,
  reviewWork,
} from '../controllers/adminContentReviewController'
import {
  getAdminLogs,
} from '../controllers/adminLogController'
import {
  getCardCodes,
  generateCardCodes,
  deleteCardCode,
  batchDeleteCardCodes,
} from '../controllers/adminCardController'

const router = Router()

// 所有管理员路由都需要认证和管理员权限
router.use(authenticate)
router.use(requireAdmin)

// 用户管理
router.get('/users', getUsers)
router.get('/users/:id', getUserById)
router.put('/users/:id', updateUser)
router.post('/users/:id/reset-password', resetPassword)
router.post('/users/batch', batchOperation)

// API配置管理
router.get('/api-configs', getApiConfigs)
router.get('/api-configs/:id', getApiConfigById)
router.post('/api-configs', createApiConfig)
router.put('/api-configs/:id', updateApiConfig)
router.delete('/api-configs/:id', deleteApiConfig)
router.post('/api-configs/:id/test', testApiConfig)

// 订单管理
router.get('/orders', getOrders)
router.get('/orders/:id', getOrderById)
router.put('/orders/:id/status', updateOrderStatus)

// 佣金管理
router.get('/commissions', getCommissions)
router.put('/commissions/:id/status', updateCommissionStatus)

// 数据统计
router.get('/statistics', getStatistics)

// 系统配置
router.get('/system-configs', getSystemConfigs)
router.get('/system-configs/:key', getSystemConfig)
router.put('/system-configs', updateSystemConfig)

// 内容审核
router.get('/content-review', getReviewWorks)
router.post('/content-review/:id', reviewWork)

// 操作日志
router.get('/logs', getAdminLogs)

// 卡密管理
router.get('/cards', getCardCodes)
router.post('/cards/generate', generateCardCodes)
router.delete('/cards/:id', deleteCardCode)
router.post('/cards/batch-delete', batchDeleteCardCodes)

export default router
