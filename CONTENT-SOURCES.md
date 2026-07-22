# Content sources

## Accurate positioning

Torok uses **Sefaria’s library and textual connections as its source foundation**, with Torok’s own retrieval and response system.

Torok does **not** use a proprietary Sefaria chatbot or AI model. Sefaria provides structured texts, translations, references, search, topics, and connections. Torok retrieves, reranks, verifies, and composes responses.

## Scope definitions

| Term | Meaning in Torok |
| --- | --- |
| **Torah** | Genesis–Deuteronomy |
| **Prophets / Writings** | Full Tanakh books packaged locally |
| **Mishnah (selected)** | Pirkei Avot + selected everyday-wisdom tractates |
| **Ethics / philosophy** | Mesillat Yesharim; Duties of the Heart when licensed import succeeds |
| **Curated examples** | ~100 editorial teachings — examples and high-confidence fallbacks only |

**Searchable source coverage** means locally packaged `SourceRecord` passages under `data/library/` that the server-side retrieval engine can score. It does **not** mean rabbinic endorsement, complete commentary coverage, or that every verse has an editorial interpretation.

## Local library corpus

| Layer | Approx. count | Location |
| --- | --- | --- |
| Searchable passages | ≥25,000 | `data/library/shards/` |
| Topics / concepts | ≥2,000 | `data/library/topics-index.json` |
| Source–topic links | tens of thousands | per-record `topics[]` |
| Curated editorial cards | 100 | `src/lib/wisdom/teachings*` + `data/curated-originals.json` |

Rebuild:

```bash
npm run import:library
npm run enrich:topics
npm run build:search-index
npm run audit:library
```

## Licensing (editions in use)

### Tanakh (Torah, Prophets, Writings)

| Field | English | Hebrew |
| --- | --- | --- |
| Version | The Holy Scriptures: A New Translation (JPS 1917) | Tanach with Nikkud |
| License | **Public Domain** | **Public Domain** |

### Pirkei Avot + selected Mishnah

| Field | English | Hebrew |
| --- | --- | --- |
| Version | Mishnah Yomit by Dr. Joshua Kulp | Torat Emet 357 |
| License | **CC-BY** | **Public Domain** |

### Mesillat Yesharim

| Field | English | Hebrew |
| --- | --- | --- |
| Version | Path of the Just (Rabbi Yosef Sebag) | Sefaria Vocalized Edition |
| License | **CC-BY** | **Public Domain** |

### Duties of the Heart

Import attempts Rabbi Yosef Sebag (**CC-BY**) English + Vocalized Edition Hebrew (**Public Domain**). If the nested-index fetch yields no units, the collection is omitted until fixed — never silently use an unlicensed merge.

### Rejected / not used

- JPS 1985 / Gender-Sensitive — CC-BY-NC
- William Davidson / Steinsaltz English — CC-BY-NC
- Everett Fox — proprietary
- Merged translations whose component licenses are unknown

Machine-readable summary: `data/library/manifest.json`.

## Sefaria endpoints used (import / enrichment)

1. Versions: `GET /api/texts/versions/{title}`
2. Text: `GET /api/texts/{ref}?ven=…&vhe=…`
3. Index: `GET /api/v2/raw/index/{title}`
4. Topics: `GET /api/topics?limit=&page=`

Runtime prefers the local corpus. Live Sefaria may be used later for long-tail depth; an outage must not crash Torok. Attribution stays quiet in-product (**View source**) and fuller in About / this file.

## Acknowledgment

Classical texts courtesy of public-domain and CC-BY editions via Sefaria.  
**Powered by Sefaria** — Sefaria did not develop or endorse Torok.

See [Sefaria name & logo / data use](https://developers.sefaria.org/docs/usage-of-our-name-and-logo).

## Editorial status

- Curated teachings: `awaiting-educator-review` / `draft`
- Library retrieval breadth ≠ educator review
- Retrieval breadth ≠ rabbinic endorsement

## Search limitations

- Hybrid lexical + topic + intent scoring (optional embeddings when configured)
- Broad questions → multi-lens; weak matches → abstain
- Safety routing before retrieval
- No-key mode remains fully useful via retrieval + templated connective language
