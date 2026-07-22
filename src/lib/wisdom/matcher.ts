import { TEACHINGS } from "./teachings";
import { isPublishableTeaching } from "./publishable";
import { isSourceComplete } from "./source-panel";
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
  forgiveness: ["forgive", "forgiveness", "pardon", "mercy"],
  anger: ["anger", "angry", "wrath", "furious", "rage"],
  humility: ["humble", "humility", "ego", "pride"],
  hospitality: ["hospitality", "guest", "welcome", "stranger", "sojourner"],
  family: ["family", "parent", "child", "sibling", "household"],
  work: ["work", "job", "labor", "wage", "hire"],
  hope: ["hope", "hopeful", "despair", "future"],
  truth: ["truth", "honest", "lie", "false"],
  joy: ["joy", "rejoice", "glad", "happy", "delight"],
  stewardship: ["earth", "land", "environment", "animal", "creation"],
};

/** Specific concepts outweigh generic emotion words. */
const HIGH_WEIGHT_CONCEPTS: Array<{
  phrases: string[];
  themes: Theme[];
  weight: number;
}> = [
  { phrases: ["injustice", "unjust", "unfair treatment"], themes: ["justice"], weight: 10 },
  { phrases: ["gossip", "rumor", "lashon hara", "speak ill"], themes: ["speech"], weight: 10 },
  { phrases: ["apology", "apologize", "make amends", "teshuvah"], themes: ["repair"], weight: 10 },
  { phrases: ["exploitation", "exploit", "oppress", "oppression"], themes: ["justice", "work"], weight: 10 },
  { phrases: ["grief", "grieving", "mourning", "bereaved", "lost someone"], themes: ["hope", "community"], weight: 9 },
  { phrases: ["hopeless", "despair", "no hope"], themes: ["hope"], weight: 10 },
  { phrases: ["abuse", "abused", "abusive"], themes: ["courage", "justice"], weight: 8 },
  { phrases: ["speak up", "speaking up", "stand up", "stand for"], themes: ["courage", "justice"], weight: 9 },
  { phrases: ["burnout", "exhausted", "overworked"], themes: ["rest"], weight: 8 },
  { phrases: ["forgive", "forgiveness", "can't forgive"], themes: ["forgiveness", "repair"], weight: 9 },
  { phrases: ["gossip about", "talking behind"], themes: ["speech"], weight: 10 },
  { phrases: ["wage", "underpaid", "worker"], themes: ["work", "justice"], weight: 8 },
  { phrases: ["lonely", "isolation", "belong"], themes: ["community"], weight: 7 },
];

/** Generic emotion words — lower weight so concepts win. */
const LOW_WEIGHT_EMOTIONS = new Set([
  "afraid",
  "fear",
  "worried",
  "worry",
  "uncertain",
  "unsure",
  "anxious",
  "nervous",
  "scared",
  "confused",
  "sad",
  "upset",
]);

function publishableLibrary(): Teaching[] {
  return TEACHINGS.filter(isPublishableTeaching);
}

function completenessBoost(teaching: Teaching): number {
  return isSourceComplete(teaching) ? 4 : -8;
}

export function tokenize(input: string): string[] {
  const normalized = normalize(input);
  if (!normalized) return [];
  return normalized.split(" ").filter((t) => t.length > 1);
}

function conceptBoost(
  haystack: string,
  teaching: Teaching,
): number {
  let boost = 0;
  for (const concept of HIGH_WEIGHT_CONCEPTS) {
    const hit = concept.phrases.some((p) => haystack.includes(normalize(p)));
    if (!hit) continue;
    if (concept.themes.includes(teaching.theme)) {
      boost += concept.weight;
    }
  }
  return boost;
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
      const weight = LOW_WEIGHT_EMOTIONS.has(key) ? 1.5 : 3;
      score += weight;
      matchedKeywords.add(keyword);
    }
  }

  for (const hint of THEME_HINTS[teaching.theme]) {
    if (tokens.includes(hint) || haystack.includes(` ${hint} `)) {
      score += LOW_WEIGHT_EMOTIONS.has(hint) ? 1 : 2;
    }
  }

  const labelTokens = tokenize(teaching.themeLabel);
  for (const labelToken of labelTokens) {
    if (tokens.includes(labelToken)) score += 1;
  }

  score += conceptBoost(haystack, teaching);
  score += completenessBoost(teaching);

  return {
    teaching,
    score,
    matchedKeywords: [...matchedKeywords],
  };
}

export function matchTeachings(input: string): MatchResult[] {
  const tokens = tokenize(input);
  const haystack = ` ${normalize(input)} `;

  return publishableLibrary()
    .map((teaching) => scoreTeaching(tokens, haystack, teaching))
    .filter((result) => result.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.teaching.id.localeCompare(b.teaching.id),
    );
}

export function selectTeaching(input: string): MatchResult | null {
  const ranked = matchTeachings(input);
  if (ranked.length === 0) return null;

  // Prefer a complete original-language entry when scores are close
  const best = ranked[0];
  if (isSourceComplete(best.teaching)) return best;

  const completeAlt = ranked.find(
    (m) =>
      isSourceComplete(m.teaching) &&
      (m.teaching.theme === best.teaching.theme ||
        m.score >= best.score - 2),
  );
  return completeAlt ?? best;
}

/** Primary + secondary themes from ranked matches (different themes). */
export function selectThemePair(input: string): {
  primary?: Theme;
  secondary?: Theme;
} {
  const ranked = matchTeachings(input);
  if (!ranked.length) return {};
  const primary = ranked[0].teaching.theme;
  const secondaryMatch = ranked.find((m) => m.teaching.theme !== primary);
  return {
    primary,
    secondary: secondaryMatch?.teaching.theme,
  };
}

/**
 * Alternate lenses prefer a genuinely different theme, not a minor variation.
 */
export function alternateLensIds(
  input: string,
  primaryId: string,
  primaryTheme: Theme,
  limit = 3,
): string[] {
  const ranked = matchTeachings(input).filter(
    (m) => m.teaching.id !== primaryId && m.score >= 3,
  );

  const differentTheme: string[] = [];
  const sameTheme: string[] = [];
  const seenThemes = new Set<Theme>([primaryTheme]);

  for (const m of ranked) {
    if (m.teaching.theme !== primaryTheme && !seenThemes.has(m.teaching.theme)) {
      differentTheme.push(m.teaching.id);
      seenThemes.add(m.teaching.theme);
    } else if (m.teaching.theme === primaryTheme) {
      sameTheme.push(m.teaching.id);
    }
    if (differentTheme.length >= limit) break;
  }

  const ids = [...differentTheme];
  for (const id of sameTheme) {
    if (ids.length >= limit) break;
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** Deterministic fallback when nothing matches well. */
export function fallbackTeaching(): Teaching {
  const library = publishableLibrary();
  const complete = library.filter(isSourceComplete);
  const teaching =
    complete.find((t) => t.id === "uncertainty-trust") ??
    complete[0] ??
    library.find((t) => t.id === "uncertainty-trust");
  if (!teaching) return library[0] ?? TEACHINGS[0];
  return teaching;
}
