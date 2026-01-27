import { api } from './client'

// 管理员API
export const adminApi = {
  // 获取用户列表
  getUsers: async (params?: {
    page?: number
    pageSize?: number
    search?: string
    user_type?: string
    status?: string
  }) => {
    return api.get('/admin/users', { params })
  },

  // 获取用户详情
  getUserById: async (id: number) => {
    return api.get(`/admin/users/${id}`)
  },

  // 更新用户信息
  updateUser: async (id: number, data: {
    nickname?: string
    email?: string
    phone?: string
    user_type?: 'normal' | 'vip' | 'svip'
    status?: 'active' | 'banned' | 'deleted'
    computing_power?: number
    total_computing_power?: number
    gifted_computing_power?: number
    hd_count?: number
    membership_expires_at?: string | null
  }) => {
    return api.put(`/admin/users/${id}`, data)
  },

  // 重置用户密码
  resetPassword: async (id: number, newPassword: string) => {
    return api.post(`/admin/users/${id}/reset-password`, { newPassword })
  },

  // 批量操作
  batchOperation: async (action: 'ban' | 'unban' | 'delete', userIds: number[]) => {
    return api.post('/admin/users/batch', { action, userIds })
  },

  // API配置管理
  getApiConfigs: async (params?: { type?: string }) => {
    return api.get('/admin/api-configs', { params })
  },

  getApiConfigById: async (id: number) => {
    return api.get(`/admin/api-configs/${id}`)
  },

  createApiConfig: async (data: {
    provider_name: string
    provider_type: 'image' | 'video' | 'assistant'
    api_key?: string
    api_url?: string
    models?: string[]
    is_active?: boolean
    priority?: number
    rate_limit?: number
    config?: object
  }) => {
    return api.post('/admin/api-configs', data)
  },

  updateApiConfig: async (id: number, data: {
    provider_name?: string
    provider_type?: 'image' | 'video' | 'assistant'
    api_key?: string
    api_url?: string
    models?: string[]
    is_active?: boolean
    priority?: number
    rate_limit?: number
    config?: object
  }) => {
    return api.put(`/admin/api-configs/${id}`, data)
  },

  deleteApiConfig: async (id: number) => {
    return api.delete(`/admin/api-configs/${id}`)
  },

  testApiConfig: async (id: number) => {
    return api.post(`/admin/api-configs/${id}/test`)
  },

  // 订单管理
  getOrders: async (params?: {
    page?: number
    pageSize?: number
    status?: string
    order_type?: string
    search?: string
  }) => {
    return api.get('/admin/orders', { params })
  },

  getOrderById: async (id: number) => {
    return api.get(`/admin/orders/${id}`)
  },

  updateOrderStatus: async (id: number, status: string) => {
    return api.put(`/admin/orders/${id}/status`, { status })
  },

  // 佣金管理
  getCommissions: async (params?: {
    page?: number
    pageSize?: number
    status?: string
    commission_type?: string
    search?: string
  }) => {
    return api.get('/admin/commissions', { params })
  },

  updateCommissionStatus: async (id: number, status: string) => {
    return api.put(`/admin/commissions/${id}/status`, { status })
  },

  // 数据统计
  getStatistics: async () => {
    return api.get('/admin/statistics')
  },

  // 系统配置
  getSystemConfigs: async (category?: string) => {
    return api.get('/admin/system-configs', { params: { category } })
  },

  getSystemConfig: async (key: string) => {
    return api.get(`/admin/system-configs/${key}`)
  },

  updateSystemConfigs: async (configs: Record<string, any>) => {
    return api.put('/admin/system-configs', { configs })
  },

  // 内容审核
  getReviewWorks: async (params?: {
    page?: number
    pageSize?: number
    status?: string
    work_type?: string
  }) => {
    return api.get('/admin/content-review', { params })
  },

  reviewWork: async (id: number, action: 'approve' | 'reject', reason?: string) => {
    return api.post(`/admin/content-review/${id}`, { action, reason })
  },

  // 操作日志
  getAdminLogs: async (params?: {
    page?: number
    pageSize?: number
    action_type?: string
    search?: string
  }) => {
    return api.get('/admin/logs', { params })
  },

  // 卡密管理
  getCardCodes: async (params?: {
    page?: number
    pageSize?: number
    code_type?: 'computing_power' | 'vip' | 'svip'
    is_used?: boolean
    search?: string
  }) => {
    return api.get('/admin/cards', { params })
  },

  generateCardCodes: async (data: {
    code_type: 'computing_power' | 'vip' | 'svip'
    value: number
    count: number
    expires_at?: string
  }) => {
    return api.post('/admin/cards/generate', data)
  },

  deleteCardCode: async (id: number) => {
    return api.delete(`/admin/cards/${id}`)
  },

  batchDeleteCardCodes: async (ids: number[]) => {
    return api.post('/admin/cards/batch-delete', { ids })
  },
}
