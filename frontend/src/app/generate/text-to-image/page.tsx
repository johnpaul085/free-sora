'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { generationApi } from '@/lib/api/generation'
import { useAuthStore } from '@/store/authStore'

// 图片比例选项
const aspectRatios = [
  { label: '1:1 (正方形)', value: '1:1', width: 1024, height: 1024 },
  { label: '16:9 (横屏)', value: '16:9', width: 1920, height: 1080 },
  { label: '9:16 (竖屏)', value: '9:16', width: 1080, height: 1920 },
  { label: '4:3 (横屏)', value: '4:3', width: 1366, height: 1024 },
  { label: '3:4 (竖屏)', value: '3:4', width: 1024, height: 1366 },
  { label: '21:9 (超宽屏)', value: '21:9', width: 2048, height: 864 },
]

export default function TextToImagePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [model, setModel] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [aspectRatio, setAspectRatio] = useState('1:1')

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    try {
      setLoadingModels(true)
      const result = await generationApi.getImageModels()
      if (result && result.models && result.models.length > 0) {
        setModels(result.models)
        setModel(result.models[0]) // 默认选择第一个模型
      }
    } catch (error: any) {
      console.error('加载模型列表失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: '加载模型列表失败',
          type: 'error',
        })
      }
    } finally {
      setLoadingModels(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (!prompt.trim()) {
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '请输入提示词', type: 'warning' })
      }
      return
    }

    if (!model) {
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '请选择模型', type: 'warning' })
      }
      return
    }

    setGenerating(true)
    try {
      // 根据选择的比例获取对应的宽度和高度
      const selectedRatio = aspectRatios.find(r => r.value === aspectRatio) || aspectRatios[0]
      
      const result = await generationApi.textToImage({
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        width: selectedRatio.width,
        height: selectedRatio.height,
        model,
      })

      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '任务已创建，正在生成中...', type: 'success' })
      }

      // 延迟一小段时间确保任务已创建，然后跳转到作品列表
      setTimeout(() => {
        router.push('/works?refresh=true')
      }, 500)
    } catch (error: any) {
      console.error('生成失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '生成失败，请重试',
          type: 'error',
        })
      }
    } finally {
      setGenerating(false)
    }
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-80px-3rem)]">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-white">文生图</h1>
          <Link href="/home" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        <form onSubmit={handleGenerate} className="card flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-2 min-h-0">
            <div className="flex-1 flex flex-col min-h-0">
              <label className="block text-white/70 text-sm mb-2 flex-shrink-0">提示词</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary resize-none min-h-0"
                placeholder="描述你想要生成的图片..."
              />
            </div>

            <div className="flex-shrink-0">
              <label className="block text-white/70 text-sm mb-2">负面提示词（可选）</label>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary resize-none"
                placeholder="描述不想要的内容..."
              />
            </div>

            <div className="flex-shrink-0">
              <label className="block text-white/70 text-sm mb-2">生成比例</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
                title="选择生成比例"
              >
                {aspectRatios.map((ratio) => (
                  <option key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-shrink-0">
              <label className="block text-white/70 text-sm mb-2">模型</label>
              {loadingModels ? (
                <div className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white/50 text-center">
                  加载模型中...
                </div>
              ) : models.length === 0 ? (
                <div className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-red-500/50 text-red-400 text-center text-sm">
                  暂无可用模型，请联系管理员配置
                </div>
              ) : (
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
                  title="选择模型"
                >
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="text-sm text-white/70 flex-shrink-0">
              预计消耗算力: <span className="text-primary font-medium">10点</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={generating || !prompt.trim()}
            className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 mt-4"
          >
            {generating ? '生成中...' : '开始生成'}
          </button>
        </form>
      </div>
    </MainLayout>
  )
}
