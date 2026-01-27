'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { charactersApi } from '@/lib/api/characters'
import { generationApi } from '@/lib/api/generation'
import { useAuthStore } from '@/store/authStore'

interface Character {
  id: number
  name: string
  avatar_url?: string
  type: 'sora' | 'custom'
  is_system?: boolean
  sora_id?: string
}

// 默认提示词
const DEFAULT_PROMPT = 'A highly cinematic nature documentary style animation. Deep within a primeval forest filled with bioluminescent flora. A massive, deer-like forest spirit god, whose antlers are made of glowing ancient tree branches and flowers, walks slowly and gracefully across a stream. It is trailed by many small glowing wisps and fairies. Volumetric light rays (god rays) pierce through the dense canopy hitting the water, creating dreamlike fog. Extreme detail on vegetation textures, Makoto Shinkai inspired lighting, slow motion shot, tranquil, sacred, and healing atmosphere. --ar 16:9'

export default function SoraPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [loadingCharacters, setLoadingCharacters] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [duration, setDuration] = useState(10)
  const [resolution, setResolution] = useState('1080p')

  useEffect(() => {
    loadSoraCharacters()
  }, [])

  const loadSoraCharacters = async () => {
    try {
      setLoadingCharacters(true)
      const result = await charactersApi.getCharacters({ type: 'sora', includeSystem: true })
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
        resolution,
        characterId: selectedCharacter?.id,
        model: 'sora', // 标识为SORA模型
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
    if (character.sora_id && !prompt.includes(`@${character.sora_id}`)) {
      const mention = prompt.trim() ? ` @${character.sora_id}` : `@${character.sora_id}`
      setPrompt((prev) => prev + mention)
    }
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-80px-3rem)] pb-4">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-white">SORA视频生成</h1>
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
                placeholder="描述你想要生成的视频... 输入@可以引用角色"
              />
              <div className="text-xs text-white/50 mt-1 flex-shrink-0">
                提示：输入 @角色名 可以引用角色，例如 @李清歌
              </div>
            </div>

            {/* SORA角色选择 */}
            <div className="flex-shrink-0">
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
                <div>
                  <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto mb-2">
                    {characters.map((character) => (
                      <button
                        key={character.id}
                        type="button"
                        onClick={() => handleCharacterSelect(character)}
                        className={`flex flex-col items-center gap-1 group ${
                          selectedCharacter?.id === character.id
                            ? 'opacity-100'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        title={`添加 @${character.sora_id || character.name}`}
                      >
                        <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all bg-gray-800 ${
                          selectedCharacter?.id === character.id
                            ? 'border-primary'
                            : 'border-gray-700 group-hover:border-indigo-500'
                        }`}>
                          {character.avatar_url ? (
                            <img
                              src={character.avatar_url}
                              alt={character.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl flex items-center justify-center h-full">🎭</span>
                          )}
                        </div>
                        <span className={`text-xs truncate max-w-[60px] text-center ${
                          selectedCharacter?.id === character.id
                            ? 'text-primary'
                            : 'text-gray-400 group-hover:text-indigo-300'
                        }`}>
                          {character.name}
                        </span>
                        {character.is_system && (
                          <span className="text-[10px] text-primary/70">系统</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedCharacter && (
                <div className="mt-2 text-xs text-white/50">
                  已选择: {selectedCharacter.name}
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              <label className="block text-white/70 text-sm mb-2">时长（秒）</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                title="视频时长（秒）"
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              >
                <option value={10}>10秒</option>
                <option value={15}>15秒</option>
              </select>
            </div>

            <div className="flex-shrink-0">
              <label className="block text-white/70 text-sm mb-2">分辨率</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                title="视频分辨率"
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4k">4K</option>
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
