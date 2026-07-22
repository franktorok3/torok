# Torok

Ancient wisdom for the moment you’re in.

Torok is a warm, charming Torah-wisdom companion for everyday situations. Describe what’s happening — a difficult conversation, a mistake, uncertainty, gratitude, leadership, family tension, or ethical technology use — and Torok responds with an accessible Jewish teaching and one practical reflection.

**Torok offers Jewish learning and reflection, not rabbinic rulings, pastoral counseling, or professional advice.**

## Free mode (default)

Torok works immediately with **no API key** and **no environment variables**.

Responses come from:

1. A curated editorial teaching library
2. A local packaged corpus of the complete Five Books of Moses (JPS 1917 + public-domain Hebrew)

Search is hybrid keyword/theme retrieval — not a claim that Torok understands the whole Torah. See [`CONTENT-SOURCES.md`](./CONTENT-SOURCES.md).

Shareable links use `?lens=<teaching-id>` only — they never store private user text.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run test` | Wisdom engine + Torah corpus + safety tests |
| `npm run audit:content` | Editorial + Torah integrity audit |
| `npm run import:torah` | Rebuild Torah corpus from Sefaria |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run build` | Production build |
| `npm run check` | Lint + types + tests + build |

## Architecture

```
src/
  app/                  # App Router pages + API
    api/wisdom/         # POST /api/wisdom (local engine)
  components/           # UI + animated Torok character
  lib/wisdom/           # Curated teachings, matcher, safety, composer
```

Flow:

1. User enters a situation or taps a preset.
2. Client posts to `/api/wisdom`.
3. Server runs safety routing, then theme matching against curated teachings.
4. Composer returns: hearing → teaching → for today → reflection question → citation + disclaimer.

## Testing

```bash
npm run test
```

Coverage includes preset prompts, free-form matching, blank/long input, crisis/abuse/medical/legal/halacha routing, and citation/paraphrase integrity checks.

## Deploy on Vercel

1. Push this repo to GitHub (or deploy from the CLI).
2. Import the project in Vercel (Hobby tier is enough).
3. Leave environment variables empty for free mode.
4. Deploy.

CLI option:

```bash
npx vercel --prod
```

## Production URL

**https://torok.vercel.app**

Works with zero environment variables (local curated engine).

## Content integrity

See [`CONTENT-GUIDE.md`](./CONTENT-GUIDE.md) for citation rules, tone, safety, and how to add teachings.
