'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">出现了一些问题</h2>
        <p className="text-white/70">{error.message || '未知错误'}</p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  )
}
