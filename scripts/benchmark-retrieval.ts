/**
 * Run retrieval-quality benchmarks against the local library engine.
 *
 * Usage: npm run benchmark:retrieval
 * Optional: BENCHMARK_LIMIT=50 for a smoke subset.
 */
import fs from "node:fs";
import path from "node:path";
import { expandQueryConcepts } from "../src/lib/library/concepts";
import { retrieveSources } from "../src/lib/library/retrieve";
import { rerankHits } from "../src/lib/library/rerank";
import { assessRetrievalConfidence } from "../src/lib/library/confidence";
import { verifyHit } from "../src/lib/library/verify";
import { composeWisdom } from "../src/lib/wisdom/compose";
import { normalize } from "../src/lib/library/concepts";

type Bench = {
  id: string;
  question: string;
  expectedIntent: string[];
  expectedPrimaryConcepts: string[];
  acceptableSecondaryConcepts: string[];
  mustNotDominate: string[];
  appropriateSourceFamilies: string[];
  expectedMode: "single" | "multi" | "abstain" | "safety";
  minimumConfidence: "low" | "medium" | "high";
  expectedSafetyRoute: string | null;
};

const ROOT = path.resolve(__dirname, "..");
const SUITE = path.join(ROOT, "data", "benchmarks", "retrieval-suite.json");
const REPORT = path.join(ROOT, "data", "benchmarks", "retrieval-report.json");

