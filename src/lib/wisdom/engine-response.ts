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

/** Turn concept ids into short, human-readable phrases for prose. */
export function humanizeConcepts(concepts: string[], limit = 2): string {
  const labels = concepts
    .slice(0, limit)
    .map((c) => c.replace(/-/g, " ").toLowerCase().trim())
    .filter(Boolean);
  if (labels.length === 0) return "this moment";
  if (labels.length === 1) return labels[0];
  return `${labels[0]} and ${labels[1]}`;
}

function familyPhrase(cat: LibraryCategory): string {
  switch (cat) {
    case "torah":
      return "From the Torah";
    case "prophets":
      return "From the Prophets";
    case "writings":
      return "From the Writings";
    case "mishnah":
      return "From rabbinic teaching";
    case "ethics":
      return "From classical mussar";
    default:
      return "From Jewish tradition";
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
  if (concepts.includes("joy") || concepts.includes("gratitude")) {
    return "Joy and gratitude";
  }
  if (concepts.includes("uncertainty") || concepts.includes("trust")) {
    return "Trust when the path is unclear";
  }
  return record.sourceTitle;
}

function explanationFor(record: SourceRecord, concepts: string[]): string {
  const focus = humanizeConcepts(concepts, 2);
  return `${familyPhrase(record.sourceCategory)}, this passage opens a window onto ${focus}.`;
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
    // Never expose scoring/debug reasons in production UI.
    viewpoint: undefined,
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
  const focus = humanizeConcepts(concepts, 3);
  if (focus === "this moment") {
    return "Jewish tradition rarely answers a question like this with only one voice. Held together, these sources invite study rather than a single official claim.";
  }
  return `Held together, these sources suggest that ${focus} can be approached from more than one classical angle — each worth sitting with on its own terms.`;
}

export function practiceFor(concepts: string[]): string {
  if (concepts.includes("uncertainty") || concepts.includes("trust")) {
    return "Name what you cannot control, then take one small next step that is still within your reach.";
  }
  if (concepts.includes("grief") || concepts.includes("mourning")) {
    return "Give the grief a little room today — a walk, a memory shared, or a quiet pause with someone you trust.";
  }
  if (concepts.includes("purpose") || concepts.includes("responsibility")) {
    return "Name one responsibility you already carry that gives your days direction — then take one small faithful step in that direction today.";
  }
  if (concepts.includes("justice")) {
    return "Choose one concrete act of fairness you can take today, even if it is small.";
  }
  if (concepts.includes("courage") || concepts.includes("fear")) {
    return "Name the fear honestly, then take the smallest brave step that still honors your values.";
  }
  if (concepts.includes("anger") || concepts.includes("patience")) {
    return "When heat rises, pause for one full breath before you speak or act.";
  }
  if (concepts.includes("speech") || concepts.includes("gossip")) {
    return "Before sharing news about someone, ask whether it is true, necessary, and kind.";
  }
  if (concepts.includes("gratitude") || concepts.includes("joy")) {
    return "Name three ordinary goods from today out loud — even small ones.";
  }
  if (concepts.includes("relationships") || concepts.includes("repair") || concepts.includes("forgiveness")) {
    return "Reach out with one honest, low-pressure message that makes repair a little more possible.";
  }
  return "Take one quiet minute to name what matters most in this moment, then choose one action that serves it.";
}

export function reflectionFor(
  concepts: string[],
  mode: "single" | "multi" = "single",
): string {
  if (mode === "multi") {
    if (concepts.includes("purpose") || concepts.includes("creation")) {
      return "Which lens gives you the most honest next step for how you want to live?";
    }
    return "Which lens speaks most clearly to the moment you are in?";
  }

  if (concepts.includes("purpose")) {
    return "What would it mean to live today as if your life already carries purpose through the good you can do?";
  }
  if (concepts.includes("uncertainty") || concepts.includes("trust")) {
    return "What would trusting the next small step look like, even while the larger picture stays unclear?";
  }
  if (concepts.includes("grief") || concepts.includes("mourning")) {
    return "What kind of company or quiet do you need most in this season of loss?";
  }
  if (concepts.includes("justice") && concepts.includes("courage")) {
    return "What would speaking up for fairness look like in a way that is both brave and careful?";
  }
  if (concepts.includes("anger") || concepts.includes("patience")) {
    return "What usually happens right before you lose patience — and what could interrupt that pattern?";
  }
  if (concepts.includes("speech") || concepts.includes("gossip")) {
    return "Where do your words most need more care this week?";
  }
  if (concepts.includes("relationships") || concepts.includes("repair")) {
    return "What is one repair you are ready to begin, even imperfectly?";
  }
  if (concepts.includes("gratitude") || concepts.includes("joy")) {
    return "What good thing have you been moving too quickly to notice?";
  }
  return "What in this teaching feels most true for the moment you are in?";
}

/** Short line for a related companion passage — no diagnostic tone. */
export function relatedWhyLine(concepts: string[]): string {
  const focus = humanizeConcepts(concepts, 1);
  if (focus === "this moment") {
    return "A companion passage for further study.";
  }
  return `A companion passage for sitting with ${focus}.`;
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
  if (concepts.includes("uncertainty") || concepts.includes("trust")) {
    return "Uncertainty is a hard place to stand — Jewish wisdom often meets it with trust, patience, and small next steps.";
  }
  if (concepts.includes("justice")) {
    return "A sense of injustice is already a kind of moral attention.";
  }
  return "Thank you for sharing what’s on your mind.";
}
