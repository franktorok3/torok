import { getVerseByRef } from "@/lib/torah";
import { extractTorahRefClient } from "./citation-display";
import { inferSourceCategory } from "./source-category";
import type {
  OriginalLanguage,
  SourcePanel,
  Teaching,
  TextKind,
} from "./types";

export { extractTorahRefClient as extractTorahRef } from "./citation-display";

function cleanModernPrefix(text: string): string {
  return text.replace(/^Modern application \(not source language\):\s*/i, "").trim();
}

/**
 * Build the primary source panel for a teaching.
 * Prefers curated verified original text on the SourceRef;
 * hydrates Torah from corpus only as a backup;
 * never fabricates original-language text.
 */
export function buildSourcePanel(teaching: Teaching): SourcePanel | undefined {
  const primary = teaching.sources[0];
  if (!primary?.canonical) return undefined;

  const category =
    primary.category ?? inferSourceCategory(primary.canonical);
  const citationLabel =
    primary.citationLabel?.trim() || primary.canonical.trim();

  let originalText = primary.hebrew?.trim() || null;
  let originalLanguage: OriginalLanguage | null =
    primary.originalLanguage ?? (originalText ? "hebrew" : null);
  let english = primary.english?.trim() || null;
  let englishKind: TextKind =
    primary.englishKind ??
    (english ? "quotation" : teaching.textKind);
  let originalEdition = primary.originalEdition ?? null;
  let originalLicense = primary.originalLicense ?? null;
  let englishVersionTitle: string | null =
    primary.attribution ?? teaching.translationAttribution ?? null;
  let englishLicense: string | null = null;
  let englishIsTranslation = false;
  let sefariaUrl = primary.url;

  const torahRef = extractTorahRefClient(primary.canonical);
  if (!originalText && category === "torah" && torahRef) {
    try {
      const verse = getVerseByRef(torahRef);
      if (verse?.hebrew) {
        originalText = verse.hebrew;
        originalLanguage = "hebrew";
        originalEdition = verse.hebrewVersionTitle;
        originalLicense = verse.hebrewLicense;
        if (!english) {
          english = verse.english;
          englishKind = "quotation";
          englishIsTranslation = true;
          englishVersionTitle = verse.englishVersionTitle;
          englishLicense = verse.englishLicense;
        }
        sefariaUrl = sefariaUrl ?? verse.sefariaUrl;
      }
    } catch {
      // Corpus unavailable
    }
  } else if (originalText && category === "torah" && torahRef && !english) {
    try {
      const verse = getVerseByRef(torahRef);
      if (verse) {
        english = verse.english;
        englishKind = "quotation";
        englishIsTranslation = true;
        englishVersionTitle = verse.englishVersionTitle;
        englishLicense = verse.englishLicense;
        sefariaUrl = sefariaUrl ?? verse.sefariaUrl;
      }
    } catch {
      // ignore
    }
  }

  if (originalText && englishKind === "quotation") {
    englishIsTranslation = true;
  }

  // Graceful fallback: labeled interpretive English, never an empty box
  if (!originalText && !english) {
    english = teaching.text.trim();
    englishKind = "paraphrase";
    englishIsTranslation = false;
  }

  const incomplete = !originalText;

  return {
    ref: torahRef ?? primary.canonical,
    citationLabel,
    category,
    originalText,
    originalLanguage,
    hebrew: originalText,
    english,
    englishKind,
    sefariaUrl,
    originalEdition,
    originalLicense,
    hebrewVersionTitle: originalEdition,
    hebrewLicense: originalLicense,
    englishVersionTitle,
    englishLicense,
    englishIsTranslation,
    incomplete,
    historicalContext: teaching.historicalContext,
    viewpoint: teaching.viewpoint,
    interpretationPreview: interpretationForTeaching(teaching),
  };
}

export function interpretationForTeaching(teaching: Teaching): string {
  const modern = cleanModernPrefix(teaching.modernApplication);
  const primary = teaching.sources[0];
  const hasCuratedClassical = Boolean(primary?.hebrew || primary?.english);

  if (hasCuratedClassical) {
    return teaching.text.trim();
  }

  if (teaching.textKind === "quotation" && modern) {
    return modern;
  }

  return teaching.text.trim();
}

export function isSourceComplete(teaching: Teaching): boolean {
  if (teaching.sourceIncomplete === false && teaching.sources[0]?.hebrew) {
    return true;
  }
  if (teaching.sourceIncomplete === true) return false;
  return Boolean(teaching.sources[0]?.hebrew?.trim());
}
