'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import { adminApi } from '@/lib/api/admin'
import { useAuthStore } from '@/store/authStore'
import { userApi } from '@/lib/api/user'
import Modal from '@/components/UI/Modal'

interface User {
  id: number
  username: string
  email?: string
  phone?: string
  nickname?: string
  user_type: 'normal' | 'vip' | 'svip'
  status: 'active' | 'banned' | 'deleted'
  computing_power: number
  total_computing_power?: number
  gifted_computing_power?: number
  hd_count?: number
  membership_expires_at?: string | null
  created_at: string
  last_login_at?: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user: currentUser, isAuthenticated } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'normal' | 'vip' | 'svip'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned' | 'deleted'>('all')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({
    username: '',
    nickname: '',
    email: '',
    phone: '',
    user_type: 'normal' as 'normal' | 'vip' | 'svip',
    status: 'active' as 'active' | 'banned' | 'deleted',
    computing_power: 0,
    total_computing_power: 0,
    gifted_computing_power: 0,
    hd_count: 0,
    membership_expires_at: '',
    newPassword: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== 'admin') {
      router.push('/profile')
      return
    }
    loadUsers()
  }, [page, filterType, filterStatus, searchTerm, isAuthenticated, currentUser, router])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const result = await adminApi.getUsers({
        page,
        pageSize,
        search: searchTerm || undefined,
        user_type: filterType !== 'all' ? filterType : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
      })
      setUsers(result.list || [])
      setTotal(result.total || 0)
      setTotalPages(result.totalPages || 0)
    } catch (error: any) {
      console.error('加载用户列表失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '加载用户列表失败',
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadUsers()
  }

  const handleFilterType = (type: 'all' | 'normal' | 'vip' | 'svip') => {
    setFilterType(type)
    setPage(1)
  }

  const handleFilterStatus = (status: 'all' | 'active' | 'banned' | 'deleted') => {
    setFilterStatus(status)
    setPage(1)
  }

  const handleBan = async (userId: number) => {
    if (!confirm('确定要禁用该用户吗？')) return
    try {
      await adminApi.updateUser(userId, { status: 'banned' })
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: '禁用成功',
          type: 'success',
        })
      }
      loadUsers()
    } catch (error: any) {
      console.error('禁用用户失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '禁用用户失败',
          type: 'error',
        })
      }
    }
  }

  const handleUnban = async (userId: number) => {
    if (!confirm('确定要启用该用户吗？')) return
    try {
      await adminApi.updateUser(userId, { status: 'active' })
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: '启用成功',
          type: 'success',
        })
      }
      loadUsers()
    } catch (error: any) {
      console.error('启用用户失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '启用用户失败',
          type: 'error',
        })
      }
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const handleEdit = async (user: User) => {
    setEditingUser(user)
    try {
      // 获取用户详情（包含高清次数等完整信息）
      const userDetail = await adminApi.getUserById(user.id)
      setEditForm({
        username: userDetail.username || '',
        nickname: userDetail.nickname || '',
        email: userDetail.email || '',
        phone: userDetail.phone || '',
        user_type: userDetail.user_type,
        status: userDetail.status,
        computing_power: userDetail.computing_power || 0,
        total_computing_power: userDetail.total_computing_power || 0,
        gifted_computing_power: userDetail.gifted_computing_power || 0,
        hd_count: userDetail.hd_count || 0,
        membership_expires_at: userDetail.membership_expires_at ? new Date(userDetail.membership_expires_at).toISOString().slice(0, 16) : '',
        newPassword: '',
      })
    } catch (error: any) {
      console.error('获取用户详情失败:', error)
      // 如果获取详情失败，使用列表中的基本信息
      setEditForm({
        username: user.username || '',
        nickname: user.nickname || '',
        email: user.email || '',
        phone: user.phone || '',
        user_type: user.user_type,
        status: user.status,
        computing_power: user.computing_power || 0,
        total_computing_power: user.total_computing_power || 0,
        gifted_computing_power: user.gifted_computing_power || 0,
        hd_count: user.hd_count || 0,
        membership_expires_at: user.membership_expires_at ? new Date(user.membership_expires_at).toISOString().slice(0, 16) : '',
        newPassword: '',
      })
    }
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    try {
      setSaving(true)
      
      // 更新用户基本信息
      const updateData: any = {
        nickname: editForm.nickname,
        email: editForm.email,
        phone: editForm.phone,
        user_type: editForm.user_type,
        status: editForm.status,
        computing_power: editForm.computing_power,
        total_computing_power: editForm.total_computing_power,
        gifted_computing_power: editForm.gifted_computing_power,
        hd_count: editForm.hd_count,
        membership_expires_at: editForm.membership_expires_at || null,
      }
      
      await adminApi.updateUser(editingUser.id, updateData)
      
      // 如果设置了新密码，则重置密码
      if (editForm.newPassword && editForm.newPassword.trim()) {
        await adminApi.resetPassword(editingUser.id, editForm.newPassword)
      }
      
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: '更新成功',
          type: 'success',
        })
      }
      setEditingUser(null)
      loadUsers()
      
      // 如果编辑的是当前登录用户，刷新当前用户信息
      if (currentUser && editingUser.id === currentUser.id) {
        await userApi.getUserInfo()
      }
    } catch (error: any) {
      console.error('更新用户失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({
          message: error.message || '更新用户失败',
          type: 'error',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-4 pb-4">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">用户管理</h1>
          <Link href="/profile" className="text-sm text-white/70 hover:text-white">
            返回
          </Link>
        </div>

        {/* 搜索和筛选 */}
        <div className="card space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="搜索用户名、邮箱、手机号"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              onClick={() => handleFilterType('all')}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filterType === 'all' ? 'bg-primary text-white' : 'bg-gray-800 text-white/70 hover:bg-gray-700'
              }`}
            >
              全部类型
            </button>
            <button
              onClick={() => handleFilterType('normal')}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filterType === 'normal' ? 'bg-primary text-white' : 'bg-gray-800 text-white/70 hover:bg-gray-700'
              }`}
            >
              普通用户
            </button>
            <button
              onClick={() => handleFilterType('vip')}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filterType === 'vip' ? 'bg-primary text-white' : 'bg-gray-800 text-white/70 hover:bg-gray-700'
              }`}
            >
              VIP
            </button>
            <button
              onClick={() => handleFilterType('svip')}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filterType === 'svip' ? 'bg-primary text-white' : 'bg-gray-800 text-white/70 hover:bg-gray-700'
              }`}
            >
              SVIP
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleFilterStatus('all')}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filterStatus === 'all' ? 'bg-primary text-white' : 'bg-gray-800 text-white/70 hover:bg-gray-700'
              }`}
            >
              全部状态
            </button>
            <button
              onClick={() => handleFilterStatus('active')}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filterStatus === 'active' ? 'bg-primary text-white' : 'bg-gray-800 text-white/70 hover:bg-gray-700'
              }`}
            >
              正常
            </button>
            <button
              onClick={() => handleFilterStatus('banned')}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filterStatus === 'banned' ? 'bg-primary text-white' : 'bg-gray-800 text-white/70 hover:bg-gray-700'
              }`}
            >
              已禁用
            </button>
          </div>
        </div>

        {/* 用户列表 - 卡片布局 */}
        <div className="space-y-3">
          {loading ? (
            <div className="card py-8 text-center text-white/50">
              加载中...
            </div>
          ) : users.length === 0 ? (
            <div className="card py-8 text-center text-white/50">
              暂无数据
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="card p-4 space-y-3">
                {/* 用户基本信息 */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{user.username}</span>
                      <span className="text-white/50 text-xs">ID: {user.id}</span>
                    </div>
                    {user.nickname && (
                      <div className="text-white/70 text-sm mb-1">昵称: {user.nickname}</div>
                    )}
                    <div className="flex items-center gap-3 text-white/60 text-xs">
                      {user.email && <span>{user.email}</span>}
                      {user.phone && <span>{user.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.user_type === 'vip' ? 'bg-yellow-500/20 text-yellow-400' :
                      user.user_type === 'svip' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-gray-700 text-white/70'
                    }`}>
                      {user.user_type === 'vip' ? 'VIP' : user.user_type === 'svip' ? 'SVIP' : '普通'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      user.status === 'banned' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-700 text-white/70'
                    }`}>
                      {user.status === 'active' ? '正常' : user.status === 'banned' ? '已禁用' : '已删除'}
                    </span>
                  </div>
                </div>

                {/* 用户数据 */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-white/70">
                    <span className="text-white/50">算力: </span>
                    <span className="text-white">{user.computing_power || 0}</span>
                  </div>
                  <div className="text-white/70">
                    <span className="text-white/50">注册: </span>
                    <span className="text-white">{formatDate(user.created_at)}</span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <button 
                    onClick={() => handleEdit(user)}
                    className="flex-1 px-3 py-1.5 text-sm text-primary border border-primary/50 hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    编辑
                  </button>
                  {user.status === 'active' ? (
                    <button 
                      onClick={() => handleBan(user.id)}
                      className="flex-1 px-3 py-1.5 text-sm text-red-400 border border-red-400/50 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      禁用
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUnban(user.id)}
                      className="flex-1 px-3 py-1.5 text-sm text-green-400 border border-green-400/50 hover:bg-green-400/10 rounded-lg transition-colors"
                    >
                      启用
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 分页 */}
        <div className="flex items-center justify-between text-white/70 text-sm">
          <div>共 {total} 条记录</div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="px-3 py-1">
              {page} / {totalPages}
            </span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>

        {/* 编辑用户弹窗 */}
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title="编辑用户"
          size="md"
        >
          <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* 用户名单独一行（只读） */}
            <div>
              <label className="block text-sm text-white/70 mb-1">用户名</label>
              <input
                type="text"
                value={editForm.username}
                disabled
                className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-white/10 text-white/50 cursor-not-allowed"
                placeholder="用户名不可修改"
              />
            </div>

            {/* 第一行：昵称、邮箱 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/70 mb-1">昵称</label>
                <input
                  type="text"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                  placeholder="请输入昵称"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">邮箱</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                  placeholder="请输入邮箱"
                />
              </div>
            </div>

            {/* 第二行：手机号、用户类型 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/70 mb-1">手机号</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                  placeholder="请输入手机号"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">用户类型</label>
                <select
                  value={editForm.user_type}
                  onChange={(e) => setEditForm({ ...editForm, user_type: e.target.value as 'normal' | 'vip' | 'svip' })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
                >
                  <option value="normal">普通用户</option>
                  <option value="vip">VIP</option>
                  <option value="svip">SVIP</option>
                </select>
              </div>
            </div>

            {/* 第三行：状态、当前算力 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/70 mb-1">状态</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'banned' | 'deleted' })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white focus:outline-none focus:border-primary"
                >
                  <option value="active">正常</option>
                  <option value="banned">已禁用</option>
                  <option value="deleted">已删除</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">当前算力</label>
                <input
                  type="number"
                  value={editForm.computing_power}
                  onChange={(e) => setEditForm({ ...editForm, computing_power: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                  placeholder="请输入算力值"
                />
              </div>
            </div>

            {/* 第四行：累计算力、赠送算力 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/70 mb-1">累计算力</label>
                <input
                  type="number"
                  value={editForm.total_computing_power}
                  onChange={(e) => setEditForm({ ...editForm, total_computing_power: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                  placeholder="请输入累计算力值"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">赠送算力</label>
                <input
                  type="number"
                  value={editForm.gifted_computing_power}
                  onChange={(e) => setEditForm({ ...editForm, gifted_computing_power: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                  placeholder="请输入赠送算力值"
                />
              </div>
            </div>

            {/* 第五行：高清次数、会员到期时间 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/70 mb-1">高清次数</label>
                <input
                  type="number"
                  value={editForm.hd_count}
                  onChange={(e) => setEditForm({ ...editForm, hd_count: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                  placeholder="请输入高清次数"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">会员到期时间</label>
                <input
                  type="datetime-local"
                  value={editForm.membership_expires_at}
                  onChange={(e) => setEditForm({ ...editForm, membership_expires_at: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-white/50 mt-1">留空表示永久有效</p>
              </div>
            </div>

            {/* 新密码单独一行 */}
            <div>
              <label className="block text-sm text-white/70 mb-1">新密码（可选）</label>
              <input
                type="password"
                value={editForm.newPassword}
                onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                placeholder="留空则不修改密码"
              />
              <p className="text-xs text-white/50 mt-1">留空则不修改密码</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  )
}
