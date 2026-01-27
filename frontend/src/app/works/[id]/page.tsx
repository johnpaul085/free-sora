'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { worksApi } from '@/lib/api/works'
import { useAuthStore } from '@/store/authStore'

interface Work {
  id: number
  title?: string
  work_type: 'image' | 'video'
  content_type: 'text2img' | 'img2img' | 'text2video' | 'img2video'
  model_name?: string
  prompt?: string
  negative_prompt?: string
  result_url: string
  thumbnail_url?: string
  status: 'processing' | 'completed' | 'failed'
  computing_power_used: number
  created_at: string
  width?: number
  height?: number
  duration?: number
}

export default function WorkDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { isAuthenticated } = useAuthStore()
  const workId = Number(params.id)
  const [work, setWork] = useState<Work | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    if (workId) {
      loadWork()
    }
  }, [isAuthenticated, workId, router])

  const loadWork = async () => {
    try {
      setLoading(true)
      const result = await worksApi.getWork(workId)
      setWork(result)
    } catch (error: any) {
      console.error('加载作品详情失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载作品详情失败',
          type: 'error',
        })
      }
      router.push('/works')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!work) return
    try {
      const result = await worksApi.downloadWork(work.id)
      
      // 创建下载链接
      const link = document.createElement('a')
      link.href = result.download_url
      link.download = result.filename || `work_${work.id}.${work.work_type === 'video' ? 'mp4' : 'png'}`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '开始下载', type: 'success' })
      }
    } catch (error: any) {
      console.error('下载失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '下载失败',
          type: 'error',
        })
      }
    }
  }

  const handleShare = async () => {
    if (!work) return
    try {
      const result = await worksApi.shareWork(work.id)
      
      // 复制分享链接到剪贴板
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(result.share_url)
        if ((window as any).showToast) {
          ;(window as any).showToast({ message: '分享链接已复制到剪贴板', type: 'success' })
        }
      } else {
        // 降级方案：使用Web Share API
        if (navigator.share) {
          try {
            await navigator.share({
              title: work.title || '我的AI作品',
              text: '来看看我生成的AI作品！',
              url: result.share_url,
            })
            if ((window as any).showToast) {
              ;(window as any).showToast({ message: '分享成功', type: 'success' })
            }
          } catch (shareError: any) {
            // 用户取消分享
            if (shareError.name !== 'AbortError') {
              throw shareError
            }
          }
        } else {
          // 最后的降级方案：显示链接
          const shareText = `分享链接：${result.share_url}`
          if (confirm(shareText + '\n\n点击确定复制链接')) {
            const textarea = document.createElement('textarea')
            textarea.value = result.share_url
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
            if ((window as any).showToast) {
              ;(window as any).showToast({ message: '分享链接已复制', type: 'success' })
            }
          }
        }
      }
    } catch (error: any) {
      console.error('分享失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '分享失败',
          type: 'error',
        })
      }
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-180px)]">
          <div className="text-white/50">加载中...</div>
        </div>
      </MainLayout>
    )
  }

  if (!work) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-180px)]">
          <div className="text-white/50">作品不存在</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">作品详情</h1>
          <Link href="/works" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        {/* 作品预览 */}
        <div className="card">
          {work.work_type === 'video' ? (
            <video
              src={work.result_url}
              controls
              className="w-full rounded-lg"
              poster={work.thumbnail_url}
            />
          ) : (
            <img
              src={work.result_url}
              alt={work.title || '作品'}
              className="w-full rounded-lg"
            />
          )}
          {work.status === 'processing' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="text-white">生成中...</div>
            </div>
          )}
          {work.status === 'failed' && (
            <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center rounded-lg">
              <div className="text-white">生成失败</div>
            </div>
          )}
        </div>

        {/* 作品信息 */}
        <div className="card space-y-3">
          {work.title && (
            <div>
              <div className="text-sm text-white/70 mb-1">作品标题</div>
              <div className="text-white font-medium">{work.title}</div>
            </div>
          )}
          
          {/* 生成类型和使用模型 - 一行2个 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-white/70 mb-1">生成类型</div>
              <div className="text-white">
                {work.content_type === 'text2img' ? '文生图' :
                 work.content_type === 'img2img' ? '图生图' :
                 work.content_type === 'text2video' ? '文生视频' : '图生视频'}
              </div>
            </div>
            {work.model_name && (
              <div>
                <div className="text-sm text-white/70 mb-1">使用模型</div>
                <div className="text-white">{work.model_name}</div>
              </div>
            )}
          </div>

          {/* 提示词和尺寸 - 左右布局 */}
          <div className="grid grid-cols-2 gap-4">
            {work.prompt && (
              <div>
                <div className="text-sm text-white/70 mb-1">提示词</div>
                <div className="text-white truncate" title={work.prompt}>
                  {work.prompt}
                </div>
              </div>
            )}
            {(work.width || work.height) && (
              <div>
                <div className="text-sm text-white/70 mb-1">尺寸</div>
                <div className="text-white">{work.width} × {work.height}</div>
              </div>
            )}
          </div>
          
          {work.negative_prompt && (
            <div>
              <div className="text-sm text-white/70 mb-1">负面提示词</div>
              <div className="text-white truncate" title={work.negative_prompt}>
                {work.negative_prompt}
              </div>
            </div>
          )}
          
          {/* 时长 - 单独显示（如果有） */}
          {work.duration && (
            <div>
              <div className="text-sm text-white/70 mb-1">时长</div>
              <div className="text-white">{work.duration}秒</div>
            </div>
          )}
          
          {/* 消耗算力和状态 - 一行2个 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-white/70 mb-1">消耗算力</div>
              <div className="text-white">{work.computing_power_used}点</div>
            </div>
            <div>
              <div className="text-sm text-white/70 mb-1">状态</div>
              <div className="text-white">
                {work.status === 'processing' ? '生成中' :
                 work.status === 'completed' ? '已完成' : '生成失败'}
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-sm text-white/70 mb-1">生成时间</div>
            <div className="text-white">{new Date(work.created_at).toLocaleString('zh-CN')}</div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDownload}
            disabled={work.status !== 'completed'}
            className="py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下载
          </button>
          <button
            onClick={handleShare}
            disabled={work.status !== 'completed'}
            className="py-3 bg-gray-800 border border-white/20 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            分享
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
