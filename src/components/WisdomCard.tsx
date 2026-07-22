"use client";

import type { SourcePanel, TorahPassage, WisdomResponse } from "@/lib/wisdom/types";
import { useState } from "react";

interface WisdomCardProps {
  response: WisdomResponse;
  onAskAnother: () => void;
  onCopy: () => void;
  onAnotherLens?: () => void;
  onShare?: () => void;
  copied: boolean;
  hasAnotherLens?: boolean;
  canShare?: boolean;
}

const ORIGINAL_EXCERPT_CHARS = 320;

export function WisdomCard({
  response,
  onAskAnother,
  onCopy,
  onAnotherLens,
  onShare,
  copied,
  hasAnotherLens,
  canShare,
}: WisdomCardProps) {
  const isSensitive = response.mode === "safety";
  const isMulti = response.mode === "multi" && (response.lenses?.length ?? 0) > 0;
  const isAbstain = response.mode === "abstain";
  const themeLabel = response.teaching?.themeLabel?.trim();
  const teaching = response.teaching;
  const panel = teaching?.sourcePanel;

  return (
    <article
      className={`wisdom-card ${isSensitive ? "wisdom-card-sensitive" : "wisdom-card-lit"}`}
      aria-live="polite"
    >
      <header className="wisdom-card-header">
        {isMulti ? (
          <>
            <p className="theme-label">JEWISH WISDOM</p>
            <h2 className="wisdom-card-heading">
              Jewish wisdom offers more than one lens
            </h2>
          </>
        ) : isAbstain ? (
          <h2 className="wisdom-card-heading">Looking for a clearer match</h2>
        ) : (
          <>
            {themeLabel ? (
              <p className="theme-label">{themeLabel.toUpperCase()}</p>
            ) : null}
            <h2 className="wisdom-card-heading">A teaching for this moment</h2>
          </>
        )}
        {response.acknowledgment ? (
          <p className="wisdom-ack">{response.acknowledgment}</p>
        ) : null}
      </header>

      {isMulti
        ? response.lenses!.map((lens) => (
            <section key={lens.id} className="lens-block" aria-label={lens.title}>
              <h3 className="lens-title">{lens.title}</h3>
              <PrimarySourcePanel panel={lens.sourcePanel} />
              <p className="lens-explanation">{lens.explanation}</p>
            </section>
          ))
        : null}

      {!isMulti && !isAbstain && panel ? (
        <PrimarySourcePanel panel={panel} />
      ) : null}

      {isMulti && response.synthesis ? (
        <section className="wisdom-section" aria-labelledby="synthesis">
          <h3 id="synthesis">Holding the lenses together</h3>
          <p>{response.synthesis}</p>
        </section>
      ) : null}

      {!isMulti && teaching?.text ? (
        <section className="wisdom-section wisdom-lens" aria-labelledby="carry-it">
          <h3 id="carry-it">One way to carry it</h3>
          <p className="lens-text">{teaching.text}</p>
          <p className="lens-note">An accessible lens for learning — not a ruling.</p>
        </section>
      ) : null}

      {response.tryThisToday ? (
        <section className="wisdom-section" aria-labelledby="try-today">
          <h3 id="try-today">Try this today</h3>
          <p>{response.tryThisToday}</p>
        </section>
      ) : null}

      {response.reflectionQuestion ? (
        <section className="wisdom-section" aria-labelledby="carry-q">
          <h3 id="carry-q">A question to carry</h3>
          <p className="reflection">{response.reflectionQuestion}</p>
        </section>
      ) : null}

      {!isMulti && response.torahPassages?.length ? (
        <RelatedTorahSources passages={response.torahPassages} />
      ) : null}

      <div className="wisdom-actions">
        <button type="button" className="btn-primary btn-lamp" onClick={onAskAnother}>
          Ask something else
        </button>
        {hasAnotherLens && onAnotherLens && !isMulti ? (
          <button type="button" className="btn-secondary" onClick={onAnotherLens}>
            Another lens
          </button>
        ) : null}
        <button type="button" className="btn-ghost" onClick={onCopy}>
          {copied ? "Copied" : "Copy"}
        </button>
        {canShare && onShare ? (
          <button type="button" className="btn-ghost" onClick={onShare}>
            Share
          </button>
        ) : null}
      </div>
    </article>
  );
}

