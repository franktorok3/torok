"use client";

import { AboutPanel } from "@/components/AboutPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TorokCharacter } from "@/components/TorokCharacter";
import { WisdomCard } from "@/components/WisdomCard";
import { formatResponseForClipboard } from "@/lib/wisdom/clipboard";
import { validateWisdomResponse } from "@/lib/wisdom/validate-response";
import {
  BRAND_DESCRIPTOR,
  BRAND_NAME,
  BRAND_TAGLINE,
  FRIENDLY_ERROR,
  SHORT_DISCLAIMER,
  type CharacterState,
  type WisdomResponse,
} from "@/lib/wisdom/types";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

type ViewState =
  | "welcome"
  | "listening"
  | "thinking"
  | "answer"
  | "sensitive"
  | "error";

const ALL_PRESETS = [
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

const REQUEST_TIMEOUT_MS = 15000;

function rotatePresets(seed: number): string[] {
  const offset = seed % ALL_PRESETS.length;
  return [...ALL_PRESETS.slice(offset), ...ALL_PRESETS.slice(0, offset)];
}

export function TorokExperience() {
  const [situation, setSituation] = useState("");
  const [response, setResponse] = useState<WisdomResponse | null>(null);
  const [view, setView] = useState<ViewState>("welcome");
  const [characterState, setCharacterState] =
    useState<CharacterState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [thinkingLine, setThinkingLine] = useState(THINKING_LINES[0]);
  const [showMoreIdeas, setShowMoreIdeas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lensQueue, setLensQueue] = useState<string[]>([]);
  const [usedLenses, setUsedLenses] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const daySeed = useMemo(() => {
    const d = new Date();
    return d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate();
  }, []);

  const presets = useMemo(() => rotatePresets(daySeed), [daySeed]);
  const visibleChips = showMoreIdeas ? presets : presets.slice(0, 3);
  const warmth = Math.min(1, situation.trim().length / 80);
  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    if (view !== "thinking") return;
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % THINKING_LINES.length;
      setThinkingLine(THINKING_LINES[i]);
    }, 900);
    return () => window.clearInterval(id);
  }, [view]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lens = params.get("lens");
    if (!lens) return;

    let cancelled = false;
    void (async () => {
      setView("thinking");
      setCharacterState("thinking");
      try {
        const data = await fetchWisdom({ teachingId: lens }, 0);
        if (cancelled || !data) {
          if (!cancelled) {
            setView("welcome");
            setCharacterState("idle");
          }
          return;
        }
        await revealAnswer(data);
      } catch {
        if (!cancelled) {
          setView("welcome");
          setCharacterState("idle");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function fetchWisdom(
    body: { situation?: string; teachingId?: string },
    requestId: number,
  ): Promise<WisdomResponse | null> {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    try {
      const res = await fetch("/api/wisdom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (requestId !== requestIdRef.current) return null;
      if (!res.ok) throw new Error("request failed");
      const json: unknown = await res.json();
      if (requestId !== requestIdRef.current) return null;
      const data = validateWisdomResponse(json);
      if (!data) throw new Error("malformed");
      return data;
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function requestWisdom(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Share a thought first — even a few words.");
      setView("error");
      setCharacterState("idle");
      return;
    }
    if (submitting) return;

    const requestId = ++requestIdRef.current;
    setSubmitting(true);
    setError(null);
    setCopied(false);
    setLensQueue([]);
    setUsedLenses([]);
    setView("thinking");
    setCharacterState("thinking");
    setResponse(null);

    try {
      const data = await fetchWisdom({ situation: trimmed }, requestId);
      if (!data || requestId !== requestIdRef.current) return;
      const queue = data.alternateTeachingIds ?? [];
      setLensQueue(queue);
      const used = data.teaching?.id ? [data.teaching.id] : [];
      setUsedLenses(used);
      await revealAnswer({ ...data, alternateTeachingIds: queue });

      if (data.teaching?.id) {
        const url = new URL(window.location.href);
        url.searchParams.set("lens", data.teaching.id);
        window.history.replaceState({}, "", url.toString());
      }
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError(FRIENDLY_ERROR);
      setView("error");
      setCharacterState("idle");
    } finally {
      if (requestId === requestIdRef.current) setSubmitting(false);
    }
  }

  async function requestByTeachingId(id: string) {
    if (submitting) return;
    const requestId = ++requestIdRef.current;
    setSubmitting(true);
    setView("thinking");
    setCharacterState("thinking");
    try {
      const data = await fetchWisdom({ teachingId: id }, requestId);
      if (!data || requestId !== requestIdRef.current) return;
      setUsedLenses((prev) =>
        prev.includes(id) ? prev : [...prev, id],
      );
      await revealAnswer({
        ...data,
        alternateTeachingIds: lensQueue,
      });
      const url = new URL(window.location.href);
      url.searchParams.set("lens", id);
      window.history.replaceState({}, "", url.toString());
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError(FRIENDLY_ERROR);
      setView("error");
      setCharacterState("idle");
    } finally {
      if (requestId === requestIdRef.current) setSubmitting(false);
    }
  }

  async function revealAnswer(data: WisdomResponse) {
    setCharacterState(data.mode === "safety" ? "sensitive" : "revealing");
    setResponse(data);
    setView(data.mode === "safety" ? "sensitive" : "answer");
    window.setTimeout(() => {
      if (data.mode !== "safety") setCharacterState("success");
    }, 700);
    window.setTimeout(() => answerRef.current?.focus(), 60);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void requestWisdom(situation);
  }

  function handleChip(prompt: string) {
    if (submitting) return;
    setSituation(prompt);
    setCharacterState("listening");
    setView("listening");
    void requestWisdom(prompt);
  }

  async function handleCopy() {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(formatResponseForClipboard(response));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(FRIENDLY_ERROR);
      setView("error");
    }
  }

  async function handleShare() {
    if (!response?.teaching?.id || !navigator.share) return;
    const url = new URL(window.location.href);
    url.searchParams.set("lens", response.teaching.id);
    try {
      await navigator.share({
        title: `${BRAND_NAME} — ${BRAND_DESCRIPTOR}`,
        text: "A Torah teaching for this moment.",
        url: url.toString(),
      });
    } catch {
      // User cancelled share — ignore
    }
  }

  function handleAskAnother() {
    requestIdRef.current += 1;
    abortRef.current?.abort();
    setSubmitting(false);
    setResponse(null);
    setError(null);
    setCopied(false);
    setLensQueue([]);
    setUsedLenses([]);
    setShowMoreIdeas(false);
    setView(situation.trim() ? "listening" : "welcome");
    setCharacterState(situation.trim() ? "listening" : "idle");
    const url = new URL(window.location.href);
    url.searchParams.delete("lens");
    window.history.replaceState({}, "", url.pathname);
    window.setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function handleAnotherLens() {
    if (submitting) return;
    const used = new Set(usedLenses);
    const ids = lensQueue.filter((id) => !used.has(id));
    if (!ids.length) {
      setError("Torok has shared the strongest other lenses for now.");
      return;
    }
    const next = ids[0];
    void requestByTeachingId(next);
  }

  const showComposer =
    view === "welcome" || view === "listening" || view === "error";
  const showAnswer = view === "answer" || view === "sensitive";
  const usedSet = useMemo(() => new Set(usedLenses), [usedLenses]);
  const remainingLenses = lensQueue.filter((id) => !usedSet.has(id)).length;

  return (
    <div className="page-shell page-compact">
      <div className="paper-texture" aria-hidden="true" />

      <header className="toy-header">
        <div className="brand-lockup">
          <h1 className="wordmark wordmark-compact">{BRAND_NAME}</h1>
          <p className="brand-descriptor">{BRAND_DESCRIPTOR}</p>
        </div>
        <TorokCharacter
          state={characterState}
          warmth={warmth}
          className="toy-character"
        />
        <p className="brand-tagline">{BRAND_TAGLINE}</p>
      </header>

      <main className="toy-main">
        {showComposer ? (
          <section className="welcome-panel" aria-labelledby="mind-heading">
            <div className="welcome-intro">
              <h2 id="mind-heading" className="prompt-heading">
                What’s on your mind?
              </h2>
              <p className="prompt-support">
                Share a moment. Torok will offer a Jewish teaching and one
                practical reflection.
              </p>
            </div>

            <form className="compose-form" onSubmit={handleSubmit}>
              <label htmlFor="situation" className="sr-only">
                What’s on your mind?
              </label>
              <textarea
                id="situation"
                ref={textareaRef}
                className="situation-input situation-input-lg"
                rows={3}
                maxLength={2000}
                placeholder="A hard conversation, a mistake, gratitude, uncertainty…"
                value={situation}
                disabled={submitting}
                onChange={(e) => {
                  const value = e.target.value;
                  setSituation(value);
                  setError(null);
                  if (value.trim()) {
                    setView("listening");
                    setCharacterState("listening");
                  } else {
                    setView("welcome");
                    setCharacterState("idle");
                  }
                }}
                onFocus={() => {
                  setCharacterState("listening");
                  if (situation.trim()) setView("listening");
                }}
              />
              <button
                type="submit"
                className="btn-primary btn-lamp"
                disabled={submitting}
              >
                Find a teaching
              </button>
            </form>

            <div className="chip-block">
              <p className="chip-label">Not sure where to begin?</p>
              <div className="chip-row" role="group" aria-label="Suggestions">
                {visibleChips.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="chip"
                    disabled={submitting}
                    onClick={() => handleChip(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              {!showMoreIdeas ? (
                <button
                  type="button"
                  className="more-ideas"
                  onClick={() => setShowMoreIdeas(true)}
                >
                  More ideas
                </button>
              ) : null}
            </div>

            {error ? (
              <p className="error-banner" role="alert">
                {error}
              </p>
            ) : null}
          </section>
        ) : null}

        {view === "thinking" ? (
          <div className="thinking-state" role="status" aria-live="polite">
            <p className="thinking-line">{thinkingLine}</p>
          </div>
        ) : null}

        {showAnswer && response ? (
          <div ref={answerRef} tabIndex={-1} className="response-focus">
            <ErrorBoundary
              onRetry={handleAskAnother}
              fallbackTitle="Torok lost the page for a moment."
            >
              <WisdomCard
                response={response}
                onAskAnother={handleAskAnother}
                onCopy={() => void handleCopy()}
                onAnotherLens={handleAnotherLens}
                onShare={() => void handleShare()}
                copied={copied}
                hasAnotherLens={remainingLenses > 0}
                canShare={canShare && Boolean(response.teaching?.id)}
              />
            </ErrorBoundary>
          </div>
        ) : null}
      </main>

      <footer className="site-footer site-footer-compact">
        <p className="footer-disclaimer">{SHORT_DISCLAIMER}</p>
        <AboutPanel
          triggerLabel="Torah texts from public-domain editions. Sources and limitations."
        />
      </footer>
    </div>
  );
}
