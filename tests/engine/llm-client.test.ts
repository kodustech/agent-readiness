import { describe, test, expect, afterEach } from "bun:test";
import { createLLMClient } from "../../src/engine/llm-client.js";

interface CapturedRequest {
  url: string;
  headers: Record<string, string>;
  body: { model: string; messages: unknown[] };
}

const originalFetch = globalThis.fetch;

describe("createLLMClient", () => {
  let captured: CapturedRequest | undefined;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    captured = undefined;
  });

  function mockFetch(content: string): void {
    globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(
        (init?.headers ?? {}) as Record<string, string>,
      )) {
        headers[key.toLowerCase()] = value;
      }
      captured = {
        url: url.toString(),
        headers,
        body: JSON.parse(String(init?.body)),
      };
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(JSON.parse(content)) } }],
        }),
        { status: 200 },
      );
    }) as typeof fetch;
  }

  test("sends default model when none is configured", async () => {
    mockFetch(
      JSON.stringify({ pass: true, message: "ok", details: "details" }),
    );
    const client = createLLMClient({ apiKey: "test-key" });
    await client.evaluate("criterion", "context");

    expect(captured?.body.model).toBe("gpt-5-mini");
  });

  test("sends configured model in request body", async () => {
    mockFetch(
      JSON.stringify({ pass: true, message: "ok", details: "details" }),
    );
    const client = createLLMClient({
      apiKey: "test-key",
      model: "deepseek-v4.1-flash",
      apiBaseUrl: "https://example.com/v1",
    });
    await client.evaluate("criterion", "context");

    expect(captured?.body.model).toBe("deepseek-v4.1-flash");
    expect(captured?.url).toBe("https://example.com/v1/chat/completions");
    expect(captured?.headers["authorization"]).toBe("Bearer test-key");
  });

  test("respects empty-string model as absent, falling back to default", async () => {
    mockFetch(
      JSON.stringify({ pass: true, message: "ok", details: "details" }),
    );
    const client = createLLMClient({ apiKey: "test-key", model: "" });
    await client.evaluate("criterion", "context");

    expect(captured?.body.model).toBe("gpt-5-mini");
  });

  test("returns parsed pass/message/details from response", async () => {
    mockFetch(
      JSON.stringify({ pass: false, message: "not good", details: "why" }),
    );
    const client = createLLMClient({ apiKey: "test-key" });
    const result = await client.evaluate("criterion", "context");

    expect(result).toEqual({ pass: false, message: "not good", details: "why" });
  });
});
