'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { adminApi } from '@/lib/api/admin'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

export default function AdminSystemConfigPage() {
  const router = useRouter()
  const { user: currentUser, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configs, setConfigs] = useState({
    // 分销配置
    commission_rate_level1: 0.10,
    commission_rate_level2: 0.05,
    min_withdrawal_amount: 10.00,
    withdrawal_fee_rate: 0.01,
    // 算力配置
    computing_power_text2img: 10,
    computing_power_img2img: 15,
    computing_power_text2video: 50,
    computing_power_img2video: 60,
    // 会员配置
    vip_price: 19.98,
    svip_price: 99.98,
  })

  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== 'admin') {
      router.push('/profile')
      return
    }
    loadConfigs()
  }, [isAuthenticated, currentUser, router])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const result = await adminApi.getSystemConfigs()
      if (result) {
        // 合并配置
        setConfigs((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(result).map(([key, value]: [string, any]) => [
              key,
              value.value !== undefined ? value.value : prev[key as keyof typeof prev],
            ])
          ),
        }))
      }
    } catch (error: any) {
      console.error('加载系统配置失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载配置失败',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await adminApi.updateSystemConfigs(configs)
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '配置保存成功', type: 'success' })
      }
    } catch (error: any) {
      console.error('保存配置失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '保存失败',
          type: 'error',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-white/50">加载中...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">系统配置</h1>
          <Link href="/profile" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        {/* 分销配置 */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">分销配置</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-white/70">一级佣金比例</label>
              <input
                type="number"
                value={configs.commission_rate_level1}
                onChange={(e) => setConfigs((prev) => ({ ...prev, commission_rate_level1: Number(e.target.value) }))}
                step="0.01"
                min="0"
                max="1"
                className="w-32 px-3 py-2 rounded bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-white/70">二级佣金比例</label>
              <input
                type="number"
                value={configs.commission_rate_level2}
                onChange={(e) => setConfigs((prev) => ({ ...prev, commission_rate_level2: Number(e.target.value) }))}
                step="0.01"
                min="0"
                max="1"
                className="w-32 px-3 py-2 rounded bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-white/70">最低提现金额</label>
              <input
                type="number"
                value={configs.min_withdrawal_amount}
                onChange={(e) => setConfigs((prev) => ({ ...prev, min_withdrawal_amount: Number(e.target.value) }))}
                step="0.01"
                min="0"
                className="w-32 px-3 py-2 rounded bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-white/70">提现手续费率</label>
              <input
                type="number"
                value={configs.withdrawal_fee_rate}
                onChange={(e) => setConfigs((prev) => ({ ...prev, withdrawal_fee_rate: Number(e.target.value) }))}
                step="0.01"
                min="0"
                max="1"
                className="w-32 px-3 py-2 rounded bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* 算力配置 */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">算力配置</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-white/70">文生图消耗算力</label>
              <input
                type="number"
                value={configs.computing_power_text2img}
                onChange={(e) => setConfigs((prev) => ({ ...prev, computing_power_text2img: Number(e.target.value) }))}
                min="0"
                className="w-32 px-3 py-2 rounded bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-white/70">图生图消耗算力</label>
              <input
                type="number"
                value={configs.computing_power_img2img}
                onChange={(e) => setConfigs((prev) => ({ ...prev, computing_power_img2img: Number(e.target.value) }))}
                min="0"
                className="w-32 px-3 py-2 rounded bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-white/70">文生视频消耗算力</label>
              <input
                type="number"
                value={configs.computing_power_text2video}
                onChange={(e) => setConfigs((prev) => ({ ...prev, computing_power_text2video: Number(e.target.value) }))}
                min="0"
                className="w-32 px-3 py-2 rounded bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-white/70">图生视频消耗算力</label>
              <input
                type="number"
                value={configs.computing_power_img2video}
                onChange={(e) => setConfigs((prev) => ({ ...prev, computing_power_img2video: Number(e.target.value) }))}
                min="0"
                className="w-32 px-3 py-2 rounded bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* 会员配置 */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">会员配置</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-white/70">VIP会员价格</label>
              <input
                type="number"
                value={configs.vip_price}
                onChange={(e) => setConfigs((prev) => ({ ...prev, vip_price: Number(e.target.value) }))}
                step="0.01"
                min="0"
                className="w-32 px-3 py-2 rounded bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-white/70">SVIP会员价格</label>
              <input
                type="number"
                value={configs.svip_price}
                onChange={(e) => setConfigs((prev) => ({ ...prev, svip_price: Number(e.target.value) }))}
                step="0.01"
                min="0"
                className="w-32 px-3 py-2 rounded bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
