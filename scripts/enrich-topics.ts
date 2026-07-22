/**
 * Enrich library shards with provenance-aware topic relationships.
 *
 * Priority:
 *  1. Sefaria topic→ref links (authoritative)
 *  2. Curated teaching-signal / known-ref seeds
 *  3. Title metadata (book slug only)
 *  4. Restricted lexical inference (low confidence; never claimed as verified)
 *
 * Usage: npm run enrich:topics
 */
import fs from "node:fs";
import path from "node:path";
import {
  CONCEPT_SEEDS,
  SEFARIA_TOPIC_CONCEPT_MAP,
} from "../src/lib/library/concept-seeds";
import { TOPIC_SYNONYMS } from "../src/lib/library/topics";
import { normalize } from "../src/lib/library/concepts";
import type {
  PassageKind,
  SourceRecord,
  TopicRelationship,
  TopicRelationshipSource,
} from "../src/lib/library/types";

const ROOT = path.resolve(__dirname, "..");
const LIBRARY = path.join(ROOT, "data", "library");
const SHARDS = path.join(LIBRARY, "shards");
const USER_AGENT = "TorokTopicEnricher/2.0";

const AMBIGUOUS_SINGLE_WORDS = new Set([
  "life",
  "way",
  "good",
  "man",
  "men",
  "heart",
  "toward",
  "towards",
  "day",
  "days",
  "lord",
  "god",
  "said",
  "unto",
  "shall",
  "thee",
  "thou",
  "thy",
  "come",
  "came",
  "went",
  "made",
  "make",
  "one",
  "all",
  "also",
  "even",
  "upon",
  "from",
  "with",
  "that",
  "this",
  "they",
  "them",
  "their",
  "when",
  "then",
  "into",
  "over",
  "under",
  "after",
  "before",
  "great",
  "many",
  "every",
  "people",
  "house",
  "land",
  "hand",
  "eyes",
  "son",
  "sons",
  "king",
  "city",
  "word",
  "words",
  "time",
  "place",
]);

const PRESCRIPTIVE_MARKERS = [
  "thou shalt",
  "ye shall",
  "you shall",
  "do not",
  "thou shalt not",
  "blessed is",
  "happy is",
  "it is better",
  "he that",
  "whoever",
  "beware",
  "take heed",
  "remember",
  "keep",
  "love thy",
  "honor",
  "honour",
];

const NARRATIVE_MARKERS = [
  "and it came to pass",
  "and he said",
  "and they went",
  "and moses",
  "and david",
  "and the lord said unto",
  "smote",
  "slew",
  "war against",
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(title: string): string {
  return normalize(title).replace(/\s+/g, "-");
}

function addRelationship(
  bag: Map<string, TopicRelationship>,
  topic: string,
  source: TopicRelationshipSource,
  confidence: number,
) {
  const key = normalize(topic).replace(/\s+/g, "-");
  if (!key) return;
  const existing = bag.get(key);
  if (existing && existing.confidence >= confidence) return;
  // Prefer authoritative sources over lexical even at equal confidence.
  const rank = (s: TopicRelationshipSource) =>
    s === "sefaria-topic-link"
      ? 5
      : s === "sefaria-related"
        ? 4
        : s === "curated"
          ? 3
          : s === "title-metadata"
            ? 2
            : 1;
  if (existing && rank(existing.source) > rank(source) && existing.confidence >= confidence - 0.05) {
    return;
  }
  bag.set(key, { topic: key, source, confidence });
}

function classifyPassageKind(english: string, category: string): PassageKind {
  const text = normalize(english);
  if (!text) return "unknown";
  const presc = PRESCRIPTIVE_MARKERS.filter((m) => text.includes(normalize(m))).length;
  const narr = NARRATIVE_MARKERS.filter((m) => text.includes(normalize(m))).length;
  if (category === "writings" || category === "ethics" || category === "mishnah" || category === "philosophy") {
    if (presc > 0) return "prescriptive";
  }
  if (presc >= 2 && narr === 0) return "prescriptive";
  if (narr >= 2 && presc === 0) return "narrative";
  if (presc > 0 && narr > 0) return "mixed";
  if (presc > 0) return "prescriptive";
  if (narr > 0) return "narrative";
  return "unknown";
}

function refKey(ref: string): string {
  return normalize(ref).replace(/\s+/g, " ");
}

function refsMatch(canonical: string, candidate: string): boolean {
  const a = refKey(canonical);
  const b = refKey(candidate);
  if (a === b) return true;
  // Allow chapter:verse vs range start
  if (a.startsWith(b + " ") || b.startsWith(a + " ")) return false;
  if (a.startsWith(b) || b.startsWith(a)) {
    // Genesis 1:1 vs Genesis 1:1-2
    return true;
  }
  return false;
}

type SefariaTopicRef = {
  ref?: string;
  expandedRefs?: string[];
  linkType?: string;
};

async function fetchSefariaTopicList(minCount: number): Promise<Array<{ slug: string; title: string }>> {
  const limit = Math.max(minCount, 2500);
  const url = `https://www.sefaria.org/api/topics?limit=${limit}&minify=1`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Topic list HTTP ${res.status}`);
  const batch = (await res.json()) as Array<{ slug?: string; en?: string; primaryTitle?: { en?: string } }>;
  const out: Array<{ slug: string; title: string }> = [];
  const seen = new Set<string>();
  for (const t of batch) {
    const slug = (t.slug || "").trim();
    const title = (t.en || t.primaryTitle?.en || slug).trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push({ slug, title });
  }
  return out;
}

async function fetchTopicRefs(slug: string): Promise<SefariaTopicRef[]> {
  const url = `https://www.sefaria.org/api/topics/${encodeURIComponent(slug)}?with_refs=1`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return [];
    const data = (await res.json()) as { refs?: SefariaTopicRef[] };
    return Array.isArray(data.refs) ? data.refs : [];
  } catch {
    return [];
  }
}

