"use client";

import type { WisdomResponse } from "@/lib/wisdom";
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
