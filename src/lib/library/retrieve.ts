import { expandQueryConcepts, normalize, tokenize } from "./concepts";
import type { ConceptExpansion } from "./concepts";
import { CONCEPT_SEEDS } from "./concept-seeds";
import { getAllSourceRecords, getSourceByRef } from "./loader";
import { synonymsFor } from "./topics";
import type {
  PassageKind,
  SourceCategory,
  SourceRecord,
  TopicRelationship,
} from "./types";

export type RetrievalHit = {
  record: SourceRecord;
  score: number;
  reasons: string[];
};

const MIN_SCORE = 4;
const DEFAULT_LIMIT = 24;
const MAX_PER_BOOK = 2;

const PHILOSOPHICAL_CATEGORIES = new Set<SourceCategory>([
  "writings",
  "ethics",
  "philosophy",
  "mishnah",
]);
const WISDOM_BOOKS = new Set([
  "Proverbs",
  "Psalms",
  "Ecclesiastes",
  "Job",
  "Pirkei Avot",
  "Mesillat Yesharim",
]);
const NARRATIVE_CATEGORIES = new Set<SourceCategory>(["torah", "prophets"]);
const GENESIS_CREATION_REF = /^genesis\s+[12]:/;

const ANGER_TEXT_MARKERS = [
  "anger",
  "angry",
  "wrath",
  "wroth",
  "fury",
  "furious",
  "enraged",
  "kindled against",
];
const VIOLENCE_TEXT_MARKERS = [
  "slew",
  "slay",
  "slain",
  "murder",
  "smote",
  "struck down",
  "stoned",
  "put to the sword",
];

const QUERY_STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "is",
  "are",
  "was",
  "were",
  "be",
  "am",
  "i",
  "my",
  "me",
  "we",
  "our",
  "you",
  "your",
  "what",
  "how",
  "why",
  "when",
  "where",
  "do",
  "does",
  "did",
  "can",
  "could",
  "should",
  "would",
  "about",
  "with",
  "from",
  "this",
  "that",
  "it",
  "as",
  "at",
  "by",
  "any",
  "some",
  "teach",
  "teaching",
  "wisdom",
  "jewish",
  "help",
  "please",
  "look",
  "like",
]);

/**
 * Scoring formula (documented for developers):
 *
 *   score =
 *     BM25-ish token overlap
 *   + exact phrase boosts
 *   + authoritative topic / curated keyword concept matches (high)
 *   + lexical-inferred topic matches (low)
 *   + intent × source-family fit
 *   + passage-kind fit (prescriptive preferred for advice queries)
 *   − narrative anger/violence / generic "life" penalties
 *   + editorial book boosts for wisdom literature
 *
 * Reasons are attached for DEV inspection only — never shown in production UI.
 */
function authoritativeTopics(record: SourceRecord): TopicRelationship[] {
  return (record.topicRelationships ?? []).filter(
    (r) =>
      r.source === "sefaria-topic-link" ||
      r.source === "sefaria-related" ||
      r.source === "curated",
  );
}

function lexicalTopics(record: SourceRecord): TopicRelationship[] {
  return (record.topicRelationships ?? []).filter(
    (r) => r.source === "lexical-inference",
  );
}

function buildHaystack(record: SourceRecord): string {
  const auth = authoritativeTopics(record).map((r) => r.topic);
  const parts = [
    record.englishText ?? "",
    record.canonicalRef,
    record.sourceTitle,
    ...(record.keywords ?? []),
    ...auth,
  ];
  return ` ${normalize(parts.join(" "))} `;
}

function hasTextMarker(haystack: string, markers: string[]): boolean {
  return markers.some((marker) => {
    const normalized = normalize(marker);
    return normalized.includes(" ")
      ? haystack.includes(normalized)
      : haystack.includes(` ${normalized} `);
  });
}

function passageKindOf(record: SourceRecord): PassageKind {
  return record.passageKind ?? "unknown";
}

