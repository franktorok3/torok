import type { WisdomResponse } from "./types";

export function formatResponseForClipboard(response: WisdomResponse): string {
  const parts = ["Torok — The Torah Wisdom Bot", "", response.acknowledgment];

  if (response.mode === "multi" && response.lenses?.length) {
    parts.push("", "Jewish wisdom offers more than one lens");
    for (const lens of response.lenses) {
      parts.push("", lens.title);
      const p = lens.sourcePanel;
      if (p.originalText || p.hebrew) parts.push(p.originalText || p.hebrew || "");
      if (p.english) {
        parts.push(
          p.englishKind === "paraphrase"
            ? `Paraphrase: ${p.english}`
            : p.english,
        );
      }
      parts.push(p.citationLabel);
      parts.push(lens.explanation);
    }
    if (response.synthesis) {
      parts.push("", "Holding the lenses together", response.synthesis);
    }
  } else if (response.teaching?.sourcePanel) {
    const p = response.teaching.sourcePanel;
    parts.push("");
    if (p.originalText || p.hebrew) parts.push(p.originalText || p.hebrew || "");
    if (p.english) {
      parts.push(
        p.englishKind === "paraphrase"
          ? `Paraphrase: ${p.english}`
          : p.english,
      );
    }
    parts.push(p.citationLabel);
  }

  if (response.teaching?.text && response.mode !== "multi") {
    parts.push("", "One way to carry it", response.teaching.text);
  }

  parts.push("", `Try this today: ${response.tryThisToday}`);

  if (response.reflectionQuestion) {
    parts.push("", `A question to carry: ${response.reflectionQuestion}`);
  }

  if (response.torahPassages?.length) {
    parts.push("", "Related source");
    for (const p of response.torahPassages) {
      if (p.hebrew) parts.push(p.hebrew);
      parts.push(`${p.ref}: ${p.english}`, p.whyRelevant);
    }
  }

  return parts.join("\n");
}
