'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { adminApi } from '@/lib/api/admin'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

interface ReviewWork {
  id: number
  user_id: number
  username?: string
  nickname?: string
  work_type: 'image' | 'video'
  result_url: string
  thumbnail_url?: string
  prompt?: string
  created_at: string
}

export default function AdminContentReviewPage() {
  const router = useRouter()
  const { user: currentUser, isAuthenticated } = useAuthStore()
  const [works, setWorks] = useState<ReviewWork[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== 'admin') {
      router.push('/profile')
      return
    }
    loadReviewWorks()
  }, [page, filterType, isAuthenticated, currentUser, router])

  const loadReviewWorks = async () => {
    try {
      setLoading(true)
      const result = await adminApi.getReviewWorks({
        page,
        pageSize,
        work_type: filterType === 'all' ? undefined : filterType,
      })

      if (result && result.list) {
        setWorks(result.list)
        setTotal(result.total || 0)
      }
    } catch (error: any) {
      console.error('加载审核作品失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载审核作品失败',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (workId: number, action: 'approve' | 'reject') => {
    try {
      await adminApi.reviewWork(workId, action)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: action === 'approve' ? '作品审核通过' : '作品已拒绝',
          type: 'success',
        })
      }
      loadReviewWorks()
    } catch (error: any) {
      console.error('审核失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '审核失败',
          type: 'error',
        })
      }
    }
  }

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">内容审核</h1>
          <Link href="/profile" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        {/* 类型筛选 */}
        <div className="card">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setFilterType('all'); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm ${
                filterType === 'all'
                  ? 'bg-primary/20 text-primary border border-primary'
                  : 'bg-gray-800 text-white/70 border border-white/20 hover:bg-gray-700'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => { setFilterType('video'); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm ${
                filterType === 'video'
                  ? 'bg-primary/20 text-primary border border-primary'
                  : 'bg-gray-800 text-white/70 border border-white/20 hover:bg-gray-700'
              }`}
            >
              视频
            </button>
            <button
              onClick={() => { setFilterType('image'); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm ${
                filterType === 'image'
                  ? 'bg-primary/20 text-primary border border-primary'
                  : 'bg-gray-800 text-white/70 border border-white/20 hover:bg-gray-700'
              }`}
            >
              图片
            </button>
          </div>
        </div>

        {/* 作品列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/50">加载中...</div>
          </div>
        ) : works.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/50">暂无待审核作品</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {works.map((work) => (
              <div key={work.id} className="card">
                <div className="relative aspect-video bg-gray-800 rounded-lg mb-3 overflow-hidden">
                  {work.thumbnail_url || work.result_url ? (
                    work.work_type === 'video' ? (
                      <video
                        src={work.thumbnail_url || work.result_url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        src={work.thumbnail_url || work.result_url}
                        alt="作品"
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white/50 text-sm">无预览</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-white/70">
                    用户: {work.username || work.nickname || `用户${work.user_id}`}
                  </div>
                  {work.prompt && (
                    <div className="text-xs text-white/50 line-clamp-2">
                      {work.prompt}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleReview(work.id, 'approve')}
                      className="flex-1 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      通过
                    </button>
                    <button
                      onClick={() => handleReview(work.id, 'reject')}
                      className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      拒绝
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {total > pageSize && (
          <div className="flex items-center justify-between">
            <div className="text-white/70 text-sm">
              共 {total} 条，第 {page} / {Math.ceil(total / pageSize)} 页
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(Math.ceil(total / pageSize), page + 1))}
                disabled={page >= Math.ceil(total / pageSize)}
                className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
