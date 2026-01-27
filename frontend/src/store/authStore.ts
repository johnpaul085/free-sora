import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: number
  username: string
  email?: string
  phone?: string
  avatar_url?: string
  nickname?: string
  role: 'user' | 'admin'
  computing_power?: number
  total_computing_power?: number
  hd_count?: number
  user_type?: 'normal' | 'vip' | 'svip'
  membership_expires_at?: string | null
  referral_code?: string
  created_at?: string
  // 计算字段（前端计算）
  gifted_computing_power?: number
  // 兼容旧字段
  avatar?: string
  computingPower?: number
  isVip?: boolean
  vipExpiresAt?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => {
        set({ token, isAuthenticated: !!token })
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('token', token)
          } else {
            localStorage.removeItem('token')
          }
        }
      },
      login: (user, token) => {
        set({ user, token, isAuthenticated: true })
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token)
        }
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
      },
      refreshUser: async () => {
        // 这个方法由 userApi.getUserInfo 调用，避免循环依赖
        // 实际刷新逻辑在 userApi 中
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // 恢复状态时的回调
      onRehydrateStorage: () => (state) => {
        // 恢复后，确保localStorage和store中的token同步
        if (typeof window !== 'undefined' && state) {
          const storedToken = localStorage.getItem('token')
          // 如果localStorage有token但store中没有，恢复token
          if (storedToken && !state.token) {
            state.setToken(storedToken)
          }
          // 如果store中有token但localStorage中没有，同步到localStorage
          if (state.token && !storedToken) {
            localStorage.setItem('token', state.token)
          }
          // 如果store中有token但没有用户信息，设置isAuthenticated为true
          if (state.token && !state.user) {
            state.isAuthenticated = true
          }
        }
      },
    }
  )
)
