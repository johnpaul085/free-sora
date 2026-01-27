'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { distributionApi } from '@/lib/api/distribution'
import { useAuthStore } from '@/store/authStore'

export default function WithdrawPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<'alipay' | 'wechat' | 'bank'>('alipay')
  const [accountInfo, setAccountInfo] = useState('')
  const [bankName, setBankName] = useState('')
  const [availableAmount, setAvailableAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    loadDistributionData()
  }, [isAuthenticated, router])

  const loadDistributionData = async () => {
    try {
      setLoading(true)
      const result = await distributionApi.getDistributionData()
      setAvailableAmount(result.commissions.available || 0)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || Number(amount) <= 0) {
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '请输入提现金额', type: 'warning' })
      }
      return
    }

    if (Number(amount) < 10) {
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '最低提现金额为¥10.00', type: 'warning' })
      }
      return
    }

    if (Number(amount) > availableAmount) {
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '提现金额超过可提现余额', type: 'warning' })
      }
      return
    }

    if (!accountInfo.trim()) {
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '请输入账户信息', type: 'warning' })
      }
      return
    }

    setSubmitting(true)
    try {
      await distributionApi.applyWithdraw({
        amount: Number(amount),
        method,
        accountInfo: method === 'bank' ? JSON.stringify({ account: accountInfo, bankName }) : accountInfo,
        bankName: method === 'bank' ? bankName : undefined,
      })

      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '提现申请已提交', type: 'success' })
      }

      router.push('/distribution/withdrawals')
    } catch (error: any) {
      console.error('提交提现申请失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '提交失败，请重试',
          type: 'error',
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">申请提现</h1>
          <Link href="/distribution" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        {/* 可提现金额 */}
        <div className="card">
          <div className="text-sm text-white/70 mb-1">可提现佣金</div>
          <div className="text-3xl font-bold text-white">
            {loading ? '加载中...' : `¥${availableAmount.toFixed(2)}`}
          </div>
        </div>

        {/* 提现表单 */}
        <form onSubmit={handleSubmit} className="card">
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">提现金额</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={availableAmount}
                min={10}
                step="0.01"
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                placeholder="最低提现金额 ¥10.00"
              />
              <div className="text-xs text-white/50 mt-1">手续费: 1%</div>
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">提现方式</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setMethod('alipay')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    method === 'alipay'
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-white/20 bg-gray-800 text-white hover:border-white/40'
                  }`}
                >
                  支付宝
                </button>
                <button
                  onClick={() => setMethod('wechat')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    method === 'wechat'
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-white/20 bg-gray-800 text-white hover:border-white/40'
                  }`}
                >
                  微信
                </button>
                <button
                  onClick={() => setMethod('bank')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    method === 'bank'
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-white/20 bg-gray-800 text-white hover:border-white/40'
                  }`}
                >
                  银行卡
                </button>
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">
                {method === 'alipay' ? '支付宝账号' : method === 'wechat' ? '微信账号' : '银行卡号'}
              </label>
              <input
                type="text"
                value={accountInfo}
                onChange={(e) => setAccountInfo(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                placeholder={`请输入${method === 'alipay' ? '支付宝账号' : method === 'wechat' ? '微信账号' : '银行卡号'}`}
              />
            </div>

            {method === 'bank' && (
              <div>
                <label className="block text-white/70 text-sm mb-2">开户行</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                  placeholder="请输入开户行名称"
                />
              </div>
            )}

            <div className="text-sm text-white/70">
              <div>提现金额: ¥{amount || '0.00'}</div>
              <div>手续费: ¥{(Number(amount) * 0.01).toFixed(2)}</div>
              <div className="text-white font-medium mt-1">
                实际到账: ¥{(Number(amount) * 0.99).toFixed(2)}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '提交申请'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
