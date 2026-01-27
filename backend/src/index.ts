import app from './app'
import { config } from './config'
import { initDatabase } from './db/init'
import { closeDb } from './db/connection'
import { startTaskQueue, stopTaskQueue } from './services/taskQueue'

// 初始化数据库
initDatabase()
  .then(() => {
    console.log('数据库初始化完成')
    
    // 启动服务器
    const server = app.listen(config.port, () => {
      console.log(`服务器运行在 http://localhost:${config.port}`)
      console.log(`环境: ${config.nodeEnv}`)
      console.log(`数据库类型: ${config.db.type}`)
    })
    
    // 启动任务队列处理器
    startTaskQueue()
    
    // 优雅关闭
    process.on('SIGTERM', async () => {
      console.log('收到SIGTERM信号，正在关闭服务器...')
      stopTaskQueue()
      server.close(async () => {
        await closeDb()
        console.log('服务器已关闭')
        process.exit(0)
      })
    })
    
    process.on('SIGINT', async () => {
      console.log('收到SIGINT信号，正在关闭服务器...')
      stopTaskQueue()
      server.close(async () => {
        await closeDb()
        console.log('服务器已关闭')
        process.exit(0)
      })
    })
  })
  .catch((error) => {
    console.error('启动失败:', error)
    process.exit(1)
  })
