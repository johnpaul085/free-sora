'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { userApi } from '@/lib/api/user'
import { useAuthStore } from '@/store/authStore'

export default function RedeemPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code.trim()) {
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '请输入卡密', type: 'warning' })
      }
      return
    }

    setLoading(true)
    try {
      const result = await userApi.redeemCode(code.trim())
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: result.message || '兑换成功',
          type: 'success',
        })
      }
      setCode('')
      // 刷新用户信息
      await userApi.getUserInfo()
    } catch (error: any) {
      console.error('兑换失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '兑换失败，请检查卡密是否正确',
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
          <h1 className="text-2xl font-bold text-white">卡密兑换</h1>
          <Link href="/profile" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        <form onSubmit={handleRedeem} className="card">
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">卡密</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                placeholder="请输入卡密"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '兑换中...' : '兑换'}
            </button>
          </div>
        </form>

        <div className="card">
          <div className="text-sm text-white/70 space-y-2">
            <div className="font-medium text-white mb-2">兑换说明</div>
            <div>• 卡密可用于兑换算力、会员等</div>
            <div>• 每个卡密只能使用一次</div>
            <div>• 如有问题请联系客服</div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
