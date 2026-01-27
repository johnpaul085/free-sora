'use client'

import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">服务协议</h1>
          <Link href="/membership" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        <div className="card">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-xl font-bold text-white mb-4">1. 服务条款</h2>
            <p className="text-white/70 mb-4">
              欢迎使用AI内容生成平台。在使用本服务前，请仔细阅读本服务协议。
            </p>

            <h2 className="text-xl font-bold text-white mb-4">2. 用户账户</h2>
            <p className="text-white/70 mb-4">
              用户需要注册账户才能使用本平台的服务。用户有责任保护账户安全。
            </p>

            <h2 className="text-xl font-bold text-white mb-4">3. 服务内容</h2>
            <p className="text-white/70 mb-4">
              本平台提供AI内容生成服务，包括文生图、图生图、文生视频、图生视频等功能。
            </p>

            <h2 className="text-xl font-bold text-white mb-4">4. 用户责任</h2>
            <p className="text-white/70 mb-4">
              用户不得使用本服务生成违法、违规、侵权的内容。用户对生成的内容承担全部责任。
            </p>

            <h2 className="text-xl font-bold text-white mb-4">5. 知识产权</h2>
            <p className="text-white/70 mb-4">
              用户生成的内容的知识产权归用户所有，但用户授予平台使用、展示、推广这些内容的权利。
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
