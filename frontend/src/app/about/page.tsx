'use client'

import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">关于我们</h1>
          <Link href="/profile" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        <div className="card space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">平台介绍</h2>
            <p className="text-white/70 text-sm">
              AI内容生成平台是一个专业的AI创作工具，支持文生图、图生图、文生视频、图生视频等多种创作方式。
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-2">核心功能</h2>
            <div className="text-white/70 text-sm space-y-1">
              <div>• 支持多种AI模型（SORA、VEO、Stable Diffusion等）</div>
              <div>• 高质量内容生成</div>
              <div>• 完整的作品管理系统</div>
              <div>• 分销推广系统</div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-2">联系方式</h2>
            <div className="text-white/70 text-sm space-y-1">
              <div>邮箱: support@example.com</div>
              <div>客服QQ: 123456789</div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
