"use client";

import type { CharacterState } from "@/lib/wisdom";
import { useEffect, useRef, useState, type CSSProperties } from "react";

interface TorokCharacterProps {
  state?: CharacterState;
  className?: string;
  warmth?: number; // 0–1, increases as user types
}

export function TorokCharacter({
  state = "idle",
  className = "",
  warmth = 0,
}: TorokCharacterProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    function onMove(event: PointerEvent) {
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (event.clientX - cx) / rect.width;
      const dy = (event.clientY - cy) / rect.height;
      // Subtle limited range
      setGaze({
        x: Math.max(-1, Math.min(1, dx)) * 2.2,
        y: Math.max(-1, Math.min(1, dy)) * 1.6,
      });
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion]);

  const glowStrength = 0.45 + warmth * 0.45;

  return (
    <div
      ref={stageRef}
      className={`torok-stage ${className}`}
      data-state={state}
      style={
        {
          "--gaze-x": `${gaze.x}px`,
          "--gaze-y": `${gaze.y}px`,
          "--glow-strength": String(glowStrength),
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <div className="torok-desk-glow" />
      <svg
        className="torok-svg"
        viewBox="0 0 200 230"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="shadeGlow" cx="50%" cy="42%" r="55%">
            <stop offset="0%" stopColor="#fff6d8" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#f0c96a" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f0c96a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="shadeBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe7b0" />
            <stop offset="45%" stopColor="#f3d18a" />
            <stop offset="100%" stopColor="#d9a84f" />
          </linearGradient>
          <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a6848" />
            <stop offset="100%" stopColor="#5c422e" />
          </linearGradient>
          <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Cast shadow */}
        <ellipse
          className="torok-cast-shadow"
          cx="100"
          cy="208"
          rx="48"
          ry="9"
        />

        {/* Internal glow bloom */}
        <ellipse
          className="torok-bloom"
          cx="100"
          cy="108"
          rx="62"
          ry="48"
          fill="url(#shadeGlow)"
          filter="url(#softBlur)"
        />

        {/* Base / foot */}
        <path
          d="M68 178 C68 160, 132 160, 132 178 L126 194 C126 202, 74 202, 74 194 Z"
          fill="url(#baseGrad)"
        />
        <ellipse cx="100" cy="178" rx="28" ry="6" fill="#a07a52" opacity="0.45" />

        {/* Stem */}
        <rect x="93" y="128" width="14" height="52" rx="7" fill="#7d5b3d" />
        <rect x="96" y="130" width="4" height="46" rx="2" fill="#c4a07a" opacity="0.35" />

        <g className="torok-head">
          {/* Lamp shade / head */}
          <path
            d="M40 122 C40 72, 160 72, 160 122 C160 144, 132 154, 100 154 C68 154, 40 144, 40 122 Z"
            fill="url(#shadeBody)"
            stroke="#c99545"
            strokeWidth="2"
          />
          {/* Highlight */}
          <path
            d="M58 100 C70 82, 110 78, 128 96"
            fill="none"
            stroke="#fff8e4"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.55"
          />
          {/* Rim */}
          <path
            d="M48 118 C55 108, 145 108, 152 118"
            fill="none"
            stroke="#b8893a"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Inner warm chamber */}
          <ellipse cx="100" cy="120" rx="36" ry="20" fill="#fff4d0" opacity="0.75" />

          {/* Eyes */}
          <g className="torok-eyes" style={{ transform: `translate(var(--gaze-x), var(--gaze-y))` }}>
            <g className="torok-eye-left">
              <ellipse cx="82" cy="114" rx="11" ry="12" fill="#fffaf2" />
              <circle className="torok-pupil" cx="83" cy="115" r="4.8" fill="#1c2a44" />
              <circle cx="85.5" cy="112" r="1.7" fill="#fff" />
            </g>
            <g className="torok-eye-right">
              <ellipse cx="118" cy="114" rx="11" ry="12" fill="#fffaf2" />
              <circle className="torok-pupil" cx="119" cy="115" r="4.8" fill="#1c2a44" />
              <circle cx="121.5" cy="112" r="1.7" fill="#fff" />
            </g>
          </g>

          {/* Lids for blink (CSS animated) */}
          <g className="torok-lids">
            <ellipse cx="82" cy="102" rx="12" ry="4" fill="#f3d18a" className="torok-lid" />
            <ellipse cx="118" cy="102" rx="12" ry="4" fill="#f3d18a" className="torok-lid" />
          </g>

          {/* Brows */}
          <path
            className="torok-brow"
            d="M70 98 Q82 92 93 97"
            fill="none"
            stroke="#1c2a44"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            className="torok-brow"
            d="M107 97 Q118 92 130 98"
            fill="none"
            stroke="#1c2a44"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Smile */}
          <path
            className="torok-smile"
            d="M88 130 Q100 138 112 130"
            fill="none"
            stroke="#1c2a44"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </g>

        {/* Bookmark / small page detail */}
        <g className="torok-page">
          <path
            d="M150 98 C162 90, 172 102, 160 112 C172 110, 170 126, 156 124 L150 98 Z"
            fill="#fff8ea"
            stroke="#c9a45d"
            strokeWidth="1.5"
          />
          <path
            d="M154 104 L162 112"
            stroke="#d7b56a"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
