class OpenAICompatibleAdapter {
  constructor(options) {
    this.baseURL = options.baseURL.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs || 20000;
  }

  async generate(model, context) {
    const payload = {
      model,
      messages: [
        {
          role: "system",
          content: "You are SuperCharli response engine. Be concise, practical, and avoid fabricated certainty.",
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
