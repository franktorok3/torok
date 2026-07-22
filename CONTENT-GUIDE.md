# Torok content guide

This guide explains how to add and maintain teachings in Torok’s curated library.

## Principles

1. **Do not invent quotations.** Every teaching must map to a real, checkable classical source.
2. **Prefer paraphrases.** Label them clearly with the word “Paraphrase:”.
3. **Cite the location** (book, chapter/verse, tractate, or standard code section).
4. **One useful lens, not the only Jewish position.** Avoid language that collapses the tradition into a single ruling.
5. **No psak.** Torok does not decide what someone “must” do under Jewish law.
6. **No casual sacred names** in decorative UI chrome.

## Teaching shape

Each entry in `src/lib/wisdom/teachings.ts` includes:

| Field | Purpose |
| --- | --- |
| `id` | Stable unique id |
| `theme` | One of the supported theme keys |
| `themeLabel` | Human-readable theme name |
| `source` | Citation a learner can look up |
| `paraphrase` | Careful paraphrase beginning with “Paraphrase:” |
| `explanation` | Plain-language context |
| `takeaway` | One practical step for today |
| `reflectionQuestion` | A question to carry |
| `keywords` | Matching terms (lowercase phrases welcome) |

## Supported themes

Patience, repair, relationships, leadership, courage, gratitude, community, justice, rest, speech, uncertainty, learning, generosity, technology.

## Tone

Warm, concise, humble, nonjudgmental, curious rather than preachy.

Prefer:

- “One Jewish teaching that may illuminate this…”
- “A way to carry this into today might be…”
- “Jewish tradition contains several perspectives; one useful lens is…”

Avoid:

- “The Torah says you must…” (unless the text and context truly warrant it, which is rare for this product)
- Spiritual authority cosplay
- Therapy or clinical diagnosis

## Safety

`src/lib/wisdom/safety.ts` routes crisis, abuse, medical, legal, and halacha-seeking language.

- Crisis / abuse: compassionate redirect; no cute teaching-only answer.
- Medical / legal / halacha: clear boundary + encouragement to seek qualified help; optional educational teaching may still appear after the boundary.

When adding keywords to teachings, avoid terms that would pull crisis language into ordinary theme matching.

## How to add a teaching

1. Verify the source in a reliable edition or standard reference.
2. Write a paraphrase (not a copyrighted translation dump).
3. Add keywords that real users would type.
4. Run `npm run test` and confirm matching still behaves well for presets.
5. Note the addition in `CURSOR-HANDOFF.md` if it changes product behavior.
