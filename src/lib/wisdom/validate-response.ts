import type { WisdomResponse } from "./types";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === "string";
}

/**
 * Validate API payloads before rendering. Returns null when unsafe to render.
 */
export function validateWisdomResponse(data: unknown): WisdomResponse | null {
  if (!data || typeof data !== "object") return null;
  const raw = data as Record<string, unknown>;

  const mode = raw.mode;
  if (
    mode !== "teaching" &&
    mode !== "safety" &&
    mode !== "empty" &&
    mode !== "fallback" &&
    mode !== "error" &&
    mode !== "multi" &&
    mode !== "abstain"
  ) {
    return null;
  }

  if (!isNonEmptyString(raw.acknowledgment)) return null;
  if (!isNonEmptyString(raw.tryThisToday)) return null;

  if (raw.teaching != null) {
    if (typeof raw.teaching !== "object") return null;
    const t = raw.teaching as Record<string, unknown>;
    if (!isNonEmptyString(t.id)) return null;
    if (!isNonEmptyString(t.themeLabel)) return null;
    if (!isNonEmptyString(t.text)) return null;
    if (t.textKind !== "quotation" && t.textKind !== "paraphrase") return null;
    if (!Array.isArray(t.sources)) return null;
    if (!isNonEmptyString(t.modernApplication)) return null;
    if (!isNonEmptyString(t.historicalContext)) return null;
  }

  if (raw.lenses != null) {
    if (!Array.isArray(raw.lenses) || raw.lenses.length === 0) return null;
    for (const lens of raw.lenses) {
      if (!lens || typeof lens !== "object") return null;
      const l = lens as Record<string, unknown>;
      if (!isNonEmptyString(l.id)) return null;
      if (!isNonEmptyString(l.title)) return null;
      if (!isNonEmptyString(l.explanation)) return null;
      if (!l.sourcePanel || typeof l.sourcePanel !== "object") return null;
    }
  }

  if (raw.torahPassages != null) {
    if (!Array.isArray(raw.torahPassages)) return null;
    for (const p of raw.torahPassages) {
      if (!p || typeof p !== "object") return null;
      const passage = p as Record<string, unknown>;
      if (!isNonEmptyString(passage.ref)) return null;
      if (!isNonEmptyString(passage.english)) return null;
      if (!isNonEmptyString(passage.sefariaUrl)) return null;
      if (!isOptionalString(passage.hebrew)) return null;
    }
  }

  if (raw.alternateTeachingIds != null) {
    if (!Array.isArray(raw.alternateTeachingIds)) return null;
    if (!raw.alternateTeachingIds.every((id) => typeof id === "string")) {
      return null;
    }
  }

  return raw as unknown as WisdomResponse;
}
