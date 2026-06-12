# Knowledge Assistant — Web UI

A Google-style web interface for the internal AI Knowledge Assistant, built on top of
the existing knowledge backend (`src/knowledge.ts`).

## Screens

1. **Login** (`/login`, also shown at `/` when signed out) — email + password sign-in.
2. **Search** (`/`) — minimalist, Google-like: large search bar, voice input, clean
   answer with source links (Confluence links are labelled), per-answer rating and a
   "Suggest a correction" button. Personal history lives behind a side drawer.
3. **Admin console** (`/admin`) — admin-only. Overview/analytics, full query history
   (who / when / question / answer / rating / feedback / corrections) and user management.
4. **Feedback modal** — opens automatically when a rating is below 4 (1–3); accepts
   typed or dictated (voice) feedback.
5. **Internal orchestrator dashboard** — the previous engineering dashboard moved to `/internal`.

## Roles & accounts

- Two roles: `user` and `admin`.
- Users are stored in Postgres (`AppUser`) with scrypt-hashed passwords.
- Sessions are cookie-based (`AppSession`, HttpOnly, 30-day TTL).
- A default admin is seeded on first startup (`ADMIN_EMAIL` / `ADMIN_NAME` /
  `ADMIN_PASSWORD`).
- **Admin rule is domain-agnostic:** any email containing the `ADMIN_EMAIL_MATCH`
  substring (default `asmalouski`) is treated as an admin — applied at seeding, at user
  creation, and auto-promoted at login. Set `ADMIN_EMAIL_MATCH` empty to disable.
- Admins create both regular users and other admins from the Admin → Users tab; the app
  returns a temporary password and an access link to forward to the new user. Creating a
  user with an `asmalouski` email yields an admin regardless of the selected role.

## Logging

Every question is stored (`KnowledgeQuery`) with the user, timestamp, answer, sources,
intent, confidence, input mode (text/voice) and rating. Feedback (`KnowledgeFeedback`)
and corrections (`KnowledgeCorrection`) are linked to the query and the user. Low ratings
with feedback also feed the `KnowledgeGap` table as documentation signals.

## Voice (server-side Whisper)

Voice input (question, feedback, and correction) uses **server-side Whisper STT**, not
browser speech. Flow: press the mic to start recording → speak the full question → press
the mic again to stop (manual start/stop, never auto-stops) → a processing loader shows
while the audio is uploaded to `POST /api/knowledge/transcribe` → the transcript is
inserted into a full-width, auto-expanding input → the user edits it → presses Ask.

Configure with `OPENAI_API_KEY` (+ optional `STT_BASE_URL`/`STT_MODEL`). With `MOCK_LLM=1`
a mock transcript is returned for offline demos. Without a key and without mock, the
transcribe endpoint returns a clear `503`.

## Knowledge graph & traceability

`/graph` renders an entity/relationship graph (features, modules, processes, APIs,
requirements, documents) from the DB-backed graph model (`KnowledgeEntity` /
`KnowledgeRelation`, seeded on startup). Click a node to trace what it depends on, what
uses it, and where it is documented — surfacing coverage gaps.

## Operational knowledge store & correction loop

Knowledge also lives in the DB (`KnowledgeEntry`, the operational store) and is indexed
for retrieval alongside files with the highest weight. When an admin **applies** a user
correction (Admin → Corrections), the corrected knowledge is written into this store, so
subsequent answers are grounded on the corrected truth — corrections are not left in logs.

## Retrieval & confidence (Phase 1)

The authoritative `knowledge-base/` directory is indexed as a first-class, highest-weight
source; noisy files (`OPEN-QUESTIONS`, TODOs, drafts, READMEs) are down-weighted; and
confidence is computed honestly from term coverage, top-score, evidence diversity and
trusted-source ratio (capped lower for weak evidence) rather than an optimistic count.

## Multilingual answers

Answers are always returned in the language of the question (the model is instructed to
mirror the user's language regardless of the documentation language).

## Sources & Confluence links

Knowledge docs are markdown files under the indexed roots (`docs/`, `product/`,
`workspaces/documentation`). A doc can declare a source link via frontmatter:

```markdown
---
title: Carrier Billing Rules
source_type: confluence
confluence_url: https://your.atlassian.net/wiki/spaces/BILL/pages/123/Carrier+Billing+Rules
---
```

Recognised keys: `title`, `source_type`, and a URL under `confluence_url` / `jira_url` /
`source_url` / `url`. The source type (Confluence / Jira / Web / Local) is shown as a badge
next to each source, and the link is rendered clickable. Seed examples live in
`docs/knowledge-base/`.

## Key API endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | – | Sign in, set session cookie |
| POST | `/api/auth/logout` | – | Sign out |
| GET | `/api/auth/me` | user | Current user |
| POST | `/api/auth/change-password` | user | Change own password |
| POST | `/api/knowledge/ask` | user | Ask a question (logged) |
| POST | `/api/knowledge/queries/:id/rating` | user | Save 1–5 rating |
| POST | `/api/knowledge/queries/:id/feedback` | user | Save text/voice feedback |
| POST | `/api/knowledge/queries/:id/correction` | user | Submit a correction |
| GET | `/api/knowledge/history` | user | Own query history |
| GET | `/api/admin/users` / POST | admin | List / create users |
| PATCH | `/api/admin/users/:id` | admin | Toggle role/active, reset password |
| GET | `/api/admin/knowledge/queries` | admin | Full history with feedback & corrections |
| GET | `/api/admin/knowledge/analytics` | admin | Aggregate analytics |
