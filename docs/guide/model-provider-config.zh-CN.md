# 模型 Provider 配置

## 目标
- 用统一配置接入不同模型服务。
- 模型与路由完全配置化，代码仓库不内置具体模型信息。

## 推荐入口
优先运行：
```bash
npm run init:user
```

它会在用户目录自动生成：
- `~/.config/supercharli/charli.profile.json`
- `~/.config/supercharli/providers.config.json`
- `~/.config/supercharli/supercharli.env.sh`

## 配置方式（推荐）
- 使用外部 JSON 配置文件（类似 OpenClaw 的配置驱动方式）：
  - 环境变量：`SUPERCHARLI_PROVIDER_CONFIG_FILE`

示例文件可从仓库复制：
- `scripts/env/providers.config.example.json`

## 配置结构
- `providers`: provider 列表
  - `id`: provider 标识（例如 `primary`）
  - `type`: `openai_compatible` / `anthropic` / `gemini`
  - `baseURL`: provider 基础地址
  - `apiKeyEnv`: 从环境变量读取 key
  - `timeoutMs`: 可选
- `routes`: 路由映射
  - `fast`: `provider:model`
  - `deep`: `provider:model`
  - `secondary`: `provider:model`

## 环境变量
- `SUPERCHARLI_PROVIDER_CONFIG_FILE`: provider 配置文件路径
- `SUPERCHARLI_PROFILE_FILE`: 用户人格/角色/背景文件路径
- `SUPERCHARLI_MODEL_FAST|DEEP|SECONDARY`: 可选，覆盖 `routes`
- 你在配置文件里定义的 `apiKeyEnv` 变量

## 默认行为
- 未配置外部 provider 时，自动使用 `mock` provider，保证本地开发可用。
- 路由命中未配置 provider 时，返回可解释错误并走回退链。

## 开机生效（macOS）
- 安装 LaunchAgent：
  - `scripts/env/install-launchagent.sh ~/.config/supercharli/supercharli.env.sh`
- 卸载 LaunchAgent：
  - `scripts/env/uninstall-launchagent.sh ~/.config/supercharli/supercharli.env.sh`
- 验证：
  - `launchctl getenv SUPERCHARLI_PROVIDER_CONFIG_FILE`
