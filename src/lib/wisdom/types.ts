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

export type ReviewStatus = "draft" | "awaiting-educator-review" | "educator-reviewed";

export type TextKind = "quotation" | "paraphrase";

export interface SourceRef {
  /** Canonical citation, e.g. "Leviticus 19:18" */
  canonical: string;
  /** Optional stable URL for further study */
  url?: string;
}

export interface Teaching {
  id: string;
  theme: Theme;
  themeLabel: string;
  sources: SourceRef[];
  textKind: TextKind;
  /** Exact quotation or carefully labeled paraphrase body (without the word Paraphrase: prefix when textKind is set) */
  text: string;
  /** Required when textKind is quotation */
  translationAttribution?: string;
  historicalContext: string;
  modernApplication: string;
  takeaway: string;
  reflectionQuestion: string;
  /** Empathetic acknowledgment template for this theme */
  acknowledgment: string;
  viewpoint?: string;
  keywords: string[];
  reviewStatus: ReviewStatus;
}

export interface TeachingPayload {
  id: string;
  themeLabel: string;
  textKind: TextKind;
  text: string;
  translationAttribution?: string;
  sources: SourceRef[];
  historicalContext: string;
  modernApplication: string;
  viewpoint?: string;
}

export interface WisdomResponse {
  mode: "teaching" | "safety" | "empty" | "fallback" | "error";
  acknowledgment: string;
  teaching?: TeachingPayload;
  tryThisToday: string;
  reflectionQuestion?: string;
  /** Other strong matches for “Another lens” */
  alternateTeachingIds?: string[];
  safetyKind?: string;
  /** Up to three Torah passages from the local corpus (not for hard safety) */
  torahPassages?: TorahPassage[];
  torahExploreNote?: string;
}

export interface TorahPassage {
  ref: string;
  english: string;
  whyRelevant: string;
  sefariaUrl: string;
  englishVersionTitle: string;
  englishLicense: string;
  textKind: "quotation";
}

export interface MatchResult {
  teaching: Teaching;
  score: number;
  matchedKeywords: string[];
}

export const SHORT_DISCLAIMER =
  "Torok offers Jewish learning and reflection, not rabbinic rulings, pastoral counseling, or professional advice.";

/** Library-level status: never claim educator review until a qualified reviewer has signed off. */
export const LIBRARY_REVIEW_STATUS: ReviewStatus = "awaiting-educator-review";
