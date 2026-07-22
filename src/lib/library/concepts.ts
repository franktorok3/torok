/**
 * Everyday-language → concept expansion for hybrid retrieval.
 *
 * Turns a free-text question into retrieval concepts, intents, and
 * excluded-dominant guards. This is a retrieval aid, not theological certainty.
 */

export type QueryIntent =
  | "everyday"
  | "ethical"
  | "relationship"
  | "leadership"
  | "emotional"
  | "philosophical"
  | "textual"
  | "halacha"
  | "pastoral"
  | "crisis"
  | "ambiguous";

export interface ConceptExpansion {
  primary: string[];
  secondary: string[];
  excludedDominant: string[];
  intents: QueryIntent[];
  /** 0–1 confidence that primary concepts are well supported by the query text. */
  confidence: number;
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  const normalized = normalize(input);
  if (!normalized) return [];
  return normalized.split(" ").filter((t) => t.length > 1);
}

const DEFAULT_DOMINANT_GUARDS = ["anger", "violence"];

interface ConceptRule {
  phrases: string[];
  primary?: string[];
  secondary?: string[];
  intents?: QueryIntent[];
  clearsDominantGuard?: string[];
  weight?: number;
}

const CONCEPT_RULES: ConceptRule[] = [
  {
    phrases: [
      "meaning of life",
      "meaning of my life",
      "meaning of existence",
      "purpose of life",
      "purpose of my life",
      "purpose of human life",
      "what is my purpose",
      "why am i here",
      "why are we here",
      "why we exist",
      "why we were created",
      "point of life",
      "what is the point of it all",
      "what is the point",
      "reason we were created",
      "gives life purpose",
      "find my purpose",
      "live a meaningful life",
      "life well lived",
      "well lived",
      "live with intention",
      "duty as human",
      "what judaism say about why",
      "how should i live",
    ],
    primary: ["purpose", "creation", "humanity", "responsibility"],
    secondary: [
      "service",
      "love",
      "justice",
      "wisdom",
      "mortality",
      "joy",
      "community",
      "divine-relationship",
    ],
    intents: ["philosophical"],
    weight: 1,
  },
  {
    phrases: [
      "free will",
      "why do good people suffer",
      "meaning in suffering",
      "what is the soul",
      "what is wisdom",
      "face mortality",
      "relationship between humans and god",
      "what does it mean to be human",
      "tradition and reason",
      "how do we know what is good",
    ],
    primary: ["wisdom", "purpose", "mortality"],
    secondary: ["creation", "faith", "suffering", "divine-relationship"],
    intents: ["philosophical"],
  },
  {
    phrases: ["anger", "angry", "furious", "fury", "rage", "wrath", "fuming", "irate", "seething", "losing my temper", "lose my temper", "temper"],
    primary: ["anger"],
    secondary: ["patience", "speech"],
    intents: ["emotional"],
    clearsDominantGuard: ["anger"],
  },
  {
    phrases: ["violent", "violence", "hit someone", "hurt someone", "physically hurt"],
    secondary: ["justice", "courage"],
    intents: ["ethical"],
    clearsDominantGuard: ["violence"],
  },
  {
    phrases: [
      "injustice",
      "unjust",
      "unfair",
      "unfairness",
      "oppression",
      "oppressed",
      "discrimination",
      "exploit",
      "exploitation",
      "exploited",
      "mistreated",
      "speak up about",
      "stand up for",
      "pursue fairness",
      "righteous judgment",
      "justice justice",
    ],
    primary: ["justice"],
    secondary: ["courage", "truth", "responsibility"],
    intents: ["ethical"],
  },
  {
    phrases: [
      "gossip",
      "rumor",
      "rumour",
      "slander",
      "lashon hara",
      "talebearer",
      "speak ill",
      "spreading rumors",
      "talking behind",
      "guard my tongue",
      "guard your tongue",
      "careful speech",
      "speak truth kindly",
      "said something hurtful",
      "stop gossiping",
      "gossiping",
      "ask hard questions gently",
      "words repair or wound",
      "praise without flattery",
      "hurtful",
    ],
    primary: ["speech", "gossip"],
    secondary: ["truth", "community", "repair"],
    intents: ["ethical", "relationship"],
  },
  {
    phrases: [
      "apology",
      "apologize",
      "apologise",
      "sorry",
      "make amends",
      "forgive me",
      "how do i apologize",
      "owning up",
    ],
    primary: ["apology", "repair"],
    secondary: ["forgiveness", "humility"],
    intents: ["relationship"],
  },
  {
    phrases: [
      "grief",
      "grieving",
      "mourning",
      "bereaved",
      "lost someone",
      "someone died",
      "death in the family",
      "death of my",
      "passed away",
      "after a death",
      "honor someone's memory",
      "support someone who is mourning",
      "deep loss",
      "empty after losing",
    ],
    primary: ["grief", "mortality"],
    secondary: ["hope", "community", "compassion"],
    intents: ["pastoral", "emotional"],
  },
  {
    phrases: [
      "forgive",
      "forgiveness",
      "pardon",
      "can't forgive",
      "cannot forgive",
      "let go of a grudge",
      "letting go",
      "teshuvah",
      "after betrayal",
    ],
    primary: ["forgiveness"],
    secondary: ["repair", "mercy", "relationships"],
    intents: ["relationship", "pastoral"],
  },
  {
    phrases: [
      "leader",
      "leadership",
      "manage a team",
      "managing people",
      "lead a team",
      "i lead",
      "guiding others",
      "mentor someone",
      "hard decisions fairly",
      "stewardship of a community",
      "shared responsibility",
      "lead when people disagree",
    ],
    primary: ["leadership"],
    secondary: ["responsibility", "justice", "humility"],
    intents: ["leadership"],
  },
  {
    phrases: [
      "exploding",
      "instead of exploding",
      "cool down",
      "after conflict",
      "losing my temper",
      "snapped",
    ],
    primary: ["anger", "patience"],
    secondary: ["speech", "peace"],
    intents: ["emotional"],
    clearsDominantGuard: ["anger"],
  },
  {
    phrases: [
      "sit with loss",
      "people of faith sit",
      "with loss",
    ],
    primary: ["grief", "faith"],
    secondary: ["hope", "mortality"],
    intents: ["pastoral", "emotional"],
  },
  {
    phrases: [
      "when should i protest",
      "should i protest",
      "protest",
    ],
    primary: ["justice", "courage"],
    secondary: ["speech"],
    intents: ["ethical"],
  },
  {
    phrases: [
      "treat people who disagree",
      "who disagree with me",
      "people who disagree",
    ],
    primary: ["relationships", "speech", "peace"],
    secondary: ["humility"],
    intents: ["relationship", "ethical"],
  },
  {
    phrases: ["vocation", "what does vocation"],
    primary: ["work", "purpose"],
    secondary: ["responsibility", "service"],
    intents: ["everyday", "philosophical"],
  },
  {
    phrases: [
      "talk about money",
      "money with family",
    ],
    primary: ["wealth", "family", "speech"],
    secondary: ["generosity"],
    intents: ["everyday", "relationship"],
  },
  {
    phrases: [
      "patience",
      "patient",
      "slow to anger",
      "teaching about patience",
      "about patience",
      "wait patiently",
      "measured response",
    ],
    primary: ["patience"],
    secondary: ["anger", "speech"],
    intents: ["emotional", "everyday"],
    clearsDominantGuard: ["anger"],
  },
  {
    phrases: [
      "share a teaching",
      "offer a teaching",
      "jewish teaching",
      "teaching about",
    ],
    secondary: ["learning", "wisdom"],
    intents: ["everyday"],
  },
  {
    phrases: [
      "suicide",
      "suicidal",
      "kill myself",
      "want to die",
      "end my life",
      "self-harm",
      "self harm",
      "hurt myself",
      "hurting myself",
      "no reason to live",
      "help me die",
      "immediate danger",
      "cannot stay safe",
    ],
    primary: ["crisis-support"],
    intents: ["crisis"],
  },
  {
    phrases: [
      "kosher",
      "halacha",
      "halakha",
      "is it permitted",
      "is it permissible",
      "am i allowed to",
      "am i obligated",
      "shabbat law",
      "mitzvah observance",
      "jewish law",
      "the din",
      "drive on shabbat",
      "electricity on shabbat",
    ],
    primary: ["halacha"],
    intents: ["halacha", "textual"],
  },
  {
    phrases: [
      "what does the torah say",
      "what does it say in",
      "chapter and verse",
      "hebrew word for",
      "translate this verse",
      "citation for",
      "source text",
      "original hebrew",
      "show me genesis",
      "what does micah",
      "explain ecclesiastes",
      "what is psalm",
      "pirkei avot",
      "proverbs 3",
      "isaiah 58",
      "deuteronomy 6",
      "job 38",
      "exodus 20",
    ],
    secondary: ["learning", "wisdom"],
    intents: ["textual"],
  },
  {
    phrases: [
      "relationship",
      "friendship",
      "strained friendship",
      "repair a friendship",
      "marriage",
      "my partner",
      "my spouse",
      "family conflict",
      "difficult coworker",
      "coworker conflict",
      "argument with",
      "love of neighbor",
      "show up better",
      "listen better",
      "loyalty look like",
      "welcome someone who feels left out",
      "friend hurt me",
    ],
    primary: ["relationships"],
    secondary: ["community", "speech", "love", "kindness"],
    intents: ["relationship"],
  },
  {
    phrases: [
      "grateful",
      "gratitude",
      "thankful",
      "thanks for",
      "thank people",
      "practice gratitude",
      "counting blessings",
      "notice blessings",
      "thanksgiving",
      "numb to good",
      "blessings reshape",
      "celebrate without excess",
      "contentment",
      "joy without denial",
      "share gratitude",
    ],
    primary: ["gratitude"],
    secondary: ["joy", "prayer", "blessing"],
    intents: ["emotional", "everyday"],
  },
  {
    phrases: [
      "underpaid",
      "wage",
      "exploitative workplace",
      "unfair workplace",
      "my boss",
      "honest work",
      "integrity look like at work",
      "burned out at my job",
      "approach honest work",
      "dignity in ordinary labor",
      "workplace feels unethical",
      "treat coworkers",
    ],
    primary: ["work", "honesty"],
    secondary: ["justice", "responsibility", "rest"],
    intents: ["ethical", "everyday"],
  },
  {
    phrases: [
      "burnout",
      "burned out",
      "exhausted",
      "overwhelmed",
      "need rest",
      "too tired",
      "rest without",
      "weekly pause",
      "sacred rest",
      "shabbat for someone exhausted",
      "cannot stop working",
      "protect recovery",
      "recovery time",
      "rest a mitzvah",
      "mitzvah for the soul",
      "rest when caregiving",
      "caregiving never ends",
      "household to rest",
      "teach my household to rest",
    ],
    primary: ["rest"],
    secondary: ["work", "joy", "sabbath"],
    intents: ["emotional", "everyday"],
  },
  {
    phrases: [
      "hopeless",
      "despair",
      "no hope",
      "giving up",
      "give up on",
      "keep hope",
      "hold hope",
    ],
    primary: ["hope"],
    secondary: ["community", "uncertainty", "faith"],
    intents: ["emotional", "pastoral"],
  },
  {
    phrases: ["humble", "humility", "my ego", "too much pride", "stay humble"],
    primary: ["humility"],
    secondary: ["leadership", "learning"],
    intents: ["emotional", "ethical"],
  },
  {
    phrases: [
      "generous",
      "generosity",
      "give to charity",
      "tzedakah",
      "donate",
      "think about money",
      "what is enough",
      "help someone in need",
      "scarcity",
      "borrow and lend",
    ],
    primary: ["generosity", "charity"],
    secondary: ["wealth", "poverty", "stewardship"],
    intents: ["ethical", "everyday"],
  },
  {
    phrases: [
      "welcome a guest",
      "hospitality",
      "hosting guests",
      "a stranger at our table",
      "welcoming strangers",
      "include people on the margins",
    ],
    primary: ["hospitality", "community"],
    secondary: ["kindness"],
    intents: ["relationship", "everyday"],
  },
  {
    phrases: [
      "study torah",
      "learn more",
      "keep learning",
      "study jewish texts",
      "better learner",
      "torah study",
      "chavruta",
      "daily habit",
      "return to study",
      "stay curious",
      "curious as an adult",
      "teach without arrogance",
      "wisdom versus information",
      "versus information",
      "learn from people i disagree",
      "learning with humility",
      "make learning a daily",
    ],
    primary: ["learning", "wisdom"],
    secondary: ["humility", "truth"],
    intents: ["everyday"],
  },
  {
    phrases: [
      "decision",
      "uncertain",
      "unsure",
      "dilemma",
      "which way",
      "don't know what to do",
      "do not know what to do",
      "what should i do",
      "future feels foggy",
      "live with uncertainty",
      "not knowing",
      "stuck between options",
      "wait without anxiety",
      "ambiguity",
      "hold doubt",
      "people of faith hold doubt",
      "trust when outcomes",
      "outcomes are unclear",
      "decide without perfect",
      "without perfect information",
    ],
    primary: ["uncertainty", "trust"],
    secondary: ["faith", "courage", "hope"],
    intents: ["everyday", "emotional"],
  },
  {
    phrases: [
      "support someone taking a hard stand",
      "taking a hard stand",
      "hard stand",
    ],
    primary: ["courage", "justice"],
    secondary: ["faith", "leadership"],
    intents: ["ethical", "emotional"],
  },
  {
    phrases: [
      "what is joy",
      "joy without",
      "contentment mean",
      "what does contentment",
    ],
    primary: ["joy", "gratitude"],
    secondary: ["blessing", "hope"],
    intents: ["emotional"],
  },
  {
    phrases: [
      "honor aging parents",
      "parenting",
      "family conflict",
      "boundaries with relatives",
      "siblings repair",
      "home of peace",
      "new family member",
      "talk to teens",
      "family memory",
      "aging parents",
    ],
    primary: ["family"],
    secondary: ["honor", "parenting", "relationships", "speech"],
    intents: ["relationship", "everyday"],
  },
  {
    phrases: [
      "build community",
      "find belonging",
      "mutual aid",
      "congregation",
      "show up for neighbors",
      "collective responsibility",
      "contribute without burning out",
    ],
    primary: ["community"],
    secondary: ["responsibility", "hospitality", "kindness"],
    intents: ["everyday"],
  },
  {
    phrases: [
      "technology",
      "my phone",
      "screens",
      "social media",
      "digital rest",
      "constant connectivity",
      "online",
      "addicted to my phone",
      "use technology",
      "protect attention",
      "noisy world",
      "digital",
      "tools serve people",
    ],
    primary: ["attention", "speech", "responsibility"],
    secondary: ["truth", "community", "rest", "technology"],
    intents: ["everyday", "ethical"],
  },
  {
    phrases: [
      "greed",
      "what does greed",
      "wealth a blessing",
      "blessing or a test",
      "trust in riches",
    ],
    primary: ["wealth", "charity", "stewardship"],
    secondary: ["generosity", "humility", "poverty"],
    intents: ["ethical", "everyday"],
  },
  {
    phrases: [
      "disagree inside a community",
      "disagree inside",
      "disagreement in community",
      "community disagreement",
    ],
    primary: ["community", "speech", "peace"],
    secondary: ["humility", "relationships"],
    intents: ["everyday", "ethical"],
  },
  {
    phrases: [
      "balance courage and caution",
      "courage and caution",
    ],
    primary: ["courage", "wisdom"],
    secondary: ["justice", "responsibility"],
    intents: ["ethical"],
  },
  {
    phrases: [
      "family does not share",
      "does not share my faith",
      "family does not share my faith",
    ],
    primary: ["family", "peace", "relationships"],
    secondary: ["honor", "speech", "faith"],
    intents: ["relationship", "everyday"],
  },
  {
    phrases: [
      "find courage",
      "moral courage",
      "brave step",
      "be strong and courageous",
      "afraid but something feels wrong",
      "difficult conversation",
      "anxiety blocks action",
    ],
    primary: ["courage"],
    secondary: ["fear", "justice", "faith"],
    intents: ["emotional", "ethical"],
  },
  {
    phrases: [
      "practice kindness",
      "humility look like",
      "sacred about ordinary",
      "care for the stranger",
      "integrity cost",
      "return after i have drifted",
      "peace require",
      "bless others",
      "enough success",
    ],
    primary: ["kindness", "responsibility"],
    secondary: ["community", "speech", "humility"],
    intents: ["everyday", "ethical"],
  },
  {
    phrases: [
      "what does justice require",
      "justice require of ordinary",
    ],
    primary: ["justice"],
    secondary: ["mercy", "speech", "humility", "responsibility"],
    intents: ["ethical"],
  },
  {
    phrases: [
      "boundaries at work",
      "set boundaries at work",
    ],
    primary: ["work", "rest"],
    secondary: ["responsibility"],
    intents: ["everyday"],
  },
  {
    phrases: [
      "give without resentment",
      "without resentment",
    ],
    primary: ["charity", "generosity"],
    secondary: ["kindness"],
    intents: ["ethical", "everyday"],
  },
  {
    phrases: [
      "advocate without",
      "becoming cruel",
    ],
    primary: ["justice", "mercy", "speech"],
    secondary: ["compassion"],
    intents: ["ethical"],
  },
  {
    phrases: ["ambition", "is ambition", "what is enough", "is enough"],
    primary: ["work", "humility", "responsibility"],
    secondary: ["wealth", "gratitude", "generosity"],
    intents: ["ethical", "everyday"],
  },
  {
    phrases: [
      "stay silent",
      "keep silence",
      "time to keep silence",
    ],
    primary: ["speech"],
    secondary: ["wisdom"],
    intents: ["ethical"],
  },
  {
    phrases: [
      "tired spirit",
      "renews a tired",
      "weary",
      "renews a tired spirit",
    ],
    primary: ["rest", "hope", "renewal"],
    secondary: ["joy", "sabbath"],
    intents: ["emotional", "pastoral"],
  },
  {
    phrases: [
      "where is comfort",
      "comfort when someone",
    ],
    primary: ["grief", "hope"],
    secondary: ["compassion"],
    intents: ["pastoral", "emotional"],
  },
];

