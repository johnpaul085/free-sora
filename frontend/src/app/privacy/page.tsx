'use client'

import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">隐私政策</h1>
          <Link href="/profile" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        <div className="card">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-xl font-bold text-white mb-4">1. 信息收集</h2>
            <p className="text-white/70 mb-4">
              我们收集您在使用服务时提供的信息，包括但不限于用户名、邮箱、手机号等。
            </p>

            <h2 className="text-xl font-bold text-white mb-4">2. 信息使用</h2>
            <p className="text-white/70 mb-4">
              我们使用收集的信息来提供、维护和改进我们的服务。
            </p>

            <h2 className="text-xl font-bold text-white mb-4">3. 信息保护</h2>
            <p className="text-white/70 mb-4">
              我们采取合理的安全措施来保护您的个人信息不被未经授权的访问、使用或泄露。
            </p>

            <h2 className="text-xl font-bold text-white mb-4">4. 信息共享</h2>
            <p className="text-white/70 mb-4">
              我们不会向第三方出售、交易或转让您的个人信息，除非获得您的明确同意。
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
