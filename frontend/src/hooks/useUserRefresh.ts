import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { userApi } from '@/lib/api/user'

/**
 * 全局用户信息刷新Hook
 * 在页面可见时自动刷新用户信息，确保数据实时同步
 */
export function useUserRefresh(options?: { enabled?: boolean; interval?: number }) {
  const { isAuthenticated, user } = useAuthStore()
  const { enabled = true, interval = 30000 } = options || {}

  useEffect(() => {
    if (!enabled || !isAuthenticated) return

    // 立即刷新一次
    const refresh = () => {
      userApi.getUserInfo().catch(console.error)
    }

    refresh()

    // 设置定时刷新（默认30秒）
    const timer = setInterval(refresh, interval)

    // 页面可见时刷新
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated, enabled, interval])
}

/**
 * 手动刷新用户信息
 */
export function refreshUserInfo() {
  return userApi.getUserInfo()
}