function applyCuratedSeeds(
  record: SourceRecord,
  bag: Map<string, TopicRelationship>,
) {
  const english = normalize(record.englishText ?? "");
  const padded = ` ${english} `;
  for (const seed of CONCEPT_SEEDS) {
    if (seed.knownRefs?.some((r) => refsMatch(record.canonicalRef, r))) {
      addRelationship(bag, seed.concept, "curated", 0.95);
      continue;
    }
    const phraseHits = seed.teachingPhrases.filter((p) => {
      const n = normalize(p);
      if (n.includes(" ")) return padded.includes(` ${n} `) || padded.includes(n);
      // Single-word teaching phrases must not be ambiguous generics.
      if (AMBIGUOUS_SINGLE_WORDS.has(n)) return false;
      return padded.includes(` ${n} `);
    }).length;
    if (phraseHits >= 1) {
      const bookOk =
        !seed.preferredBooks?.length ||
        seed.preferredBooks.some((b) => normalize(b) === normalize(record.sourceTitle));
      const familyOk =
        !seed.preferredFamilies?.length ||
        seed.preferredFamilies.includes(
          record.sourceCategory as (typeof seed.preferredFamilies)[number],
        );
      if (bookOk || familyOk) {
        addRelationship(bag, seed.concept, "curated", phraseHits >= 2 ? 0.85 : 0.72);
      } else if (phraseHits >= 2) {
        addRelationship(bag, seed.concept, "curated", 0.55);
      }
    }
  }
}

function applyRestrictedLexical(
  record: SourceRecord,
  bag: Map<string, TopicRelationship>,
) {
  const english = normalize(record.englishText ?? "");
  if (!english) return;
  const padded = ` ${english} `;

  for (const [concept, synonyms] of Object.entries(TOPIC_SYNONYMS)) {
    if (bag.has(normalize(concept).replace(/\s+/g, "-"))) continue;
    const phrases = [concept.replace(/-/g, " "), ...synonyms].map(normalize);
    const multi = phrases.filter((p) => p.includes(" ") && p.split(" ").length >= 2);
    const multiHits = multi.filter((p) => padded.includes(` ${p} `) || padded.includes(p));
    if (multiHits.length >= 1) {
      addRelationship(bag, concept, "lexical-inference", 0.35);
      continue;
    }
    // Require two independent non-ambiguous single-token signals.
    const singles = phrases
      .filter((p) => !p.includes(" "))
      .filter((p) => p.length >= 5 && !AMBIGUOUS_SINGLE_WORDS.has(p));
    const singleHits = singles.filter((p) => padded.includes(` ${p} `));
    if (singleHits.length >= 2) {
      addRelationship(bag, concept, "lexical-inference", 0.25);
    }
  }
}

