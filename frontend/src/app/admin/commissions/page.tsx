'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { adminApi } from '@/lib/api/admin'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

interface Commission {
  id: number
  user_id: number
  user_username?: string
  source_user_id: number
  source_username?: string
  amount: number
  commission_type: 'direct' | 'indirect'
  level: number
  status: 'pending' | 'available' | 'withdrawn' | 'cancelled'
  created_at: string
}

export default function AdminCommissionsPage() {
  const router = useRouter()
  const { user: currentUser, isAuthenticated } = useAuthStore()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== 'admin') {
      router.push('/profile')
      return
    }
    loadCommissions()
  }, [page, filterStatus, filterType, isAuthenticated, currentUser, router])

  const loadCommissions = async () => {
    try {
      setLoading(true)
      const result = await adminApi.getCommissions({
        page,
        pageSize,
        status: filterStatus === 'all' ? undefined : filterStatus,
        commission_type: filterType === 'all' ? undefined : filterType,
        search: searchTerm || undefined,
      })

      if (result && result.list) {
        setCommissions(result.list)
        setTotal(result.total || 0)
      }
    } catch (error: any) {
      console.error('加载佣金列表失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载佣金列表失败',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadCommissions()
  }

  const handleStatusChange = async (commissionId: number, newStatus: string) => {
    try {
      await adminApi.updateCommissionStatus(commissionId, newStatus)
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '佣金状态更新成功', type: 'success' })
      }
      loadCommissions()
    } catch (error: any) {
      console.error('更新佣金状态失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '更新失败',
          type: 'error',
        })
      }
    }
  }

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待结算',
      available: '可提现',
      withdrawn: '已提现',
      cancelled: '已取消',
    }
    return map[status] || status
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      available: 'bg-green-500/20 text-green-400',
      withdrawn: 'bg-blue-500/20 text-blue-400',
      cancelled: 'bg-gray-700 text-white/70',
    }
    return map[status] || 'bg-gray-700 text-white/70'
  }

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">佣金管理</h1>
          <Link href="/profile" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        {/* 搜索和筛选 */}
        <div className="card space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="搜索用户名"
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
              onClick={() => { setFilterStatus('all'); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm ${
                filterStatus === 'all'
                  ? 'bg-primary/20 text-primary border border-primary'
                  : 'bg-gray-800 text-white/70 border border-white/20 hover:bg-gray-700'
              }`}
            >
              全部状态
            </button>
            {['pending', 'available', 'withdrawn', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => { setFilterStatus(status); setPage(1) }}
                className={`px-4 py-2 rounded-lg text-sm ${
                  filterStatus === status
                    ? 'bg-primary/20 text-primary border border-primary'
                    : 'bg-gray-800 text-white/70 border border-white/20 hover:bg-gray-700'
                }`}
              >
                {getStatusText(status)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setFilterType('all'); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm ${
                filterType === 'all'
                  ? 'bg-primary/20 text-primary border border-primary'
                  : 'bg-gray-800 text-white/70 border border-white/20 hover:bg-gray-700'
              }`}
            >
              全部类型
            </button>
            <button
              onClick={() => { setFilterType('direct'); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm ${
                filterType === 'direct'
                  ? 'bg-primary/20 text-primary border border-primary'
                  : 'bg-gray-800 text-white/70 border border-white/20 hover:bg-gray-700'
              }`}
            >
              直接佣金
            </button>
            <button
              onClick={() => { setFilterType('indirect'); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm ${
                filterType === 'indirect'
                  ? 'bg-primary/20 text-primary border border-primary'
                  : 'bg-gray-800 text-white/70 border border-white/20 hover:bg-gray-700'
              }`}
            >
              间接佣金
            </button>
          </div>
        </div>

        {/* 佣金列表 */}
        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-white/50">加载中...</div>
            </div>
          ) : commissions.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-white/50">暂无佣金记录</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">获得佣金用户</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">来源用户</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">佣金金额</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">类型</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">层级</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">状态</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">创建时间</th>
                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 text-white text-sm">{commission.user_username || `用户${commission.user_id}`}</td>
                      <td className="py-3 px-4 text-white text-sm">{commission.source_username || `用户${commission.source_user_id}`}</td>
                      <td className="py-3 px-4 text-white text-sm">¥{Number(commission.amount).toFixed(2)}</td>
                      <td className="py-3 px-4 text-white/70 text-sm">
                        {commission.commission_type === 'direct' ? '直接' : '间接'}
                      </td>
                      <td className="py-3 px-4 text-white/70 text-sm">一级</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(commission.status)}`}>
                          {getStatusText(commission.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white/70 text-sm">
                        {new Date(commission.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={commission.status}
                          onChange={(e) => handleStatusChange(commission.id, e.target.value)}
                          className="px-2 py-1 rounded bg-gray-800 border border-white/20 text-white text-sm focus:outline-none focus:border-primary"
                        >
                          <option value="pending">待结算</option>
                          <option value="available">可提现</option>
                          <option value="withdrawn">已提现</option>
                          <option value="cancelled">已取消</option>
                        </select>
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
