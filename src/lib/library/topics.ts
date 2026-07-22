import fs from "node:fs";
import path from "node:path";

/**
 * Curated topic/concept synonym map used to enrich lexical matching in
 * retrieve.ts — e.g. a record tagged with topic "purpose" should also match
 * a query that says "calling" or "reason for being" even if the record text
 * never uses the word "purpose".
 *
 * Optionally extended (never overridden) by `data/library/topics.json`, a
 * flat `Record<string, string[]>` with the same shape, so editorial content
 * work can grow this list without a code change.
 */
export const TOPIC_SYNONYMS: Record<string, string[]> = {
  purpose: [
    "calling",
    "reason for being",
    "why we are here",
    "destiny",
    "mission",
    "under the heaven",
    "duty of man",
    "way of life",
  ],
  creation: [
    "made the world",
    "formed",
    "fashioned",
    "origin of life",
    "in the beginning",
    "created",
    "create",
    "make man",
    "brought into being",
  ],
  humanity: [
    "mankind",
    "human beings",
    "human dignity",
    "image of god",
    "personhood",
    "in his own image",
    "man that",
    "children of men",
    "sons of men",
  ],
  responsibility: ["duty", "obligation", "accountability", "ought to", "whole duty of man", "charge"],
  service: ["serve", "devotion", "avodah", "dedicate oneself", "minister", "servant of the lord"],
  love: ["ahava", "affection", "beloved", "love your neighbor", "loveth", "lovest"],
  justice: ["tzedek", "fairness", "righteousness", "equity", "due process", "judgment", "judge righteously", "oppressed"],
  wisdom: ["chochmah", "insight", "discernment", "understanding", "wise", "wisdom findeth", "knowledge"],
  mortality: [
    "death",
    "finitude",
    "our days are numbered",
    "impermanence",
    "number our days",
    "dust",
    "dieth",
    "mortal",
  ],
  joy: ["simcha", "gladness", "delight", "happiness", "rejoice", "glad", "happy is the man"],
  community: ["kehillah", "congregation", "belonging", "fellowship", "the collective", "assembly", "people"],
  "divine-relationship": [
    "relationship with god",
    "covenant",
    "faith",
    "closeness to god",
    "the lord thy god",
    "fear god",
  ],
  anger: ["wrath", "fury", "rage", "temper", "irritation", "wroth", "kindled against", "hot displeasure"],
  patience: ["longsuffering", "forbearance", "slow to anger", "self-control", "soft answer", "cease from anger"],
  speech: ["words", "tongue", "lips", "what we say", "mouth"],
  gossip: ["lashon hara", "slander", "rumor", "talebearer", "whisperer"],
  courage: ["bravery", "boldness", "fortitude", "standing firm", "be strong", "fear not", "dismayed"],
  uncertainty: ["doubt", "not knowing", "ambiguity", "indecision"],
  apology: ["confession", "owning up", "acknowledging fault"],
  repair: ["teshuvah", "restoration", "amends", "making things right", "restore"],
  grief: ["mourning", "bereavement", "sorrow", "loss", "mourn", "weep"],
  forgiveness: ["pardon", "mercy", "letting go of a wrong", "forgive", "iniquity"],
  humility: ["modesty", "meekness", "lowliness", "not seeking honor", "humble"],
  leadership: ["governance", "stewardship of people", "guiding others", "judge", "elder", "ruler"],
  halacha: ["jewish law", "religious obligation", "ritual practice"],
  "crisis-support": ["emergency help", "safety", "getting help now"],
  relationships: ["interpersonal", "friendship", "partnership", "kinship"],
  gratitude: ["thankfulness", "appreciation", "counting blessings"],
  work: ["labor", "employment", "livelihood", "vocation"],
  rest: ["shabbat", "sabbath", "respite", "ceasing labor"],
  hope: ["optimism", "expectation of good", "trust in the future"],
  truth: ["honesty", "veracity", "emet"],
  learning: ["study", "torah study", "education", "growth in knowledge"],
  hospitality: ["welcoming guests", "hachnasat orchim", "openness to strangers"],
  stewardship: ["caretaking", "environmental responsibility", "dominion"],
  mercy: ["compassion", "clemency", "rachamim"],
  compassion: ["empathy", "kindness toward suffering", "tenderness"],
  kindness: ["chesed", "loving-kindness", "good deeds"],
  charity: ["tzedakah", "almsgiving", "giving to the needy"],
  generosity: ["open-handedness", "liberality", "giving freely"],
  honesty: ["integrity", "truthfulness", "candor"],
  integrity: ["wholeness of character", "moral soundness"],
  faith: ["emunah", "belief", "trust in god"],
  trust: ["reliance", "confidence", "bitachon"],
  prayer: ["tefillah", "supplication", "petition"],
  repentance: ["teshuvah", "turning back", "return"],
  covenant: ["brit", "sacred agreement", "bond with god"],
  commandment: ["mitzvah", "precept", "obligation from god"],
  sin: ["transgression", "wrongdoing", "aveirah"],
  redemption: ["salvation", "geulah", "deliverance"],
  exile: ["galut", "displacement", "diaspora"],
  freedom: ["liberty", "liberation", "cherut"],
  slavery: ["bondage", "servitude", "oppression under a master"],
  memory: ["remembrance", "zachor", "not forgetting"],
  tradition: ["mesorah", "custom", "handed-down practice"],
  identity: ["peoplehood", "sense of self", "belonging to a people"],
  holiness: ["kedushah", "sanctity", "sacredness"],
  sabbath: ["shabbat", "day of rest", "seventh day"],
  festival: ["chag", "holiday", "yom tov"],
  mourning: ["shiva", "grief rituals", "bereavement"],
  death: ["mortality", "passing", "end of life"],
  life: ["chayim", "vitality", "living"],
  birth: ["new life", "childbirth", "beginning of life"],
  marriage: ["kiddushin", "matrimony", "partnership"],
  children: ["offspring", "parenting", "raising a family"],
  parenting: ["raising children", "child-rearing", "guiding a child"],
  elders: ["the aged", "seniors", "honoring elders"],
  respect: ["kavod", "honor", "esteem"],
  honor: ["kavod", "dignity", "esteem for others"],
  shame: ["embarrassment", "disgrace", "bushah"],
  pride: ["arrogance", "haughtiness", "gaavah"],
  envy: ["jealousy", "covetousness", "resentment of others"],
  greed: ["avarice", "excessive desire for gain"],
  temptation: ["yetzer hara", "the evil inclination", "enticement"],
  sacrifice: ["korban", "offering", "giving something up"],
  offering: ["korban", "gift to god", "sacrifice"],
  purity: ["taharah", "ritual cleanliness"],
  impurity: ["tumah", "ritual uncleanliness"],
  law: ["halacha", "statute", "commandment"],
  judgment: ["din", "verdict", "assessment of right and wrong"],
  peace: ["shalom", "harmony", "absence of conflict"],
  war: ["conflict", "battle", "armed struggle"],
  enemy: ["adversary", "foe", "opponent"],
  friendship: ["chaverut", "companionship", "close bond"],
  loyalty: ["faithfulness", "steadfastness", "devotion to another"],
  betrayal: ["deception of trust", "disloyalty"],
  deception: ["dishonesty", "trickery", "falsehood"],
  ethics: ["morality", "right conduct", "moral philosophy"],
  philosophy: ["metaphysics", "first principles", "big questions"],
  mysticism: ["kabbalah", "hidden wisdom", "esoteric teaching"],
  prophecy: ["nevuah", "divine message", "prophetic vision"],
  miracle: ["nes", "wonder", "divine intervention"],
  nature: ["the natural world", "creation's order"],
  environment: ["ecology", "the earth", "natural resources"],
  animals: ["living creatures", "beasts", "wildlife"],
  food: ["sustenance", "meals", "eating"],
  "dietary-law": ["kashrut", "kosher law", "food restrictions"],
  business: ["commerce", "trade", "dealings"],
  wealth: ["riches", "prosperity", "material abundance"],
  poverty: ["need", "lack", "scarcity"],
  debt: ["owing money", "loans", "financial obligation"],
  "justice-system": ["courts", "adjudication", "legal process"],
  vows: ["oaths", "promises", "nedarim"],
  "speech-ethics": ["guarding one's tongue", "careful speech"],
  suffering: ["affliction", "hardship", "pain"],
  healing: ["recovery", "restoration of health", "refuah"],
  illness: ["sickness", "disease", "affliction of the body"],
  aging: ["growing old", "later years", "the passage of time"],
  legacy: ["what we leave behind", "inheritance of values"],
  time: ["seasons", "the passage of days", "a time for everything"],
  destiny: ["fate", "one's path", "what is meant to be"],
  "self-improvement": ["personal growth", "character refinement", "mussar"],
  conscience: ["inner moral sense", "the voice within"],
  obedience: ["compliance", "following commandments"],
  rebellion: ["defiance", "refusal to obey"],
  "exodus-theme": ["liberation from egypt", "going out from bondage"],
  wilderness: ["desert wandering", "midbar", "the journey"],
  "promised-land": ["eretz yisrael", "the land", "inheritance of land"],
  idolatry: ["false gods", "worship of images", "avodah zarah"],
  monotheism: ["belief in one god", "the oneness of god"],
  chosenness: ["election", "being set apart", "am yisrael"],
};

let extended = false;

function loadExternalTopics(): void {
  if (extended) return;
  extended = true;
  try {
    const file = path.join(process.cwd(), "data", "library", "topics.json");
    if (!fs.existsSync(file)) return;
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string[]>;
    for (const [key, synonyms] of Object.entries(parsed)) {
      if (!Array.isArray(synonyms)) continue;
      const existing = TOPIC_SYNONYMS[key] ?? [];
      TOPIC_SYNONYMS[key] = [...new Set([...existing, ...synonyms])];
    }
  } catch {
    // Optional file — ignore malformed/missing data without failing retrieval.
  }
}

loadExternalTopics();

export function synonymsFor(concept: string): string[] {
  return TOPIC_SYNONYMS[concept] ?? [];
}
