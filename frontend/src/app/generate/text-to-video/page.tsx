'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TextToVideoPage() {
  const router = useRouter()

  useEffect(() => {
    // 重定向到SORA页面
    router.replace('/generate/sora')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-white/50">正在跳转...</div>
    </div>
  )
}
