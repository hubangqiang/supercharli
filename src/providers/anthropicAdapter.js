const { composeSystemPrompt } = require("./systemPromptComposer");

class AnthropicAdapter {
  constructor(options) {
    this.baseURL = (options.baseURL || "https://api.anthropic.com").replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs || 20000;
  }

  async generate(model, context) {
    const composed = composeSystemPrompt(context, { budget: 1800 });

    const payload = {
      model,
      max_tokens: 600,
      temperature: 0.4,
      messages: [{ role: "user", content: context.text }],
      system: composed.text,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseURL}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`provider_error:${res.status}:${body.slice(0, 180)}`);
      }

      const json = await res.json();
      const blocks = Array.isArray(json?.content) ? json.content : [];
      const text = blocks
        .filter((b) => b?.type === "text")
        .map((b) => b.text)
        .join(" ")
        .trim();

      if (!text) {
        throw new Error("provider_error:empty_content");
      }

      return { model, content: text };
    } finally {
      clearTimeout(timer);
    }
  }
}

module.exports = { AnthropicAdapter };
