import { describe, expect, it } from "vitest";
import { expandQueryConcepts } from "@/lib/library/concepts";
import { scoreRecord, retrieveSources } from "@/lib/library/retrieve";
import { rerankHits } from "@/lib/library/rerank";
import { assessRetrievalConfidence } from "@/lib/library/confidence";
import { verifyHit } from "@/lib/library/verify";
import { getAllSourceRecords } from "@/lib/library/loader";
import type { RetrievalHit } from "@/lib/library/retrieve";
import type { SourceRecord } from "@/lib/library/types";

/**
 * The real corpus loader (src/lib/library/loader.ts, data/library/) may or
 * may not be populated in a given environment — it ships raw Sefaria text
 * with only a book-slug in `topics` and empty `keywords`. These fixtures
 * carry curated topic/keyword tags (the target end state once editorial
 * work lands) so the scoring/ranking algorithm itself can be unit tested
 * deterministically via the exported scoreRecord(), independent of corpus
 * curation status.
 */
function fixture(overrides: Partial<SourceRecord> & Pick<SourceRecord, "id" | "canonicalRef" | "sourceTitle" | "sourceCategory" | "originalText" | "englishText" | "sefariaUrl">): SourceRecord {
  return {
    hebrewRef: undefined,
    originalLanguage: "hebrew",
    englishIsQuotation: true,
    englishIsParaphrase: false,
    versionTitle: "The Holy Scriptures: A New Translation (JPS 1917)",
    translator: undefined,
    license: "Public Domain",
    hebrewVersionTitle: "Tanach with Nikkud",
    hebrewLicense: "Public Domain",
    topics: [],
    relatedTopics: [],
    keywords: [],
    connectedRefs: [],
    commentaryRefs: [],
    contextBefore: undefined,
    contextAfter: undefined,
    compositionDate: undefined,
    importedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const FIXTURES: SourceRecord[] = [
  fixture({
    id: "exodus-32-19",
    canonicalRef: "Exodus 32:19",
    sourceTitle: "Exodus",
    sourceCategory: "torah",
    englishText:
      "And it came to pass, as soon as he came nigh unto the camp, that he saw the calf and the dancing; and Moses' anger waxed hot, and he cast the tables out of his hands, and broke them beneath the mount.",
    originalText: "וַיְהִי כַּאֲשֶׁר קָרַב אֶל־הַמַּחֲנֶה וַיַּרְא אֶת־הָעֵגֶל",
    sefariaUrl: "https://www.sefaria.org/Exodus.32.19",
    topics: ["exodus"],
    keywords: ["anger", "broke the tablets"],
  }),
  fixture({
    id: "numbers-20-11",
    canonicalRef: "Numbers 20:11",
    sourceTitle: "Numbers",
    sourceCategory: "torah",
    englishText: "And Moses lifted up his hand, and smote the rock with his rod twice; and water came forth abundantly.",
    originalText: "וַיָּרֶם מֹשֶׁה אֶת יָדוֹ וַיַּךְ אֶת הַסֶּלַע בְּמַטֵּהוּ",
    sefariaUrl: "https://www.sefaria.org/Numbers.20.11",
    topics: ["numbers"],
    keywords: ["anger", "striking the rock"],
  }),
  fixture({
    id: "genesis-4-8",
    canonicalRef: "Genesis 4:8",
    sourceTitle: "Genesis",
    sourceCategory: "torah",
    englishText: "And Cain spoke unto Abel his brother. And it came to pass, when they were in the field, that Cain rose up against Abel his brother, and slew him.",
    originalText: "וַיָּקָם קַיִן אֶל הֶבֶל אָחִיו וַיַּהַרְגֵהוּ",
    sefariaUrl: "https://www.sefaria.org/Genesis.4.8",
    topics: ["genesis"],
    keywords: ["anger", "violence"],
  }),
  fixture({
    id: "genesis-1-27",
    canonicalRef: "Genesis 1:27",
    sourceTitle: "Genesis",
    sourceCategory: "torah",
    englishText: "And God created man in His own image, in the image of God created He him; male and female created He them.",
    originalText: "וַיִּבְרָא אֱלֹהִים אֶת הָאָדָם בְּצַלְמוֹ",
    sefariaUrl: "https://www.sefaria.org/Genesis.1.27",
    topics: ["genesis", "creation", "humanity", "purpose"],
    keywords: ["image of god", "creation"],
  }),
  fixture({
    id: "genesis-2-7",
    canonicalRef: "Genesis 2:7",
    sourceTitle: "Genesis",
    sourceCategory: "torah",
    englishText: "And the LORD God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul.",
    originalText: "וַיִּיצֶר יְהוָה אֱלֹהִים אֶת הָאָדָם",
    sefariaUrl: "https://www.sefaria.org/Genesis.2.7",
    topics: ["genesis", "creation", "humanity", "purpose"],
    keywords: ["breath of life", "creation"],
  }),
  fixture({
    id: "proverbs-3-13",
    canonicalRef: "Proverbs 3:13",
    sourceTitle: "Proverbs",
    sourceCategory: "writings",
    englishText: "Happy is the man that findeth wisdom, and the man that obtaineth understanding.",
    originalText: "אַשְׁרֵי אָדָם מָצָא חָכְמָה",
    sefariaUrl: "https://www.sefaria.org/Proverbs.3.13",
    topics: ["proverbs", "wisdom", "purpose", "joy"],
    keywords: ["wisdom", "understanding"],
  }),
  fixture({
    id: "proverbs-16-9",
    canonicalRef: "Proverbs 16:9",
    sourceTitle: "Proverbs",
    sourceCategory: "writings",
    englishText: "A man's heart deviseth his way: but the LORD directeth his steps.",
    originalText: "לֵב אָדָם יְחַשֵּׁב דַּרְכּוֹ",
    sefariaUrl: "https://www.sefaria.org/Proverbs.16.9",
    topics: ["proverbs", "purpose", "divine-relationship"],
    keywords: ["purpose", "way"],
  }),
  fixture({
    id: "psalms-8-5",
    canonicalRef: "Psalms 8:5",
    sourceTitle: "Psalms",
    sourceCategory: "writings",
    englishText: "What is man, that Thou art mindful of him? and the son of man, that Thou thinkest of him?",
    originalText: "מָה אֱנוֹשׁ כִּי תִזְכְּרֶנּוּ",
    sefariaUrl: "https://www.sefaria.org/Psalms.8.5",
    topics: ["psalms", "humanity", "purpose", "creation"],
    keywords: ["humanity", "purpose"],
  }),
  fixture({
    id: "psalms-90-12",
    canonicalRef: "Psalms 90:12",
    sourceTitle: "Psalms",
    sourceCategory: "writings",
    englishText: "So teach us to number our days, that we may get us a heart of wisdom.",
    originalText: "לִמְנוֹת יָמֵינוּ כֵּן הוֹדַע",
    sefariaUrl: "https://www.sefaria.org/Psalms.90.12",
    topics: ["psalms", "mortality", "purpose", "wisdom"],
    keywords: ["mortality", "wisdom"],
  }),
  fixture({
    id: "ecclesiastes-3-1",
    canonicalRef: "Ecclesiastes 3:1",
    sourceTitle: "Ecclesiastes",
    sourceCategory: "writings",
    englishText: "To every thing there is a season, and a time to every purpose under the heaven.",
    originalText: "לַכֹּל זְמָן וְעֵת לְכָל חֵפֶץ",
    sefariaUrl: "https://www.sefaria.org/Ecclesiastes.3.1",
    topics: ["ecclesiastes", "purpose", "meaning", "time"],
    keywords: ["purpose", "season"],
  }),
  fixture({
    id: "ecclesiastes-12-13",
    canonicalRef: "Ecclesiastes 12:13",
    sourceTitle: "Ecclesiastes",
    sourceCategory: "philosophy",
    englishText: "Fear God, and keep His commandments: for this is the whole duty of man.",
    originalText: "אֶת הָאֱלֹהִים יְרָא וְאֶת מִצְוֹתָיו שְׁמוֹר",
    sefariaUrl: "https://www.sefaria.org/Ecclesiastes.12.13",
    topics: ["ecclesiastes", "purpose", "responsibility", "service", "meaning"],
    keywords: ["duty", "purpose"],
  }),
  fixture({
    id: "avot-2-1",
    canonicalRef: "Pirkei Avot 2:1",
    sourceTitle: "Pirkei Avot",
    sourceCategory: "mishnah",
    englishText: "Consider three things, and thou wilt not fall into the hands of sin.",
    originalText: "הִסְתַּכֵּל בִּשְׁלֹשָׁה דְבָרִים",
    sefariaUrl: "https://www.sefaria.org/Pirkei_Avot.2.1",
    topics: ["pirkei-avot", "responsibility", "service", "purpose", "humility"],
    keywords: ["responsibility", "consider"],
  }),
  fixture({
    id: "avot-1-14",
    canonicalRef: "Pirkei Avot 1:14",
    sourceTitle: "Pirkei Avot",
    sourceCategory: "mishnah",
    englishText: "If I am not for myself, who will be for me? And if not now, when?",
    originalText: "אִם אֵין אֲנִי לִי מִי לִי",
    sefariaUrl: "https://www.sefaria.org/Pirkei_Avot.1.14",
    topics: ["pirkei-avot", "purpose", "responsibility", "service", "community"],
    keywords: ["purpose", "responsibility"],
  }),
  fixture({
    id: "leviticus-19-18",
    canonicalRef: "Leviticus 19:18",
    sourceTitle: "Leviticus",
    sourceCategory: "torah",
    englishText: "Thou shalt love thy neighbour as thyself.",
    originalText: "וְאָהַבְתָּ לְרֵעֲךָ כָּמוֹךָ",
    sefariaUrl: "https://www.sefaria.org/Leviticus.19.18",
    topics: ["leviticus", "love", "community", "justice"],
    keywords: ["love", "neighbor"],
  }),
  fixture({
    id: "deuteronomy-6-5",
    canonicalRef: "Deuteronomy 6:5",
    sourceTitle: "Deuteronomy",
    sourceCategory: "torah",
    englishText: "And thou shalt love the LORD thy God with all thy heart.",
    originalText: "וְאָהַבְתָּ אֵת יְהוָה אֱלֹהֶיךָ",
    sefariaUrl: "https://www.sefaria.org/Deuteronomy.6.5",
    topics: ["deuteronomy", "love", "divine-relationship", "service"],
    keywords: ["love", "god"],
  }),
  fixture({
    id: "proverbs-15-1",
    canonicalRef: "Proverbs 15:1",
    sourceTitle: "Proverbs",
    sourceCategory: "writings",
    englishText: "A soft answer turneth away wrath: but grievous words stir up anger.",
    originalText: "מַעֲנֶה רַּךְ יָשִׁיב חֵמָה",
    sefariaUrl: "https://www.sefaria.org/Proverbs.15.1",
    topics: ["proverbs", "anger", "patience", "speech"],
    keywords: ["anger", "patience"],
  }),
  fixture({
    id: "psalms-37-8",
    canonicalRef: "Psalms 37:8",
    sourceTitle: "Psalms",
    sourceCategory: "writings",
    englishText: "Cease from anger, and forsake wrath: fret not thyself, it tendeth only to evil-doing.",
    originalText: "הֶרֶף מֵאַף וַעֲזֹב חֵמָה",
    sefariaUrl: "https://www.sefaria.org/Psalms.37.8",
    topics: ["psalms", "anger", "patience", "trust"],
    keywords: ["anger", "patience"],
  }),
  fixture({
    id: "isaiah-1-17",
    canonicalRef: "Isaiah 1:17",
    sourceTitle: "Isaiah",
    sourceCategory: "prophets",
    englishText: "Learn to do well; seek justice, relieve the oppressed.",
    originalText: "לִמְדוּ הֵיטֵב דִּרְשׁוּ מִשְׁפָּט",
    sefariaUrl: "https://www.sefaria.org/Isaiah.1.17",
    topics: ["isaiah", "justice", "ethics", "community"],
    keywords: ["justice", "oppressed"],
  }),
  fixture({
    id: "amos-5-24",
    canonicalRef: "Amos 5:24",
    sourceTitle: "Amos",
    sourceCategory: "prophets",
    englishText: "But let justice well up as waters, and righteousness as a mighty stream.",
    originalText: "וְיִגַּל כַּמַּיִם מִשְׁפָּט",
    sefariaUrl: "https://www.sefaria.org/Amos.5.24",
    topics: ["amos", "justice", "ethics"],
    keywords: ["justice", "righteousness"],
  }),
  fixture({
    id: "job-38-4",
    canonicalRef: "Job 38:4",
    sourceTitle: "Job",
    sourceCategory: "writings",
    englishText: "Where wast thou when I laid the foundations of the earth?",
    originalText: "אֵיפֹה הָיִיתָ בְּיָסְדִי אָרֶץ",
    sefariaUrl: "https://www.sefaria.org/Job.38.4",
    topics: ["job", "creation", "mortality", "humanity", "purpose"],
    keywords: ["creation", "humanity"],
  }),
];

const ANGER_NARRATIVE_IDS = new Set(["exodus-32-19", "numbers-20-11", "genesis-4-8"]);
const MEANING_FRIENDLY_BOOKS = new Set([
  "Proverbs",
  "Psalms",
  "Ecclesiastes",
  "Genesis",
  "Pirkei Avot",
  "Job",
]);

function rankFixtures(query: string): RetrievalHit[] {
  const concepts = expandQueryConcepts(query);
  const hits = FIXTURES.map((record) => {
    const { score, reasons } = scoreRecord(query, record, concepts);
    return { record, score, reasons };
  });
  return hits.sort((a, b) => b.score - a.score || a.record.canonicalRef.localeCompare(b.record.canonicalRef));
}

describe("expandQueryConcepts", () => {
  it("expands meaning-of-life language into philosophical concepts and excludes anger", () => {
    const concepts = expandQueryConcepts("What is the meaning of life?");
    expect(concepts.primary).toContain("purpose");
    expect(concepts.primary).toContain("creation");
    expect(concepts.primary).toContain("humanity");
    expect(concepts.primary).toContain("responsibility");
    expect(concepts.excludedDominant).toContain("anger");
    expect(concepts.intents).toContain("philosophical");
  });

  it("marks anger as SPECIFIC — only present when anger words appear", () => {
    const meaning = expandQueryConcepts("What is the meaning of life?");
    expect(meaning.primary).not.toContain("anger");

    const anger = expandQueryConcepts("I snapped in anger at my coworker.");
    expect(anger.primary).toContain("anger");
    expect(anger.excludedDominant).not.toContain("anger");
  });

  it("surfaces both justice and courage when fear is paired with injustice", () => {
    const concepts = expandQueryConcepts(
      "I am afraid to speak up when something feels unjust.",
    );
    const all = [...concepts.primary, ...concepts.secondary];
    expect(all).toContain("justice");
    expect(all).toContain("courage");
  });

  it("resolves plain fear toward courage/uncertainty without injustice present", () => {
    const concepts = expandQueryConcepts("I'm afraid of what comes next.");
    const all = [...concepts.primary, ...concepts.secondary];
    expect(all).toContain("courage");
    expect(concepts.primary).not.toContain("justice");
  });

  it("recognizes gossip, apology, and grief language", () => {
    expect(expandQueryConcepts("Someone is spreading gossip about a coworker.").primary).toContain(
      "speech",
    );
    expect(expandQueryConcepts("How do I apologize after hurting a friend?").primary).toContain(
      "apology",
    );
    expect(expandQueryConcepts("I'm grieving the loss of my father.").primary).toContain("grief");
  });

  it("recognizes injustice language independent of fear", () => {
    const concepts = expandQueryConcepts("My workplace feels exploitative and unfair.");
    expect(concepts.primary).toContain("justice");
    expect(concepts.intents).toContain("ethical");
  });
});

describe("scoreRecord / retrieval ranking (fixtures)", () => {
  it("does not let anger-narrative passages dominate a meaning-of-life query", () => {
    const ranked = rankFixtures("What is the meaning of life?");
    const topFive = ranked.slice(0, 5);

    for (const hit of topFive) {
      expect(ANGER_NARRATIVE_IDS.has(hit.record.id)).toBe(false);
    }

    expect(topFive.some((hit) => MEANING_FRIENDLY_BOOKS.has(hit.record.sourceTitle))).toBe(true);

    const bestAngerNarrativeScore = Math.max(
      ...ranked.filter((h) => ANGER_NARRATIVE_IDS.has(h.record.id)).map((h) => h.score),
    );
    expect(ranked[0].score).toBeGreaterThan(bestAngerNarrativeScore);
  });

  it("prefers writings/ethics/philosophy categories or wisdom books for the top hit", () => {
    const ranked = rankFixtures("What is the meaning of life?");
    const top = ranked[0];
    const acceptableBooks = MEANING_FRIENDLY_BOOKS.has(top.record.sourceTitle);
    const acceptableCategory = ["writings", "ethics", "philosophy", "mishnah", "torah"].includes(
      top.record.sourceCategory,
    );
    expect(acceptableBooks || acceptableCategory).toBe(true);
  });

  it("does NOT deboost anger-topic passages when the query is actually about anger", () => {
    const ranked = rankFixtures("I keep losing my temper and getting angry at my family.");
    const wisdomOnAnger = ranked.find((h) => h.record.id === "proverbs-15-1");
    const angerNarrative = ranked.find((h) => h.record.id === "exodus-32-19");

    expect(wisdomOnAnger).toBeTruthy();
    expect(wisdomOnAnger!.score).toBeGreaterThan(0);
    // Narrative anger passage should no longer be penalized (guard cleared).
    expect(angerNarrative!.reasons).not.toContain("deboost:narrative-anger");
  });

  it("boosts justice-related passages for an injustice query", () => {
    const ranked = rankFixtures("I'm afraid to speak up when something feels unjust at work.");
    const justiceHit = ranked.find((h) => h.record.id === "isaiah-1-17");
    expect(justiceHit).toBeTruthy();
    expect(justiceHit!.score).toBeGreaterThan(0);
    expect(justiceHit!.reasons.some((r) => r.startsWith("primary-concept:justice"))).toBe(true);
  });

  it("deboosts a narrative anger passage even without curated topic tags, via text markers", () => {
    const bareNarrative: SourceRecord = fixture({
      id: "exodus-4-14-bare",
      canonicalRef: "Exodus 4:14",
      sourceTitle: "Exodus",
      sourceCategory: "torah",
      englishText: "And the anger of the LORD was kindled against Moses.",
      originalText: "וַיִּחַר־אַף יְהוָה בְּמֹשֶׁה",
      sefariaUrl: "https://www.sefaria.org/Exodus.4.14",
      topics: ["exodus"],
      keywords: [],
    });
    const concepts = expandQueryConcepts("What is the meaning of life?");
    const { reasons } = scoreRecord("What is the meaning of life?", bareNarrative, concepts);
    expect(reasons).toContain("deboost:narrative-anger");
  });

  it("gives a low-or-negative score to an irrelevant narrative passage", () => {
    const concepts = expandQueryConcepts("What is the meaning of life?");
    const { score } = scoreRecord(
      "What is the meaning of life?",
      FIXTURES.find((f) => f.id === "genesis-4-8")!,
      concepts,
    );
    expect(score).toBeLessThan(5);
  });
});

describe("retrieveSources (real loader, if populated)", () => {
  it("returns [] gracefully for an empty query", () => {
    expect(retrieveSources("   ")).toEqual([]);
  });

  it(
    "only returns verified-shape hits when the corpus is populated",
    () => {
      if (getAllSourceRecords().length === 0) {
        // Corpus not imported in this environment — documented, not a failure.
        expect(retrieveSources("What is the meaning of life?")).toEqual([]);
        return;
      }
      const hits = retrieveSources("What is the meaning of life?", { limit: 10 });
      for (const hit of hits) {
        expect(hit.record.canonicalRef).toBeTruthy();
        expect(hit.score).toBeGreaterThanOrEqual(3);
      }
    },
    20000,
  );

  it("returns explicitly philosophical sources for a meaning-of-life query", () => {
    if (getAllSourceRecords().length === 0) return;

    const hits = rerankHits(
      "What is the meaning of life?",
      retrieveSources("What is the meaning of life?", { limit: 24 }).filter(verifyHit),
      5,
    );
    const philosophicalSignals = new Set([
      "meaning-of-life",
      "human-purpose",
      "philosophical-inquiry",
      "purpose",
      "responsibility",
      "service",
      "wisdom",
      "mortality",
    ]);

    expect(hits.length).toBeGreaterThanOrEqual(3);
    for (const hit of hits.slice(0, 3)) {
      const topics = [...hit.record.topics, ...hit.record.relatedTopics];
      expect(topics.some((topic) => philosophicalSignals.has(topic))).toBe(true);
    }
    expect(hits.slice(0, 3).map((hit) => hit.record.canonicalRef)).not.toContain(
      "Proverbs 19:23",
    );
    expect(hits.slice(0, 3).map((hit) => hit.record.canonicalRef)).not.toContain(
      "Psalms 133:3",
    );
  });
});

describe("rerankHits", () => {
  it("rewards passages with original text and English, and drops empty text", () => {
    const ranked = rankFixtures("What is the meaning of life?");
    const reranked = rerankHits("What is the meaning of life?", ranked, 6);
    expect(reranked.length).toBeGreaterThan(0);
    expect(reranked.length).toBeLessThanOrEqual(6);
    for (const hit of reranked) {
      expect(hit.record.originalText || hit.record.englishText).toBeTruthy();
    }
  });

  it("caps results per book for diversity", () => {
    const ranked = rankFixtures("What is the meaning of life?");
    const reranked = rerankHits("What is the meaning of life?", ranked, 10);
    const counts = new Map<string, number>();
    for (const hit of reranked) {
      counts.set(hit.record.sourceTitle, (counts.get(hit.record.sourceTitle) ?? 0) + 1);
    }
    for (const count of counts.values()) {
      expect(count).toBeLessThanOrEqual(3);
    }
  });
});

describe("assessRetrievalConfidence", () => {
  it("abstains when there are no hits", () => {
    const result = assessRetrievalConfidence([]);
    expect(result.abstain).toBe(true);
    expect(result.level).toBe("low");
  });

  it("recommends multi-lens for a philosophical query with strong hits", () => {
    const ranked = rankFixtures("What is the meaning of life?").filter((h) => h.score > 0);
    const result = assessRetrievalConfidence(ranked);
    expect(result.abstain).toBe(false);
    expect(result.useMultiLens).toBe(true);
  });

  it("does not abstain on a clearly strong single-topic match", () => {
    const ranked = rankFixtures("A soft answer turns away anger and wrath.").filter(
      (h) => h.score > 0,
    );
    const result = assessRetrievalConfidence(ranked);
    expect(result.abstain).toBe(false);
  });
});

describe("verifyHit", () => {
  it("passes for a fixture with original text, ref, url, and license", () => {
    const record = FIXTURES.find((f) => f.id === "genesis-1-27")!;
    expect(verifyHit({ record, score: 10, reasons: [] })).toBe(true);
  });

  it("fails when original text is missing", () => {
    const record = { ...FIXTURES.find((f) => f.id === "genesis-1-27")!, originalText: "" };
    expect(verifyHit({ record, score: 10, reasons: [] })).toBe(false);
  });

  it("fails when the sefaria url is missing", () => {
    const record = { ...FIXTURES.find((f) => f.id === "genesis-1-27")!, sefariaUrl: "" };
    expect(verifyHit({ record, score: 10, reasons: [] })).toBe(false);
  });

  it("fails when license metadata is missing", () => {
    const record = {
      ...FIXTURES.find((f) => f.id === "genesis-1-27")!,
      license: "",
      hebrewLicense: undefined,
    };
    expect(verifyHit({ record, score: 10, reasons: [] })).toBe(false);
  });
});
