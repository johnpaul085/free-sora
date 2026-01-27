'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { userApi } from '@/lib/api/user'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/api/auth'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    // 如果store中没有用户信息，则从API获取
    if (!user) {
      loadUserInfo()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, user, router])

  const loadUserInfo = async () => {
    try {
      setLoading(true)
      await userApi.getUserInfo()
    } catch (error: any) {
      console.error('加载用户信息失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载用户信息失败',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await authApi.logout()
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: '已退出登录',
          type: 'success',
        })
      }
      router.push('/auth/login')
    } catch (error: any) {
      console.error('退出登录失败:', error)
      // 即使API失败，也清除本地状态
      useAuthStore.getState().logout()
      router.push('/auth/login')
    } finally {
      setLoggingOut(false)
    }
  }

  const getUserTypeText = () => {
    if (!user) return ''
    switch (user.user_type) {
      case 'svip':
        return 'SVIP'
      case 'vip':
        return 'VIP'
      default:
        return '普通用户'
    }
  }

  const getMembershipExpiresText = () => {
    if (!user || user.user_type === 'normal') return ''
    if (!user.membership_expires_at) return '永久有效'
    
    const expiresAt = new Date(user.membership_expires_at)
    const now = new Date()
    
    if (expiresAt <= now) {
      return '已过期'
    }
    
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 7) {
      return `剩余${daysLeft}天`
    }
    
    return `到期时间：${expiresAt.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}`
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

  if (!user) {
    return null
  }
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 用户信息区 */}
        <div className="flex items-center gap-4 pt-2">
          <div className="relative flex flex-col items-center">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.nickname || user.username}
                className="w-16 h-16 rounded-full object-cover shadow-lg shadow-primary/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-800/30">
                <span className="relative z-10">
                  {(user.nickname || user.username || 'A').charAt(0).toUpperCase()}
                </span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-800/20 to-blue-900/20 blur-xl"></div>
              </div>
            )}
            {user.user_type !== 'normal' && (
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
            <div className="text-xl font-bold text-text-primary mb-1">
              {user.nickname || user.username || '未设置昵称'}
            </div>
            <div className="text-sm text-text-tertiary">
              ID: {user.id} · <span className={user.user_type === 'svip' ? 'text-yellow-400' : user.user_type === 'vip' ? 'text-yellow-500' : ''}>{getUserTypeText()}</span>
              {user.user_type !== 'normal' && (
                <span className="ml-2 text-xs text-text-tertiary/70">
                  {getMembershipExpiresText()}
                </span>
              )}
            </div>
          </div>
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary border border-border-primary rounded-lg hover:bg-bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loggingOut ? '退出中...' : '退出登录'}
            </button>
          )}
        </div>

        {/* 会员/算力区 */}
        <div className="rounded-2xl overflow-hidden shadow-lg">
          {/* 上部分：白色到黄色渐变背景 */}
          <div className="relative p-5 overflow-hidden" style={{ background: 'linear-gradient(to bottom left, #ffffff, #fef3c7, #fbbf24)' }}>
            {/* 装饰线条 */}
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
                  </linearGradient>
                </defs>
                {/* 水平线条 */}
                <line x1="0" y1="30" x2="400" y2="30" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="0" y1="60" x2="400" y2="60" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="0" y1="90" x2="400" y2="90" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="0" y1="120" x2="400" y2="120" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="0" y1="150" x2="400" y2="150" stroke="url(#lineGradient)" strokeWidth="1" />
                {/* 垂直线条 */}
                <line x1="50" y1="0" x2="50" y2="200" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="100" y1="0" x2="100" y2="200" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="150" y1="0" x2="150" y2="200" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="200" y1="0" x2="200" y2="200" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="250" y1="0" x2="250" y2="200" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="300" y1="0" x2="300" y2="200" stroke="url(#lineGradient)" strokeWidth="1" />
                <line x1="350" y1="0" x2="350" y2="200" stroke="url(#lineGradient)" strokeWidth="1" />
              </svg>
            </div>
            {/* 右侧金黄色皇冠装饰 */}
            <div className="absolute top-2 right-2 w-20 h-20">
              <div className="relative w-full h-full">
                {/* 光晕效果 */}
                <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl"></div>
                {/* 皇冠图标 */}
                <svg className="relative w-full h-full" viewBox="0 0 24 24" fill="none">
                  <defs>
                    <linearGradient id="crownGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                  </defs>
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" fill="url(#crownGradient)" stroke="url(#crownGradient)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 16h6" stroke="url(#crownGradient)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="relative z-10">
              <Link href="/membership" className="relative z-20 text-gray-800 font-bold text-lg mb-2 cursor-pointer hover:opacity-80 transition-opacity inline-block">
                视频算力<span className="text-gray-700">【点击这里进入获取】</span>
              </Link>
              <div className="text-sm text-gray-700">开通会员即享受分佣权益</div>
            </div>
          </div>
          
          {/* 下部分：灰色背景 */}
          <div className="bg-gray-700 p-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                <div className="text-xl font-bold text-white mb-1">{user.total_computing_power || 0}</div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-white/80">累计生成</span>
                  <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                <div className="text-xl font-bold text-white mb-1">{user.computing_power || 0}</div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-white/80">我的算力</span>
                  <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                <div className="text-xl font-bold text-white mb-1">{user.hd_count || 0}</div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-white/80">高清次数</span>
                  <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                <div className="text-xl font-bold text-white mb-1">{user.gifted_computing_power || 0}</div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-white/80">赠送算力</span>
                  <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 管理员功能区域 */}
        {user.role === 'admin' && (
          <div className="space-y-3">
            <div className="text-sm text-text-tertiary mb-2 px-1">管理员功能</div>
            {[
              { icon: '👥', label: '用户管理', href: '/admin/users' },
              { icon: '⚙️', label: 'API接口设置', href: '/admin/api-config' },
              { icon: '🔧', label: '系统配置', href: '/admin/system-config' },
              { icon: '📦', label: '订单管理', href: '/admin/orders' },
              { icon: '💰', label: '佣金管理', href: '/admin/commissions' },
              { icon: '📊', label: '数据统计', href: '/admin/statistics' },
              { icon: '✅', label: '内容审核', href: '/admin/content-review' },
              { icon: '🎫', label: '卡密管理', href: '/admin/cards' },
              { icon: '📝', label: '操作日志', href: '/admin/logs' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="w-full card-hover flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="font-medium text-text-primary">{item.label}</span>
                </div>
                <svg className="w-5 h-5 text-text-tertiary group-hover:text-text-secondary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}

        {/* 功能列表 */}
        <div className="space-y-3">
          <div className="text-sm text-text-tertiary mb-2 px-1">个人功能</div>
          {[
            { icon: '🗑️', label: '清理缓存', href: '#' },
            { icon: '📁', label: '我的作品', href: '/works' },
            { icon: '🎭', label: '我的角色', href: '/characters' },
            { icon: '🌐', label: '分销中心', href: '/distribution' },
            { icon: '⚙️', label: '设置', href: '/settings' },
            { icon: '📤', label: '分享海报', href: '/share/poster' },
            { icon: '🎫', label: '卡密兑换', href: '/redeem' },
          ].map((item) => {
            if (item.href === '#') {
              return (
                <button
                  key={item.label}
                  className="w-full card-hover flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="font-medium text-text-primary">{item.label}</span>
                  </div>
                  <svg className="w-5 h-5 text-text-tertiary group-hover:text-text-secondary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                className="w-full card-hover flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="font-medium text-text-primary">{item.label}</span>
                </div>
                <svg className="w-5 h-5 text-text-tertiary group-hover:text-text-secondary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )
          })}
        </div>

        {/* 联系客服按钮 */}
        <Link href="/contact" className="w-full py-3.5 font-medium rounded-xl transition-all duration-300 hover:scale-[0.98] active:scale-[0.96] block text-center" style={{ background: 'linear-gradient(to bottom right, #ffffff, #fef3c7, #fbbf24)' }}>
          <span className="text-gray-800">联系客服</span>
        </Link>
      </div>
    </MainLayout>
  )
}
