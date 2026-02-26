const fs = require("fs");
const { MockAdapter } = require("./mockAdapter");
const { OpenAICompatibleAdapter } = require("./openaiCompatibleAdapter");
const { GeminiAdapter } = require("./geminiAdapter");
const { AnthropicAdapter } = require("./anthropicAdapter");

function parseModelRef(value, fallback) {
  const raw = value || fallback;
  const [provider, ...rest] = String(raw).split(":");
  return { provider, model: rest.join(":") };
}

function readProviderConfig(env) {
  if (env.SUPERCHARLI_PROVIDER_CONFIG_JSON) {
    return JSON.parse(env.SUPERCHARLI_PROVIDER_CONFIG_JSON);
  }

  if (env.SUPERCHARLI_PROVIDER_CONFIG_FILE && fs.existsSync(env.SUPERCHARLI_PROVIDER_CONFIG_FILE)) {
    const raw = fs.readFileSync(env.SUPERCHARLI_PROVIDER_CONFIG_FILE, "utf8");
    return JSON.parse(raw);
  }

  return null;
}

function buildAdapter(def, env) {
  const type = def.type;
  const apiKey = def.apiKey || (def.apiKeyEnv ? env[def.apiKeyEnv] : "");

  if (type === "openai_compatible") {
    if (!apiKey) throw new Error(`provider_missing_api_key:${def.id}`);
    return new OpenAICompatibleAdapter({
      baseURL: def.baseURL,
      apiKey,
      timeoutMs: def.timeoutMs,
    });
  }

  if (type === "gemini") {
    if (!apiKey) throw new Error(`provider_missing_api_key:${def.id}`);
    return new GeminiAdapter({
      baseURL: def.baseURL,
      apiKey,
      timeoutMs: def.timeoutMs,
    });
  }

  if (type === "anthropic") {
    if (!apiKey) throw new Error(`provider_missing_api_key:${def.id}`);
    return new AnthropicAdapter({
      baseURL: def.baseURL,
      apiKey,
      timeoutMs: def.timeoutMs,
    });
  }

  throw new Error(`unsupported_provider_type:${type}`);
}

function createProviderRegistry(env = process.env) {
  const providers = new Map();
  providers.set("mock", new MockAdapter());

  const config = readProviderConfig(env);
  if (config?.providers?.length) {
    for (const def of config.providers) {
      if (!def.id) {
        throw new Error("provider_id_required");
      }
      providers.set(def.id, buildAdapter(def, env));
    }
  }

  const defaultRoutes = config?.routes || {};
  const models = {
    fast: parseModelRef(env.SUPERCHARLI_MODEL_FAST, defaultRoutes.fast || "mock:fast-default"),
    deep: parseModelRef(env.SUPERCHARLI_MODEL_DEEP, defaultRoutes.deep || "mock:deep-default"),
    secondary: parseModelRef(env.SUPERCHARLI_MODEL_SECONDARY, defaultRoutes.secondary || "mock:safe-secondary"),
  };

  return {
    providers,
    models,
    async generate(modelRef, context) {
      const adapter = providers.get(modelRef.provider);
      if (!adapter) {
        throw new Error(`provider_not_configured:${modelRef.provider}`);
      }
      const out = await adapter.generate(modelRef.model, context);
      return {
        provider: modelRef.provider,
        ...out,
      };
    },
  };
}

module.exports = { createProviderRegistry, parseModelRef };
