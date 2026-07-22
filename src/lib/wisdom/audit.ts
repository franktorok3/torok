import { getAllTorahVerses, getTorahManifest } from "@/lib/torah";
import { TEACHINGS } from "./teachings";
import { LIBRARY_REVIEW_STATUS, type Teaching } from "./types";

export type AuditFlagCode =
  | "missing-citation"
  | "missing-paraphrase-label"
  | "unattributed-translation"
  | "duplicate-source-id"
  | "modern-as-source-language"
  | "awaiting-human-review"
  | "library-not-educator-reviewed"
  | "draft-labeled-reviewed"
  | "missing-modern-label"
  | "torah-missing-verse"
  | "torah-duplicate-id"
  | "torah-missing-license"
  | "torah-incomplete-book";

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

  if (
    teaching.reviewStatus === "draft" &&
    !/modern application/i.test(teaching.modernApplication)
  ) {
    flags.push({
      code: "missing-modern-label",
      teachingId: teaching.id,
      message: "Draft modern application should be explicitly labeled",
    });
  }

  if (
    teaching.reviewStatus === "draft" &&
    LIBRARY_REVIEW_STATUS === "educator-reviewed"
  ) {
    flags.push({
      code: "draft-labeled-reviewed",
      teachingId: teaching.id,
      message: "Draft teaching cannot sit under an educator-reviewed library flag",
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

const EXPECTED_CHAPTERS: Record<string, number> = {
  Genesis: 50,
  Exodus: 40,
  Leviticus: 27,
  Numbers: 36,
  Deuteronomy: 34,
};

export function auditTorahCorpus(): AuditFlag[] {
  const flags: AuditFlag[] = [];
  try {
    const manifest = getTorahManifest();
    const verses = getAllTorahVerses();
    const ids = new Set<string>();

    if (manifest.englishLicense.toLowerCase() !== "public domain") {
      flags.push({
        code: "torah-missing-license",
        message: `English corpus license unexpected: ${manifest.englishLicense}`,
      });
    }

    for (const verse of verses) {
      if (ids.has(verse.id)) {
        flags.push({
          code: "torah-duplicate-id",
          message: `Duplicate verse id ${verse.id}`,
        });
      }
      ids.add(verse.id);

      if (!verse.ref || !verse.english || !verse.englishLicense) {
        flags.push({
          code: "torah-missing-license",
          message: `Verse missing required fields: ${verse.id}`,
        });
      }

      if (!/^[A-Za-z]+ \d+:\d+$/.test(verse.ref)) {
        flags.push({
          code: "torah-missing-verse",
          message: `Invalid canonical ref: ${verse.ref}`,
        });
      }
    }

    for (const [book, chapters] of Object.entries(EXPECTED_CHAPTERS)) {
      const bookVerses = verses.filter((v) => v.book === book);
      const chapterSet = new Set(bookVerses.map((v) => v.chapter));
      if (chapterSet.size !== chapters) {
        flags.push({
          code: "torah-incomplete-book",
          message: `${book} expected ${chapters} chapters, found ${chapterSet.size}`,
        });
      }
      for (let c = 1; c <= chapters; c++) {
        if (!chapterSet.has(c)) {
          flags.push({
            code: "torah-missing-verse",
            message: `Missing chapter ${book} ${c}`,
          });
        }
      }
    }

    if (manifest.totals.verses !== verses.length) {
      flags.push({
        code: "torah-incomplete-book",
        message: `Manifest verse count ${manifest.totals.verses} != loaded ${verses.length}`,
      });
    }
  } catch (err) {
    flags.push({
      code: "torah-incomplete-book",
      message: `Torah corpus unavailable: ${String(err)}`,
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

  flags.push(...auditTorahCorpus());

  return { flags, libraryReviewStatus: LIBRARY_REVIEW_STATUS };
}
