import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { config } from '../config'
import { v4 as uuidv4 } from 'uuid'

// 确保上传目录存在
const uploadDir = config.upload.dir
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 创建子目录
const avatarDir = path.join(uploadDir, 'avatars')
const imageDir = path.join(uploadDir, 'images')
const videoDir = path.join(uploadDir, 'videos')

;[avatarDir, imageDir, videoDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// 文件存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 根据文件类型选择目录
    if (file.fieldname === 'avatar') {
      cb(null, avatarDir)
    } else if (file.fieldname === 'image' || file.mimetype.startsWith('image/')) {
      cb(null, imageDir)
    } else if (file.mimetype.startsWith('video/')) {
      cb(null, videoDir)
    } else {
      cb(null, uploadDir)
    }
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：UUID + 原始扩展名
    const ext = path.extname(file.originalname)
    const filename = `${uuidv4()}${ext}`
    cb(null, filename)
  },
})

// 文件过滤器
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 允许的文件类型
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ]

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('不支持的文件类型'))
  }
}

// 创建multer实例
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize, // 最大文件大小
  },
})

// 导出常用的上传中间件
export const uploadAvatar = upload.single('avatar')
export const uploadImage = upload.single('image')
export const uploadVideo = upload.single('video')
export const uploadFiles = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
])

// 获取文件URL的工具函数
export function getFileUrl(filename: string, type: 'avatar' | 'image' | 'video' = 'image'): string {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001'
  const subDir = type === 'avatar' ? 'avatars' : type === 'image' ? 'images' : 'videos'
  return `${baseUrl}/uploads/${subDir}/${filename}`
}
