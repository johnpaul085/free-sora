'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { squareApi } from '@/lib/api/square'

interface SquareWork {
  id: number
  work_type: 'image' | 'video'
  result_url: string
  thumbnail_url?: string
  title?: string
  description?: string
  prompt?: string
  like_count: number
  view_count: number
  created_at: string
  username?: string
  user_avatar?: string
}

export default function SquarePage() {
  const [works, setWorks] = useState<SquareWork[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<'all' | 'image' | 'video'>('all')
  const [sort, setSort] = useState<'latest' | 'likes' | 'views'>('latest')

  useEffect(() => {
    loadWorks()
  }, [activeType, sort])

  const loadWorks = async () => {
    try {
      setLoading(true)
      const result = await squareApi.getWorks({
        page: 1,
        pageSize: 50,
        work_type: activeType === 'all' ? undefined : activeType,
        sort,
      })

      if (result && result.list) {
        setWorks(result.list)
      } else if (Array.isArray(result)) {
        setWorks(result)
      }
    } catch (error: any) {
      console.error('加载广场作品失败:', error)
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

  const handleLike = async (workId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await squareApi.likeWork(workId)
      // 更新本地状态
      setWorks(prev => prev.map(work => 
        work.id === workId 
          ? { ...work, like_count: work.like_count + 1 }
          : work
      ))
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '点赞成功', type: 'success' })
      }
    } catch (error: any) {
      console.error('点赞失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '点赞失败',
          type: 'error',
        })
      }
    }
  }

  const handleView = async (workId: number) => {
    try {
      await squareApi.viewWork(workId)
    } catch (error) {
      // 静默失败，不影响用户体验
      console.error('更新浏览数失败:', error)
    }
  }

  const formatCount = (count: number) => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`
    }
    return count.toString()
  }

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        {/* 顶部标题和筛选 */}
        <div className="relative flex items-center justify-center pt-2">
          <h1 className="text-xl font-bold text-white">案例展示</h1>
          <div className="absolute right-0 flex gap-2">
            <button
              onClick={() => setSort('latest')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                sort === 'latest'
                  ? 'bg-primary text-white'
                  : 'bg-bg-secondary/80 text-text-secondary hover:bg-bg-tertiary/50'
              }`}
            >
              最新
            </button>
            <button
              onClick={() => setSort('likes')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                sort === 'likes'
                  ? 'bg-primary text-white'
                  : 'bg-bg-secondary/80 text-text-secondary hover:bg-bg-tertiary/50'
              }`}
            >
              点赞
            </button>
            <button
              onClick={() => setSort('views')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                sort === 'views'
                  ? 'bg-primary text-white'
                  : 'bg-bg-secondary/80 text-text-secondary hover:bg-bg-tertiary/50'
              }`}
            >
              播放
            </button>
          </div>
        </div>

        {/* 类型筛选 */}
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
          <button
            onClick={() => setActiveType('all')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeType === 'all'
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30'
                : 'bg-bg-secondary/80 text-text-secondary border border-border/30 hover:bg-bg-tertiary/50'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setActiveType('video')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeType === 'video'
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30'
                : 'bg-bg-secondary/80 text-text-secondary border border-border/30 hover:bg-bg-tertiary/50'
            }`}
          >
            视频
          </button>
          <button
            onClick={() => setActiveType('image')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeType === 'image'
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30'
                : 'bg-bg-secondary/80 text-text-secondary border border-border/30 hover:bg-bg-tertiary/50'
            }`}
          >
            图片
          </button>
        </div>

        {/* 作品列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/50">加载中...</div>
          </div>
        ) : works.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-text-secondary text-base font-medium">暂无作品</div>
            <div className="text-text-tertiary text-sm mt-2">快去生成你的第一个作品吧</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {works.map((work) => (
              <Link
                key={work.id}
                href={`/square/${work.id}`}
                onClick={() => handleView(work.id)}
                className="card-hover group"
              >
                <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl mb-3 overflow-hidden border border-border/30">
                  {work.thumbnail_url || work.result_url ? (
                    work.work_type === 'video' ? (
                      <video
                        src={work.result_url}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                        playsInline
                        onLoadedMetadata={(e) => {
                          const video = e.currentTarget
                          video.currentTime = 0.1
                        }}
                        poster={work.thumbnail_url}
                      />
                    ) : (
                      <img
                        src={work.thumbnail_url || work.result_url}
                        alt={work.title || '作品'}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <span className="text-white/50 text-sm">无预览</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs text-white font-medium">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>{formatCount(work.view_count)}</span>
                  </div>
                  <button
                    onClick={(e) => handleLike(work.id, e)}
                    className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs text-white font-medium hover:bg-black/90 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span>{formatCount(work.like_count)}</span>
                  </button>
                </div>
                <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed group-hover:text-text-primary transition-colors">
                  {work.title || work.description || work.prompt || '无描述'}
                </p>
                {work.username && (
                  <div className="flex items-center gap-2 mt-2">
                    {work.user_avatar ? (
                      <img
                        src={work.user_avatar}
                        alt={work.username}
                        className="w-5 h-5 rounded-full"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">
                        {work.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs text-text-tertiary">{work.username}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
