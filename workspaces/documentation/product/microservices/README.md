---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629571642
source_type: confluence
---
# Микросервисы платформы — realtime, инфра, обзор

> Сверено с кодом 2026-06-13 | `microservices/node/*`

## Зачем (бизнес-контекст)

Монолит backend не должен держать на себе всё: WebSocket-соединения тысяч пользователей, рассылку email, тяжёлую разгрузку старых данных, геолокацию. Эти задачи вынесены в **микросервисы** — независимо масштабируемые, со своей зоной ответственности. Это даёт realtime-чат без нагрузки на API, надёжную доставку писем через очередь и разгрузку БД от холодных данных.

## Realtime-чат (msg-ws / msg-notif / msg-offload)

| Сервис | Зачем | Как устроено |
|--------|-------|--------------|
| **msg-ws** | Доставка сообщений чата в реальном времени | Socket.IO + Redis adapter (горизонтальное масштабирование); JWT из cookie (`@shiptify/node-auth`); неймспейсы attachment/freight-units/quote-request/shipment-request/transport-request; комнаты `user_{uid}` и `{ns}.{id}`. RPC: `POST /rpc/v1/notify-users`, `/emit-with-acl` |
| **msg-notif** | REST API уведомлений (лента активностей) | `activities_new` (свежие в PG) + S3 (архив); `GET /api/v1/notifications`, `POST /read`, `/read-all`; JWT |
| **msg-offload** | Разгрузка БД: старые активности → S3 | Фоновый воркер (24ч), пакеты ≥100, индекс в `activities_s3`. **Только prod** (риск потери в dev/staging) |
| **msg-email** | Отправка email | Kafka consumer (topics email_transact/batch) → Mailgun, EJS-шаблоны, ошибки в email_failed |

Связь: backend пишет посты (discussions/messages) → события → msg-ws доставляет подписчикам ([followers](../tms/followers/README.md)), msg-notif копит ленту, msg-email шлёт дайджесты.

## locations (микросервис)

Отдельный от backend сервис **поиска адресов**: `GET /api/v2/locations/list` с режимами (shipments_distinct, sh_request_addresses, proxy…), кэш Redis, локализация стран (i18n). Источник — собственная PG-база адресов (не внешний геокодер; геокодинг при создании — на backend через Google Places).

## Инфра-сервисы (обзор)

| Сервис | Назначение | Стек |
|--------|-----------|------|
| **ip2loc** | Страна/город по IP | ip2location BIN; `POST /rpc/v1/ip2loc` |
| **images** | Детекция placeholder-логотипов | sharp; `POST /rpc/v1/is-placeholder-logo` |
| **user-config** | Матрица доступа пользователя | `POST /api/v2/user-config/user-access` |
| **event-bus** | Шина событий (legacy, login) | Kafka (SCRAM-SHA-512), consumer KAFKA_TOPIC_EVENT_LOGIN |
| **crm** | Домены компаний + логотипы | RPC list/get/create/update-domain, S3 |
| **auth (ms-auth)** | SAML/JWT/passwordless | см. [identity](../identity/README.md), [auth-sso](../tms/admin/auth-sso.md) |
| **ai-extract / ai-worker** | AI Reader (Textract→Gemini) | см. [ai-reader](../ai/features/ai-reader.md) |
| **shared-types** | Общие TS-типы | type defs (db-msg-posts, rpc-*, sockets) |

## Отдельные репозитории-сервисы (вне microservices/node)

Помимо `microservices/node/*`, есть самостоятельные репозитории-сервисы (выявлены аудитом 2026-06-13):

| Сервис | Репозиторий | Док |
|--------|-------------|-----|
| Email/SMS-воркер (Kue, Mailgun) — **не** msg-email | `workspaces/emailing` | [email-sms-worker.md](email-sms-worker.md) |
| Генерация PDF (этикетки/CMR/манифесты, Puppeteer→S3) | `workspaces/generate` | [attachments-generate.md](attachments-generate.md) |
| Контракты Kafka-событий (`@shiptify/stream-events`) | `workspaces/stream-topics` | [stream-topics.md](stream-topics.md) |
| Общие библиотеки (`@shiptify/*`: lib-core, node-auth, stream-*) | `workspaces/core-libs` | [core-libs.md](core-libs.md) |
| Brinks / UPS (интеграции-сервисы NestJS) | `workspaces/brinks`, `workspaces/ups` | [brinks](../integrations/carriers/brinks.md), [ups](../integrations/carriers/ups.md) |
| Public API (внешний REST) | `workspaces/public-api` | [public-api](../integrations/public-api/README.md) |

## Где найти (репозиторий)

`workspaces/microservices/node/<service>/` — каждый сервис самостоятелен (Dockerfile, config). Общие либы: `@shiptify/node-auth`, `lib-core`, `node-http`.

## Сценарии

1. **Чат в реальном времени**: пользователь открыл отправку → msg-ws подписывает на `shipment-request.{id}` → новые сообщения приходят мгновенно.
2. **Лента уведомлений**: msg-notif отдаёт активности; старые ушли в S3 через msg-offload — БД не пухнет.
3. **Письмо о брони**: backend → Kafka → msg-email → Mailgun на языке получателя.

---

## 🔗 Граф-метаданные
- **id:** `microservices`
- **type:** overview · **domain:** Microservices · **status:** implemented
- **confluence:** 629571642 · **repo:** `microservices/README.md`
- **code_refs:** `microservices/node/{msg-ws,msg-notif,msg-offload,msg-email,locations,ip2loc,images,user-config,event-bus,crm,auth,ai-extract,ai-worker,shared-types}`
- **modules:** Microservices, Chat, TMS, AI, Identity
- **references:** `chat`, `tms.followers`, `tms.notifications`, `ai.ai-reader`, `identity`
- **requirements:** нет — реализовано без требований
