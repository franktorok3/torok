/**
 * Fetch verified original-language text for each curated teaching from Sefaria.
 * Never fabricates text — missing fetches are recorded as incomplete.
 *
 * Usage: npx tsx scripts/enrich-curated-originals.ts
 */
import fs from "node:fs";
import path from "node:path";
import { TEACHINGS } from "../src/lib/wisdom/teachings";
import type { OriginalLanguage } from "../src/lib/wisdom/types";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "curated-originals.json");
const USER_AGENT =
  "TorokCuratedEnricher/1.0 (educational; contact via GitHub franktorok3/torok)";

const JPS =
  "The Holy Scriptures: A New Translation (JPS 1917)";
const TANACH_NIKKUD = "Tanach with Nikkud";

export interface CuratedOriginalRecord {
  teachingId: string;
  canonical: string;
  sefariaRef: string | null;
  originalLanguage: OriginalLanguage | null;
  originalText: string | null;
  originalEdition: string | null;
  originalLicense: string | null;
  englishText: string | null;
  englishEdition: string | null;
  englishLicense: string | null;
  status: "complete" | "incomplete";
  incompleteReason?: string;
  fetchedAt: string;
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

function flattenHeOrEn(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const t = stripHtml(value);
    return t || null;
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((v) => (typeof v === "string" ? stripHtml(v) : ""))
      .filter(Boolean);
    return parts.length ? parts.join("\n") : null;
  }
  return null;
}

function sefariaRefFromUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!u.hostname.includes("sefaria")) return null;
    let p = decodeURIComponent(u.pathname.replace(/^\//, ""));
    p = p.replace(/\/$/, "");
    // Drop deep anchors / extra path after first segment for some siddur URLs
    if (!p) return null;
    return p;
  } catch {
    return null;
  }
}

function guessOriginalLanguage(
  sefariaRef: string,
  category?: string,
): OriginalLanguage {
  if (/Sotah|Talmud|Bavli|Berakhot|Shabbat/i.test(sefariaRef)) {
    return "aramaic";
  }
  if (category === "rabbinic" && /Sotah|Talmud/i.test(sefariaRef)) {
    return "aramaic";
  }
  return "hebrew";
}

async function fetchText(
  sefariaRef: string,
  preferTanakhVersions: boolean,
): Promise<{
  he: string | null;
  en: string | null;
  heVersion: string | null;
  enVersion: string | null;
  heLicense: string | null;
  enLicense: string | null;
}> {
  const params = new URLSearchParams({ context: "0" });
  if (preferTanakhVersions) {
    params.set("ven", JPS);
    params.set("vhe", TANACH_NIKKUD);
  }
  const url = `https://www.sefaria.org/api/texts/${encodeURI(
    sefariaRef,
  )}?${params.toString()}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${sefariaRef}`);
  }
  const data = (await res.json()) as Record<string, unknown>;
  const he = flattenHeOrEn(data.he);
  const en = flattenHeOrEn(data.text);
  return {
    he,
    en,
    heVersion: (data.heVersionTitle as string) || null,
    enVersion: (data.versionTitle as string) || null,
    heLicense: null,
    enLicense: preferTanakhVersions ? "Public Domain" : null,
  };
}

function isTanakhRef(ref: string): boolean {
  return /^(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|I Samuel|II Samuel|I Kings|II Kings|Isaiah|Jeremiah|Ezekiel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Psalms|Proverbs|Job|Song of Songs|Ruth|Lamentations|Ecclesiastes|Esther|Daniel|Ezra|Nehemiah|I Chronicles|II Chronicles)\./i.test(
    ref,
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const fetchedAt = new Date().toISOString();
  const records: Record<string, CuratedOriginalRecord> = {};

  console.log(`Enriching ${TEACHINGS.length} curated teachings…`);

  for (const teaching of TEACHINGS) {
    const primary = teaching.sources[0];
    const sefariaRef = sefariaRefFromUrl(primary?.url);
    const base: CuratedOriginalRecord = {
      teachingId: teaching.id,
      canonical: primary?.canonical ?? "",
      sefariaRef,
      originalLanguage: null,
      originalText: null,
      originalEdition: null,
      originalLicense: null,
      englishText: null,
      englishEdition: null,
      englishLicense: null,
      status: "incomplete",
      fetchedAt,
    };

    if (!sefariaRef) {
      base.incompleteReason = "No Sefaria URL to resolve original text";
      records[teaching.id] = base;
      console.log(`  ✗ ${teaching.id}: no Sefaria ref`);
      continue;
    }

    try {
      const preferTanakh = isTanakhRef(sefariaRef);
      const result = await fetchText(sefariaRef, preferTanakh);
      await sleep(100);

      if (!result.he) {
        base.incompleteReason = "Sefaria returned no original-language text";
        base.englishText = result.en;
        base.englishEdition = result.enVersion;
        records[teaching.id] = base;
        console.log(`  ✗ ${teaching.id}: no original text (${sefariaRef})`);
        continue;
      }

      const lang = guessOriginalLanguage(sefariaRef, primary?.category);
      base.originalLanguage = lang;
      base.originalText = result.he;
      base.originalEdition =
        result.heVersion ||
        (preferTanakh ? TANACH_NIKKUD : "Sefaria Hebrew/Aramaic text");
      base.originalLicense = preferTanakh
        ? "Public Domain"
        : result.heLicense || "See Sefaria version page";
      base.englishText = result.en;
      base.englishEdition =
        result.enVersion || (preferTanakh ? JPS : null);
      base.englishLicense = preferTanakh
        ? "Public Domain"
        : result.enLicense || null;
      base.status = "complete";
      records[teaching.id] = base;
      console.log(
        `  ✓ ${teaching.id}: ${lang} (${result.he.slice(0, 28).replace(/\n/g, " ")}…)`,
      );
    } catch (err) {
      base.incompleteReason =
        err instanceof Error ? err.message : "Fetch failed";
      records[teaching.id] = base;
      console.log(`  ✗ ${teaching.id}: ${base.incompleteReason}`);
    }
  }

  const complete = Object.values(records).filter((r) => r.status === "complete")
    .length;
  const incomplete = Object.values(records).filter(
    (r) => r.status === "incomplete",
  ).length;

  const payload = {
    importedAt: fetchedAt,
    totals: {
      teachings: TEACHINGS.length,
      complete,
      incomplete,
      hebrew: Object.values(records).filter(
        (r) => r.status === "complete" && r.originalLanguage === "hebrew",
      ).length,
      aramaic: Object.values(records).filter(
        (r) => r.status === "complete" && r.originalLanguage === "aramaic",
      ).length,
    },
    records,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log(`\nWrote ${OUT}`);
  console.log(
    `Complete: ${complete} · Incomplete: ${incomplete} · Hebrew: ${payload.totals.hebrew} · Aramaic: ${payload.totals.aramaic}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
