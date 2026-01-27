import { api } from './client'
import { useAuthStore } from '@/store/authStore'

// 认证相关API
export const authApi = {
  // 注册
  register: async (data: {
    username: string
    email: string
    phone?: string
    password: string
    referralCode?: string
  }) => {
    const result = await api.post<{ user: any; token: string }>('/auth/register', {
      username: data.username,
      email: data.email,
      phone: data.phone,
      password: data.password,
      referral_code: data.referralCode, // 后端使用snake_case
    })
    return result
  },

  // 登录
  login: async (data: { emailOrPhone: string; password: string; rememberMe?: boolean }) => {
    // 后端接口使用username字段，支持用户名/邮箱/手机号
    const result = await api.post<{ user: any; token: string }>('/auth/login', {
      username: data.emailOrPhone,
      password: data.password,
    })
    // 自动保存到store
    useAuthStore.getState().login(result.user, result.token)
    return result
  },

  // 登出
  logout: async () => {
    await api.post('/auth/logout')
    useAuthStore.getState().logout()
  },

  // 忘记密码 - 发送验证码
  sendResetCode: async (data: { emailOrPhone: string }) => {
    return api.post('/auth/forgot-password', data)
  },

  // 重置密码
  resetPassword: async (data: {
    emailOrPhone: string
    code: string
    newPassword: string
  }) => {
    return api.post('/auth/reset-password', data)
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    const result = await api.get<any>('/auth/me')
    useAuthStore.getState().setUser(result)
    return result
  },
}
