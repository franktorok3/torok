import { describe, expect, it } from "vitest";
import { expandQueryConcepts } from "@/lib/library/concepts";
import { retrieveSources } from "@/lib/library/retrieve";
import { rerankHits } from "@/lib/library/rerank";
import { composeWisdom } from "@/lib/wisdom/compose";
import { corpusIsAvailable } from "@/lib/library/loader";
import { assessSafety } from "@/lib/wisdom/safety";

const hasCorpus = corpusIsAvailable();

describe("adversarial retrieval regressions", () => {
  it.skipIf(!hasCorpus)(
    "meaning of life does not lead with incidental life or anger",
    () => {
      const hits = rerankHits(
        "What is the meaning of life?",
        retrieveSources("What is the meaning of life?", { limit: 24 }),
        5,
      );
      expect(hits.length).toBeGreaterThan(0);
      const top = hits[0];
      expect(top.record.canonicalRef.toLowerCase()).not.toMatch(/exodus\s+32/);
      expect(top.record.englishText?.toLowerCase() ?? "").not.toMatch(/anger waxed/);
      const blob = hits
        .slice(0, 5)
        .map((h) => `${h.record.canonicalRef} ${h.record.englishText}`)
        .join(" | ")
        .toLowerCase();
      expect(blob).toMatch(/ecclesiastes|purpose|creator|image|pirkei|mesillat|proverbs|psalm/);
      expect(hits[0].record.canonicalRef.toLowerCase()).not.toMatch(/sanhedrin/);
    },
    20000,
  );

  it.skipIf(!hasCorpus)("philosophical queries deboost narrative violence", () => {
    const hits = retrieveSources("What is the purpose of human life?", { limit: 20 });
    const topText = hits
      .slice(0, 5)
      .map((h) => h.record.englishText ?? "")
      .join(" ")
      .toLowerCase();
    expect(topText).not.toMatch(/put to the sword|stoned him|smote .* and slew/);
  });

  it.skipIf(!hasCorpus)("generic heart/good/way matches do not alone select a hit", () => {
    const concepts = expandQueryConcepts("How do I find a good way?");
    // Should not invent purpose solely from "good"/"way"
    expect(concepts.primary.includes("purpose")).toBe(false);
  });

  it.skipIf(!hasCorpus)("lenses are not duplicates from the same book beyond diversity cap", () => {
    const response = composeWisdom("What is the meaning of life?");
    if (response.mode !== "multi" || !response.lenses) return;
    const books = response.lenses.map((l) => l.sourcePanel.ref.split(" ")[0]);
    const counts = new Map<string, number>();
    for (const b of books) counts.set(b, (counts.get(b) ?? 0) + 1);
    for (const n of counts.values()) expect(n).toBeLessThanOrEqual(2);
  });

  it.skipIf(!hasCorpus)("hebrew appears before english in multi-lens payload", () => {
    const response = composeWisdom("What is the meaning of life?");
    expect(response.mode).toBe("multi");
    for (const lens of response.lenses ?? []) {
      expect(
        lens.sourcePanel.originalText || lens.sourcePanel.hebrew,
      ).toBeTruthy();
      expect(lens.sourcePanel.english).toBeTruthy();
    }
  });

  it("sensitive inputs route before retrieval exploration", () => {
    expect(assessSafety("I want to end my life").kind).toBe("crisis");
    expect(composeWisdom("I want to end my life").mode).toBe("safety");
    expect(assessSafety("Am I obligated to keep kosher?").kind).toBe("halacha");
    expect(composeWisdom("Am I obligated to keep kosher?").mode).toBe("safety");
  });

  it.skipIf(!hasCorpus)("weak nonsense prefers abstain or fallback, not confident multi", () => {
    const response = composeWisdom("xyzzy plugh fnord");
    expect(["abstain", "fallback", "teaching"]).toContain(response.mode);
    expect(response.mode).not.toBe("multi");
  });

  it.skipIf(!hasCorpus)("courage and justice both surface for unfairness + fear", () => {
    const concepts = expandQueryConcepts(
      "I am afraid to speak up when something feels unjust.",
    );
    const pool = [...concepts.primary, ...concepts.secondary];
    expect(pool).toContain("justice");
    expect(pool).toContain("courage");
  });
});
