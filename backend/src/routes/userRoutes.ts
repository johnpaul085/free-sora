import { Router } from 'express'
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  getComputingPowerLogs,
  purchaseMembership,
  redeemCode,
} from '../controllers/userController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate) // 所有路由都需要认证

router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.post('/change-password', changePassword)
router.post('/upload-avatar', uploadAvatar)
router.get('/computing-power-logs', getComputingPowerLogs)
router.post('/purchase-membership', purchaseMembership)
router.post('/redeem', redeemCode)

export default router
