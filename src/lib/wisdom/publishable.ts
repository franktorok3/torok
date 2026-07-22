import type { Teaching } from "./types";

/**
 * Draft teachings may appear publicly only when they pass automated checks.
 * Review status remains in data; this never claims educator review.
 */
export function passesDraftPublishChecks(teaching: Teaching): boolean {
  if (!teaching.id || !teaching.theme || !teaching.themeLabel) return false;
  if (!teaching.sources.length || teaching.sources.some((s) => !s.canonical)) {
    return false;
  }
  if (!teaching.text || teaching.text.trim().length < 20) return false;
  if (teaching.textKind === "quotation" && !teaching.translationAttribution) {
    return false;
  }
  if (!teaching.modernApplication || teaching.modernApplication.length < 20) {
    return false;
  }
  // Keep classical teaching text distinct from modern application
  if (
    teaching.modernApplication.trim().toLowerCase() ===
    teaching.text.trim().toLowerCase()
  ) {
    return false;
  }
  if (
    teaching.reviewStatus === "draft" &&
    !/modern application/i.test(teaching.modernApplication)
  ) {
    return false;
  }
  if (!teaching.takeaway || teaching.takeaway.length < 10) return false;
  if (!teaching.reflectionQuestion) return false;
  if (!teaching.acknowledgment) return false;
  // No ruling language
  if (/\byou must\b|\bits forbidden for you to\b|\bpsak\b/i.test(teaching.text)) {
    return false;
  }
  if (/\bkill yourself\b|\bend your life\b/i.test(teaching.takeaway)) {
    return false;
  }
  return true;
}

export function isPublishableTeaching(teaching: Teaching): boolean {
  if (teaching.reviewStatus === "educator-reviewed") return true;
  if (teaching.reviewStatus === "awaiting-educator-review") {
    return passesDraftPublishChecks(teaching);
  }
  if (teaching.reviewStatus === "draft") {
    return passesDraftPublishChecks(teaching);
  }
  return false;
}
