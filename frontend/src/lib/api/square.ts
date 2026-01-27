import { api } from './client'

// 广场相关API
export const squareApi = {
  // 获取广场作品列表
  getWorks: async (params?: {
    page?: number
    pageSize?: number
    work_type?: 'image' | 'video'
    sort?: 'latest' | 'likes' | 'views'
  }) => {
    return api.get('/square/works', { params })
  },

  // 点赞作品
  likeWork: async (workId: number | string) => {
    return api.post(`/square/works/${workId}/like`)
  },

  // 浏览作品（增加浏览数）
  viewWork: async (workId: number | string) => {
    return api.post(`/square/works/${workId}/view`)
  },
}
