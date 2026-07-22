import type { Teaching } from "./types";

/**
 * Curated teachings for Torok's free local response engine.
 * Every entry uses a paraphrase of a well-attested classical source.
 * Exact wording of sacred texts is avoided; citations point readers
 * to the traditional location for further study.
 */
export const TEACHINGS: Teaching[] = [
  {
    id: "patience-avot-4-1",
    theme: "patience",
    themeLabel: "Patience",
    source: "Pirkei Avot 4:1 (Ben Zoma)",
    paraphrase:
      "Paraphrase: Ben Zoma teaches that true strength is not domination of others, but mastery of one’s own impulse — the patient work of governing oneself.",
    explanation:
      "Jewish wisdom often treats patience as a form of inner strength. Waiting, cooling down, and choosing a measured response can be acts of courage rather than passivity.",
    takeaway:
      "Before you react, give yourself one breath and one clearer intention. Strength may look like restraint.",
    reflectionQuestion:
      "What would it look like to meet this moment with strength that is quiet rather than forceful?",
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
  },
  {
    id: "repair-teshuvah",
    theme: "repair",
    themeLabel: "Repair and apology",
    source: "Maimonides, Mishneh Torah, Hilchot Teshuvah (Laws of Repentance)",
    paraphrase:
      "Paraphrase: Classical Jewish teachings on teshuvah describe repair as more than feeling sorry — it includes recognizing the harm, regretting it, seeking to make amends where possible, and changing future behavior.",
    explanation:
      "Jewish tradition treats apology as a process of return and repair. A sincere apology names what went wrong, centers the person harmed, and aims toward concrete change.",
    takeaway:
      "Name the harm plainly, ask what repair would help, and choose one concrete change you can keep.",
    reflectionQuestion:
      "What specific harm needs naming — and what repair would feel real to the other person?",
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
  },
  {
    id: "relationships-neighbor",
    theme: "relationships",
    themeLabel: "Difficult relationships",
    source: "Leviticus 19:18",
    paraphrase:
      "Paraphrase: The Torah instructs, “Love your neighbor as yourself,” a teaching later highlighted by Rabbi Akiva as a great principle — calling for dignity, empathy, and fair regard even when relationships are strained.",
    explanation:
      "Jewish ethics do not pretend every relationship is easy. Loving a neighbor can mean treating them with basic dignity, setting fair boundaries, and refusing to turn disagreement into contempt.",
    takeaway:
      "In a hard conversation, lead with dignity: listen for the person behind the conflict before defending your position.",
    reflectionQuestion:
      "How can you protect your own integrity while still treating the other person as someone with dignity?",
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
  },
  {
    id: "leadership-hillel",
    theme: "leadership",
    themeLabel: "Leadership",
    source: "Pirkei Avot 1:14 (Hillel)",
    paraphrase:
      "Paraphrase: Hillel asks: If I am not for myself, who will be for me? If I am only for myself, what am I? And if not now, when?",
    explanation:
      "This teaching holds three tensions at once: self-responsibility, responsibility to others, and the urgency of acting in time. Leadership in Jewish thought is less about status than about timely, ethical responsibility.",
    takeaway:
      "Ask which part of the moment needs your care for yourself, which needs care for others, and what one step belongs to today.",
    reflectionQuestion:
      "Where are you being asked to show up — for yourself, for others, or both — and what cannot wait?",
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
  },
  {
    id: "courage-joshua",
    theme: "courage",
    themeLabel: "Courage",
    source: "Joshua 1:9",
    paraphrase:
      "Paraphrase: Joshua is told to be strong and courageous, and not to be dismayed — a call to steady heart in the face of uncertainty and large responsibility.",
    explanation:
      "Biblical courage is often paired with reassurance rather than bravado. Strength here includes continuing forward even when fear is present.",
    takeaway:
      "Name the fear honestly, then take the smallest brave step that still honors your values.",
    reflectionQuestion:
      "What brave step is small enough to begin today, yet honest enough to matter?",
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
  },
  {
    id: "gratitude-modeh",
    theme: "gratitude",
    themeLabel: "Gratitude",
    source: "Jewish morning liturgy (Modeh Ani tradition) and Psalms of thanksgiving",
    paraphrase:
      "Paraphrase: Jewish practice begins many days with gratitude for the gift of returning to life and awareness — training the heart to notice what is already given before rushing into what is missing.",
    explanation:
      "Gratitude in Jewish life is often practiced, not only felt. Blessings and morning thanks help people notice goodness that would otherwise pass unseen.",
    takeaway:
      "Name three specific gifts from today — people, moments, or capacities — before rehearsing what is lacking.",
    reflectionQuestion:
      "What ordinary goodness have you been moving past too quickly to notice?",
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
  },
  {
    id: "community-avot-2-4",
    theme: "community",
    themeLabel: "Community",
    source: "Pirkei Avot 2:4 (Hillel)",
    paraphrase:
      "Paraphrase: Hillel teaches not to separate oneself from the community — a reminder that human flourishing is woven with shared life, mutual responsibility, and belonging.",
    explanation:
      "Jewish tradition prizes community as a source of support, accountability, celebration, and repair. Isolation can feel protective, but belonging often strengthens resilience.",
    takeaway:
      "Reach toward one trustworthy person or communal space instead of carrying this entirely alone.",
    reflectionQuestion:
      "Who or what community could share this moment with you — even a little?",
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
  },
  {
    id: "justice-pursue",
    theme: "justice",
    themeLabel: "Justice",
    source: "Deuteronomy 16:20",
    paraphrase:
      "Paraphrase: The Torah says, “Justice, justice shall you pursue,” emphasizing not only a love of fairness, but an active, persistent seeking of just outcomes.",
    explanation:
      "The doubled wording has long invited interpretation: pursue justice carefully, repeatedly, and by just means. Jewish ethics link righteousness with action in the public square and in private dealings.",
    takeaway:
      "Choose one fair action within your reach — a clearer word, a corrected process, or advocacy that does not abandon integrity.",
    reflectionQuestion:
      "Where can you pursue fairness without abandoning the means that keep justice just?",
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
  },
  {
    id: "rest-shabbat",
    theme: "rest",
    themeLabel: "Rest",
    source: "Exodus 20:8–11 (Shabbat commandment)",
    paraphrase:
      "Paraphrase: The Torah commands remembering and keeping Shabbat — a sacred rhythm of pausing from creative labor so that rest, dignity, and renewal have a protected place in life.",
    explanation:
      "Jewish wisdom treats rest as holy, not lazy. Stopping work can restore perspective, relationships, and the sense that we are more than our productivity.",
    takeaway:
      "Protect one small pocket of genuine rest today — phone down, task unfinished, presence restored.",
    reflectionQuestion:
      "What would it mean to treat rest as sacred rather than as something you have to earn?",
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
  },
  {
    id: "speech-lashon-hara",
    theme: "speech",
    themeLabel: "Speech and gossip",
    source: "Leviticus 19:16; classical teachings on lashon hara (harmful speech)",
    paraphrase:
      "Paraphrase: The Torah warns against going about as a talebearer among one’s people. Later Jewish ethics develop careful guardrails around gossip, rumor, and speech that damages reputation.",
    explanation:
      "Words can heal or harm. Jewish tradition takes speech seriously because reputations, trust, and community bonds are easily torn and slowly mended.",
    takeaway:
      "Before sharing, ask: Is it true? Is it necessary? Is it kind? If any answer is no, pause.",
    reflectionQuestion:
      "What would change if you treated your next words as something that can either repair or wound?",
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
  },
  {
    id: "uncertainty-trust",
    theme: "uncertainty",
    themeLabel: "Uncertainty",
    source: "Proverbs 3:5–6",
    paraphrase:
      "Paraphrase: Proverbs invites trusting with the whole heart and not leaning only on one’s own understanding — seeking a path steadied by wisdom beyond anxious self-reliance alone.",
    explanation:
      "Jewish tradition does not deny uncertainty; it offers practices of trust, counsel, prayer, and humble decision-making when the map is incomplete.",
    takeaway:
      "When the path is unclear, gather one wise perspective, clarify your values, and take the next faithful step — not the whole journey at once.",
    reflectionQuestion:
      "What do you know for sure about your values, even while the outcome remains unknown?",
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
  },
  {
    id: "learning-ben-bag-bag",
    theme: "learning",
    themeLabel: "Learning",
    source: "Pirkei Avot 5:22 (Ben Bag Bag)",
    paraphrase:
      "Paraphrase: Ben Bag Bag says of Torah: turn it and turn it again, for everything is in it — a celebration of lifelong study, revisiting, and discovering new insight in familiar wisdom.",
    explanation:
      "Jewish learning is iterative. Returning to a text or question with a new life stage often reveals what earlier readings could not.",
    takeaway:
      "Treat this moment as a teacher: what is it asking you to learn, practice, or understand more deeply?",
    reflectionQuestion:
      "If you “turned” this situation again, what new angle might appear?",
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
  },
  {
    id: "generosity-tzedakah",
    theme: "generosity",
    themeLabel: "Generosity",
    source: "Deuteronomy 15:7–8; classical teachings on tzedakah",
    paraphrase:
      "Paraphrase: The Torah urges open-handedness toward a person in need — not hardening the heart or closing the hand, but giving with care and responsibility.",
    explanation:
      "Tzedakah is often translated as charity, but its root points toward justice. Giving is framed as right relationship, not only optional kindness.",
    takeaway:
      "Offer one concrete act of generosity — time, attention, advocacy, or resources — sized to what you can honestly sustain.",
    reflectionQuestion:
      "Where might an open hand create more dignity than an open opinion?",
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
  },
  {
    id: "technology-stumbling-block",
    theme: "technology",
    themeLabel: "Technology and responsibility",
    source: "Leviticus 19:14 (“Do not place a stumbling block before the blind”)",
    paraphrase:
      "Paraphrase: The Torah forbids placing a stumbling block before the blind — a principle later applied broadly to avoid causing others to stumble through misleading advice, exploitative design, or hidden harm.",
    explanation:
      "Jewish ethics around tools and power ask: Who could be harmed by this? What dignity is at stake? New technologies invite old questions about responsibility, truthfulness, and care for the vulnerable.",
    takeaway:
      "Before using or building a tool (including AI), ask who might stumble because of it — and what safeguard would honor their dignity.",
    reflectionQuestion:
      "How can your use of technology serve clarity and care rather than speed and convenience alone?",
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
  },
  {
    id: "patience-proverbs-14",
    theme: "patience",
    themeLabel: "Patience",
    source: "Proverbs 14:29",
    paraphrase:
      "Paraphrase: Proverbs praises the patient of spirit as showing great understanding, while a quick temper exalts folly — linking patience with wisdom rather than weakness.",
    explanation:
      "Patience is framed as understanding: the capacity to hold complexity without exploding it into reaction.",
    takeaway:
      "When impatience rises, ask what fuller picture you might be missing.",
    reflectionQuestion:
      "What understanding becomes possible if you wait a little longer?",
    keywords: [
      "impatient",
      "quick temper",
      "rush",
      "hasty",
      "slow down",
      "understanding",
    ],
  },
  {
    id: "relationships-peace",
    theme: "relationships",
    themeLabel: "Difficult relationships",
    source: "Pirkei Avot 1:12 (Hillel)",
    paraphrase:
      "Paraphrase: Hillel teaches to be among the disciples of Aaron — loving peace, pursuing peace, loving people, and drawing them near to Torah.",
    explanation:
      "Peace (shalom) in Jewish thought is active. It is something we pursue, not only something we hope appears.",
    takeaway:
      "Look for one peacemaking move: a softer opening, a clarifying question, or a pause that prevents needless escalation.",
    reflectionQuestion:
      "What would “pursuing peace” look like in this relationship without abandoning truth?",
    keywords: [
      "peace",
      "shalom",
      "reconcile",
      "reconciliation",
      "mediate",
      "harmony",
      "calm down",
    ],
  },
  {
    id: "speech-death-life",
    theme: "speech",
    themeLabel: "Speech and gossip",
    source: "Proverbs 18:21",
    paraphrase:
      "Paraphrase: Proverbs teaches that death and life are in the power of the tongue — a vivid reminder that speech can devastate or give life.",
    explanation:
      "Jewish ethics treat language as creative force. Careful speech is a daily spiritual practice, not a minor courtesy.",
    takeaway:
      "Choose words that add life: clarity without cruelty, honesty without humiliation.",
    reflectionQuestion:
      "Will your next sentence add life to this situation, or drain it?",
    keywords: [
      "tongue",
      "harsh words",
      "insult",
      "kind words",
      "encouragement",
      "critique",
    ],
  },
  {
    id: "learning-avot-1-15",
    theme: "learning",
    themeLabel: "Learning",
    source: "Pirkei Avot 1:15 (Shammai)",
    paraphrase:
      "Paraphrase: Shammai teaches to make your Torah study a fixed practice, say little and do much, and greet every person with a pleasant face.",
    explanation:
      "Learning is paired with character: consistency in study, humility in speech, and warmth in human encounter.",
    takeaway:
      "Anchor one small learning or character practice at a fixed time — and greet someone today with deliberate warmth.",
    reflectionQuestion:
      "Where could a little more consistency matter more than a dramatic gesture?",
    keywords: [
      "practice",
      "habit",
      "discipline",
      "study habit",
      "pleasant",
      "greeting",
      "consistency",
    ],
  },
  {
    id: "generosity-rambam-ladder",
    theme: "generosity",
    themeLabel: "Generosity",
    source: "Maimonides, Mishneh Torah, Hilchot Matnot Aniyim (eight levels of tzedakah)",
    paraphrase:
      "Paraphrase: Maimonides describes levels of giving, praising forms that preserve the recipient’s dignity — especially help that strengthens independence and avoids embarrassment.",
    explanation:
      "Jewish generosity is measured not only by amount, but by how much dignity the gift protects.",
    takeaway:
      "When you help, ask how to preserve the other person’s dignity as carefully as you offer aid.",
    reflectionQuestion:
      "How can your generosity leave someone more upright, not more indebted?",
    keywords: [
      "dignity",
      "help someone",
      "aid",
      "support someone",
      "independence",
      "empower",
    ],
  },
  {
    id: "courage-nachshon",
    theme: "courage",
    themeLabel: "Courage",
    source: "Midrashic tradition on Nachshon at the Sea (e.g., Sotah 37a; Exodus Midrash)",
    paraphrase:
      "Paraphrase: Rabbinic tradition remembers Nachshon stepping into the sea before it split — an image of courage that begins in the water, not after certainty arrives.",
    explanation:
      "Some Jewish stories celebrate initiative under uncertainty: faith expressed as movement when the path is not yet clear.",
    takeaway:
      "You do not need total certainty to take a first responsible step into the unknown.",
    reflectionQuestion:
      "What first step are you waiting for perfect certainty before taking?",
    keywords: [
      "leap",
      "first step",
      "initiative",
      "faith",
      "unknown",
      "begin",
      "start",
    ],
  },
];

export const THEME_LABELS: Record<string, string> = Object.fromEntries(
  TEACHINGS.map((t) => [t.theme, t.themeLabel]),
);