function conceptOnRecord(
  concept: string,
  record: SourceRecord,
  haystack: string,
): { matched: boolean; weight: number; via: string } {
  const key = normalize(concept).replace(/\s+/g, "-");
  const auth = authoritativeTopics(record);
  const authHit = auth.find((r) => r.topic === key || normalize(r.topic) === normalize(concept));
  if (authHit) {
    return { matched: true, weight: 10 * authHit.confidence, via: `auth:${authHit.source}` };
  }
  if ((record.keywords ?? []).map(normalize).includes(normalize(concept))) {
    return { matched: true, weight: 8, via: "keyword" };
  }
  if ((record.topics ?? []).map(normalize).includes(normalize(concept))) {
    // topics may include title-metadata; still useful but weaker than curated
    return { matched: true, weight: 5, via: "topic-list" };
  }
  const lex = lexicalTopics(record).find(
    (r) => r.topic === key || normalize(r.topic) === normalize(concept),
  );
  if (lex) {
    return { matched: true, weight: 2 * lex.confidence, via: "lexical-topic" };
  }
  // Multiword synonym in English text only (not single ambiguous tokens).
  for (const syn of synonymsFor(concept)) {
    const n = normalize(syn);
    if (!n.includes(" ")) continue;
    if (haystack.includes(` ${n} `) || haystack.includes(n)) {
      return { matched: true, weight: 3, via: `phrase:${n}` };
    }
  }
  return { matched: false, weight: 0, via: "" };
}

