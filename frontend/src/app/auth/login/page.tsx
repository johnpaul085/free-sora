'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { authApi } from '@/lib/api/auth'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
    rememberMe: false,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.emailOrPhone.trim()) {
      newErrors.emailOrPhone = '邮箱或手机号不能为空'
    }

    if (!formData.password) {
      newErrors.password = '密码不能为空'
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
      await authApi.login({
        emailOrPhone: formData.emailOrPhone,
        password: formData.password,
        rememberMe: formData.rememberMe,
      })

      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '登录成功', type: 'success' })
      }

      // 跳转到首页
      router.push('/home')
    } catch (error: any) {
      console.error('登录失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '登录失败，请检查用户名和密码',
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
            <h1 className="text-2xl font-bold text-white mb-6 text-center">用户登录</h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">邮箱/手机号/用户名</label>
                <input
                  type="text"
                  value={formData.emailOrPhone}
                  onChange={(e) => {
                    setFormData({ ...formData, emailOrPhone: e.target.value })
                    if (errors.emailOrPhone) setErrors({ ...errors, emailOrPhone: '' })
                  }}
                  className={`w-full px-4 py-3 rounded-lg bg-gray-800 border text-white placeholder-white/50 focus:outline-none ${
                    errors.emailOrPhone ? 'border-red-500' : 'border-white/20 focus:border-primary'
                  }`}
                  placeholder="请输入邮箱、手机号或用户名"
                />
                {errors.emailOrPhone && (
                  <div className="text-red-500 text-xs mt-1">{errors.emailOrPhone}</div>
                )}
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

              <div className="flex items-center justify-between">
                <label className="flex items-center text-white/70 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="mr-2"
                  />
                  记住我
                </label>
                <Link href="/auth/forgot-password" className="text-primary hover:text-primary/80 text-sm">
                  忘记密码？
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '登录中...' : '登录'}
              </button>

              <div className="text-center text-white/70 text-sm">
                还没有账号？
                <Link href="/auth/register" className="text-primary hover:text-primary/80 ml-1">
                  立即注册
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
