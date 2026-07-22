import { assessSafety, safetyResponseCopy } from "./safety";
import { fallbackTeaching, matchTeachings, selectTeaching } from "./matcher";
import { getTeachingById } from "./teachings";
import type {
  Teaching,
  TeachingPayload,
  TorahPassage,
  WisdomResponse,
} from "./types";
import { corpusIsAvailable, searchTorah } from "@/lib/torah";

export { formatResponseForClipboard } from "./clipboard";

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

function attachTorahPassages(
  input: string,
  theme?: string,
): Pick<WisdomResponse, "torahPassages" | "torahExploreNote"> {
  if (!corpusIsAvailable()) {
    return {
      torahExploreNote:
        "Torah corpus is not loaded in this environment. Editorial teachings remain available.",
    };
  }

  try {
    const hits = searchTorah(input, { theme });
    if (!hits.length) {
      return {
        torahExploreNote:
          "Torok did not find a strong additional Torah-passage match above its relevance threshold. The curated teaching above remains the primary lens.",
      };
    }

    const torahPassages: TorahPassage[] = hits.map((hit) => ({
      ref: hit.ref,
      english: hit.english,
      whyRelevant: hit.whyRelevant,
      sefariaUrl: hit.sefariaUrl,
      englishVersionTitle: hit.englishVersionTitle,
      englishLicense: hit.englishLicense,
      textKind: "quotation" as const,
    }));

    return {
      torahPassages,
      torahExploreNote:
        "These passages come from a local index of the Five Books of Moses. Retrieval matches themes and related language — not a claim that Torok understands the whole Torah.",
    };
  } catch {
    return {
      torahExploreNote:
        "Torah exploration is temporarily unavailable. Editorial teachings remain available.",
    };
  }
}

export function composeFromTeaching(
  teaching: Teaching,
  options?: {
    mode?: WisdomResponse["mode"];
    acknowledgment?: string;
    input?: string;
    includeTorah?: boolean;
  },
): WisdomResponse {
  const input = options?.input ?? "";
  const base: WisdomResponse = {
    mode: options?.mode ?? "teaching",
    acknowledgment: options?.acknowledgment ?? teaching.acknowledgment,
    teaching: toPayload(teaching),
    tryThisToday: teaching.takeaway,
    reflectionQuestion: teaching.reflectionQuestion,
    alternateTeachingIds: input ? alternateIds(input, teaching.id) : undefined,
  };

  if (options?.includeTorah !== false && input) {
    Object.assign(base, attachTorahPassages(input, teaching.theme));
  }

  return base;
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
      // Sensitive-topic routing overrides ordinary Torah retrieval
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
      // Soft safety: still no exploratory retrieval that could feel like advice
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
    includeTorah: false,
  });
}
