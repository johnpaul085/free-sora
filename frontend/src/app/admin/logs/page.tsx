'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { adminApi } from '@/lib/api/admin'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

interface AdminLog {
  id: number
  admin_id: number
  admin_name?: string
  action_type: string
  target_type?: string
  target_id?: number
  action_detail?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export default function AdminLogsPage() {
  const router = useRouter()
  const { user: currentUser, isAuthenticated } = useAuthStore()
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [filterActionType, setFilterActionType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== 'admin') {
      router.push('/profile')
      return
    }
    loadLogs()
  }, [page, filterActionType, isAuthenticated, currentUser, router])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const result = await adminApi.getAdminLogs({
        page,
        pageSize,
        action_type: filterActionType === 'all' ? undefined : filterActionType,
        search: searchTerm || undefined,
      })

      if (result && result.list) {
        setLogs(result.list)
        setTotal(result.total || 0)
      }
    } catch (error: any) {
      console.error('加载操作日志失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载操作日志失败',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadLogs()
  }

  const getActionTypeText = (type: string) => {
    const map: Record<string, string> = {
      edit_user: '编辑用户',
      ban_user: '封禁用户',
      unban_user: '解封用户',
      delete_user: '删除用户',
      update_config: '更新配置',
      review_work: '审核作品',
    }
    return map[type] || type
  }

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">操作日志</h1>
          <Link href="/profile" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        {/* 搜索和筛选 */}
        <div className="card space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="搜索操作类型、操作对象"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
            >
              搜索
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setFilterActionType('all'); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm ${
                filterActionType === 'all'
                  ? 'bg-primary/20 text-primary border border-primary'
                  : 'bg-gray-800 text-white/70 border border-white/20 hover:bg-gray-700'
              }`}
            >
              全部操作
            </button>
            {['edit_user', 'ban_user', 'unban_user', 'update_config', 'review_work'].map((type) => (
              <button
                key={type}
                onClick={() => { setFilterActionType(type); setPage(1) }}
                className={`px-4 py-2 rounded-lg text-sm ${
                  filterActionType === type
                    ? 'bg-primary/20 text-primary border border-primary'
                    : 'bg-gray-800 text-white/70 border border-white/20 hover:bg-gray-700'
                }`}
              >
                {getActionTypeText(type)}
              </button>
            ))}
          </div>
        </div>

        {/* 日志列表 */}
        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-white/50">加载中...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-white/50">暂无操作日志</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">操作人</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">操作类型</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">操作对象</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">IP地址</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">操作时间</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 text-white text-sm">{log.admin_name || `管理员${log.admin_id}`}</td>
                      <td className="py-3 px-4 text-white/70 text-sm">{getActionTypeText(log.action_type)}</td>
                      <td className="py-3 px-4 text-white/70 text-sm">
                        {log.target_type && log.target_id ? `${log.target_type} #${log.target_id}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-white/70 text-sm">{log.ip_address || '-'}</td>
                      <td className="py-3 px-4 text-white/70 text-sm">
                        {new Date(log.created_at).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {total > pageSize && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <div className="text-white/70 text-sm">
                共 {total} 条，第 {page} / {Math.ceil(total / pageSize)} 页
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage(Math.min(Math.ceil(total / pageSize), page + 1))}
                  disabled={page >= Math.ceil(total / pageSize)}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
