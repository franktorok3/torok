# Content sources

## Scope definitions

| Term | Meaning in Torok |
| --- | --- |
| **Torah** | The Five Books of Moses: Genesis, Exodus, Leviticus, Numbers, Deuteronomy |
| **Tanakh** | Torah + Prophets (Nevi’im) + Writings (Ketuvim) — **not fully covered yet** |
| **Rabbinic / later** | Midrash, Talmud, codes, liturgy, mussar — selected entries only |

**Complete Torah coverage** means: every chapter and verse of Genesis–Deuteronomy available from the selected Sefaria versions is present in the local corpus and searchable. It does **not** mean every verse has an editorial interpretation, that Torok “understands” Torah, or that Prophets/Writings are included.

## Licensing decision (English)

After querying `https://www.sefaria.org/api/texts/versions/{book}` for each of the five books, Torok selected:

| Field | Value |
| --- | --- |
| Version title | The Holy Scriptures: A New Translation (JPS 1917) |
| License | **Public Domain** |
| Language | English |
| Source URL | http://opensiddur.org/2010/08/תנ״ך-the-holy-scriptures-a-new-translation-jps-1917/ |
| Why chosen | Explicit Public Domain license suitable for local packaging and attribution; available for all five books |

**Rejected for this corpus (examples):**

- THE JPS TANAKH: Gender-Sensitive Edition — CC-BY-NC
- Tanakh: The Holy Scriptures (JPS 1985) — CC-BY-NC
- Everett Fox — Copyright: Schocken
- Sefaria Community Translation — CC0 but incomplete / uneven as a locked scholarly edition for full Chumash reuse in this build

## Licensing decision (Hebrew)

| Field | Value |
| --- | --- |
| Version title | Tanach with Nikkud |
| License | **Public Domain** |
| Language | Hebrew |

## Sefaria endpoints used

1. Versions metadata: `GET https://www.sefaria.org/api/texts/versions/{book}`
2. Chapter text: `GET https://www.sefaria.org/api/v3/texts/{book}.{chapter}?version={language}|{versionTitle}`
3. Index lengths: `GET https://www.sefaria.org/api/v2/raw/index/{book}`

Import script: `npx tsx scripts/import-torah.ts`  
Output: `data/torah/{genesis,exodus,leviticus,numbers,deuteronomy}.json`, `search-index.json`, `manifest.json`

## Acknowledgment

Torah text courtesy of public-domain editions via Sefaria.  
**Powered by Sefaria** — Sefaria did not develop or endorse Torok.

See also: [Sefaria name & logo / data use](https://developers.sefaria.org/docs/usage-of-our-name-and-logo).

## Last corpus refresh

See `data/torah/manifest.json` → `importedAt`.

## Editorial library status

- Core teachings: `awaiting-educator-review`
- Programmatic expansions: `draft`
- Library must not be marked educator-reviewed until a qualified rabbi or Jewish educator reviews it

## Search limitations

- Keyword / synonym / theme hybrid retrieval — not semantic understanding
- Max 3 passages; relevance threshold applies
- Sensitive-topic routing overrides exploratory retrieval
- No network required at runtime when corpus is packaged locally
