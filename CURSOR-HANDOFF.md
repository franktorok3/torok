# Torok — Cursor handoff

## Status

Retrieval-grounded Jewish wisdom engine is the **primary** response path. The ~100 curated teachings remain examples / fallbacks only.

Torok uses Sefaria’s library and textual connections as its source foundation, with Torok’s own retrieval and response system — **not** a Sefaria chatbot model.

## Production

**https://torok.vercel.app**  
GitHub: https://github.com/franktorok3/torok

## Corpus targets

| Metric | Target | Notes |
| --- | --- | --- |
| Searchable passages | ≥25,000 | `data/library/shards/` |
| Topics | ≥2,000 | `npm run enrich:topics` |
| Source–topic links | ≥50,000 | per-record `topics[]` |
| Benchmarks | ≥250 | `data/benchmarks/` |
| Curated cards | 100 | fallback / examples |

## Important paths

| Path | Role |
| --- | --- |
| `data/library/` | Local searchable corpus + manifest + topics |
| `scripts/import-library.ts` | Resumable licensed import |
| `scripts/enrich-topics.ts` | Topic ontology + tagging |
| `src/lib/library/` | Retrieve / rerank / verify (server-only) |
| `src/lib/wisdom/compose.ts` | Safety → retrieval → curated fallback |
| `src/components/WisdomCard.tsx` | Single + multi-lens UI |

## Commands

```bash
npm install
npm run import:library
npm run enrich:topics
npm run build:search-index
npm run generate:benchmarks
npm run benchmark:retrieval
npm run test
npm run check
npx vercel --prod
```

## Rules

- Client must **not** import library loader / compose / `node:fs` corpus modules
- Quotations hydrate from verified `SourceRecord`s — never from model memory
- No-key mode must stay useful
- Sefaria / LLM failures must not crash the app
- Do not claim rabbinic authority or Sefaria endorsement of Torok’s answers

## Optional LLM

See `.env.example` (`TOROK_LLM_*`). Free-tier quotas may change. Without a key, deterministic retrieval + templated connective language is used.
