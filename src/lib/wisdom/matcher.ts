import { TEACHINGS } from "./teachings";
import type { MatchResult, Teaching, Theme } from "./types";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const THEME_HINTS: Record<Theme, string[]> = {
  patience: ["patience", "wait", "impulse", "temper", "frustrated"],
  repair: ["mistake", "apology", "repair", "amends", "teshuvah", "sorry"],
  relationships: [
    "conversation",
    "conflict",
    "relationship",
    "family",
    "argue",
    "tension",
  ],
  leadership: ["leadership", "leader", "team", "responsibility", "manage"],
  courage: ["courage", "brave", "fear", "afraid", "risk"],
  gratitude: ["gratitude", "grateful", "thankful", "thanks", "appreciate"],
  community: ["community", "lonely", "belong", "together", "alone"],
  justice: ["justice", "fair", "unfair", "ethics", "injustice"],
  rest: ["rest", "tired", "burnout", "shabbat", "exhausted", "overwhelmed"],
  speech: ["gossip", "speech", "words", "rumor", "lashon"],
  uncertainty: ["uncertain", "unsure", "decision", "dilemma", "confused"],
  learning: ["learn", "study", "teach", "wisdom", "grow"],
  generosity: ["generous", "give", "charity", "tzedakah", "donate", "share"],
  technology: ["technology", "ai", "digital", "internet", "algorithm", "tech"],
};

export function tokenize(input: string): string[] {
  const normalized = normalize(input);
  if (!normalized) return [];
  return normalized.split(" ").filter((t) => t.length > 1);
}

function scoreTeaching(
  tokens: string[],
  haystack: string,
  teaching: Teaching,
): MatchResult {
  const matchedKeywords = new Set<string>();
  let score = 0;

  for (const keyword of teaching.keywords) {
    const key = normalize(keyword);
    if (!key) continue;

    if (key.includes(" ")) {
      if (haystack.includes(key)) {
        score += 4;
        matchedKeywords.add(keyword);
      }
    } else if (tokens.includes(key) || haystack.includes(` ${key} `)) {
      score += 3;
      matchedKeywords.add(keyword);
    }
  }

  for (const hint of THEME_HINTS[teaching.theme]) {
    if (tokens.includes(hint) || haystack.includes(` ${hint} `)) {
      score += 2;
    }
  }

  // Light boost for theme label words appearing in the query
  const labelTokens = tokenize(teaching.themeLabel);
  for (const labelToken of labelTokens) {
    if (tokens.includes(labelToken)) score += 1;
  }

  return {
    teaching,
    score,
    matchedKeywords: [...matchedKeywords],
  };
}

export function matchTeachings(input: string): MatchResult[] {
  const tokens = tokenize(input);
  const haystack = ` ${normalize(input)} `;

  return TEACHINGS.map((teaching) => scoreTeaching(tokens, haystack, teaching))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.teaching.id.localeCompare(b.teaching.id));
}

export function selectTeaching(input: string): MatchResult | null {
  const ranked = matchTeachings(input);
  if (ranked.length === 0) return null;
  return ranked[0];
}

/** Deterministic fallback when nothing matches well. */
export function fallbackTeaching(): Teaching {
  const teaching = TEACHINGS.find((t) => t.id === "uncertainty-trust");
  if (!teaching) return TEACHINGS[0];
  return teaching;
}
