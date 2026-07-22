/**
 * Manually reviewed gold-set evaluation (reported separately from the 250 suite).
 * Usage: npm run benchmark:gold
 */
import fs from "node:fs";
import path from "node:path";
import { retrieveSources } from "../src/lib/library/retrieve";
import { rerankHits } from "../src/lib/library/rerank";
import { composeWisdom } from "../src/lib/wisdom/compose";
import { normalize } from "../src/lib/library/concepts";

type GoldItem = {
  id: string;
  question: string;
  acceptablePrimaryConcepts: string[];
  appropriateSourceFamilies: string[];
  acceptableSourceClusters: string[];
  unacceptable: string[];
  expectedMode: "single" | "multi" | "abstain" | "safety";
};

const ROOT = path.resolve(__dirname, "..");
const GOLD = path.join(ROOT, "data", "benchmarks", "gold-set.json");
const REPORT = path.join(ROOT, "data", "benchmarks", "gold-report.json");

function main() {
  const suite = JSON.parse(fs.readFileSync(GOLD, "utf8")) as { items: GoldItem[] };
  let modeOk = 0;
  let familyOk = 0;
  let clusterOk = 0;
  let severe = 0;
  const failures: Array<{ id: string; reason: string }> = [];

  for (const item of suite.items) {
    const response = composeWisdom(item.question);
    const hits = rerankHits(
      item.question,
      retrieveSources(item.question, { limit: 24 }),
      5,
    );

    const modePass =
      item.expectedMode === "single"
        ? response.mode === "teaching" || response.mode === "multi"
        : item.expectedMode === "multi"
          ? response.mode === "multi"
          : response.mode === item.expectedMode ||
            (item.expectedMode === "abstain" &&
              (response.mode === "abstain" || response.mode === "fallback"));

    if (modePass) modeOk += 1;
    else failures.push({ id: item.id, reason: `mode expected ${item.expectedMode} got ${response.mode}` });

    if (item.expectedMode === "safety" || item.expectedMode === "abstain") {
      familyOk += 1;
      clusterOk += 1;
      continue;
    }

    const top = hits[0];
    const familyPass =
      !item.appropriateSourceFamilies.length ||
      (top &&
        item.appropriateSourceFamilies.includes(top.record.sourceCategory));
    if (familyPass) familyOk += 1;
    else
      failures.push({
        id: item.id,
        reason: `family ${top?.record.sourceCategory} not in ${item.appropriateSourceFamilies.join(",")}`,
      });

    const blob = hits
      .slice(0, 5)
      .map((h) => `${h.record.canonicalRef} ${h.record.sourceTitle}`)
      .join(" | ")
      .toLowerCase();
    const clusterPass =
      !item.acceptableSourceClusters.length ||
      item.acceptableSourceClusters.some((c) =>
        blob.includes(normalize(c).slice(0, 18)),
      );
    if (clusterPass) clusterOk += 1;
    else
      failures.push({
        id: item.id,
        reason: `no acceptable cluster in top five`,
      });

    const topBlob = `${top?.record.canonicalRef} ${top?.record.englishText}`.toLowerCase();
    if (
      /meaning of life|why are we here|meaningful life/i.test(item.question) &&
      (/anger waxed|exodus 32:19|sanhedrin 4:5/.test(topBlob) ||
        (/capital cases/.test(topBlob) && !/ecclesiastes/.test(topBlob)))
    ) {
      severe += 1;
      failures.push({ id: item.id, reason: "severe religious-context error" });
    }
  }

  const n = suite.items.length || 1;
  const report = {
    ranAt: new Date().toISOString(),
    count: suite.items.length,
    modeAccuracy: +(modeOk / n).toFixed(3),
    topFamilyAccuracy: +(familyOk / n).toFixed(3),
    clusterInTop5Accuracy: +(clusterOk / n).toFixed(3),
    severeReligiousContextErrors: severe,
    failures: failures.slice(0, 40),
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (severe > 0) process.exitCode = 2;
}

main();
