'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import Modal from '@/components/UI/Modal'
import ConfirmDialog from '@/components/UI/ConfirmDialog'
import ImageUploader from '@/components/UI/ImageUploader'
import { charactersApi } from '@/lib/api/characters'
import { useAuthStore } from '@/store/authStore'

interface Character {
  id: number
  name: string
  avatar_url?: string
  type: 'sora' | 'custom'
  is_system?: boolean
  sora_id?: string
  created_at: string
}

export default function CharactersPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    avatar_url: '',
    type: 'sora' as 'sora' | 'custom',
  })
  const [submitting, setSubmitting] = useState(false)

  // 检查登录状态
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  // 加载角色列表
  useEffect(() => {
    if (isAuthenticated) {
      loadCharacters()
    }
  }, [isAuthenticated])

  const loadCharacters = async () => {
    try {
      setLoading(true)
      // 加载用户角色和系统内置角色
      const result = await charactersApi.getCharacters({ includeSystem: true })
      if (result && result.list) {
        setCharacters(result.list)
      } else if (Array.isArray(result)) {
        setCharacters(result)
      }
    } catch (error: any) {
      console.error('加载角色列表失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载角色列表失败',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setFormData({
      name: '',
      avatar_url: '',
      type: 'sora',
    })
    setShowAddModal(true)
  }

  const handleEdit = (character: Character) => {
    setSelectedCharacter(character)
    setFormData({
      name: character.name,
      avatar_url: character.avatar_url || '',
      type: character.type,
    })
    setShowEditModal(true)
  }

  const handleDelete = (character: Character) => {
    setSelectedCharacter(character)
    setShowDeleteDialog(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '请输入角色名称', type: 'warning' })
      }
      return
    }

    setSubmitting(true)
    try {
      if (showAddModal) {
        // 新增角色
        const result = await charactersApi.createCharacter({
          name: formData.name,
          avatar: formData.avatar_url || undefined,
          type: formData.type,
        })
        if ((window as any).showToast) {
          ;(window as any).showToast({ message: '角色创建成功', type: 'success' })
        }
        setShowAddModal(false)
        loadCharacters() // 重新加载列表
      } else if (showEditModal && selectedCharacter) {
        // 编辑角色
        await charactersApi.updateCharacter(selectedCharacter.id, {
          name: formData.name,
          avatar: formData.avatar_url || undefined,
        })
        if ((window as any).showToast) {
          ;(window as any).showToast({ message: '角色更新成功', type: 'success' })
        }
        setShowEditModal(false)
        setSelectedCharacter(null)
        loadCharacters() // 重新加载列表
      }
    } catch (error: any) {
      console.error('操作失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '操作失败，请重试',
          type: 'error',
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedCharacter) return

    try {
      await charactersApi.deleteCharacter(selectedCharacter.id)
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '角色删除成功', type: 'success' })
      }
      setShowDeleteDialog(false)
      setSelectedCharacter(null)
      loadCharacters() // 重新加载列表
    } catch (error: any) {
      console.error('删除失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '删除失败，请重试',
          type: 'error',
        })
      }
    }
  }

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">我的角色</h1>
          <Link href="/profile" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        {/* 新增角色按钮 */}
        <button
          onClick={handleAdd}
          className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>新增角色</span>
        </button>

        {/* 角色列表 */}
        <div className="space-y-3">
          {loading ? (
            <div className="card text-center py-12">
              <div className="text-white/50 text-sm">加载中...</div>
            </div>
          ) : characters.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-white/50 text-sm">暂无角色，点击上方按钮创建</div>
            </div>
          ) : (
            characters.map((character) => (
              <div key={character.id} className="card">
                <div className="flex items-start gap-4">
                  {/* 角色头像 */}
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 border border-white/20">
                    {character.avatar_url ? (
                      <img
                        src={character.avatar_url}
                        alt={character.name}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🎭</span>
                    )}
                  </div>

                  {/* 角色信息 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white">{character.name}</h3>
                      {character.type === 'sora' && (
                        <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                          SORA
                        </span>
                      )}
                      {character.is_system && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                          系统内置
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/50">
                      {character.sora_id && (
                        <div className="mb-1">@ID: {character.sora_id}</div>
                      )}
                      {!character.is_system && (
                        <div>创建时间: {new Date(character.created_at).toLocaleDateString('zh-CN')}</div>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  {!character.is_system && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEdit(character)}
                        className="px-3 py-1.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(character)}
                        className="px-3 py-1.5 bg-red-600/20 text-red-400 text-sm rounded-lg hover:bg-red-600/30 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  )}
                  {character.is_system && (
                    <div className="text-xs text-white/50 px-3 py-1.5">
                      系统角色
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 新增/编辑角色弹窗 */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false)
          setShowEditModal(false)
          setSelectedCharacter(null)
        }}
        title={showAddModal ? '新增角色' : '编辑角色'}
        size="lg"
      >
        <div className="space-y-3 md:space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">角色类型</label>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <button
                onClick={() => setFormData({ ...formData, type: 'sora' })}
                className={`px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 transition-all ${
                  formData.type === 'sora'
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-white/20 bg-gray-800 text-white hover:border-white/40'
                }`}
              >
                <div className="font-medium text-sm md:text-base">SORA角色</div>
                <div className="text-xs text-white/70 mt-1">用于SORA视频生成</div>
              </button>
              <button
                onClick={() => setFormData({ ...formData, type: 'custom' })}
                className={`px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 transition-all ${
                  formData.type === 'custom'
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-white/20 bg-gray-800 text-white hover:border-white/40'
                }`}
              >
                <div className="font-medium text-sm md:text-base">自定义角色</div>
                <div className="text-xs text-white/70 mt-1">通用角色</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">角色头像</label>
            <ImageUploader
              value={formData.avatar_url || undefined}
              onChange={(file, preview) => {
                setFormData({ ...formData, avatar_url: preview || '' })
              }}
              maxSize={2}
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">角色名称 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary text-sm md:text-base"
              placeholder="请输入角色名称"
            />
          </div>

          <div className="flex gap-2 md:gap-3 pt-2 md:pt-4">
            <button
              onClick={() => {
                setShowAddModal(false)
                setShowEditModal(false)
                setSelectedCharacter(null)
              }}
              className="flex-1 px-3 md:px-4 py-3 md:py-3.5 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors text-sm md:text-base font-medium"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-3 md:px-4 py-3 md:py-3.5 rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors text-sm md:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '处理中...' : showAddModal ? '创建' : '保存'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setSelectedCharacter(null)
        }}
        onConfirm={handleConfirmDelete}
        message={`确定要删除角色"${selectedCharacter?.name}"吗？此操作不可恢复。`}
        type="danger"
        confirmText="删除"
      />
    </MainLayout>
  )
}
