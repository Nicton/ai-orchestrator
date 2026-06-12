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
- A default admin is seeded on first startup (see `ADMIN_EMAIL` / `ADMIN_NAME` /
  `ADMIN_PASSWORD`, default `aleh.asmalouski@shiptify.com` / `shiptify-admin`).
- Admins create users from the Admin → Users tab; the app returns a temporary password
  and an access link to forward to the new user.

## Logging

Every question is stored (`KnowledgeQuery`) with the user, timestamp, answer, sources,
intent, confidence, input mode (text/voice) and rating. Feedback (`KnowledgeFeedback`)
and corrections (`KnowledgeCorrection`) are linked to the query and the user. Low ratings
with feedback also feed the `KnowledgeGap` table as documentation signals.

## Voice

Voice input (both the question and the feedback) uses the browser **Web Speech API**
(`SpeechRecognition`). Best supported in Chrome/Edge. No server-side audio is required.

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
