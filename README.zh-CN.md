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

## 文档入口
- 中文：`docs/index.zh-CN.md`
- English: `docs/index.en.md`

## 常用命令
- 启动：`./scripts/supercharli-runtime.sh start`
- 交互：`./scripts/supercharli-runtime.sh cli`
- 停止：`./scripts/supercharli-runtime.sh stop`
- 备份：`npm run backup`
- 恢复：`npm run restore -- <snapshot-dir>`
