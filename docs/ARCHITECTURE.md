# Torok architecture — retrieval-grounded wisdom engine

## Positioning

Torok uses licensed Jewish texts and structured source data obtained through
Sefaria, with Torok’s own retrieval, verification, ranking, and presentation
system. Torok does not claim a proprietary Sefaria AI model.

## Runtime path

```
Client (TorokExperience)
  → POST /api/wisdom
    → assessSafety (hard stop before retrieval)
    → expandQueryConcepts
    → retrieveSources (BM25-ish + authoritative topics + intent + passage kind)
    → verifyHit
    → rerankHits
    → assessRetrievalConfidence
    → single | multi | abstain response
    → optional grounded LLM (connective language only)
  → WisdomCard (Hebrew/Aramaic first)
```

## Topic relationship provenance

Every `TopicRelationship` records:

| source | meaning |
| --- | --- |
| `sefaria-topic-link` | Explicit Sefaria topic→ref link |
| `sefaria-related` | Related-endpoint topic attachment |
| `curated` | Torok teaching-signal / known-ref seed |
| `title-metadata` | Book/work slug only |
| `lexical-inference` | Restricted multi-signal text match (never “verified Sefaria”) |

Authoritative + curated relationships outrank lexical inference in scoring.
Lexical links are stored separately and must not be advertised as verified.

## Scoring formula (developer inspection only)

```
score =
  BM25-ish English token overlap
+ exact 3-word phrase hits
+ primary/secondary concept matches
    (auth topic ≫ curated keyword ≫ lexical topic ≫ multiword synonym in text)
+ intent × source-family / wisdom-book fit
+ passage-kind fit (prescriptive preferred for advice queries)
+ classic-ref boosts (e.g. Ecclesiastes 12:13, Micah 6:8)
− narrative anger/violence / incidental “life” / capital-procedure / priestly-mourning penalties
+ display readiness (has Hebrew + English)
```

Each hit includes a `reasons[]` array for DEV debugging. Production UI never
shows scores, reasons, or engine terminology.

## Semantic layer (default / no-key)

Default mode uses BM25-ish lexical ranking + curated concept seeds +
authoritative Sefaria topic links. No paid embedding API is required.
Optional LLM connective language remains key-gated and never supplies quotations.

## Release gate

Deploy only when automated P@1 ≥ 75%, appropriate-in-top-5 ≥ 85%, citation and
safety remain perfect, and the gold set shows no severe religious-context errors.
