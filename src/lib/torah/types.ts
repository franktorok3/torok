export type TorahBook =
  | "Genesis"
  | "Exodus"
  | "Leviticus"
  | "Numbers"
  | "Deuteronomy";

export interface TorahVerse {
  id: string;
  book: TorahBook;
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

export interface TorahSearchHit {
  id: string;
  ref: string;
  book: TorahBook;
  chapter: number;
  verse: number;
  hebrew: string | null;
  english: string;
  sefariaUrl: string;
  score: number;
  whyRelevant: string;
  englishVersionTitle: string;
  englishLicense: string;
  hebrewVersionTitle: string | null;
  hebrewLicense: string | null;
}

export interface TorahCorpusManifest {
  coverage: string;
  definition: string;
  notClaimed: string[];
  importedAt: string;
  englishVersionTitle: string;
  englishLicense: string;
  englishVersionSource: string;
  hebrewVersionTitle: string;
  hebrewLicense: string;
  totals: {
    books: number;
    chapters: number;
    verses: number;
  };
  books: Array<{
    book: string;
    chapters: number;
    verses: number;
  }>;
}
