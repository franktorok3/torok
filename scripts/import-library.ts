/**
 * Resumable Sefaria library import.
 *
 * Builds a local, searchable Jewish wisdom corpus at data/library/:
 *   - shards/{slug}.json   one SourceRecord[] file per book/work
 *   - cache/{slug}/*.json  raw per-chapter API responses (for fast resume)
 *   - manifest.json        totals + collection summaries + licenses
 *
 * Coverage:
 *   - Complete Tanakh: Torah, Prophets, Writings (JPS 1917 English +
 *     Tanach with Nikkud Hebrew, both Public Domain). Torah books are
 *     fast-pathed from the existing data/torah/*.json corpus instead of
 *     re-fetching from the network.
 *   - Pirkei Avot (Mishnah), using Sefaria's default public versions.
 *   - Mesillat Yesharim (ethics), only if a clearly-licensed English +
 *     Hebrew version pair is available; skipped otherwise.
 *
 * Resume: shards that are already complete (shard file + done marker) are
 * skipped on the next run. Set FORCE=1 to force a full re-import.
 *
 * Usage: npx tsx scripts/import-library.ts
 */
import fs from "node:fs";
import path from "node:path";
import type {
  LibraryCollectionSummary,
  LibraryManifest,
  SourceCategory,
  SourceRecord,
} from "../src/lib/library/types";

const ROOT = path.resolve(__dirname, "..");
const SHARDS_DIR = path.join(ROOT, "data", "library", "shards");
const CACHE_DIR = path.join(ROOT, "data", "library", "cache");
const TORAH_DIR = path.join(ROOT, "data", "torah");

const FORCE = process.env.FORCE === "1";
const USER_AGENT = "TorokLibraryImporter/1.0";
const RATE_LIMIT_MIN_MS = 80;
const RATE_LIMIT_MAX_MS = 120;

const ENGLISH_VERSION = "The Holy Scriptures: A New Translation (JPS 1917)";
const HEBREW_VERSION = "Tanach with Nikkud";

const TORAH_BOOKS = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
] as const;

const PROPHETS_BOOKS = [
  "Joshua",
  "Judges",
  "I Samuel",
  "II Samuel",
  "I Kings",
  "II Kings",
  "Isaiah",
  "Jeremiah",
  "Ezekiel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
] as const;

const WRITINGS_BOOKS = [
  "Psalms",
  "Proverbs",
  "Job",
  "Song of Songs",
  "Ruth",
  "Lamentations",
  "Ecclesiastes",
  "Esther",
  "Daniel",
  "Ezra",
  "Nehemiah",
  "I Chronicles",
  "II Chronicles",
] as const;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rateLimitDelay() {
  const span = RATE_LIMIT_MAX_MS - RATE_LIMIT_MIN_MS;
  return RATE_LIMIT_MIN_MS + Math.floor(Math.random() * span);
}

