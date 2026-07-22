import { diversifyByBook, type RetrievalHit } from "./retrieve";
import { expandQueryConcepts, normalize } from "./concepts";

/**
 * Second-pass rerank: display readiness, authoritative topic agreement,
 * and philosophical-signal hygiene. Reasons remain DEV-only.
 */
export function rerankHits(
  query: string,
  hits: RetrievalHit[],
  limit = 6,
): RetrievalHit[] {
  const concepts = expandQueryConcepts(query);
  const philosophical = concepts.intents.includes("philosophical");

  const rescored: RetrievalHit[] = hits.map((hit) => {
    let bonus = 0;
    const reasons = [...hit.reasons];
    const rels = hit.record.topicRelationships ?? [];
    const auth = new Set(
      rels
        .filter(
          (r) =>
            r.source === "sefaria-topic-link" ||
            r.source === "curated" ||
            r.source === "sefaria-related",
        )
        .map((r) => normalize(r.topic)),
    );

    if (hit.record.originalText?.trim()) {
      bonus += 2;
      reasons.push("rerank:has-original-text");
    }
    if (hit.record.englishText?.trim()) {
      bonus += 1.5;
      reasons.push("rerank:has-english");
    }
    if (!hit.record.originalText?.trim() && !hit.record.englishText?.trim()) {
      bonus -= 12;
      reasons.push("rerank:no-displayable-text");
    }

    for (const concept of concepts.primary) {
      if (!auth.has(normalize(concept)) && !auth.has(normalize(concept).replace(/\s+/g, "-"))) {
        continue;
      }
      bonus += 6;
      reasons.push(`rerank:auth-primary:${concept}`);
    }
    for (const concept of concepts.secondary) {
      if (!auth.has(normalize(concept)) && !auth.has(normalize(concept).replace(/\s+/g, "-"))) {
        continue;
      }
      bonus += 2;
      reasons.push(`rerank:auth-secondary:${concept}`);
    }

    if (philosophical) {
      if (auth.has("purpose") || auth.has("purpose-of-life") || auth.has("wisdom")) {
        bonus += 5;
        reasons.push("rerank:philosophical-auth");
      } else if (/\blife\b/i.test(hit.record.englishText ?? "")) {
        bonus -= 7;
        reasons.push("rerank:generic-life-without-philosophical-signal");
      }
      if (hit.record.passageKind === "prescriptive") {
        bonus += 2;
      }
    }

    // Penalize duplicate near-identical lenses later via diversify; here soft-cap same chapter floods.
    return { ...hit, score: hit.score + bonus, reasons };
  });

  rescored.sort(
    (a, b) =>
      b.score - a.score || a.record.canonicalRef.localeCompare(b.record.canonicalRef),
  );

  return diversifyByBook(rescored, limit);
}
