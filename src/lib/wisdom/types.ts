export type Theme =
  | "patience"
  | "repair"
  | "relationships"
  | "leadership"
  | "courage"
  | "gratitude"
  | "community"
  | "justice"
  | "rest"
  | "speech"
  | "uncertainty"
  | "learning"
  | "generosity"
  | "technology"
  | "forgiveness"
  | "anger"
  | "humility"
  | "hospitality"
  | "family"
  | "work"
  | "hope"
  | "truth"
  | "joy"
  | "stewardship";

export type CharacterState =
  | "idle"
  | "listening"
  | "thinking"
  | "revealing"
  | "success"
  | "sensitive";

export type ReviewStatus =
  | "draft"
  | "awaiting-educator-review"
  | "educator-reviewed";

export type TextKind = "quotation" | "paraphrase";

/** Classical layer of the primary citation */
export type SourceCategory = "torah" | "tanakh" | "rabbinic" | "later";

/** Original classical language of the primary source text */
export type OriginalLanguage = "hebrew" | "aramaic";

export interface SourceRef {
  canonical: string;
  url?: string;
  category?: SourceCategory;
  /**
   * Verified original-language text (Hebrew or Aramaic).
   * Never fabricate — leave null/undefined when unavailable.
   */
  hebrew?: string | null;
  /** When set, distinguishes Aramaic from Hebrew for lang/dir and labels */
  originalLanguage?: OriginalLanguage;
  originalEdition?: string | null;
  originalLicense?: string | null;
  /** Classical English translation or labeled source paraphrase */
  english?: string | null;
  englishKind?: TextKind;
  /** Short attribution for the English line */
  attribution?: string;
  /** Display citation, e.g. "Pirkei Avot 4:1 · Ben Zoma" */
  citationLabel?: string;
}

export interface Teaching {
  id: string;
  theme: Theme;
  themeLabel: string;
  sources: SourceRef[];
  textKind: TextKind;
  /**
   * Torok’s interpretive lens (“One way to carry it”).
   * Must not duplicate the classical source quotation.
   */
  text: string;
  translationAttribution?: string;
  historicalContext: string;
  modernApplication: string;
  takeaway: string;
  reflectionQuestion: string;
  acknowledgment: string;
  viewpoint?: string;
  keywords: string[];
  reviewStatus: ReviewStatus;
  /** True when required original-language source data is missing */
  sourceIncomplete?: boolean;
}

export interface SourcePanel {
  ref: string;
  citationLabel: string;
  category: SourceCategory;
  /** Original text (Hebrew or Aramaic) */
  originalText?: string | null;
  originalLanguage?: OriginalLanguage | null;
  /** @deprecated use originalText — kept for transitional callers */
  hebrew?: string | null;
  english?: string | null;
  englishKind: TextKind;
  sefariaUrl?: string;
  originalEdition?: string | null;
  originalLicense?: string | null;
  hebrewVersionTitle?: string | null;
  hebrewLicense?: string | null;
  englishVersionTitle?: string | null;
  englishLicense?: string | null;
  englishIsTranslation: boolean;
  /** True when original-language text is still missing */
  incomplete?: boolean;
  /** Context for the Learn more panel */
  historicalContext?: string;
  viewpoint?: string;
  interpretationPreview?: string;
}

export interface TeachingPayload {
  id: string;
  theme: Theme;
  themeLabel: string;
  textKind: TextKind;
  /** Torok interpretation (“One way to carry it”) */
  text: string;
  translationAttribution?: string;
  sources: SourceRef[];
  historicalContext: string;
  modernApplication: string;
  viewpoint?: string;
  sourcePanel?: SourcePanel;
}

export interface WisdomResponse {
  mode:
    | "teaching"
    | "safety"
    | "empty"
    | "fallback"
    | "error"
    | "multi"
    | "abstain";
  acknowledgment: string;
  teaching?: TeachingPayload;
  /** Multi-lens philosophical / broad responses */
  lenses?: Array<{
    id: string;
    title: string;
    explanation: string;
    sourcePanel: SourcePanel;
  }>;
  synthesis?: string;
  tryThisToday: string;
  reflectionQuestion?: string;
  primaryTheme?: Theme;
  secondaryTheme?: Theme;
  alternateTeachingIds?: string[];
  safetyKind?: string;
  torahPassages?: TorahPassage[];
  torahExploreNote?: string;
  /** Retrieval engine metadata — not shown in main UI */
  engine?: {
    mode: "single" | "multi" | "abstain" | "curated-fallback";
    confidence?: "high" | "medium" | "low";
    concepts?: string[];
  };
}

export interface TorahPassage {
  ref: string;
  hebrew?: string | null;
  english: string;
  whyRelevant: string;
  sefariaUrl: string;
  englishVersionTitle: string;
  englishLicense: string;
  hebrewVersionTitle?: string | null;
  hebrewLicense?: string | null;
  textKind: "quotation";
}

export interface MatchResult {
  teaching: Teaching;
  score: number;
  matchedKeywords: string[];
}

export const SHORT_DISCLAIMER =
  "Torok offers Jewish learning and reflection, not rabbinic rulings, pastoral counseling, or professional advice.";

export const BRAND_NAME = "Torok";
export const BRAND_DESCRIPTOR = "The Torah Wisdom Bot";
export const BRAND_TAGLINE = "Ancient wisdom for the moment you’re in.";

export const LIBRARY_REVIEW_STATUS: ReviewStatus = "awaiting-educator-review";

export const FRIENDLY_ERROR =
  "Torok lost the page for a moment. Your question is still here. Please try again.";
