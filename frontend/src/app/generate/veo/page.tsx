'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { generationApi } from '@/lib/api/generation'
import { useAuthStore } from '@/store/authStore'

// 默认提示词
const DEFAULT_PROMPT = 'A highly cinematic nature documentary style animation. Deep within a primeval forest filled with bioluminescent flora. A massive, deer-like forest spirit god, whose antlers are made of glowing ancient tree branches and flowers, walks slowly and gracefully across a stream. It is trailed by many small glowing wisps and fairies. Volumetric light rays (god rays) pierce through the dense canopy hitting the water, creating dreamlike fog. Extreme detail on vegetation textures, Makoto Shinkai inspired lighting, slow motion shot, tranquil, sacred, and healing atmosphere. --ar 16:9'

export default function VeoPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [generating, setGenerating] = useState(false)
  const [duration, setDuration] = useState(8)
  const [aspectRatio, setAspectRatio] = useState('16:9')

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

    setGenerating(true)
    try {
      const result = await generationApi.textToVideo({
        prompt: prompt.trim(),
        duration,
        aspectRatio,
        model: 'veo', // 标识为VEO模型
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
      <div className="flex flex-col h-[calc(100vh-80px-3rem)] pb-4">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-white">VEO视频生成</h1>
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
                placeholder="描述你想要生成的视频..."
              />
            </div>

            <div className="flex-shrink-0">
              <label className="block text-white/70 text-sm mb-2">时长（秒）</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                title="视频时长（秒）"
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              >
                <option value={4}>4秒</option>
                <option value={6}>6秒</option>
                <option value={8}>8秒</option>
              </select>
            </div>

            <div className="flex-shrink-0">
              <label className="block text-white/70 text-sm mb-2">画面比例</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                title="视频画面比例"
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              >
                <option value="16:9">16:9 横屏</option>
                <option value="9:16">9:16 竖屏</option>
              </select>
            </div>

            <div className="text-sm text-white/70 flex-shrink-0">
              预计消耗算力: <span className="text-primary font-medium">50点</span>
            </div>
          </div>

          <div className="flex gap-3 flex-shrink-0 pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={generating || !prompt.trim()}
              className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? '生成中...' : '开始生成'}
            </button>
            <Link
              href="/works"
              className="px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center justify-center"
            >
              查看作品
            </Link>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
