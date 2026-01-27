import { Request, Response, NextFunction } from 'express'
import { verifyToken, TokenPayload } from '../utils/jwt'
import { error } from '../utils/response'

// 扩展Request类型
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, '未提供认证令牌', 401)
    }
    
    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    
    req.user = payload
    next()
  } catch (err) {
    return error(res, '无效的认证令牌', 401)
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return error(res, '需要认证', 401)
  }
  
  if (req.user.role !== 'admin') {
    return error(res, '需要管理员权限', 403)
  }
  
  next()
}
