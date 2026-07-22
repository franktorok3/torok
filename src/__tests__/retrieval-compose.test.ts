import { describe, expect, it } from "vitest";
import { composeWisdom } from "@/lib/wisdom/compose";
import { expandQueryConcepts } from "@/lib/library/concepts";
import { corpusIsAvailable } from "@/lib/library/loader";

describe("retrieval-grounded compose", () => {
  it("skips when library corpus is unavailable", () => {
    if (!corpusIsAvailable()) {
      expect(true).toBe(true);
    }
  });

  it(
    "meaning of life uses multi-lens and avoids anger dominance",
    () => {
      if (!corpusIsAvailable()) return;

      const concepts = expandQueryConcepts("What is the meaning of life?");
      expect(concepts.excludedDominant).toContain("anger");
      expect(concepts.primary).not.toContain("anger");
      expect(
        concepts.primary.some((c) =>
          ["purpose", "creation", "responsibility", "wisdom", "service"].includes(c),
        ),
      ).toBe(true);

      const response = composeWisdom("What is the meaning of life?");
      expect(response.mode).toBe("multi");
      expect(response.lenses?.length).toBeGreaterThanOrEqual(2);

      for (const lens of response.lenses ?? []) {
        expect(lens.sourcePanel.originalText || lens.sourcePanel.hebrew).toBeTruthy();
        expect(lens.sourcePanel.citationLabel).toBeTruthy();
        expect(lens.sourcePanel.english).toBeTruthy();
        const blob = `${lens.sourcePanel.english} ${lens.title}`.toLowerCase();
        expect(
          blob.includes("anger waxed") || blob.includes("broke them beneath"),
        ).toBe(false);
      }
    },
    20000,
  );

  it("courage + justice both surface for speaking up about injustice", () => {
    if (!corpusIsAvailable()) return;
    const concepts = expandQueryConcepts(
      "I am afraid to speak up when something feels unjust.",
    );
    const pooled = [...concepts.primary, ...concepts.secondary];
    expect(pooled.some((c) => c === "courage" || c === "fear")).toBe(true);
    expect(pooled.some((c) => c === "justice")).toBe(true);

    const response = composeWisdom(
      "I am afraid to speak up when something feels unjust.",
    );
    expect(["teaching", "multi"]).toContain(response.mode);
    expect(response.mode).not.toBe("safety");
  });

  it("crisis queries do not explore ordinary sources", () => {
    const response = composeWisdom("I want to end my life");
    expect(response.mode).toBe("safety");
    expect(response.lenses).toBeUndefined();
  });

  it("low-information questions can abstain instead of forcing a card", () => {
    if (!corpusIsAvailable()) return;
    const response = composeWisdom("asdf");
    expect(["abstain", "fallback"]).toContain(response.mode);
  });
});
