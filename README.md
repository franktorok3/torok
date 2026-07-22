# Torok

Ancient wisdom for the moment you’re in.

Torok is a warm, charming Torah-wisdom companion for everyday situations. Describe what’s happening — a difficult conversation, a mistake, uncertainty, gratitude, leadership, family tension, or ethical technology use — and Torok responds with an accessible Jewish teaching and one practical reflection.

**Torok offers Jewish learning and reflection, not rabbinic rulings, pastoral counseling, or professional advice.**

## Free mode (default)

Torok works immediately with **no API key** and **no environment variables**.

Responses come from a curated local library of classical Jewish teachings. The engine classifies themes with keyword matching and composes a warm, structured reflection. It does **not** pretend to be a generative AI model.

An optional server-side inference provider can be added later (see `.env.example`). External inference is never required for launch, and secrets never ship to the browser.

## Stack

- Next.js (App Router) + TypeScript + React
- Tailwind CSS
- Vitest for the wisdom engine and safety routing
- Vercel Hobby-tier hosting

No database. No accounts. No analytics.

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run test` | Wisdom engine + safety tests |
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
