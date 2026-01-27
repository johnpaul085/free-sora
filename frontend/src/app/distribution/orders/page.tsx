'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { distributionApi } from '@/lib/api/distribution'
import { useAuthStore } from '@/store/authStore'

interface Order {
  id: number
  order_no: string
  order_user_name?: string
  amount: number
  order_type: 'recharge' | 'vip' | 'svip' | 'computing_power'
  status: 'pending' | 'paid' | 'completed' | 'cancelled' | 'refunded'
  created_at: string
}

export default function DistributionOrdersPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    loadOrders()
  }, [isAuthenticated, router])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const result = await distributionApi.getOrders({
        page: 1,
        pageSize: 100,
      })
      if (result && result.list) {
        setOrders(result.list)
      } else if (Array.isArray(result)) {
        setOrders(result)
      }
    } catch (error: any) {
      console.error('加载分销订单失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载分销订单失败',
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
          <h1 className="text-xl font-bold text-white">分销订单</h1>
          <Link href="/distribution" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="card text-center py-12">
              <div className="text-white/50 text-sm">加载中...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-white/50 text-sm">暂无分销订单</div>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-medium">{order.order_user_name || '未知用户'}</span>
                      <span className="text-sm text-white/70">订单号: {order.order_no}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.status === 'paid' || order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-700 text-white/70'
                      }`}>
                        {order.status === 'paid' ? '已支付' :
                         order.status === 'completed' ? '已完成' :
                         order.status === 'pending' ? '待支付' :
                         order.status === 'cancelled' ? '已取消' : '已退款'}
                      </span>
                    </div>
                    <div className="text-sm text-white/70 mb-1">
                      {order.order_type === 'vip' ? 'VIP会员' :
                       order.order_type === 'svip' ? 'SVIP会员' :
                       order.order_type === 'recharge' ? '充值' : '算力'} · ¥{Number(order.amount).toFixed(2)}
                    </div>
                    <div className="text-xs text-white/50">
                      {new Date(order.created_at).toLocaleString('zh-CN')}
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
