---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629375127
source_type: confluence
---
# Public API — Внешний REST API Shiptify

**shiptify-public-api** (`workspaces/public-api`, 583 файла) — публичный REST API для **внешних интеграторов**: перевозчиков, отправителей, партнёров и кластерных (Galaxy) интеграций. Это **отдельный сервис**, не внутренний backend. Ранее в документации был представлен только Swagger-спецификацией (`public-api-docs`); поведение самого сервиса не описывалось — заполняем пробел.

> Репозиторий: `workspaces/public-api` · Swagger: `workspaces/public-api-docs/swagger/` (OpenAPI 3.0.2).
>
> **Hosted Swagger UI** (`BLU`/`Flint` — названия окружений, не клиентов; прод — без поддомена): прод — https://api-docs.shiptify.com/ · BLU (тест-стенд) — https://api-docs.blu.shiptify.com/ · Flint — https://api-docs.flint.shiptify.com/.
> **Полный справочник эндпоинтов** (274 эндпоинта, авто-генерация из OpenAPI): [reference/README.md](reference/README.md). Реестр ссылок: [LINKS.md](../../LINKS.md).
> **📘 Сквозное руководство разработчика** (модель данных, ER, цепочки вызовов, сценарии интеграции, Galaxy, события, примеры): [guide/README.md](guide/README.md).

---

## 1. Зачем (бизнес)

Внешние системы клиентов (ERP, WMS, порталы перевозчиков) интегрируются со Shiptify **не через внутренний backend**, а через этот публичный API:
- создание и управление отправками, заявками, заказами, котировками;
- получение трекинга, инвойсов, документов;
- управление локациями, тарифами, метаданными;
- кластерные интеграции (Galaxy) — обмен между связанными аккаунтами.

Сервис изолирует внешний контур: своя аутентификация (API-ключи), свой ACL (carrier/shipper), своё версионирование — чтобы изменения внутреннего backend не ломали интеграции клиентов.

---

## 2. Как устроено (код, file:line)

| Компонент | Файл | Назначение |
|-----------|------|-----------|
| Точка входа | `src/index.js:1-72` | Express + Passport + DB + метрики; отдельный метрик-сервер на порту 9091 |
| Express setup | `src/lib/express.js:13-70` | CORS, compression, JSON 20mb, логирование, Passport |
| Аутентификация | `src/lib/passport/strategies/headerapikey.js:1-45` | API-ключ в заголовке `Authorization: Api-Key <key>`; поиск в таблице `PublicApiKey` → User → Account |
| ACL | `src/routes/middlewares/acl.js:1-376` | `auth`, `availableAccount`, `requireCarrier`/`requireShipper`, `loadAllowed*` |
| Основной роутер | `src/routes/api.js:37-77` | публичный API (`/`) |
| Galaxy роутер | `src/routes/galaxy/index.js:31-44` | кластерные интеграции (`/galaxy`, `/galaxy-data`) |
| Версионирование | `src/lib/conditionHandler.js:1-30` | условный роутинг по `accept-version` / `x-api-version` (default `1.0.0`) |

**Стек:** Node.js (≥24.8) + Express + Passport (`passport-headerapikey`). Версия сервиса 0.166.0; версия API-спецификации 1.0.0 (это разные числа).

### Аутентификация и ACL — отличие от внутреннего backend

| Параметр | Public API | Internal Backend |
|----------|-----------|-----------------|
| Аутентификация | API-Key в заголовке (`headerapikey`) | JWT + сессии (`express-jwt`) |
| Модель доступа | Account-based: типы CARRIER / SHIPPER + Galaxy clustering | Role-based (роли пользователей) |
| Авторизация | `requireCarrier` / `requireShipper` + `loadAllowed*` | проверки по ролям |
| Версионирование | условное (по заголовку) | URL-based |

> ⚠️ **Rate limiting в коде сервиса отсутствует** (нет middleware) — кандидат для проверки DevOps (ограничение на уровне gateway/прокси).

---

## 3. Ресурсы (что доступно внешним интеграторам)

Полный список — Swagger; ключевые группы (`src/routes/*.js`):

