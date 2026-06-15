---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629506126
source_type: confluence
---
# Core-Libs — Общие библиотеки Shiptify

**core-libs** (`workspaces/core-libs`) — монорепо общих библиотек для backend и интеграций: аутентификация, HTTP-логирование, событийная шина (EventBus) и транспортные адаптеры. **Ранее не упоминалось в документации вообще** (0 ссылок) — критический пробел, заполняем.

> Репозиторий: `workspaces/core-libs` · пакеты в `pkg/`.

---

## 1. Зачем (архитектура)

Чтобы не дублировать логирование, авторизацию и работу с Kafka/Redis/PG в каждом сервисе, общий код вынесен в переиспользуемые пакеты `@shiptify/*`. Их подключают backend, [Brinks](../integrations/carriers/brinks.md), [UPS](../integrations/carriers/ups.md), [emailing](email-sms-worker.md), [generate](attachments-generate.md) и другие.

---

## 2. Как устроено (пакеты)

| Пакет | Назначение |
|-------|-----------|
| `@shiptify/lib-core` | логгеры (pino), shutdown-хендлеры, маскирование (`slow-redact`) |
| `@shiptify/node-auth` | JWT/cookie-аутентификация для Express (cookie, jsonwebtoken) |
| `@shiptify/node-http` | HTTP request-логгер для Express |
| `@shiptify/bun-auth` | JWT-аутентификация для Bun/Hono |
| `@shiptify/bun-http` | HTTP-логгер для Bun/Hono |
| `@shiptify/stream-core` | transport-agnostic **EventBus**: DLQ, retry, dependency gating, версионирование схем |
| `@shiptify/stream-kafka` | Kafka-адаптер для stream-core (kafkajs) |
| `@shiptify/stream-pg` | PostgreSQL outbox-транспорт (postgres) |
| `@shiptify/stream-redis` | Redis Streams-адаптер (ioredis) |
| `stream-pg-bun` / `stream-redis-bun` | те же транспорты для Bun |
| `stream-test-suite` | интеграционные тесты адаптеров (bun / node-cjs / node-esm) |

**Ключевые файлы:** `pkg/lib-core/package.json`, `pkg/node-auth/package.json`, `pkg/stream-core/package.json`, `pkg/stream-kafka/package.json`, `pkg/stream-pg/package.json`, `pkg/stream-redis/package.json`.

### Связи

- **lib-core** — логирование во всех воркерах (emailing, generate, brinks, ups).
- **stream-core** — единый EventBus; конкретный транспорт выбирается адаптером (`stream-kafka` / `stream-pg` / `stream-redis`).
- События, передаваемые через шину, типизированы пакетом [stream-topics](stream-topics.md) (`@shiptify/stream-events`).

---

## 3. Где найти и настроить

- Пакеты публикуются как `@shiptify/*` и подключаются сервисами как зависимости.
- Выбор транспорта EventBus — подключением соответствующего `stream-*` адаптера.
- Auth-секреты (JWT) — через окружение сервиса; библиотека лишь проверяет/подписывает токены.

---

## 4. Сценарии (как влияет на продукт)

1. **Единое логирование.** Все сервисы пишут логи в одинаковом формате (pino) с маскированием секретов — упрощает мониторинг и аудит.
2. **Надёжная доставка событий.** `stream-core` даёт retry + DLQ: событие интеграции не теряется при сбое консьюмера.
3. **Outbox-паттерн.** `stream-pg` позволяет публиковать события транзакционно с записью в БД (без потери при падении между commit и publish).

---

## Связанные документы

- [README.md](README.md) — карта микросервисов
- [stream-topics.md](stream-topics.md) — контракты событий, передаваемых через EventBus
- [email-sms-worker.md](email-sms-worker.md), [attachments-generate.md](attachments-generate.md) — потребители lib-core

---

## 🔗 Граф-метаданные
- **id:** `microservices.core-libs`
- **type:** module-doc · **domain:** Microservices · **status:** implemented
- **confluence:** 629506126 · **repo:** `microservices/core-libs.md`
- **code_refs:** `core-libs/pkg/lib-core/package.json`, `core-libs/pkg/node-auth/package.json`, `core-libs/pkg/stream-core/package.json`, `core-libs/pkg/stream-kafka/package.json`, `core-libs/pkg/stream-pg/package.json`, `core-libs/pkg/stream-redis/package.json`
- **modules:** Microservices
- **references:** microservices.overview, microservices.stream-topics, microservices.email-sms-worker, microservices.attachments-generate
- **requirements:** нет требований — общие библиотеки (источник: код `workspaces/core-libs`)
