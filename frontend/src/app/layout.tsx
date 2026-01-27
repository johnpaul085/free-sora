import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'

export const metadata: Metadata = {
  title: 'AI内容生成平台',
  description: '支持文生图、图生图、文生视频、图生视频的AI内容生成平台',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-black text-white antialiased relative">
        {/* 背景视频 */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 w-full h-full object-cover z-0"
        >
          <source src="/bg.mp4" type="video/mp4" />
        </video>
        {/* 内容层 */}
        <div className="relative z-10">
          {children}
        </div>
        {/* 客户端提供者（Toast等） */}
        <ClientProviders />
      </body>
    </html>
  )
}
