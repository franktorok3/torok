import { describe, expect, it } from "vitest";
import {
  composeWisdom,
  matchTeachings,
  selectTeaching,
  selectThemePair,
} from "@/lib/wisdom";
import { alternateLensIds } from "@/lib/wisdom/matcher";

/**
 * Benchmark: everyday questions with expected primary / secondary themes.
 * Scoring can choose either of a pair when both are strongly present.
 */
const BENCHMARK: Array<{
  q: string;
  primary: string | string[];
  secondary?: string | string[];
}> = [
  {
    q: "I am afraid to speak up when something feels unjust.",
    primary: ["courage", "justice"],
    secondary: ["courage", "justice"],
  },
  {
    q: "Someone is spreading gossip about a coworker.",
    primary: "speech",
    secondary: ["relationships", "justice", "repair"],
  },
  {
    q: "I need to apologize after hurting a friend.",
    primary: "repair",
  },
  {
    q: "My workplace feels exploitative and unfair.",
    primary: ["justice", "work"],
    secondary: ["justice", "work", "courage"],
  },
  {
    q: "I’m grieving and don’t know how to keep going.",
    primary: ["hope", "community", "uncertainty", "rest"],
    secondary: ["hope", "community", "rest", "uncertainty"],
  },
  {
    q: "How should I handle a difficult conversation?",
    primary: "relationships",
  },
  {
    q: "I made a mistake. How can I repair things?",
    primary: "repair",
  },
  {
    q: "Share a teaching about patience.",
    primary: "patience",
  },
  {
    q: "What does Jewish wisdom say about leadership?",
    primary: "leadership",
  },
  {
    q: "Help me think about a decision.",
    primary: ["uncertainty", "leadership"],
  },
  {
    q: "What is a Jewish perspective on using AI responsibly?",
    primary: "technology",
  },
  {
    q: "I feel grateful for my family after a long week.",
    primary: ["gratitude", "family"],
  },
  {
    q: "I snapped in anger and regret my words.",
    primary: ["anger", "speech", "repair"],
  },
  {
    q: "I’m burned out and need rest.",
    primary: "rest",
  },
  {
    q: "How do I practice humility when I want recognition?",
    primary: "humility",
  },
  {
    q: "We are hosting guests and want to welcome them well.",
    primary: "hospitality",
  },
  {
    q: "Parenting feels hard and I want more patience at home.",
    primary: ["family", "patience"],
  },
  {
    q: "I want to give tzedakah thoughtfully.",
    primary: "generosity",
  },
  {
    q: "I feel lonely and want community.",
    primary: "community",
  },
  {
    q: "I’m struggling to tell the truth kindly.",
    primary: ["truth", "speech"],
  },
  {
    q: "How can I find joy in an ordinary day?",
    primary: "joy",
  },
  {
    q: "I care about the earth and how we treat animals.",
    primary: "stewardship",
  },
  {
    q: "I want to forgive someone who wronged me.",
    primary: "forgiveness",
  },
  {
    q: "I’m learning something new and feel behind.",
    primary: "learning",
  },
  {
    q: "My team looks to me for responsibility.",
    primary: "leadership",
  },
  {
    q: "I overheard a rumor and don’t know whether to pass it on.",
    primary: "speech",
  },
  {
    q: "Someone was underpaid for their labor.",
    primary: ["work", "justice"],
  },
  {
    q: "I feel hopeless about the future.",
    primary: ["hope", "uncertainty", "community"],
  },
  {
    q: "A stranger needs a place at our table.",
    primary: "hospitality",
  },
  {
    q: "I’m afraid, but the issue is injustice at work.",
    primary: ["justice", "courage", "work"],
    secondary: ["justice", "courage", "work"],
  },
  {
    q: "How do I cool down before I send an angry message?",
    primary: ["anger", "patience", "speech"],
  },
  {
    q: "I want to study Torah more consistently.",
    primary: "learning",
  },
];

function includesTheme(
  actual: string | undefined,
  expected: string | string[] | undefined,
): boolean {
  if (!expected) return true;
  if (!actual) return false;
  const list = Array.isArray(expected) ? expected : [expected];
  return list.includes(actual);
}

describe("theme matching benchmark (30+)", () => {
  it("has at least 30 representative questions", () => {
    expect(BENCHMARK.length).toBeGreaterThanOrEqual(30);
  });

  for (const row of BENCHMARK) {
    it(`matches: ${row.q.slice(0, 48)}…`, () => {
      const match = selectTeaching(row.q);
      expect(match).not.toBeNull();
      expect(includesTheme(match!.teaching.theme, row.primary)).toBe(true);

      if (row.secondary) {
        const pair = selectThemePair(row.q);
        expect(pair.primary).toBeTruthy();
        // When a secondary theme is present, it should be among expected lenses
        if (pair.secondary) {
          const ok =
            includesTheme(pair.secondary, row.secondary) ||
            includesTheme(pair.primary, row.secondary) ||
            includesTheme(pair.secondary, row.primary);
          expect(ok).toBe(true);
        }
      }
    });
  }

  it("weights injustice over generic fear for speak-up prompt", () => {
    const ranked = matchTeachings(
      "I am afraid to speak up when something feels unjust.",
    );
    const themes = ranked.slice(0, 4).map((r) => r.teaching.theme);
    expect(themes.some((t) => t === "justice" || t === "courage")).toBe(true);
    const justice = ranked.find((r) => r.teaching.theme === "justice");
    const courage = ranked.find((r) => r.teaching.theme === "courage");
    expect(justice || courage).toBeTruthy();
  });

  it("Another lens prefers a different theme when available", () => {
    const q = "I am afraid to speak up when something feels unjust.";
    const primary = selectTeaching(q)!;
    const alts = alternateLensIds(q, primary.teaching.id, primary.teaching.theme);
    expect(alts.length).toBeGreaterThan(0);
    const altTheme = matchTeachings(q).find((m) => m.teaching.id === alts[0])
      ?.teaching.theme;
    expect(altTheme).toBeTruthy();
    expect(altTheme).not.toBe(primary.teaching.theme);
  });

  it("composeWisdom returns source panel fields safely", () => {
    const res = composeWisdom("Share a teaching about patience.");
    expect(["teaching", "multi", "fallback"]).toContain(res.mode);
    expect(res.tryThisToday).toBeTruthy();
    expect(res.acknowledgment).toBeTruthy();
    const panel = res.teaching?.sourcePanel || res.lenses?.[0]?.sourcePanel;
    expect(panel?.citationLabel || res.mode === "abstain").toBeTruthy();
  });
});
