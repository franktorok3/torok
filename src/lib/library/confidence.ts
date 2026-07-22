import type { RetrievalHit } from "./retrieve";
import { expandQueryConcepts } from "./concepts";

/**
 * Confidence reflects agreement of independent signals, score gap, and
 * whether top hits are prescriptive / family-appropriate — not a theological claim.
 */
export function assessRetrievalConfidence(
  hits: RetrievalHit[],
  query?: string,
): {
  level: "high" | "medium" | "low";
  useMultiLens: boolean;
  abstain: boolean;
} {
  if (hits.length === 0) {
    return { level: "low", useMultiLens: false, abstain: true };
  }

  const best = hits[0].score;
  const second = hits[1]?.score ?? 0;
  const gap = best - second;

  const concepts = query ? expandQueryConcepts(query) : null;
  const philosophical = concepts?.intents.includes("philosophical") ?? false;

  const authSignals = hits[0].reasons.filter(
    (r) =>
      r.includes("auth:") ||
      r.includes("primary-concept:") ||
      r.includes("family-fit:") ||
      r.includes("book-fit:"),
  ).length;
  const narrativePenalty = hits[0].reasons.some((r) =>
    r.includes("narrative"),
  );

  // Weak: low absolute score, or only thin lexical overlap without concept support.
  const thin =
    best < 8 ||
    (authSignals === 0 && best < 12) ||
    (narrativePenalty && philosophical);

  const abstain = thin && best < 10;

  let level: "high" | "medium" | "low" = "low";
  if (best >= 22 && gap >= 2 && authSignals >= 1) level = "high";
  else if (best >= 12) level = "medium";

  const strongHits = hits.filter((h) => h.score >= best * 0.72);
  const diverseBooks = new Set(strongHits.map((h) => h.record.sourceTitle)).size;

  const philosophicalSignal =
    philosophical ||
    hits
      .slice(0, 5)
      .some((h) =>
        h.reasons.some(
          (r) =>
            r.startsWith("family-fit:philosophical") ||
            r.startsWith("book-fit:wisdom"),
        ),
      );

  const useMultiLens =
    !abstain &&
    philosophicalSignal &&
    strongHits.length >= 2 &&
    diverseBooks >= 2 &&
    best >= 16;

  return { level, useMultiLens, abstain };
}
