# GitHub 发布指南

## 目标
将当前项目以可持续协作的方式发布到 GitHub，确保后续模型可快速接手。

## 发布前检查
- 文档结构完整（原则、计划、工作流、交接）。
- 不包含敏感信息（密钥、令牌、隐私数据）。
- 根目录有明确 README。

## 建议仓库初始化步骤
1. `git init`
2. `git add .`
3. `git commit -m "init: supercharli governance and v1 plans"`
4. 创建 GitHub 仓库
5. `git remote add origin <repo-url>`
6. `git push -u origin main`

## 后续协作建议
- 采用小步提交。
- 每次功能改动同步更新对应文档。
- 以 `docs/plans/acceptance.v1.md` 作为阶段验收依据。
