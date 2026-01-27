'use client'

import { useState } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'

export default function HelpPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const faqs = [
    {
      id: 1,
      question: '如何生成图片？',
      answer: '在首页选择"文生图"或"图生图"功能，输入提示词，选择模型和参数，点击生成即可。',
    },
    {
      id: 2,
      question: '如何生成视频？',
      answer: '在首页选择"文生视频"或"图生视频"功能，选择SORA或VEO模型，输入提示词和参数，点击生成。视频生成需要较长时间，请耐心等待。',
    },
    {
      id: 3,
      question: '算力如何获得？',
      answer: '可以通过购买会员、充值算力、参与活动等方式获得算力。',
    },
    {
      id: 4,
      question: '如何参与分销？',
      answer: '开通会员后自动获得分销权限，分享您的推荐码给好友，好友注册并消费后您即可获得佣金。',
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">帮助中心</h1>
          <Link href="/profile" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.id} className="card">
              <button
                onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between"
              >
                <span className="text-white font-medium text-left">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-white/70 transition-transform ${
                    expandedId === faq.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedId === faq.id && (
                <div className="mt-3 text-white/70 text-sm">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
