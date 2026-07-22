/**
 * Local Jewish wisdom library corpus types.
 *
 * This is a broader, resumable Sefaria import covering the complete Tanakh
 * (Torah, Prophets, Writings), Pirkei Avot, and (optionally) Mesillat
 * Yesharim, stored as one SourceRecord per verse/mishnah/paragraph.
 */

export type SourceCategory =
  | "torah"
  | "prophets"
  | "writings"
  | "mishnah"
  | "talmud"
  | "midrash"
  | "commentary"
  | "ethics"
  | "philosophy"
  | "later";

export type OriginalLanguage = "hebrew" | "aramaic" | "other";

/** Provenance for a topic↔passage link. Lexical inference is never “verified”. */
export type TopicRelationshipSource =
  | "sefaria-topic-link"
  | "sefaria-related"
  | "curated"
  | "title-metadata"
  | "lexical-inference";

export type TopicRelationship = {
  topic: string;
  source: TopicRelationshipSource;
  confidence: number;
};

export type PassageKind = "prescriptive" | "narrative" | "mixed" | "unknown";

export type SourceRecord = {
  id: string;
  canonicalRef: string;
  hebrewRef?: string;
  sourceTitle: string;
  sourceCategory: SourceCategory;
  originalLanguage: OriginalLanguage;
  originalText: string;
  englishText?: string;
  englishIsQuotation: boolean;
  englishIsParaphrase: boolean;
  versionTitle?: string;
  translator?: string;
  license: string;
  hebrewVersionTitle?: string;
  hebrewLicense?: string;
  sefariaUrl: string;
  /**
   * Convenience list of topic slugs (authoritative + curated first).
   * Prefer `topicRelationships` when provenance matters.
   */
  topics: string[];
  relatedTopics: string[];
  keywords: string[];
  topicRelationships?: TopicRelationship[];
  /** Heuristic: teaching/advice vs narrative depiction. */
  passageKind?: PassageKind;
  connectedRefs: string[];
  commentaryRefs: string[];
  contextBefore?: string;
  contextAfter?: string;
  compositionDate?: string;
  importedAt: string;
};

export type LibraryCollectionSummary = {
  slug: string;
  title: string;
  category: SourceCategory;
  units: number;
  englishVersionTitle?: string;
  englishLicense?: string;
  hebrewVersionTitle?: string;
  hebrewLicense?: string;
};

export type LibraryManifest = {
  importedAt: string;
  totals: {
    collections: number;
    records: number;
    topics?: number;
    topicsWithPassages?: number;
    sourceTopicRelationships?: number;
    authoritativeRelationships?: number;
    lexicalRelationships?: number;
  };
  collections: LibraryCollectionSummary[];
  licenses: string[];
};
