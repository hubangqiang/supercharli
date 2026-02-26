# 开发连续性手册

## 目标
确保任何后续模型在不依赖历史聊天的情况下，能够连续推进项目。

## 接手顺序
1. 阅读 `docs/index.zh-CN.md`
2. 阅读 `docs/principles/*`
3. 阅读 `docs/plans/scope.md` 与 `docs/plans/acceptance.v1.md`
4. 阅读 `docs/guide/current-state.zh-CN.md`
5. 阅读 `docs/guide/next-actions.zh-CN.md`

## 开发节奏
- 默认在 `codex/*` 分支开发。
- 达到阶段门禁后再合并到 `main`。
- 所有行为变更先改文档，再改实现。

## 不可跳过的检查
- 是否越过 V1 边界。
- 是否破坏核心原则分离（产品原则 vs 工程原则）。
- 是否更新验收标准与迁移说明。
