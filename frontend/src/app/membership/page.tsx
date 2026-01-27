'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { userApi } from '@/lib/api/user'

export default function MembershipPage() {
  const { user } = useAuthStore()
  const [selectedPlan, setSelectedPlan] = useState<'lifetime' | 'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 页面加载时刷新用户信息
    if (user) {
      userApi.getUserInfo().catch(console.error)
    }
  }, [])

  const getUserDisplayName = () => {
    if (!user) return '未登录'
    return user.nickname || user.username || `用户${user.id}`
  }

  const getUserTypeText = () => {
    if (!user) return '你还未开通会员'
    switch (user.user_type) {
      case 'svip':
        return 'SVIP会员'
      case 'vip':
        return 'VIP会员'
      default:
        return '你还未开通会员'
    }
  }

  const handlePurchase = async () => {
    try {
      setLoading(true)
      await userApi.purchaseMembership(selectedPlan)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: '购买成功！会员信息已更新',
          type: 'success',
        })
      }
    } catch (error: any) {
      console.error('购买会员失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '购买失败，请重试',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const plans = {
    lifetime: {
      title: '终身会员',
      desc: '永久不过期',
      price: 299.98,
      originalPrice: 899.99,
    },
    monthly: {
      title: '月卡会员',
      desc: '一月代理特权',
      price: 19.98,
      originalPrice: 59.99,
    },
    yearly: {
      title: '年卡会员',
      desc: '一年代理特权',
      price: 99.98,
      originalPrice: 299.99,
    },
  }

  const benefits = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: '视频算力2000点',
      desc: '包含2000点免费算力',
    },
    {
      icon: (
        <div className="w-6 h-6 flex items-center justify-center border-2 border-current rounded">
          <span className="text-xs font-bold">HD</span>
        </div>
      ),
      title: '视频高清1次',
      desc: '高清视频生成次数',
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6 pb-4">
        {/* 用户信息横幅 */}
        <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: 'linear-gradient(to right, #ffffff, #fef3c7, #fbbf24)' }}>
          {/* 装饰线条 */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradientMembership" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
                </linearGradient>
              </defs>
              <line x1="0" y1="30" x2="400" y2="30" stroke="url(#lineGradientMembership)" strokeWidth="1" />
              <line x1="0" y1="60" x2="400" y2="60" stroke="url(#lineGradientMembership)" strokeWidth="1" />
              <line x1="0" y1="90" x2="400" y2="90" stroke="url(#lineGradientMembership)" strokeWidth="1" />
              <line x1="0" y1="120" x2="400" y2="120" stroke="url(#lineGradientMembership)" strokeWidth="1" />
            </svg>
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="relative flex flex-col items-center">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={getUserDisplayName()}
                  className="w-16 h-16 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  <span className="relative z-10">{getUserDisplayName().charAt(0).toUpperCase()}</span>
                </div>
              )}
              {user?.user_type && user.user_type !== 'normal' && (
                <div className={`absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md whitespace-nowrap ${
                  user.user_type === 'svip' 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 border border-amber-300/60' 
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 border border-amber-300/60'
                }`}>
                  {user.user_type === 'svip' && (
                    <svg className="w-2.5 h-2.5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                  <span className={`text-[10px] font-semibold ${
                    user.user_type === 'svip' ? 'text-gray-900' : 'text-gray-900'
                  }`}>
                    {user.user_type === 'svip' ? 'SVIP' : 'VIP'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-gray-800 mb-1">{getUserDisplayName()}</div>
              <div className="text-sm text-gray-700">{getUserTypeText()}</div>
            </div>
          </div>
        </div>

        {/* 代理分佣权限提示 */}
        <div className="text-center text-white/80 text-sm">
          开通后自动获取代理分佣权限
        </div>

        {/* 会员套餐卡片 */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(plans).map(([key, plan]) => {
            const isSelected = selectedPlan === key
            return (
              <button
                key={key}
                onClick={() => setSelectedPlan(key as 'lifetime' | 'monthly' | 'yearly')}
                className={`relative rounded-xl p-4 transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500 shadow-lg shadow-yellow-500/30 scale-105'
                    : 'bg-gray-800 border border-white/20 hover:border-white/40'
                }`}
              >
                <div className={`text-sm font-bold mb-1 ${isSelected ? 'text-gray-800' : 'text-white'}`}>
                  {plan.title}
                </div>
                <div className={`text-xs mb-3 ${isSelected ? 'text-gray-700' : 'text-white/70'}`}>
                  {plan.desc}
                </div>
                <div className={`text-xl font-bold mb-1 ${isSelected ? 'text-gray-800' : 'text-white'}`}>
                  ¥{plan.price.toFixed(2)}
                </div>
                <div className={`text-xs line-through ${isSelected ? 'text-gray-600' : 'text-white/50'}`}>
                  ¥{plan.originalPrice.toFixed(2)}
                </div>
                {key === 'yearly' && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* 立即开通按钮 */}
        <button
          onClick={handlePurchase}
          disabled={loading || !user}
          className="w-full py-4 font-medium rounded-xl transition-all duration-300 hover:scale-[0.98] active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(to right, #fbbf24, #f59e0b, #f97316)' }}
        >
          <span className="text-white">
            {loading ? '处理中...' : `¥${plans[selectedPlan].price.toFixed(2)} 立即开通`}
          </span>
        </button>

        {/* 服务协议 */}
        <div className="text-center text-xs text-white/60">
          开通会员代表接受
          <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline">
            《服务协议》
          </Link>
        </div>

        {/* 联系客服按钮 */}
        <Link
          href="/contact"
          className="w-full py-3.5 font-medium rounded-xl transition-all duration-300 hover:scale-[0.98] active:scale-[0.96] block text-center"
          style={{ background: 'linear-gradient(to right, #fbbf24, #f59e0b)' }}
        >
          <span className="text-white">联系人工客服</span>
        </Link>

        {/* 分隔线 */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-bg-primary px-4 text-sm text-white/60">开通后包含以下特权算力</span>
          </div>
        </div>

        {/* 特权算力列表 */}
        <div className="space-y-3">
          {benefits.map((benefit, index) => (
            <div key={index} className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary">
                {benefit.icon}
              </div>
              <div className="flex-1">
                <div className="text-white font-medium mb-1">{benefit.title}</div>
                <div className="text-xs text-white/70">{benefit.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
