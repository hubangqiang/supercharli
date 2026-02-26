# SuperCharli 用户使用手册（中文）

## 1. 目标
本文档面向新用户，说明在下载仓库后如何完成初始化、配置模型、启动服务、进行对话，以及如何管理记忆与配置。

## 2. 环境要求
- macOS / Linux
- Node.js 20+
- npm 可用

检查：
```bash
node -v
npm -v
```

## 3. 下载与安装
```bash
git clone https://github.com/hubangqiang/supercharli.git
cd supercharli
npm install
```

## 4. 一键初始化你的 SuperCharli
```bash
npm run init:user
```

引导完成后会生成用户本地文件（不在代码仓库内）：
- `~/.config/supercharli/charli.profile.json`
- `~/.config/supercharli/providers.config.json`
- `~/.config/supercharli/supercharli.env.sh`

## 5. 配置模型服务
编辑：`~/.config/supercharli/providers.config.json`
- 在 `providers` 中配置你的模型服务地址
- 在 `routes` 中配置 fast/deep/secondary 对应模型

编辑：`~/.config/supercharli/supercharli.env.sh`
- 填写 API key（与 `apiKeyEnv` 对应）

加载环境：
```bash
source ~/.config/supercharli/supercharli.env.sh
```

## 6. 启动 SuperCharli
推荐使用仓库外运行脚本（避免污染仓库）：
```bash
./scripts/supercharli-runtime.sh start
```

查看状态：
```bash
./scripts/supercharli-runtime.sh status
```

## 7. 开始对话
交互模式：
```bash
./scripts/supercharli-runtime.sh cli
```

单次提问：
```bash
./scripts/supercharli-runtime.sh chat "你好" main
```

说明：
- `cli` 不传 `--session` 时会自动复用上次会话
- 若无历史会话会自动新建

## 8. 角色与性格配置规则
配置分层：
- 仓库基础设定：`config/charli.profile.base.json`
- 用户本地覆盖：`~/.config/supercharli/charli.profile.json`

运行时合并规则：
- 本地覆盖优先
- 未覆盖字段回退基础设定

## 9. 记忆与数据位置
默认都在仓库外：
- 记忆数据库：`~/supercharli-runtime/data/supercharli.db`
- 备份目录：`~/supercharli-runtime/backups`
- 运行目录：`~/supercharli-runtime/run`

## 10. 备份与恢复
备份：
```bash
npm run backup
```

恢复：
```bash
npm run restore -- <snapshot-dir>
```

## 11. 常见问题
### 11.1 一直显示 mock
- 说明 provider 配置未生效
- 检查：
  - `source ~/.config/supercharli/supercharli.env.sh` 是否执行
  - `providers.config.json` 中 provider id / baseURL / routes 是否正确
- 重启 daemon：
```bash
./scripts/supercharli-runtime.sh stop
./scripts/supercharli-runtime.sh start
```

### 11.2 想重置历史记忆
- 先备份当前数据库
- 删除：`~/supercharli-runtime/data/supercharli.db`
- 重启服务后自动新建空库

### 11.3 想修改超级查理性格
编辑：`~/.config/supercharli/charli.profile.json`
修改后重启服务即可生效。

## 12. 停止服务
```bash
./scripts/supercharli-runtime.sh stop
```

## 13. 环境迁移（导出/导入）
当你要换机器或重装环境时：

导出：
```bash
npm run export:bundle
```
输出目录默认在：`~/supercharli-runtime/exports/bundle-时间戳`

导入：
```bash
npm run import:bundle -- <bundle-dir>
```

导出内容包括：
- 记忆数据库（如果存在）
- 用户配置：`charli.profile.json`、`providers.config.json`、`supercharli.env.sh`

导入时会自动备份目标环境已有同名文件为 `.bak.<timestamp>`。
