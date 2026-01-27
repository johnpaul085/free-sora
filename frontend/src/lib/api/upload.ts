import { api } from './client'

// 文件上传相关API
export const uploadApi = {
  // 上传头像
  uploadAvatar: async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    
    // 注意：不要手动设置Content-Type，让浏览器自动设置（包含boundary）
    return api.post('/upload/avatar', formData, {
      headers: {
        // 删除Content-Type，让axios自动设置
      },
    })
  },

  // 上传图片
  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    
    // 注意：不要手动设置Content-Type，让浏览器自动设置（包含boundary）
    return api.post('/upload/image', formData)
  },

  // 上传视频
  uploadVideo: async (file: File) => {
    const formData = new FormData()
    formData.append('video', file)
    
    // 注意：不要手动设置Content-Type，让浏览器自动设置（包含boundary）
    return api.post('/upload/video', formData)
  },

  // 删除文件
  deleteFile: async (filename: string, type: 'avatar' | 'image' | 'video' = 'image') => {
    return api.delete('/upload/file', {
      data: { filename, type },
    })
  },
}
