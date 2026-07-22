export type {
  LibraryCollectionSummary,
  LibraryManifest,
  OriginalLanguage,
  SourceCategory,
  SourceRecord,
} from "./types";
export {
  corpusIsAvailable,
  getAllSourceRecords,
  getSourceById,
  getSourceByRef,
  loadManifest,
  loadShard,
} from "./loader";

export {
  expandQueryConcepts,
  normalize,
  tokenize,
} from "./concepts";
export type { ConceptExpansion, QueryIntent } from "./concepts";

export {
  diversifyByBook,
  retrieveSources,
  scoreRecord,
} from "./retrieve";
export type { RetrievalHit } from "./retrieve";

export { rerankHits } from "./rerank";
export { assessRetrievalConfidence } from "./confidence";
export { verifyHit } from "./verify";

export { synonymsFor, TOPIC_SYNONYMS } from "./topics";
