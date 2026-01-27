'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/store/authStore'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空'
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少3个字符'
    }

    if (!formData.email.trim()) {
      newErrors.email = '邮箱不能为空'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确'
    }

    if (!formData.password) {
      newErrors.password = '密码不能为空'
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6个字符'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const result = await authApi.register({
        username: formData.username,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        referralCode: formData.referralCode || undefined,
      })

      // 保存token和用户信息
      if (result.token && result.user) {
        useAuthStore.getState().login(result.user, result.token)
        
        if ((window as any).showToast) {
          ;(window as any).showToast({ message: '注册成功', type: 'success' })
        }
        
        // 跳转到首页
        router.push('/home')
      }
    } catch (error: any) {
      console.error('注册失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '注册失败，请重试',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-180px)] flex items-center justify-center pb-4">
        <div className="w-full max-w-md">
          <div className="card p-6">
            <h1 className="text-2xl font-bold text-white mb-6 text-center">用户注册</h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">用户名</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value })
                    if (errors.username) setErrors({ ...errors, username: '' })
                  }}
                  className={`w-full px-4 py-3 rounded-lg bg-gray-800 border text-white placeholder-white/50 focus:outline-none ${
                    errors.username ? 'border-red-500' : 'border-white/20 focus:border-primary'
                  }`}
                  placeholder="请输入用户名"
                />
                {errors.username && (
                  <div className="text-red-500 text-xs mt-1">{errors.username}</div>
                )}
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">邮箱</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (errors.email) setErrors({ ...errors, email: '' })
                  }}
                  className={`w-full px-4 py-3 rounded-lg bg-gray-800 border text-white placeholder-white/50 focus:outline-none ${
                    errors.email ? 'border-red-500' : 'border-white/20 focus:border-primary'
                  }`}
                  placeholder="请输入邮箱"
                />
                {errors.email && (
                  <div className="text-red-500 text-xs mt-1">{errors.email}</div>
                )}
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">手机号（可选）</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                  placeholder="请输入手机号"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">密码</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (errors.password) setErrors({ ...errors, password: '' })
                  }}
                  className={`w-full px-4 py-3 rounded-lg bg-gray-800 border text-white placeholder-white/50 focus:outline-none ${
                    errors.password ? 'border-red-500' : 'border-white/20 focus:border-primary'
                  }`}
                  placeholder="请输入密码"
                />
                {errors.password && (
                  <div className="text-red-500 text-xs mt-1">{errors.password}</div>
                )}
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">确认密码</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value })
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' })
                  }}
                  className={`w-full px-4 py-3 rounded-lg bg-gray-800 border text-white placeholder-white/50 focus:outline-none ${
                    errors.confirmPassword ? 'border-red-500' : 'border-white/20 focus:border-primary'
                  }`}
                  placeholder="请再次输入密码"
                />
                {errors.confirmPassword && (
                  <div className="text-red-500 text-xs mt-1">{errors.confirmPassword}</div>
                )}
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">推荐码（可选）</label>
                <input
                  type="text"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                  placeholder="请输入推荐码"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '注册中...' : '注册'}
              </button>

              <div className="text-center text-white/70 text-sm">
                已有账号？
                <Link href="/auth/login" className="text-primary hover:text-primary/80 ml-1">
                  立即登录
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
