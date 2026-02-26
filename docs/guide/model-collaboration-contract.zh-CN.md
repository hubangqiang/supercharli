# 模型协作契约

## 目的
让不同模型在接手本项目时保持同一开发语言、同一质量基线、同一边界理解。

## 输入契约
每个模型接手前必须先阅读：
- `persona.toml`
- `config/charli.profile.base.json`
- `src/providers/responseStylePrompt.js`
- `docs/principles/product-charter.zh-CN.md`
- `docs/principles/product-constitution.zh-CN.md`
- `docs/principles/engineering-constitution.zh-CN.md`
- `docs/plans/scope.md`
- `docs/plans/acceptance.v1.md`

## 输出契约
每次输出必须明确：
- 本次改动目标
- 影响范围
- 与现有原则是否一致
- 下一步建议

## 一致性要求
- 换模型不换原则。
- 换模型不改项目边界。
- 换模型不破坏已有文档体系。
- 换模型仍要遵守“感性+理性交织、按场景路由回复结构、限制模板化输出”的统一对话契约。
