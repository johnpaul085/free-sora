import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 如果是FormData，删除Content-Type让浏览器自动设置（包含boundary）
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response

    // 检查响应是否为 JSON
    const contentType = response.headers['content-type'] || ''
    if (!contentType.includes('application/json')) {
      const error = new Error('服务器返回了非JSON格式的响应')
      return Promise.reject(error)
    }

    // 如果后端返回的code不是0，视为错误
    if (data.code !== 0 && data.code !== 200) {
      const error = new Error(data.message || '请求失败')
      ;(error as any).code = data.code
      return Promise.reject(error)
    }

    return response
  },
  (error) => {
    // 处理HTTP错误
    if (error.response) {
      const { status, data, headers } = error.response
      
      // 检查是否是 HTML 响应（通常是 404 或 500 错误页面）
      const contentType = headers['content-type'] || ''
      if (contentType.includes('text/html')) {
        if ((window as any).showToast) {
          ;(window as any).showToast({ 
            message: `服务器错误 (${status})，请检查API路由配置`, 
            type: 'error' 
          })
        }
        return Promise.reject(new Error(`服务器返回了HTML页面而不是JSON (${status})`))
      }

      switch (status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token')
            window.location.href = '/auth/login'
          }
          break
        case 403:
          if ((window as any).showToast) {
            ;(window as any).showToast({ message: '没有权限', type: 'error' })
          }
          break
        case 404:
          if ((window as any).showToast) {
            ;(window as any).showToast({ message: '资源不存在', type: 'error' })
          }
          break
        case 500:
          if ((window as any).showToast) {
            ;(window as any).showToast({ message: '服务器错误', type: 'error' })
          }
          break
        default:
          if ((window as any).showToast) {
            ;(window as any).showToast({
              message: data?.message || '请求失败',
              type: 'error',
            })
          }
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '网络错误，请检查网络连接', type: 'error' })
      }
    } else {
      // 其他错误（包括 JSON 解析错误）
      if (error.message && error.message.includes('JSON')) {
        if ((window as any).showToast) {
          ;(window as any).showToast({ 
            message: '服务器响应格式错误，请检查API配置', 
            type: 'error' 
          })
        }
      } else {
        if ((window as any).showToast) {
          ;(window as any).showToast({ message: error.message || '请求失败', type: 'error' })
        }
      }
    }

    return Promise.reject(error)
  }
)

// API请求方法
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.get<ApiResponse<T>>(url, config).then((res) => res.data.data)
  },

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.post<ApiResponse<T>>(url, data, config).then((res) => {
      // 如果返回的data本身就是对象，直接返回
      // 否则返回res.data.data
      return res.data.data !== undefined ? res.data.data : res.data
    })
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.put<ApiResponse<T>>(url, data, config).then((res) => res.data.data)
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.delete<ApiResponse<T>>(url, config).then((res) => res.data.data)
  },

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.patch<ApiResponse<T>>(url, data, config).then((res) => res.data.data)
  },
}

export default apiClient
