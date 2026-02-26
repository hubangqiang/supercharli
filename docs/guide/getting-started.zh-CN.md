# 新用户开箱（引导式）

## 目标
- 下载仓库后直接可用。
- 自动生成“属于你自己的超级查理”配置：人格、角色、背景。
- 所有用户数据都在仓库外。

## 1. 初始化你的超级查理
```bash
cd /path/to/supercharli
npm run init:user
```

命令会引导你填写：
- 你的名字
- 超级查理名字
- 角色定义
- 背景设定
- 性格底色
- 沟通风格
- 长期使命

并生成文件：
- `~/.config/supercharli/charli.profile.json`
- `~/.config/supercharli/providers.config.json`
- `~/.config/supercharli/supercharli.env.sh`

## 2. 填充模型服务信息
- 编辑 `providers.config.json`：填 provider 地址和路由模型。
- 编辑 `supercharli.env.sh`：填 API key。

## 3. 启动
```bash
source ~/.config/supercharli/supercharli.env.sh
scripts/supercharli-runtime.sh start
scripts/supercharli-runtime.sh cli --session main
```

## 4. 验证
在对话输出最后一行：
- 如果看到 `model: mock/...`，说明 provider 配置还没生效。
- 如果看到你配置的 provider id/model，说明已接通。

## 5. 数据隔离
默认运行数据都在仓库外：
- `~/supercharli-runtime/data`
- `~/supercharli-runtime/backups`
- `~/supercharli-runtime/run`
