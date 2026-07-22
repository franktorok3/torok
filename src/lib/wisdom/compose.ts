import { assessSafety, safetyResponseCopy } from "./safety";
import {
  alternateLensIds,
  fallbackTeaching,
  selectTeaching,
  selectThemePair,
} from "./matcher";
import {
  buildSourcePanel,
  interpretationForTeaching,
} from "./source-panel";
import { getTeachingById } from "./teachings";
import { isPublishableTeaching } from "./publishable";
import type {
  Teaching,
  TeachingPayload,
  TorahPassage,
  WisdomResponse,
} from "./types";
import { corpusIsAvailable, searchTorah } from "@/lib/torah";
import {
  assessRetrievalConfidence,
  corpusIsAvailable as libraryIsAvailable,
  expandQueryConcepts,
  retrieveSources,
  rerankHits,
  verifyHit,
} from "@/lib/library";
import {
  acknowledgmentFor,
  buildLenses,
  hitToSourcePanel,
  practiceFor,
  reflectionFor,
  synthesisFor,
} from "./engine-response";

export { formatResponseForClipboard } from "./clipboard";

const MAX_INPUT = 2000;

function toPayload(teaching: Teaching): TeachingPayload {
  return {
    id: teaching.id,
    theme: teaching.theme,
    themeLabel: teaching.themeLabel,
    textKind: teaching.textKind,
    text: interpretationForTeaching(teaching),
    translationAttribution: teaching.translationAttribution,
    sources: teaching.sources,
    historicalContext: teaching.historicalContext,
    modernApplication: teaching.modernApplication,
    viewpoint: teaching.viewpoint,
    sourcePanel: buildSourcePanel(teaching),
  };
}

function attachTorahPassages(
  input: string,
  theme?: string,
  primaryRef?: string,
): Pick<WisdomResponse, "torahPassages" | "torahExploreNote"> {
  if (!corpusIsAvailable()) {
    return {};
  }

  try {
    const hits = searchTorah(input, { theme });
    const filtered = primaryRef
      ? hits.filter(
          (h) =>
            h.ref.toLowerCase() !== primaryRef.toLowerCase() &&
            !primaryRef.toLowerCase().includes(h.ref.toLowerCase()),
        )
      : hits;

    if (!filtered.length) {
      return {};
    }

    const torahPassages: TorahPassage[] = filtered.map((hit) => ({
      ref: hit.ref,
      hebrew: hit.hebrew,
      english: hit.english,
      whyRelevant: hit.whyRelevant,
      sefariaUrl: hit.sefariaUrl,
      englishVersionTitle: hit.englishVersionTitle,
      englishLicense: hit.englishLicense,
      hebrewVersionTitle: hit.hebrewVersionTitle,
      hebrewLicense: hit.hebrewLicense,
      textKind: "quotation" as const,
    }));

    return { torahPassages };
  } catch {
    return {};
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
  const themes = input ? selectThemePair(input) : { primary: teaching.theme };
  const panel = buildSourcePanel(teaching);
  const base: WisdomResponse = {
    mode: options?.mode ?? "teaching",
    acknowledgment: options?.acknowledgment ?? teaching.acknowledgment,
    teaching: toPayload(teaching),
    tryThisToday: teaching.takeaway,
    reflectionQuestion: teaching.reflectionQuestion,
    primaryTheme: themes.primary ?? teaching.theme,
    secondaryTheme: themes.secondary,
    alternateTeachingIds: input
      ? alternateLensIds(input, teaching.id, teaching.theme)
      : undefined,
    engine: { mode: "curated-fallback", confidence: "medium" },
  };

  if (options?.includeTorah !== false && input) {
    Object.assign(
      base,
      attachTorahPassages(input, teaching.theme, panel?.ref),
    );
  }

  return base;
}

/**
 * Primary response path: retrieval-grounded Jewish wisdom engine.
 * Curated 100 teachings remain as examples / fallbacks only.
 */
function composeFromRetrieval(clipped: string): WisdomResponse | null {
  if (!libraryIsAvailable()) return null;

  try {
    const concepts = expandQueryConcepts(clipped);
    const rawHits = retrieveSources(clipped, { limit: 24 });
    const verified = rawHits.filter(verifyHit);
    const ranked = rerankHits(clipped, verified, 8);
    const confidence = assessRetrievalConfidence(ranked, clipped);

    if (confidence.abstain || ranked.length === 0) {
      return {
        mode: "abstain",
        acknowledgment:
          "I listened carefully, but I did not find a strong classical source match for that wording.",
        tryThisToday:
          "Try rephrasing with a situation, a value, or a theme — for example purpose, justice, repair, courage, or gratitude.",
        reflectionQuestion:
          "What part of the question matters most to you right now?",
        engine: {
          mode: "abstain",
          confidence: "low",
          concepts: concepts.primary,
        },
      };
    }

    const primaryConcepts = [
      ...concepts.primary,
      ...concepts.secondary.slice(0, 4),
    ];
    const ack = acknowledgmentFor(concepts.intents, primaryConcepts);

    if (confidence.useMultiLens) {
      const lenses = buildLenses(ranked, primaryConcepts, 3);
      if (lenses.length >= 2) {
        return {
          mode: "multi",
          acknowledgment: ack,
          lenses,
          synthesis: synthesisFor(primaryConcepts),
          tryThisToday: practiceFor(primaryConcepts),
          reflectionQuestion: reflectionFor(primaryConcepts),
          engine: {
            mode: "multi",
            confidence: confidence.level,
            concepts: primaryConcepts,
          },
        };
      }
    }

    const top = ranked[0];
    const panel = hitToSourcePanel(top);
    const related = ranked.slice(1, 4).map((h) => ({
      ref: h.record.canonicalRef,
      hebrew: h.record.originalText,
      english: h.record.englishText ?? "",
      whyRelevant: `Why this source: This passage relates to ${primaryConcepts[0] ?? "your question"}.`,
      sefariaUrl: h.record.sefariaUrl,
      englishVersionTitle: h.record.versionTitle ?? "Translation",
      englishLicense: h.record.license,
      hebrewVersionTitle: h.record.hebrewVersionTitle ?? null,
      hebrewLicense: h.record.hebrewLicense ?? null,
      textKind: "quotation" as const,
    }));

    return {
      mode: "teaching",
      acknowledgment: ack,
      teaching: {
        id: top.record.id,
        theme: "learning",
        themeLabel: lensThemeLabel(primaryConcepts),
        textKind: "paraphrase",
        text: singleLensInterpretation(top.record.englishText, primaryConcepts),
        sources: [
          {
            canonical: top.record.canonicalRef,
            url: top.record.sefariaUrl,
            category: panel.category,
            hebrew: top.record.originalText,
            originalLanguage: top.record.originalLanguage as "hebrew" | "aramaic",
            english: top.record.englishText,
            englishKind: "quotation",
          },
        ],
        historicalContext: `${top.record.sourceTitle} (${top.record.sourceCategory})`,
        modernApplication: singleLensInterpretation(
          top.record.englishText,
          primaryConcepts,
        ),
        sourcePanel: panel,
      },
      tryThisToday: practiceFor(primaryConcepts),
      reflectionQuestion: reflectionFor(primaryConcepts),
      torahPassages: related.length ? related : undefined,
      engine: {
        mode: "single",
        confidence: confidence.level,
        concepts: primaryConcepts,
      },
    };
  } catch (err) {
    console.error("Retrieval engine failed:", err);
    return null;
  }
}

function lensThemeLabel(concepts: string[]): string {
  const c = concepts[0];
  if (!c) return "Wisdom";
  return c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g, " ");
}

