const { MockAdapter } = require("./mockAdapter");
const { OpenAICompatibleAdapter } = require("./openaiCompatibleAdapter");
const { GeminiAdapter } = require("./geminiAdapter");
const { AnthropicAdapter } = require("./anthropicAdapter");

function parseModelRef(value, fallback) {
  const raw = value || fallback;
  const [provider, ...rest] = raw.split(":");
  return { provider, model: rest.join(":") };
}

function createProviderRegistry(env = process.env) {
  const providers = new Map();
  providers.set("mock", new MockAdapter());

  if (env.DEEPSEEK_API_KEY) {
    providers.set(
      "deepseek",
      new OpenAICompatibleAdapter({
        baseURL: env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
        apiKey: env.DEEPSEEK_API_KEY,
      }),
    );
  }

  if (env.GEMINI_API_KEY) {
    providers.set(
      "gemini",
      new GeminiAdapter({
        apiKey: env.GEMINI_API_KEY,
        baseURL: env.GEMINI_BASE_URL,
      }),
    );
  }

  const anthropicKey = env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    providers.set(
      "anthropic",
      new AnthropicAdapter({
        baseURL: env.ANTHROPIC_BASE_URL || "https://api.anthropic.com",
        apiKey: anthropicKey,
      }),
    );
  }

  const models = {
    fast: parseModelRef(env.SUPERCHARLI_MODEL_FAST, "mock:fast-default"),
    deep: parseModelRef(env.SUPERCHARLI_MODEL_DEEP, "mock:deep-default"),
    secondary: parseModelRef(env.SUPERCHARLI_MODEL_SECONDARY, "mock:safe-secondary"),
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
