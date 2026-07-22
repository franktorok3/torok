/**
 * Build compact server-side lexical search shards for faster cold starts.
 *
 * Writes data/library/search-index/:
 *   meta.json
 *   by-category/{category}.json   — id → {ref, title, category, topics, tokens}
 *
 * Embeddings are optional (see scripts/build-embeddings.ts stub). Lexical +
 * topic retrieval remains the primary path and must work without embeddings.
 *
 * Usage: npm run build:search-index
 */
import fs from "node:fs";
import path from "node:path";
import type { SourceRecord } from "../src/lib/library/types";

const ROOT = path.resolve(__dirname, "..");
const LIBRARY = path.join(ROOT, "data", "library");
const SHARDS = path.join(LIBRARY, "shards");
const OUT = path.join(LIBRARY, "search-index");

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokensFor(record: SourceRecord): string[] {
  const text = normalize(
    [
      record.englishText ?? "",
      record.canonicalRef,
      record.sourceTitle,
      ...(record.topics ?? []),
      ...(record.keywords ?? []),
    ].join(" "),
  );
  const counts = new Map<string, number>();
  for (const t of text.split(" ")) {
    if (t.length < 3) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([t]) => t);
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const byCategory = new Map<string, unknown[]>();
  let total = 0;

  for (const file of fs.readdirSync(SHARDS).filter((f) => f.endsWith(".json"))) {
    const records = JSON.parse(
      fs.readFileSync(path.join(SHARDS, file), "utf8"),
    ) as SourceRecord[];
    for (const r of records) {
      total += 1;
      const entry = {
        id: r.id,
        ref: r.canonicalRef,
        title: r.sourceTitle,
        category: r.sourceCategory,
        topics: r.topics ?? [],
        tokens: tokensFor(r),
        hasOriginal: Boolean(r.originalText?.trim()),
        hasEnglish: Boolean(r.englishText?.trim()),
      };
      const list = byCategory.get(r.sourceCategory) ?? [];
      list.push(entry);
      byCategory.set(r.sourceCategory, list);
    }
  }

  const catDir = path.join(OUT, "by-category");
  fs.mkdirSync(catDir, { recursive: true });
  for (const [category, entries] of byCategory) {
    fs.writeFileSync(
      path.join(catDir, `${category}.json`),
      JSON.stringify(entries),
    );
  }

  const meta = {
    builtAt: new Date().toISOString(),
    passageCount: total,
    categories: [...byCategory.keys()].sort(),
    embeddingModel: null,
    note:
      "Lexical + topic index for server-side retrieval. Full SourceRecord text remains in data/library/shards.",
  };
  fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify(meta, null, 2));
  console.log(`Search index built: ${total} passages across ${byCategory.size} categories`);
}

main();
