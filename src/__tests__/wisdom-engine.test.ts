import { describe, expect, it } from "vitest";
import {
  assessSafety,
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
    expect(ranked[0].teaching.theme).toBe("gratitude");
  });

  it("every teaching has required fields and a citation", () => {
    for (const teaching of TEACHINGS) {
      expect(teaching.id).toBeTruthy();
      expect(teaching.source).toBeTruthy();
      expect(teaching.paraphrase.toLowerCase()).toContain("paraphrase");
      expect(teaching.explanation.length).toBeGreaterThan(20);
      expect(teaching.takeaway.length).toBeGreaterThan(10);
      expect(teaching.keywords.length).toBeGreaterThan(2);
    }
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
    expect(response.disclaimer).toContain("not rabbinic rulings");
  });

  it("handles long input without throwing", () => {
    const long = "patience ".repeat(400);
    const response = composeWisdom(long);
    expect(response.hearing.length).toBeGreaterThan(0);
    expect(response.forToday.length).toBeGreaterThan(0);
  });

  it("routes crisis without a cute teaching-only answer", () => {
    const response = composeWisdom("I want to end my life");
    expect(response.mode).toBe("safety");
    expect(response.teaching).toBeUndefined();
    expect(response.forToday.toLowerCase()).toMatch(/988|emergency/);
  });

  it("composes a teaching response for presets", () => {
    const response = composeWisdom("Share a teaching about patience.");
    expect(response.mode).toBe("teaching");
    expect(response.teaching?.source).toBeTruthy();
    expect(response.teaching?.paraphrase.toLowerCase()).toContain("paraphrase");
    expect(response.reflectionQuestion).toBeTruthy();
    expect(response.engineNote.toLowerCase()).toContain("local curated");
  });

  it("uses fallback for unrelated input", () => {
    const response = composeWisdom("xyzzy plugh fnord");
    expect(["fallback", "teaching"]).toContain(response.mode);
    expect(response.teaching?.source).toBeTruthy();
  });

  it("keeps disclaimer on every response", () => {
    for (const input of ["", "patience", "I need legal advice"]) {
      const response = composeWisdom(input);
      expect(response.disclaimer).toContain(
        "Torok offers Jewish learning and reflection",
      );
    }
  });
});
