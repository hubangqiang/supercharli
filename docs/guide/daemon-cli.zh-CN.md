# 后台交互（Daemon + CLI）

## 目标
- 提供类似 `claude code cli` 的本地后台交互能力。
- 通过守护进程常驻，CLI 多会话交互不中断。

## 组件
- 守护进程（daemon）：
  - `scripts/supercharli-daemon.js`
  - `scripts/supercharli-daemon-server.js`
- 交互客户端（cli）：
  - `scripts/supercharli-cli.js`

## 启动与停止
- 启动后台：
  - `npm run daemon:start`
- 查看状态：
  - `npm run daemon:status`
- 停止后台：
  - `npm run daemon:stop`

## 对话方式
- 单次请求：
  - `npm run cli -- --session main --text "你好"`
- 交互模式：
  - `npm run cli -- --session main`

## 交互命令
- `/exit`：退出交互
- `/deep`：切换深度模式
- `/metrics`：查看运行计数

## 运行路径
- 默认 runtime 目录：`~/.supercharli`
- 默认 socket：`~/.supercharli/daemon.sock`
- 默认 pid：`~/.supercharli/daemon.pid`
- 默认日志：`~/.supercharli/daemon.log`

可通过环境变量覆盖：
- `SUPERCHARLI_RUNTIME_DIR`
- `SUPERCHARLI_SOCKET_PATH`

## 排查
- daemon 未启动：
  - 先执行 `npm run daemon:status`
- socket 不可用：
  - 查看日志 `~/.supercharli/daemon.log`
- provider 配置错误：
  - 参考 `docs/guide/model-provider-config.zh-CN.md`
