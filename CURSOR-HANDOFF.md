# Torok — Cursor handoff

## Status

Torah exploration expansion shipped: complete local Torah corpus (Genesis–Deuteronomy), hybrid retrieval, collapsed “Explore this in Torah” UI, 100 editorial teachings (20 awaiting educator review + 80 drafts), audits/tests, GitHub remote.

## Production URL

**https://torok.vercel.app**

GitHub: https://github.com/franktorok3/torok

## Corpus counts (current)

| Metric | Value |
| --- | --- |
| Books | 5 (Genesis–Deuteronomy) |
| Chapters | 187 |
| Verses | 5,846 |
| English | JPS 1917 — Public Domain |
| Hebrew | Tanach with Nikkud — Public Domain |
| Editorial teachings | 100 (20 awaiting review, 80 draft) |

## Important paths

| Path | Role |
| --- | --- |
| `data/torah/` | Local packaged corpus + manifest |
| `scripts/import-torah.ts` | Repeatable Sefaria import |
| `src/lib/torah/` | Loader + hybrid search (server-side) |
| `src/lib/wisdom/` | Editorial engine + compose |
| `CONTENT-SOURCES.md` | Licenses, endpoints, coverage definition |

## Commands

```bash
npm install
npm run import:torah   # refresh corpus from Sefaria (network)
npm run audit:content
npm run test
npm run check
npx vercel --prod
```

## Notes

- Runtime needs no Sefaria network calls when `data/torah` is present.
- Client components import only `@/lib/wisdom/types` and `clipboard` — Torah FS loader stays server-side.
- Draft teachings must never be labeled educator-reviewed without a real educator review.
