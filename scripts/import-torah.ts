/**
 * Import the complete Five Books of Moses from Sefaria into a local corpus.
 *
 * English: The Holy Scriptures: A New Translation (JPS 1917) — Public Domain
 * Hebrew:  Tanach with Nikkud — Public Domain
 *
 * Usage: npx tsx scripts/import-torah.ts
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data", "torah");

const BOOKS = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
] as const;

const ENGLISH_VERSION =
  "The Holy Scriptures: A New Translation (JPS 1917)";
const HEBREW_VERSION = "Tanach with Nikkud";

const USER_AGENT = "TorokCorpusBuilder/1.0 (educational; contact via GitHub franktorok3/torok)";

interface SefariaVersionPayload {
  versionTitle?: string;
  license?: string;
  versionSource?: string;
  language?: string;
  text?: string | string[] | string[][];
}

interface SefariaV3Response {
  versions?: SefariaVersionPayload[];
}

export interface TorahVerse {
  id: string;
  book: (typeof BOOKS)[number];
  chapter: number;
  verse: number;
  ref: string;
  hebrew: string | null;
  english: string;
  englishVersionTitle: string;
  englishLicense: string;
  englishVersionSource: string;
  hebrewVersionTitle: string | null;
  hebrewLicense: string | null;
  sefariaUrl: string;
  topics: string[];
  keywords: string[];
  searchText: string;
  relatedTeachingIds: string[];
  importedAt: string;
  sourceVersion: string;
}

interface BookManifest {
  book: string;
  chapters: number;
  verses: number;
  englishVersionTitle: string;
  englishLicense: string;
  hebrewVersionTitle: string | null;
  hebrewLicense: string | null;
}

interface CorpusManifest {
  coverage: "complete-torah";
  definition: "Genesis through Deuteronomy (Five Books of Moses), every chapter and verse available from the selected Sefaria versions.";
  notClaimed: [
    "Tanakh (Prophets and Writings)",
    "Rabbinic literature completeness",
    "Editorial interpretation of every verse",
  ];
  importedAt: string;
  englishVersionTitle: string;
  englishLicense: string;
  englishVersionSource: string;
  hebrewVersionTitle: string;
  hebrewLicense: string;
  endpoints: {
    versions: string;
    textsV3: string;
  };
  books: BookManifest[];
  totals: {
    books: number;
    chapters: number;
    verses: number;
  };
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

function flattenText(text: SefariaVersionPayload["text"]): string[] {
  if (!text) return [];
  if (typeof text === "string") return [stripHtml(text)].filter(Boolean);
  if (Array.isArray(text)) {
    // chapter fetch returns string[]; book fetch may return string[][]
    if (text.length && Array.isArray(text[0])) {
      return (text as string[][]).flat().map(stripHtml).filter(Boolean);
    }
    return (text as string[]).map(stripHtml).filter(Boolean);
  }
  return [];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return (await res.json()) as T;
}

async function fetchChapter(
  book: string,
  chapter: number,
  language: "english" | "hebrew",
  versionTitle: string,
): Promise<{ verses: string[]; license: string; source: string; title: string }> {
  const versionParam = encodeURIComponent(`${language}|${versionTitle}`);
  const url = `https://www.sefaria.org/api/v3/texts/${book}.${chapter}?version=${versionParam}`;
  const data = await fetchJson<SefariaV3Response>(url);
  const version = data.versions?.[0];
  if (!version) {
    throw new Error(`No version returned for ${book} ${chapter} (${versionTitle})`);
  }
  return {
    verses: flattenText(version.text),
    license: version.license || "unknown",
    source: version.versionSource || "https://www.sefaria.org",
    title: version.versionTitle || versionTitle,
  };
}

async function discoverChapterCount(book: string): Promise<number> {
  // Index endpoint gives schema lengths
  const index = await fetchJson<{
    schema?: { lengths?: number[] };
    lengths?: number[];
  }>(`https://www.sefaria.org/api/v2/raw/index/${encodeURIComponent(book)}`);
  const lengths = index.schema?.lengths || index.lengths;
  if (lengths?.[0]) return lengths[0];

  // Fallback: walk until empty
  let chapter = 1;
  while (chapter < 200) {
    try {
      const en = await fetchChapter(book, chapter, "english", ENGLISH_VERSION);
      if (!en.verses.length) break;
      chapter += 1;
    } catch {
      break;
    }
  }
  return chapter - 1;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function importBook(book: (typeof BOOKS)[number], importedAt: string) {
  console.log(`\nImporting ${book}…`);
  const chapterCount = await discoverChapterCount(book);
  console.log(`  chapters: ${chapterCount}`);

  const verses: TorahVerse[] = [];
  let englishLicense = "Public Domain";
  let englishSource = "";
  let hebrewLicense: string | null = null;
  let hebrewTitle: string | null = null;

  for (let chapter = 1; chapter <= chapterCount; chapter++) {
    const en = await fetchChapter(book, chapter, "english", ENGLISH_VERSION);
    await sleep(80);
    let heVerses: string[] = [];
    try {
      const he = await fetchChapter(book, chapter, "hebrew", HEBREW_VERSION);
      heVerses = he.verses;
      hebrewLicense = he.license;
      hebrewTitle = he.title;
      await sleep(80);
    } catch (err) {
      console.warn(`  Hebrew missing for ${book} ${chapter}:`, err);
    }

    englishLicense = en.license;
    englishSource = en.source;

    const count = en.verses.length;
    if (!count) {
      throw new Error(`Empty English chapter: ${book} ${chapter}`);
    }

    for (let verse = 1; verse <= count; verse++) {
      const english = en.verses[verse - 1] || "";
      const hebrew = heVerses[verse - 1] || null;
      const ref = `${book} ${chapter}:${verse}`;
      const id = `${book.toLowerCase()}-${chapter}-${verse}`;
      verses.push({
        id,
        book,
        chapter,
        verse,
        ref,
        hebrew,
        english,
        englishVersionTitle: ENGLISH_VERSION,
        englishLicense: en.license,
        englishVersionSource: en.source,
        hebrewVersionTitle: hebrew ? hebrewTitle : null,
        hebrewLicense: hebrew ? hebrewLicense : null,
        sefariaUrl: `https://www.sefaria.org/${book}.${chapter}.${verse}`,
        topics: [],
        keywords: [],
        searchText: `${ref} ${english}`.toLowerCase(),
        relatedTeachingIds: [],
        importedAt,
        sourceVersion: `sefaria:${ENGLISH_VERSION}`,
      });
    }
    if (chapter % 5 === 0 || chapter === chapterCount) {
      console.log(`  … ${book} ${chapter}/${chapterCount} (${verses.length} verses)`);
    }
  }

  const outFile = path.join(OUT_DIR, `${book.toLowerCase()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(verses));
  console.log(`  wrote ${outFile} (${verses.length} verses)`);

  return {
    book,
    chapters: chapterCount,
    verses: verses.length,
    englishVersionTitle: ENGLISH_VERSION,
    englishLicense,
    englishVersionSource: englishSource,
    hebrewVersionTitle: hebrewTitle,
    hebrewLicense,
    verseRecords: verses,
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const importedAt = new Date().toISOString();

  // Confirm licenses before import
  for (const book of BOOKS) {
    const versions = await fetchJson<
      Array<{ versionTitle?: string; license?: string; language?: string }>
    >(`https://www.sefaria.org/api/texts/versions/${book}`);
    const en = versions.find((v) => v.versionTitle === ENGLISH_VERSION);
    const he = versions.find((v) => v.versionTitle === HEBREW_VERSION);
    if (!en || (en.license || "").toLowerCase() !== "public domain") {
      throw new Error(
        `Refusing to import ${book}: English version not Public Domain (${en?.license})`,
      );
    }
    if (!he || (he.license || "").toLowerCase() !== "public domain") {
      throw new Error(
        `Refusing to import ${book}: Hebrew version not Public Domain (${he?.license})`,
      );
    }
    console.log(`License OK ${book}: EN=${en.license}; HE=${he.license}`);
  }

  const bookResults = [];
  const allVerses: TorahVerse[] = [];

  for (const book of BOOKS) {
    const result = await importBook(book, importedAt);
    bookResults.push(result);
    allVerses.push(...result.verseRecords);
  }

  // Compact search index: id, ref, book, chapter, verse, searchText, english snippet
  const searchIndex = allVerses.map((v) => ({
    id: v.id,
    ref: v.ref,
    book: v.book,
    chapter: v.chapter,
    verse: v.verse,
    searchText: v.searchText,
    english: v.english,
    sefariaUrl: v.sefariaUrl,
  }));

  fs.writeFileSync(
    path.join(OUT_DIR, "search-index.json"),
    JSON.stringify(searchIndex),
  );

  const manifest: CorpusManifest = {
    coverage: "complete-torah",
    definition:
      "Genesis through Deuteronomy (Five Books of Moses), every chapter and verse available from the selected Sefaria versions.",
    notClaimed: [
      "Tanakh (Prophets and Writings)",
      "Rabbinic literature completeness",
      "Editorial interpretation of every verse",
    ],
    importedAt,
    englishVersionTitle: ENGLISH_VERSION,
    englishLicense: "Public Domain",
    englishVersionSource:
      bookResults[0]?.englishVersionSource ||
      "http://opensiddur.org/2010/08/תנ״ך-the-holy-scriptures-a-new-translation-jps-1917/",
    hebrewVersionTitle: HEBREW_VERSION,
    hebrewLicense: "Public Domain",
    endpoints: {
      versions: "https://www.sefaria.org/api/texts/versions/{book}",
      textsV3:
        "https://www.sefaria.org/api/v3/texts/{book}.{chapter}?version={language}|{versionTitle}",
    },
    books: bookResults.map((b) => ({
      book: b.book,
      chapters: b.chapters,
      verses: b.verses,
      englishVersionTitle: b.englishVersionTitle,
      englishLicense: b.englishLicense,
      hebrewVersionTitle: b.hebrewVersionTitle,
      hebrewLicense: b.hebrewLicense,
    })),
    totals: {
      books: BOOKS.length,
      chapters: bookResults.reduce((sum, b) => sum + b.chapters, 0),
      verses: allVerses.length,
    },
  };

  fs.writeFileSync(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  console.log("\nCorpus import complete");
  console.log(JSON.stringify(manifest.totals, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
