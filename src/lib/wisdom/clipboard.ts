import type { WisdomResponse } from "./types";

export function formatResponseForClipboard(response: WisdomResponse): string {
  const parts = ["Torok", "", response.acknowledgment];

  if (response.teaching) {
    const label =
      response.teaching.textKind === "quotation" ? "Quotation" : "Paraphrase";
    parts.push(
      "",
      "A teaching for this moment",
      `${label}: ${response.teaching.text}`,
    );
    if (response.teaching.translationAttribution) {
      parts.push(`Translation: ${response.teaching.translationAttribution}`);
    }
    for (const source of response.teaching.sources) {
      parts.push(`Source: ${source.canonical}`);
    }
    parts.push("", response.teaching.modernApplication);
  }

  parts.push("", `Try this today: ${response.tryThisToday}`);

  if (response.reflectionQuestion) {
    parts.push("", `A question to carry: ${response.reflectionQuestion}`);
  }

  if (response.torahPassages?.length) {
    parts.push("", "Explore this in Torah");
    for (const p of response.torahPassages) {
      parts.push(
        `${p.ref}: ${p.english}`,
        `(${p.englishVersionTitle}; ${p.englishLicense})`,
        p.whyRelevant,
      );
    }
  }

  return parts.join("\n");
}
