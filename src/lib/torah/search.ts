import { getAllTorahVerses, getTorahManifest } from "./loader";
import { QUERY_SYNONYMS, THEME_TORAH_HINTS } from "./synonyms";
import type { TorahSearchHit, TorahVerse } from "./types";

const MIN_SCORE = 6;
const MAX_RESULTS = 3;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s:'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length > 1);
}

function expandQuery(input: string, theme?: string): {
  tokens: string[];
  phrases: string[];
  whyHints: string[];
} {
  const tokens = new Set(tokenize(input));
  const phrases: string[] = [];
  const whyHints: string[] = [];

  for (const [key, syns] of Object.entries(QUERY_SYNONYMS)) {
    if (normalize(input).includes(key) || tokens.has(key)) {
      for (const syn of syns) {
        if (syn.includes(" ")) phrases.push(syn);
        else tokens.add(syn);
        whyHints.push(syn);
      }
    }
  }

  if (theme && THEME_TORAH_HINTS[theme]) {
    for (const hint of THEME_TORAH_HINTS[theme]) {
      if (hint.includes(" ")) phrases.push(hint);
      else tokens.add(hint);
      whyHints.push(hint);
    }
  }

  return { tokens: [...tokens], phrases, whyHints };
}

function scoreVerse(
  verse: TorahVerse,
  tokens: string[],
  phrases: string[],
  exactRef?: string,
): { score: number; matched: string[] } {
  const hay = ` ${verse.searchText} `;
  const matched: string[] = [];
  let score = 0;

  if (exactRef && normalize(verse.ref) === normalize(exactRef)) {
    return { score: 1000, matched: [verse.ref] };
  }

  for (const phrase of phrases) {
    if (hay.includes(` ${normalize(phrase)} `) || hay.includes(normalize(phrase))) {
      score += 6;
      matched.push(phrase);
    }
  }

  for (const token of tokens) {
    if (token.length < 3) continue;
    if (hay.includes(` ${token} `)) {
      score += 2;
      matched.push(token);
    }
  }

  // Slight boost for famous ethical chapters (not exclusive)
  if (
    (verse.book === "Leviticus" && verse.chapter === 19) ||
    (verse.book === "Deuteronomy" && (verse.chapter === 6 || verse.chapter === 16)) ||
    (verse.book === "Exodus" && verse.chapter === 20)
  ) {
    score += 1;
  }

  return { score, matched: [...new Set(matched)] };
}

function whyRelevant(matched: string[], theme?: string): string {
  if (theme && matched.length) {
    return `A companion passage linking ${theme} with ${matched[0]}.`;
  }
  if (theme) {
    return `A companion passage for sitting with ${theme}.`;
  }
  if (matched.length) {
    return `A companion passage touching on ${matched[0]}.`;
  }
  return "A companion passage for further study.";
}

function diversify(hits: Array<TorahSearchHit & { chapterKey: string }>): TorahSearchHit[] {
  const selected: Array<TorahSearchHit & { chapterKey: string }> = [];
  const chapters = new Set<string>();
  const books = new Set<string>();

  for (const hit of hits) {
    if (selected.length >= MAX_RESULTS) break;
    const chapterHeavy = chapters.has(hit.chapterKey) && selected.length > 0;
    const bookHeavy = books.has(hit.book) && selected.filter((s) => s.book === hit.book).length >= 2;
    if (chapterHeavy || bookHeavy) continue;
    selected.push(hit);
    chapters.add(hit.chapterKey);
    books.add(hit.book);
  }

  if (selected.length < MAX_RESULTS) {
    for (const hit of hits) {
      if (selected.length >= MAX_RESULTS) break;
      if (selected.some((s) => s.id === hit.id)) continue;
      selected.push(hit);
    }
  }

  return selected.map(({ chapterKey: _chapterKey, ...rest }) => {
    void _chapterKey;
    return rest;
  });
}

const REF_PATTERN =
  /\b(genesis|exodus|leviticus|numbers|deuteronomy)\s+(\d{1,3}):(\d{1,3})\b/i;

export function lookupExactRef(input: string): TorahSearchHit | null {
  const match = normalize(input).match(REF_PATTERN);
  if (!match) return null;
  const book = match[1][0].toUpperCase() + match[1].slice(1);
  const ref = `${book} ${Number(match[2])}:${Number(match[3])}`;
  const verse = getAllTorahVerses().find((v) => v.ref === ref);
  if (!verse) return null;
  const manifest = getTorahManifest();
  return {
    id: verse.id,
    ref: verse.ref,
    book: verse.book,
    chapter: verse.chapter,
    verse: verse.verse,
    hebrew: verse.hebrew,
    english: verse.english,
    sefariaUrl: verse.sefariaUrl,
    score: 1000,
    whyRelevant: "Exact reference lookup.",
    englishVersionTitle: manifest.englishVersionTitle,
    englishLicense: manifest.englishLicense,
    hebrewVersionTitle: verse.hebrewVersionTitle,
    hebrewLicense: verse.hebrewLicense,
  };
}

export function searchTorah(
  input: string,
  options?: { theme?: string; excludeIds?: string[] },
): TorahSearchHit[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const exact = lookupExactRef(trimmed);
  if (exact) return [exact];

  const { tokens, phrases, whyHints } = expandQuery(trimmed, options?.theme);
  if (tokens.length === 0 && phrases.length === 0) return [];

  const exclude = new Set(options?.excludeIds ?? []);
  const ranked: Array<TorahSearchHit & { chapterKey: string }> = [];
  const manifest = getTorahManifest();

  for (const verse of getAllTorahVerses()) {
    if (exclude.has(verse.id)) continue;
    const { score, matched } = scoreVerse(verse, tokens, phrases);
    if (score < MIN_SCORE) continue;
    ranked.push({
      id: verse.id,
      ref: verse.ref,
      book: verse.book,
      chapter: verse.chapter,
      verse: verse.verse,
      hebrew: verse.hebrew,
      english: verse.english,
      sefariaUrl: verse.sefariaUrl,
      score,
      whyRelevant: whyRelevant(matched.length ? matched : whyHints, options?.theme),
      englishVersionTitle: manifest.englishVersionTitle,
      englishLicense: manifest.englishLicense,
      hebrewVersionTitle: verse.hebrewVersionTitle,
      hebrewLicense: verse.hebrewLicense,
      chapterKey: `${verse.book}-${verse.chapter}`,
    });
  }

  ranked.sort((a, b) => b.score - a.score || a.ref.localeCompare(b.ref));
  return diversify(ranked);
}
