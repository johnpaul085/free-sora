'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { generationApi } from '@/lib/api/generation'
import { uploadApi } from '@/lib/api/upload'
import { useAuthStore } from '@/store/authStore'

export default function ImageToImagePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [prompt, setPrompt] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [model, setModel] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(true)
  const [generating, setGenerating] = useState(false)

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (!image) {
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '请上传参考图片', type: 'warning' })
      }
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
      // 上传图片获取URL
      let imageUrl = imagePreview
      if (image) {
        const uploadResult = await uploadApi.uploadImage(image)
        imageUrl = uploadResult.url || uploadResult.data?.url || imagePreview
      }

      const result = await generationApi.imageToImage({
        image: imageUrl,
        prompt: prompt.trim(),
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
          <h1 className="text-2xl font-bold text-white">图生图</h1>
          <Link href="/home" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        <form onSubmit={handleGenerate} className="card flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-2 min-h-0">
            <div className="flex-shrink-0">
              <label className="block text-white/70 text-sm mb-2">上传参考图片</label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                {imagePreview ? (
                  <div className="space-y-2">
                    <img
                      src={imagePreview}
                      alt="预览"
                      className="max-w-full max-h-48 mx-auto rounded-lg"
                    />
                    <div className="text-white/70 text-sm">{image?.name}</div>
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null)
                        setImagePreview('')
                      }}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      重新选择
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-white/70 mb-2">点击或拖拽上传图片</div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors cursor-pointer">
                      选择图片
                    </label>
                  </div>
                )}
              </div>
            </div>

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
              预计消耗算力: <span className="text-primary font-medium">15点</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={generating || !image || !prompt.trim()}
            className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 mt-4"
          >
            {generating ? '生成中...' : '开始生成'}
          </button>
        </form>
      </div>
    </MainLayout>
  )
}
