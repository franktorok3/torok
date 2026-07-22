import type { OriginalLanguage, SourceCategory as WisdomSourceCategory } from "./types";
import type { SourcePanel } from "./types";
import type { RetrievalHit } from "@/lib/library";
import type { SourceCategory as LibraryCategory, SourceRecord } from "@/lib/library/types";

export type LensCard = {
  id: string;
  title: string;
  explanation: string;
  sourcePanel: SourcePanel;
};

export type EngineMode = "single" | "multi" | "abstain" | "curated-fallback";

function mapCategory(cat: LibraryCategory): WisdomSourceCategory {
  switch (cat) {
    case "torah":
      return "torah";
    case "prophets":
    case "writings":
      return "tanakh";
    case "mishnah":
    case "talmud":
    case "midrash":
      return "rabbinic";
    default:
      return "later";
  }
}

function lensTitle(record: SourceRecord, concepts: string[]): string {
  const cat = record.sourceCategory;
  if (cat === "writings" && /Ecclesiastes/i.test(record.sourceTitle)) {
    return "Purpose amid uncertainty";
  }
  if (cat === "writings" && /Proverbs/i.test(record.sourceTitle)) {
    return "Wisdom for the path";
  }
  if (cat === "writings" && /Psalms/i.test(record.sourceTitle)) {
    return "A heart before God";
  }
  if (cat === "mishnah" || /Avot/i.test(record.sourceTitle)) {
    return "Character and responsibility";
  }
  if (cat === "ethics") {
    return "A path of ethical growth";
  }
  if (cat === "torah" && /^Genesis\s+[12]:/i.test(record.canonicalRef)) {
    return "Creation and human purpose";
  }
  if (concepts.includes("justice")) return "Justice and responsibility";
  if (concepts.includes("courage")) return "Courage in action";
  if (concepts.includes("community")) return "Belonging and community";
  if (concepts.includes("joy")) return "Joy and gratitude";
  return record.sourceTitle;
}

function explanationFor(record: SourceRecord, concepts: string[]): string {
  const conceptHint = concepts.slice(0, 2).join(" and ") || "this question";
  const english = (record.englishText ?? "").slice(0, 120);
  return `This ${record.sourceCategory} source speaks to ${conceptHint}. Torok offers it as one classical lens for reflection — not a ruling.${english ? "" : ""}`;
}

export function hitToSourcePanel(hit: RetrievalHit): SourcePanel {
  const r = hit.record;
  return {
    ref: r.canonicalRef,
    citationLabel: r.canonicalRef,
    category: mapCategory(r.sourceCategory),
    originalText: r.originalText,
    originalLanguage: r.originalLanguage as OriginalLanguage,
    hebrew: r.originalText,
    english: r.englishText ?? null,
    englishKind: r.englishIsParaphrase ? "paraphrase" : "quotation",
    sefariaUrl: r.sefariaUrl,
    originalEdition: r.hebrewVersionTitle ?? null,
    originalLicense: r.hebrewLicense ?? r.license,
    hebrewVersionTitle: r.hebrewVersionTitle ?? null,
    hebrewLicense: r.hebrewLicense ?? null,
    englishVersionTitle: r.versionTitle ?? null,
    englishLicense: r.license,
    englishIsTranslation: Boolean(r.englishText) && r.englishIsQuotation,
    incomplete: !r.originalText,
    historicalContext: `${r.sourceTitle} · ${r.sourceCategory}`,
    viewpoint: hit.reasons.slice(0, 2).join("; ") || undefined,
  };
}

export function buildLenses(
  hits: RetrievalHit[],
  concepts: string[],
  limit = 3,
): LensCard[] {
  const lenses: LensCard[] = [];
  const seenBooks = new Set<string>();

  for (const hit of hits) {
    if (lenses.length >= limit) break;
    const book = hit.record.sourceTitle;
    if (seenBooks.has(book) && lenses.length > 0) continue;
    seenBooks.add(book);
    lenses.push({
      id: hit.record.id,
      title: lensTitle(hit.record, concepts),
      explanation: explanationFor(hit.record, concepts),
      sourcePanel: hitToSourcePanel(hit),
    });
  }

  return lenses;
}

export function synthesisFor(concepts: string[]): string {
  const top = concepts.slice(0, 3);
  if (!top.length) {
    return "Jewish tradition holds more than one serious answer to a question like this. The sources above are starting points for study, not a single official claim.";
  }
  return `Jewish tradition often approaches ${top.join(", ")} through more than one classical lens. The sources above invite study and reflection — not a single official answer.`;
}

export function practiceFor(concepts: string[]): string {
  if (concepts.includes("purpose") || concepts.includes("responsibility")) {
    return "Name one responsibility you already carry that gives your days direction — then take one small faithful step in that direction today.";
  }
  if (concepts.includes("justice")) {
    return "Choose one concrete act of fairness you can take today, even if it is small.";
  }
  if (concepts.includes("courage")) {
    return "Name the fear honestly, then take the smallest brave step that still honors your values.";
  }
  return "Take one quiet minute to name what matters most in this moment, then choose one action that serves it.";
}

export function reflectionFor(concepts: string[]): string {
  if (concepts.includes("purpose")) {
    return "What would it mean to live today as if your life already carries purpose through the good you can do?";
  }
  if (concepts.includes("justice") && concepts.includes("courage")) {
    return "What would speaking up for fairness look like in a way that is both brave and careful?";
  }
  return "Which of these sources feels most alive for the moment you are in — and why?";
}

export function acknowledgmentFor(
  intents: string[],
  concepts: string[],
): string {
  if (intents.includes("philosophical")) {
    return "That is one of the oldest human questions — Jewish wisdom offers more than one serious lens.";
  }
  if (concepts.includes("grief")) {
    return "Grief asks for gentleness and company, not easy answers.";
  }
  if (concepts.includes("justice")) {
    return "A sense of injustice is already a kind of moral attention.";
  }
  return "Thank you for sharing what’s on your mind.";
}
