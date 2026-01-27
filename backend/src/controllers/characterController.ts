import { Request, Response } from 'express'
import { query, run } from '../db/connection'
import { success, error } from '../utils/response'
import { Character } from '../types'
import { config } from '../config'

// 获取角色列表
export async function getCharacters(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { type, includeSystem } = req.query
    
    // 构建SQL查询：用户自己的角色 + 系统内置角色（如果includeSystem为true）
    let sql = ''
    const params: any[] = []
    
    if (includeSystem === 'true') {
      // 包含系统内置角色
      // SQLite使用user_id=0，MySQL使用user_id IS NULL
      if (config.db.type === 'mysql') {
        sql = 'SELECT * FROM characters WHERE (user_id = ? OR (is_system = 1 AND user_id IS NULL))'
      } else {
        sql = 'SELECT * FROM characters WHERE (user_id = ? OR (is_system = 1 AND user_id = 0))'
      }
      params.push(req.user.userId)
    } else {
      // 只查询用户自己的角色
      sql = 'SELECT * FROM characters WHERE user_id = ?'
      params.push(req.user.userId)
    }
    
    if (type) {
      sql += ' AND type = ?'
      params.push(type)
    }
    
    sql += ' ORDER BY is_system ASC, created_at DESC'
    
    const characters = await query(sql, params) as Character[]
    
    success(res, {
      list: characters,
      total: characters.length,
    })
  } catch (err: any) {
    console.error('获取角色列表错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 获取角色详情
export async function getCharacter(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { id } = req.params
    
    const characters = await query(
      'SELECT * FROM characters WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    ) as Character[]
    
    if (!characters || characters.length === 0) {
      return error(res, '角色不存在', 404)
    }
    
    success(res, characters[0])
  } catch (err: any) {
    console.error('获取角色详情错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 创建角色
export async function createCharacter(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { name, avatar_url, type } = req.body
    
    if (!name || !type) {
      return error(res, '角色名称和类型不能为空', 400)
    }
    
    if (!['sora', 'custom'].includes(type)) {
      return error(res, '无效的角色类型', 400)
    }
    
    const result = await run(
      'INSERT INTO characters (user_id, name, avatar_url, type) VALUES (?, ?, ?, ?)',
      [req.user.userId, name, avatar_url || null, type]
    )
    
    const characterId = (result as any).lastID
    
    const characters = await query(
      'SELECT * FROM characters WHERE id = ?',
      [characterId]
    ) as Character[]
    
    success(res, characters[0], '创建成功')
  } catch (err: any) {
    console.error('创建角色错误:', err)
    error(res, err.message || '创建失败', 500)
  }
}

// 更新角色
export async function updateCharacter(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { id } = req.params
    const { name, avatar_url, type } = req.body
    
    const updates: string[] = []
    const values: any[] = []
    
    if (name !== undefined) {
      updates.push('name = ?')
      values.push(name)
    }
    
    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?')
      values.push(avatar_url)
    }
    
    if (type !== undefined) {
      if (!['sora', 'custom'].includes(type)) {
        return error(res, '无效的角色类型', 400)
      }
      updates.push('type = ?')
      values.push(type)
    }
    
    if (updates.length === 0) {
      return error(res, '没有要更新的字段', 400)
    }
    
    values.push(id, req.user.userId)
    
    await run(
      `UPDATE characters SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
      values
    )
    
    const characters = await query(
      'SELECT * FROM characters WHERE id = ?',
      [id]
    ) as Character[]
    
    success(res, characters[0], '更新成功')
  } catch (err: any) {
    console.error('更新角色错误:', err)
    error(res, err.message || '更新失败', 500)
  }
}

// 删除角色
export async function deleteCharacter(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { id } = req.params
    
    const result = await run(
      'DELETE FROM characters WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    )
    
    if ((result as any).changes === 0) {
      return error(res, '角色不存在或无权限', 404)
    }
    
    success(res, null, '删除成功')
  } catch (err: any) {
    console.error('删除角色错误:', err)
    error(res, err.message || '删除失败', 500)
  }
}
