/**
 * Optional grounded language-model composition.
 *
 * Without TOROK_LLM_API_KEY (or provider-specific keys), this module is a
 * no-op and Torok uses deterministic retrieval + templated connective language.
 *
 * The model may only summarize / compare / reflect on retrieved records.
 * Quotations must still be hydrated from verified SourceRecords after compose.
 */
export type LlmProviderName = "none" | "openai-compatible";

export type GroundedComposeInput = {
  intentSummary: string;
  concepts: string[];
  sources: Array<{
    id: string;
    canonicalRef: string;
    englishExcerpt?: string;
    topics: string[];
  }>;
  responseMode: "single" | "multi";
};

export type GroundedComposeOutput = {
  synthesis?: string;
  practice?: string;
  reflectionQuestion?: string;
  lensTitles?: string[];
  provider: LlmProviderName;
};

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export function getLlmProviderName(): LlmProviderName {
  if (env("TOROK_LLM_API_KEY") || env("OPENAI_API_KEY")) {
    return "openai-compatible";
  }
  return "none";
}

export function llmIsConfigured(): boolean {
  return getLlmProviderName() !== "none";
}

/**
 * Attempt grounded composition. Returns null on any failure / timeout /
 * missing key so callers can fall back to deterministic templates.
 */
export async function composeWithOptionalLlm(
  input: GroundedComposeInput,
): Promise<GroundedComposeOutput | null> {
  const provider = getLlmProviderName();
  if (provider === "none") return null;

  const apiKey = env("TOROK_LLM_API_KEY") || env("OPENAI_API_KEY");
  const baseUrl =
    env("TOROK_LLM_BASE_URL") || "https://api.openai.com/v1";
  const model = env("TOROK_LLM_MODEL") || "gpt-4o-mini";
  const timeoutMs = Number(env("TOROK_LLM_TIMEOUT_MS") || 8000);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const system = [
      "You compose short Jewish-learning reflections grounded ONLY in the provided sources.",
      "Never invent citations or quote text not present in the sources.",
      "Never issue a halachic ruling or claim rabbinic authority.",
      "Never say 'the Jewish answer'. Prefer 'one traditional lens'.",
      "Return strict JSON with keys: synthesis, practice, reflectionQuestion, lensTitles (array, optional).",
    ].join(" ");

    const user = JSON.stringify({
      intent: input.intentSummary,
      concepts: input.concepts,
      mode: input.responseMode,
      sources: input.sources,
    });

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as Partial<GroundedComposeOutput>;
    return {
      synthesis:
        typeof parsed.synthesis === "string" ? parsed.synthesis : undefined,
      practice: typeof parsed.practice === "string" ? parsed.practice : undefined,
      reflectionQuestion:
        typeof parsed.reflectionQuestion === "string"
          ? parsed.reflectionQuestion
          : undefined,
      lensTitles: Array.isArray(parsed.lensTitles)
        ? parsed.lensTitles.filter((t): t is string => typeof t === "string")
        : undefined,
      provider,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
