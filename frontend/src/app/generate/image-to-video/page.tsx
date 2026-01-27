'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { charactersApi } from '@/lib/api/characters'
import { generationApi } from '@/lib/api/generation'
import { uploadApi } from '@/lib/api/upload'
import { useAuthStore } from '@/store/authStore'

interface Character {
  id: number
  name: string
  avatar_url?: string
  type: 'sora' | 'custom'
}

export default function ImageToVideoPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [prompt, setPrompt] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [model, setModel] = useState<'sora' | 'veo'>('sora')
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [loadingCharacters, setLoadingCharacters] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    // 当选择SORA模型时，加载SORA角色列表
    if (model === 'sora') {
      loadSoraCharacters()
    } else {
      setSelectedCharacter(null)
    }
  }, [model])

  const loadSoraCharacters = async () => {
    try {
      setLoadingCharacters(true)
      const result = await charactersApi.getCharacters({ type: 'sora' })
      if (result && result.list) {
        setCharacters(result.list)
      } else if (Array.isArray(result)) {
        setCharacters(result)
      }
    } catch (error) {
      console.error('加载角色失败:', error)
    } finally {
      setLoadingCharacters(false)
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

    setGenerating(true)
    try {
      // 上传图片获取URL
      let imageUrl = imagePreview
      if (image) {
        const uploadResult = await uploadApi.uploadImage(image)
        imageUrl = uploadResult.url || uploadResult.data?.url || imagePreview
      }

      const result = await generationApi.imageToVideo({
        image: imageUrl,
        prompt: prompt.trim(),
        model,
        duration,
        characterId: selectedCharacter?.id,
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

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character)
  }

  const [duration, setDuration] = useState(5)

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">图生视频</h1>
          <Link href="/home" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        <form onSubmit={handleGenerate} className="card">
          <div className="space-y-4">
            <div>
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

            <div>
              <label className="block text-white/70 text-sm mb-2">提示词</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary resize-none"
                placeholder="描述你想要生成的视频..."
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">模型</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setModel('sora')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    model === 'sora'
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-white/20 bg-gray-800 text-white hover:border-white/40'
                  }`}
                >
                  <div className="font-medium">SORA</div>
                  <div className="text-xs text-white/70 mt-1">OpenAI</div>
                </button>
                <button
                  onClick={() => setModel('veo')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    model === 'veo'
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-white/20 bg-gray-800 text-white hover:border-white/40'
                  }`}
                >
                  <div className="font-medium">VEO</div>
                  <div className="text-xs text-white/70 mt-1">Google</div>
                </button>
              </div>
            </div>

            {/* SORA角色选择 */}
            {model === 'sora' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-white/70 text-sm">选择角色（可选）</label>
                  <Link
                    href="/characters"
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    管理角色 →
                  </Link>
                </div>
                {loadingCharacters ? (
                  <div className="text-sm text-white/50 text-center py-4">加载中...</div>
                ) : characters.length === 0 ? (
                  <div className="text-sm text-white/50 text-center py-4">
                    暂无角色，<Link href="/characters" className="text-primary hover:underline">点击创建</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {characters.map((character) => (
                      <button
                        key={character.id}
                        onClick={() => handleCharacterSelect(character)}
                        className={`px-3 py-2 rounded-lg border-2 transition-all text-left ${
                          selectedCharacter?.id === character.id
                            ? 'border-primary bg-primary/20'
                            : 'border-white/20 bg-gray-800 hover:border-white/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {character.avatar_url ? (
                            <img
                              src={character.avatar_url}
                              alt={character.name}
                              className="w-6 h-6 rounded object-cover"
                            />
                          ) : (
                            <span className="text-sm">🎭</span>
                          )}
                          <span className="text-sm font-medium text-white">{character.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedCharacter && (
                  <div className="mt-2 text-xs text-white/50">
                    已选择: {selectedCharacter.name}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-white/70 text-sm mb-2">时长（秒）</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
                max={60}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="text-sm text-white/70">
              预计消耗算力: <span className="text-primary font-medium">60点</span>
            </div>

            <button
              type="submit"
              disabled={generating || !image || !prompt.trim()}
              className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? '生成中...' : '开始生成'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