const FEAR_PHRASES = [
  "afraid",
  "fear",
  "scared",
  "terrified",
  "frightened",
  "anxious",
  "nervous",
  "worried",
];

function haystackOf(query: string): string {
  return ` ${normalize(query)} `;
}

function matchesPhrase(haystack: string, tokens: string[], phrase: string): boolean {
  const normalized = normalize(phrase);
  if (!normalized) return false;
  if (normalized.includes(" ")) {
    return haystack.includes(` ${normalized} `) || haystack.includes(normalized);
  }
  return tokens.includes(normalized);
}

export function expandQueryConcepts(query: string): ConceptExpansion {
  const tokens = tokenize(query);
  const haystack = haystackOf(query);

  const primary = new Set<string>();
  const secondary = new Set<string>();
  const intents = new Set<QueryIntent>();
  const clearedGuards = new Set<string>();
  let matchWeight = 0;

  for (const rule of CONCEPT_RULES) {
    const hit = rule.phrases.some((phrase) => matchesPhrase(haystack, tokens, phrase));
    if (!hit) continue;
    matchWeight += rule.weight ?? 0.6;
    rule.primary?.forEach((c) => primary.add(c));
    rule.secondary?.forEach((c) => secondary.add(c));
    rule.intents?.forEach((i) => intents.add(i));
    rule.clearsDominantGuard?.forEach((g) => clearedGuards.add(g));
  }

  const fearHit = FEAR_PHRASES.some((phrase) => matchesPhrase(haystack, tokens, phrase));
  if (fearHit) {
    intents.add("emotional");
    matchWeight += 0.4;
    if (primary.has("justice")) {
      primary.add("justice");
      primary.add("courage");
    } else {
      primary.add("courage");
      secondary.add("uncertainty");
    }
  }

  const excludedDominant = DEFAULT_DOMINANT_GUARDS.filter(
    (concept) => !clearedGuards.has(concept) && !primary.has(concept) && !secondary.has(concept),
  );

  if (intents.size === 0) {
    intents.add("ambiguous");
  }

  // Strip primary concepts from secondary for cleaner ranking.
  for (const p of primary) secondary.delete(p);

  const confidence = Math.max(0, Math.min(1, matchWeight / 1.5));

  return {
    primary: [...primary],
    secondary: [...secondary],
    excludedDominant,
    intents: [...intents],
    confidence,
  };
}
