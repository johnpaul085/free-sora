'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { distributionApi } from '@/lib/api/distribution'
import { useAuthStore } from '@/store/authStore'

export default function DistributionPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    commissions: {
      available: 0,
      pending: 0,
      withdrawn: 0,
      total: 0,
    },
    team: {
      level1: 0,
      level2: 0,
      total: 0,
    },
    orders: {
      total: 0,
      totalAmount: 0,
    },
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    loadData()
  }, [isAuthenticated, router])

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await distributionApi.getDistributionData()
      setData(result)
    } catch (error: any) {
      console.error('加载分销数据失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载数据失败',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-180px)]">
          <div className="text-white/50">加载中...</div>
        </div>
      </MainLayout>
    )
  }
  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        {/* 用户信息栏 */}
        <div className="flex items-center gap-4 pt-2">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 flex items-center justify-center text-white font-bold text-xl">
              <span className="relative z-10">Ai</span>
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5">
              <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="crownGradientHeader" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>
                </defs>
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" fill="url(#crownGradientHeader)" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xl font-bold text-white">
              {user?.nickname || user?.username || '未设置昵称'}
            </div>
            <div className="text-sm text-white/70 mt-0.5">ID: {user?.id}</div>
          </div>
          <Link href="/distribution/rules" className="px-4 py-2 rounded-full bg-gray-700 text-white text-sm flex items-center gap-1 hover:bg-gray-600 transition-colors">
            <span>分佣规则</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* 佣金概览卡片 */}
        <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: 'linear-gradient(to right, #6366f1, #3b82f6, #10b981)' }}>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm text-white/80 mb-1">可提现佣金</div>
                <div className="text-3xl font-bold text-white">{data.commissions.available.toFixed(2)}</div>
              </div>
              <Link href="/distribution/commissions" className="px-3 py-1.5 rounded-full bg-white/20 text-white text-xs flex items-center gap-1 hover:bg-white/30 transition-colors">
                <span>佣金明细</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-white/70 mb-1">累计提现(元)</div>
                <div className="text-lg font-bold text-white">{data.commissions.withdrawn.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-white/70 mb-1">累计佣金(元)</div>
                <div className="text-lg font-bold text-white">{data.commissions.total.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 我的团队 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-bold text-white">我的团队</div>
            <Link href="/distribution/team" className="text-sm text-white/70 flex items-center gap-1 hover:text-white transition-colors">
              <span>查看全部</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center py-3 border-r border-white/20">
              <div className="text-2xl font-bold text-white mb-1">{data.team.total}</div>
              <div className="text-xs text-white/70">团队总数(人)</div>
            </div>
            <div className="text-center py-3 border-r border-white/20">
              <div className="text-2xl font-bold text-white mb-1">{data.team.level1}</div>
              <div className="text-xs text-white/70">一级团队(人)</div>
            </div>
            <div className="text-center py-3">
              <div className="text-2xl font-bold text-white mb-1">{data.team.level2}</div>
              <div className="text-xs text-white/70">二级团队(人)</div>
            </div>
          </div>
        </div>

        {/* 分销订单 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-bold text-white">分销订单</div>
            <Link href="/distribution/orders" className="text-sm text-white/70 flex items-center gap-1 hover:text-white transition-colors">
              <span>查看全部</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-white/70 mb-1">订单总数(单)</div>
              <div className="text-xl font-bold text-white">{data.orders.total}</div>
            </div>
            <div>
              <div className="text-xs text-white/70 mb-1">订单金额(元)</div>
              <div className="text-xl font-bold text-white">{data.orders.totalAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* 立即邀请好友按钮 */}
        <Link href="/share/poster" className="w-full py-4 font-medium rounded-xl transition-all duration-300 hover:scale-[0.98] active:scale-[0.96] block text-center" style={{ background: 'linear-gradient(to bottom right, #6366f1, #3b82f6, #10b981)' }}>
          <span className="text-white">立即邀请好友</span>
        </Link>
      </div>
    </MainLayout>
  )
}
