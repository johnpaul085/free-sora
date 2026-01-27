import { run } from '../db/connection'

/**
 * 记录管理员操作日志
 */
export async function logAdminAction(
  adminId: number,
  actionType: string,
  targetType?: string,
  targetId?: number,
  actionDetail?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await run(
      `INSERT INTO admin_logs 
       (admin_id, action_type, target_type, target_id, action_detail, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [adminId, actionType, targetType || null, targetId || null, actionDetail || null, ipAddress || null, userAgent || null]
    )
  } catch (err: any) {
    // 如果表不存在，静默失败（不阻塞主流程）
    if (err.message && err.message.includes('no such table')) {
      console.warn('admin_logs表不存在，跳过日志记录')
    } else {
      console.error('记录管理员操作日志失败:', err)
    }
  }
}

/**
 * 从请求中获取IP地址
 */
export function getClientIp(req: any): string {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}
