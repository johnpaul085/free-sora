import express, { Application } from 'express'
import cors from 'cors'
import { config } from './config'
import { errorHandler } from './middleware/errorHandler'

// 导入路由
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes'
import workRoutes from './routes/workRoutes'
import characterRoutes from './routes/characterRoutes'
import generationRoutes from './routes/generationRoutes'
import distributionRoutes from './routes/distributionRoutes'
import assistantRoutes from './routes/assistantRoutes'
import uploadRoutes from './routes/uploadRoutes'
import adminRoutes from './routes/adminRoutes'
import squareRoutes from './routes/squareRoutes'
import path from 'path'

const app: Application = express()

// 中间件
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件服务 - 提供上传文件的访问
app.use('/uploads', express.static(path.join(process.cwd(), config.upload.dir)))

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API路由
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/works', workRoutes)
app.use('/api/v1/characters', characterRoutes)
app.use('/api/v1/generate', generationRoutes)
app.use('/api/v1/distribution', distributionRoutes)
app.use('/api/v1/assistant', assistantRoutes)
app.use('/api/v1/upload', uploadRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/square', squareRoutes)

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null,
  })
})

// 错误处理
app.use(errorHandler)

export default app
