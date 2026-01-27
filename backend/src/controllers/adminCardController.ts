import { Request, Response } from 'express'
import { query, run } from '../db/connection'
import { success, error } from '../utils/response'
import crypto from 'crypto'

// 生成随机卡密
function generateCode(length: number = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 排除容易混淆的字符
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// 获取卡密列表
export async function getCardCodes(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return error(res, '无权限', 403)
    }

    const { page = 1, pageSize = 20, code_type, is_used, search } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    let sql = `SELECT rc.*, u1.username as used_by_username, u2.username as created_by_username
               FROM redeem_codes rc
               LEFT JOIN users u1 ON rc.used_by_user_id = u1.id
               LEFT JOIN users u2 ON rc.created_by = u2.id
               WHERE 1=1`
    const params: any[] = []

    if (code_type) {
      sql += ' AND rc.code_type = ?'
      params.push(code_type)
    }

    if (is_used !== undefined) {
      sql += ' AND rc.is_used = ?'
      // SQLite使用INTEGER，MySQL使用BOOLEAN，统一转换为数字
      params.push(is_used === 'true' || is_used === '1' || is_used === true ? 1 : 0)
    }

    if (search) {
      sql += ' AND (rc.code LIKE ? OR u1.username LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern)
    }

    sql += ' ORDER BY rc.created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)

    const codes = await query(sql, params) as any[]

    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM redeem_codes rc
                    LEFT JOIN users u1 ON rc.used_by_user_id = u1.id
                    WHERE 1=1`
    const countParams: any[] = []

    if (code_type) {
      countSql += ' AND rc.code_type = ?'
      countParams.push(code_type)
    }

    if (is_used !== undefined) {
      countSql += ' AND rc.is_used = ?'
      countParams.push(is_used === 'true' || is_used === '1' ? 1 : 0)
    }

    if (search) {
      countSql += ' AND (rc.code LIKE ? OR u1.username LIKE ?)'
      const searchPattern = `%${search}%`
      countParams.push(searchPattern, searchPattern)
    }

    const countResult = await query(countSql, countParams) as any[]
    const total = countResult[0]?.total || 0

    success(res, {
      list: codes,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    })
  } catch (err: any) {
    console.error('获取卡密列表错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 生成卡密
export async function generateCardCodes(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return error(res, '无权限', 403)
    }

    const { code_type, value, count, expires_at } = req.body

    if (!code_type || !value || !count) {
      return error(res, '参数不完整', 400)
    }

    if (!['computing_power', 'vip', 'svip'].includes(code_type)) {
      return error(res, '卡密类型无效', 400)
    }

    if (count < 1 || count > 1000) {
      return error(res, '生成数量必须在1-1000之间', 400)
    }

    const codes: string[] = []
    const insertValues: any[] = []

    // 生成卡密
    for (let i = 0; i < count; i++) {
      let code: string
      let attempts = 0
      
      // 确保卡密唯一
      do {
        code = generateCode()
        attempts++
        if (attempts > 100) {
          return error(res, '生成卡密失败，请重试', 500)
        }
      } while (codes.includes(code))

      codes.push(code)
      
      const expiresAt = expires_at ? new Date(expires_at).toISOString() : null
      insertValues.push([
        code,
        code_type,
        value,
        0, // is_used
        null, // used_by_user_id
        null, // used_at
        expiresAt,
        req.user.userId, // created_by
      ])
    }

    // 批量插入
    const placeholders = insertValues.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ')
    const flatValues = insertValues.flat()

    await run(
      `INSERT INTO redeem_codes (code, code_type, value, is_used, used_by_user_id, used_at, expires_at, created_by)
       VALUES ${placeholders}`,
      flatValues
    )

    success(res, {
      codes,
      count: codes.length,
      code_type,
      value,
    }, `成功生成 ${codes.length} 个卡密`)
  } catch (err: any) {
    console.error('生成卡密错误:', err)
    error(res, err.message || '生成失败', 500)
  }
}

// 删除卡密
export async function deleteCardCode(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return error(res, '无权限', 403)
    }

    const { id } = req.params

    await run('DELETE FROM redeem_codes WHERE id = ?', [id])

    success(res, null, '删除成功')
  } catch (err: any) {
    console.error('删除卡密错误:', err)
    error(res, err.message || '删除失败', 500)
  }
}

// 批量删除卡密
export async function batchDeleteCardCodes(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return error(res, '无权限', 403)
    }

    const { ids } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      return error(res, '请选择要删除的卡密', 400)
    }

    const placeholders = ids.map(() => '?').join(', ')
    await run(`DELETE FROM redeem_codes WHERE id IN (${placeholders})`, ids)

    success(res, { deletedCount: ids.length }, `成功删除 ${ids.length} 个卡密`)
  } catch (err: any) {
    console.error('批量删除卡密错误:', err)
    error(res, err.message || '批量删除失败', 500)
  }
}