function stripHtml(input: string): string {
  return input
    .replace(/<sup[\s\S]*?<\/sup>/gi, "")
    .replace(/<i class="footnote"[\s\S]*?<\/i>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function flatten(text: unknown): string[] {
  if (!text) return [];
  if (typeof text === "string") return [stripHtml(text)];
  if (Array.isArray(text)) {
    if (text.length && Array.isArray(text[0])) {
      return (text as unknown[][]).flat().map((t) => stripHtml(String(t ?? "")));
    }
    return (text as unknown[]).map((t) => stripHtml(String(t ?? "")));
  }
  return [];
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Cache (resumability)
// ---------------------------------------------------------------------------

function chapterCachePath(slug: string, chapter: number): string {
  return path.join(CACHE_DIR, slug, `${chapter}.json`);
}

function readCachedChapter<T>(slug: string, chapter: number): T | null {
  const file = chapterCachePath(slug, chapter);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

function writeCachedChapter(slug: string, chapter: number, data: unknown) {
  const file = chapterCachePath(slug, chapter);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data));
}

function shardPath(slug: string): string {
  return path.join(SHARDS_DIR, `${slug}.json`);
}

function doneMarkerPath(slug: string): string {
  return path.join(CACHE_DIR, `${slug}.done.json`);
}

function shardIsComplete(slug: string): { complete: boolean; count: number } {
  if (FORCE) return { complete: false, count: 0 };
  const marker = doneMarkerPath(slug);
  const shard = shardPath(slug);
  if (!fs.existsSync(marker) || !fs.existsSync(shard)) {
    return { complete: false, count: 0 };
  }
  try {
    const meta = JSON.parse(fs.readFileSync(marker, "utf8")) as {
      count: number;
    };
    const records = JSON.parse(fs.readFileSync(shard, "utf8")) as unknown[];
    if (records.length === meta.count && meta.count > 0) {
      return { complete: true, count: meta.count };
    }
  } catch {
    // fall through to re-import
  }
  return { complete: false, count: 0 };
}

function writeShard(slug: string, records: SourceRecord[]) {
  fs.mkdirSync(SHARDS_DIR, { recursive: true });
  fs.writeFileSync(shardPath(slug), JSON.stringify(records));
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(
    doneMarkerPath(slug),
    JSON.stringify({ count: records.length, completedAt: new Date().toISOString() }),
  );
}

// ---------------------------------------------------------------------------
// Sefaria classic API (texts endpoint) for Tanakh + Pirkei Avot + Mesillat Yesharim
// ---------------------------------------------------------------------------

interface ClassicTextResponse {
  ref?: string;
  heRef?: string;
  text?: unknown;
  he?: unknown;
  versionTitle?: string;
  license?: string;
  versionSource?: string;
  heVersionTitle?: string;
  heLicense?: string;
  heVersionSource?: string;
}

async function fetchChapterClassic(
  bookApiName: string,
  chapter: number,
  versionParams: string,
): Promise<ClassicTextResponse> {
  const url = `https://www.sefaria.org/api/texts/${bookApiName}.${chapter}?context=0${versionParams}`;
  return fetchJson<ClassicTextResponse>(url);
}

async function discoverChapterCount(bookApiName: string): Promise<number> {
  try {
    const index = await fetchJson<{
      schema?: { lengths?: number[] };
      lengths?: number[];
    }>(`https://www.sefaria.org/api/v2/raw/index/${bookApiName}`);
    const lengths = index.schema?.lengths || index.lengths;
    if (lengths?.[0]) return lengths[0];
  } catch {
    // fall through to walk
  }
  // Fallback: walk chapters until an empty response is returned.
  let chapter = 1;
  while (chapter < 200) {
    try {
      const res = await fetchChapterClassic(bookApiName, chapter, "");
      const units = flatten(res.text ?? res.he);
      if (!units.length) break;
      chapter += 1;
      await sleep(rateLimitDelay());
    } catch {
      break;
    }
  }
  return chapter - 1;
}

// ---------------------------------------------------------------------------
// Tanakh import (Torah fast-pathed from data/torah/*.json; Prophets +
// Writings fetched fresh from Sefaria).
// ---------------------------------------------------------------------------

interface TorahVerseLegacy {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  ref: string;
  hebrew: string | null;
  english: string;
  englishVersionTitle: string;
  englishLicense: string;
  hebrewVersionTitle: string | null;
  hebrewLicense: string | null;
  sefariaUrl: string;
  importedAt: string;
}

function torahBookToRecords(book: string, importedAt: string): SourceRecord[] {
  const file = path.join(TORAH_DIR, `${book.toLowerCase()}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Fast-path source missing for Torah book: ${file}`);
  }
  const verses = JSON.parse(fs.readFileSync(file, "utf8")) as TorahVerseLegacy[];
  return verses.map((v) => toSourceRecord({
    id: v.id,
    canonicalRef: v.ref,
    hebrewRef: undefined,
    sourceTitle: book,
    sourceCategory: "torah",
    hebrew: v.hebrew ?? "",
    english: v.english,
    englishVersionTitle: v.englishVersionTitle,
    englishLicense: v.englishLicense,
    hebrewVersionTitle: v.hebrewVersionTitle ?? undefined,
    hebrewLicense: v.hebrewLicense ?? undefined,
    sefariaUrl: v.sefariaUrl,
    importedAt: v.importedAt || importedAt,
  }));
}

function toSourceRecord(input: {
  id: string;
  canonicalRef: string;
  hebrewRef?: string;
  sourceTitle: string;
  sourceCategory: SourceCategory;
  hebrew: string;
  english: string;
  englishVersionTitle: string;
  englishLicense: string;
  hebrewVersionTitle?: string;
  hebrewLicense?: string;
  translator?: string;
  sefariaUrl: string;
  importedAt: string;
}): SourceRecord {
  return {
    id: input.id,
    canonicalRef: input.canonicalRef,
    hebrewRef: input.hebrewRef,
    sourceTitle: input.sourceTitle,
    sourceCategory: input.sourceCategory,
    originalLanguage: "hebrew",
    originalText: input.hebrew,
    englishText: input.english || undefined,
    englishIsQuotation: Boolean(input.english),
    englishIsParaphrase: false,
    versionTitle: input.englishVersionTitle,
    translator: input.translator,
    license: input.englishLicense || "unknown",
    hebrewVersionTitle: input.hebrewVersionTitle,
    hebrewLicense: input.hebrewLicense,
    sefariaUrl: input.sefariaUrl,
    topics: [slugify(input.sourceTitle)].filter(Boolean),
    relatedTopics: [],
    keywords: [],
    connectedRefs: [],
    commentaryRefs: [],
    contextBefore: undefined,
    contextAfter: undefined,
    compositionDate: undefined,
    importedAt: input.importedAt,
  };
}

async function importTanakhBookFromNetwork(
  book: string,
  category: SourceCategory,
  importedAt: string,
): Promise<SourceRecord[]> {
  const apiName = book.replace(/\s+/g, "_");
  const slug = slugify(book);
  const chapterCount = await discoverChapterCount(apiName);
  console.log(`  ${book}: ${chapterCount} chapters`);

  const versionParams =
    `&ven=${encodeURIComponent(ENGLISH_VERSION)}&vhe=${encodeURIComponent(HEBREW_VERSION)}`;

  const records: SourceRecord[] = [];
  for (let chapter = 1; chapter <= chapterCount; chapter++) {
    let data = readCachedChapter<ClassicTextResponse>(slug, chapter);
    if (!data) {
      data = await fetchChapterClassic(apiName, chapter, versionParams);
      writeCachedChapter(slug, chapter, data);
      await sleep(rateLimitDelay());
    }

    const englishVerses = flatten(data.text);
    const hebrewVerses = flatten(data.he);
    const count = Math.max(englishVerses.length, hebrewVerses.length);
    if (!count) {
      console.warn(`  empty chapter: ${book} ${chapter}`);
      continue;
    }

    for (let verse = 1; verse <= count; verse++) {
      const english = englishVerses[verse - 1] || "";
      const hebrew = hebrewVerses[verse - 1] || "";
      const ref = `${book} ${chapter}:${verse}`;
      records.push(
        toSourceRecord({
          id: `${slug}-${chapter}-${verse}`,
          canonicalRef: ref,
          sourceTitle: book,
          sourceCategory: category,
          hebrew,
          english,
          englishVersionTitle: data.versionTitle || ENGLISH_VERSION,
          englishLicense: data.license || "unknown",
          hebrewVersionTitle: data.heVersionTitle || HEBREW_VERSION,
          hebrewLicense: data.heLicense || "unknown",
          sefariaUrl: `https://www.sefaria.org/${apiName}.${chapter}.${verse}`,
          importedAt,
        }),
      );
    }
    if (chapter % 10 === 0 || chapter === chapterCount) {
      console.log(`    … ${book} ${chapter}/${chapterCount} (${records.length} units)`);
    }
  }
  return records;
}

// ---------------------------------------------------------------------------
// Pirkei Avot (Mishnah) — default public versions
// ---------------------------------------------------------------------------

async function importPirkeiAvot(importedAt: string): Promise<SourceRecord[]> {
  const apiName = "Pirkei_Avot";
  const slug = "pirkei-avot";
  const chapterCount = await discoverChapterCount(apiName);
  console.log(`  Pirkei Avot: ${chapterCount} chapters`);

  const records: SourceRecord[] = [];
  for (let chapter = 1; chapter <= chapterCount; chapter++) {
    let data = readCachedChapter<ClassicTextResponse>(slug, chapter);
    if (!data) {
      data = await fetchChapterClassic(apiName, chapter, "");
      writeCachedChapter(slug, chapter, data);
      await sleep(rateLimitDelay());
    }

    const englishMishnahs = flatten(data.text);
    const hebrewMishnahs = flatten(data.he);
    const count = Math.max(englishMishnahs.length, hebrewMishnahs.length);
    if (!count) continue;

    for (let mishnah = 1; mishnah <= count; mishnah++) {
      const english = englishMishnahs[mishnah - 1] || "";
      const hebrew = hebrewMishnahs[mishnah - 1] || "";
      const ref = `Pirkei Avot ${chapter}:${mishnah}`;
      records.push(
        toSourceRecord({
          id: `${slug}-${chapter}-${mishnah}`,
          canonicalRef: ref,
          sourceTitle: "Pirkei Avot",
          sourceCategory: "mishnah",
          hebrew,
          english,
          englishVersionTitle: data.versionTitle || "Sefaria default",
          englishLicense: data.license || "unknown",
          hebrewVersionTitle: data.heVersionTitle,
          hebrewLicense: data.heLicense,
          sefariaUrl: `https://www.sefaria.org/${apiName}.${chapter}.${mishnah}`,
          importedAt,
        }),
      );
    }
    console.log(`    … Pirkei Avot ${chapter}/${chapterCount} (${records.length} units)`);
  }
  return records;
}

// ---------------------------------------------------------------------------
// Mesillat Yesharim (ethics) — only if a clearly-licensed version pair exists.
// ---------------------------------------------------------------------------

interface SefariaVersionInfo {
  language?: string;
  versionTitle?: string;
  license?: string;
}

async function findClearLicenseVersions(
  apiName: string,
): Promise<{ en?: SefariaVersionInfo; he?: SefariaVersionInfo }> {
  const versions = await fetchJson<SefariaVersionInfo[]>(
    `https://www.sefaria.org/api/texts/versions/${apiName}`,
  );
  const isClear = (license?: string) =>
    Boolean(license) && license!.toLowerCase() !== "unknown";
  const en = versions.find((v) => v.language === "en" && isClear(v.license));
  const he = versions.find((v) => v.language === "he" && isClear(v.license));
  return { en, he };
}

/** High-value Mishnah tractates for everyday wisdom / ethics / community. */
const MISHNAH_TRACTATES = [
  "Mishnah Berakhot",
  "Mishnah Peah",
  "Mishnah Shabbat",
  "Mishnah Yoma",
  "Mishnah Rosh Hashanah",
  "Mishnah Taanit",
  "Mishnah Megillah",
  "Mishnah Ketubot",
  "Mishnah Nedarim",
  "Mishnah Sotah",
  "Mishnah Gittin",
  "Mishnah Kiddushin",
  "Mishnah Bava Kamma",
  "Mishnah Bava Metzia",
  "Mishnah Bava Batra",
  "Mishnah Sanhedrin",
  "Mishnah Makkot",
  "Mishnah Shevuot",
  "Mishnah Eduyot",
  "Mishnah Avodah Zarah",
  "Mishnah Horayot",
] as const;

const KULP_ENGLISH = "Mishnah Yomit by Dr. Joshua Kulp";
const TORAT_EMET_HEBREW = "Torat Emet 357";

async function importMishnahTractate(
  title: string,
  importedAt: string,
): Promise<SourceRecord[] | null> {
  const apiName = title.replace(/\s+/g, "_");
  const slug = slugify(title);

  const { en, he } = await findClearLicenseVersions(apiName);
  // Prefer Kulp CC-BY when available; otherwise any clear EN + HE pair.
  const versions = await fetchJson<SefariaVersionInfo[]>(
    `https://www.sefaria.org/api/texts/versions/${apiName}`,
  );
  const kulp = versions.find(
    (v) =>
      v.language === "en" &&
      (v.versionTitle || "").includes("Joshua Kulp") &&
      (v.license || "").toUpperCase().includes("CC-BY") &&
      !(v.license || "").toUpperCase().includes("NC"),
  );
  const enPick = kulp || en;
  const hePick =
    versions.find(
      (v) =>
        v.language === "he" &&
        (v.versionTitle || "").includes("Torat Emet") &&
        (v.license || "").toLowerCase().includes("public"),
    ) || he;

  if (!enPick || !hePick) {
    console.log(`  ${title}: skipped (no clearly-licensed EN+HE pair)`);
    return null;
  }
  if ((enPick.license || "").toUpperCase().includes("NC")) {
    console.log(`  ${title}: skipped (English license is non-commercial)`);
    return null;
  }

  console.log(
    `  ${title}: EN="${enPick.versionTitle}" (${enPick.license}); HE="${hePick.versionTitle}" (${hePick.license})`,
  );

  const versionParams =
    `&ven=${encodeURIComponent(enPick.versionTitle || KULP_ENGLISH)}` +
    `&vhe=${encodeURIComponent(hePick.versionTitle || TORAT_EMET_HEBREW)}`;

  const chapterCount = await discoverChapterCount(apiName);
  const records: SourceRecord[] = [];

  for (let chapter = 1; chapter <= chapterCount; chapter++) {
    let data = readCachedChapter<ClassicTextResponse>(slug, chapter);
    if (!data) {
      try {
        data = await fetchChapterClassic(apiName, chapter, versionParams);
      } catch (err) {
        console.warn(`  ${title} ${chapter}: fetch failed (${err})`);
        continue;
      }
      writeCachedChapter(slug, chapter, data);
      await sleep(rateLimitDelay());
    }

    const englishUnits = flatten(data.text);
    const hebrewUnits = flatten(data.he);
    const count = Math.max(englishUnits.length, hebrewUnits.length);
    if (!count) continue;

    for (let unit = 1; unit <= count; unit++) {
      const english = englishUnits[unit - 1] || "";
      const hebrew = hebrewUnits[unit - 1] || "";
      if (!hebrew && !english) continue;
      const ref = `${title} ${chapter}:${unit}`;
      records.push(
        toSourceRecord({
          id: `${slug}-${chapter}-${unit}`,
          canonicalRef: ref,
          sourceTitle: title,
          sourceCategory: "mishnah",
          hebrew,
          english,
          englishVersionTitle: data.versionTitle || enPick.versionTitle || KULP_ENGLISH,
          englishLicense: data.license || enPick.license || "unknown",
          hebrewVersionTitle: data.heVersionTitle || hePick.versionTitle,
          hebrewLicense: data.heLicense || hePick.license,
          sefariaUrl: `https://www.sefaria.org/${apiName}.${chapter}.${unit}`,
          importedAt,
        }),
      );
    }
  }

  return records;
}

async function importDutiesOfTheHeart(
  importedAt: string,
): Promise<SourceRecord[] | null> {
  const apiName = "Duties_of_the_Heart";
  const slug = "duties-of-the-heart";

  const versions = await fetchJson<SefariaVersionInfo[]>(
    `https://www.sefaria.org/api/texts/versions/${apiName}`,
  );
  const en = versions.find(
    (v) =>
      v.language === "en" &&
      (v.versionTitle || "").includes("Sebag") &&
      (v.license || "").toUpperCase().includes("CC-BY") &&
      !(v.license || "").toUpperCase().includes("NC"),
  );
  const he = versions.find(
    (v) =>
      v.language === "he" &&
      (v.versionTitle || "").includes("Vocalized") &&
      (v.license || "").toLowerCase().includes("public"),
  );
  if (!en || !he) {
    console.log("  Duties of the Heart: skipped (no clearly-licensed version pair)");
    return null;
  }
  console.log(
    `  Duties of the Heart: EN="${en.versionTitle}" (${en.license}); HE="${he.versionTitle}" (${he.license})`,
  );

  const versionParams =
    `&ven=${encodeURIComponent(en.versionTitle || "")}` +
    `&vhe=${encodeURIComponent(he.versionTitle || "")}`;

  type IndexNode = {
    title?: string;
    sharedTitle?: string;
    key?: string;
    nodeType?: string;
    depth?: number;
    nodes?: IndexNode[];
  };

  const index = await fetchJson<{ schema: IndexNode }>(
    `https://www.sefaria.org/api/v2/raw/index/${apiName}`,
  );

  const leaves: string[] = [];
  function walk(node: IndexNode, path: string[]) {
    const title = node.title || node.sharedTitle || node.key;
    const next = title && title !== "default" ? [...path, title] : path;
    if (node.nodeType === "JaggedArrayNode") {
      if (title === "default" && path.length) {
        leaves.push(path.join(", "));
      } else if (title && title !== "default") {
        leaves.push([...path, title].join(", "));
      } else if (path.length) {
        leaves.push(path.join(", "));
      }
      return;
    }
    for (const child of node.nodes || []) walk(child, next);
  }
  walk(index.schema, ["Duties of the Heart"]);

  const records: SourceRecord[] = [];
  let leafIndex = 0;

  for (const leaf of leaves) {
    leafIndex += 1;
    // Introductions and simple depth-1 leaves: fetch as a whole section.
    // Chaptered depth-2 leaves: walk chapters until empty.
    const isIntro = /introduction/i.test(leaf) || /addenda/i.test(leaf);
    const maxChapters = isIntro ? 1 : 40;

    for (let chapter = 1; chapter <= maxChapters; chapter++) {
      // Prefer classic texts API with human-readable ref path.
      const urlRef = encodeURIComponent(
        leaf.startsWith("Duties of the Heart")
          ? leaf
          : `Duties of the Heart, ${leaf}`,
      );

      let data = readCachedChapter<ClassicTextResponse>(
        slug,
        leafIndex * 100 + chapter,
      );
      if (!data) {
        try {
          const url = `https://www.sefaria.org/api/texts/${urlRef}${isIntro ? "" : `.${chapter}`}?context=0${versionParams}`;
          data = await fetchJson<ClassicTextResponse>(url);
        } catch {
          try {
            const alt = leaf
              .replace(/^Duties of the Heart,?\s*/, "Duties_of_the_Heart,")
              .replace(/, /g, ",")
              .replace(/ /g, "_");
            const url = `https://www.sefaria.org/api/texts/${alt}${isIntro ? "" : `.${chapter}`}?context=0${versionParams}`;
            data = await fetchJson<ClassicTextResponse>(url);
          } catch {
            break;
          }
        }
        writeCachedChapter(slug, leafIndex * 100 + chapter, data);
        await sleep(rateLimitDelay());
      }

      const englishUnits = flatten(data.text);
      const hebrewUnits = flatten(data.he);
      const count = Math.max(englishUnits.length, hebrewUnits.length);
      if (!count) break;

      for (let unit = 1; unit <= count; unit++) {
        const english = englishUnits[unit - 1] || "";
        const hebrew = hebrewUnits[unit - 1] || "";
        if (!hebrew && !english) continue;
        const ref = isIntro
          ? `${leaf} ${unit}`
          : `${leaf} ${chapter}:${unit}`;
        records.push(
          toSourceRecord({
            id: `${slug}-${slugify(ref)}`,
            canonicalRef: ref,
            sourceTitle: "Duties of the Heart",
            sourceCategory: "philosophy",
            hebrew,
            english,
            englishVersionTitle: data.versionTitle || en.versionTitle || "unknown",
            englishLicense: data.license || en.license || "unknown",
            hebrewVersionTitle: data.heVersionTitle || he.versionTitle,
            hebrewLicense: data.heLicense || he.license,
            translator: "Rabbi Yosef Sebag",
            sefariaUrl: `https://www.sefaria.org/${encodeURIComponent(ref.replace(/ /g, "_"))}`,
            importedAt,
          }),
        );
      }

      if (isIntro) break;
      console.log(`    … ${leaf} ch.${chapter} (${records.length} units so far)`);
    }
  }

  return records;
}

async function importMesillatYesharim(importedAt: string): Promise<SourceRecord[] | null> {
  const apiName = "Mesillat_Yesharim";
  const slug = "mesillat-yesharim";

  const { en, he } = await findClearLicenseVersions(apiName);
  if (!en || !he) {
    console.log("  Mesillat Yesharim: skipped (no clearly-licensed version pair found)");
    return null;
  }
  console.log(
    `  Mesillat Yesharim license OK: EN="${en.versionTitle}" (${en.license}); HE="${he.versionTitle}" (${he.license})`,
  );

  const versionParams =
    `&ven=${encodeURIComponent(en.versionTitle || "")}&vhe=${encodeURIComponent(he.versionTitle || "")}`;

  const records: SourceRecord[] = [];
  let chapter = 1;
  const MAX_CHAPTERS = 40;
  while (chapter <= MAX_CHAPTERS) {
    let data = readCachedChapter<ClassicTextResponse>(slug, chapter);
    if (!data) {
      try {
        data = await fetchChapterClassic(apiName, chapter, versionParams);
      } catch {
        break;
      }
      writeCachedChapter(slug, chapter, data);
      await sleep(rateLimitDelay());
    }

    const englishParas = flatten(data.text);
    const hebrewParas = flatten(data.he);
    const count = Math.max(englishParas.length, hebrewParas.length);
    if (!count) break;

    for (let para = 1; para <= count; para++) {
      const english = englishParas[para - 1] || "";
      const hebrew = hebrewParas[para - 1] || "";
      const ref = `Mesillat Yesharim ${chapter}:${para}`;
      records.push(
        toSourceRecord({
          id: `${slug}-${chapter}-${para}`,
          canonicalRef: ref,
          sourceTitle: "Mesillat Yesharim",
          sourceCategory: "ethics",
          hebrew,
          english,
          englishVersionTitle: data.versionTitle || en.versionTitle || "unknown",
          englishLicense: data.license || en.license || "unknown",
          hebrewVersionTitle: data.heVersionTitle || he.versionTitle,
          hebrewLicense: data.heLicense || he.license,
          sefariaUrl: `https://www.sefaria.org/${apiName}.${chapter}.${para}`,
          importedAt,
        }),
      );
    }
    console.log(`    … Mesillat Yesharim ${chapter} (${records.length} units so far)`);
    chapter += 1;
  }
  return records;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function importCollection(
  slug: string,
  title: string,
  category: SourceCategory,
  importFn: () => Promise<SourceRecord[] | null>,
): Promise<LibraryCollectionSummary | null> {
  const existing = shardIsComplete(slug);
  if (existing.complete) {
    console.log(`\nSkipping ${title} (already complete: ${existing.count} units). Set FORCE=1 to re-import.`);
    const records = JSON.parse(fs.readFileSync(shardPath(slug), "utf8")) as SourceRecord[];
    return summarize(slug, title, category, records);
  }

  console.log(`\nImporting ${title}…`);
  const records = await importFn();
  if (!records || !records.length) {
    console.log(`  ${title}: no records (skipped or empty)`);
    return null;
  }
  writeShard(slug, records);
  console.log(`  wrote ${records.length} records -> data/library/shards/${slug}.json`);
  return summarize(slug, title, category, records);
}

function summarize(
  slug: string,
  title: string,
  category: SourceCategory,
  records: SourceRecord[],
): LibraryCollectionSummary {
  const first = records[0];
  return {
    slug,
    title,
    category,
    units: records.length,
    englishVersionTitle: first?.versionTitle,
    englishLicense: first?.license,
    hebrewVersionTitle: first?.hebrewVersionTitle,
    hebrewLicense: first?.hebrewLicense,
  };
}

async function main() {
  fs.mkdirSync(SHARDS_DIR, { recursive: true });
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const importedAt = new Date().toISOString();

  const collections: LibraryCollectionSummary[] = [];

  // --- Torah: fast path from existing data/torah/*.json -------------------
  console.log("=== Torah (fast path from data/torah/*.json) ===");
  for (const book of TORAH_BOOKS) {
    const slug = slugify(book);
    const summary = await importCollection(slug, book, "torah", async () =>
      torahBookToRecords(book, importedAt),
    );
    if (summary) collections.push(summary);
  }

  // --- Prophets -------------------------------------------------------------
  console.log("\n=== Prophets ===");
  for (const book of PROPHETS_BOOKS) {
    const slug = slugify(book);
    const summary = await importCollection(slug, book, "prophets", () =>
      importTanakhBookFromNetwork(book, "prophets", importedAt),
    );
    if (summary) collections.push(summary);
  }

  // --- Writings -------------------------------------------------------------
  console.log("\n=== Writings ===");
  for (const book of WRITINGS_BOOKS) {
    const slug = slugify(book);
    const summary = await importCollection(slug, book, "writings", () =>
      importTanakhBookFromNetwork(book, "writings", importedAt),
    );
    if (summary) collections.push(summary);
  }

  // --- Pirkei Avot ------------------------------------------------------------
  console.log("\n=== Pirkei Avot ===");
  {
    const summary = await importCollection("pirkei-avot", "Pirkei Avot", "mishnah", () =>
      importPirkeiAvot(importedAt),
    );
    if (summary) collections.push(summary);
  }

  // --- Mesillat Yesharim (optional) -------------------------------------------
  console.log("\n=== Mesillat Yesharim (optional) ===");
  {
    const summary = await importCollection(
      "mesillat-yesharim",
      "Mesillat Yesharim",
      "ethics",
      () => importMesillatYesharim(importedAt),
    );
    if (summary) collections.push(summary);
  }

  // --- Selected Mishnah (CC-BY Kulp + PD Hebrew) -------------------------------
  console.log("\n=== Selected Mishnah ===");
  for (const title of MISHNAH_TRACTATES) {
    const slug = slugify(title);
    const summary = await importCollection(slug, title, "mishnah", () =>
      importMishnahTractate(title, importedAt),
    );
    if (summary) collections.push(summary);
  }

  // --- Duties of the Heart (optional ethics / philosophy) ---------------------
  console.log("\n=== Duties of the Heart (optional) ===");
  {
    const summary = await importCollection(
      "duties-of-the-heart",
      "Duties of the Heart",
      "philosophy",
      () => importDutiesOfTheHeart(importedAt),
    );
    if (summary) collections.push(summary);
  }

  // --- Manifest ---------------------------------------------------------------
  const totalRecords = collections.reduce((sum, c) => sum + c.units, 0);
  const licenses = Array.from(
    new Set(
      collections.flatMap((c) => [c.englishLicense, c.hebrewLicense].filter(Boolean) as string[]),
    ),
  ).sort();

  const manifest: LibraryManifest = {
    importedAt,
    totals: {
      collections: collections.length,
      records: totalRecords,
    },
    collections,
    licenses,
  };

  fs.writeFileSync(
    path.join(ROOT, "data", "library", "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  console.log("\n=== Library import complete ===");
  console.log(`Collections: ${manifest.totals.collections}`);
  console.log(`Total records: ${manifest.totals.records}`);
  console.log(`Licenses observed: ${manifest.licenses.join(", ")}`);
  for (const c of collections) {
    console.log(`  ${c.slug}: ${c.units} units (${c.category})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
