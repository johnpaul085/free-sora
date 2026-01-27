import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../config'
import { getFileUrl } from '../middleware/upload'
import { writeLog } from './logger'

/**
 * 下载图片并保存到本地服务器
 * @param imageUrl 图片URL（可以是http/https URL或base64数据）
 * @returns 本地服务器URL
 */
export async function downloadAndSaveImage(imageUrl: string): Promise<string> {
  try {
    writeLog('开始下载图片到本地', { imageUrl: imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : '') })
    
    // 确保图片目录存在
    const imageDir = path.join(config.upload.dir, 'images')
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true })
    }

    let imageBuffer: Buffer
    let fileExtension = '.png'
    let imageType = 'unknown'

    // 处理base64数据
    if (imageUrl.startsWith('data:image/')) {
      imageType = 'base64'
      const base64Data = imageUrl.split(',')[1]
      imageBuffer = Buffer.from(base64Data, 'base64')
      
      // 从data URI中提取文件类型
      const mimeMatch = imageUrl.match(/data:image\/([^;]+)/)
      if (mimeMatch) {
        const mimeType = mimeMatch[1]
        fileExtension = mimeType === 'jpeg' ? '.jpg' : `.${mimeType}`
      }
      
      writeLog('图片类型: base64', { mimeType: mimeMatch?.[1] || 'unknown', size: imageBuffer.length })
    } else {
      imageType = 'url'
      // 从URL下载图片
      writeLog('开始从URL下载图片', { url: imageUrl })
      
      const response = await fetch(imageUrl, {
        signal: AbortSignal.timeout(30000), // 30秒超时
      })

      if (!response.ok) {
        throw new Error(`下载图片失败: ${response.status} ${response.statusText}`)
      }

      imageBuffer = Buffer.from(await response.arrayBuffer())
      
      // 从Content-Type或URL中获取文件扩展名
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.startsWith('image/')) {
        const mimeType = contentType.split('/')[1]
        fileExtension = mimeType === 'jpeg' ? '.jpg' : `.${mimeType}`
      } else {
        // 从URL中提取扩展名
        const urlMatch = imageUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)
        if (urlMatch) {
          fileExtension = urlMatch[0].toLowerCase()
        }
      }
      
      writeLog('图片下载成功', { 
        contentType: contentType || 'unknown',
        size: imageBuffer.length,
        extension: fileExtension
      })
    }

    // 生成唯一文件名
    const filename = `${uuidv4()}${fileExtension}`
    const filePath = path.join(imageDir, filename)

    // 保存文件
    fs.writeFileSync(filePath, imageBuffer)
    
    const localUrl = getFileUrl(filename, 'image')
    writeLog('图片已保存到本地', { 
      filename,
      filePath,
      localUrl,
      size: imageBuffer.length,
      imageType
    })

    // 返回本地服务器URL
    return localUrl
  } catch (err: any) {
    console.error('下载并保存图片失败:', err)
    writeLog('下载并保存图片失败', { 
      error: err.message || String(err),
      imageUrl: imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : '')
    })
    // 如果下载失败，返回原始URL
    return imageUrl
  }
}

/**
 * 下载视频并保存到本地服务器
 * @param videoUrl 视频URL（http/https URL）
 * @returns 本地服务器URL
 */
export async function downloadAndSaveVideo(videoUrl: string): Promise<string> {
  try {
    writeLog('开始下载视频到本地', { videoUrl: videoUrl.substring(0, 100) + (videoUrl.length > 100 ? '...' : '') })
    
    // 确保视频目录存在
    const videoDir = path.join(config.upload.dir, 'videos')
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true })
    }

    let videoBuffer: Buffer
    let fileExtension = '.mp4'
    let videoType = 'url'

    // 从URL下载视频
    writeLog('开始从URL下载视频', { url: videoUrl })
    
    const response = await fetch(videoUrl, {
      signal: AbortSignal.timeout(120000), // 120秒超时（视频文件可能较大）
    })

    if (!response.ok) {
      throw new Error(`下载视频失败: ${response.status} ${response.statusText}`)
    }

    videoBuffer = Buffer.from(await response.arrayBuffer())
    
    // 从Content-Type或URL中获取文件扩展名
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.startsWith('video/')) {
      const mimeType = contentType.split('/')[1]
      if (mimeType === 'mp4') {
        fileExtension = '.mp4'
      } else if (mimeType === 'webm') {
        fileExtension = '.webm'
      } else if (mimeType === 'quicktime') {
        fileExtension = '.mov'
      } else {
        fileExtension = `.${mimeType}`
      }
    } else {
      // 从URL中提取扩展名
      const urlMatch = videoUrl.match(/\.(mp4|webm|mov|avi|mkv)/i)
      if (urlMatch) {
        fileExtension = urlMatch[0].toLowerCase()
      }
    }
    
    writeLog('视频下载成功', { 
      contentType: contentType || 'unknown',
      size: videoBuffer.length,
      extension: fileExtension,
      sizeMB: (videoBuffer.length / 1024 / 1024).toFixed(2)
    })

    // 生成唯一文件名
    const filename = `${uuidv4()}${fileExtension}`
    const filePath = path.join(videoDir, filename)

    // 保存文件
    fs.writeFileSync(filePath, videoBuffer)
    
    const localUrl = getFileUrl(filename, 'video')
    writeLog('视频已保存到本地', { 
      filename,
      filePath,
      localUrl,
      size: videoBuffer.length,
      sizeMB: (videoBuffer.length / 1024 / 1024).toFixed(2),
      videoType
    })

    // 返回本地服务器URL
    return localUrl
  } catch (err: any) {
    console.error('下载并保存视频失败:', err)
    writeLog('下载并保存视频失败', { 
      error: err.message || String(err),
      videoUrl: videoUrl.substring(0, 100) + (videoUrl.length > 100 ? '...' : '')
    })
    // 如果下载失败，返回原始URL
    return videoUrl
  }
}
