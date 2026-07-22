export type SafetyKind =
  | "crisis"
  | "abuse"
  | "medical"
  | "legal"
  | "halacha"
  | null;

export interface SafetyAssessment {
  kind: SafetyKind;
  triggered: boolean;
  matchedTerms: string[];
}

const PATTERNS: { kind: Exclude<SafetyKind, null>; terms: RegExp[] }[] = [
  {
    kind: "crisis",
    terms: [
      /\bsuicid(?:e|al)\b/i,
      /\bkill(?:ing)? myself\b/i,
      /\bend my life\b/i,
      /\bself[-\s]?harm\b/i,
      /\bwant to die\b/i,
      /\bhurt myself\b/i,
      /\boverdose\b/i,
      /\bcutting myself\b/i,
    ],
  },
  {
    kind: "abuse",
    terms: [
      /\babus(?:e|ed|ing|ive)\b/i,
      /\bdomestic violence\b/i,
      /\bbeing (?:hit|beaten|hurt) by\b/i,
      /\bsexual assault\b/i,
      /\brap(?:e|ed|ing)\b/i,
      /\btraffick(?:ing|ed)?\b/i,
    ],
  },
  {
    kind: "medical",
    terms: [
      /\bdiagnos(?:e|is|ed)\b/i,
      /\bmedication\b/i,
      /\bprescribe\b/i,
      /\bchest pain\b/i,
      /\bemergency room\b/i,
      /\bmedical advice\b/i,
      /\bsymptoms?\b/i,
    ],
  },
  {
    kind: "legal",
    terms: [
      /\blawsuit\b/i,
      /\battorney\b/i,
      /\blegal advice\b/i,
      /\bcourt case\b/i,
      /\bcriminal charge\b/i,
      /\bdeportation\b/i,
    ],
  },
  {
    kind: "halacha",
    terms: [
      /\bhalach(?:a|ic|ah)\b/i,
      /\bpsak\b/i,
      /\bis it kosher\b/i,
      /\bam i allowed to\b/i,
      /\bpermitted (?:on|to)\b/i,
      /\bforbidden (?:on|to)\b/i,
      /\bruling on\b/i,
      /\bwhat does jewish law (?:say|require)\b/i,
      /\bshabbat (?:can i|may i|is it)\b/i,
    ],
  },
];

export function assessSafety(input: string): SafetyAssessment {
  const matchedTerms: string[] = [];
  let kind: SafetyKind = null;

  for (const group of PATTERNS) {
    for (const pattern of group.terms) {
      const match = input.match(pattern);
      if (match) {
        matchedTerms.push(match[0]);
        if (!kind) kind = group.kind;
      }
    }
  }

  return {
    kind,
    triggered: kind !== null,
    matchedTerms,
  };
}

export function safetyResponseCopy(kind: Exclude<SafetyKind, null>): {
  hearing: string;
  forToday: string;
  reflectionQuestion?: string;
} {
  switch (kind) {
    case "crisis":
      return {
        hearing:
          "It sounds like you may be in real pain or danger. I’m glad you reached out, and I want to respond carefully.",
        forToday:
          "Please seek immediate help from people equipped for this moment. In the U.S., you can call or text 988 (Suicide & Crisis Lifeline). If you are in danger now, contact local emergency services. Torok cannot provide crisis care.",
      };
    case "abuse":
      return {
        hearing:
          "You may be describing harm or abuse. That deserves safety and skilled support — not a reflective teaching alone.",
        forToday:
          "If you are unsafe, contact local emergency services. In the U.S., the National Domestic Violence Hotline is 1-800-799-7233 / thehotline.org. Please turn toward trusted people and qualified help.",
      };
    case "medical":
      return {
        hearing:
          "This sounds like a medical concern. Torok is a learning companion, not a clinician.",
        forToday:
          "Please consult a qualified healthcare professional or emergency services for medical questions. I can still offer a gentle reflective teaching if you’d like — but not medical guidance.",
        reflectionQuestion:
          "Who is a trusted professional you can contact about this?",
      };
    case "legal":
      return {
        hearing:
          "This touches legal territory. Torok cannot provide legal advice.",
        forToday:
          "Please speak with a licensed attorney or appropriate legal aid service about your situation. Reflection can support clarity, but it cannot replace legal counsel.",
        reflectionQuestion:
          "What factual information would help a professional advise you well?",
      };
    case "halacha":
      return {
        hearing:
          "You’re asking something that may require a careful religious ruling or pastoral guidance.",
        forToday:
          "For questions of Jewish law or personal religious practice, please consult a trusted rabbi who knows you and your community. Torok can share educational reflections, but not psak or pastoral counseling.",
        reflectionQuestion:
          "Is there a rabbi or teacher you trust enough to bring this question to?",
      };
  }
}
