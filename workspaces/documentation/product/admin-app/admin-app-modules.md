---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629571675
source_type: confluence
---
# Admin-App — конфигурация платформы

> Сверено с кодом 2026-06-13 | `admin-app/app/controllers/api/*`

## Зачем (бизнес-контекст)

Admin-App — внутренний инструмент команды Shiptify для **низкоуровневой конфигурации платформы**: справочники (валюты, режимы, типы груза), правила перевозчиков, подключение интеграций с кредами, аккаунты и доступы. Это «рубильники» системы: то, что не должно меняться клиентами и не релизится кодом, но определяет поведение всего продукта. Отличие от Back-Office: BO — про продажи/операции/клиентов, Admin-App — про конфигурацию и интеграции.

## 1. Справочники (Dictionaries)

13 CRUD-справочников (`GET/POST/PUT/DELETE /api/v1/dictionaries/{type}`), питающих продукт:

| Справочник | Что задаёт | Потребитель в продукте |
|-----------|-----------|------------------------|
| currencies | ISO-валюты | инвойсинг, рейтшиты |
| shipment-modes | режимы (Road/Sea/Air/Express…) | CSW, рейтшиты, планы |
| shipment-request-content-types | типы груза | CSW, DOCK cargo groups |
| shipment-specificities | спецификации (ADR/Fragile…) | план перевозки, зоны |
| metadata-prototypes | прототипы кастомных полей | [Metadata](../tms/metadata/README.md) |
| product-types | типы продуктов | каталог продуктов |
| message-types, causes | типы сообщений, причины статусов | трекинг, инциденты |
| attachment-types | типы документов | [Doc Center](../tms/doc-center/README.md) |
| shipment-price-details | компоненты цены | рейтшиты, cost segments |
| transit-companies | морские перевозчики (SCAC) | [Sea Freight](../tms/features/sea-freight-ship-data.md), Kpler |
| job-contracts/experiences/functionalities | HR-справочники | онбординг персонала |

## 2. Carrier Rules / Divisions / Galaxy Services

| Что | Назначение | Роут |
|-----|-----------|------|
| **Carrier Rules** | costRules (JSON-правила расчёта цены: margin/surcharge/формула) | `/carriers/rules` |
| **Carrier Divisions** | иерархия подразделений перевозчика (nested-set + address) | `/divisions` |
| **Galaxy Services** | сервисы доставки (read-only из external) | `/galaxy-services` |

## 3. Active Integrations + креды перевозчиков

Подключение интеграций командой Shiptify: `active-integrations` (+ check-duplicates, collision detection), generic `integration-credentials`, per-carrier: DHL Express/GF (accounts/carriers/services/credentials), FedEx API (CSP/legacy/global), UPS (accounts/charges/addresses), Dachser (encrypted), MyDHL. Плюс `integration-logs` (аудит) и `integration-metadata-prototypes` (маппинг полей в EDI/API). Архитектура RPC и реестр — см. [integrations](../integrations/README.md).

## 4. Accounts / Admins / Access / Workflows

| Что | Назначение |
|-----|-----------|
| Accounts | создание SHIPPER/CARRIER аккаунтов + relations (sponsor/address) |
| Admins | пользователи с ролями (spectator/editor/admin) + carrier_division/shipper_category |
| Access | user↔account (UserLinkedAccount), user↔location связи |
| Customer Workflows | конфиг workflow клиента (код, тип локации) |

> ⚠️ Техдолг (аудит): Admin-App на Sequelize 3 (EOL); интеграции меняются без событий (см. admin-app/OPEN-QUESTIONS).

## Где найти

`admin.blu.shiptify.com/login`. Доступ — роль admin (см. [admin-app/OPEN-QUESTIONS](OPEN-QUESTIONS.md): уровней админов нет, 2FA опциональна).

## Сценарии

1. **Новая валюта**: Dictionaries → currency → создать → доступна в инвойсинге всех аккаунтов.
2. **Подключить DHL GF клиенту**: Active Integrations → DHL GF account + credentials → check-duplicates → активация.
3. **Правило цены перевозчика**: Carrier Rules → costRules JSON → применяется в расчёте.

---

## 🔗 Граф-метаданные
- **id:** `admin-app.modules`
- **type:** module-doc · **domain:** Admin-App · **status:** implemented
- **confluence:** 629571675 · **repo:** `admin-app/admin-app-modules.md`
- **code_refs:** `admin-app/app/controllers/api/{dictionaries-*,carrier-rules,carrier-divisions,galaxy-services,active-integrations,integration-*,customer-auth-credantials,customer-workflows,accounts,admins,access_users_to_*}.js`
- **modules:** Admin-App, Integrations, TMS, DOCK
- **references:** `integrations`, `tms.metadata`, `tms.master-data.products`, `back-office.dictionaries`
- **requirements:** нет — реализовано без требований (техдолг → admin-app/OPEN-QUESTIONS)
