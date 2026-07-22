import { auditTeachingsLibrary } from "../src/lib/wisdom/audit";

const { flags, libraryReviewStatus } = auditTeachingsLibrary();

const byCode = flags.reduce<Record<string, number>>((acc, flag) => {
  acc[flag.code] = (acc[flag.code] ?? 0) + 1;
  return acc;
}, {});

console.log("Torok content audit");
console.log(`Library review status: ${libraryReviewStatus}`);
console.log(`Total flags: ${flags.length}`);
console.log("Counts by code:");
for (const [code, count] of Object.entries(byCode).sort()) {
  console.log(`  ${code}: ${count}`);
}

const sample = flags.filter((f) => f.teachingId).slice(0, 8);
if (sample.length) {
  console.log("\nSample teaching flags:");
  for (const flag of sample) {
    console.log(`  [${flag.code}] ${flag.teachingId}: ${flag.message}`);
  }
}

console.log(
  libraryReviewStatus === "educator-reviewed"
    ? "\nNote: educator-reviewed should only be set after a qualified rabbi or Jewish educator has actually reviewed the library."
    : "\nLibrary is awaiting educator review and must not be described as editorially certified.",
);