export function scoreRecord(
  query: string,
  record: SourceRecord,
  concepts: ConceptExpansion,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const tokens = tokenize(query).filter(
    (t) => t.length >= 3 && !QUERY_STOPWORDS.has(t),
  );
  const haystack = buildHaystack(record);
  const english = ` ${normalize(record.englishText ?? "")} `;

  // BM25-ish lexical: rarer query tokens in English get more weight.
  const seen = new Set<string>();
  for (const token of tokens) {
    if (seen.has(token)) continue;
    seen.add(token);
    if (english.includes(` ${token} `)) {
      const weight = token.length >= 6 ? 2.2 : 1.4;
      score += weight;
      reasons.push(`bm25:${token}`);
    }
  }

  // Exact multiword query phrases (3+ words) in English.
  const qNorm = normalize(query);
  const qWords = qNorm.split(" ").filter((w) => w.length > 2);
  if (qWords.length >= 3) {
    for (let i = 0; i < qWords.length - 2; i++) {
      const phrase = `${qWords[i]} ${qWords[i + 1]} ${qWords[i + 2]}`;
      if (english.includes(phrase)) {
        score += 4;
        reasons.push(`exact-phrase:${phrase}`);
      }
    }
  }

  for (const concept of concepts.primary) {
    const hit = conceptOnRecord(concept, record, haystack);
    if (hit.matched) {
      score += hit.weight;
      reasons.push(`primary-concept:${concept}:${hit.via}`);
    }
  }
  for (const concept of concepts.secondary) {
    const hit = conceptOnRecord(concept, record, haystack);
    if (hit.matched) {
      score += hit.weight * 0.45;
      reasons.push(`secondary-concept:${concept}:${hit.via}`);
    }
  }

  const adviceSeeking =
    concepts.intents.includes("everyday") ||
    concepts.intents.includes("ethical") ||
    concepts.intents.includes("relationship") ||
    concepts.intents.includes("leadership") ||
    concepts.intents.includes("emotional") ||
    concepts.intents.includes("pastoral") ||
    concepts.intents.includes("philosophical");

  if (concepts.intents.includes("philosophical")) {
    if (PHILOSOPHICAL_CATEGORIES.has(record.sourceCategory)) {
      score += 5;
      reasons.push(`family-fit:philosophical:${record.sourceCategory}`);
    }
    if (WISDOM_BOOKS.has(record.sourceTitle)) {
      score += 6;
      reasons.push(`book-fit:wisdom:${record.sourceTitle}`);
    }
    if (
      record.sourceTitle === "Genesis" &&
      GENESIS_CREATION_REF.test(normalize(record.canonicalRef))
    ) {
      score += 5;
      reasons.push("book-fit:genesis-creation");
    }
    // Court / capital-procedure contexts are a poor primary lens for meaning-of-life.
    if (
      /capital cases|put to death|stoning|death penalty|witnesses in capital/i.test(
        record.englishText ?? "",
      )
    ) {
      score -= 18;
      reasons.push("penalty:capital-procedure-context");
    }
    // Generic incidental “life” without purpose/wisdom metadata.
    if (
      /\blife\b/i.test(record.englishText ?? "") &&
      !authoritativeTopics(record).some((r) =>
        ["purpose", "wisdom", "mortality", "creation", "responsibility", "purpose-of-life"].includes(
          r.topic,
        ),
      )
    ) {
      score -= 8;
      reasons.push("penalty:incidental-life");
    }
    // Prefer classic purpose conclusions over creation narrative alone.
    if (
      concepts.primary.includes("purpose") &&
      !concepts.primary.includes("learning") &&
      concepts.primary[0] !== "wisdom"
    ) {
      if (/ecclesiastes\s+12:13/i.test(record.canonicalRef) || /whole duty of man|end of the matter/i.test(record.englishText ?? "")) {
        score += 18;
        reasons.push("boost:classic-purpose-text");
      }
    }
    if (/mesillat yesharim\s+1:/i.test(record.canonicalRef) && concepts.primary.includes("purpose")) {
      score += 12;
      reasons.push("boost:mussar-purpose");
    }
    if (/pirkei avot\s+2:16|pirkei avot\s+4:22|pirkei avot\s+6:11/i.test(record.canonicalRef) && concepts.primary.includes("purpose")) {
      score += 10;
      reasons.push("boost:avot-purpose");
    }
    // Creation texts are valid but should not always outrank wisdom conclusions.
    if (/^genesis\s+1:/i.test(record.canonicalRef)) {
      score += 4;
      reasons.push("boost:creation-text");
    }
  }

  if (concepts.primary.includes("grief") || concepts.intents.includes("pastoral")) {
    if (
      /except for his kin|for his sister a virgin|anointed priest|capital cases|stoning|put to death|shall be put to death|witnesses in capital/i.test(
        record.englishText ?? "",
      ) ||
      (/^leviticus\s+21:/i.test(record.canonicalRef) &&
        !/comfort|consol/i.test(record.englishText ?? ""))
    ) {
      score -= 20;
      reasons.push("penalty:legal-mourning-or-death-procedure");
    }
    if (
      record.sourceTitle === "Psalms" ||
      record.sourceTitle === "Lamentations" ||
      record.sourceTitle === "Isaiah" ||
      record.sourceTitle === "Job"
    ) {
      score += 8;
      reasons.push("boost:pastoral-literature");
    }
    if (
      /comfort|valley of the shadow|weeping may|healeth the broken|consol|mourners of zion/i.test(
        record.englishText ?? "",
      )
    ) {
      score += 12;
      reasons.push("boost:comfort-language");
    }
    // Bare mortality without pastoral comfort should not dominate grief queries.
    if (
      concepts.primary.includes("grief") &&
      /dust return|spirit shall return|time to die|all go unto one place/i.test(
        record.englishText ?? "",
      ) &&
      !/comfort|weep|consol|shadow of death|healeth/i.test(record.englishText ?? "")
    ) {
      score -= 10;
      reasons.push("penalty:bare-mortality-for-grief");
    }
  }

  // Preferred families / books from concept seeds.
  for (const seed of CONCEPT_SEEDS) {
    if (!concepts.primary.includes(seed.concept)) continue;
    if (seed.preferredFamilies?.includes(record.sourceCategory as never)) {
      score += 4;
      reasons.push(`family-pref:${seed.concept}:${record.sourceCategory}`);
    }
    if (seed.preferredBooks?.includes(record.sourceTitle)) {
      score += 3;
      reasons.push(`book-pref:${seed.concept}:${record.sourceTitle}`);
    }
  }

  // Technology / attention advice should prefer mussar & wisdom over Torah narrative choice texts.
  if (
    concepts.primary.includes("attention") ||
    concepts.secondary.includes("technology") ||
    concepts.primary.includes("technology")
  ) {
    if (["ethics", "mishnah", "writings"].includes(record.sourceCategory)) {
      score += 6;
      reasons.push("boost:tech-family-fit");
    }
    if (record.sourceCategory === "torah" && !/speech|tongue|mouth|silence/i.test(record.englishText ?? "")) {
      score -= 8;
      reasons.push("deboost:tech-torah-mismatch");
    }
  }

  if (concepts.primary.includes("gratitude")) {
    if (/o give thanks|give thanks unto|bless the lord|thanksgiving/i.test(record.englishText ?? "")) {
      score += 10;
      reasons.push("boost:thanksgiving-language");
    }
    if (/abhor an edomite|put to death|stoning/i.test(record.englishText ?? "")) {
      score -= 12;
      reasons.push("penalty:unrelated-legal");
    }
  }

  if (
    concepts.primary.includes("rest") ||
    concepts.primary.includes("sabbath") ||
    concepts.primary.includes("renewal")
  ) {
    if (/sabbath|seventh day|day of rest|cease from thy labour|call the sabbath/i.test(record.englishText ?? "")) {
      score += 14;
      reasons.push("boost:sabbath-language");
    }
    if (/wait upon the lord|mount up with wings|renew a right spirit|restoreth my soul/i.test(record.englishText ?? "")) {
      score += 12;
      reasons.push("boost:renewal-language");
    }
    // Grief/lament psalms should not dominate rest/renewal questions.
    if (
      !/sabbath|rest|renew|restoreth|wings as eagles/i.test(record.englishText ?? "") &&
      (/weeping|mourning|grief|lament/i.test(record.englishText ?? "") ||
        (record.topics ?? []).some((t) => /grief|mourning/.test(t)))
    ) {
      score -= 12;
      reasons.push("penalty:grief-without-rest");
    }
  }

  if (concepts.primary.includes("justice") || concepts.primary.includes("courage")) {
    if (
      /justice justice|do justly|love mercy|walk humbly|judge righteously|be strong and of a good courage|fear not|be not dismayed/i.test(
        record.englishText ?? "",
      )
    ) {
      score += 10;
      reasons.push("boost:justice-courage-language");
    }
    if (/micah\s+6:8/i.test(record.canonicalRef) || /deuteronomy\s+16:20/i.test(record.canonicalRef)) {
      score += 10;
      reasons.push("boost:classic-justice-ref");
    }
    if (/joshua\s+1:9/i.test(record.canonicalRef) || /deuteronomy\s+31:6/i.test(record.canonicalRef)) {
      score += 8;
      reasons.push("boost:classic-courage-ref");
    }
  }

  if (concepts.primary.includes("relationships") || concepts.primary.includes("repair")) {
    if (/love thy neighbour|love your neighbor|two are better|faithful are the wounds/i.test(record.englishText ?? "")) {
      score += 8;
      reasons.push("boost:relationship-language");
    }
  }

  const kind = passageKindOf(record);
  if (adviceSeeking) {
    if (kind === "prescriptive") {
      score += 4;
      reasons.push("passage-kind:prescriptive");
    } else if (kind === "narrative" && NARRATIVE_CATEGORIES.has(record.sourceCategory)) {
      score -= 6;
      reasons.push("passage-kind:narrative-deboost");
    }
  }

  const angerRelevant = !concepts.excludedDominant.includes("anger");
  const violenceRelevant = !concepts.excludedDominant.includes("violence");
  if (
    NARRATIVE_CATEGORIES.has(record.sourceCategory) &&
    hasTextMarker(haystack, ANGER_TEXT_MARKERS) &&
    !angerRelevant
  ) {
    score -= 14;
    reasons.push("deboost:narrative-anger");
  }
  if (
    NARRATIVE_CATEGORIES.has(record.sourceCategory) &&
    hasTextMarker(haystack, VIOLENCE_TEXT_MARKERS) &&
    !violenceRelevant
  ) {
    score -= 14;
    reasons.push("deboost:narrative-violence");
  }

  // Diversity / quality: prefer records with original + licensed English.
  if (record.originalText?.trim()) score += 1;
  if (record.englishText?.trim()) score += 1;

  return { score, reasons };
}

