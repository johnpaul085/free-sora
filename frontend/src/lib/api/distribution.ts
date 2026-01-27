import { api } from './client'

// 分销相关API
export const distributionApi = {
  // 获取分销中心数据
  getDistributionData: async () => {
    return api.get('/distribution')
  },

  // 获取佣金明细
  getCommissions: async (params?: {
    page?: number
    pageSize?: number
    status?: 'pending' | 'completed' | 'cancelled'
    type?: 'direct' | 'indirect'
    level?: 1 | 2
  }) => {
    return api.get('/distribution/commissions', { params })
  },

  // 获取我的团队
  getTeam: async (params?: {
    page?: number
    pageSize?: number
    level?: 1 | 2
  }) => {
    return api.get('/distribution/team', { params })
  },

  // 获取分销订单
  getOrders: async (params?: {
    page?: number
    pageSize?: number
  }) => {
    return api.get('/distribution/orders', { params })
  },

  // 申请提现
  applyWithdraw: async (data: {
    amount: number
    method: 'alipay' | 'wechat' | 'bank'
    accountInfo: string
    bankName?: string
  }) => {
    return api.post('/distribution/withdraw', {
      amount: data.amount,
      withdrawal_method: data.method,
      account_info: data.accountInfo,
    })
  },

  // 获取提现记录
  getWithdrawals: async (params?: {
    page?: number
    pageSize?: number
    status?: 'pending' | 'processing' | 'completed' | 'rejected'
  }) => {
    return api.get('/distribution/withdrawals', { params })
  },

  // 获取推荐码
  getReferralCode: async () => {
    return api.get('/distribution/referral-code')
  },
}
