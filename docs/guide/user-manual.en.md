# SuperCharli User Guide (English)

## 1. Goal
This guide helps new users set up and run SuperCharli after cloning the repository: initialization, model config, daemon startup, chatting, and memory/config management.

## 2. Requirements
- macOS / Linux
- Node.js 20+
- npm available

Check:
```bash
node -v
npm -v
```

## 3. Clone and Install
```bash
git clone https://github.com/hubangqiang/supercharli.git
cd supercharli
npm install
```

## 4. Initialize Your SuperCharli
```bash
npm run init:user
```

It creates local user files (outside the repo):
- `~/.config/supercharli/charli.profile.json`
- `~/.config/supercharli/providers.config.json`
- `~/.config/supercharli/supercharli.env.sh`

## 5. Configure Model Providers
Edit `~/.config/supercharli/providers.config.json`:
- Define provider endpoints in `providers`
- Set fast/deep/secondary routes in `routes`

Edit `~/.config/supercharli/supercharli.env.sh`:
- Fill API keys matching `apiKeyEnv`

Load environment:
```bash
source ~/.config/supercharli/supercharli.env.sh
```

## 6. Start SuperCharli
Use repo-safe runtime wrapper (recommended):
```bash
./scripts/supercharli-runtime.sh start
```

Check status:
```bash
./scripts/supercharli-runtime.sh status
```

## 7. Chat
Interactive mode:
```bash
./scripts/supercharli-runtime.sh cli
```

One-shot message:
```bash
./scripts/supercharli-runtime.sh chat "Hello" main
```

Notes:
- If `--session` is omitted, CLI reuses the last session automatically
- If there is no previous session, a new one is created automatically

## 8. Personality/Role Config Layering
Configuration layers:
- Repo base profile: `config/charli.profile.base.json`
- User local override: `~/.config/supercharli/charli.profile.json`

Merge rule at runtime:
- Local override wins
- Missing fields fallback to base profile

## 9. Memory and Runtime Data Paths
By default, all runtime state is outside the repo:
- Memory DB: `~/supercharli-runtime/data/supercharli.db`
- Backups: `~/supercharli-runtime/backups`
- Runtime files: `~/supercharli-runtime/run`

## 10. Backup and Restore
Backup:
```bash
npm run backup
```

Restore:
```bash
npm run restore -- <snapshot-dir>
```

## 11. Troubleshooting
### 11.1 Always seeing mock
- Provider config is not active
- Check:
  - `source ~/.config/supercharli/supercharli.env.sh` was executed
  - provider ids/baseURL/routes are correct in `providers.config.json`
- Restart daemon:
```bash
./scripts/supercharli-runtime.sh stop
./scripts/supercharli-runtime.sh start
```

### 11.2 Reset memory
- Backup DB first
- Delete: `~/supercharli-runtime/data/supercharli.db`
- Restart service to create a fresh DB

### 11.3 Update personality/role
Edit `~/.config/supercharli/charli.profile.json`, then restart daemon.

## 12. Stop Service
```bash
./scripts/supercharli-runtime.sh stop
```
