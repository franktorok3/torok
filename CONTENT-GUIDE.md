# Torok content guide

This guide explains how to add and maintain teachings in Torok’s curated library.

## Principles

1. **Do not invent quotations.** Every teaching must map to a real, checkable classical source.
2. **Separate layers clearly.** Biblical wording, later commentary, and modern application must not be merged into one undifferentiated claim.
3. **Prefer paraphrases** when exact wording or translation rights are uncertain. Label via `textKind: "paraphrase"`.
4. **Attribute translations** whenever `textKind` is `"quotation"`.
5. **One useful lens, not the only Jewish position.**
6. **No psak.** Torok does not decide what someone “must” do under Jewish law.
7. **No casual sacred names** in decorative UI chrome.
8. **Never mark the library educator-reviewed** until a qualified rabbi or Jewish educator has actually reviewed it.

## Teaching shape

Each entry in `src/lib/wisdom/teachings.ts` includes:

| Field | Purpose |
| --- | --- |
| `id` | Stable unique id |
| `theme` / `themeLabel` | Theme key and label |
| `sources[]` | Canonical citation + optional URL |
| `textKind` | `"quotation"` or `"paraphrase"` |
| `text` | Exact quotation or paraphrase body |
| `translationAttribution` | Required for quotations |
| `historicalContext` | Historical / interpretive context |
| `modernApplication` | Contemporary application (not source language) |
| `takeaway` | “Try this today” |
| `reflectionQuestion` | Question to carry |
| `acknowledgment` | Brief empathetic opener |
| `viewpoint` | Tradition or lens when relevant |
| `keywords` | Matching terms |
| `reviewStatus` | `draft` \| `awaiting-educator-review` \| `educator-reviewed` |

## Content audit

Run:

```bash
npm run audit:content
```

The audit flags missing citations, unattributed translations, duplicate identifiers, modern applications that sound like source language, and entries awaiting human review.

## Tone

Warm, concise, humble, nonjudgmental, curious rather than preachy.

Prefer:

- “One Jewish teaching that may illuminate this…”
- “A way to carry this into today might be…”
- “Jewish tradition contains several perspectives; one useful lens is…”

## Safety

`src/lib/wisdom/safety.ts` routes crisis, abuse, medical, legal, and halacha-seeking language.

- Crisis / abuse: compassionate redirect; no cute teaching-only answer.
- Medical / legal / halacha: clear boundary + encouragement to seek qualified help.
