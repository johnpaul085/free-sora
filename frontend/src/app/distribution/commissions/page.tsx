'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { distributionApi } from '@/lib/api/distribution'
import { useAuthStore } from '@/store/authStore'

interface Commission {
  id: number
  amount: number
  commission_type: 'direct' | 'indirect'
  level: number
  status: 'pending' | 'available' | 'withdrawn' | 'cancelled'
  source_username?: string
  order_no?: string
  created_at: string
}

export default function CommissionsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    loadCommissions()
  }, [isAuthenticated, router, activeStatus, page])

  const loadCommissions = async () => {
    try {
      setLoading(true)
      const result = await distributionApi.getCommissions({
        page,
        pageSize: 20,
        status: activeStatus as any,
      })
      if (result && result.list) {
        setCommissions(result.list)
        setTotal(result.total)
      } else if (Array.isArray(result)) {
        setCommissions(result)
        setTotal(result.length)
      }
    } catch (error: any) {
      console.error('加载佣金明细失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载佣金明细失败',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">佣金明细</h1>
          <Link href="/distribution" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        {/* 状态筛选 */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveStatus(null)}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
              activeStatus === null
                ? 'bg-primary/20 text-primary border-primary'
                : 'bg-bg-secondary/80 text-text-secondary border-border/30 hover:bg-bg-tertiary/50'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setActiveStatus('pending')}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
              activeStatus === 'pending'
                ? 'bg-primary/20 text-primary border-primary'
                : 'bg-bg-secondary/80 text-text-secondary border-border/30 hover:bg-bg-tertiary/50'
            }`}
          >
            待结算
          </button>
          <button
            onClick={() => setActiveStatus('available')}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
              activeStatus === 'available'
                ? 'bg-primary/20 text-primary border-primary'
                : 'bg-bg-secondary/80 text-text-secondary border-border/30 hover:bg-bg-tertiary/50'
            }`}
          >
            可提现
          </button>
          <button
            onClick={() => setActiveStatus('withdrawn')}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
              activeStatus === 'withdrawn'
                ? 'bg-primary/20 text-primary border-primary'
                : 'bg-bg-secondary/80 text-text-secondary border-border/30 hover:bg-bg-tertiary/50'
            }`}
          >
            已提现
          </button>
        </div>

        {/* 佣金列表 */}
        <div className="space-y-3">
          {loading ? (
            <div className="card text-center py-12">
              <div className="text-white/50 text-sm">加载中...</div>
            </div>
          ) : commissions.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-white/50 text-sm">暂无佣金记录</div>
            </div>
          ) : (
            commissions.map((commission) => (
              <div key={commission.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-white">¥{Number(commission.amount).toFixed(2)}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        commission.status === 'available' ? 'bg-green-500/20 text-green-400' :
                        commission.status === 'withdrawn' ? 'bg-gray-700 text-white/70' :
                        commission.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {commission.status === 'available' ? '可提现' :
                         commission.status === 'withdrawn' ? '已提现' :
                         commission.status === 'pending' ? '待结算' : '已取消'}
                      </span>
                    </div>
                    <div className="text-sm text-white/70">
                      {commission.level === 1 ? '一级' : '二级'}佣金
                      {commission.source_username && ` · 来源: ${commission.source_username}`}
                      {commission.order_no && ` · 订单: ${commission.order_no}`}
                      {' · '}{new Date(commission.created_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  )
}
