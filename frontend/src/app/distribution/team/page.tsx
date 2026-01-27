'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { distributionApi } from '@/lib/api/distribution'
import { useAuthStore } from '@/store/authStore'

interface TeamMember {
  id: number
  user_id: number
  username?: string
  email?: string
  phone?: string
  register_time?: string
  created_at: string
  level: number
}

export default function TeamPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'level1' | 'level2'>('level1')
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    loadTeam()
  }, [isAuthenticated, router, activeTab])

  const loadTeam = async () => {
    try {
      setLoading(true)
      const result = await distributionApi.getTeam({
        level: activeTab === 'level1' ? 1 : 2,
        page: 1,
        pageSize: 100,
      })
      if (result && result.list) {
        setTeam(result.list)
      } else if (Array.isArray(result)) {
        setTeam(result)
      }
    } catch (error: any) {
      console.error('加载团队列表失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载团队列表失败',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">我的团队</h1>
          <Link href="/distribution" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('level1')}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              activeTab === 'level1' ? 'bg-primary text-white' : 'bg-gray-800 text-white/70 hover:bg-gray-700'
            }`}
          >
            一级团队
          </button>
          <button
            onClick={() => setActiveTab('level2')}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              activeTab === 'level2' ? 'bg-primary text-white' : 'bg-gray-800 text-white/70 hover:bg-gray-700'
            }`}
          >
            二级团队
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="card text-center py-12">
              <div className="text-white/50 text-sm">加载中...</div>
            </div>
          ) : team.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-white/50 text-sm">暂无团队成员</div>
            </div>
          ) : (
            team.map((member) => (
              <div key={member.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-white font-medium mb-1">
                      {member.username || member.email || member.phone || `用户${member.user_id}`}
                    </div>
                    <div className="text-sm text-white/70">
                      注册时间: {new Date(member.register_time || member.created_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  )
}
