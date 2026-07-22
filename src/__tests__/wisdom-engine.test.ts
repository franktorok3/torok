import { describe, expect, it } from "vitest";
import {
  assessSafety,
  auditTeachingsLibrary,
  composeWisdom,
  matchTeachings,
  selectTeaching,
  TEACHINGS,
} from "@/lib/wisdom";

describe("matchTeachings", () => {
  it("matches difficult conversation to relationships", () => {
    const match = selectTeaching(
      "How should I handle a difficult conversation?",
    );
    expect(match).not.toBeNull();
    expect(match!.teaching.theme).toBe("relationships");
  });

  it("matches repair / mistake prompts", () => {
    const match = selectTeaching("I made a mistake. How can I repair things?");
    expect(match).not.toBeNull();
    expect(match!.teaching.theme).toBe("repair");
  });

  it("matches patience prompts", () => {
    const match = selectTeaching("Share a teaching about patience.");
    expect(match).not.toBeNull();
    expect(match!.teaching.theme).toBe("patience");
  });

  it("matches leadership prompts", () => {
    const match = selectTeaching(
      "What does Jewish wisdom say about leadership?",
    );
    expect(match).not.toBeNull();
    expect(match!.teaching.theme).toBe("leadership");
  });

  it("matches decision / uncertainty prompts", () => {
    const match = selectTeaching("Help me think about a decision.");
    expect(match).not.toBeNull();
    expect(["uncertainty", "leadership"]).toContain(match!.teaching.theme);
  });

  it("matches AI / technology prompts", () => {
    const match = selectTeaching(
      "What is a Jewish perspective on using AI responsibly?",
    );
    expect(match).not.toBeNull();
    expect(match!.teaching.theme).toBe("technology");
  });

  it("returns ranked results for free-form gratitude input", () => {
    const ranked = matchTeachings(
      "I feel grateful for my family after a long week",
    );
    expect(ranked.length).toBeGreaterThan(0);
    expect(["gratitude", "family"]).toContain(ranked[0].teaching.theme);
  });

  it("every teaching has required audit fields", () => {
    for (const teaching of TEACHINGS) {
      expect(teaching.id).toBeTruthy();
      expect(teaching.sources.length).toBeGreaterThan(0);
      expect(teaching.text.length).toBeGreaterThan(10);
      expect(teaching.historicalContext.length).toBeGreaterThan(20);
      expect(teaching.modernApplication.length).toBeGreaterThan(20);
      expect(teaching.takeaway.length).toBeGreaterThan(10);
      expect(teaching.keywords.length).toBeGreaterThan(2);
      expect(["quotation", "paraphrase"]).toContain(teaching.textKind);
      if (teaching.textKind === "quotation") {
        expect(teaching.translationAttribution).toBeTruthy();
      }
    }
  });

  it("cites Leviticus 19:18 and Sifra for neighbor teaching", () => {
    const teaching = TEACHINGS.find((t) => t.id === "relationships-neighbor");
    expect(teaching).toBeTruthy();
    const canonicals = teaching!.sources.map((s) => s.canonical);
    expect(canonicals).toContain("Leviticus 19:18");
    expect(canonicals.some((c) => c.includes("Sifra"))).toBe(true);
    expect(teaching!.modernApplication).toMatch(/fair boundaries/i);
    expect(teaching!.modernApplication).toMatch(/modern application/i);
  });
});

describe("assessSafety", () => {
  it("detects crisis language", () => {
    const result = assessSafety("I want to kill myself");
    expect(result.triggered).toBe(true);
    expect(result.kind).toBe("crisis");
  });

  it("detects abuse language", () => {
    const result = assessSafety("I am in an abusive relationship");
    expect(result.triggered).toBe(true);
    expect(result.kind).toBe("abuse");
  });

  it("detects medical language", () => {
    const result = assessSafety("Can you diagnose these symptoms?");
    expect(result.triggered).toBe(true);
    expect(result.kind).toBe("medical");
  });

  it("detects legal language", () => {
    const result = assessSafety("I need legal advice for a lawsuit");
    expect(result.triggered).toBe(true);
    expect(result.kind).toBe("legal");
  });

  it("detects halacha requests", () => {
    const result = assessSafety("What does Jewish law require on Shabbat?");
    expect(result.triggered).toBe(true);
    expect(result.kind).toBe("halacha");
  });

  it("does not flag ordinary spiritual questions", () => {
    const result = assessSafety("How can I practice patience with my kids?");
    expect(result.triggered).toBe(false);
  });
});

describe("composeWisdom", () => {
  it("handles blank input", () => {
    const response = composeWisdom("   ");
    expect(response.mode).toBe("empty");
    expect(response.acknowledgment).toBeTruthy();
  });

  it("handles long input without throwing", () => {
    const long = "patience ".repeat(400);
    const response = composeWisdom(long);
    expect(response.acknowledgment.length).toBeGreaterThan(0);
    expect(response.tryThisToday.length).toBeGreaterThan(0);
  });

  it("routes crisis without a cute teaching-only answer", () => {
    const response = composeWisdom("I want to end my life");
    expect(response.mode).toBe("safety");
    expect(response.teaching).toBeUndefined();
    expect(response.tryThisToday.toLowerCase()).toMatch(/988|emergency/);
  });

  it("composes a teaching response for presets without engine diagnostics", () => {
    const response = composeWisdom("Share a teaching about patience.");
    expect(response.mode).toBe("teaching");
    expect(response.teaching?.sources.length).toBeGreaterThan(0);
    expect(response.teaching?.textKind).toBe("paraphrase");
    expect(response.reflectionQuestion).toBeTruthy();
    expect(JSON.stringify(response).toLowerCase()).not.toContain("via keywords");
    expect(JSON.stringify(response).toLowerCase()).not.toContain("engine note");
  });

  it("uses fallback for unrelated input", () => {
    const response = composeWisdom("xyzzy plugh fnord");
    expect(["fallback", "teaching"]).toContain(response.mode);
    expect(response.teaching?.sources.length).toBeGreaterThan(0);
  });

  it("offers another lens when multiple teachings fit", () => {
    const response = composeWisdom(
      "How should I handle a difficult conversation about peace?",
    );
    expect(response.mode).toBe("teaching");
    expect(response.alternateTeachingIds?.length ?? 0).toBeGreaterThan(0);
  });
});

describe("content audit", () => {
  it("flags library as awaiting educator review", () => {
    const { flags, libraryReviewStatus } = auditTeachingsLibrary();
    expect(libraryReviewStatus).toBe("awaiting-educator-review");
    expect(
      flags.some((f) => f.code === "library-not-educator-reviewed"),
    ).toBe(true);
  });

  it("does not invent missing citations in the current library", () => {
    const { flags } = auditTeachingsLibrary();
    expect(flags.some((f) => f.code === "missing-citation")).toBe(false);
    expect(flags.some((f) => f.code === "unattributed-translation")).toBe(
      false,
    );
  });
});
