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
  | "technology";

export type CharacterState =
  | "idle"
  | "listening"
  | "thinking"
  | "answering";

export interface Teaching {
  id: string;
  theme: Theme;
  themeLabel: string;
  source: string;
  paraphrase: string;
  explanation: string;
  takeaway: string;
  reflectionQuestion: string;
  keywords: string[];
}

export interface WisdomResponse {
  mode: "teaching" | "safety" | "empty" | "fallback";
  hearing: string;
  teaching?: {
    paraphrase: string;
    explanation: string;
    source: string;
    themeLabel: string;
  };
  forToday: string;
  reflectionQuestion?: string;
  disclaimer: string;
  matchedTheme?: Theme;
  engineNote: string;
}

export interface MatchResult {
  teaching: Teaching;
  score: number;
  matchedKeywords: string[];
}

export const SHORT_DISCLAIMER =
  "Torok offers Jewish learning and reflection, not rabbinic rulings, pastoral counseling, or professional advice.";