export function diversifyByBook(hits: RetrievalHit[], limit: number): RetrievalHit[] {
  const selected: RetrievalHit[] = [];
  const perBook = new Map<string, number>();

  for (const hit of hits) {
    if (selected.length >= limit) break;
    const count = perBook.get(hit.record.sourceTitle) ?? 0;
    if (count >= MAX_PER_BOOK) continue;
    selected.push(hit);
    perBook.set(hit.record.sourceTitle, count + 1);
  }

  if (selected.length < Math.min(limit, hits.length)) {
    const selectedIds = new Set(selected.map((h) => h.record.id));
    for (const hit of hits) {
      if (selected.length >= limit) break;
      if (selectedIds.has(hit.record.id)) continue;
      selected.push(hit);
      selectedIds.add(hit.record.id);
    }
  }

  return selected;
}

/** Resolve explicit “Book chapter:verse” mentions to local records. */
function resolveDirectRefs(query: string): RetrievalHit[] {
  const hits: RetrievalHit[] = [];
  const normalizedQuery = query.replace(/[–—]/g, "-");
  const pattern =
    /\b((?:I{1,3}|1|2|First|Second)?\s*)?(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Samuel|Kings|Isaiah|Jeremiah|Ezekiel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Psalms?|Psalm|Proverbs|Job|Ruth|Lamentations|Ecclesiastes|Esther|Daniel|Ezra|Nehemiah|Chronicles|Pirkei Avot|Mishnah [A-Za-z]+)\s+(\d+)(?:\s*[-:]\s*(\d+))?/gi;
  let match: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((match = pattern.exec(normalizedQuery)) !== null) {
    const bookRaw = `${(match[1] || "").trim()} ${match[2]}`.replace(/\s+/g, " ").trim();
    const book = bookRaw
      .replace(/^1\s/i, "I ")
      .replace(/^2\s/i, "II ")
      .replace(/^First\s/i, "I ")
      .replace(/^Second\s/i, "II ")
      .replace(/^Psalms?$/i, "Psalms")
      .replace(/^Psalm$/i, "Psalms");
    const chapter = match[3];
    const verse = match[4];
    // For "Deuteronomy 6:4-9" verse group is 4; for "Deuteronomy 6" alone, no verse.
    // Pattern uses [-:] so "6-9" without colon would treat 9 as verse — prefer colon form.
    const colonForm = /:\s*\d+/.test(match[0]);
    const candidates =
      verse && colonForm
        ? [`${book} ${chapter}:${verse}`]
        : [`${book} ${chapter}:1`];
    for (const ref of candidates) {
      const record = getSourceByRef(ref);
      if (!record || seen.has(record.id)) continue;
      seen.add(record.id);
      hits.push({
        record,
        score: 100,
        reasons: [`direct-ref:${record.canonicalRef}`],
      });
    }
  }
  return hits;
}

