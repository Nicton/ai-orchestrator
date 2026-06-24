# QA Platform (TMS + RMS + Automation Coverage + Traceability)

Реализация ТЗ `QA_Platform_Final_Full_TZ` как раздела внутри Searchify
(стек Searchify: Fastify + Prisma + PostgreSQL + статический UI), а не отдельного
.NET-приложения. Принцип ТЗ «API First, UI Second» сохранён: всё, что есть в UI,
доступно через `/api/qa/*`; основной потребитель API — AI-агент (Claude Code).

## Где что
- Backend: `src/qaplatform.ts` (`registerQaApi`) — весь API.
- Модели: `prisma/schema.prisma` — ~20 `Qa*` таблиц.
- UI: `src/public/qa.html` (SPA, маршрут `/qa`), пункт навигации «QA Platform (TMS/RMS)» в группе «Для QA».
- Reporters: `integrations/playwright-reporter/`, `integrations/testcafe-reporter/`.
- API-гайд для агента: `docs/qa-platform/CLAUDE_CODE_API_GUIDE.md`.

## Реализовано (по ТЗ)
Projects · Requirements (+sources +acceptance criteria) · Requirement/Test sections (tree, до 15 уровней) ·
Test Cases (+steps) · Shared Steps (+convert from TC steps) · Checklists (+expand-to-test-cases) ·
Automated Tests (upsert по `externalId`) · Entity Links (many-to-many, requirement↔test↔automation, step-level) ·
Coverage calc (step-level, считается сервером) · Test Plans (+items, select-all на UI) ·
Test Runs (+items со снэпшотом, manual + automated results, live events, idempotency, hanging-поля) ·
Traceability Matrix · Dashboards · Prometheus metrics (`/metrics`) · Global search (по globalId/тексту) ·
globalId · Soft delete (+restore) · Versioning (снэпшоты, restore) · Bulk-операции.

## Auth
- UI — сессионная кука Searchify.
- API-токен для агентов/CI: env `QA_API_TOKEN`, заголовок `x-qa-token` (или `Authorization: Bearer`).

## Что НЕ доделано / упрощено (см. open-questions)
- Versioning без diff-viewer (архитектура готова добавить).
- Полноценные роли/permissions не разделены (используется auth Searchify + один API-токен).
- Step-level live reporting у TestCafe — только test-level (ограничение фреймворка).
- Grafana dashboard JSON — не приложен (есть Prometheus-метрики `/api/qa/projects/{id}/metrics`).
- UI покрывает основные потоки; часть экранов (версии, drill-down traceability, фильтры) — базовые.
