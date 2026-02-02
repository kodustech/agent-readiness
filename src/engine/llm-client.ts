import type { LLMClient } from "../types/index.js";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-5-mini";

const SYSTEM_PROMPT = `You are a code repository evaluator. Your job is to assess whether a repository meets specific readiness criteria.

You will receive:
- A criterion prompt describing what to evaluate
- Context gathered from the repository (file contents, structure, etc.)

Analyze the provided context against the criterion and respond with a JSON object in this exact format:
{
  "pass": boolean,
  "message": "A concise summary of the evaluation result",
  "details": "Optional detailed explanation with specific findings"
}

Rules:
- "pass" must be true if the criterion is clearly met, false otherwise.
- "message" should be a single sentence summarizing the result.
- "details" should include specific evidence from the context when relevant.
- Respond ONLY with the JSON object, no markdown fences or extra text.`;

interface LLMClientOptions {
  apiKey: string;
  apiBaseUrl?: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
}

export function createLLMClient(options: LLMClientOptions): LLMClient {
  const { apiKey, apiBaseUrl = DEFAULT_BASE_URL } = options;

  const evaluate: LLMClient["evaluate"] = async (prompt, context) => {
    try {
      const url = `${apiBaseUrl.replace(/\/+$/, "")}/chat/completions`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `## Criterion\n${prompt}\n\n## Repository Context\n${context}`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "unknown error");
        return {
          pass: false,
          message: `LLM API request failed with status ${response.status}`,
          details: errorBody,
        };
      }

      const data = (await response.json()) as ChatCompletionResponse;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return {
          pass: false,
          message: "LLM returned an empty response",
        };
      }

      const parsed = JSON.parse(content) as {
        pass: boolean;
        message: string;
        details?: string;
      };

      return {
        pass: Boolean(parsed.pass),
        message: parsed.message ?? "No message provided",
        ...(parsed.details != null ? { details: parsed.details } : {}),
      };
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : String(error);
      return {
        pass: false,
        message: `LLM evaluation failed: ${errMessage}`,
      };
    }
  };

  return { evaluate };
}
