# Torok — Cursor handoff

## Status

Production-ready v1 prototype of Torok: a warm Torah-wisdom companion with a free local curated engine (no API key required).

## Production URL

<!-- Updated after deploy -->
Pending — see README after Vercel deploy.

## Important files

| Path | Role |
| --- | --- |
| `src/app/page.tsx` | Home page |
| `src/components/TorokExperience.tsx` | Main single-page experience |
| `src/components/TorokCharacter.tsx` | Original SVG character + states |
| `src/app/globals.css` | Brand system, texture, motion, reduced-motion |
| `src/lib/wisdom/teachings.ts` | Curated paraphrased teachings |
| `src/lib/wisdom/matcher.ts` | Keyword theme matching |
| `src/lib/wisdom/safety.ts` | Crisis / abuse / medical / legal / halacha routing |
| `src/lib/wisdom/compose.ts` | Response composition |
| `src/app/api/wisdom/route.ts` | POST `/api/wisdom` (local engine; optional provider hook) |
| `src/__tests__/wisdom-engine.test.ts` | Engine + safety tests |
| `CONTENT-GUIDE.md` | How to add teachings safely |
| `.env.example` | Optional provider env vars (not required) |

## Commands

```bash
npm install
npm run dev
npm run test
npm run lint
npm run typecheck
npm run build
npm run check
npx vercel --prod
```

## Architecture notes

- Free mode is the dependable default: curated teachings + keyword matching + safety routing.
- The API never requires env vars.
- Optional provider flags (`TOROK_PROVIDER`, `TOROK_API_KEY`) are server-only stubs for a future free/user-supplied inference provider.
- No database, accounts, or analytics.

## Recommended next steps

1. Expand the teaching library with rabbinic review of paraphrases.
2. Add a user-supplied inference provider behind the existing server hook.
3. Soften/expand safety patterns with community feedback.
4. Add a shareable response URL or export as image.
5. Optional Hebrew/English bilingual UI.

## Verification completed locally

- All preset prompts
- Free-form, blank, and long inputs
- Crisis safety routing
- Lint, typecheck, tests (20), production build
- Browser review of layout, character, response card, a11y labels
