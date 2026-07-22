"use client";

import { useId, useState } from "react";

export function AboutPanel() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="about-panel">
      <button
        type="button"
        className="about-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        What is Torok?
      </button>

      {open ? (
        <div id={panelId} className="about-body" role="region" aria-label="About Torok">
          <p>
            Torok is a warm companion for everyday moments. You describe what is
            happening, and Torok offers an accessible Jewish teaching with one
            practical reflection.
          </p>
          <p>
            Responses come from a curated local library of classical sources —
            carefully paraphrased and cited. Torok is not a generative AI
            chatbot by default, not a rabbi, not a posek, and not a therapist.
          </p>
          <p>
            Jewish tradition contains many voices. Each teaching is one useful
            lens, not the only Jewish position. For questions of Jewish law or
            personal religious practice, speak with a trusted rabbi. For crisis,
            medical, legal, or safety concerns, seek qualified professional or
            emergency help.
          </p>
          <p>
            Torok offers Jewish learning and reflection, not rabbinic rulings,
            pastoral counseling, or professional advice.
          </p>
        </div>
      ) : null}
    </div>
  );
}