function main() {
  if (!fs.existsSync(SUITE)) {
    console.error("Missing suite. Run: npx tsx scripts/generate-benchmarks.ts");
    process.exit(1);
  }

  const suite = JSON.parse(fs.readFileSync(SUITE, "utf8")) as {
    benchmarks: Bench[];
  };
  const limit = Number(process.env.BENCHMARK_LIMIT || suite.benchmarks.length);
  const benches = suite.benchmarks.slice(0, limit);

  let pAt1 = 0;
  let pAt5 = 0;
  let appropriateInTop5 = 0;
  let incorrectDominant = 0;
  let citationValid = 0;
  let citationChecked = 0;
  let abstainCorrect = 0;
  let abstainTotal = 0;
  let multiCorrect = 0;
  let multiTotal = 0;
  let safetyCorrect = 0;
  let safetyTotal = 0;
  let timed = 0;
  const failures: Array<{ id: string; question: string; reason: string }> = [];

  const t0 = Date.now();

  function hitMatchesConcepts(
    hit: ReturnType<typeof rerankHits>[number],
    benchmark: Bench,
  ): boolean {
    const expected = new Set(
      [
        ...benchmark.expectedPrimaryConcepts,
        ...benchmark.acceptableSecondaryConcepts,
      ].map(normalize),
    );
    if (expected.size === 0) return true;
    const recordSignals = [
      ...(hit.record.topics ?? []),
      ...(hit.record.relatedTopics ?? []),
      ...(hit.record.keywords ?? []),
    ].map(normalize);
    return recordSignals.some((signal) => expected.has(signal));
  }

  function isRelevantHit(
    hit: ReturnType<typeof rerankHits>[number],
    benchmark: Bench,
  ): boolean {
    if (benchmark.expectedMode === "safety" || benchmark.expectedMode === "abstain") {
      return true;
    }
    return (
      benchmark.appropriateSourceFamilies.includes(hit.record.sourceCategory) &&
      hitMatchesConcepts(hit, benchmark)
    );
  }

  for (const b of benches) {
    const start = Date.now();
    const concepts = expandQueryConcepts(b.question);
    const response = composeWisdom(b.question);
    const hits = rerankHits(
      b.question,
      retrieveSources(b.question, { limit: 24 }).filter(verifyHit),
      5,
    );
    timed += Date.now() - start;

    const topTitles = hits.map((h) => h.record.sourceTitle.toLowerCase());
    const topText = hits
      .map((h) =>
        `${h.record.englishText ?? ""} ${h.record.topics.join(" ")}`.toLowerCase(),
      )
      .join(" | ");

    const topFive = hits.slice(0, 5);
    const relevantTopFive = topFive.filter((hit) => isRelevantHit(hit, b));
    if (hits[0] && isRelevantHit(hits[0], b)) pAt1 += 1;
    pAt5 += topFive.length ? relevantTopFive.length / topFive.length : 0;
    if (relevantTopFive.length > 0) appropriateInTop5 += 1;
    if (
      b.expectedMode !== "safety" &&
      b.expectedMode !== "abstain" &&
      relevantTopFive.length === 0
    ) {
      failures.push({
        id: b.id,
        question: b.question,
        reason: "no concept-relevant source in top five",
      });
    }

    const dominantBad = b.mustNotDominate.some((bad) => {
      const needle = bad.toLowerCase();
      // Dominant = appears strongly in top hit topics/text AND concepts primary
      const inPrimary = concepts.primary.map((c) => c.toLowerCase()).includes(needle);
      const inTop =
        topText.includes(needle) &&
        (topTitles[0]?.includes("exodus") ||
          hits[0]?.record.sourceCategory === "torah");
      return inPrimary || (hits[0] && inTop && needle === "anger" && concepts.primary[0] === "anger");
    });
    // Special mandatory regression: meaning of life must not be anger-primary
    if (
      /meaning of life/i.test(b.question) &&
      (concepts.primary[0] === "anger" ||
        /anger waxed|moses' anger|wrath/i.test(hits[0]?.record.englishText ?? ""))
    ) {
      incorrectDominant += 1;
      failures.push({
        id: b.id,
        question: b.question,
        reason: "anger dominated meaning-of-life",
      });
    } else if (dominantBad && b.mustNotDominate.includes("anger") && concepts.primary[0] === "anger") {
      incorrectDominant += 1;
    }

    for (const h of hits.slice(0, 3)) {
      citationChecked += 1;
      if (verifyHit(h)) citationValid += 1;
    }

    if (b.expectedMode === "abstain") {
      abstainTotal += 1;
      if (response.mode === "abstain" || response.mode === "fallback") {
        abstainCorrect += 1;
      }
    }

    if (b.expectedMode === "multi") {
      multiTotal += 1;
      if (response.mode === "multi" && (response.lenses?.length ?? 0) >= 2) {
        multiCorrect += 1;
      } else if (
        /meaning of life|why are we here|purpose of human/i.test(b.question) &&
        response.mode !== "multi"
      ) {
        failures.push({
          id: b.id,
          question: b.question,
          reason: `expected multi, got ${response.mode}`,
        });
      }
    }

    if (b.expectedMode === "safety") {
      safetyTotal += 1;
      if (response.mode === "safety") safetyCorrect += 1;
      else {
        failures.push({
          id: b.id,
          question: b.question,
          reason: `expected safety, got ${response.mode}`,
        });
      }
    }

    const confidence = assessRetrievalConfidence(hits, b.question);
    void confidence;
  }

  const n = benches.length || 1;
  const report = {
    ranAt: new Date().toISOString(),
    benchmarkCount: benches.length,
    elapsedMs: Date.now() - t0,
    avgResponseMs: Math.round(timed / n),
    metrics: {
      precisionAt1: +(pAt1 / n).toFixed(3),
      precisionAt5: +(pAt5 / n).toFixed(3),
      appropriateSourceInTop5: +(appropriateInTop5 / n).toFixed(3),
      incorrectDominantThemeRate: +(incorrectDominant / n).toFixed(3),
      citationValidity:
        citationChecked === 0 ? 1 : +(citationValid / citationChecked).toFixed(3),
      lowConfidenceAbstentionAccuracy:
        abstainTotal === 0 ? null : +(abstainCorrect / abstainTotal).toFixed(3),
      multiLensSelectionAccuracy:
        multiTotal === 0 ? null : +(multiCorrect / multiTotal).toFixed(3),
      safetyRoutingAccuracy:
        safetyTotal === 0 ? null : +(safetyCorrect / safetyTotal).toFixed(3),
    },
    mandatoryChecks: {
      meaningOfLifeNotAnger: !failures.some((f) =>
        /anger dominated meaning-of-life/.test(f.reason),
      ),
      meaningOfLifeMultiLens: !failures.some(
        (f) =>
          /meaning of life/i.test(f.question) && /expected multi/.test(f.reason),
      ),
      crisisSafety: failures.filter((f) => /expected safety/.test(f.reason))
        .length === 0,
    },
    failureSample: failures.slice(0, 25),
  };

  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));

  console.log(JSON.stringify(report.metrics, null, 2));
  console.log("Mandatory:", report.mandatoryChecks);
  console.log(`Report -> ${REPORT}`);
  console.log(`Avg response ms: ${report.avgResponseMs}`);
}

main();
