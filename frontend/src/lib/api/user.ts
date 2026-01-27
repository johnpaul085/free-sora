import { api } from './client'
import { useAuthStore } from '@/store/authStore'

// 用户相关API
export const userApi = {
  // 获取用户信息
  getUserInfo: async () => {
    const result = await api.get('/users/profile')
    useAuthStore.getState().setUser(result)
    return result
  },

  // 更新用户信息
  updateUserInfo: async (data: {
    nickname?: string
    email?: string
    phone?: string
    avatar?: string
  }) => {
    const result = await api.put('/users/profile', data)
    useAuthStore.getState().setUser(result)
    return result
  },

  // 修改密码
  changePassword: async (data: {
    oldPassword: string
    newPassword: string
  }) => {
    return api.post('/users/change-password', data)
  },

  // 上传头像
  uploadAvatar: async (avatarUrl: string) => {
    const result = await api.post('/users/upload-avatar', { avatar_url: avatarUrl })
    useAuthStore.getState().setUser(result.user || result)
    return result
  },

  // 获取算力记录
  getComputingPowerLogs: async (params?: {
    page?: number
    pageSize?: number
    type?: 'earn' | 'consume'
  }) => {
    return api.get('/users/computing-power-logs', { params })
  },

  // 卡密兑换
  redeemCode: async (code: string) => {
    const result = await api.post('/users/redeem', { code })
    // 兑换成功后自动刷新用户信息
    await userApi.getUserInfo()
    return result
  },

  // 购买会员
  purchaseMembership: async (planType: 'lifetime' | 'monthly' | 'yearly') => {
    const result = await api.post('/users/purchase-membership', { plan_type: planType })
    // 购买成功后自动刷新用户信息
    await userApi.getUserInfo()
    return result
  },
}
