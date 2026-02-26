const { buildProfileSystemPrompt } = require("./profilePrompt");
const { buildRequestContextPrompt } = require("./requestContextPrompt");
const { buildResponseStylePrompt } = require("./responseStylePrompt");

class OpenAICompatibleAdapter {
  constructor(options) {
    this.baseURL = options.baseURL.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs || 20000;
  }

  async generate(model, context) {
    const profilePrompt = buildProfileSystemPrompt(context.personaProfile);
    const requestContextPrompt = buildRequestContextPrompt(context);
    const responseStylePrompt = buildResponseStylePrompt(context);

    const systemPrompt = [
      "You are SuperCharli response engine. Be concise, practical, and avoid fabricated certainty.",
      "Treat profile/role/personality/background constraints as mandatory behavior rules.",
      profilePrompt,
      requestContextPrompt,
      responseStylePrompt,
    ]
      .filter(Boolean)
      .join("\n\n");

    const payload = {
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: context.text,
        },
      ],
      temperature: 0.4,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`provider_error:${res.status}:${body.slice(0, 180)}`);
      }

      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("provider_error:empty_content");
      }

      return { model, content };
    } finally {
      clearTimeout(timer);
    }
  }
}

module.exports = { OpenAICompatibleAdapter };
