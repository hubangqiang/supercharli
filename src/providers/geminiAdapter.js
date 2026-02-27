const { composeSystemPrompt } = require("./systemPromptComposer");

class GeminiAdapter {
  constructor(options) {
    this.apiKey = options.apiKey;
    this.baseURL = (options.baseURL || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs || 20000;
  }

  async generate(model, context) {
    const url = `${this.baseURL}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const promptPlan = composeSystemPrompt(context, { budget: 1800 });

    const composed = [
      "You are SuperCharli response engine.",
      promptPlan.text,
      `User request:\n${context.text}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const payload = {
      contents: [{ parts: [{ text: composed }] }],
      generationConfig: { temperature: 0.4 },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`provider_error:${res.status}:${body.slice(0, 180)}`);
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.map((p) => p?.text || "").join(" ").trim();
      if (!text) {
        throw new Error("provider_error:empty_content");
      }

      return { model, content: text };
    } finally {
      clearTimeout(timer);
    }
  }
}

module.exports = { GeminiAdapter };
