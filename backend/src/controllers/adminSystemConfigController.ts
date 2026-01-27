import { Request, Response } from 'express'
import { query, run } from '../db/connection'
import { success, error } from '../utils/response'
import { logAdminAction, getClientIp } from '../utils/adminLog'

// 获取系统配置
export async function getSystemConfigs(req: Request, res: Response) {
  try {
    const { category } = req.query

    let sql = 'SELECT * FROM system_configs WHERE 1=1'
    const params: any[] = []

    if (category) {
      sql += ' AND config_type = ?'
      params.push(category)
    }

    sql += ' ORDER BY config_key ASC'

    const configs = await query(sql, params) as any[]

    // 转换为键值对格式
    const configMap: Record<string, any> = {}
    configs.forEach((config: any) => {
      let value: any = config.config_value
      
      // 尝试解析JSON
      if (config.config_type === 'json' || (value && (value.startsWith('{') || value.startsWith('[')))) {
        try {
          value = JSON.parse(value)
        } catch {
          // 保持原值
        }
      }
      
      // 尝试转换为数字
      if (config.config_type === 'number' && value) {
        value = Number(value)
      }
      
      // 尝试转换为布尔值
      if (config.config_type === 'boolean' && value) {
        value = value === 'true' || value === '1' || value === 1
      }

      configMap[config.config_key] = {
        value,
        type: config.config_type,
        description: config.description,
      }
    })

    success(res, configMap)
  } catch (err: any) {
    console.error('获取系统配置错误:', err)
    error(res, err.message || '获取配置失败', 500)
  }
}

// 更新系统配置
export async function updateSystemConfig(req: Request, res: Response) {
  try {
    const { configs } = req.body

    if (!configs || typeof configs !== 'object') {
      return error(res, '配置数据格式错误', 400)
    }

    for (const [key, value] of Object.entries(configs)) {
      let configValue: string
      let configType: string = 'string'

      if (typeof value === 'object') {
        configValue = JSON.stringify(value)
        configType = 'json'
      } else if (typeof value === 'number') {
        configValue = value.toString()
        configType = 'number'
      } else if (typeof value === 'boolean') {
        configValue = value ? '1' : '0'
        configType = 'boolean'
      } else {
        configValue = value as string
      }

      // 检查配置是否存在
      const existing = await query(
        'SELECT * FROM system_configs WHERE config_key = ?',
        [key]
      ) as any[]

      if (existing && existing.length > 0) {
        // 更新
        await run(
          'UPDATE system_configs SET config_value = ?, config_type = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?',
          [configValue, configType, key]
        )
      } else {
        // 插入
        await run(
          'INSERT INTO system_configs (config_key, config_value, config_type, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
          [key, configValue, configType]
        )
      }
    }

    // 记录操作日志
    await logAdminAction(
      req.user!.userId,
      'update_config',
      'system_config',
      null,
      `更新了${Object.keys(configs).length}个配置项`,
      getClientIp(req),
      req.headers['user-agent']
    )

    success(res, null, '配置更新成功')
  } catch (err: any) {
    console.error('更新系统配置错误:', err)
    error(res, err.message || '更新配置失败', 500)
  }
}

// 获取单个配置
export async function getSystemConfig(req: Request, res: Response) {
  try {
    const { key } = req.params

    const configs = await query(
      'SELECT * FROM system_configs WHERE config_key = ?',
      [key]
    ) as any[]

    if (!configs || configs.length === 0) {
      return error(res, '配置不存在', 404)
    }

    const config = configs[0]
    let value: any = config.config_value

    // 尝试解析JSON
    if (config.config_type === 'json' || (value && (value.startsWith('{') || value.startsWith('[')))) {
      try {
        value = JSON.parse(value)
      } catch {
        // 保持原值
      }
    }

    // 尝试转换为数字
    if (config.config_type === 'number' && value) {
      value = Number(value)
    }

    // 尝试转换为布尔值
    if (config.config_type === 'boolean' && value) {
      value = value === 'true' || value === '1' || value === 1
    }

    success(res, {
      key: config.config_key,
      value,
      type: config.config_type,
      description: config.description,
    })
  } catch (err: any) {
    console.error('获取系统配置错误:', err)
    error(res, err.message || '获取配置失败', 500)
  }
}
