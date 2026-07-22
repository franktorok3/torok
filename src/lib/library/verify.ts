import type { RetrievalHit } from "./retrieve";

/**
 * Guard before a hit is ever shown to a user: it must have verified
 * original-language text, a canonical reference, a Sefaria link to check
 * it against, and license metadata for the text being displayed.
 */
export function verifyHit(hit: RetrievalHit): boolean {
  const record = hit.record;

  const hasOriginalText = Boolean(record.originalText?.trim());
  const hasCanonicalRef = Boolean(record.canonicalRef?.trim());
  const hasSefariaUrl = Boolean(record.sefariaUrl?.trim());
  const hasLicense = Boolean(record.license?.trim() || record.hebrewLicense?.trim());

  return hasOriginalText && hasCanonicalRef && hasSefariaUrl && hasLicense;
}
