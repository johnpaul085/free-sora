'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { userApi } from '@/lib/api/user'
import { uploadApi } from '@/lib/api/upload'
import { useAuthStore } from '@/store/authStore'
import ImageUploader from '@/components/UI/ImageUploader'

export default function SettingsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    phone: '',
    avatar: '',
  })
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    if (user) {
      setFormData({
        nickname: user.nickname || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar_url || '',
      })
      setLoading(false)
    } else {
      loadUserInfo()
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

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      await userApi.updateUserInfo({
        nickname: formData.nickname,
        email: formData.email,
        phone: formData.phone,
        avatar: formData.avatar,
      })
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '保存成功', type: 'success' })
      }
    } catch (error: any) {
      console.error('保存失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '保存失败，请重试',
          type: 'error',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '请填写完整信息', type: 'warning' })
      }
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '两次输入的密码不一致', type: 'warning' })
      }
      return
    }

    if (passwordData.newPassword.length < 6) {
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '密码至少6个字符', type: 'warning' })
      }
      return
    }

    try {
      setChangingPassword(true)
      await userApi.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      })
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '密码修改成功', type: 'success' })
      }
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: any) {
      console.error('修改密码失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '修改密码失败，请重试',
          type: 'error',
        })
      }
    } finally {
      setChangingPassword(false)
    }
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

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">设置</h1>
          <Link href="/profile" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        {/* 个人信息 */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">个人信息</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">昵称</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">邮箱</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">手机号</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">头像</label>
              <ImageUploader
                value={formData.avatar || undefined}
                onChange={async (file, preview) => {
                  if (file) {
                    try {
                      setSaving(true)
                      // 上传文件
                      const result = await uploadApi.uploadAvatar(file)
                      console.log('上传结果:', result)
                      
                      // 后端uploadAvatar接口返回 { avatar_url: '...' }
                      const avatarUrl = result?.avatar_url || result?.data?.avatar_url || preview
                      
                      if (avatarUrl && avatarUrl !== preview) {
                        // 更新表单数据
                        setFormData({ ...formData, avatar: avatarUrl })
                        
                        // 刷新用户信息（uploadAvatar接口已经更新了数据库）
                        await userApi.getUserInfo()
                        
                        if ((window as any).showToast) {
                          ;(window as any).showToast({
                            message: '头像上传成功',
                            type: 'success',
                          })
                        }
                      } else {
                        // 如果上传失败，使用预览图
                        setFormData({ ...formData, avatar: preview || '' })
                        if ((window as any).showToast) {
                          ;(window as any).showToast({
                            message: '上传失败，请重试',
                            type: 'error',
                          })
                        }
                      }
                    } catch (error: any) {
                      console.error('上传头像失败:', error)
                      if ((window as any).showToast) {
                        ;(window as any).showToast({
                          message: error.message || '上传头像失败',
                          type: 'error',
                        })
                      }
                    } finally {
                      setSaving(false)
                    }
                  } else {
                    // 清除头像
                    setFormData({ ...formData, avatar: '' })
                  }
                }}
                maxSize={2}
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        {/* 密码修改 */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">密码修改</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">当前密码</label>
              <input
                type="password"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                placeholder="请输入当前密码"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">新密码</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                placeholder="请输入新密码（至少6个字符）"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">确认新密码</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                placeholder="请再次输入新密码"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changingPassword ? '修改中...' : '修改密码'}
            </button>
          </div>
        </div>

        {/* 其他设置 */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">其他设置</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white">邮件通知</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">短信通知</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  )
}
