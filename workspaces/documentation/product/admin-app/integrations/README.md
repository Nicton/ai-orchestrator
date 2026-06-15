---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632291329
source_type: confluence
---
# Управление интеграциями

## Обзор

Admin-App является **единственной** конфигурационной поверхностью для всех интеграций с перевозчиками на платформе Shiptify. Back-Office не имеет доступа к этим настройкам.

Каждая интеграция состоит из нескольких уровней:

1. **Active Integration** — флаг активации конкретного перевозчика для конкретного аккаунта
2. **Credentials** — API-ключи, логины, пароли для доступа к внешнему API перевозчика
3. **Accounts** — аккаунтные номера перевозчика, привязанные к шипперам Shiptify
4. **Settings** — дополнительные параметры конфигурации
5. **Metadata Prototypes** — маппинг полей между Shiptify и API перевозчика

---

## Active Integrations (мастер-активация)

Центральная таблица: какие интеграции активны для каких аккаунтов.

| Метод | URL | Действие |
|---|---|---|
| `GET` | `/api/v1/active-integrations` | Список активных интеграций (группировка по `integration_name`) |
| `GET` | `/api/v1/active-integrations/:id` | Детали записи |
| `POST` | `/api/v1/active-integrations/check-duplicates` | Проверка дублей перед созданием |
| `POST` | `/api/v1/active-integrations` | Активировать интеграцию |
| `PATCH` | `/api/v1/active-integrations/:id` | Обновить запись |
| `DELETE` | `/api/v1/active-integrations/:id` | Деактивировать интеграцию |

---

## UPS

Три независимых раздела для настройки UPS.

### Shipper Accounts (`/api/v1/integration/ups/accounts`)

Привязка аккаунтных номеров UPS к шипперам Shiptify.

| Метод | URL | Действие |
|---|---|---|
| `GET` | `.../shipper-accounts` | Список шипперов (для dropdown) |
| `GET` | `.../addresses` | Список адресов (для dropdown) |
| `GET` | `.../galaxy-services` | Galaxy services (для dropdown) |
| `GET` | `.../check-duplicates` | Проверка дублей |
| `GET` | `.../check-collision` | Проверка коллизий сервисов |
| `GET/POST` | `/integration/ups/accounts` | Список / создать |
| `GET/PUT/DELETE` | `/integration/ups/accounts/:id` | CRUD |

### Shipper Addresses (`/api/v1/integration/ups/shipper-addresses`)

Адреса пикапа/доставки для UPS per shipper.

### Charges Accounts (`/api/v1/integration/ups/charges-accounts`)

Биллинговые аккаунты UPS (отдельно от транспортных аккаунтов). Включает проверку конфликтов и дублей номеров шипперов.

---

## DHL Global Forwarding (GFW)

### Credentials (`/api/v1/integration/dhl-gf/credentials`)

API-логин/пароль по среде окружения.

### Accounts (`/api/v1/integration/dhl-gf/accounts`)

Привязка DHL GF аккаунтов к шипперам Shiptify и бухгалтерским сущностям.

Вспомогательные эндпоинты:
- `.../shipper-accounts` — список шипперов для dropdown
- `.../accounting-entities` — список accounting entities для dropdown
- `.../check-duplicates` — проверка дублей
- `.../check-collision` — проверка коллизий

### Carriers (`/api/v1/integration/dhl-gf/carriers`)

Маппинг перевозчиков DHL GF.

### Services (`/api/v1/integration/dhl-gf/services`)

Маппинг сервисов/продуктов DHL GF.

---

## DHL Express (MyDHL)

### Credentials (`/api/v1/integration/mydhl/credentials`)

CRUD для API-credentials MyDHL.

Дополнительный эндпоинт `getExtended` возвращает полные детали аккаунта (отдельный view).

### MyDHL Accounts View

Просмотр аккаунтов MyDHL (раздел `mydhl-accounts` в UI).

---

## FedEx API

### Accounts (`/api/v1/integration/fedex-api/accounts`)

