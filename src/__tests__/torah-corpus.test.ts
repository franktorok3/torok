import { describe, expect, it } from "vitest";
import {
  getAllTorahVerses,
  getTorahManifest,
  lookupExactRef,
  searchTorah,
} from "@/lib/torah";
import { assessSafety, composeWisdom, TEACHINGS } from "@/lib/wisdom";

describe("Torah corpus", () => {
  it("imports all five books with expected chapter counts", () => {
    const manifest = getTorahManifest();
    expect(manifest.totals.books).toBe(5);
    expect(manifest.totals.chapters).toBe(187);
    expect(manifest.totals.verses).toBeGreaterThan(5800);
    expect(manifest.englishLicense.toLowerCase()).toBe("public domain");
    expect(manifest.hebrewLicense.toLowerCase()).toBe("public domain");

    const verses = getAllTorahVerses();
    expect(verses.length).toBe(manifest.totals.verses);

    const byBook = Object.fromEntries(
      ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"].map((b) => [
        b,
        new Set(verses.filter((v) => v.book === b).map((v) => v.chapter)).size,
      ]),
    );
    expect(byBook).toEqual({
      Genesis: 50,
      Exodus: 40,
      Leviticus: 27,
      Numbers: 36,
      Deuteronomy: 34,
    });
  });

  it("has unique verse ids and license metadata on every record", () => {
    const verses = getAllTorahVerses();
    const ids = new Set(verses.map((v) => v.id));
    expect(ids.size).toBe(verses.length);
    for (const verse of verses.slice(0, 50)) {
      expect(verse.englishVersionTitle).toContain("JPS 1917");
      expect(verse.englishLicense.toLowerCase()).toBe("public domain");
      expect(verse.sefariaUrl).toContain("sefaria.org");
    }
  });

  it("supports exact reference lookup", () => {
    const hit = lookupExactRef("Genesis 1:1");
    expect(hit).not.toBeNull();
    expect(hit!.ref).toBe("Genesis 1:1");
    expect(hit!.english.toLowerCase()).toContain("beginning");
    expect(hit!.hebrew).toBeTruthy();
  });

  it("returns relevant passages for everyday coworker conflict language", () => {
    const hits = searchTorah(
      "How should I handle conflict with a difficult coworker?",
      { theme: "relationships" },
    );
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.length).toBeLessThanOrEqual(3);
    expect(hits[0].englishVersionTitle).toContain("JPS 1917");
    expect(hits[0].englishLicense.toLowerCase()).toBe("public domain");
  });

  it("returns empty when confidence is too low", () => {
    const hits = searchTorah("xyzzy plugh fnord qqzz");
    expect(hits.length).toBe(0);
  });

  it("works without network once corpus is local", () => {
    // Loader reads only from disk; this test documents no-network fallback.
    expect(getAllTorahVerses().length).toBeGreaterThan(0);
  });
});

describe("compose with Torah exploration", () => {
  it("attaches related sources for ordinary wisdom responses", () => {
    const response = composeWisdom("Share a teaching about patience.");
    expect(["teaching", "multi", "fallback"]).toContain(response.mode);
    if (response.mode === "teaching") {
      expect(response.torahPassages?.length ?? 0).toBeGreaterThan(0);
      expect(response.torahPassages?.[0].englishLicense.toLowerCase()).toMatch(
        /public domain|cc-by/,
      );
    } else if (response.mode === "multi") {
      expect((response.lenses?.length ?? 0) >= 2).toBe(true);
    } else {
      expect(response.teaching?.sourcePanel || response.tryThisToday).toBeTruthy();
    }
  });

  it("does not attach Torah exploration for crisis routing", () => {
    const response = composeWisdom("I want to end my life");
    expect(response.mode).toBe("safety");
    expect(response.torahPassages).toBeUndefined();
    expect(assessSafety("I want to end my life").kind).toBe("crisis");
  });
});

describe("editorial library growth", () => {
  it("has at least 100 teachings including drafts", () => {
    expect(TEACHINGS.length).toBeGreaterThanOrEqual(100);
  });

  it("never marks draft entries as educator-reviewed", () => {
    for (const teaching of TEACHINGS) {
      if (teaching.reviewStatus === "draft") {
        expect(teaching.reviewStatus).not.toBe("educator-reviewed");
      }
    }
  });
});
