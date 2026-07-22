import { assessSafety, safetyResponseCopy } from "./safety";
import { fallbackTeaching, selectTeaching } from "./matcher";
import { SHORT_DISCLAIMER, type WisdomResponse } from "./types";

const MAX_INPUT = 2000;

function summarizeHearing(input: string, themeLabel?: string): string {
  const trimmed = input.trim().replace(/\s+/g, " ");
  const preview =
    trimmed.length > 140 ? `${trimmed.slice(0, 137).trim()}…` : trimmed;

  if (themeLabel) {
    return `You’re sitting with something that touches ${themeLabel.toLowerCase()}: “${preview}”`;
  }

  return `You’re bringing this moment: “${preview}”`;
}

export function composeWisdom(rawInput: string): WisdomResponse {
  const input = rawInput.trim();

  if (!input) {
    return {
      mode: "empty",
      hearing: "I didn’t catch a situation yet.",
      forToday:
        "Share a moment you’re in — even a short phrase — and I’ll offer a Jewish teaching and one practical reflection.",
      disclaimer: SHORT_DISCLAIMER,
      engineNote:
        "Local curated engine · waiting for input (not a generative AI model)",
    };
  }

  const clipped = input.slice(0, MAX_INPUT);
  const safety = assessSafety(clipped);

  if (safety.triggered && safety.kind) {
    const copy = safetyResponseCopy(safety.kind);
    const hardStop = safety.kind === "crisis" || safety.kind === "abuse";

    if (hardStop) {
      return {
        mode: "safety",
        hearing: copy.hearing,
        forToday: copy.forToday,
        reflectionQuestion: copy.reflectionQuestion,
        disclaimer: SHORT_DISCLAIMER,
        engineNote: "Safety routing · crisis/abuse pathway",
      };
    }

    // Soft safety: still offer a teaching after clear boundaries
    const match = selectTeaching(clipped);
    const teaching = match?.teaching ?? fallbackTeaching();

    return {
      mode: "safety",
      hearing: copy.hearing,
      teaching: {
        paraphrase: teaching.paraphrase,
        explanation: teaching.explanation,
        source: teaching.source,
        themeLabel: teaching.themeLabel,
      },
      forToday: `${copy.forToday} Meanwhile, one educational lens: ${teaching.takeaway}`,
      reflectionQuestion:
        copy.reflectionQuestion ?? teaching.reflectionQuestion,
      disclaimer: SHORT_DISCLAIMER,
      matchedTheme: teaching.theme,
      engineNote: `Safety routing · ${safety.kind} + curated teaching`,
    };
  }

  const match = selectTeaching(clipped);

  if (!match || match.score < 3) {
    const teaching = fallbackTeaching();
    return {
      mode: "fallback",
      hearing: summarizeHearing(clipped, teaching.themeLabel),
      teaching: {
        paraphrase: teaching.paraphrase,
        explanation: teaching.explanation,
        source: teaching.source,
        themeLabel: teaching.themeLabel,
      },
      forToday: teaching.takeaway,
      reflectionQuestion: teaching.reflectionQuestion,
      disclaimer: SHORT_DISCLAIMER,
      matchedTheme: teaching.theme,
      engineNote:
        "Local curated engine · gentle fallback match (keyword themes, not generative AI)",
    };
  }

  const { teaching } = match;

  return {
    mode: "teaching",
    hearing: summarizeHearing(clipped, teaching.themeLabel),
    teaching: {
      paraphrase: teaching.paraphrase,
      explanation: teaching.explanation,
      source: teaching.source,
      themeLabel: teaching.themeLabel,
    },
    forToday: teaching.takeaway,
    reflectionQuestion: teaching.reflectionQuestion,
    disclaimer: SHORT_DISCLAIMER,
    matchedTheme: teaching.theme,
    engineNote: `Local curated engine · matched theme “${teaching.themeLabel}” via keywords`,
  };
}

export function formatResponseForClipboard(response: WisdomResponse): string {
  const parts = [
    "Torok",
    "",
    `What I’m hearing: ${response.hearing}`,
  ];

  if (response.teaching) {
    parts.push(
      "",
      `A Jewish teaching (${response.teaching.themeLabel}):`,
      response.teaching.paraphrase,
      response.teaching.explanation,
      `Source: ${response.teaching.source}`,
    );
  }

  parts.push("", `For today: ${response.forToday}`);

  if (response.reflectionQuestion) {
    parts.push("", `A question to carry: ${response.reflectionQuestion}`);
  }

  parts.push("", response.disclaimer);
  return parts.join("\n");
}
