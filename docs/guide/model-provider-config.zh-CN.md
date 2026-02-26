# 模型 Provider 配置

## 目标
- 用统一配置接入不同大模型。
- 在同一套记忆与人格下切换模型能力。

## 环境变量
- `SUPERCHARLI_MODEL_FAST`：默认快速路由模型，格式 `provider:model`。
- `SUPERCHARLI_MODEL_DEEP`：默认深度路由模型，格式 `provider:model`。
- `SUPERCHARLI_MODEL_SECONDARY`：回退次级模型，格式 `provider:model`。

## Provider Key
- DeepSeek:
  - `DEEPSEEK_API_KEY`
  - 可选：`DEEPSEEK_BASE_URL`（默认 `https://api.deepseek.com/v1`）
- Gemini:
  - `GEMINI_API_KEY`
  - 可选：`GEMINI_BASE_URL`
- Claude/Anthropic:
  - `ANTHROPIC_AUTH_TOKEN` 或 `ANTHROPIC_API_KEY`
  - 可选：`ANTHROPIC_BASE_URL`

## 默认行为
- 未配置任何外部 key 时，系统自动使用 `mock` provider，保证本地可开发。
- 外部 provider 未配置但被路由命中时，返回可解释错误并走回退链。

## 示例
```bash
export DEEPSEEK_API_KEY="..."
export GEMINI_API_KEY="..."
export ANTHROPIC_BASE_URL="http://159.223.78.34:28045/api"
export ANTHROPIC_AUTH_TOKEN="..."

export SUPERCHARLI_MODEL_FAST="deepseek:deepseek-chat"
export SUPERCHARLI_MODEL_DEEP="anthropic:claude-sonnet-4-20250514"
export SUPERCHARLI_MODEL_SECONDARY="gemini:gemini-2.0-flash"
```
