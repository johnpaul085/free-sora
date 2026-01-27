'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { adminApi } from '@/lib/api/admin'
import Modal from '@/components/UI/Modal'

interface CardCode {
  id: number
  code: string
  code_type: 'computing_power' | 'vip' | 'svip'
  value: number
  is_used: boolean
  used_by_user_id?: number
  used_by_username?: string
  used_at?: string
  expires_at?: string
  created_by?: number
  created_by_username?: string
  created_at: string
}

export default function AdminCardsPage() {
  const [codes, setCodes] = useState<CardCode[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [filterType, setFilterType] = useState<'all' | 'computing_power' | 'vip' | 'svip'>('all')
  const [filterUsed, setFilterUsed] = useState<'all' | 'used' | 'unused'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generateForm, setGenerateForm] = useState({
    code_type: 'computing_power' as 'computing_power' | 'vip' | 'svip',
    value: 100,
    count: 10,
    expires_at: '',
  })
  const [generating, setGenerating] = useState(false)
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([])
  const [showCodesModal, setShowCodesModal] = useState(false)

  useEffect(() => {
    loadCodes()
  }, [page, filterType, filterUsed, searchTerm])

  const loadCodes = async () => {
    try {
      setLoading(true)
      const result = await adminApi.getCardCodes({
        page,
        pageSize,
        code_type: filterType === 'all' ? undefined : filterType,
        is_used: filterUsed === 'all' ? undefined : filterUsed === 'used',
        search: searchTerm || undefined,
      })

      if (result && result.list) {
        setCodes(result.list)
        setTotal(result.total || 0)
      }
    } catch (error: any) {
      console.error('加载卡密列表失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载失败',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (generateForm.count < 1 || generateForm.count > 1000) {
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: '生成数量必须在1-1000之间',
          type: 'warning',
        })
      }
      return
    }

    setGenerating(true)
    try {
      const result = await adminApi.generateCardCodes({
        code_type: generateForm.code_type,
        value: generateForm.value,
        count: generateForm.count,
        expires_at: generateForm.expires_at || undefined,
      })

      if (result && result.codes) {
        setGeneratedCodes(result.codes)
        setShowCodesModal(true)
        setShowGenerateModal(false)
        setGenerateForm({
          code_type: 'computing_power',
          value: 100,
          count: 10,
          expires_at: '',
        })
        loadCodes()
        if ((window as any).showToast) {
          ;(window as any).showToast({
            message: `成功生成 ${result.count} 个卡密`,
            type: 'success',
          })
        }
      }
    } catch (error: any) {
      console.error('生成卡密失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '生成失败',
          type: 'error',
        })
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个卡密吗？')) {
      return
    }

    try {
      await adminApi.deleteCardCode(id)
      loadCodes()
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: '删除成功',
          type: 'success',
        })
      }
    } catch (error: any) {
      console.error('删除卡密失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '删除失败',
          type: 'error',
        })
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    if ((window as any).showToast) {
      ;(window as any).showToast({
        message: '已复制到剪贴板',
        type: 'success',
      })
    }
  }

  const copyAllCodes = () => {
    const codesText = generatedCodes.join('\n')
    copyToClipboard(codesText)
  }

  const getCodeTypeLabel = (type: string) => {
    switch (type) {
      case 'computing_power':
        return '算力'
      case 'vip':
        return 'VIP会员'
      case 'svip':
        return 'SVIP会员'
      default:
        return type
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">卡密管理</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
            >
              + 生成卡密
            </button>
            <Link href="/profile" className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
              返回
            </Link>
          </div>
        </div>

        {/* 搜索和筛选 - 紧凑布局 */}
        <div className="card">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索卡密或用户名..."
              className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-gray-800 border border-white/20 text-white text-sm placeholder-white/50 focus:outline-none focus:border-primary"
            />
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setFilterType('all')
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  filterType === 'all' ? 'bg-primary text-white' : 'bg-gray-800 text-white/70 hover:bg-gray-700'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => {
                  setFilterType('computing_power')
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  filterType === 'computing_power' ? 'bg-primary text-white' : 'bg-gray-800 text-white/70 hover:bg-gray-700'
                }`}
              >
                算力
              </button>
              <button
                onClick={() => {
                  setFilterType('vip')
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  filterType === 'vip' ? 'bg-primary text-white' : 'bg-gray-800 text-white/70 hover:bg-gray-700'
                }`}
              >
                VIP
              </button>
              <button
                onClick={() => {
                  setFilterType('svip')
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  filterType === 'svip' ? 'bg-primary text-white' : 'bg-gray-800 text-white/70 hover:bg-gray-700'
                }`}
              >
                SVIP
              </button>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setFilterUsed('all')
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  filterUsed === 'all' ? 'bg-primary text-white' : 'bg-gray-800 text-white/70 hover:bg-gray-700'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => {
                  setFilterUsed('unused')
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  filterUsed === 'unused' ? 'bg-green-500 text-white' : 'bg-gray-800 text-white/70 hover:bg-gray-700'
                }`}
              >
                未用
              </button>
              <button
                onClick={() => {
                  setFilterUsed('used')
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  filterUsed === 'used' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white/70 hover:bg-gray-700'
                }`}
              >
                已用
              </button>
            </div>
            <div className="text-xs text-white/50">
              共 {total} 条 | 未用 {codes.filter(c => !c.is_used).length} | 已用 {codes.filter(c => c.is_used).length}
            </div>
          </div>
        </div>

        {/* 卡密列表 - 卡片式布局 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/50">加载中...</div>
          </div>
        ) : codes.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-white/50 mb-2">暂无卡密</div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
            >
              生成卡密
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {codes.map((code) => (
                <div key={code.id} className="card p-2.5 hover:border-primary/30 transition-colors">
                  {/* 第一行：卡密 */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-white font-mono text-xs font-medium flex-1 truncate">{code.code}</span>
                    <button
                      onClick={() => copyToClipboard(code.code)}
                      className="text-primary hover:text-primary/80 text-[10px] px-1 py-0.5 rounded hover:bg-primary/10 transition-colors flex-shrink-0"
                      title="复制"
                    >
                      复制
                    </button>
                    <button
                      onClick={() => handleDelete(code.id)}
                      className="text-red-400 hover:text-red-300 text-[10px] px-1.5 py-0.5 rounded hover:bg-red-500/10 transition-colors flex-shrink-0"
                      title="删除"
                    >
                      删除
                    </button>
                  </div>

                  {/* 第二行：类型、数值、状态、使用人 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      code.code_type === 'computing_power' 
                        ? 'bg-blue-500/20 text-blue-400'
                        : code.code_type === 'vip'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {getCodeTypeLabel(code.code_type)}
                    </span>
                    {code.value > 0 && (
                      <span className="text-white/70 text-[10px]">
                        {code.code_type === 'computing_power' ? `${code.value}点` : `${code.value}天`}
                      </span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      code.is_used
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {code.is_used ? '已用' : '未用'}
                    </span>
                    {code.is_used && code.used_by_username && (
                      <span className="text-white/60 text-[10px] ml-auto">
                        {code.used_by_username}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  上一页
                </button>
                <span className="text-white/70 text-xs">
                  {page} / {totalPages} ({total})
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 生成卡密弹窗 */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="生成卡密"
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label htmlFor="code_type" className="block text-white/70 text-sm mb-2">卡密类型</label>
            <select
              id="code_type"
              value={generateForm.code_type}
              onChange={(e) => setGenerateForm({ ...generateForm, code_type: e.target.value as any })}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              title="选择卡密类型"
            >
              <option value="computing_power">算力</option>
              <option value="vip">VIP会员</option>
              <option value="svip">SVIP会员</option>
            </select>
          </div>

          <div>
            <label htmlFor="code_value" className="block text-white/70 text-sm mb-2">
              {generateForm.code_type === 'computing_power' ? '算力点数' : '会员天数'}
            </label>
            <input
              id="code_value"
              type="number"
              value={generateForm.value}
              onChange={(e) => setGenerateForm({ ...generateForm, value: Number(e.target.value) })}
              min={1}
              placeholder={generateForm.code_type === 'computing_power' ? '请输入算力点数' : '请输入会员天数'}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
              required
              title={generateForm.code_type === 'computing_power' ? '算力点数' : '会员天数'}
            />
          </div>

          <div>
            <label htmlFor="code_count" className="block text-white/70 text-sm mb-2">生成数量</label>
            <input
              id="code_count"
              type="number"
              value={generateForm.count}
              onChange={(e) => setGenerateForm({ ...generateForm, count: Number(e.target.value) })}
              min={1}
              max={1000}
              placeholder="请输入生成数量（1-1000）"
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
              required
              title="生成数量"
            />
            <div className="text-xs text-white/50 mt-1">最多可生成1000个</div>
          </div>

          <div>
            <label htmlFor="code_expires" className="block text-white/70 text-sm mb-2">过期时间（可选）</label>
            <input
              id="code_expires"
              type="datetime-local"
              value={generateForm.expires_at}
              onChange={(e) => setGenerateForm({ ...generateForm, expires_at: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
              title="过期时间"
            />
            <div className="text-xs text-white/50 mt-1">留空表示永久有效</div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={generating}
              className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
            >
              {generating ? '生成中...' : '生成'}
            </button>
            <button
              type="button"
              onClick={() => setShowGenerateModal(false)}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </Modal>

      {/* 显示生成的卡密 */}
      <Modal
        isOpen={showCodesModal}
        onClose={() => setShowCodesModal(false)}
        title="生成的卡密"
        size="large"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
            <div className="text-white font-medium">共生成 <span className="text-primary">{generatedCodes.length}</span> 个卡密</div>
            <button
              onClick={copyAllCodes}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors text-sm font-medium"
            >
              📋 复制全部
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto bg-gray-800/50 rounded-lg p-4 border border-white/10">
            <div className="space-y-2">
              {generatedCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between py-2.5 px-3 bg-gray-900/50 rounded-lg border border-white/5 hover:border-primary/30 transition-colors">
                  <span className="text-white font-mono text-sm font-medium">{code}</span>
                  <button
                    onClick={() => copyToClipboard(code)}
                    className="text-primary hover:text-primary/80 text-xs px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                  >
                    复制
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={copyAllCodes}
              className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
            >
              复制全部
            </button>
            <button
              onClick={() => setShowCodesModal(false)}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
