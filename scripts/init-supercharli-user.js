#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");
const { loadBaseProfile } = require("../src/runtime/userProfile");

const CONFIG_DIR = path.join(os.homedir(), ".config", "supercharli");
const PROFILE_FILE = path.join(CONFIG_DIR, "charli.profile.json");
const ENV_FILE = path.join(CONFIG_DIR, "supercharli.env.sh");
const PROVIDER_FILE = path.join(CONFIG_DIR, "providers.config.json");

function parseArgs(argv) {
  const out = { defaults: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--defaults") {
      out.defaults = true;
      continue;
    }

    if (token.startsWith("--") && argv[i + 1]) {
      out[token.slice(2)] = argv[++i];
    }
  }
  return out;
}

function ask(rl, question, fallback = "") {
  return new Promise((resolve) => {
    rl.question(`${question}${fallback ? ` (${fallback})` : ""}: `, (answer) => {
      const trimmed = answer.trim();
      resolve(trimmed || fallback);
    });
  });
}

async function collectProfile(args) {
  const base = loadBaseProfile(process.env) || {};
  const defaults = {
    ownerName: args.owner || "",
    charliName: args.charli || base.charliName || "SuperCharli",
    roleDefinition: args.role || base.roleDefinition || "长期成长型个人助理",
    backgroundSetting: args.background || base.backgroundSetting || "本地优先、长期陪伴、可持续进化",
    personalityCoreRaw:
      args.personality ||
      (Array.isArray(base.personalityCore) && base.personalityCore.length
        ? base.personalityCore.join(",")
        : "乐观,长远,务实,爱探索"),
    communicationStyle: args.style || base.communicationStyle || "直接、具体、可执行",
    longTermMission: args.mission || base.longTermMission || "帮助用户长期完成高价值目标",
  };

  if (args.defaults || !process.stdin.isTTY) {
    return defaults;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ownerName = await ask(rl, "你的名字", defaults.ownerName);
  const charliName = await ask(rl, "你的超级查理名字", defaults.charliName);
  const roleDefinition = await ask(rl, "角色定义（他是什么）", defaults.roleDefinition);
  const backgroundSetting = await ask(rl, "背景设定（一句话）", defaults.backgroundSetting);
  const personalityCoreRaw = await ask(rl, "性格底色（逗号分隔）", defaults.personalityCoreRaw);
  const communicationStyle = await ask(rl, "沟通风格", defaults.communicationStyle);
  const longTermMission = await ask(rl, "长期使命", defaults.longTermMission);
  rl.close();

  return {
    ownerName,
    charliName,
    roleDefinition,
    backgroundSetting,
    personalityCoreRaw,
    communicationStyle,
    longTermMission,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(CONFIG_DIR, { recursive: true });

  const collected = await collectProfile(args);

  const profile = {
    ownerName: collected.ownerName,
    charliName: collected.charliName,
    roleDefinition: collected.roleDefinition,
    backgroundSetting: collected.backgroundSetting,
    personalityCore: collected.personalityCoreRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    communicationStyle: collected.communicationStyle,
    longTermMission: collected.longTermMission,
    updatedAt: new Date().toISOString(),
  };

  const providerTemplate = {
    providers: [
      {
        id: "primary",
        type: "openai_compatible",
        baseURL: "https://example-openai-compatible.local/v1",
        apiKeyEnv: "PRIMARY_PROVIDER_API_KEY",
        timeoutMs: 20000,
      },
      {
        id: "reasoning",
        type: "anthropic",
        baseURL: "https://example-anthropic.local",
        apiKeyEnv: "REASONING_PROVIDER_API_KEY",
        timeoutMs: 20000,
      },
      {
        id: "backup",
        type: "gemini",
        baseURL: "https://generativelanguage.googleapis.com",
        apiKeyEnv: "BACKUP_PROVIDER_API_KEY",
        timeoutMs: 20000,
      },
    ],
    routes: {
      fast: "primary:MODEL_FAST",
      deep: "reasoning:MODEL_DEEP",
      secondary: "backup:MODEL_FALLBACK",
    },
  };

  const envTemplate = `#!/usr/bin/env bash
export SUPERCHARLI_PROVIDER_CONFIG_FILE="$HOME/.config/supercharli/providers.config.json"
export SUPERCHARLI_PROFILE_FILE="$HOME/.config/supercharli/charli.profile.json"

# Fill provider keys used in providers.config.json
export PRIMARY_PROVIDER_API_KEY=""
export REASONING_PROVIDER_API_KEY=""
export BACKUP_PROVIDER_API_KEY=""
`;

  fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2));

  if (!fs.existsSync(PROVIDER_FILE)) {
    fs.writeFileSync(PROVIDER_FILE, JSON.stringify(providerTemplate, null, 2));
  }

  if (!fs.existsSync(ENV_FILE)) {
    fs.writeFileSync(ENV_FILE, envTemplate);
    fs.chmodSync(ENV_FILE, 0o700);
  }

  console.log("\n初始化完成：");
  console.log(`- profile: ${PROFILE_FILE}`);
  console.log(`- providers: ${PROVIDER_FILE}`);
  console.log(`- env: ${ENV_FILE}`);
  console.log("\n下一步：");
  console.log(`1) 编辑 ${PROVIDER_FILE} 填你的 provider 地址与模型`);
  console.log(`2) 编辑 ${ENV_FILE} 填你的 API key`);
  console.log(`3) source ${ENV_FILE}`);
  console.log("4) scripts/supercharli-runtime.sh stop && scripts/supercharli-runtime.sh start");
  console.log("5) scripts/supercharli-runtime.sh cli --session main");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
