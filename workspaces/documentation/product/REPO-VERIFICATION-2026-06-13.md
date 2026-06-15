---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629375178
source_type: confluence
---
# Отчёт: проверка полноты документации по ВСЕМ репозиториям

> Дата: 2026-06-13. Запрос: «Пройдись по всем репозиториям и убедись, что там всё так же хорошо добавлено (мини-аппс, интеграции и т.д.). Возможно, там есть такая же проблема» (та же, что выявил bottom-up аудит: код есть, документации нет).

## Вывод

**Да, та же проблема была.** Первая инвентаризация ([SYSTEM-MAP.md](SYSTEM-MAP.md)) охватила `backend` / `frontend` ×3 / `microservices/node` / `back-office` / `admin-app` / `mini-apps`, но **пропустила 7 отдельных репозиториев-сервисов**, которые жили только в виде упоминаний (а `core-libs` — вообще без единой ссылки). Все 7 теперь задокументированы bottom-up с 4-блочной структурой и граф-метаданными.

## Что было упущено и закрыто (✅ 2026-06-13)

| Репозиторий | Файлов | Проблема до аудита | Создан док |
|-------------|--------|--------------------|-----------|
| `public-api` | 583 | только Swagger (`public-api-docs`), поведение сервиса не описано | [integrations/public-api/README.md](integrations/public-api/README.md) |
| `brinks` | ~165 | только упоминания; это отдельный NestJS-сервис, а не папка backend | [integrations/carriers/brinks.md](integrations/carriers/brinks.md) |
| `ups` | ~181 | только упоминания | [integrations/carriers/ups.md](integrations/carriers/ups.md) |
| `emailing` | ~22 | путали с `msg-email`; это отдельный Kue-воркер | [microservices/email-sms-worker.md](microservices/email-sms-worker.md) |
| `generate` | ~12 | только упоминания | [microservices/attachments-generate.md](microservices/attachments-generate.md) |
| `stream-topics` | ~35 | только упоминания | [microservices/stream-topics.md](microservices/stream-topics.md) |
| `core-libs` | ~146 | **0 ссылок** в документации | [microservices/core-libs.md](microservices/core-libs.md) |

## Проверено и подтверждено как уже покрытое (✅)

- **mini-apps** — покрыто сводным доком (Wave 6, Confluence 629080106) + OPEN-QUESTIONS; код `mini-apps/src/services` сверен.
- **integrations** (перевозчики внутри backend) — 18 перевозчиков в [integrations/carriers/README.md](integrations/carriers/README.md), детальные доки DHL/Heppner, аудит OPEN-QUESTIONS, cron/STY/retry сверены.
- **microservices/node** — сводный док (Wave 3, 629571642): msg-ws/notif/offload/email, locations, ip2loc, images, user-config, event-bus, crm, auth, ai-extract/worker, shared-types.
- **back-office / admin-app** — Waves 4-5 (6 доков + сводный admin).
- **backend / frontend / frontend-mono** — основной массив TMS-документации.

## Репозитории НЕ для продуктовой документации (намеренно не углубляем)

| Репозиторий | Категория | Почему не доку |
|-------------|-----------|----------------|
| `main-app-automation`, `testing-tools` | QA / автотесты | не продукт; релевантно QA-команде |
| `migrations`, `migrations-bi` | миграции БД | инфра; схема описана в моделях backend |
| `package-translations`, `translations` | i18n | переводы, не функциональность |
| `run-local` | локальный запуск | devops-инструмент |

## Пустые / зарезервированные репозитории

`ai-shared`, `chat`, `identity`, `docs`, `maintain`, `notifications` — пустые или заглушки (домены Chat/Identity задокументированы по их реальному коду в backend/microservices, не по этим пустым репо).

## Обновлённые артефакты

- [SYSTEM-MAP.md](SYSTEM-MAP.md) — добавлена секция «Отдельные репозитории-сервисы».
- [microservices/README.md](microservices/README.md) — таблица отдельных сервисов.
- [integrations/README.md](integrations/README.md), [integrations/carriers/README.md](integrations/carriers/README.md) — ссылки на public-api / brinks / ups.

## Замечания для эскалации (из кода новых доков)

- **public-api: rate limiting в коде сервиса отсутствует** — проверить ограничение на уровне gateway/прокси (DevOps).
- **public-api: версия сервиса (0.166.0) ≠ версия API-спеки (1.0.0)** — нормально, но фиксируем во избежание путаницы.
- **swagger ↔ код** public-api — синхронизация остаётся отдельным пунктом бэклога.

---

## 🔗 Граф-метаданные
- **id:** `repo-verification-2026-06-13`
- **type:** report · **domain:** TMS · **status:** implemented
- **confluence:** 629375178 · **repo:** `REPO-VERIFICATION-2026-06-13.md`
- **code_refs:** —
- **modules:** Integrations, Microservices, Mini-Apps, Public-API
- **references:** SYSTEM-MAP, integrations.public-api, integrations.carriers.brinks, integrations.carriers.ups, microservices.email-sms-worker, microservices.attachments-generate, microservices.stream-topics, microservices.core-libs
- **requirements:** —