/** Prefer known-good teaching refs for matched primary concepts. */
function injectSeedCandidates(
  concepts: ConceptExpansion,
  exclude: Set<string>,
): RetrievalHit[] {
  const hits: RetrievalHit[] = [];
  const primary = concepts.primary;
  if (!primary.length) return hits;

  for (const [conceptIndex, concept] of primary.entries()) {
    const seed = CONCEPT_SEEDS.find((s) => s.concept === concept);
    if (!seed?.knownRefs?.length) continue;
    // Earlier primary concepts and earlier seed refs get larger bonuses.
    const conceptBonus = 22 - conceptIndex * 3;
    for (const [refIndex, ref] of seed.knownRefs.entries()) {
      const record = getSourceByRef(ref);
      if (!record || exclude.has(record.id)) continue;
      const topics = record.topics.includes(seed.concept)
        ? record.topics
        : [seed.concept, ...record.topics];
      const keywords = record.keywords.includes(seed.concept)
        ? record.keywords
        : [seed.concept, ...record.keywords];
      const enriched = { ...record, topics, keywords };
      hits.push({
        record: enriched,
        // Placeholder bonus; retrieveSources adds this on top of scoreRecord.
        score: conceptBonus - refIndex * 0.6,
        reasons: [`seed-inject:${seed.concept}:${record.canonicalRef}`],
      });
    }
  }
  return hits;
}

