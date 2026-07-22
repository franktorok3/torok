import { composeByTeachingId, composeWisdom } from "@/lib/wisdom";
import {
  composeWithOptionalLlm,
  llmIsConfigured,
} from "@/lib/wisdom/llm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface WisdomRequestBody {
  situation?: unknown;
  teachingId?: unknown;
}

export async function POST(request: Request) {
  let body: WisdomRequestBody;

  try {
    body = (await request.json()) as WisdomRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Please send a JSON body with a situation string." },
      { status: 400 },
    );
  }

  if (typeof body.teachingId === "string" && body.teachingId) {
    const byId = composeByTeachingId(body.teachingId);
    if (!byId) {
      return NextResponse.json({ error: "Unknown teaching." }, { status: 404 });
    }
    return NextResponse.json({ ...byId, provider: "local-curated" });
  }

  const situation =
    typeof body.situation === "string" ? body.situation : "";

  const response = composeWisdom(situation);

  // Optional grounded model may refine connective language only.
  // Quotations remain hydrated from verified source records in composeWisdom.
  let provider: "local-retrieval" | "local-curated" | "grounded-llm" =
    response.engine?.mode === "curated-fallback"
      ? "local-curated"
      : "local-retrieval";

  if (
    llmIsConfigured() &&
    (response.mode === "multi" || response.mode === "teaching") &&
    response.engine?.concepts?.length
  ) {
    try {
      const llm = await composeWithOptionalLlm({
        intentSummary: situation.slice(0, 400),
        concepts: response.engine.concepts,
        responseMode: response.mode === "multi" ? "multi" : "single",
        sources: (response.lenses ?? [])
          .map((l) => ({
            id: l.id,
            canonicalRef: l.sourcePanel.ref,
            englishExcerpt: l.sourcePanel.english?.slice(0, 240),
            topics: response.engine?.concepts ?? [],
          }))
          .concat(
            response.teaching?.sourcePanel
              ? [
                  {
                    id: response.teaching.id,
                    canonicalRef: response.teaching.sourcePanel.ref,
                    englishExcerpt:
                      response.teaching.sourcePanel.english?.slice(0, 240),
                    topics: response.engine?.concepts ?? [],
                  },
                ]
              : [],
          ),
      });
      if (llm) {
        provider = "grounded-llm";
        if (llm.synthesis) response.synthesis = llm.synthesis;
        if (llm.practice) response.tryThisToday = llm.practice;
        if (llm.reflectionQuestion) {
          response.reflectionQuestion = llm.reflectionQuestion;
        }
      }
    } catch {
      // Keep deterministic retrieval response.
    }
  }

  return NextResponse.json({
    ...response,
    provider,
  });
}
