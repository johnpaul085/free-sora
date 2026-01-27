import { Request, Response, NextFunction } from 'express'
import { error } from '../utils/response'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err)
  
  if (err.message.includes('Invalid token')) {
    return error(res, '无效的认证令牌', 401)
  }
  
  if (err.message.includes('UNIQUE constraint')) {
    return error(res, '数据已存在', 400)
  }
  
  return error(res, err.message || '服务器错误', 500)
}
