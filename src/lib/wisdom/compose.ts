import { assessSafety, safetyResponseCopy } from "./safety";
import { fallbackTeaching, matchTeachings, selectTeaching } from "./matcher";
import { getTeachingById } from "./teachings";
import type { Teaching, TeachingPayload, WisdomResponse } from "./types";

const MAX_INPUT = 2000;
const ALT_SCORE_FLOOR = 3;

function toPayload(teaching: Teaching): TeachingPayload {
  return {
    id: teaching.id,
    themeLabel: teaching.themeLabel,
    textKind: teaching.textKind,
    text: teaching.text,
    translationAttribution: teaching.translationAttribution,
    sources: teaching.sources,
    historicalContext: teaching.historicalContext,
    modernApplication: teaching.modernApplication,
    viewpoint: teaching.viewpoint,
  };
}

function alternateIds(input: string, primaryId: string): string[] {
  return matchTeachings(input)
    .filter((m) => m.teaching.id !== primaryId && m.score >= ALT_SCORE_FLOOR)
    .slice(0, 2)
    .map((m) => m.teaching.id);
}

export function composeFromTeaching(
  teaching: Teaching,
  options?: { mode?: WisdomResponse["mode"]; acknowledgment?: string; input?: string },
): WisdomResponse {
  const input = options?.input ?? "";
  return {
    mode: options?.mode ?? "teaching",
    acknowledgment: options?.acknowledgment ?? teaching.acknowledgment,
    teaching: toPayload(teaching),
    tryThisToday: teaching.takeaway,
    reflectionQuestion: teaching.reflectionQuestion,
    alternateTeachingIds: input ? alternateIds(input, teaching.id) : undefined,
  };
}

export function composeWisdom(rawInput: string): WisdomResponse {
  const input = rawInput.trim();

  if (!input) {
    return {
      mode: "empty",
      acknowledgment: "I’m ready when you are.",
      tryThisToday:
        "Share what’s on your mind — even a short phrase — and I’ll offer a Jewish teaching with one practical reflection.",
    };
  }

  const clipped = input.slice(0, MAX_INPUT);
  const safety = assessSafety(clipped);

  if (safety.triggered && safety.kind) {
    const copy = safetyResponseCopy(safety.kind);
    const hardStop = safety.kind === "crisis" || safety.kind === "abuse";

    if (hardStop) {
      return {
        mode: "safety",
        acknowledgment: copy.hearing,
        tryThisToday: copy.forToday,
        reflectionQuestion: copy.reflectionQuestion,
        safetyKind: safety.kind,
      };
    }

    const match = selectTeaching(clipped);
    const teaching = match?.teaching ?? fallbackTeaching();

    return {
      mode: "safety",
      acknowledgment: copy.hearing,
      teaching: toPayload(teaching),
      tryThisToday: `${copy.forToday} Meanwhile, one educational lens: ${teaching.takeaway}`,
      reflectionQuestion:
        copy.reflectionQuestion ?? teaching.reflectionQuestion,
      safetyKind: safety.kind,
      alternateTeachingIds: alternateIds(clipped, teaching.id),
    };
  }

  const match = selectTeaching(clipped);

  if (!match || match.score < 3) {
    const teaching = fallbackTeaching();
    return composeFromTeaching(teaching, {
      mode: "fallback",
      acknowledgment:
        "I’m not sure I caught the heart of it — here’s a gentle lens for uncertain moments.",
      input: clipped,
    });
  }

  return composeFromTeaching(match.teaching, {
    mode: "teaching",
    input: clipped,
  });
}

export function composeByTeachingId(id: string): WisdomResponse | null {
  const teaching = getTeachingById(id);
  if (!teaching) return null;
  return composeFromTeaching(teaching, {
    acknowledgment: "A teaching you can sit with.",
  });
}

export function formatResponseForClipboard(response: WisdomResponse): string {
  const parts = ["Torok", "", response.acknowledgment];

  if (response.teaching) {
    const label =
      response.teaching.textKind === "quotation" ? "Quotation" : "Paraphrase";
    parts.push(
      "",
      "A teaching for this moment",
      `${label}: ${response.teaching.text}`,
    );
    if (response.teaching.translationAttribution) {
      parts.push(`Translation: ${response.teaching.translationAttribution}`);
    }
    for (const source of response.teaching.sources) {
      parts.push(`Source: ${source.canonical}`);
    }
    parts.push("", response.teaching.modernApplication);
  }

  parts.push("", `Try this today: ${response.tryThisToday}`);

  if (response.reflectionQuestion) {
    parts.push("", `A question to carry: ${response.reflectionQuestion}`);
  }

  return parts.join("\n");
}
