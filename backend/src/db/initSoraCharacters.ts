import { config } from '../config'
import { query, run } from './connection'

const dbType = config.db.type

// SORA公共角色数据
const soraCharacters = [
  { sora_id: 'Li.Qing.Ge', name: '李清歌', avatar_url: 'https://sorapi.oss-cn-guangzhou.aliyuncs.com/uploads/0/f910a1b4b08743aebb77020294742e76.webp' },
  { sora_id: 'tang.yi.han', name: '唐意涵', avatar_url: 'https://sorapi.oss-cn-guangzhou.aliyuncs.com/uploads/0/55ee37df55d1442cb4507a76b16db744.webp' },
  { sora_id: 'maidangla837', name: '中王', avatar_url: 'https://sorapi.oss-accelerate.aliyuncs.com/avatars/207/1767678390_695ca19f.webp' },
  { sora_id: 'maidangla965', name: '大王', avatar_url: 'https://sorapi.oss-accelerate.aliyuncs.com/avatars/207/1767678616_695ca281.webp' },
  { sora_id: 'shuishen4214', name: '女仆', avatar_url: 'https://sorapi.oss-cn-guangzhou.aliyuncs.com/uploads/1/3f0c163760f245e6ab6245cc0a1f6f8f.webp' },
  { sora_id: 'wwoodsnsn148', name: '昭阳', avatar_url: 'https://sorapi.oss-accelerate.aliyuncs.com/avatars/59/1767781602_695e34cc.webp' },
  { sora_id: 'zuke007729', name: '小王', avatar_url: 'https://sorapi.oss-accelerate.aliyuncs.com/avatars/205/1768187146_696464f4.webp' },
  { sora_id: 'guojia013711', name: '自己1号', avatar_url: 'https://sorapi.oss-accelerate.aliyuncs.com/avatars/268/1768554009_6969fe08.webp' },
  { sora_id: 'zhangtqwq270', name: '小狗喝水', avatar_url: 'https://sorapi.oss-accelerate.aliyuncs.com/avatars/271/1768957623_697026a6.webp' },
  { sora_id: 'zhanguqwq614', name: '李阳', avatar_url: 'https://sorapi.oss-accelerate.aliyuncs.com/avatars/268/1768975961_69706e42.webp' },
  { sora_id: 'zhanglqwq597', name: '爱心牛1', avatar_url: 'https://sorapi.oss-accelerate.aliyuncs.com/avatars/268/1768985964_6970955b.webp' },
  { sora_id: 'tbdgclavh145', name: '比熊小狗', avatar_url: 'https://sorapi.oss-accelerate.aliyuncs.com/avatars/1/1769030853_697144b3.webp' },
  { sora_id: 'guojia013747', name: '牛牛1.0', avatar_url: 'https://sorapi.oss-accelerate.aliyuncs.com/avatars/268/1769048378_69718929.webp' },
  { sora_id: 'lixiangqw925', name: '牛2号', avatar_url: 'https://sorapi.oss-accelerate.aliyuncs.com/avatars/268/1769071826_6971e4b6.webp' },
  { sora_id: 'zhudi013388', name: '多多', avatar_url: 'https://sorapi.oss-accelerate.aliyuncs.com/avatars/59/1769078861_69720036.webp' },
  { sora_id: 'yhtgbeqrw576', name: '姚瑶', avatar_url: 'https://sorapi.oss-accelerate.aliyuncs.com/avatars/289/1769349658_697621fe.webp' },
  { sora_id: 'yhtgbeqrw722', name: '姚瑶', avatar_url: 'https://sorapi.oss-accelerate.aliyuncs.com/avatars/289/1769349733_69762253.webp' },
  { sora_id: 'yhtgbeqrw584', name: '姚瑶', avatar_url: 'https://sorapi.oss-accelerate.aliyuncs.com/avatars/289/1769349834_697622b3.webp' },
  { sora_id: 'yhtgbeqrw170', name: '赵阳', avatar_url: 'https://sorapi.oss-accelerate.aliyuncs.com/avatars/289/1769349901_697622f2.webp' },
]

async function initSoraCharacters() {
  try {
    console.log('开始初始化SORA公共角色...')

    // SQLite需要暂时禁用外键检查
    if (dbType === 'sqlite') {
      await run('PRAGMA foreign_keys = OFF')
    }

    for (const char of soraCharacters) {
      // 检查是否已存在（SQLite使用user_id=0，MySQL使用user_id IS NULL）
      const existing = dbType === 'mysql'
        ? await query('SELECT id FROM characters WHERE sora_id = ? AND is_system = 1 AND user_id IS NULL', [char.sora_id]) as any[]
        : await query('SELECT id FROM characters WHERE sora_id = ? AND is_system = 1 AND user_id = 0', [char.sora_id]) as any[]

      if (existing && existing.length > 0) {
        // 更新现有角色
        const isSystemValue = dbType === 'mysql' ? 1 : 1
        await run(
          'UPDATE characters SET name = ?, avatar_url = ? WHERE sora_id = ? AND is_system = ?',
          [char.name, char.avatar_url, char.sora_id, isSystemValue]
        )
        console.log(`更新角色: ${char.name} (${char.sora_id})`)
      } else {
        // 插入新角色
        const isSystemValue = dbType === 'mysql' ? 1 : 1
        // SQLite不支持NULL的user_id，使用0表示系统角色
        const userIdValue = dbType === 'mysql' ? null : 0
        await run(
          'INSERT INTO characters (user_id, name, avatar_url, type, is_system, sora_id) VALUES (?, ?, ?, ?, ?, ?)',
          [userIdValue, char.name, char.avatar_url, 'sora', isSystemValue, char.sora_id]
        )
        console.log(`创建角色: ${char.name} (${char.sora_id})`)
      }
    }

    // 重新启用外键检查
    if (dbType === 'sqlite') {
      await run('PRAGMA foreign_keys = ON')
    }

    console.log('SORA公共角色初始化完成')
  } catch (err: any) {
    console.error('初始化SORA角色失败:', err)
    // 确保重新启用外键检查
    if (dbType === 'sqlite') {
      try {
        await run('PRAGMA foreign_keys = ON')
      } catch (e) {
        // 忽略错误
      }
    }
    throw err
  }
}

// 如果直接运行此文件
if (require.main === module) {
  initSoraCharacters()
    .then(() => {
      console.log('完成')
      process.exit(0)
    })
    .catch((err) => {
      console.error('错误:', err)
      process.exit(1)
    })
}

export { initSoraCharacters }
