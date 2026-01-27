# 管理员设置说明

## 设置用户为管理员

### 方法1：使用命令行脚本（推荐）

```bash
# 将用户ID为1的用户设置为管理员
npm run db:setAdmin 1

# 将其他用户ID设置为管理员（例如ID为5的用户）
npm run db:setAdmin 5
```

### 方法2：数据库初始化时自动设置

在运行 `npm run db:init` 时，会自动将ID为1的用户设置为管理员（如果该用户存在）。

### 方法3：直接执行SQL

**SQLite:**
```sql
UPDATE users SET role = 'admin', updated_at = CURRENT_TIMESTAMP WHERE id = 1;
```

**MySQL:**
```sql
UPDATE users SET role = 'admin', updated_at = CURRENT_TIMESTAMP WHERE id = 1;
```

## 验证管理员设置

可以通过以下方式验证：

1. **查看数据库**：
   ```sql
   SELECT id, username, role FROM users WHERE id = 1;
   ```

2. **登录后查看**：
   - 登录ID为1的用户账号
   - 在个人中心页面应该能看到管理员功能入口
   - 访问 `/admin` 相关页面应该可以正常访问

## 注意事项

- 只有 `role = 'admin'` 的用户才能访问管理员功能
- 管理员权限在后端API中通过 `requireAdmin` 中间件进行验证
- 前端会根据 `user.role === 'admin'` 显示/隐藏管理员功能入口
