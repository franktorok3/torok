import { auditTeachingsLibrary } from "../src/lib/wisdom/audit";
import { TEACHINGS } from "../src/lib/wisdom/teachings";
import { loadCuratedOriginals } from "../src/lib/wisdom/originals";
import { getTorahManifest } from "../src/lib/torah";

const { flags, libraryReviewStatus } = auditTeachingsLibrary();
const originals = loadCuratedOriginals();

const byCode = flags.reduce<Record<string, number>>((acc, flag) => {
  acc[flag.code] = (acc[flag.code] ?? 0) + 1;
  return acc;
}, {});

const withHebrew = TEACHINGS.filter(
  (t) =>
    t.sources[0]?.hebrew?.trim() &&
    (t.sources[0].originalLanguage ?? "hebrew") === "hebrew",
).length;
const withAramaic = TEACHINGS.filter(
  (t) =>
    t.sources[0]?.hebrew?.trim() &&
    t.sources[0].originalLanguage === "aramaic",
).length;
const withoutOriginal = TEACHINGS.filter(
  (t) => !t.sources[0]?.hebrew?.trim() || t.sourceIncomplete,
).length;
const paraphrases = TEACHINGS.filter(
  (t) =>
    t.textKind === "paraphrase" ||
    t.sources[0]?.englishKind === "paraphrase",
).length;
const incompleteBlocked = flags.filter(
  (f) => f.code === "incomplete-source-blocked",
).length;

console.log("Torok content audit");
console.log(`Editorial teachings: ${TEACHINGS.length}`);
console.log(`Library review status: ${libraryReviewStatus}`);
if (originals) {
  console.log(
    `Curated originals file: ${originals.totals.complete} complete / ${originals.totals.incomplete} incomplete (fetched ${originals.importedAt})`,
  );
}
console.log(`Curated entries with verified Hebrew: ${withHebrew}`);
console.log(`Curated entries with verified Aramaic: ${withAramaic}`);
console.log(`Entries with no original-language text: ${withoutOriginal}`);
console.log(`Entries using paraphrases (teaching or source English): ${paraphrases}`);
console.log(
  `Entries blocked because required source data is incomplete: ${incompleteBlocked}`,
);
try {
  const manifest = getTorahManifest();
  console.log(
    `Torah corpus: ${manifest.totals.books} books, ${manifest.totals.chapters} chapters, ${manifest.totals.verses} verses`,
  );
  console.log(
    `English: ${manifest.englishVersionTitle} (${manifest.englishLicense})`,
  );
} catch (err) {
  console.log(`Torah corpus: unavailable (${String(err)})`);
}
console.log(`Total flags: ${flags.length}`);
console.log("Counts by code:");
for (const [code, count] of Object.entries(byCode).sort()) {
  console.log(`  ${code}: ${count}`);
}

const hebrewFirstReady = withoutOriginal === 0;
console.log(
  hebrewFirstReady
    ? "\nHebrew-first completeness: PASS (all curated entries have verified original-language text)."
    : "\nHebrew-first completeness: FAIL — do not claim completeness until originals are attached.",
);

console.log(
  libraryReviewStatus === "educator-reviewed"
    ? "\nNote: educator-reviewed should only be set after a qualified rabbi or Jewish educator has actually reviewed the library."
    : "\nLibrary is awaiting educator review and must not be described as editorially certified.",
);

if (!hebrewFirstReady) {
  process.exitCode = 1;
}