function mergeConceptTags(
  base: SourceRecord,
  overlay: SourceRecord | undefined,
): SourceRecord {
  if (!overlay) return base;
  return {
    ...base,
    topics: [...new Set([...(overlay.topics ?? []), ...(base.topics ?? [])])],
    keywords: [
      ...new Set([...(overlay.keywords ?? []), ...(base.keywords ?? [])]),
    ],
  };
}

export function retrieveSources(
  query: string,
  options?: { limit?: number; excludeIds?: string[] },
): RetrievalHit[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const concepts = expandQueryConcepts(trimmed);
  const exclude = new Set(options?.excludeIds ?? []);
  const direct = resolveDirectRefs(trimmed).filter((h) => !exclude.has(h.record.id));
  const seeded = injectSeedCandidates(concepts, exclude);
  const seedBonusById = new Map<
    string,
    { bonus: number; record: SourceRecord; reasons: string[] }
  >();
  for (const hit of seeded) {
    const prev = seedBonusById.get(hit.record.id);
    if (!prev || hit.score > prev.bonus) {
      seedBonusById.set(hit.record.id, {
        bonus: hit.score,
        record: hit.record,
        reasons: hit.reasons,
      });
    } else {
      seedBonusById.set(hit.record.id, {
        ...prev,
        record: mergeConceptTags(prev.record, hit.record),
        reasons: [...prev.reasons, ...hit.reasons],
      });
    }
  }

  const byId = new Map<string, RetrievalHit>();
  for (const hit of direct) byId.set(hit.record.id, hit);

  for (const record of getAllSourceRecords()) {
    if (exclude.has(record.id)) continue;
    const seed = seedBonusById.get(record.id);
    const { score, reasons } = scoreRecord(trimmed, record, concepts);
    const merged = mergeConceptTags(record, seed?.record);
    const finalScore = score + (seed?.bonus ?? 0);
    if (!seed && finalScore < MIN_SCORE) continue;
    const existing = byId.get(record.id);
    if (existing && existing.score >= finalScore) {
      byId.set(record.id, {
        ...existing,
        record: mergeConceptTags(existing.record, merged),
      });
      continue;
    }
    byId.set(record.id, {
      record: merged,
      score: finalScore,
      reasons: [...(seed?.reasons ?? []), ...reasons],
    });
  }

  for (const [id, seed] of seedBonusById) {
    if (byId.has(id) || exclude.has(id)) continue;
    const { score, reasons } = scoreRecord(trimmed, seed.record, concepts);
    byId.set(id, {
      record: seed.record,
      score: score + seed.bonus,
      reasons: [...seed.reasons, ...reasons],
    });
  }

  const hits = [...byId.values()];
  hits.sort(
    (a, b) =>
      b.score - a.score || a.record.canonicalRef.localeCompare(b.record.canonicalRef),
  );

  return diversifyByBook(hits, options?.limit ?? DEFAULT_LIMIT);
}
