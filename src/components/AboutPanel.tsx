"use client";

import { useId, useState } from "react";
import {
  BRAND_DESCRIPTOR,
  BRAND_NAME,
  BRAND_TAGLINE,
  SHORT_DISCLAIMER,
} from "@/lib/wisdom/types";

interface AboutPanelProps {
  triggerLabel?: string;
}

export function AboutPanel({
  triggerLabel = `What is ${BRAND_NAME}?`,
}: AboutPanelProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="about-panel">
      <button
        type="button"
        className="about-toggle footer-sources-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {triggerLabel}
      </button>

      {open ? (
        <div
          id={panelId}
          className="about-body"
          role="region"
          aria-label={`About ${BRAND_NAME}`}
        >
          <p>
            <strong>{BRAND_NAME}</strong> — {BRAND_DESCRIPTOR}. {BRAND_TAGLINE}
          </p>
          <p>
            You describe what’s on your mind, and Torok offers an accessible
            Jewish teaching with one practical reflection.
          </p>
          <p>
            Torok searches a local index of the complete Five Books of Moses and
            a curated library of classical teachings (including Prophets,
            Writings, Pirkei Avot, and later works). Related Torah passages come
            from Genesis through Deuteronomy. Retrieval matches themes and
            related language — not a claim that Torok understands the whole
            Torah. Torok offers one possible lens for learning, not a religious
            ruling.
          </p>
          <p>
            Torok uses Sefaria’s library and textual connections as its source
            foundation, with Torok’s own retrieval and response system. It does
            not use a proprietary Sefaria chatbot model. Public-domain and
            CC-BY texts are courtesy of editions available via Sefaria — Sefaria
            did not develop or endorse Torok.
          </p>
          <p>
            Distinctions matter: <strong>Torah</strong> here means Genesis
            through Deuteronomy; <strong>Tanakh</strong> also includes the
            Prophets and Writings; selected Mishnah, ethics, and later works are
            further layers. About 100 curated teachings remain as editorial
            examples and fallbacks; they no longer define the limits of Torok’s
            searchable knowledge.
          </p>
          <p>
            Curated entries store verified Hebrew or Aramaic source text with
            edition and license metadata where available. English Tanakh
            quotations use the public-domain JPS 1917 edition. Selected Mishnah
            English uses CC-BY editions (for example Mishnah Yomit by Dr. Joshua
            Kulp) with required attribution.
          </p>
          <p>
            For questions of Jewish law or personal religious practice, speak
            with a trusted rabbi. For crisis, medical, legal, or safety
            concerns, seek qualified professional or emergency help.
          </p>
          <p>
            Some teachings are awaiting review by a qualified rabbi or Jewish
            educator. Draft entries may appear only when they pass automated
            integrity checks. Torok never claims educator or rabbinic review
            until a qualified reviewer has signed off.
          </p>
          <p>{SHORT_DISCLAIMER}</p>
        </div>
      ) : null}
    </div>
  );
}
