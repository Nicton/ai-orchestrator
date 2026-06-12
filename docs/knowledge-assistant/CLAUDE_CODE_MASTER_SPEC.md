# Searchify Master Specification for Claude Code

## Purpose

This document consolidates the product requirements, architecture decisions, UX constraints, and correction requests already captured in conversation. It is intended to be handed to Claude Code as the single working specification for the next clean implementation pass.

## Product goal

Build `Searchify`: a product knowledge assistant that answers employee and client questions using company documentation, structured knowledge, and later graph relationships.

The system must:

- answer with grounded evidence;
- work with text and voice input;
- reply in the client's language;
- minimize hallucinations;
- expose confidence honestly;
- evolve from document retrieval into a structured operational knowledge system.

## Current problem statement

The current MVP produces irrelevant or incorrect answers even when the needed documentation exists. The most visible observed reasons are:

1. Important documentation exists in `knowledge-base`, but the retrieval pipeline did not index it.
2. Ranking is too lexical and weak, so noisy files can outrank authoritative documents.
3. Confidence is overstated and should not be treated as true epistemic certainty.
4. Fallback behavior is too visible and feels like a mock answer instead of a reliable grounded response.

## Mandatory product requirements

### 1. Answer quality and grounding

- Every answer must be grounded in indexed evidence.
- The assistant must not invent product entities, flows, integrations, APIs, or permissions that are not supported by sources.
- The answer must show source references.
- If evidence is partial, outdated, or conflicting, the answer must say so explicitly.
- If the system lacks enough evidence, it must return an honest low-confidence answer instead of hallucinating.

### 2. Confidence and anti-hallucination

- Every answer must include a visible `confidence indicator`.
- Confidence must reflect actual retrieval quality and evidence quality, not a fake optimism score.
- If the topic is not covered in the KB or not indexed, the system must state:
  - data is insufficient;
  - confidence is low;
  - the answer may be incomplete.
- Honest uncertainty is preferred over a confident wrong answer.

### 3. Input modalities

- Users must be able to ask questions via text.
- Users must be able to ask questions via voice.
- Voice input must support manual `start` and manual `stop`.
- The system must not auto-stop recording too early.

### 4. Voice recognition architecture

- Use `Whisper` as the primary STT engine.
- Do not rely on browser Web Speech as the main path for production quality.
- Primary priority is transcription quality, not instant local-browser convenience.

### 5. Voice UX flow

Target flow:

1. User presses record.
2. User speaks the full question.
3. User presses stop.
4. The UI shows a processing loader/state.
5. The server transcribes the audio.
6. The transcript is inserted into the text input.
7. The user can edit the text.
8. The user presses send.

Additional UI requirements:

- show a clear recording state;
- show a clear transcription-in-progress state;
- show the resulting transcript in a full-sized input area;
- the prompt field must be full-width and/or auto-expand so the full text remains visible.

### 6. Model requirement

- `Fable 5` must be used as the target answer-generation model when this product path requires a dedicated answer model.

### 7. Language strategy

- The final answer must always be returned in the client's language.
- The system must detect or infer the client language when possible.
- Internal documentation may temporarily remain mostly Russian.
- Long-term canonical knowledge should move toward English for token efficiency and normalization.

Phased language strategy:

- now: documentation and KB may continue evolving in Russian;
- later: the stabilized canonical KB should be normalized in English;
- always: user-facing answers must be in the language of the client.

### 8. Knowledge correction workflow

Users must be able to correct wrong answers.

Required behavior:

- a correction may be submitted by text;
- a correction may be submitted by voice;
- the system must capture:
  - what was wrong;
  - what the corrected knowledge is;
  - which answer or topic is being corrected.

This must not remain only in logs. It must feed a `knowledge update workflow` so that later answers use the corrected truth.

### 9. Knowledge storage architecture

The long-term system must not rely only on Markdown or Confluence files.

Required architecture direction:

- source materials may start in Markdown and Confluence;
- the operational knowledge layer should live in a database;
- the system must support controlled updates, analytics, corrections, and structured relationships.

