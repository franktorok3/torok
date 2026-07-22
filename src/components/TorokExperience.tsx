"use client";

import { AboutPanel } from "@/components/AboutPanel";
import { PromptCards } from "@/components/PromptCards";
import { ResponseCard } from "@/components/ResponseCard";
import { TorokCharacter } from "@/components/TorokCharacter";
import {
  formatResponseForClipboard,
  SHORT_DISCLAIMER,
  type CharacterState,
  type WisdomResponse,
} from "@/lib/wisdom";
import { useEffect, useRef, useState, type FormEvent } from "react";

const PRESETS = [
  "How should I handle a difficult conversation?",
  "I made a mistake. How can I repair things?",
  "Share a teaching about patience.",
  "What does Jewish wisdom say about leadership?",
  "Help me think about a decision.",
  "What is a Jewish perspective on using AI responsibly?",
];

const THINKING_LINES = [
  "Turning the pages…",
  "Listening for a fitting teaching…",
  "Gathering a gentle lens…",
];

export function TorokExperience() {
  const [situation, setSituation] = useState("");
  const [response, setResponse] = useState<WisdomResponse | null>(null);
  const [characterState, setCharacterState] = useState<CharacterState>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [thinkingLine, setThinkingLine] = useState(THINKING_LINES[0]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % THINKING_LINES.length;
      setThinkingLine(THINKING_LINES[i]);
    }, 900);
    return () => window.clearInterval(id);
  }, [loading]);

  async function requestWisdom(text: string) {
    const trimmed = text.trim();
    setError(null);
    setCopied(false);
    setLoading(true);
    setCharacterState("thinking");
    setResponse(null);

    try {
      const res = await fetch("/api/wisdom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation: trimmed }),
      });

      if (!res.ok) {
        throw new Error("Torok could not gather a teaching just now.");
      }

      const data = (await res.json()) as WisdomResponse;
      setCharacterState("answering");
      setResponse(data);
      window.setTimeout(() => setCharacterState("idle"), 1200);
      window.setTimeout(() => {
        responseRef.current?.focus();
      }, 50);
    } catch {
      setError("Something went gently wrong. Please try again.");
      setCharacterState("idle");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void requestWisdom(situation);
  }

  function handlePreset(prompt: string) {
    setSituation(prompt);
    setCharacterState("listening");
    void requestWisdom(prompt);
  }

  async function handleCopy() {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(formatResponseForClipboard(response));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copying wasn’t available in this browser.");
    }
  }

  function handleAskAnother() {
    setResponse(null);
    setError(null);
    setCopied(false);
    setCharacterState("listening");
    textareaRef.current?.focus();
  }

  return (
    <div className="page-shell">
      <div className="paper-texture" aria-hidden="true" />

      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A gentle companion</p>
          <h1 className="wordmark">Torok</h1>
          <p className="tagline">Ancient wisdom for the moment you’re in.</p>
          <p className="lede">
            Describe what’s happening — a hard conversation, a mistake,
            gratitude, uncertainty — and Torok will offer a Jewish teaching with
            one practical reflection.
          </p>
        </div>
        <TorokCharacter state={characterState} className="hero-character" />
      </header>

      <main className="main-panel">
        <section className="intro-block" aria-labelledby="try-heading">
          <h2 id="try-heading" className="section-title">
            Try a starting place
          </h2>
          <PromptCards
            prompts={PRESETS}
            onSelect={handlePreset}
            disabled={loading}
          />
        </section>

        <section className="compose-block" aria-labelledby="compose-heading">
          <h2 id="compose-heading" className="section-title">
            Or share your own situation
          </h2>
          <form className="compose-form" onSubmit={handleSubmit}>
            <label htmlFor="situation" className="sr-only">
              Describe your situation
            </label>
            <textarea
              id="situation"
              ref={textareaRef}
              className="situation-input"
              rows={4}
              maxLength={2000}
              placeholder="What’s unfolding for you right now?"
              value={situation}
              disabled={loading}
              onChange={(e) => {
                setSituation(e.target.value);
                setCharacterState(
                  e.target.value.trim() ? "listening" : "idle",
                );
              }}
              onFocus={() => setCharacterState("listening")}
            />
            <div className="compose-meta">
              <span className="char-count">{situation.length}/2000</span>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? "Finding wisdom…" : "Find some wisdom"}
              </button>
            </div>
          </form>
        </section>

        {loading ? (
          <div className="thinking-state" role="status" aria-live="polite">
            <TorokCharacter state="thinking" className="thinking-character" />
            <p>{thinkingLine}</p>
          </div>
        ) : null}

        {error ? (
          <p className="error-banner" role="alert">
            {error}
          </p>
        ) : null}

        {response ? (
          <div ref={responseRef} tabIndex={-1} className="response-focus">
            <ResponseCard
              response={response}
              onAskAnother={handleAskAnother}
              onCopy={() => void handleCopy()}
              copied={copied}
            />
          </div>
        ) : null}
      </main>

      <footer className="site-footer">
        <p className="footer-disclaimer">{SHORT_DISCLAIMER}</p>
        <AboutPanel />
      </footer>
    </div>
  );
}