Просмотр аккаунтов FedEx API. Три категории:
- Global accounts (основные)
- Old accounts (legacy)
- CSP groups

На текущий момент **только чтение** — создание/удаление не реализовано в Admin-App.

---

## Dachser

### Credentials (`/api/v1/integration/dachser/credentials`)

API-credentials Dachser, привязанные к конкретным шипперам.

---

## SAP (ERP-интеграция)

### Address Mappings (`/api/v1/sap/address-mappings`)

Маппинг SAP agency-ключей на адреса шипперов Shiptify.

Вспомогательный эндпоинт `.../agencies` — список SAP agencies для dropdown.

---

## EDIFACT (`/api/v1/accounts/:id/edifact`)

Конфигурация EDI per account. Настраивается в контексте конкретного аккаунта.

---

## Project44 / P44 (`/api/v1/p44-settings`)

Настройки интеграции с Project44 (visibility/tracking-платформа).

CRUD:

| Метод | URL | Действие |
|---|---|---|
| `GET/POST` | `/api/v1/p44-settings` | Список / создать |
| `GET/PUT/DELETE` | `/api/v1/p44-settings/:id` | CRUD |

---

## Teliae (`/api/v1/teliae-settings`)

Настройки интеграции с Teliae.

---

## Brinks (`/api/v1/brinks-settings`)

Настройки интеграции с Brinks.

---

## Customer Auth Credentials (`/api/v1/integration/customer-auth/credentials`)

OAuth / API-ключи для customer-auth интеграций. Общий механизм аутентификации для интеграций, использующих customer-level credentials.

---

## Общие (cross-carrier) механизмы

### Integration Settings (`/api/v1/integration-settings`)

Общие конфигурационные записи, которые разделяются несколькими интеграциями.

### Integration Credentials (`/api/v1/integration-credentials`)

Общее хранилище credentials для интеграций без dedicated-раздела.

### Integration Metadata Prototypes (`/api/v1/integration-metadata-prototypes`)

Маппинг полей данных между Shiptify и внешними API.

Поля записи:

| Поле | Описание |
|---|---|
| `path` | Путь к полю в данных перевозчика |
| `field` | Имя поля (обязательное) |
| `prototype_id` | ID метаданных-прототипа (обязательное) |
| `integration_setting_id` | Привязка к конкретной integration setting |
| `scope` | Контекст применения: `details`, `quotes`, `tracking`, `invoicing`, `claims`, `slots`, `transport_request` |
| `payload_types` | Типы payload, к которым применяется маппинг |

### Integration Logs (`/api/v1/integration-logs`)

Read-only журнал вызовов к внешним API перевозчиков. Используется для отладки интеграций.

---

## Customer Workflows (`/api/v1/customer-workflows`)

Конфигурируемые workflow-определения per customer.

Вспомогательные эндпоинты:
- `.../codes` — доступные коды workflow
- `.../location-types` — типы локаций для workflow

---

## Карта интеграций

| Перевозчик | Credentials | Accounts | Services/Mapping | Специфика |
|---|---|---|---|---|
| UPS | — | Shipper Accounts + Charges Accounts | Shipper Addresses | Collision/duplicate detection |
| DHL GFW | Yes | Yes | Carriers + Services | Accounting entity linking |
| DHL Express (MyDHL) | Yes | View only | — | Extended view endpoint |
| FedEx API | — | Read-only list | — | CSP groups |
| Dachser | Yes (per shipper) | — | — | — |
| SAP | — | — | Address Mappings | Agency lookup |
| EDIFACT | — | Per account | — | EDI config |
| P44 | Settings | — | — | Tracking/visibility |
| Teliae | Settings | — | — | Tracking/visibility |
| Brinks | Settings | — | — | — |

---

## 🔗 Граф-метаданные
- **id:** `admin-app.integrations`
- **type:** module-doc · **domain:** Admin-App · **status:** implemented
- **confluence:** 632291329 · **repo:** `admin-app/integrations/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Admin-App
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

