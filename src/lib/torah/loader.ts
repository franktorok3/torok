import fs from "node:fs";
import path from "node:path";
import type { TorahCorpusManifest, TorahVerse } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "torah");

const BOOKS = [
  "genesis",
  "exodus",
  "leviticus",
  "numbers",
  "deuteronomy",
] as const;

let cachedVerses: TorahVerse[] | null = null;
let cachedManifest: TorahCorpusManifest | null = null;
let cachedByRef: Map<string, TorahVerse> | null = null;

export function getTorahManifest(): TorahCorpusManifest {
  if (cachedManifest) return cachedManifest;
  const file = path.join(DATA_DIR, "manifest.json");
  if (!fs.existsSync(file)) {
    throw new Error(
      "Torah corpus missing. Run: npx tsx scripts/import-torah.ts",
    );
  }
  cachedManifest = JSON.parse(
    fs.readFileSync(file, "utf8"),
  ) as TorahCorpusManifest;
  return cachedManifest;
}

export function getAllTorahVerses(): TorahVerse[] {
  if (cachedVerses) return cachedVerses;
  const verses: TorahVerse[] = [];
  for (const book of BOOKS) {
    const file = path.join(DATA_DIR, `${book}.json`);
    if (!fs.existsSync(file)) {
      throw new Error(`Missing Torah book file: ${file}`);
    }
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as TorahVerse[];
    verses.push(...parsed);
  }
  cachedVerses = verses;
  return verses;
}

export function getVerseByRef(ref: string): TorahVerse | undefined {
  if (!cachedByRef) {
    cachedByRef = new Map();
    for (const verse of getAllTorahVerses()) {
      cachedByRef.set(verse.ref.toLowerCase(), verse);
      cachedByRef.set(verse.id, verse);
    }
  }
  return cachedByRef.get(ref.toLowerCase());
}

export function corpusIsAvailable(): boolean {
  try {
    getTorahManifest();
    return true;
  } catch {
    return false;
  }
}
