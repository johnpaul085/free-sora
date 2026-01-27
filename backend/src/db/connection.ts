import sqlite3 from 'sqlite3'
import mysql from 'mysql2/promise'
import { config } from '../config'
import path from 'path'
import fs from 'fs'

let dbConnection: any = null

// SQLite连接
async function createSqliteConnection() {
  const dbPath = path.resolve(config.db.sqlite.path)
  const dbDir = path.dirname(dbPath)
  
  // 确保目录存在
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }
  
  return new Promise<sqlite3.Database>((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err)
      } else {
        // 启用外键约束
        db.run('PRAGMA foreign_keys = ON')
        resolve(db)
      }
    })
  })
}

// MySQL连接
async function createMysqlConnection() {
  return mysql.createConnection({
    host: config.db.mysql.host,
    port: config.db.mysql.port,
    user: config.db.mysql.user,
    password: config.db.mysql.password,
    database: config.db.mysql.database,
  })
}

// 获取数据库连接
export async function getDb() {
  if (dbConnection) {
    return dbConnection
  }
  
  if (config.db.type === 'sqlite') {
    dbConnection = await createSqliteConnection()
  } else {
    dbConnection = await createMysqlConnection()
  }
  
  return dbConnection
}

// 执行SQL查询（SQLite）
export function query(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    if (config.db.type === 'sqlite') {
      getDb().then((db: sqlite3.Database) => {
        db.all(sql, params, (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
        })
      })
    } else {
      getDb().then((db: any) => {
        db.execute(sql, params)
          .then(([rows]: any) => resolve(rows))
          .catch(reject)
      })
    }
  })
}

// 执行SQL（INSERT/UPDATE/DELETE）
export function run(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    if (config.db.type === 'sqlite') {
      getDb().then((db: sqlite3.Database) => {
        db.run(sql, params, function(err) {
          if (err) {
            reject(err)
          } else {
            resolve({ lastID: this.lastID, changes: this.changes })
          }
        })
      })
    } else {
      getDb().then((db: any) => {
        db.execute(sql, params)
          .then(([result]: any) => {
            resolve({ 
              lastID: result.insertId, 
              changes: result.affectedRows 
            })
          })
          .catch(reject)
      })
    }
  })
}

// 关闭连接
export async function closeDb() {
  if (dbConnection) {
    if (config.db.type === 'sqlite') {
      return new Promise<void>((resolve, reject) => {
        (dbConnection as sqlite3.Database).close((err) => {
          if (err) reject(err)
          else {
            dbConnection = null
            resolve()
          }
        })
      })
    } else {
      await (dbConnection as any).end()
      dbConnection = null
    }
  }
}
