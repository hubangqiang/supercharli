# supercharli（中文说明）

SuperCharli 是一个本地优先的长期成长型智能体项目。

## 新用户最快开始
1. 克隆仓库并安装依赖：
```bash
git clone https://github.com/hubangqiang/supercharli.git
cd supercharli
npm install
```
2. 运行引导初始化：
```bash
npm run init:user
```
3. 加载环境并启动：
```bash
source ~/.config/supercharli/supercharli.env.sh
./scripts/supercharli-runtime.sh start
./scripts/supercharli-runtime.sh cli
```

## 核心原则
- 记忆数据在仓库外，默认在 `~/supercharli-runtime`。
- 角色/性格基础信息在仓库内可版本化。
- 用户可在本地覆盖自己的角色/性格配置。
- 超级查理是大模型增强层，不替代大模型本体能力。
- 本地记忆与学习用于连续性与治理，不等于模型预训练。
- 原则文档：
  - `docs/principles/model-augmentation-boundary.zh-CN.md`
  - `docs/principles/model-augmentation-boundary.en.md`
  - `docs/principles/development-mode.zh-CN.md`
  - `docs/principles/development-mode.en.md`

## 文档入口
- 中文：`docs/index.zh-CN.md`
- English: `docs/index.en.md`

## 常用命令
- 启动：`./scripts/supercharli-runtime.sh start`
- 交互：`./scripts/supercharli-runtime.sh cli`
- 停止：`./scripts/supercharli-runtime.sh stop`
- 备份：`npm run backup`
- 恢复：`npm run restore -- <snapshot-dir>`
- 导出迁移包：`./scripts/supercharli-runtime.sh export`
- 导入迁移包：`./scripts/supercharli-runtime.sh import <bundle-dir>`
