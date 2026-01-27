import { api } from './client'

// 角色相关API
export const charactersApi = {
  // 获取角色列表
  getCharacters: async (params?: {
    page?: number
    pageSize?: number
    type?: 'sora' | 'custom'
    includeSystem?: boolean
  }) => {
    const queryParams: any = { ...params }
    if (queryParams.includeSystem) {
      queryParams.includeSystem = 'true'
    }
    const result = await api.get<any>('/characters', { params: queryParams })
    // 后端返回格式可能是 { list: [], total: 0 } 或直接是数组
    if (result && result.list) {
      return result
    } else if (Array.isArray(result)) {
      return { list: result, total: result.length }
    }
    return { list: [], total: 0 }
  },

  // 获取角色详情
  getCharacter: async (id: number) => {
    return api.get(`/characters/${id}`)
  },

  // 创建角色
  createCharacter: async (data: {
    name: string
    avatar?: string
    type: 'sora' | 'custom'
  }) => {
    return api.post('/characters', {
      name: data.name,
      avatar_url: data.avatar,
      type: data.type,
    })
  },

  // 更新角色
  updateCharacter: async (id: number, data: {
    name?: string
    avatar?: string
  }) => {
    return api.put(`/characters/${id}`, {
      name: data.name,
      avatar_url: data.avatar,
    })
  },

  // 删除角色
  deleteCharacter: async (id: number) => {
    return api.delete(`/characters/${id}`)
  },
}