function singleLensInterpretation(
  english: string | undefined,
  concepts: string[],
): string {
  const focus = concepts.slice(0, 2).join(" and ") || "this moment";
  if (english && english.length < 180) {
    return `One way to carry this teaching is to let it shape how you meet ${focus} today — as learning and reflection, not as a ruling.`;
  }
  return `This source offers a classical lens on ${focus}. Sit with it, then choose one concrete response that fits your situation — Torok offers learning, not rabbinic authority.`;
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

    // Soft safety: curated educational lens only — no exploratory retrieval
    const match = selectTeaching(clipped);
    const teaching = match?.teaching ?? fallbackTeaching();
    const themes = selectThemePair(clipped);

    return {
      mode: "safety",
      acknowledgment: copy.hearing,
      teaching: toPayload(teaching),
      tryThisToday: `${copy.forToday} Meanwhile, one educational lens: ${teaching.takeaway}`,
      reflectionQuestion:
        copy.reflectionQuestion ?? teaching.reflectionQuestion,
      safetyKind: safety.kind,
      primaryTheme: themes.primary ?? teaching.theme,
      secondaryTheme: themes.secondary,
      alternateTeachingIds: alternateLensIds(
        clipped,
        teaching.id,
        teaching.theme,
      ),
      engine: { mode: "curated-fallback", confidence: "medium" },
    };
  }

  // Primary path: retrieval-grounded engine
  const retrieved = composeFromRetrieval(clipped);
  if (retrieved) {
    if (retrieved.mode === "abstain") {
      // Offer a curated fallback only as a gentle secondary option when themed
      const match = selectTeaching(clipped);
      if (match && match.score >= 8 && isPublishableTeaching(match.teaching)) {
        return composeFromTeaching(match.teaching, {
          mode: "fallback",
          acknowledgment:
            "I did not find a strong library match — here is a carefully curated teaching that may still help you reflect.",
          input: clipped,
          includeTorah: false,
        });
      }
    }
    return retrieved;
  }

  // Library unavailable: curated fallback (never random weak match)
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
  if (!teaching || !isPublishableTeaching(teaching)) return null;
  return composeFromTeaching(teaching, {
    acknowledgment: teaching.acknowledgment,
    includeTorah: false,
  });
}
