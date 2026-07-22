# Torok — Cursor handoff

## Status

Revised v1.1: compact interactive-toy experience with distinct view states, richer teaching schema, content audit, and corrected Leviticus 19:18 / Sifra sourcing.

## Production URL

**https://torok.vercel.app**

Deployment: https://vercel.com/frank-torok-s-projects/torok

## Important files

| Path | Role |
| --- | --- |
| `src/components/TorokExperience.tsx` | Welcome / listening / thinking / answer / sensitive / error states |
| `src/components/TorokCharacter.tsx` | Dimensional lamp companion + gaze / warmth |
| `src/components/ResponseCard.tsx` | Focused answer card + source drawer + another lens |
| `src/app/globals.css` | Brand system, compact layout, motion, reduced-motion |
| `src/lib/wisdom/teachings.ts` | Curated library with source / paraphrase / review fields |
| `src/lib/wisdom/audit.ts` | Development content audit |
| `scripts/content-audit.ts` | CLI audit runner |
| `CONTENT-GUIDE.md` | Citation and review rules |

## Commands

```bash
npm install
npm run dev
npm run test
npm run audit:content
npm run lint
npm run typecheck
npm run build
npm run check
npx vercel --prod
```

## Notes

- Free mode needs no env vars.
- Shareable `?lens=<teaching-id>` never stores private user text.
- Library status remains `awaiting-educator-review` until a qualified educator reviews it.
- Production UI must never show engine/diagnostic labels.

## Recommended next steps

1. Educator review of paraphrases and quotations.
2. Optional inference provider behind the existing server hook.
3. Soften safety patterns with community feedback.
4. Optional bilingual UI.
