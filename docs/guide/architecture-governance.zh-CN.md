# 架构治理（核心稳定，外围灵活）

## 目标
- 核心层长期稳定、可回归、可迁移。
- 外围层高频迭代、可插拔、可灰度。

## 分层边界
- 核心稳定层：`src/core`、`src/memory`、`src/daemon`
- 策略扩展层：`src/learning`、`src/router`、`src/providers`
- 运行与运维层：`src/runtime`、`src/ops`、`src/observability`

## 依赖方向（强约束）
- `core` 只能依赖 `core/observability`
- `memory` 只能依赖 `memory/runtime`
- `learning` 只能依赖 `learning/memory`
- `providers` 只能依赖 `providers`
- `router` 只能依赖 `router/providers`
- `daemon` 可作为装配层依赖核心与扩展层
- `runtime` 可作为运行装配层依赖 `core/memory/router`

## 变更门禁
- 每次 `npm test` 必须先通过架构边界检查：
  - `scripts/check-architecture-boundaries.js`
- 边界违规即失败，不允许合并。

## 工程价值要求
- 核心接口优先兼容，不做破坏式改动。
- 任何数据结构升级必须带迁移与回归测试。
- 外围策略通过模块接入，不直接侵入核心逻辑。
- 所有关键决策必须可观测（日志/指标可追踪）。
