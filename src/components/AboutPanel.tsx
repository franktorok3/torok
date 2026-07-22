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
        <div
          id={panelId}
          className="about-body"
          role="region"
          aria-label="About Torok"
        >
          <p>
            Torok is a warm companion for everyday moments. You describe what’s
            on your mind, and Torok offers an accessible Jewish teaching with
            one practical reflection.
          </p>
          <p>
            Torok can search the complete Five Books of Moses and a growing
            curated collection of classical teachings. Search coverage does not
            mean every result has been interpreted or reviewed. Torok offers one
            possible lens for learning, not a religious ruling.
          </p>
          <p>
            Distinctions matter: <strong>Torah</strong> here means Genesis
            through Deuteronomy; <strong>Tanakh</strong> also includes the
            Prophets and Writings; rabbinic literature and later commentary are
            a further layer. Torok’s first corpus covers the complete Torah plus
            selected classical sources.
          </p>
          <p>
            English Torah quotations use a public-domain edition imported from
            Sefaria. Powered by Sefaria — Sefaria did not develop or endorse
            Torok.
          </p>
          <p>
            For questions of Jewish law or personal religious practice, speak
            with a trusted rabbi. For crisis, medical, legal, or safety
            concerns, seek qualified professional or emergency help.
          </p>
          <p>
            Editorial content is awaiting review by a qualified rabbi or Jewish
            educator and should not be treated as editorially certified. Draft
            entries are marked as drafts.
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
