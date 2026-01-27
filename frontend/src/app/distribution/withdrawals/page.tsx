'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { distributionApi } from '@/lib/api/distribution'
import { useAuthStore } from '@/store/authStore'

interface Withdrawal {
  id: number
  amount: number
  withdrawal_method: 'alipay' | 'wechat' | 'bank'
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled'
  reject_reason?: string
  processed_at?: string
  transaction_no?: string
  created_at: string
}

export default function WithdrawalsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    loadWithdrawals()
  }, [isAuthenticated, router, activeStatus])

  const loadWithdrawals = async () => {
    try {
      setLoading(true)
      const result = await distributionApi.getWithdrawals({
        page: 1,
        pageSize: 100,
        status: activeStatus as any,
      })
      if (result && result.list) {
        setWithdrawals(result.list)
      } else if (Array.isArray(result)) {
        setWithdrawals(result)
      }
    } catch (error: any) {
      console.error('加载提现记录失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载提现记录失败',
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
          <h1 className="text-xl font-bold text-white">提现记录</h1>
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
            待处理
          </button>
          <button
            onClick={() => setActiveStatus('processing')}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
              activeStatus === 'processing'
                ? 'bg-primary/20 text-primary border-primary'
                : 'bg-bg-secondary/80 text-text-secondary border-border/30 hover:bg-bg-tertiary/50'
            }`}
          >
            处理中
          </button>
          <button
            onClick={() => setActiveStatus('completed')}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
              activeStatus === 'completed'
                ? 'bg-primary/20 text-primary border-primary'
                : 'bg-bg-secondary/80 text-text-secondary border-border/30 hover:bg-bg-tertiary/50'
            }`}
          >
            已完成
          </button>
          <button
            onClick={() => setActiveStatus('rejected')}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
              activeStatus === 'rejected'
                ? 'bg-primary/20 text-primary border-primary'
                : 'bg-bg-secondary/80 text-text-secondary border-border/30 hover:bg-bg-tertiary/50'
            }`}
          >
            已拒绝
          </button>
        </div>

        {/* 提现记录列表 */}
        <div className="space-y-3">
          {loading ? (
            <div className="card text-center py-12">
              <div className="text-white/50 text-sm">加载中...</div>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-white/50 text-sm">暂无提现记录</div>
            </div>
          ) : (
            withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-lg font-bold text-white">¥{Number(withdrawal.amount).toFixed(2)}</div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    withdrawal.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    withdrawal.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                    withdrawal.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    withdrawal.status === 'pending' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-700 text-white/70'
                  }`}>
                    {withdrawal.status === 'completed' ? '已完成' :
                     withdrawal.status === 'processing' ? '处理中' :
                     withdrawal.status === 'rejected' ? '已拒绝' :
                     withdrawal.status === 'pending' ? '待处理' : '已取消'}
                  </span>
                </div>
                <div className="text-sm text-white/70">
                  {withdrawal.withdrawal_method === 'alipay' ? '支付宝' :
                   withdrawal.withdrawal_method === 'wechat' ? '微信' : '银行卡'}
                </div>
                <div className="text-xs text-white/50 mt-1">
                  申请时间: {new Date(withdrawal.created_at).toLocaleString('zh-CN')}
                  {withdrawal.processed_at && ` · 处理时间: ${new Date(withdrawal.processed_at).toLocaleString('zh-CN')}`}
                </div>
                {withdrawal.transaction_no && (
                  <div className="text-xs text-white/50 mt-1">交易单号: {withdrawal.transaction_no}</div>
                )}
                {withdrawal.reject_reason && (
                  <div className="text-xs text-red-400 mt-1">拒绝原因: {withdrawal.reject_reason}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  )
}
