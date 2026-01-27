import { Request, Response } from 'express'
import { query } from '../db/connection'
import { success, error } from '../utils/response'
import { config } from '../config'

// 获取数据统计
export async function getStatistics(req: Request, res: Response) {
  try {
    const dbType = config.db.type

    // 总用户数
    const userCount = await query('SELECT COUNT(*) as total FROM users WHERE status != "deleted"') as any[]
    const totalUsers = userCount[0]?.total || 0

    // 总订单数
    const orderCount = await query('SELECT COUNT(*) as total FROM distribution_orders') as any[]
    const totalOrders = orderCount[0]?.total || 0

    // 总收入
    const revenueResult = await query(
      'SELECT SUM(amount) as total FROM distribution_orders WHERE status IN ("paid", "completed")'
    ) as any[]
    const totalRevenue = revenueResult[0]?.total || 0

    // 总作品数
    const workCount = await query('SELECT COUNT(*) as total FROM works') as any[]
    const totalWorks = workCount[0]?.total || 0

    // VIP用户数
    const vipCount = await query(
      'SELECT COUNT(*) as total FROM users WHERE user_type IN ("vip", "svip") AND status = "active"'
    ) as any[]
    const totalVip = vipCount[0]?.total || 0

    // 今日新增用户
    let todayUsersQuery = ''
    if (dbType === 'sqlite') {
      todayUsersQuery = 'SELECT COUNT(*) as total FROM users WHERE DATE(created_at) = DATE("now")'
    } else {
      todayUsersQuery = 'SELECT COUNT(*) as total FROM users WHERE DATE(created_at) = CURDATE()'
    }
    const todayUsers = await query(todayUsersQuery) as any[]
    const todayNewUsers = todayUsers[0]?.total || 0

    // 今日订单数
    let todayOrdersQuery = ''
    if (dbType === 'sqlite') {
      todayOrdersQuery = 'SELECT COUNT(*) as total FROM distribution_orders WHERE DATE(created_at) = DATE("now")'
    } else {
      todayOrdersQuery = 'SELECT COUNT(*) as total FROM distribution_orders WHERE DATE(created_at) = CURDATE()'
    }
    const todayOrders = await query(todayOrdersQuery) as any[]
    const todayNewOrders = todayOrders[0]?.total || 0

    // 今日收入
    let todayRevenueQuery = ''
    if (dbType === 'sqlite') {
      todayRevenueQuery = 'SELECT SUM(amount) as total FROM distribution_orders WHERE DATE(created_at) = DATE("now") AND status IN ("paid", "completed")'
    } else {
      todayRevenueQuery = 'SELECT SUM(amount) as total FROM distribution_orders WHERE DATE(created_at) = CURDATE() AND status IN ("paid", "completed")'
    }
    const todayRevenue = await query(todayRevenueQuery) as any[]
    const todayTotalRevenue = todayRevenue[0]?.total || 0

    // 用户增长趋势（最近6个月）
    let userGrowthQuery = ''
    if (dbType === 'sqlite') {
      userGrowthQuery = `SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
       FROM users
       WHERE created_at >= datetime('now', '-6 months')
       GROUP BY strftime('%Y-%m', created_at)
       ORDER BY month ASC`
    } else {
      userGrowthQuery = `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
       FROM users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`
    }
    const userGrowth = await query(userGrowthQuery) as any[]

    // 订单统计（最近6个月）
    let orderStatsQuery = ''
    if (dbType === 'sqlite') {
      orderStatsQuery = `SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as orders,
        SUM(CASE WHEN status IN ('paid', 'completed') THEN amount ELSE 0 END) as revenue
       FROM distribution_orders
       WHERE created_at >= datetime('now', '-6 months')
       GROUP BY strftime('%Y-%m', created_at)
       ORDER BY month ASC`
    } else {
      orderStatsQuery = `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as orders,
        SUM(CASE WHEN status IN ('paid', 'completed') THEN amount ELSE 0 END) as revenue
       FROM distribution_orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`
    }
    const orderStats = await query(orderStatsQuery) as any[]

    success(res, {
      overview: {
        totalUsers,
        totalOrders,
        totalRevenue: Number(totalRevenue) || 0,
        totalWorks,
        totalVip,
        todayNewUsers,
        todayNewOrders,
        todayTotalRevenue: Number(todayTotalRevenue) || 0,
      },
      userGrowth: (userGrowth || []).map((item: any) => ({
        month: item.month,
        users: item.count || 0,
      })),
      orderStats: (orderStats || []).map((item: any) => ({
        month: item.month,
        orders: item.orders || 0,
        revenue: Number(item.revenue) || 0,
      })),
    })
  } catch (err: any) {
    console.error('获取统计数据错误:', err)
    error(res, err.message || '获取统计数据失败', 500)
  }
}
