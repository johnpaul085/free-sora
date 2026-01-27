'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Loading from '@/components/UI/Loading'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  redirectTo?: string
}

export default function AuthGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo,
}: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      const redirect = redirectTo || `/auth/login?redirect=${encodeURIComponent(pathname)}`
      router.push(redirect)
      return
    }

    if (requireAdmin && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/home')
      return
    }
  }, [isAuthenticated, user, requireAuth, requireAdmin, router, pathname, redirectTo])

  // 如果未登录且需要登录，显示加载
  if (requireAuth && !isAuthenticated) {
    return <Loading fullScreen text="验证中..." />
  }

  // 如果需要管理员权限但不是管理员，显示加载
  if (requireAdmin && (!isAuthenticated || user?.role !== 'admin')) {
    return <Loading fullScreen text="验证权限中..." />
  }

  return <>{children}</>
}
