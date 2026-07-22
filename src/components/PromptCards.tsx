"use client";

interface PromptCardsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function PromptCards({ prompts, onSelect, disabled }: PromptCardsProps) {
  return (
    <div className="prompt-grid" role="group" aria-label="Suggested situations">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          className="prompt-card"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
