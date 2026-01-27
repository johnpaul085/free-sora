import { api } from './client'

// 作品相关API
export const worksApi = {
  // 获取作品列表
  getWorks: async (params?: {
    page?: number
    pageSize?: number
    work_type?: 'video' | 'image'
    status?: 'processing' | 'completed' | 'failed'
    category?: 'sora' | 'veo' | 'image' | 'all'
  }) => {
    const result = await api.get<any>('/works', { params })
    // 后端返回格式可能是 { list: [], total: 0 } 或直接是数组
    if (result && result.list) {
      return result
    } else if (Array.isArray(result)) {
      return { list: result, total: result.length }
    }
    return { list: [], total: 0 }
  },

  // 获取作品详情
  getWork: async (id: number) => {
    return api.get(`/works/${id}`)
  },

  // 删除作品
  deleteWork: async (id: number) => {
    return api.delete(`/works/${id}`)
  },

  // 更新作品信息
  updateWork: async (id: number, data: { title?: string; is_public?: boolean }) => {
    return api.put(`/works/${id}`, data)
  },

  // 分享到广场（设置为公开）
  shareToSquare: async (id: number) => {
    return api.put(`/works/${id}`, { is_public: true })
  },

  // 下载作品
  downloadWork: async (id: number) => {
    return api.get(`/works/${id}/download`)
  },

  // 分享作品
  shareWork: async (id: number) => {
    return api.post(`/works/${id}/share`)
  },

  // 批量删除作品
  batchDeleteWorks: async (ids: number[]) => {
    return api.post('/works/batch-delete', { ids })
  },

  // 批量下载作品
  batchDownloadWorks: async (ids: number[]) => {
    return api.post('/works/batch-download', { ids })
  },
}
