import { Request, Response } from 'express'
import { success, error } from '../utils/response'
import { getFileUrl } from '../middleware/upload'
import path from 'path'
import fs from 'fs'
import { config } from '../config'

// 上传头像
export async function uploadAvatar(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    if (!req.file) {
      return error(res, '请选择要上传的文件', 400)
    }

    const fileUrl = getFileUrl(req.file.filename, 'avatar')

    // 更新用户头像URL
    const { run } = await import('../db/connection')
    await run(
      'UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [fileUrl, req.user.userId]
    )

    success(res, { avatar_url: fileUrl }, '头像上传成功')
  } catch (err: any) {
    console.error('上传头像错误:', err)
    error(res, err.message || '上传失败', 500)
  }
}

// 上传图片
export async function uploadImage(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    if (!req.file) {
      return error(res, '请选择要上传的文件', 400)
    }

    const fileUrl = getFileUrl(req.file.filename, 'image')

    success(res, {
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, '图片上传成功')
  } catch (err: any) {
    console.error('上传图片错误:', err)
    error(res, err.message || '上传失败', 500)
  }
}

// 上传视频
export async function uploadVideo(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    if (!req.file) {
      return error(res, '请选择要上传的文件', 400)
    }

    const fileUrl = getFileUrl(req.file.filename, 'video')

    success(res, {
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, '视频上传成功')
  } catch (err: any) {
    console.error('上传视频错误:', err)
    error(res, err.message || '上传失败', 500)
  }
}

// 删除文件
export async function deleteFile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    const { filename, type = 'image' } = req.body

    if (!filename) {
      return error(res, '文件名不能为空', 400)
    }

    const subDir = type === 'avatar' ? 'avatars' : type === 'image' ? 'images' : 'videos'
    const filePath = path.join(config.upload.dir, subDir, filename)

    // 检查文件是否存在
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      success(res, null, '文件删除成功')
    } else {
      error(res, '文件不存在', 404)
    }
  } catch (err: any) {
    console.error('删除文件错误:', err)
    error(res, err.message || '删除失败', 500)
  }
}
