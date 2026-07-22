"use client";

import type { WisdomResponse } from "@/lib/wisdom/types";
import { useState } from "react";

interface ResponseCardProps {
  response: WisdomResponse;
  onAskAnother: () => void;
  onCopy: () => void;
  onAnotherLens?: () => void;
  copied: boolean;
  hasAnotherLens?: boolean;
}

export function ResponseCard({
  response,
  onAskAnother,
  onCopy,
  onAnotherLens,
  copied,
  hasAnotherLens,
}: ResponseCardProps) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const isSensitive = response.mode === "safety";

  return (
    <article
      className={`answer-card ${isSensitive ? "answer-card-sensitive" : "answer-card-lit"}`}
      aria-live="polite"
    >
      <p className="answer-ack">{response.acknowledgment}</p>

      {response.teaching ? (
        <section className="answer-section">
          <h2>A teaching for this moment</h2>
          <p className="theme-chip">{response.teaching.themeLabel}</p>
          <p className="teaching-text">
            <span className="text-kind">
              {response.teaching.textKind === "quotation"
                ? "Quotation"
                : "Paraphrase"}
              :
            </span>{" "}
            {response.teaching.textKind === "quotation" ? (
              <q>{response.teaching.text}</q>
            ) : (
              response.teaching.text
            )}
          </p>
          {response.teaching.translationAttribution ? (
            <p className="translation-note">
              {response.teaching.translationAttribution}
            </p>
          ) : null}
          <ul className="source-list">
            {response.teaching.sources.map((source) => (
              <li key={source.canonical}>
                <span className="source-label">Source:</span> {source.canonical}
              </li>
            ))}
          </ul>
          <p className="modern-app">{response.teaching.modernApplication}</p>

          <button
            type="button"
            className="source-drawer-toggle"
            aria-expanded={sourceOpen}
            onClick={() => setSourceOpen((v) => !v)}
          >
            {sourceOpen ? "Hide source notes" : "More about this source"}
          </button>
          {sourceOpen ? (
            <div className="source-drawer">
              <p>{response.teaching.historicalContext}</p>
              {response.teaching.viewpoint ? (
                <p className="viewpoint">
                  <strong>Lens:</strong> {response.teaching.viewpoint}
                </p>
              ) : null}
              {response.teaching.sources.some((s) => s.url) ? (
                <ul>
                  {response.teaching.sources
                    .filter((s) => s.url)
                    .map((s) => (
                      <li key={s.url}>
                        <a href={s.url} target="_blank" rel="noreferrer">
                          Open {s.canonical} on Sefaria
                        </a>
                      </li>
                    ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="answer-section">
        <h2>Try this today</h2>
        <p>{response.tryThisToday}</p>
      </section>

      {response.reflectionQuestion ? (
        <section className="answer-section">
          <h2>A question to carry</h2>
          <p className="reflection">{response.reflectionQuestion}</p>
        </section>
      ) : null}

      {response.torahPassages?.length || response.torahExploreNote ? (
        <TorahExplore
          passages={response.torahPassages}
          note={response.torahExploreNote}
        />
      ) : null}

      <div className="answer-actions">
        <button type="button" className="btn-secondary" onClick={onAskAnother}>
          Ask something else
        </button>
        <button type="button" className="btn-secondary" onClick={onCopy}>
          {copied ? "Copied" : "Copy"}
        </button>
        {hasAnotherLens && onAnotherLens ? (
          <button type="button" className="btn-ghost" onClick={onAnotherLens}>
            Another lens
          </button>
        ) : null}
      </div>
    </article>
  );
}

function TorahExplore({
  passages,
  note,
}: {
  passages?: WisdomResponse["torahPassages"];
  note?: string;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const passage = passages?.[index];

  return (
    <section className="torah-explore">
      <button
        type="button"
        className="torah-explore-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Explore this in Torah
      </button>
      {open ? (
        <div className="torah-explore-body">
          {note ? <p className="torah-note">{note}</p> : null}
          {passage ? (
            <div className="torah-passage">
              <p className="source-says-label">The source says</p>
              <p className="teaching-text">
                <span className="text-kind">Quotation:</span>{" "}
                <q>{passage.english}</q>
              </p>
              <p className="source-line">
                <span className="source-label">Citation:</span> {passage.ref}
              </p>
              <p className="translation-note">
                {passage.englishVersionTitle} · {passage.englishLicense}
              </p>
              <p className="modern-app">{passage.whyRelevant}</p>
              <p className="torah-boundary">
                One possible application belongs to Torok’s curated teaching
                above — not to treating this verse as personal ruling or
                advice.
              </p>
              <a
                className="sefaria-link"
                href={passage.sefariaUrl}
                target="_blank"
                rel="noreferrer"
              >
                Read in context on Sefaria
              </a>
              {(passages?.length ?? 0) > 1 ? (
                <button
                  type="button"
                  className="btn-ghost explore-another"
                  onClick={() =>
                    setIndex((i) => ((i + 1) % (passages?.length ?? 1)))
                  }
                >
                  Explore another source
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
