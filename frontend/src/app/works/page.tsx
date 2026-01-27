'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { worksApi } from '@/lib/api/works'
import { useAuthStore } from '@/store/authStore'

interface Work {
  id: number
  title?: string
  work_type: 'image' | 'video'
  content_type: 'text2img' | 'img2img' | 'text2video' | 'img2video'
  result_url: string
  thumbnail_url?: string
  status: 'processing' | 'completed' | 'failed'
  created_at: string
  error_message?: string
  model_name?: string
  progress?: number
  prompt?: string
}

export default function WorksPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<'sora' | 'veo' | 'image' | 'all'>('all')
  const [activeStatus, setActiveStatus] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [stats, setStats] = useState({
    all: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  })

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initialCheckRef = useRef<boolean>(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    
    // 检查是否有refresh参数，如果有则立即刷新
    const urlParams = new URLSearchParams(window.location.search)
    const shouldRefresh = urlParams.get('refresh') === 'true'
    if (shouldRefresh) {
      // 移除URL参数（不触发重新渲染）
      window.history.replaceState({}, '', '/works')
    }
    
    loadWorks()
    // 重置首次检查标记
    initialCheckRef.current = false
    
    // 如果有refresh参数，延迟一小段时间后再次刷新，确保获取到最新任务
    if (shouldRefresh) {
      setTimeout(() => {
        loadWorks()
      }, 600)
    }
  }, [isAuthenticated, router, activeCategory, activeStatus])

  // 轮询处理中的任务状态
  useEffect(() => {
    // 清除之前的轮询
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    // 如果还在加载中，不启动轮询
    if (loading) {
      return
    }

    const processingCount = works.filter(w => w.status === 'processing').length
    
    // 首次加载完成后，延迟1秒再检查一次，确保能获取到最新创建的任务
    if (!initialCheckRef.current) {
      initialCheckRef.current = true
      const initialCheckTimeout = setTimeout(() => {
        loadWorks()
      }, 1000)
      
      return () => {
        clearTimeout(initialCheckTimeout)
      }
    }

    // 如果有处理中的任务，每3秒刷新一次
    if (processingCount > 0) {
      pollingIntervalRef.current = setInterval(() => {
        loadWorks()
      }, 3000)
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [works, loading])

  const loadWorks = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: 1,
        pageSize: 100,
      }

      if (activeCategory !== 'all') {
        params.category = activeCategory
      }

      if (activeStatus) {
        params.status = activeStatus
      }

      const result = await worksApi.getWorks(params)
      
      if (result && result.list) {
        setWorks(result.list)
        // 计算统计
        const all = result.list.length
        const processing = result.list.filter((w: Work) => w.status === 'processing').length
        const completed = result.list.filter((w: Work) => w.status === 'completed').length
        const failed = result.list.filter((w: Work) => w.status === 'failed').length
        setStats({ all, processing, completed, failed })
      } else if (Array.isArray(result)) {
        setWorks(result)
        const all = result.length
        const processing = result.filter((w: Work) => w.status === 'processing').length
        const completed = result.filter((w: Work) => w.status === 'completed').length
        const failed = result.filter((w: Work) => w.status === 'failed').length
        setStats({ all, processing, completed, failed })
      }
    } catch (error: any) {
      console.error('加载作品列表失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载作品列表失败',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectWork = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === works.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(works.map(w => w.id)))
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '请选择要删除的作品', type: 'warning' })
      }
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedIds.size} 个作品吗？`)) {
      return
    }

    try {
      await worksApi.batchDeleteWorks(Array.from(selectedIds))
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '删除成功', type: 'success' })
      }
      setSelectedIds(new Set())
      setIsSelectMode(false)
      loadWorks()
    } catch (error: any) {
      console.error('批量删除失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '批量删除失败',
          type: 'error',
        })
      }
    }
  }

  const handleBatchDownload = async () => {
    if (selectedIds.size === 0) {
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '请选择要下载的作品', type: 'warning' })
      }
      return
    }

    try {
      const result = await worksApi.batchDownloadWorks(Array.from(selectedIds))
      if (result && result.downloads) {
        // 逐个下载
        for (const item of result.downloads) {
          const link = document.createElement('a')
          link.href = item.url
          link.download = item.filename
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          // 延迟一下避免浏览器阻止多个下载
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        if ((window as any).showToast) {
          ;(window as any).showToast({ 
            message: `开始下载 ${result.downloads.length} 个作品`, 
            type: 'success' 
          })
        }
      }
      setSelectedIds(new Set())
      setIsSelectMode(false)
    } catch (error: any) {
      console.error('批量下载失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '批量下载失败',
          type: 'error',
        })
      }
    }
  }

  const handleDeleteFailed = async () => {
    const failedWorks = works.filter(w => w.status === 'failed')
    if (failedWorks.length === 0) {
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '没有失败的作品', type: 'info' })
      }
      return
    }

    if (!confirm(`确定要删除所有 ${failedWorks.length} 个失败的作品吗？`)) {
      return
    }

    try {
      await worksApi.batchDeleteWorks(failedWorks.map(w => w.id))
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '删除成功', type: 'success' })
      }
      loadWorks()
    } catch (error: any) {
      console.error('批量删除失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '批量删除失败',
          type: 'error',
        })
      }
    }
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* 顶部标签栏 */}
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30'
                : 'bg-bg-secondary/80 text-text-secondary border border-border/30 hover:bg-bg-tertiary/50'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setActiveCategory('sora')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === 'sora'
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30'
                : 'bg-bg-secondary/80 text-text-secondary border border-border/30 hover:bg-bg-tertiary/50'
            }`}
          >
            SORA视频
          </button>
          <button
            onClick={() => setActiveCategory('veo')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === 'veo'
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30'
                : 'bg-bg-secondary/80 text-text-secondary border border-border/30 hover:bg-bg-tertiary/50'
            }`}
          >
            VEO视频
          </button>
          <button
            onClick={() => setActiveCategory('image')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === 'image'
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30'
                : 'bg-bg-secondary/80 text-text-secondary border border-border/30 hover:bg-bg-tertiary/50'
            }`}
          >
            生图作品
          </button>
        </div>

        {/* 状态筛选和操作栏 */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveStatus(null)}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                activeStatus === null
                  ? 'bg-primary/20 text-primary border-primary'
                  : 'bg-bg-secondary/80 text-text-secondary border-border/30 hover:bg-bg-tertiary/50'
              }`}
            >
              全部 <span className="text-text-tertiary">{stats.all}</span>
            </button>
            <button
              onClick={() => setActiveStatus('processing')}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                activeStatus === 'processing'
                  ? 'bg-primary/20 text-primary border-primary'
                  : 'bg-bg-secondary/80 text-text-secondary border-border/30 hover:bg-bg-tertiary/50'
              }`}
            >
              生成中 <span className="text-text-tertiary">{stats.processing}</span>
            </button>
            <button
              onClick={() => setActiveStatus('completed')}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                activeStatus === 'completed'
                  ? 'bg-primary/20 text-primary border-primary'
                  : 'bg-bg-secondary/80 text-text-secondary border-border/30 hover:bg-bg-tertiary/50'
              }`}
            >
              已完成 <span className="text-text-tertiary">{stats.completed}</span>
            </button>
            <button
              onClick={() => setActiveStatus('failed')}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                activeStatus === 'failed'
                  ? 'bg-primary/20 text-primary border-primary'
                  : 'bg-bg-secondary/80 text-text-secondary border-border/30 hover:bg-bg-tertiary/50'
              }`}
            >
              失败 <span className="text-text-tertiary">{stats.failed}</span>
            </button>
          </div>
          
          {/* 批量操作栏 */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setIsSelectMode(!isSelectMode)}
              className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                isSelectMode
                  ? 'bg-primary/20 text-primary border-primary'
                  : 'bg-bg-secondary/80 text-text-secondary border-border/30 hover:bg-bg-tertiary/50'
              }`}
            >
              {isSelectMode ? '取消选择' : '选择模式'}
            </button>
            {isSelectMode && (
              <>
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-bg-secondary/80 text-text-secondary border border-border/30 hover:bg-bg-tertiary/50"
                >
                  {selectedIds.size === works.length ? '取消全选' : '全选'}
                </button>
                <span className="text-xs text-text-tertiary">
                  已选择 {selectedIds.size} 个
                </span>
                {selectedIds.size > 0 && (
                  <>
                    <button
                      onClick={handleBatchDownload}
                      className="px-4 py-2 rounded-lg text-xs font-medium bg-primary/20 text-primary border border-primary hover:bg-primary/30"
                    >
                      批量下载
                    </button>
                    <button
                      onClick={handleBatchDelete}
                      className="px-4 py-2 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    >
                      批量删除
                    </button>
                  </>
                )}
              </>
            )}
            {stats.failed > 0 && (
              <button
                onClick={handleDeleteFailed}
                className="ml-auto px-4 py-2 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
              >
                删除所有失败 ({stats.failed})
              </button>
            )}
          </div>
        </div>

        {/* VIP横幅 */}
        <Link href="/distribution" className="block relative overflow-hidden rounded-2xl bg-transparent border border-accent/40 p-5 hover:border-accent/60 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="text-xl font-bold mb-1.5 text-accent">分销福利赚佣</div>
              <div className="text-xs text-text-secondary">VIP特权 · 推广奖励</div>
            </div>
            <div className="px-5 py-2.5 bg-accent text-white rounded-full text-sm font-semibold shadow-lg shadow-accent/30 hover:scale-105 transition-transform">
              GO
            </div>
          </div>
        </Link>

        {/* 操作按钮 */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/square" className="btn-primary text-center block">去广场看看</Link>
          <Link href="/assistant" className="btn-secondary text-center block">AI助手</Link>
        </div>

        {/* 提示信息 */}
        <div className="text-xs text-text-tertiary text-center py-4">
          Sora视频制作为您保留24小时，请及时下载。
        </div>

        {/* 作品列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/50">加载中...</div>
          </div>
        ) : works.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-40 h-40 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl"></div>
              <div className="relative w-full h-full bg-bg-secondary/80 rounded-2xl border border-border/30 flex items-center justify-center backdrop-blur-sm">
                <svg className="w-20 h-20 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
            </div>
            <div className="text-text-secondary text-base font-medium">没有数据哦~</div>
            <div className="text-text-tertiary text-sm mt-2">快去生成你的第一个作品吧</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {works.map((work) => (
              <div
                key={work.id}
                className={`relative aspect-square rounded-xl overflow-hidden bg-gray-800 ${
                  isSelectMode ? 'cursor-pointer' : ''
                }`}
                onClick={(e) => {
                  if (isSelectMode) {
                    e.preventDefault()
                    handleSelectWork(work.id)
                  }
                }}
              >
                {isSelectMode && (
                  <div className="absolute top-2 left-2 z-20">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedIds.has(work.id)
                        ? 'bg-primary border-primary'
                        : 'bg-black/50 border-white/50'
                    }`}>
                      {selectedIds.has(work.id) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}
                <Link
                  href={`/works/${work.id}`}
                  className={`card-hover group relative block w-full h-full ${
                    isSelectMode ? 'pointer-events-none' : ''
                  }`}
                  onClick={(e) => {
                    if (isSelectMode) {
                      e.preventDefault()
                    }
                  }}
                >
                {work.work_type === 'video' ? (
                  <div className="relative w-full h-full">
                    {work.result_url ? (
                      <video
                        src={work.result_url}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                        playsInline
                        onLoadedMetadata={(e) => {
                          // 视频加载后，尝试显示第一帧
                          const video = e.target as HTMLVideoElement
                          video.currentTime = 0.1
                        }}
                      />
                    ) : work.thumbnail_url ? (
                      <img
                        src={work.thumbnail_url}
                        alt={work.title || '视频'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <span className="text-white/50 text-xs">视频</span>
                      </div>
                    )}
                    <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-1">
                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  work.thumbnail_url || work.result_url ? (
                    <img
                      src={work.thumbnail_url || work.result_url}
                      alt={work.title || '作品'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <span className="text-white/50 text-xs">图片</span>
                    </div>
                  )
                )}
                
                {/* 状态覆盖层 */}
                {work.status === 'processing' && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                    <div className="text-white text-xs">
                      {work.progress !== undefined && work.progress !== null
                        ? `生成中 ${work.progress}%`
                        : '生成中'}
                    </div>
                  </div>
                )}
                {work.status === 'failed' && (
                  <div className="absolute inset-0 bg-red-900/70 flex flex-col items-center justify-center p-2">
                    <svg className="w-5 h-5 text-red-300 mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="text-white text-xs text-center font-medium">失败</div>
                    {work.error_message && (
                      <div className="text-red-200 text-[10px] text-center mt-1 line-clamp-2" title={work.error_message}>
                        {work.error_message}
                      </div>
                    )}
                  </div>
                )}
                
                {/* 底部信息栏 */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/85 to-transparent px-2 py-1.5 rounded-b-xl">
                  {work.prompt && (
                    <div className="text-white text-xs mb-0.5 line-clamp-2 leading-tight" title={work.prompt}>
                      {work.prompt.length > 50 ? `${work.prompt.substring(0, 50)}...` : work.prompt}
                    </div>
                  )}
                  <div className="text-white/70 text-[10px]">
                    {new Date(work.created_at).toLocaleString('zh-CN', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
