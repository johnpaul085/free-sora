'use client'

import { useEffect, useState, useRef } from 'react'
import ToastContainer from '@/components/UI/Toast'
import Loading from '@/components/UI/Loading'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/api/auth'

export default function ClientProviders() {
  const { loading, loadingText } = useAppStore()
  const { isAuthenticated, token, user } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const hasVerifiedRef = useRef(false)

  // 等待zustand persist恢复完成
  useEffect(() => {
    // zustand persist恢复是异步的，等待恢复完成
    const timer = setTimeout(() => {
      setIsHydrated(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // 初始化时检查登录状态（只执行一次）
  useEffect(() => {
    if (!isHydrated) return
    if (hasVerifiedRef.current) return // 已经验证过，不再重复验证

    const currentToken = useAuthStore.getState().token
    const currentUser = useAuthStore.getState().user

    // 如果有token但没有用户信息，尝试获取用户信息
    if (currentToken && !currentUser) {
      hasVerifiedRef.current = true
      authApi.getCurrentUser().catch(() => {
        // token无效，清除状态
        useAuthStore.getState().logout()
      })
    }
    // 如果有token和用户信息，验证token是否仍然有效（可选，避免频繁验证）
    else if (currentToken && currentUser) {
      // 只在首次加载时验证，避免循环
      hasVerifiedRef.current = true
      // 可以选择不验证，或者延迟验证
      // authApi.getCurrentUser().catch(() => {
      //   // token无效，清除状态
      //   useAuthStore.getState().logout()
      // })
    } else {
      // 没有token，标记为已验证
      hasVerifiedRef.current = true
    }
  }, [isHydrated]) // 移除token和user依赖，只在isHydrated变化时执行一次

  return (
    <>
      <ToastContainer />
      {loading && <Loading fullScreen text={loadingText} />}
    </>
  )
}
