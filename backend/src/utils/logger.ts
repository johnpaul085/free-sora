import * as fs from 'fs'
import * as path from 'path'

// 日志文件路径：在backend目录下
const LOG_FILE = path.join(__dirname, '../../LOG.TXT')

/**
 * 写入日志到文件
 */
export function writeLog(message: string, data?: any) {
  try {
    const timestamp = new Date().toISOString()
    let logMessage = `[${timestamp}] ${message}`
    
    if (data !== undefined) {
      if (typeof data === 'object') {
        logMessage += '\n' + JSON.stringify(data, null, 2)
      } else {
        logMessage += '\n' + String(data)
      }
    }
    
    logMessage += '\n' + '='.repeat(80) + '\n'
    
    // 追加写入文件
    fs.appendFileSync(LOG_FILE, logMessage, 'utf8')
  } catch (err) {
    // 如果写入失败，至少输出到控制台
    console.error('写入日志失败:', err)
    console.log(message, data)
  }
}

/**
 * 记录API调用日志
 */
export function logApiCall(
  type: 'image' | 'video',
  action: string,
  details: {
    url?: string
    method?: string
    baseUrl?: string
    apiPath?: string
    model?: string
    provider?: string
    requestBody?: any
    responseStatus?: number
    responseData?: any
    error?: any
  }
) {
  const logData: any = {
    type,
    action,
    ...details,
  }
  
  writeLog(`[${type.toUpperCase()}] ${action}`, logData)
}
