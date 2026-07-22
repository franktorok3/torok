"use client";

import type { WisdomResponse } from "@/lib/wisdom";

interface ResponseCardProps {
  response: WisdomResponse;
  onAskAnother: () => void;
  onCopy: () => void;
  copied: boolean;
}

export function ResponseCard({
  response,
  onAskAnother,
  onCopy,
  copied,
}: ResponseCardProps) {
  return (
    <article className="response-card" aria-live="polite">
      <header className="response-header">
        <p className="response-kicker">A reflection for this moment</p>
        <p className="engine-note">{response.engineNote}</p>
      </header>

      <section className="response-section">
        <h2>What I’m hearing</h2>
        <p>{response.hearing}</p>
      </section>

      {response.teaching ? (
        <section className="response-section">
          <h2>A Jewish teaching</h2>
          <p className="theme-chip">{response.teaching.themeLabel}</p>
          <p className="teaching-paraphrase">{response.teaching.paraphrase}</p>
          <p>{response.teaching.explanation}</p>
          <p className="source-line">
            <span className="source-label">Source:</span> {response.teaching.source}
          </p>
        </section>
      ) : null}

      <section className="response-section">
        <h2>For today</h2>
        <p>{response.forToday}</p>
      </section>

      {response.reflectionQuestion ? (
        <section className="response-section">
          <h2>A question to carry with you</h2>
          <p className="reflection">{response.reflectionQuestion}</p>
        </section>
      ) : null}

      <p className="response-disclaimer">{response.disclaimer}</p>

      <div className="response-actions">
        <button type="button" className="btn-secondary" onClick={onAskAnother}>
          Ask another question
        </button>
        <button type="button" className="btn-secondary" onClick={onCopy}>
          {copied ? "Copied" : "Copy response"}
        </button>
      </div>
    </article>
  );
}