### 10. Graph-oriented future architecture

The system should evolve toward a graph-ready model where entities and relationships are first-class.

Examples:

- feature -> module
- requirement -> process
- process -> API
- entity -> document
- issue -> correction -> source

### 11. Graph visualization

The product must later include a separate `graph view` page.

The graph page should show:

- what entities exist;
- what is linked to what;
- where a concept is used;
- what dependencies exist between objects.

### 12. Traceability and coverage

The product must support traceability across:

- requirements
- documentation
- test cases
- modules
- APIs
- related entities and processes

This should make it possible to see:

- what is covered;
- what evidence supports a statement;
- what is missing;
- where the gaps are.

## Retrieval and ranking requirements

### Immediate requirements for the current codebase

- Index `knowledge-base` as a first-class source.
- Keep `docs`, `product`, and `workspaces/documentation` indexed.
- Add explicit source priority so authoritative KB files outrank weak or draft materials.
- Deprioritize noisy files such as `OPEN-QUESTIONS`, TODOs, and drafts when producing answer evidence.
- Keep the fallback path, but make it clearly honest and evidence-oriented.

### Near-term improvements

- chunk-based retrieval instead of whole-file scoring;
- semantic retrieval or embeddings;
- hybrid lexical + semantic ranking;
- source freshness and approval metadata;
- retrieval explanations for debugging.

## Functional requirements

The system should support:

1. Text question answering.
2. Voice question answering.
3. Grounded answers with source links.
4. Query logging.
5. Query analytics.
6. Knowledge-gap detection.
7. Correction submission and review.
8. Multilingual response generation.
9. Confidence display.
10. Later graph navigation and traceability view.

## Analytics and observability

For every query, store at minimum:

- question text;
- normalized question;
- answer text;
- answer mode;
- detected intent;
- confidence;
- latency;
- source count;
- cited sources;
- user/channel metadata when available.

Analytics should include:

- top questions;
- top intents;
- most-used sources;
- recurring low-confidence topics;
- knowledge gaps;
- correction volume and correction impact later.

## UX expectations

- Responses should feel grounded, not generic.
- The answer area should be readable and not cramped.
- Voice recording must be explicit and user-controlled.
- Transcription progress must be visible.
- Confidence must be visible.
- Sources must be visible.
- The answer must not pretend certainty when evidence is weak.

## Clean-code implementation expectations for Claude Code

- Refactor retrieval logic into explicit ranking rules instead of hidden heuristics.
- Keep code modular and readable.
- Separate source configuration, scoring, answer composition, and analytics concerns where practical.
- Avoid broad speculative refactors unrelated to current product value.
- Preserve backward compatibility for current MVP routes when possible.

## Suggested implementation phases

### Phase 1. Retrieval cleanup

- index `knowledge-base`;
- add source priority rules;
- reduce noisy evidence;
- make confidence more honest;
- improve fallback behavior.

### Phase 2. Voice quality path

- wire Whisper-based upload/transcription;
- add manual start/stop recording UX;
- add processing state and transcript insertion;
- allow transcript editing before send.

### Phase 3. Multilingual and correction loop

- robust answer-language selection;
- correction submission path by text and voice;
- review/apply workflow for KB updates;
- correction-aware analytics.

### Phase 4. Operational knowledge layer

- move from file-only retrieval to DB-backed operational storage;
- introduce entity extraction and relationship persistence;
- support metadata such as status, owner, freshness, and approval.

### Phase 5. Graph and traceability

- graph-backed entity navigation;
- graph visualization page;
- requirement -> docs -> test coverage view;
- gap surfacing and impact tracing.

## Definition of done for the next clean pass

The next clean pass is successful when:

1. The retrieval pipeline indexes the authoritative KB.
2. Answers are noticeably more relevant for documented topics such as roles and permissions.
3. Weak files no longer dominate answer evidence.
4. Confidence is lower and more honest when evidence is weak.
5. The repo contains this consolidated specification for future implementation work.

