'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { userApi } from '@/lib/api/user'

export default function HomePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 如果已登录但store中没有用户信息，则从API获取
    if (isAuthenticated && !user) {
      loadUserInfo()
    } else {
      setLoading(false)
    }
  }, [user, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserInfo = async () => {
    try {
      setLoading(true)
      await userApi.getUserInfo()
    } catch (error: any) {
      console.error('加载用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取用户显示名称
  const getUserDisplayName = () => {
    if (!user) return '未登录'
    return user.nickname || user.username || `用户${user.id}`
  }

  // 获取用户头像URL
  const getUserAvatarUrl = () => {
    return user?.avatar_url || user?.avatar || null
  }

  // 获取用户头像首字母
  const getUserAvatarInitial = () => {
    const name = getUserDisplayName()
    return name.charAt(0).toUpperCase()
  }

  return (
    <MainLayout>
      <div className="space-y-6 pb-4">
        {/* 用户信息栏 */}
        <div className="flex items-center gap-4 pt-2">
          <div className="relative flex flex-col items-center">
            {getUserAvatarUrl() ? (
              <img
                src={getUserAvatarUrl()}
                alt={getUserDisplayName()}
                className="w-14 h-14 rounded-full object-cover border-2 border-primary/40"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 flex items-center justify-center text-white font-bold text-xl">
                <span className="relative z-10">{getUserAvatarInitial()}</span>
              </div>
            )}
            {isAuthenticated && user && user.user_type && user.user_type !== 'normal' && (
              <div className={`absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1 py-0.5 rounded-md whitespace-nowrap ${
                user.user_type === 'svip' 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 border border-amber-300/60' 
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 border border-amber-300/60'
              }`}>
                {user.user_type === 'svip' && (
                  <svg className="w-2 h-2 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                )}
                <span className={`text-[9px] font-semibold ${
                  user.user_type === 'svip' ? 'text-gray-900' : 'text-gray-900'
                }`}>
                  {user.user_type === 'svip' ? 'SVIP' : 'VIP'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            {loading ? (
              <>
                <div className="text-xl font-bold text-white">加载中...</div>
                <div className="text-sm text-white/70 mt-0.5">正在获取用户信息</div>
              </>
            ) : isAuthenticated && user ? (
              <>
                <div className="text-xl font-bold text-white">{getUserDisplayName()}</div>
                <div className="text-sm text-white/70 mt-0.5">
                  ID: {user.id}
                  {user.user_type && user.user_type !== 'normal' && (
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                      user.user_type === 'svip' 
                        ? 'bg-primary/20 text-yellow-400' 
                        : 'bg-primary/20 text-yellow-500'
                    }`}>
                      {user.user_type === 'svip' ? 'SVIP' : 'VIP'}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-white">未登录</div>
                <Link href="/auth/login" className="text-sm text-primary hover:text-primary/80 mt-0.5 inline-block">
                  点击登录
                </Link>
              </>
            )}
          </div>
          <Link
            href="/settings"
            className="p-2 rounded-lg hover:bg-black/20 transition-colors"
            onClick={(e) => {
              if (!isAuthenticated) {
                e.preventDefault()
                router.push('/auth/login')
              }
            }}
          >
            <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>

        {/* 主Banner卡片 */}
        <div className="relative overflow-hidden rounded-2xl p-6 min-h-[280px] md:min-h-[320px]">
          <div className="relative z-10 space-y-10">
            {/* 上部分：左右布局 */}
            <div className="flex items-center gap-4">
              {/* 左侧：标题 */}
              <div className="flex-1 flex flex-col justify-center">
                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">一句话生成视频</h1>
                <p className="text-xs md:text-sm text-white">Generate a video in one AI sentence</p>
              </div>
              
              {/* 右侧：2个案例 */}
              <div className="flex gap-2 flex-shrink-0 items-start">
                <div 
                  className="relative w-20 h-[142px] md:w-24 md:h-[171px] rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/40 overflow-hidden group cursor-pointer transition-all duration-300"
                  style={{ transform: 'rotate(-12deg) translateY(-12px)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'rotate(0deg) translateY(0px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'rotate(-12deg) translateY(-12px)'
                  }}
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Video 1 load error:', e)
                    }}
                    onLoadedData={(e) => {
                      console.log('Video 1 loaded successfully')
                    }}
                  >
                    <source src="/anli1.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div 
                  className="relative w-20 h-[142px] md:w-24 md:h-[171px] rounded-xl bg-gradient-to-br from-secondary/20 to-primary/20 border border-secondary/40 overflow-hidden group cursor-pointer transition-all duration-300"
                  style={{ transform: 'rotate(12deg) translateY(12px)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'rotate(0deg) translateY(0px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'rotate(12deg) translateY(12px)'
                  }}
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Video 2 load error:', e)
                    }}
                    onLoadedData={(e) => {
                      console.log('Video 2 loaded successfully')
                    }}
                  >
                    <source src="/anli2.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 下部分：Sora2按钮 */}
            <Link href="/generate/text-to-video?sora" className="w-full flex items-center justify-center gap-2 text-sm md:text-base py-3 md:py-4 text-white font-semibold rounded-full transition-all duration-300 hover:scale-[0.98] active:scale-[0.96]" style={{ background: 'linear-gradient(to right, #10b981 0%, #3b82f6 30%, #3b82f6 70%, #8b5cf6 100%)' }}>
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Sora2创作灵感视频</span>
            </Link>
          </div>
        </div>

        {/* 功能网格 */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* SORA视频创作 */}
            <Link href="/generate/sora" className="card-hover group block">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-xl bg-transparent border-2 border-white/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-white/60 transition-all duration-300">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="gradient-sora" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="url(#gradient-sora)" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-base mb-1 text-white">SORA生成</div>
                  <div className="text-xs text-white/70 leading-relaxed">使用SORA模型创作高质量视频</div>
                </div>
              </div>
            </Link>

            {/* VEO视频创作 */}
            <Link href="/generate/veo" className="card-hover group block">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-xl bg-transparent border-2 border-white/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-white/60 transition-all duration-300">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="gradient-veo" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                    </defs>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" stroke="url(#gradient-veo)" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="url(#gradient-veo)" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-base mb-1 text-white">VEO生成</div>
                  <div className="text-xs text-white/70 leading-relaxed">使用VEO模型创作创意视频</div>
                </div>
              </div>
            </Link>

            {/* 文生图 */}
            <Link href="/generate/text-to-image" className="card-hover group block">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-xl bg-transparent border-2 border-white/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-white/60 transition-all duration-300">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="gradient-text2img" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                    </defs>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="url(#gradient-text2img)" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-base mb-1 text-white">文生图</div>
                  <div className="text-xs text-white/70 leading-relaxed">通过文字描述生成精美图片</div>
                </div>
              </div>
            </Link>

            {/* 图生图 */}
            <Link href="/generate/image-to-image" className="card-hover group block">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-xl bg-transparent border-2 border-white/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:border-white/60 transition-all duration-300">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="gradient-img2img" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="url(#gradient-img2img)" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-base mb-1 text-white">图生图</div>
                  <div className="text-xs text-white/70 leading-relaxed">基于现有图片生成新图片</div>
                </div>
              </div>
            </Link>
          </div>

          {/* AI助手卡片 - 单独一行，居中显示 */}
          <div className="flex justify-center">
            <Link href="/assistant" className="card-hover group max-w-md w-full block">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <div className="font-bold text-base text-white">AI助手</div>
                </div>
                <div className="text-xs text-white/70 leading-relaxed text-center">智能对话助手，解答你的创作疑问</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