| Ресурс | Путь | Ключевые операции |
|--------|------|-------------------|
| Shipments | `/shipments` | GET/POST(create)/PUT(cancel, pickup/delivery confirm/replan)/PATCH(tracking-points, contents, metadata, parcels)/DELETE |
| Shipment Requests | `/shipment-requests` | create, draft, milkrun, cancel, update, invoicing |
| Tracking Points | `/tracking-points` | confirm, replan, cancel, update, location |
| Orders | `/orders` | CRUD + details, statuses, lines, by-ref |
| Quote / Transport Requests | `/quote-requests`, `/transport-requests` | create, update, cancel, prices, metadata |
| Pre-Shipments | `/pre-shipments` | assign/deassign customs-invoices, orders |
| Carriers / Shippers | `/carriers`, `/shippers` | active, followers |
| Invoices / Lines / Financial Groups | `/invoices`, `/invoice-lines`, `/financial-groups` | get, assign, recalculate |
| Customs Invoices | `/customs-invoices` | create |
| Locations | `/locations` | CRUD by id и by ref |
| Attachments | `/attachments` | download, deactivate |
| Slots / Visits | `/slots`, `/visits` | create, update, cancel, by-ref |
| Parcels / Freight Units | `/parcels`, `/freight-units` | CRUD, temperatures |
| Dictionaries | `/dictionary` | shipment-modes, causes, incidents, claims, dangerous-goods, … |
| SSCC | `/sscc` | serial shipping container codes |
| Прочее | `/tags`, `/events`, `/content-types`, `/accounting-entities`, `/specificities`, `/dock-orders`, `/metadata-prototypes`, `/accounts` | — |

**Galaxy API** (`/galaxy`, `/galaxy-data`) — для интеграций между связанными аккаунтами: `/carrier`, `/shipments`, `/shipment-requests`, `/parcels`, `/tracking-points`, `/gate-access`, `/pre-shipments`, `/invoice-lines`.

**Служебное:** `/healthz`, `/metrics` (Prometheus, порт 9091), `/robots.txt`.

---

## 4. Где найти и настроить

- **API-ключи** хранятся в таблице `PublicApiKey` (связь User → Account). Выпуск ключа — через внутренние инструменты/Admin.
- **Заголовки клиента:** `Authorization: Api-Key <key>`, `x-account-id` (выбор аккаунта), опц. `accept-version`/`x-api-version`.
- **Тип доступа** (carrier/shipper) определяется типом пользователя, к которому привязан ключ.
- **Swagger/Postman:** `public-api-docs/build.js` собирает OpenAPI (`-b` bundle, `-p` Postman, `-r` format).

---

## 5. Сценарии

1. **Создание отправки извне.** Клиент `POST /shipments` с `Api-Key` → `auth` + `availableAccount` + `requireShipper` → отправка создаётся в Shiptify.
2. **Carrier обновляет трекинг.** Перевозчик `PUT /tracking-points/:id/confirm` → `requireCarrier` + `loadAllowedShippersForCarrierUser` → событие трекинга применяется.
3. **Версионирование.** Клиент шлёт `accept-version: 1.0.0` → `conditionHandler` маршрутизирует на нужный handler; без заголовка — default 1.0.0.
4. **Galaxy-обмен.** Связанный аккаунт через `/galaxy/shipment-requests` создаёт заявку у партнёра в кластере.

> **Swagger ↔ код:** Swagger разбит на `$ref`-файлы (`paths/`), код держит роуты в одном роутере + 37 helper-файлов; расхождения структуры — норма, контракт фиксирует Swagger. Синхронизация swagger↔код — отдельный пункт бэклога.

---

## Связанные документы

- [../README.md](../README.md) — интеграции (обзор)
- [../carriers/README.md](../carriers/README.md) — перевозчики
- [../../microservices/README.md](../../microservices/README.md) — карта сервисов

---

## 🔗 Граф-метаданные
- **id:** `integrations.public-api`
- **type:** module-doc · **domain:** Integrations · **status:** implemented
- **confluence:** 629375127 · **repo:** `integrations/public-api/README.md`
- **code_refs:** `public-api/src/index.js:1-72`, `public-api/src/lib/passport/strategies/headerapikey.js:1-45`, `public-api/src/routes/middlewares/acl.js:1-376`, `public-api/src/routes/api.js:37-77`, `public-api/src/routes/galaxy/index.js:31-44`, `public-api/src/lib/conditionHandler.js:1-30`
- **modules:** Integrations, Public-API
- **references:** integrations (README), integrations.carriers (README), microservices.overview
- **requirements:** контракт — Swagger `public-api-docs/swagger/api.json` (OpenAPI 3.0.2); источник поведения — код `workspaces/public-api`
