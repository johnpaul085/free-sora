'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { adminApi } from '@/lib/api/admin'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function AdminStatisticsPage() {
  const router = useRouter()
  const { user: currentUser, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<any>(null)

  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== 'admin') {
      router.push('/profile')
      return
    }
    loadStatistics()
  }, [isAuthenticated, currentUser, router])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const result = await adminApi.getStatistics()
      if (result) {
        setStatistics(result)
      }
    } catch (error: any) {
      console.error('加载统计数据失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载统计数据失败',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading || !statistics) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-white/50">加载中...</div>
        </div>
      </MainLayout>
    )
  }

  const { overview, userGrowth, orderStats } = statistics

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">数据统计</h1>
          <Link href="/profile" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        {/* 数据概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-white mb-1">{overview.totalUsers || 0}</div>
            <div className="text-sm text-white/70">总用户数</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-white mb-1">{overview.totalOrders || 0}</div>
            <div className="text-sm text-white/70">总订单数</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-white mb-1">¥{(overview.totalRevenue || 0).toFixed(2)}</div>
            <div className="text-sm text-white/70">总收入</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-white mb-1">{overview.totalWorks || 0}</div>
            <div className="text-sm text-white/70">总作品数</div>
          </div>
        </div>

        {/* 今日数据 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <div className="text-xl font-bold text-primary mb-1">{overview.todayNewUsers || 0}</div>
            <div className="text-sm text-white/70">今日新增用户</div>
          </div>
          <div className="card text-center">
            <div className="text-xl font-bold text-primary mb-1">{overview.todayNewOrders || 0}</div>
            <div className="text-sm text-white/70">今日订单数</div>
          </div>
          <div className="card text-center">
            <div className="text-xl font-bold text-primary mb-1">¥{(overview.todayTotalRevenue || 0).toFixed(2)}</div>
            <div className="text-sm text-white/70">今日收入</div>
          </div>
        </div>

        {/* 用户增长趋势 */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">用户增长趋势</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="month" stroke="#ffffff70" />
              <YAxis stroke="#ffffff70" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ color: '#ffffff70' }} />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6 }}
                name="用户数"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 订单统计 */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">订单统计</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={orderStats || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="month" stroke="#ffffff70" />
              <YAxis yAxisId="left" stroke="#ffffff70" />
              <YAxis yAxisId="right" orientation="right" stroke="#ffffff70" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ color: '#ffffff70' }} />
              <Bar yAxisId="left" dataKey="orders" fill="#6366f1" name="订单数" />
              <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="收入(元)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </MainLayout>
  )
}
