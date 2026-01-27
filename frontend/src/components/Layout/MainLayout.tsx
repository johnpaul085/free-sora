'use client'

import type { ReactNode } from 'react'
import BottomNavigation from './BottomNavigation'
import { useUserRefresh } from '@/hooks/useUserRefresh'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  // 自动刷新用户信息（每30秒，页面可见时也会刷新）
  useUserRefresh({ enabled: true, interval: 30000 })

  return (
    <div className="min-h-screen pb-20">
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        {children}
      </main>
      <BottomNavigation />
    </div>
  )
}
