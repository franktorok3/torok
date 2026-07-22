import { TEACHINGS } from "./teachings";
import { LIBRARY_REVIEW_STATUS, type Teaching } from "./types";

export type AuditFlagCode =
  | "missing-citation"
  | "missing-paraphrase-label"
  | "unattributed-translation"
  | "duplicate-source-id"
  | "modern-as-source-language"
  | "awaiting-human-review"
  | "library-not-educator-reviewed";

export interface AuditFlag {
  code: AuditFlagCode;
  teachingId?: string;
  message: string;
}

const MODERN_MARKERS =
  /\b(including by setting|one way to apply|in a difficult conversation|modern|contemporary|today'?s|AI|smartphone|social media)\b/i;

function looksLikeSourceLanguageClaim(text: string): boolean {
  return (
    /\b(the torah says you must|the verse means you should|literally requires)\b/i.test(
      text,
    ) ||
    (MODERN_MARKERS.test(text) &&
      /\b(the verse says|the torah teaches that you)\b/i.test(text))
  );
}

export function auditTeaching(teaching: Teaching): AuditFlag[] {
  const flags: AuditFlag[] = [];

  if (!teaching.sources.length || teaching.sources.some((s) => !s.canonical)) {
    flags.push({
      code: "missing-citation",
      teachingId: teaching.id,
      message: "Missing canonical citation",
    });
  }

  if (teaching.textKind === "paraphrase") {
    // Paraphrases are labeled in the UI via textKind; body should not claim to be exact quote
    if (/^["“]/.test(teaching.text.trim()) && !teaching.translationAttribution) {
      flags.push({
        code: "missing-paraphrase-label",
        teachingId: teaching.id,
        message: "Paraphrase begins like a quotation without attribution",
      });
    }
  }

  if (teaching.textKind === "quotation" && !teaching.translationAttribution) {
    flags.push({
      code: "unattributed-translation",
      teachingId: teaching.id,
      message: "Quotation missing translation attribution",
    });
  }

  if (
    looksLikeSourceLanguageClaim(teaching.modernApplication) ||
    looksLikeSourceLanguageClaim(teaching.text)
  ) {
    flags.push({
      code: "modern-as-source-language",
      teachingId: teaching.id,
      message: "Possible modern application presented as source language",
    });
  }

  if (teaching.reviewStatus !== "educator-reviewed") {
    flags.push({
      code: "awaiting-human-review",
      teachingId: teaching.id,
      message: `Review status is “${teaching.reviewStatus}”`,
    });
  }

  return flags;
}

export function auditTeachingsLibrary(teachings: Teaching[] = TEACHINGS): {
  flags: AuditFlag[];
  libraryReviewStatus: typeof LIBRARY_REVIEW_STATUS;
} {
  const flags: AuditFlag[] = [];
  const seenIds = new Set<string>();
  const seenCanonical = new Map<string, string>();

  if (LIBRARY_REVIEW_STATUS !== "educator-reviewed") {
    flags.push({
      code: "library-not-educator-reviewed",
      message:
        "Library is not marked educator-reviewed. A qualified rabbi or Jewish educator must review before claiming editorial review.",
    });
  }

  for (const teaching of teachings) {
    if (seenIds.has(teaching.id)) {
      flags.push({
        code: "duplicate-source-id",
        teachingId: teaching.id,
        message: `Duplicate teaching id “${teaching.id}”`,
      });
    }
    seenIds.add(teaching.id);

    for (const source of teaching.sources) {
      const key = `${teaching.id}::${source.canonical}`;
      const prior = seenCanonical.get(source.canonical);
      // Same canonical across different teachings is OK; duplicate within one teaching is not
      void prior;
      void key;
    }

    const canonicals = teaching.sources.map((s) => s.canonical);
    const unique = new Set(canonicals);
    if (unique.size !== canonicals.length) {
      flags.push({
        code: "duplicate-source-id",
        teachingId: teaching.id,
        message: "Duplicate canonical source on the same teaching",
      });
    }

    flags.push(...auditTeaching(teaching));
  }

  return { flags, libraryReviewStatus: LIBRARY_REVIEW_STATUS };
}
