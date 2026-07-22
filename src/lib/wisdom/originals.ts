import fs from "node:fs";
import path from "node:path";
import type { OriginalLanguage, Teaching } from "./types";

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

interface CuratedOriginalsFile {
  importedAt: string;
  totals: {
    teachings: number;
    complete: number;
    incomplete: number;
    hebrew: number;
    aramaic: number;
  };
  records: Record<string, CuratedOriginalRecord>;
}

let cached: CuratedOriginalsFile | null | undefined;

function originalsPath(): string {
  return path.join(process.cwd(), "data", "curated-originals.json");
}

export function loadCuratedOriginals(): CuratedOriginalsFile | null {
  if (cached !== undefined) return cached;
  try {
    const raw = fs.readFileSync(originalsPath(), "utf8");
    cached = JSON.parse(raw) as CuratedOriginalsFile;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export function hasVerifiedOriginal(teaching: Teaching): boolean {
  const primary = teaching.sources[0];
  if (primary?.hebrew?.trim()) return true;
  const file = loadCuratedOriginals();
  const rec = file?.records[teaching.id];
  return Boolean(rec?.status === "complete" && rec.originalText?.trim());
}

/**
 * Merge verified originals from data/curated-originals.json onto teachings.
 * Does not fabricate — incomplete records only set sourceIncomplete.
 */
export function applyCuratedOriginals(teachings: Teaching[]): Teaching[] {
  const file = loadCuratedOriginals();
  if (!file) {
    return teachings.map((t) => ({
      ...t,
      sourceIncomplete: !t.sources[0]?.hebrew?.trim(),
    }));
  }

  return teachings.map((teaching) => {
    const rec = file.records[teaching.id];
    const primary = teaching.sources[0];
    if (!primary) {
      return { ...teaching, sourceIncomplete: true };
    }

    // Prefer already-curated inline hebrew; fill metadata from file when possible
    if (primary.hebrew?.trim()) {
      const rec = file.records[teaching.id];
      return {
        ...teaching,
        sources: [
          {
            ...primary,
            originalLanguage:
              primary.originalLanguage ??
              rec?.originalLanguage ??
              "hebrew",
            originalEdition:
              primary.originalEdition ?? rec?.originalEdition ?? null,
            originalLicense:
              primary.originalLicense ??
              rec?.originalLicense ??
              (rec?.originalLanguage ? "See Sefaria version page" : null),
            english: primary.english?.trim()
              ? primary.english
              : rec?.englishText ?? primary.english,
          },
          ...teaching.sources.slice(1),
        ],
        sourceIncomplete: false,
      };
    }

    if (!rec || rec.status !== "complete" || !rec.originalText?.trim()) {
      return {
        ...teaching,
        sourceIncomplete: true,
      };
    }

    return {
      ...teaching,
      sources: [
        {
          ...primary,
          hebrew: rec.originalText,
          originalLanguage: rec.originalLanguage ?? "hebrew",
          originalEdition: rec.originalEdition,
          originalLicense: rec.originalLicense,
          english: primary.english?.trim()
            ? primary.english
            : rec.englishText,
          englishKind: primary.englishKind ?? (rec.englishText ? "quotation" : primary.englishKind),
          attribution:
            primary.attribution ??
            (rec.englishEdition
              ? `${rec.englishEdition}${rec.englishLicense ? ` · ${rec.englishLicense}` : ""}`
              : primary.attribution),
        },
        ...teaching.sources.slice(1),
      ],
      sourceIncomplete: false,
    };
  });
}
