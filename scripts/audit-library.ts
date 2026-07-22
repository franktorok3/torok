/**
 * Simple audit for the local library corpus: record counts, license
 * presence, and breakdown by category.
 *
 * Usage: npx tsx scripts/audit-library.ts
 */
import {
  corpusIsAvailable,
  getAllSourceRecords,
  loadManifest,
} from "../src/lib/library";
import type { SourceCategory } from "../src/lib/library/types";

if (!corpusIsAvailable()) {
  console.log("Library corpus unavailable. Run: npx tsx scripts/import-library.ts");
  process.exit(1);
}

const manifest = loadManifest();
const records = getAllSourceRecords();

console.log("Torok library audit");
console.log(`Imported at: ${manifest.importedAt}`);
console.log(`Collections: ${manifest.totals.collections}`);
console.log(`Records: ${manifest.totals.records} (loaded ${records.length})`);
console.log(`Licenses observed: ${manifest.licenses.join(", ") || "none"}`);

const missingLicense = records.filter((r) => !r.license || r.license.toLowerCase() === "unknown");
console.log(`Records with missing/unknown license: ${missingLicense.length}`);

const missingOriginal = records.filter((r) => !r.originalText?.trim());
console.log(`Records missing original-language text: ${missingOriginal.length}`);

const byCategory = records.reduce<Record<string, number>>((acc, r) => {
  acc[r.sourceCategory] = (acc[r.sourceCategory] ?? 0) + 1;
  return acc;
}, {});

console.log("\nBy category:");
for (const category of Object.keys(byCategory).sort()) {
  console.log(`  ${category as SourceCategory}: ${byCategory[category]}`);
}

console.log("\nBy collection:");
for (const collection of manifest.collections) {
  console.log(
    `  ${collection.slug} (${collection.category}): ${collection.units} units — EN ${collection.englishLicense ?? "?"} / HE ${collection.hebrewLicense ?? "?"}`,
  );
}
