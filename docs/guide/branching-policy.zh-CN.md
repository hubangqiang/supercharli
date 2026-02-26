# 分支策略

## 默认策略
- `main`：稳定阶段线。
- `codex/*`：开发分支。

## 命名约定
- `codex/<phase>-<topic>`
- 例如：`codex/v1-runtime-core`

## 合并策略
- 优先使用 PR 合并，保留上下文。
- 非阶段完成不合并到 `main`。
- 合并前需满足对应阶段验收标准。