async function main() {
  console.log("=== Topic enrichment v2 (provenance-aware) ===");

  const sefariaTopics = await fetchSefariaTopicList(4000);
  console.log(`Fetched ${sefariaTopics.length} Sefaria topic records`);

  // Build ref → topic relationships from mapped high-value Sefaria topics.
  const refToTopics = new Map<string, Array<{ topic: string; concepts: string[] }>>();
  const mappedSlugs = Object.keys(SEFARIA_TOPIC_CONCEPT_MAP);
  let importedLinks = 0;
  let failedTopics = 0;

  for (let i = 0; i < mappedSlugs.length; i++) {
    const slug = mappedSlugs[i];
    const refs = await fetchTopicRefs(slug);
    if (!refs.length) {
      failedTopics += 1;
      continue;
    }
    const concepts = SEFARIA_TOPIC_CONCEPT_MAP[slug] ?? [];
    for (const entry of refs) {
      const expanded = entry.expandedRefs?.length
        ? entry.expandedRefs
        : entry.ref
          ? [entry.ref]
          : [];
      for (const ref of expanded) {
        const key = refKey(ref);
        const list = refToTopics.get(key) ?? [];
        list.push({ topic: slug, concepts });
        refToTopics.set(key, list);
        importedLinks += 1;
      }
    }
    if ((i + 1) % 10 === 0) {
      console.log(`  topic refs ${i + 1}/${mappedSlugs.length} (links≈${importedLinks})`);
    }
    await sleep(50);
  }
  console.log(
    `Sefaria topic→ref links imported: ${importedLinks} (empty topics: ${failedTopics})`,
  );

  const synonymExport: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(TOPIC_SYNONYMS)) synonymExport[k] = [...v];
  for (const t of sefariaTopics) {
    if (!synonymExport[t.slug]) {
      synonymExport[t.slug] = tokenizeTitle(t.title);
    }
  }

  function tokenizeTitle(title: string): string[] {
    return normalize(title)
      .split(" ")
      .filter((t) => t.length >= 4 && !AMBIGUOUS_SINGLE_WORDS.has(t))
      .slice(0, 6);
  }

  const shardFiles = fs
    .readdirSync(SHARDS)
    .filter((f) => f.endsWith(".json"))
    .sort();

  let passages = 0;
  let relationships = 0;
  let authoritative = 0;
  let lexical = 0;
  const topicUse = new Map<string, number>();
  const authoritativeTopicUse = new Set<string>();

  for (const file of shardFiles) {
    const full = path.join(SHARDS, file);
    const records = JSON.parse(fs.readFileSync(full, "utf8")) as SourceRecord[];
    for (const record of records) {
      const bag = new Map<string, TopicRelationship>();

      // 1) Sefaria authoritative links (exact normalized ref lookup)
      const candidates = [
        refKey(record.canonicalRef),
        refKey(record.canonicalRef.replace(/ ([0-9]+:[0-9]+)$/, ".$1").replace(/\s+/g, " ")),
      ];
      for (const key of candidates) {
        const direct = refToTopics.get(key);
        if (!direct) continue;
        for (const link of direct) {
          addRelationship(bag, link.topic, "sefaria-topic-link", 0.98);
          for (const concept of link.concepts) {
            addRelationship(bag, concept, "sefaria-topic-link", 0.96);
          }
        }
      }

      // 2) Curated seeds
      applyCuratedSeeds(record, bag);

      // 3) Title metadata
      addRelationship(bag, slugify(record.sourceTitle), "title-metadata", 0.4);

      // 4) Restricted lexical fallback
      applyRestrictedLexical(record, bag);

      const rels = [...bag.values()].sort((a, b) => b.confidence - a.confidence);
      record.topicRelationships = rels;
      record.passageKind = classifyPassageKind(
        record.englishText ?? "",
        record.sourceCategory,
      );

      const authoritativeTopics = rels
        .filter((r) => r.source !== "lexical-inference" && r.source !== "title-metadata")
        .map((r) => r.topic);
      const lexicalTopics = rels
        .filter((r) => r.source === "lexical-inference")
        .map((r) => r.topic);

      // `topics` = authoritative + curated first (for benchmark/retrieval).
      // Lexical stays in relatedTopics / topicRelationships only.
      record.topics = [
        ...new Set([
          ...authoritativeTopics,
          ...rels.filter((r) => r.source === "title-metadata").map((r) => r.topic),
        ]),
      ].slice(0, 16);
      record.relatedTopics = lexicalTopics.slice(0, 8);
      record.keywords = authoritativeTopics.slice(0, 12);

      passages += 1;
      relationships += rels.length;
      for (const r of rels) {
        topicUse.set(r.topic, (topicUse.get(r.topic) ?? 0) + 1);
        if (r.source === "sefaria-topic-link" || r.source === "curated") {
          authoritative += 1;
          authoritativeTopicUse.add(r.topic);
        }
        if (r.source === "lexical-inference") lexical += 1;
      }
    }
    fs.writeFileSync(full, JSON.stringify(records));
    console.log(`  enriched ${file}: ${records.length}`);
  }

  fs.writeFileSync(
    path.join(LIBRARY, "topics.json"),
    JSON.stringify(synonymExport, null, 2),
  );

  const index = {
    enrichedAt: new Date().toISOString(),
    sefariaTopicRecords: sefariaTopics.length,
    topicCount: sefariaTopics.length,
    topicsWithPassages: topicUse.size,
    topicsWithAuthoritativeLinks: authoritativeTopicUse.size,
    passageCount: passages,
    sourceTopicRelationships: relationships,
    authoritativeRelationships: authoritative,
    lexicalRelationships: lexical,
    importGaps: {
      mappedTopicsRequested: mappedSlugs.length,
      mappedTopicsEmpty: failedTopics,
      note:
        "Lexically inferred relationships are stored with source=lexical-inference and must not be described as verified Sefaria links.",
    },
    topAuthoritativeTopics: [...authoritativeTopicUse].slice(0, 40),
  };
  fs.writeFileSync(path.join(LIBRARY, "topics-index.json"), JSON.stringify(index, null, 2));

  const manifestPath = path.join(LIBRARY, "manifest.json");
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
      totals?: Record<string, number>;
    };
    manifest.totals = {
      ...(manifest.totals ?? {}),
      records: passages,
      topics: sefariaTopics.length,
      topicsWithPassages: topicUse.size,
      sourceTopicRelationships: relationships,
      authoritativeRelationships: authoritative,
      lexicalRelationships: lexical,
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  console.log("\n=== Enrichment complete ===");
  console.log(JSON.stringify(index, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
