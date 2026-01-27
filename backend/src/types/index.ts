export interface User {
  id: number
  username: string
  email?: string
  phone?: string
  avatar_url?: string
  nickname?: string
  user_type: 'normal' | 'vip' | 'svip'
  role: 'user' | 'admin'
  referrer_id?: number
  referral_code: string
  computing_power: number
  total_computing_power: number
  hd_count: number
  gifted_computing_power: number
  membership_expires_at?: string | null
  status: 'active' | 'banned' | 'deleted'
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface Work {
  id: number
  user_id: number
  title?: string
  description?: string
  work_type: 'image' | 'video'
  content_type: 'text2img' | 'img2img' | 'text2video' | 'img2video'
  model_name?: string
  prompt?: string
  negative_prompt?: string
  source_image_url?: string
  result_url: string
  thumbnail_url?: string
  file_size?: number
  duration?: number
  width?: number
  height?: number
  status: 'processing' | 'completed' | 'failed'
  error_message?: string
  is_public: boolean
  view_count: number
  like_count: number
  share_count: number
  computing_power_used: number
  created_at: string
  updated_at: string
}

export interface Character {
  id: number
  user_id?: number | null
  name: string
  avatar_url?: string
  type: 'sora' | 'custom'
  is_system?: boolean
  sora_id?: string
  created_at: string
  updated_at: string
}

export interface GenerationTask {
  id: number
  user_id: number
  work_id?: number
  task_type: 'text2img' | 'img2img' | 'text2video' | 'img2video'
  model_provider?: string
  model_name?: string
  prompt: string
  negative_prompt?: string
  source_image_url?: string
  parameters?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  result_url?: string
  error_message?: string
  api_response?: string
  created_at: string
  updated_at: string
}
