# 本地备份与恢复

## 目标
- 保证本地记忆可迁移、可恢复。
- 在模型或环境切换时，保持超级查理连续性。

## 备份
- 默认命令：
  - `npm run backup`
- 默认输出：
  - `backups/snapshot-YYYYMMDD-HHMMSS/`
- 可选环境变量：
  - `SUPERCHARLI_DB_PATH`：指定数据库路径。
  - `SUPERCHARLI_BACKUP_DIR`：指定备份输出目录。

## 恢复
- 命令：
  - `npm run restore -- <snapshot-dir>`
- 恢复前动作：
  - 自动校验 `manifest.json` 文件哈希。
  - 自动备份当前数据库为 `.bak.<timestamp>`。

## 最低检查
- 恢复后执行：
  - `npm test`
  - `npm run demo`
