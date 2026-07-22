"use client";

import { AboutPanel } from "@/components/AboutPanel";
import { ResponseCard } from "@/components/ResponseCard";
import { TorokCharacter } from "@/components/TorokCharacter";
import {
  formatResponseForClipboard,
  SHORT_DISCLAIMER,
  type CharacterState,
  type WisdomResponse,
} from "@/lib/wisdom";
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
  const [altIndex, setAltIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  const daySeed = useMemo(() => {
    const d = new Date();
    return d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate();
  }, []);

  const presets = useMemo(() => rotatePresets(daySeed), [daySeed]);
  const visibleChips = showMoreIdeas ? presets : presets.slice(0, 3);
  const warmth = Math.min(1, situation.trim().length / 80);

  useEffect(() => {
    if (view !== "thinking") return;
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % THINKING_LINES.length;
      setThinkingLine(THINKING_LINES[i]);
    }, 900);
    return () => window.clearInterval(id);
  }, [view]);

  // Shareable lens URL without storing private user text
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lens = params.get("lens");
    if (!lens) return;

    let cancelled = false;
    (async () => {
      setView("thinking");
      setCharacterState("thinking");
      try {
        const res = await fetch("/api/wisdom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teachingId: lens }),
        });
        if (!res.ok) throw new Error("missing");
        const data = (await res.json()) as WisdomResponse;
        if (cancelled) return;
        setCharacterState(data.mode === "safety" ? "sensitive" : "revealing");
        setResponse(data);
        setView(data.mode === "safety" ? "sensitive" : "answer");
        window.setTimeout(() => {
          if (data.mode !== "safety") setCharacterState("success");
        }, 700);
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

  async function requestWisdom(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Share a thought first — even a few words.");
      setView("error");
      setCharacterState("idle");
      return;
    }

    setError(null);
    setCopied(false);
    setAltIndex(0);
    setView("thinking");
    setCharacterState("thinking");
    setResponse(null);

    try {
      const res = await fetch("/api/wisdom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation: trimmed }),
      });

      if (!res.ok) throw new Error("request failed");

      const data = (await res.json()) as WisdomResponse;
      await revealAnswer(data);

      if (data.teaching?.id) {
        const url = new URL(window.location.href);
        url.searchParams.set("lens", data.teaching.id);
        window.history.replaceState({}, "", url.toString());
      }
    } catch {
      setError("Something went gently wrong. Please try again.");
      setView("error");
      setCharacterState("idle");
    }
  }

  async function requestByTeachingId(id: string) {
    setView("thinking");
    setCharacterState("thinking");
    try {
      const res = await fetch("/api/wisdom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teachingId: id }),
      });
      if (!res.ok) throw new Error("missing");
      const data = (await res.json()) as WisdomResponse;
      await revealAnswer(data);
    } catch {
      setView("welcome");
      setCharacterState("idle");
    }
  }

  async function revealAnswer(data: WisdomResponse) {
    setCharacterState(
      data.mode === "safety" ? "sensitive" : "revealing",
    );
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
      setError("Copying wasn’t available in this browser.");
      setView("error");
    }
  }

  function handleAskAnother() {
    setResponse(null);
    setError(null);
    setCopied(false);
    setAltIndex(0);
    setShowMoreIdeas(false);
    setView(situation.trim() ? "listening" : "welcome");
    setCharacterState(situation.trim() ? "listening" : "idle");
    const url = new URL(window.location.href);
    url.searchParams.delete("lens");
    window.history.replaceState({}, "", url.pathname);
    window.setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function handleAnotherLens() {
    if (!response?.alternateTeachingIds?.length) return;
    const ids = response.alternateTeachingIds;
    const next = ids[altIndex % ids.length];
    setAltIndex((i) => i + 1);
    void requestByTeachingId(next);
  }

  const showComposer = view === "welcome" || view === "listening" || view === "error";
  const showAnswer = view === "answer" || view === "sensitive";

  return (
    <div className="page-shell page-compact">
      <div className="paper-texture" aria-hidden="true" />

      <header className="toy-header">
        <h1 className="wordmark wordmark-compact">Torok</h1>
        <TorokCharacter
          state={characterState}
          warmth={warmth}
          className="toy-character"
        />
      </header>

      <main className="toy-main">
        {showComposer ? (
          <section className="welcome-panel" aria-labelledby="mind-heading">
            <h2 id="mind-heading" className="prompt-heading">
              What’s on your mind?
            </h2>
            <p className="prompt-support">
              Share a moment. Torok will offer a Jewish teaching and one
              practical reflection.
            </p>

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
              <button type="submit" className="btn-primary btn-lamp">
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
            <ResponseCard
              response={response}
              onAskAnother={handleAskAnother}
              onCopy={() => void handleCopy()}
              onAnotherLens={handleAnotherLens}
              copied={copied}
              hasAnotherLens={Boolean(response.alternateTeachingIds?.length)}
            />
          </div>
        ) : null}
      </main>

      <footer className="site-footer site-footer-compact">
        <p className="footer-disclaimer">{SHORT_DISCLAIMER}</p>
        <AboutPanel />
      </footer>
    </div>
  );
}
