'use client'

import { useState, useEffect, useRef } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { adminApi } from '@/lib/api/admin'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import Modal from '@/components/UI/Modal'

interface ApiConfig {
  id: number
  provider_name: string
  provider_type: 'image' | 'video' | 'assistant'
  api_key?: string
  api_url?: string
  models?: string[]
  is_active: boolean
  priority: number
  rate_limit?: number
  config?: object
  has_api_key?: boolean
  created_at?: string
  updated_at?: string
}

export default function AdminApiConfigPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [configs, setConfigs] = useState<ApiConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ApiConfig | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [testingId, setTestingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    provider_name: '',
    provider_type: 'video' as 'image' | 'video' | 'assistant',
    api_key: '',
    api_url: '',
    models: [] as string[],
    is_active: true,
    priority: 0,
    rate_limit: '',
    modelInput: '', // 临时输入框
  })
  const [saving, setSaving] = useState(false)
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    // 防止重复初始化
    if (hasInitializedRef.current) return

    if (!isAuthenticated) {
      // 等待认证状态稳定
      return
    }

    if (user?.role !== 'admin') {
      router.push('/profile')
      hasInitializedRef.current = true
      return
    }

    hasInitializedRef.current = true
    loadConfigs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const result = await adminApi.getApiConfigs()
      // 确保models字段是数组
      const processedResult = (result || []).map((config: any) => ({
        ...config,
        models: Array.isArray(config.models) ? config.models : (config.models ? [config.models] : []),
      }))
      setConfigs(processedResult)
    } catch (error: any) {
      console.error('加载API配置失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载配置列表失败',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setFormData({
      provider_name: '',
      provider_type: 'video',
      api_key: '',
      api_url: '',
      models: [],
      is_active: true,
      priority: 0,
      rate_limit: '',
      modelInput: '',
    })
    setEditingConfig(null)
    setIsAddModalOpen(true)
  }

  const handleEdit = async (config: ApiConfig) => {
    try {
      const detail = await adminApi.getApiConfigById(config.id)
      // 确保models是数组
      const modelsArray = Array.isArray(detail.models) ? detail.models : (detail.models ? [detail.models] : [])
      setFormData({
        provider_name: detail.provider_name || '',
        provider_type: detail.provider_type || 'video',
        api_key: '', // 不显示已有密钥，需要重新输入
        api_url: detail.api_url || '',
        models: modelsArray,
        is_active: detail.is_active !== false,
        priority: detail.priority || 0,
        rate_limit: detail.rate_limit?.toString() || '',
        modelInput: modelsArray.join(', '),
      })
      setEditingConfig(detail)
      setIsAddModalOpen(true)
    } catch (error: any) {
      console.error('获取配置详情失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '获取配置详情失败',
          type: 'error',
        })
      }
    }
  }

  const handleSave = async () => {
    if (!formData.provider_name.trim()) {
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: '请输入服务商名称',
          type: 'error',
        })
      }
      return
    }

    try {
      setSaving(true)

      // 处理模型列表
      const models = formData.modelInput
        .split(',')
        .map(m => m.trim())
        .filter(m => m.length > 0)

      const data: any = {
        provider_name: formData.provider_name.trim(),
        provider_type: formData.provider_type,
        api_url: formData.api_url.trim() || undefined,
        models: models.length > 0 ? models : undefined,
        is_active: formData.is_active,
        priority: formData.priority || 0,
        rate_limit: formData.rate_limit ? parseInt(formData.rate_limit) : undefined,
      }

      // 只有在输入了新密钥时才更新
      if (formData.api_key.trim()) {
        data.api_key = formData.api_key.trim()
      }

      if (editingConfig) {
        await adminApi.updateApiConfig(editingConfig.id, data)
        if ((window as any).showToast) {
          ;(window as any).showToast({
            message: '更新成功',
            type: 'success',
          })
        }
      } else {
        if (!formData.api_key.trim()) {
          if ((window as any).showToast) {
            ;(window as any).showToast({
              message: '请输入API密钥',
              type: 'error',
            })
          }
          setSaving(false)
          return
        }
        await adminApi.createApiConfig(data)
        if ((window as any).showToast) {
          ;(window as any).showToast({
            message: '创建成功',
            type: 'success',
          })
        }
      }

      setIsAddModalOpen(false)
      setEditingConfig(null)
      loadConfigs()
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

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个配置吗？')) return

    try {
      await adminApi.deleteApiConfig(id)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: '删除成功',
          type: 'success',
        })
      }
      loadConfigs()
    } catch (error: any) {
      console.error('删除配置失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '删除失败',
          type: 'error',
        })
      }
    }
  }

  const handleTest = async (id: number) => {
    try {
      setTestingId(id)
      const result = await adminApi.testApiConfig(id)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: result.message || '测试成功',
          type: 'success',
        })
      }
    } catch (error: any) {
      console.error('测试失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '测试失败',
          type: 'error',
        })
      }
    } finally {
      setTestingId(null)
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'image':
        return '图片生成'
      case 'video':
        return '视频生成'
      case 'assistant':
        return 'AI助手'
      default:
        return type
    }
  }

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">API接口设置</h1>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-primary/80 text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              添加服务商
            </button>
            <Link href="/profile" className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
              返回
            </Link>
          </div>
        </div>

        {/* 服务商列表 */}
        <div className="space-y-3">
          {loading ? (
            <div className="card py-8 text-center text-white/50">
              加载中...
            </div>
          ) : configs.length === 0 ? (
            <div className="card py-8 text-center text-white/50">
              暂无配置，点击"添加服务商"创建
            </div>
          ) : (
            configs.map((config) => (
              <div key={config.id} className="card p-4">
                <div className="space-y-3">
                  {/* 头部信息 */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-white">{config.provider_name}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${
                          config.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-gray-700 text-white/70 border border-gray-600/50'
                        }`}>
                          {config.is_active ? '启用' : '禁用'}
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-primary/20 text-primary border border-primary/50">
                          {getTypeText(config.provider_type)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          config.has_api_key ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'
                        }`}>
                          {config.has_api_key ? '✓ 已配置API密钥' : '✗ 未配置API密钥'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 详细信息 */}
                  <div className="space-y-2 text-sm">
                    {config.models && config.models.length > 0 && (
                      <div className="text-white/70">
                        <span className="text-white/50">支持的模型:</span> {config.models.join(', ')}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-white/70">
                      <span>优先级: <span className="text-white">{config.priority}</span></span>
                      {config.api_url && (
                        <span>API地址: <span className="text-white break-all">{config.api_url}</span></span>
                      )}
                      {config.rate_limit && (
                        <span>速率限制: <span className="text-white">{config.rate_limit}</span>/分钟</span>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleEdit(config)}
                      className="flex-1 px-3 py-2 bg-primary/20 text-primary border border-primary/50 rounded-lg hover:bg-primary/30 transition-colors text-sm"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleTest(config.id)}
                      disabled={testingId === config.id}
                      className="flex-1 px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 text-sm"
                    >
                      {testingId === config.id ? '测试中...' : '测试'}
                    </button>
                    <button
                      onClick={() => handleDelete(config.id)}
                      className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 添加/编辑弹窗 */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false)
            setEditingConfig(null)
          }}
          title={editingConfig ? '编辑服务商' : '添加服务商'}
          size="md"
        >
          <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/70 mb-1">服务商名称 *</label>
                <input
                  type="text"
                  value={formData.provider_name}
                  onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                  placeholder="如：OpenAI"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">服务商类型 *</label>
                <select
                  value={formData.provider_type}
                  onChange={(e) => setFormData({ ...formData, provider_type: e.target.value as 'image' | 'video' | 'assistant' })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
                >
                  <option value="image">图片生成</option>
                  <option value="video">视频生成</option>
                  <option value="assistant">AI助手</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">
                API密钥 {editingConfig ? '(留空则不修改)' : '*'}
              </label>
              <input
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                placeholder="请输入API密钥"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">API地址</label>
              <input
                type="text"
                value={formData.api_url}
                onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                placeholder="如：https://api.openai.com/v1"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">支持的模型</label>
              <input
                type="text"
                value={formData.modelInput}
                onChange={(e) => setFormData({ ...formData, modelInput: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                placeholder="用逗号分隔，如：SORA, GPT-4"
              />
              <p className="text-xs text-white/50 mt-1">多个模型用逗号分隔</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/70 mb-1">优先级</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                  placeholder="数字越大优先级越高"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">速率限制（/分钟）</label>
                <input
                  type="number"
                  value={formData.rate_limit}
                  onChange={(e) => setFormData({ ...formData, rate_limit: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                  placeholder="如：60"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded bg-gray-800 border-white/20 text-primary focus:ring-primary"
                />
                <span className="text-sm text-white/70">启用此服务商</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setIsAddModalOpen(false)
                  setEditingConfig(null)
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  )
}
