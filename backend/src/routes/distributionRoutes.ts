import { Router } from 'express'
import {
  getDistributionData,
  getCommissions,
  getTeam,
  getDistributionOrders,
  applyWithdrawal,
  getWithdrawals,
  getReferralCode,
} from '../controllers/distributionController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate) // 所有路由都需要认证

router.get('/', getDistributionData)
router.get('/commissions', getCommissions)
router.get('/team', getTeam)
router.get('/orders', getDistributionOrders)
router.post('/withdraw', applyWithdrawal)
router.get('/withdrawals', getWithdrawals)
router.get('/referral-code', getReferralCode)

export default router
