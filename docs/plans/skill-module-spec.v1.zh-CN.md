# Skill 模块产品规范 v1（中文）

## 1. 目标
SuperCharli 的 Skill 模块用于沉淀“可复用方法能力”，并在对话时按需注入大模型，以提升稳定性与执行效果。

约束：
- 大模型优先：推理、归纳、技能提炼与技能选择优先交给大模型完成。
- 本地治理：本地只负责存储、门控、版本、观测、回滚。
- 用户无感：Skill 生命周期与内部机制不在对话中显式暴露。

## 2. 核心定义
### 2.1 Skill 与 Memory 分层
- Skill：方法资产（例如“测试用例三段式写法”）。
- Memory：事实资产（例如“你之前写过注册流程测试用例”）。

规则：
- Skill 不保存具体业务结论，不输出固定答案模板。
- Memory 不替代 Skill 的方法抽象能力。

### 2.2 Skill 三类
- foundation：基础约束能力（身份、安全、表达边界）。
- domain：领域方法能力（测试、规划、复盘、交付等）。
- meta：系统能力（skill 提炼、skill 选择、skill 注入控制）。

## 3. 默认常驻能力
默认常驻两项 meta skill：
- `skill-extractor`：识别用户是否在“教方法”，并提炼 skill 候选。
- `skill-router`：根据当前任务在候选中选择要注入的 skill，并控制注入预算。

这两项在系统内部工作，不在用户对话中暴露。

## 4. 生命周期
Skill 生命周期定义：
- candidate：候选（新提炼、待验证）
- shadow：灰度（小流量试用）
- active：正式生效
- deprecated：弃用（不再选用）
- archived：归档（仅保留历史）

状态流转：
- candidate -> shadow：通过基础质量门控
- shadow -> active：稳定达标
- active -> shadow/deprecated：质量下降或风险升高
- deprecated -> archived：长期无用

## 5. 数据模型（关键维度）
每个 skill 至少包含：
- 标识维度：`skillId`、`title`、`version`
- 能力维度：`skillType`、`applicability`、`method`、`boundaries`
- 路由维度：`scenarioTags`、`injectionBudget`
- 质量维度：`qualityScore`、`successCount`、`failCount`、`useCount`
- 生命周期维度：`lifecycle`、`status`、`createdAt`、`updatedAt`、`lastUsedAt`
- 来源维度：`source`（model-extracted / manual / merged）

## 6. 注入策略
### 6.1 基本策略
- foundation 小剂量常驻。
- domain 按需注入，默认最多 2 个。
- meta 在后台运行，不作为对话显式信息输出。

### 6.2 预算策略
- 每轮 skill 注入必须受 token 预算约束。
- 若预算不足，优先保留高质量且高相关 skill。

### 6.3 降级策略
- meta skill 选择失败时，允许本地召回兜底。
- 兜底必须可追溯，不可永久覆盖模型选择。

## 7. 质量闭环
每轮对话后执行质量评估，产出：
- pass/fail
- score（0-1）
- issues（问题标签）

评估结果用于：
- 失败时触发一次质量修复重试
- 回写 skill 质量指标
- 生命周期降级判断（例如 active -> shadow）

## 8. 隐性机制约束
用户对话中禁止出现以下内容：
- skill 路由、skill 生命周期、prompt pack 名称
- 内部治理规则、评估标签、策略版本细节

允许外显：
- 与用户任务直接相关的自然表达（例如“我会按你的目标给出更可执行方案”）

## 9. 管理与观测
Observer 端必须可见：
- 注入层：当前注入目录、注入历史
- 管理层：skill 库、使用历史、质量趋势、生命周期状态

对话端默认不可见。

## 10. 验收标准（v1）
- 用户侧：对话中无内部机制泄露
- 效果侧：同类任务质量趋势提升
- 成本侧：注入 token 受控
- 治理侧：支持发布、降级、回滚、归档

