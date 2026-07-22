import fs from "node:fs";
import path from "node:path";
import type { LibraryManifest, SourceRecord } from "./types";

const LIBRARY_DIR = path.join(process.cwd(), "data", "library");
const SHARDS_DIR = path.join(LIBRARY_DIR, "shards");
const MANIFEST_FILE = path.join(LIBRARY_DIR, "manifest.json");

let cachedManifest: LibraryManifest | null = null;
let cachedRecords: SourceRecord[] | null = null;
const cachedShards = new Map<string, SourceRecord[]>();
let cachedById: Map<string, SourceRecord> | null = null;
let cachedByRef: Map<string, SourceRecord> | null = null;

export function loadManifest(): LibraryManifest {
  if (cachedManifest) return cachedManifest;
  if (!fs.existsSync(MANIFEST_FILE)) {
    throw new Error(
      "Library corpus missing. Run: npx tsx scripts/import-library.ts",
    );
  }
  cachedManifest = JSON.parse(
    fs.readFileSync(MANIFEST_FILE, "utf8"),
  ) as LibraryManifest;
  return cachedManifest;
}

export function loadShard(slug: string): SourceRecord[] {
  const cached = cachedShards.get(slug);
  if (cached) return cached;
  const file = path.join(SHARDS_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing library shard: ${file}`);
  }
  const records = JSON.parse(fs.readFileSync(file, "utf8")) as SourceRecord[];
  cachedShards.set(slug, records);
  return records;
}

export function getAllSourceRecords(): SourceRecord[] {
  if (cachedRecords) return cachedRecords;
  const manifest = loadManifest();
  const records: SourceRecord[] = [];
  for (const collection of manifest.collections) {
    records.push(...loadShard(collection.slug));
  }
  cachedRecords = records;
  return records;
}

export function corpusIsAvailable(): boolean {
  try {
    loadManifest();
    return true;
  } catch {
    return false;
  }
}

export function getSourceById(id: string): SourceRecord | undefined {
  if (!cachedById) {
    cachedById = new Map();
    for (const record of getAllSourceRecords()) {
      cachedById.set(record.id, record);
    }
  }
  return cachedById.get(id);
}

export function getSourceByRef(ref: string): SourceRecord | undefined {
  if (!cachedByRef) {
    cachedByRef = new Map();
    for (const record of getAllSourceRecords()) {
      cachedByRef.set(record.canonicalRef.toLowerCase(), record);
    }
  }
  return cachedByRef.get(ref.toLowerCase());
}
