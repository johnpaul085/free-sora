import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { uploadAvatar, uploadImage, uploadVideo } from '../middleware/upload'
import {
  uploadAvatar as uploadAvatarController,
  uploadImage as uploadImageController,
  uploadVideo as uploadVideoController,
  deleteFile,
} from '../controllers/uploadController'

const router = Router()

router.use(authenticate) // 所有路由都需要认证

// 上传头像
router.post('/avatar', uploadAvatar, uploadAvatarController)

// 上传图片
router.post('/image', uploadImage, uploadImageController)

// 上传视频
router.post('/video', uploadVideo, uploadVideoController)

// 删除文件
router.delete('/file', deleteFile)

export default router
