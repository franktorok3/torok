# Torok content guide

This guide covers **two** content layers:

1. **Curated editorial teachings** (~100) — examples and high-confidence fallbacks
2. **Retrieval library** (`data/library/`) — the primary knowledge engine

## Positioning

Torok uses Sefaria’s library and textual connections as its source foundation, with Torok’s own retrieval and response system. Curated cards must **not** define the limits of Torok’s knowledge.

## Principles

1. **Do not invent quotations.** Displayed Hebrew/Aramaic and English quotations hydrate from verified `SourceRecord`s or curated verified originals.
2. **Separate layers clearly.** Classical text, commentary, and Torok’s modern application stay distinct.
3. **Prefer paraphrases** when exact wording or translation rights are uncertain. Label via `textKind` / `englishIsParaphrase`.
4. **Attribute translations** and record licenses in the library manifest.
5. **One useful lens, not the only Jewish position.** Broad questions use multi-lens responses.
6. **No psak.** Torok does not decide what someone “must” do under Jewish law.
7. **Never mark educator-reviewed** until a qualified rabbi or Jewish educator has actually reviewed it.
8. **Reject unclear licenses.** Do not import merged translations with unknown component rights.

## Library ingestion

```bash
npm run import:library      # resumable, cached chapter fetches
npm run enrich:topics       # ≥2k topics + per-passage tags
npm run build:search-index  # compact lexical shards
npm run audit:library
```

Each passage follows the `SourceRecord` schema in `src/lib/library/types.ts`. Do not mix modern application language into source records.

## Curated teaching shape

Each entry in `src/lib/wisdom/teachings.ts` includes:

| Field | Purpose |
| --- | --- |
| `id` | Stable unique id |
| `theme` / `themeLabel` | Theme key and label |
| `sources[]` | Canonical citation + optional URL |
| `textKind` | `"quotation"` or `"paraphrase"` |
| `text` | Torok interpretive lens (“One way to carry it”) |
| `historicalContext` | Historical / interpretive context |
| `modernApplication` | Contemporary application |
| `takeaway` | “Try this today” |
| `reflectionQuestion` | Question to carry |
| `acknowledgment` | Brief empathetic opener |
| `keywords` | Matching terms (fallback matcher only) |
| `reviewStatus` | `draft` \| `awaiting-educator-review` \| `educator-reviewed` |

## Benchmarks

```bash
npm run generate:benchmarks
npm run benchmark:retrieval
```

Quality is measured by retrieval metrics (P@1, P@5, incorrect dominant theme rate, citation validity, safety routing), not only by “tests pass.”

## Content audit

```bash
npm run audit:content
```
