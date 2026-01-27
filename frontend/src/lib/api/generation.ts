import { api } from './client'

// 内容生成相关API
export const generationApi = {
  // 文生图
  textToImage: async (data: {
    prompt: string
    negativePrompt?: string
    width: number
    height: number
    model: string
  }) => {
    return api.post('/generate/text-to-image', {
      task_type: 'text2img',
      prompt: data.prompt,
      negative_prompt: data.negativePrompt,
      model_name: data.model,
      parameters: {
        width: data.width,
        height: data.height,
      },
    })
  },

  // 图生图
  imageToImage: async (data: {
    image: File | string
    prompt: string
    model: string
    strength?: number
  }) => {
    // TODO: 实现文件上传后，使用文件URL
    const imageUrl = typeof data.image === 'string' ? data.image : ''
    
    return api.post('/generate/image-to-image', {
      task_type: 'img2img',
      prompt: data.prompt,
      source_image_url: imageUrl,
      model_name: data.model,
      parameters: {
        strength: data.strength || 0.7,
      },
    })
  },

  // 文生视频（模型由后端AI自动选择）
  textToVideo: async (data: {
    prompt: string
    duration?: number
    resolution?: string
    aspectRatio?: string // 画面比例（16:9 或 9:16）
    characterId?: number
    model?: string // 可选：sora 或 veo，用于标识模型类型
  }) => {
    return api.post('/generate/text-to-video', {
      task_type: 'text2video',
      prompt: data.prompt,
      model_name: data.model || null, // 传递模型标识（sora/veo），后端会根据此选择对应配置
      parameters: {
        duration: data.duration || 10,
        resolution: data.resolution || '1080p',
        aspectRatio: data.aspectRatio, // 传递画面比例
      },
    })
  },

  // 图生视频（模型由后端AI自动选择）
  imageToVideo: async (data: {
    image: File | string
    prompt: string
    duration?: number
    characterId?: number
  }) => {
    // TODO: 实现文件上传后，使用文件URL
    const imageUrl = typeof data.image === 'string' ? data.image : ''
    
    return api.post('/generate/image-to-video', {
      task_type: 'img2video',
      prompt: data.prompt,
      source_image_url: imageUrl,
      // 不传递model_name和model_provider，由后端根据配置自动选择
      parameters: {
        duration: data.duration || 10,
      },
    })
  },

  // 获取生成任务状态
  getTaskStatus: async (taskId: number | string) => {
    return api.get(`/generate/tasks/${taskId}`)
  },

  // 取消生成任务
  cancelTask: async (taskId: number | string) => {
    return api.post(`/generate/tasks/${taskId}/cancel`)
  },

  // 获取图片模型列表
  getImageModels: async () => {
    return api.get('/generate/image-models')
  },
}
