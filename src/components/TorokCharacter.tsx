"use client";

import type { CharacterState } from "@/lib/wisdom";

interface TorokCharacterProps {
  state?: CharacterState;
  className?: string;
}

export function TorokCharacter({
  state = "idle",
  className = "",
}: TorokCharacterProps) {
  return (
    <div
      className={`torok-stage ${className}`}
      data-state={state}
      aria-hidden="true"
    >
      <div className="torok-glow" />
      <svg
        className="torok-svg"
        viewBox="0 0 200 220"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Torok, a friendly reading-lamp companion</title>
        {/* Soft pedestal */}
        <ellipse cx="100" cy="198" rx="46" ry="10" className="torok-shadow" />

        {/* Lamp base */}
        <path
          d="M70 175 C70 155, 130 155, 130 175 L125 188 C125 196, 75 196, 75 188 Z"
          className="torok-base"
        />
        <rect
          x="92"
          y="118"
          width="16"
          height="48"
          rx="8"
          className="torok-stem"
        />

        {/* Bookish shade / head */}
        <g className="torok-head">
          <path
            d="M42 118 C42 70, 158 70, 158 118 C158 138, 130 148, 100 148 C70 148, 42 138, 42 118 Z"
            className="torok-shade"
          />
          <path
            d="M55 112 C60 88, 140 88, 145 112"
            className="torok-shade-rim"
            fill="none"
            strokeWidth="3"
          />

          {/* Soft inner glow */}
          <ellipse cx="100" cy="118" rx="34" ry="18" className="torok-inner" />

          {/* Eyes */}
          <g className="torok-eyes">
            <g className="torok-eye torok-eye-left">
              <ellipse cx="82" cy="112" rx="10" ry="11" className="torok-sclera" />
              <circle cx="83" cy="113" r="4.5" className="torok-pupil" />
              <circle cx="85" cy="110" r="1.6" className="torok-spark" />
            </g>
            <g className="torok-eye torok-eye-right">
              <ellipse cx="118" cy="112" rx="10" ry="11" className="torok-sclera" />
              <circle cx="119" cy="113" r="4.5" className="torok-pupil" />
              <circle cx="121" cy="110" r="1.6" className="torok-spark" />
            </g>
          </g>

          {/* Brows */}
          <path
            d="M70 96 Q82 90 92 95"
            className="torok-brow"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M108 95 Q118 90 130 96"
            className="torok-brow"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Gentle smile */}
          <path
            d="M88 128 Q100 136 112 128"
            className="torok-smile"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        {/* Tiny page flutter accent */}
        <g className="torok-page">
          <path
            d="M148 96 C160 90, 168 100, 158 110 C170 108, 168 124, 154 122 L148 96 Z"
            className="torok-page-fill"
          />
        </g>
      </svg>
      <span className="sr-only">Torok character is {state}</span>
    </div>
  );
}
