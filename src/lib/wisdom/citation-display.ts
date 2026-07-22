/** Client-safe citation helpers (no node:fs / Torah corpus). */

const BOOK_PATTERN =
  /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy)\s+(\d{1,3}):(\d{1,3})\b/i;

const HEBREW_BOOK: Record<string, string> = {
  Genesis: "בראשית",
  Exodus: "שמות",
  Leviticus: "ויקרא",
  Numbers: "במדבר",
  Deuteronomy: "דברים",
};

const HEB_DIGITS = ["׳", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
const HEB_TENS = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];

function toHebrewNumeral(n: number): string {
  if (n <= 0 || n > 99) return String(n);
  if (n === 15) return "ט״ו";
  if (n === 16) return "ט״ז";
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const raw = `${HEB_TENS[tens] ?? ""}${ones ? HEB_DIGITS[ones] : ""}`;
  if (raw.length === 1) return `${raw}׳`;
  return `${raw.slice(0, -1)}״${raw.slice(-1)}`;
}

function properBook(name: string): string {
  return (
    {
      genesis: "Genesis",
      exodus: "Exodus",
      leviticus: "Leviticus",
      numbers: "Numbers",
      deuteronomy: "Deuteronomy",
    }[name.toLowerCase()] ?? name
  );
}

export function extractTorahRefClient(canonical: string): string | null {
  const match = canonical.match(BOOK_PATTERN);
  if (!match) return null;
  const book = properBook(match[1]);
  return `${book} ${Number(match[2])}:${Number(match[3])}`;
}

export function hebrewCitationForRef(ref: string): string | null {
  const match = ref.match(BOOK_PATTERN);
  if (!match) return null;
  const proper = properBook(match[1]);
  const heBook = HEBREW_BOOK[proper];
  if (!heBook) return null;
  return `${heBook} ${toHebrewNumeral(Number(match[2]))}:${toHebrewNumeral(Number(match[3]))}`;
}
