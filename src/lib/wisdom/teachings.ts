import type { Teaching } from "./types";
import { DRAFT_TEACHINGS } from "./teachings-drafts";

/**
 * Curated teachings for Torok's free local response engine.
 *
 * Library status: awaiting-educator-review
 * Draft entries from teachings-drafts.ts are explicitly marked draft.
 */
export const CORE_TEACHINGS: Teaching[] = [
  {
    id: "patience-avot-4-1",
    theme: "patience",
    themeLabel: "Patience",
    sources: [
      {
        canonical: "Pirkei Avot 4:1 (Ben Zoma)",
        url: "https://www.sefaria.org/Pirkei_Avot.4.1",
      },
    ],
    textKind: "paraphrase",
    text: "Ben Zoma teaches that true strength is not domination of others, but mastery of one’s own impulse — the patient work of governing oneself.",
    historicalContext:
      "Pirkei Avot (“Ethics of the Fathers”) collects rabbinic maxims on character. Ben Zoma’s teaching reframes strength as self-mastery.",
    modernApplication:
      "Patience can be a form of courage: waiting, cooling down, and choosing a measured response rather than reacting from impulse.",
    takeaway:
      "Before you react, give yourself one breath and one clearer intention. Strength may look like restraint.",
    reflectionQuestion:
      "What would it look like to meet this moment with strength that is quiet rather than forceful?",
    acknowledgment: "Patience is hard work — especially when something feels urgent.",
    viewpoint: "Classical rabbinic ethics (Pirkei Avot)",
    keywords: [
      "patience",
      "wait",
      "waiting",
      "slow",
      "impulse",
      "anger",
      "frustrated",
      "frustration",
      "temper",
      "calm",
      "self-control",
      "pause",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "repair-teshuvah",
    theme: "repair",
    themeLabel: "Repair and apology",
    sources: [
      {
        canonical: "Maimonides, Mishneh Torah, Hilchot Teshuvah",
        url: "https://www.sefaria.org/Mishneh_Torah%2C_Repentance",
      },
    ],
    textKind: "paraphrase",
    text: "Classical Jewish teachings on teshuvah describe repair as more than feeling sorry — it includes recognizing the harm, regretting it, seeking to make amends where possible, and changing future behavior.",
    historicalContext:
      "Maimonides (Rambam) systematizes laws of repentance, outlining steps that move from acknowledgment toward amended conduct.",
    modernApplication:
      "A sincere apology names what went wrong, centers the person harmed, and aims toward concrete change.",
    takeaway:
      "Name the harm plainly, ask what repair would help, and choose one concrete change you can keep.",
    reflectionQuestion:
      "What specific harm needs naming — and what repair would feel real to the other person?",
    acknowledgment: "Wanting to repair something takes honesty and courage.",
    viewpoint: "Maimonidean / classical halakhic framing of teshuvah (educational, not psak)",
    keywords: [
      "mistake",
      "sorry",
      "apology",
      "apologize",
      "repair",
      "teshuvah",
      "guilt",
      "regret",
      "amends",
      "forgiveness",
      "wrong",
      "hurt someone",
      "messed up",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "relationships-neighbor",
    theme: "relationships",
    themeLabel: "Difficult relationships",
    sources: [
      {
        canonical: "Leviticus 19:18",
        url: "https://www.sefaria.org/Leviticus.19.18",
      },
      {
        canonical: "Sifra, Kedoshim 4:12",
        url: "https://www.sefaria.org/Sifra%2C_Kedoshim.4.12",
      },
    ],
    textKind: "quotation",
    text: "Love your neighbor as yourself",
    translationAttribution:
      "JPS Tanakh (1985) English rendering of Leviticus 19:18",
    historicalContext:
      "Leviticus 19:18 appears in the Holiness Code. In Sifra, Kedoshim 4:12, Rabbi Akiva describes “Love your neighbor as yourself” as an all-embracing (or major) principle in Torah — a rabbinic interpretive claim about the verse’s centrality, not additional biblical wording.",
    modernApplication:
      "Leviticus teaches, “Love your neighbor as yourself” (Leviticus 19:18). Rabbi Akiva later called this an all-embracing principle of Torah (Sifra, Kedoshim 4:12). One way to apply that teaching in a difficult conversation is to protect the other person’s dignity without abandoning your own — including by setting fair boundaries. Dignity and fair boundaries are a modern application, not the literal content of the biblical verse.",
    takeaway:
      "In a hard conversation, lead with dignity: listen for the person behind the conflict before defending your position.",
    reflectionQuestion:
      "How can you protect your own integrity while still treating the other person as someone with dignity?",
    acknowledgment: "Hard conversations ask a lot of us.",
    viewpoint: "Biblical verse + tannaitic midrash (Sifra); one classical lens among several",
    keywords: [
      "conversation",
      "difficult conversation",
      "conflict",
      "argue",
      "argument",
      "relationship",
      "family tension",
      "neighbor",
      "friend",
      "spouse",
      "partner",
      "coworker",
      "tension",
      "disagreement",
      "fight",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "leadership-hillel",
    theme: "leadership",
    themeLabel: "Leadership",
    sources: [
      {
        canonical: "Pirkei Avot 1:14 (Hillel)",
        url: "https://www.sefaria.org/Pirkei_Avot.1.14",
      },
    ],
    textKind: "paraphrase",
    text: "Hillel asks: If I am not for myself, who will be for me? If I am only for myself, what am I? And if not now, when?",
    historicalContext:
      "Hillel’s three questions appear in Pirkei Avot as a compact ethic of responsibility, solidarity, and timely action.",
    modernApplication:
      "Leadership in this lens is less about status than about balancing self-care, care for others, and acting in time.",
    takeaway:
      "Ask which part of the moment needs your care for yourself, which needs care for others, and what one step belongs to today.",
    reflectionQuestion:
      "Where are you being asked to show up — for yourself, for others, or both — and what cannot wait?",
    acknowledgment: "Responsibility can feel heavy when timing matters.",
    viewpoint: "Hillelite teaching in Pirkei Avot",
    keywords: [
      "leadership",
      "leader",
      "lead",
      "responsibility",
      "team",
      "decision",
      "decide",
      "manager",
      "influence",
      "authority",
      "guide",
      "role",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "courage-joshua",
    theme: "courage",
    themeLabel: "Courage",
    sources: [
      {
        canonical: "Joshua 1:9",
        url: "https://www.sefaria.org/Joshua.1.9",
      },
    ],
    textKind: "paraphrase",
    text: "Joshua is told to be strong and courageous, and not to be dismayed — a call to steady heart in the face of uncertainty and large responsibility.",
    historicalContext:
      "Joshua 1 addresses Joshua at the threshold of leadership after Moses. Courage is paired with reassurance.",
    modernApplication:
      "Biblical courage here includes continuing forward even when fear is present — not pretending fear is absent.",
    takeaway:
      "Name the fear honestly, then take the smallest brave step that still honors your values.",
    reflectionQuestion:
      "What brave step is small enough to begin today, yet honest enough to matter?",
    acknowledgment: "Fear and courage often arrive together.",
    viewpoint: "Biblical narrative (Joshua)",
    keywords: [
      "courage",
      "brave",
      "fear",
      "afraid",
      "anxiety",
      "nervous",
      "risk",
      "stand up",
      "speak up",
      "strength",
      "dismayed",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "gratitude-modeh",
    theme: "gratitude",
    themeLabel: "Gratitude",
    sources: [
      {
        canonical: "Modeh Ani (traditional morning liturgy)",
        url: "https://www.sefaria.org/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Modeh_Ani",
      },
    ],
    textKind: "paraphrase",
    text: "Jewish practice begins many days with gratitude for the gift of returning to life and awareness — training the heart to notice what is already given before rushing into what is missing.",
    historicalContext:
      "Modeh Ani is a short traditional morning acknowledgment of restored life and awareness, said upon waking.",
    modernApplication:
      "Gratitude can be practiced, not only felt: noticing ordinary goodness that would otherwise pass unseen.",
    takeaway:
      "Name three specific gifts from today — people, moments, or capacities — before rehearsing what is lacking.",
    reflectionQuestion:
      "What ordinary goodness have you been moving past too quickly to notice?",
    acknowledgment: "Gratitude softens the rush toward what’s missing.",
    viewpoint: "Liturgical practice (Ashkenazi/Sefardi traditions vary in wording)",
    keywords: [
      "gratitude",
      "grateful",
      "thankful",
      "thanks",
      "blessing",
      "appreciate",
      "appreciation",
      "joy",
      "gift",
      "thank",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "community-avot-2-4",
    theme: "community",
    themeLabel: "Community",
    sources: [
      {
        canonical: "Pirkei Avot 2:4 (Hillel)",
        url: "https://www.sefaria.org/Pirkei_Avot.2.4",
      },
    ],
    textKind: "paraphrase",
    text: "Hillel teaches not to separate oneself from the community — a reminder that human flourishing is woven with shared life, mutual responsibility, and belonging.",
    historicalContext:
      "Pirkei Avot repeatedly links ethical life to communal belonging and mutual obligation.",
    modernApplication:
      "Isolation can feel protective, but belonging often strengthens resilience, accountability, and joy.",
    takeaway:
      "Reach toward one trustworthy person or communal space instead of carrying this entirely alone.",
    reflectionQuestion:
      "Who or what community could share this moment with you — even a little?",
    acknowledgment: "Belonging matters — especially when you feel alone with something.",
    viewpoint: "Hillelite teaching in Pirkei Avot",
    keywords: [
      "community",
      "lonely",
      "alone",
      "belong",
      "belonging",
      "together",
      "synagogue",
      "friends",
      "support",
      "isolation",
      "group",
      "kehilla",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "justice-pursue",
    theme: "justice",
    themeLabel: "Justice",
    sources: [
      {
        canonical: "Deuteronomy 16:20",
        url: "https://www.sefaria.org/Deuteronomy.16.20",
      },
    ],
    textKind: "quotation",
    text: "Justice, justice shall you pursue",
    translationAttribution: "JPS Tanakh (1985) English rendering of Deuteronomy 16:20",
    historicalContext:
      "Deuteronomy 16 addresses judicial integrity. The doubled wording has long invited interpretation about pursuing justice carefully and by just means.",
    modernApplication:
      "Jewish ethics often link righteousness with action — in public life and private dealings — while insisting that the means of pursuit matter.",
    takeaway:
      "Choose one fair action within your reach — a clearer word, a corrected process, or advocacy that does not abandon integrity.",
    reflectionQuestion:
      "Where can you pursue fairness without abandoning the means that keep justice just?",
    acknowledgment: "Fairness can feel urgent — and complicated.",
    viewpoint: "Biblical commandment; later interpretive traditions vary",
    keywords: [
      "justice",
      "fair",
      "fairness",
      "unfair",
      "right",
      "wrong",
      "ethics",
      "ethical",
      "injustice",
      "advocate",
      "equity",
      "truth",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "rest-shabbat",
    theme: "rest",
    themeLabel: "Rest",
    sources: [
      {
        canonical: "Exodus 20:8–11",
        url: "https://www.sefaria.org/Exodus.20.8-11",
      },
    ],
    textKind: "paraphrase",
    text: "The Torah commands remembering and keeping Shabbat — a sacred rhythm of pausing from creative labor so that rest, dignity, and renewal have a protected place in life.",
    historicalContext:
      "The Decalogue in Exodus frames Shabbat as a covenant rhythm of work and sacred pause.",
    modernApplication:
      "Jewish wisdom treats rest as holy, not lazy — restoring perspective and the sense that we are more than our productivity.",
    takeaway:
      "Protect one small pocket of genuine rest today — phone down, task unfinished, presence restored.",
    reflectionQuestion:
      "What would it mean to treat rest as sacred rather than as something you have to earn?",
    acknowledgment: "Rest is not a luxury when you’re worn thin.",
    viewpoint: "Biblical Shabbat commandment (educational reflection, not ritual psak)",
    keywords: [
      "rest",
      "tired",
      "exhausted",
      "burnout",
      "shabbat",
      "sabbath",
      "pause",
      "overwhelmed",
      "busy",
      "sleep",
      "recover",
      "restore",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "speech-lashon-hara",
    theme: "speech",
    themeLabel: "Speech and gossip",
    sources: [
      {
        canonical: "Leviticus 19:16",
        url: "https://www.sefaria.org/Leviticus.19.16",
      },
    ],
    textKind: "paraphrase",
    text: "The Torah warns against going about as a talebearer among one’s people. Later Jewish ethics develop careful guardrails around gossip, rumor, and speech that damages reputation.",
    historicalContext:
      "Leviticus 19:16 addresses harmful speech within community. Later mussar and halakhic literature (e.g., Chafetz Chaim) elaborate detailed guardrails — cited here as later development, not biblical wording.",
    modernApplication:
      "Words can heal or harm. Careful speech protects reputations, trust, and community bonds.",
    takeaway:
      "Before sharing, ask: Is it true? Is it necessary? Is it kind? If any answer is no, pause.",
    reflectionQuestion:
      "What would change if you treated your next words as something that can either repair or wound?",
    acknowledgment: "Words carry more weight than we sometimes notice.",
    viewpoint: "Biblical verse + later ethics of speech (educational)",
    keywords: [
      "gossip",
      "speech",
      "words",
      "rumor",
      "talk",
      "said",
      "lashon hara",
      "slander",
      "chat",
      "message",
      "post",
      "criticize",
      "speak",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "uncertainty-trust",
    theme: "uncertainty",
    themeLabel: "Uncertainty",
    sources: [
      {
        canonical: "Proverbs 3:5–6",
        url: "https://www.sefaria.org/Proverbs.3.5-6",
      },
    ],
    textKind: "paraphrase",
    text: "Proverbs invites trusting with the whole heart and not leaning only on one’s own understanding — seeking a path steadied by wisdom beyond anxious self-reliance alone.",
    historicalContext:
      "Proverbs offers wisdom instruction for navigating life when certainty is incomplete.",
    modernApplication:
      "Jewish tradition does not deny uncertainty; it offers practices of trust, counsel, prayer, and humble decision-making.",
    takeaway:
      "When the path is unclear, gather one wise perspective, clarify your values, and take the next faithful step — not the whole journey at once.",
    reflectionQuestion:
      "What do you know for sure about your values, even while the outcome remains unknown?",
    acknowledgment: "Not knowing can be its own kind of weight.",
    viewpoint: "Biblical wisdom literature (Proverbs)",
    keywords: [
      "uncertain",
      "uncertainty",
      "unsure",
      "confused",
      "decision",
      "decide",
      "choice",
      "dilemma",
      "unknown",
      "future",
      "worry",
      "what if",
      "path",
      "direction",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "learning-ben-bag-bag",
    theme: "learning",
    themeLabel: "Learning",
    sources: [
      {
        canonical: "Pirkei Avot 5:22 (Ben Bag Bag)",
        url: "https://www.sefaria.org/Pirkei_Avot.5.22",
      },
    ],
    textKind: "paraphrase",
    text: "Ben Bag Bag says of Torah: turn it and turn it again, for everything is in it — a celebration of lifelong study, revisiting, and discovering new insight in familiar wisdom.",
    historicalContext:
      "Pirkei Avot closes with encouragement toward recursive, lifelong Torah study.",
    modernApplication:
      "Returning to a text or question with a new life stage often reveals what earlier readings could not.",
    takeaway:
      "Treat this moment as a teacher: what is it asking you to learn, practice, or understand more deeply?",
    reflectionQuestion:
      "If you “turned” this situation again, what new angle might appear?",
    acknowledgment: "Curiosity is already a kind of beginning.",
    viewpoint: "Classical rabbinic study ethic",
    keywords: [
      "learn",
      "learning",
      "study",
      "teach",
      "student",
      "wisdom",
      "grow",
      "growth",
      "understand",
      "curious",
      "torah",
      "question",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "generosity-tzedakah",
    theme: "generosity",
    themeLabel: "Generosity",
    sources: [
      {
        canonical: "Deuteronomy 15:7–8",
        url: "https://www.sefaria.org/Deuteronomy.15.7-8",
      },
    ],
    textKind: "paraphrase",
    text: "The Torah urges open-handedness toward a person in need — not hardening the heart or closing the hand, but giving with care and responsibility.",
    historicalContext:
      "Deuteronomy 15 addresses obligations toward those in need within the covenantal community.",
    modernApplication:
      "Tzedakah is often translated as charity, but its root points toward justice — giving as right relationship, not only optional kindness.",
    takeaway:
      "Offer one concrete act of generosity — time, attention, advocacy, or resources — sized to what you can honestly sustain.",
    reflectionQuestion:
      "Where might an open hand create more dignity than an open opinion?",
    acknowledgment: "Generosity asks both heart and honesty about what you can give.",
    viewpoint: "Biblical social ethics; later tzedakah literature elaborates",
    keywords: [
      "generous",
      "generosity",
      "give",
      "giving",
      "charity",
      "tzedakah",
      "donate",
      "help",
      "need",
      "share",
      "open hand",
      "kindness",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "technology-stumbling-block",
    theme: "technology",
    themeLabel: "Technology and responsibility",
    sources: [
      {
        canonical: "Leviticus 19:14",
        url: "https://www.sefaria.org/Leviticus.19.14",
      },
    ],
    textKind: "quotation",
    text: "You shall not… place a stumbling block before the blind",
    translationAttribution: "JPS Tanakh (1985) English rendering of Leviticus 19:14 (excerpt)",
    historicalContext:
      "Leviticus 19:14 forbids exploiting or endangering someone who cannot see a hazard. Rabbinic interpretation later extends “stumbling block” to misleading counsel and enabling harm — a later interpretive expansion, not additional biblical wording.",
    modernApplication:
      "New technologies invite old questions: Who could be harmed? What dignity is at stake? What safeguard would honor the vulnerable?",
    takeaway:
      "Before using or building a tool (including AI), ask who might stumble because of it — and what safeguard would honor their dignity.",
    reflectionQuestion:
      "How can your use of technology serve clarity and care rather than speed and convenience alone?",
    acknowledgment: "New tools still ask old questions about responsibility.",
    viewpoint: "Biblical verse + later rabbinic extension (lifnei iver)",
    keywords: [
      "technology",
      "tech",
      "ai",
      "artificial intelligence",
      "chatgpt",
      "digital",
      "internet",
      "social media",
      "algorithm",
      "tool",
      "screen",
      "phone",
      "responsible",
      "innovation",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "patience-proverbs-14",
    theme: "patience",
    themeLabel: "Patience",
    sources: [
      {
        canonical: "Proverbs 14:29",
        url: "https://www.sefaria.org/Proverbs.14.29",
      },
    ],
    textKind: "paraphrase",
    text: "Proverbs praises the patient of spirit as showing great understanding, while a quick temper exalts folly — linking patience with wisdom rather than weakness.",
    historicalContext:
      "Proverbs repeatedly contrasts hasty anger with understanding.",
    modernApplication:
      "Patience is framed as understanding: the capacity to hold complexity without exploding it into reaction.",
    takeaway:
      "When impatience rises, ask what fuller picture you might be missing.",
    reflectionQuestion:
      "What understanding becomes possible if you wait a little longer?",
    acknowledgment: "Impatience often means something important is pressing.",
    viewpoint: "Biblical wisdom literature (Proverbs)",
    keywords: [
      "impatient",
      "quick temper",
      "rush",
      "hasty",
      "slow down",
      "understanding",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "relationships-peace",
    theme: "relationships",
    themeLabel: "Difficult relationships",
    sources: [
      {
        canonical: "Pirkei Avot 1:12 (Hillel)",
        url: "https://www.sefaria.org/Pirkei_Avot.1.12",
      },
    ],
    textKind: "paraphrase",
    text: "Hillel teaches to be among the disciples of Aaron — loving peace, pursuing peace, loving people, and drawing them near to Torah.",
    historicalContext:
      "Hillel presents Aaron as a model of active peacemaking and relational care.",
    modernApplication:
      "Peace (shalom) in Jewish thought is often active — something pursued, not only hoped for.",
    takeaway:
      "Look for one peacemaking move: a softer opening, a clarifying question, or a pause that prevents needless escalation.",
    reflectionQuestion:
      "What would “pursuing peace” look like in this relationship without abandoning truth?",
    acknowledgment: "Peacemaking is work — and it still matters.",
    viewpoint: "Hillelite teaching in Pirkei Avot",
    keywords: [
      "peace",
      "shalom",
      "reconcile",
      "reconciliation",
      "mediate",
      "harmony",
      "calm down",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "speech-death-life",
    theme: "speech",
    themeLabel: "Speech and gossip",
    sources: [
      {
        canonical: "Proverbs 18:21",
        url: "https://www.sefaria.org/Proverbs.18.21",
      },
    ],
    textKind: "paraphrase",
    text: "Proverbs teaches that death and life are in the power of the tongue — a vivid reminder that speech can devastate or give life.",
    historicalContext:
      "Proverbs treats speech as morally consequential creative force.",
    modernApplication:
      "Careful speech is a daily practice: clarity without cruelty, honesty without humiliation.",
    takeaway:
      "Choose words that add life: clarity without cruelty, honesty without humiliation.",
    reflectionQuestion:
      "Will your next sentence add life to this situation, or drain it?",
    acknowledgment: "A single sentence can change the temperature of a room.",
    viewpoint: "Biblical wisdom literature (Proverbs)",
    keywords: [
      "tongue",
      "harsh words",
      "insult",
      "kind words",
      "encouragement",
      "critique",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "learning-avot-1-15",
    theme: "learning",
    themeLabel: "Learning",
    sources: [
      {
        canonical: "Pirkei Avot 1:15 (Shammai)",
        url: "https://www.sefaria.org/Pirkei_Avot.1.15",
      },
    ],
    textKind: "paraphrase",
    text: "Shammai teaches to make your Torah study a fixed practice, say little and do much, and greet every person with a pleasant face.",
    historicalContext:
      "Shammai’s teaching pairs disciplined study with humility in speech and warmth in human encounter.",
    modernApplication:
      "Consistency and kindness can matter more than dramatic gestures.",
    takeaway:
      "Anchor one small learning or character practice at a fixed time — and greet someone today with deliberate warmth.",
    reflectionQuestion:
      "Where could a little more consistency matter more than a dramatic gesture?",
    acknowledgment: "Small steady practices add up.",
    viewpoint: "Shammaite teaching in Pirkei Avot",
    keywords: [
      "practice",
      "habit",
      "discipline",
      "study habit",
      "pleasant",
      "greeting",
      "consistency",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "generosity-rambam-ladder",
    theme: "generosity",
    themeLabel: "Generosity",
    sources: [
      {
        canonical:
          "Maimonides, Mishneh Torah, Hilchot Matnot Aniyim (levels of tzedakah)",
        url: "https://www.sefaria.org/Mishneh_Torah%2C_Gifts_to_the_Poor.10",
      },
    ],
    textKind: "paraphrase",
    text: "Maimonides describes levels of giving, praising forms that preserve the recipient’s dignity — especially help that strengthens independence and avoids embarrassment.",
    historicalContext:
      "Rambam’s famous “ladder” of tzedakah ranks modes of giving by how much dignity and independence they protect.",
    modernApplication:
      "Jewish generosity is measured not only by amount, but by how carefully dignity is preserved.",
    takeaway:
      "When you help, ask how to preserve the other person’s dignity as carefully as you offer aid.",
    reflectionQuestion:
      "How can your generosity leave someone more upright, not more indebted?",
    acknowledgment: "Help lands best when dignity comes with it.",
    viewpoint: "Maimonidean ethics of tzedakah",
    keywords: [
      "dignity",
      "help someone",
      "aid",
      "support someone",
      "independence",
      "empower",
    ],
    reviewStatus: "awaiting-educator-review",
  },
  {
    id: "courage-nachshon",
    theme: "courage",
    themeLabel: "Courage",
    sources: [
      {
        canonical: "Babylonian Talmud, Sotah 37a (Nachshon tradition)",
        url: "https://www.sefaria.org/Sotah.37a",
      },
    ],
    textKind: "paraphrase",
    text: "Rabbinic tradition remembers Nachshon stepping into the sea before it split — an image of courage that begins in the water, not after certainty arrives.",
    historicalContext:
      "Talmudic and midrashic traditions expand the Exodus narrative with Nachshon’s initiative at the sea. This is rabbinic storytelling, not a plain biblical verse.",
    modernApplication:
      "Some Jewish stories celebrate initiative under uncertainty: faith expressed as movement when the path is not yet clear.",
    takeaway:
      "You do not need total certainty to take a first responsible step into the unknown.",
    reflectionQuestion:
      "What first step are you waiting for perfect certainty before taking?",
    acknowledgment: "Sometimes the first step comes before the path is clear.",
    viewpoint: "Rabbinic midrashic/talmudic tradition",
    keywords: [
      "leap",
      "first step",
      "initiative",
      "faith",
      "unknown",
      "begin",
      "start",
    ],
    reviewStatus: "awaiting-educator-review",
  },
];

export const TEACHINGS: Teaching[] = [...CORE_TEACHINGS, ...DRAFT_TEACHINGS];

export function getTeachingById(id: string): Teaching | undefined {
  return TEACHINGS.find((t) => t.id === id);
}
