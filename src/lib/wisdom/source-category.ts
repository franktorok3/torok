import type { SourceCategory } from "./types";

const TORAH_BOOK =
  /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy)\b/i;

const TANAKH_BOOK =
  /\b(Joshua|Judges|Samuel|Kings|Isaiah|Jeremiah|Ezekiel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Psalms?|Proverbs|Job|Song of Songs|Ruth|Lamentations|Ecclesiastes|Esther|Daniel|Ezra|Nehemiah|Chronicles)\b/i;

const RABBINIC =
  /\b(Pirkei Avot|Mishnah|Talmud|Bavli|Yerushalmi|Sifra|Sifre|Midrash|Tosefta|Berakhot|Shabbat|Sotah|Avot)\b/i;

const LATER =
  /\b(Maimonides|Rambam|Mishneh Torah|Shulchan|Shulḥan|Rashi|Ramban|liturgy|Modeh Ani|siddur)\b/i;

export function inferSourceCategory(canonical: string): SourceCategory {
  if (TORAH_BOOK.test(canonical)) return "torah";
  if (TANAKH_BOOK.test(canonical)) return "tanakh";
  if (RABBINIC.test(canonical)) return "rabbinic";
  if (LATER.test(canonical)) return "later";
  return "later";
}

export function sourceActionLabel(
  category: SourceCategory,
): "Explore this in Torah" | "Explore this teaching" {
  return category === "torah" ? "Explore this in Torah" : "Explore this teaching";
}

/** Soft relevance line for related Torah passages (no retrieval diagnostics). */
export function naturalWhyRelevant(
  matched: string[],
  theme?: string,
): string {
  if (theme && matched.length) {
    return `A companion passage linking ${theme} with ${matched[0]}.`;
  }
  if (theme) {
    return `A companion passage for sitting with ${theme}.`;
  }
  if (matched.length) {
    return `A companion passage touching on ${matched[0]}.`;
  }
  return "A companion passage for further study.";
}