function PrimarySourcePanel({ panel }: { panel: SourcePanel }) {
  const original = panel.originalText?.trim() || panel.hebrew?.trim() || null;
  const english = panel.english?.trim() || null;
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!original && !english) return null;

  const lang = panel.originalLanguage === "aramaic" ? "arc" : "he";
  const longOriginal = Boolean(
    original && original.length > ORIGINAL_EXCERPT_CHARS,
  );
  const longEnglish = Boolean(
    english && english.length > ORIGINAL_EXCERPT_CHARS,
  );
  const shownOriginal =
    original && longOriginal && !expanded
      ? `${original.slice(0, ORIGINAL_EXCERPT_CHARS).trim()}…`
      : original;
  const shownEnglish =
    english && longEnglish && !expanded
      ? `${english.slice(0, ORIGINAL_EXCERPT_CHARS).trim()}…`
      : english;

  return (
    <aside className="primary-source" aria-label="Classical source">
      {original ? (
        <blockquote className="source-hebrew" lang={lang} dir="rtl">
          {shownOriginal}
        </blockquote>
      ) : null}

      {english ? (
        <div className="source-english-block" lang="en" dir="ltr">
          {panel.englishKind === "paraphrase" ? (
            <p className="source-english-label">Paraphrase</p>
          ) : null}
          <blockquote className="source-english">{shownEnglish}</blockquote>
        </div>
      ) : null}

      <p className="source-citation">{panel.citationLabel}</p>

      {(longOriginal || longEnglish) && (
        <button
          type="button"
          className="source-expand"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show shorter excerpt" : "Show fuller passage"}
        </button>
      )}

      <button
        type="button"
        className="learn-more-btn"
        aria-expanded={learnMoreOpen}
        onClick={() => setLearnMoreOpen((v) => !v)}
      >
        Learn more about this teaching
      </button>

      {learnMoreOpen ? (
        <div className="learn-more-panel">
          <p>
            <strong>What this is.</strong> {categoryBlurb(panel.category)}
          </p>
          <p>
            <strong>Where it appears.</strong> {panel.citationLabel}.
          </p>
          {panel.historicalContext ? (
            <p>
              <strong>Traditional context.</strong> {panel.historicalContext}
            </p>
          ) : null}
          <p>
            <strong>How Torok applies it.</strong> Torok offers one accessible
            reading for everyday life — not a ruling or personal advice.
          </p>
          {panel.englishVersionTitle || panel.originalEdition ? (
            <p>
              <strong>Translation &amp; edition.</strong>{" "}
              {panel.originalLanguage === "aramaic" ? "Aramaic" : "Hebrew"}
              {panel.originalEdition ? `: ${panel.originalEdition}` : ""}
              {panel.originalLicense ? ` (${panel.originalLicense})` : ""}
              {panel.englishVersionTitle
                ? ` · English: ${panel.englishVersionTitle}`
                : ""}
              {panel.englishLicense ? ` (${panel.englishLicense})` : ""}
            </p>
          ) : null}
          {panel.sefariaUrl ? (
            <a
              className="source-quiet-link"
              href={panel.sefariaUrl}
              target="_blank"
              rel="noreferrer"
            >
              View source
            </a>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}

function categoryBlurb(category: SourcePanel["category"]): string {
  switch (category) {
    case "torah":
      return "A passage from the Five Books of Moses (Torah).";
    case "tanakh":
      return "A passage from the Hebrew Bible beyond the Five Books (Tanakh).";
    case "rabbinic":
      return "A classical rabbinic teaching (for example Mishnah, Talmud, or Midrash).";
    case "later":
      return "A later rabbinic or ethical source in the Jewish tradition.";
    default:
      return "A classical Jewish source.";
  }
}

function RelatedTorahSources({ passages }: { passages: TorahPassage[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const passage = passages[index];
  const hasMore = index < passages.length - 1;

  if (!passage) return null;

  return (
    <section className="related-torah">
      <button
        type="button"
        className="related-torah-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Related source
      </button>
      {open ? (
        <div className="related-torah-body">
          {passage.hebrew?.trim() ? (
            <blockquote className="source-hebrew" lang="he" dir="rtl">
              {passage.hebrew}
            </blockquote>
          ) : null}
          <blockquote className="source-english" lang="en" dir="ltr">
            {passage.english}
          </blockquote>
          <p className="source-citation">{passage.ref}</p>
          <p className="why-source">{passage.whyRelevant}</p>
          <a
            className="source-quiet-link"
            href={passage.sefariaUrl}
            target="_blank"
            rel="noreferrer"
          >
            View source
          </a>
          {hasMore ? (
            <button
              type="button"
              className="btn-ghost explore-another"
              onClick={() => setIndex((i) => i + 1)}
            >
              Explore another source
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
