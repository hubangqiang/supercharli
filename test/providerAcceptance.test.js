const assert = require("assert");
const { createProviderRegistry, parseModelRef } = require("../src/providers/providerRegistry");
const { BasicModelRouter } = require("../src/router/basicModelRouter");

function runModelRefParsingChecks() {
  const parsed = parseModelRef("deepseek:deepseek-chat", "mock:fast-default");
  assert.deepStrictEqual(parsed, { provider: "deepseek", model: "deepseek-chat" });

  const fallback = parseModelRef(undefined, "mock:fast-default");
  assert.deepStrictEqual(fallback, { provider: "mock", model: "fast-default" });
}

async function runRegistryChecks() {
  const reg = createProviderRegistry({});
  assert.ok(reg.providers.has("mock"), "mock provider should always exist");

  await assert.rejects(
    () =>
      reg.generate(
        { provider: "deepseek", model: "deepseek-chat" },
        { text: "hello", recalled: [] },
      ),
    /provider_not_configured:deepseek/,
  );
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
  await runRouterWithInjectedProvidersChecks();
  console.log("provider acceptance tests: PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
