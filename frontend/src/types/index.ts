// 用户相关类型
export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  computePower: number
  vipLevel: number
  totalGenerated: number
}

// 生成任务状态
export type TaskStatus = 'processing' | 'completed' | 'failed'

// 图片生成相关
export interface GenerateImageRequest {
  prompt: string
  negativePrompt?: string
  width: number
  height: number
  numImages: number
  style?: string
  seed?: number
  provider?: string
  model?: string
}

export interface GenerateImageResponse {
  taskId: string
  status: TaskStatus
  estimatedTime: number
}

// 视频生成相关
export interface GenerateVideoRequest {
  prompt: string
  model: 'sora' | 'veo' | 'runway'
  duration: number
  resolution: string
  fps: number
  style?: string
}

export interface GenerateVideoResponse {
  taskId: string
  status: TaskStatus
  estimatedTime: number
}

// 作品相关
export interface Work {
  id: string
  type: 'image' | 'video'
  title: string
  thumbnail: string
  status: TaskStatus
  createdAt: string
  fileUrl: string
  prompt?: string
  model?: string
}

// AI服务商配置
export interface AIProvider {
  id: string
  name: string
  enabled: boolean
  models: string[]
}

export interface AIConfig {
  imageProvider: string
  imageModel: string
  videoProvider: string
  videoModel: string
  assistantProvider: string
  assistantModel: string
}

// API响应格式
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}
