# Torok

**Torok**  
**The Torah Wisdom Bot**

*Ancient wisdom for the moment you’re in.*

Torok answers everyday, ethical, emotional, leadership, and philosophical questions by retrieving from a broad Jewish textual library (Tanakh, selected Mishnah, ethics), then composing a concise, Hebrew-first Wisdom Card with verified citations.

**Torok uses Sefaria’s library and textual connections as its source foundation, with its own retrieval and response system.** It does not use a proprietary Sefaria AI model.

**Torok offers Jewish learning and reflection, not rabbinic rulings, pastoral counseling, or professional advice.**

## Free mode (default)

Works with **no API key**.

1. **Primary:** local retrieval over ≥25k licensed passages (`data/library/`)
2. **Fallback:** ~100 curated editorial teachings (examples / high-confidence only)
3. **Optional:** grounded LLM connective language if `TOROK_LLM_API_KEY` / `OPENAI_API_KEY` is set (quotations still come from verified records)

Shareable links use `?lens=<teaching-id>` only — they never store private user text.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development |
| `npm run import:library` | Resumable Sefaria → `data/library` import |
| `npm run enrich:topics` | Topic ontology + per-passage tags |
| `npm run build:search-index` | Compact lexical index shards |
| `npm run audit:library` | Completeness / licensing report |
| `npm run generate:benchmarks` | Build ≥250 benchmark questions |
| `npm run benchmark:retrieval` | Retrieval-quality metrics |
| `npm run test` | Unit + integration tests |
| `npm run audit:content` | Editorial integrity audit |
| `npm run check` | Lint + types + tests + build |

## Architecture

```
src/lib/library/    # Corpus loader, concepts, retrieve, rerank, verify (server-only)
src/lib/wisdom/     # Compose, safety, curated 100, optional LLM, UI types
src/lib/torah/      # Legacy Torah helpers (still server-only)
data/library/       # Shards + manifest + topics (not bundled into the client)
```

Flow:

1. Safety routing (crisis / abuse / halacha soft-stop) **before** retrieval
2. Query understanding (intents + concept expansion + exclusions)
3. Hybrid retrieve → verify → rerank → confidence
4. Single-lens, multi-lens, or abstain response
5. Citation verification fail-closed for displayed quotations

## Testing & quality

```bash
npm run generate:benchmarks
npm run benchmark:retrieval
npm run test
```

Mandatory regressions include: “What is the meaning of life?” must not return anger as the primary theme; broad questions prefer multi-lens; crisis queries never explore ordinary sources.

## Deploy

```bash
npx vercel --prod
```

Hobby tier: corpus loads server-side only; keep filesystem/search modules out of client components.

## Production

**https://torok.vercel.app**  
GitHub: https://github.com/franktorok3/torok

See [`CONTENT-SOURCES.md`](./CONTENT-SOURCES.md), [`CONTENT-GUIDE.md`](./CONTENT-GUIDE.md), [`CURSOR-HANDOFF.md`](./CURSOR-HANDOFF.md), [`.env.example`](./.env.example).
