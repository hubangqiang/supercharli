const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createProviderRegistry, parseModelRef } = require("../src/providers/providerRegistry");
const { BasicModelRouter } = require("../src/router/basicModelRouter");

function runModelRefParsingChecks() {
  const parsed = parseModelRef("primary:MODEL_FAST", "mock:fast-default");
  assert.deepStrictEqual(parsed, { provider: "primary", model: "MODEL_FAST" });

  const fallback = parseModelRef(undefined, "mock:fast-default");
  assert.deepStrictEqual(fallback, { provider: "mock", model: "fast-default" });
}

async function runRegistryChecks() {
  const reg = createProviderRegistry({});
  assert.ok(reg.providers.has("mock"), "mock provider should always exist");

  await assert.rejects(
    () =>
      reg.generate(
        { provider: "primary", model: "MODEL_FAST" },
        { text: "hello", recalled: [] },
      ),
    /provider_not_configured:primary/,
  );
}

function runConfigFileLoadingChecks() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "supercharli-provider-config-"));
  const configPath = path.join(tmpDir, "providers.json");
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        providers: [
          {
            id: "primary",
            type: "openai_compatible",
            baseURL: "https://example.local/v1",
            apiKeyEnv: "PRIMARY_PROVIDER_API_KEY",
          },
        ],
        routes: {
          fast: "primary:MODEL_FAST",
          deep: "primary:MODEL_DEEP",
          secondary: "mock:safe-secondary",
        },
      },
      null,
      2,
    ),
  );

  const reg = createProviderRegistry({
    SUPERCHARLI_PROVIDER_CONFIG_FILE: configPath,
    PRIMARY_PROVIDER_API_KEY: "dummy",
  });

  assert.strictEqual(reg.models.fast.provider, "primary");
  assert.strictEqual(reg.models.fast.model, "MODEL_FAST");

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

async function runRouterWithInjectedProvidersChecks() {
  const registry = {
    models: {
      fast: { provider: "stub-fast", model: "fast-a" },
      deep: { provider: "stub-deep", model: "deep-a" },
      secondary: { provider: "stub-secondary", model: "secondary-a" },
    },
    async generate(modelRef, context) {
      if (modelRef.provider === "stub-fast") {
        throw new Error("forced primary failure");
      }
      return {
        provider: modelRef.provider,
        model: modelRef.model,
        content: `ok:${context.text}`,
      };
    },
  };

  const router = new BasicModelRouter({ registry });
  const selected = router.selectRoute({ text: "普通问题" });
  assert.strictEqual(selected.model.provider, "stub-fast");

  const out = await router.generateWithFallback(selected.model, { text: "x", recalled: [] });
  assert.strictEqual(out.fallbackUsed, true);
  assert.strictEqual(out.fallbackLevel, 2);
  assert.strictEqual(out.result.provider, "stub-secondary");
}

async function run() {
  runModelRefParsingChecks();
  await runRegistryChecks();
  runConfigFileLoadingChecks();
  await runRouterWithInjectedProvidersChecks();
  console.log("provider acceptance tests: PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
