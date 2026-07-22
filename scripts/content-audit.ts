import { auditTeachingsLibrary } from "../src/lib/wisdom/audit";
import { TEACHINGS } from "../src/lib/wisdom/teachings";
import { getTorahManifest } from "../src/lib/torah";

const { flags, libraryReviewStatus } = auditTeachingsLibrary();

const byCode = flags.reduce<Record<string, number>>((acc, flag) => {
  acc[flag.code] = (acc[flag.code] ?? 0) + 1;
  return acc;
}, {});

console.log("Torok content audit");
console.log(`Editorial teachings: ${TEACHINGS.length}`);
console.log(`Library review status: ${libraryReviewStatus}`);
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

console.log(
  libraryReviewStatus === "educator-reviewed"
    ? "\nNote: educator-reviewed should only be set after a qualified rabbi or Jewish educator has actually reviewed the library."
    : "\nLibrary is awaiting educator review and must not be described as editorially certified.",
);
