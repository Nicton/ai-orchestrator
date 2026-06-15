---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632225793
source_type: confluence
---
# Управление справочниками (Dictionaries)

## Обзор

Admin-App предоставляет полный CRUD для всех справочников платформы. Это позволяет поддерживать актуальные reference-данные без прямых изменений в базе. Back-Office имеет доступ к справочникам **только на чтение** (для заполнения dropdown-ов).

Все справочные эндпоинты — стандартный REST (list, create, show, update, delete), защищены `auth.api.requireAdmin`.

---

## Справочники отправлений

### Режимы отправлений (`dict-sh_modes`)

`GET/POST /api/v1/dictionaries/shipment-modes`
`GET/PUT/DELETE /api/v1/dictionaries/shipment-modes/:id`

Определяет типы перевозки: sea, road, air, multimodal и т.д. Является базовой классификацией для любого отправления на платформе.

---

### Специфики отправлений (`dict-sh_specificities`)

`GET/POST /api/v1/dictionaries/shipment-specificities`
`GET/PUT/DELETE /api/v1/dictionaries/shipment-specificities/:id`

Дополнительные характеристики отправлений (например: hazardous, temperature-controlled).

---

### Детали цен (`dict-sh_price_details`)

`GET/POST /api/v1/dictionaries/shipment-price-details`
`GET/PUT/DELETE /api/v1/dictionaries/shipment-price-details/:id`

Типы строк в расчёте стоимости отправления: base rate, fuel surcharge, customs fee и т.д.

---

### Типы содержимого запроса (`dict-sh_request_content_types`)

`GET/POST /api/v1/dictionaries/shipment-request-content-types`
`GET/PUT/DELETE /api/v1/dictionaries/shipment-request-content-types/:id`

Типы контента в запросах на котировку/отправление.

---

## Продукты и сообщения

### Типы продуктов (`dict-product-types`)

`GET/POST /api/v1/dictionaries/product-types`
`GET/PUT/DELETE /api/v1/dictionaries/product-types/:id`

Каталог типов продуктов для классификации грузов.

---

### Типы сообщений (`dict-message-types`)

`GET/POST /api/v1/dictionaries/message-types`
`GET/PUT/DELETE /api/v1/dictionaries/message-types/:id`

Типы уведомлений/сообщений в системе (для системы нотификаций).

---

## Финансы

### Валюты (`dict-currencies`)

`GET/POST /api/v1/dictionaries/currencies`
`GET/PUT/DELETE /api/v1/dictionaries/currencies/:id`

Справочник валют платформы. Используется в расчётах стоимости и биллинге.

---

### Бухгалтерские сущности (`dict-accounting_entities`)

`GET /api/v1/accounting-entities`

Список accounting entities с поддержкой поиска. Используется при привязке DHL GF аккаунтов и других интеграций.

---

## Метаданные

### Прототипы метаданных (`dict-metadata-prototypes`)

`GET/POST /api/v1/dictionaries/metadata-prototypes`
`GET/PUT/DELETE /api/v1/dictionaries/metadata-prototypes/:id`

Определения прототипов метаданных — базовый справочник для системы metadata интеграций. Не путать с `integration-metadata-prototypes` (маппинг конкретных интеграций): этот справочник — первичный реестр типов метаданных.

---

### Причины/коды причин (`dict-causes`)

`GET/POST /api/v1/dictionaries/causes`
`GET/PUT/DELETE /api/v1/dictionaries/causes/:id`

Коды причин для событий, изменений статуса, рекламаций.

---

### Типы вложений (`dict-attachment-types`)

`GET/POST /api/v1/dictionaries/attachment-types`
`GET/PUT/DELETE /api/v1/dictionaries/attachment-types/:id`

Каталог типов документов/вложений (invoice, CMR, packing list и т.д.).

---

## HR / Карьерный портал

### Функциональности вакансий (`dict_job_functionalities`)

`GET/POST /api/v1/dictionaries/job-functionalities`

Направления деятельности для фильтрации вакансий (tech, ops, sales и др.).

---

### Типы контрактов вакансий (`dict_job_contracts`)

`GET/POST /api/v1/dictionaries/job-contracts`

CDI, CDD, stage, freelance и т.д.

---

### Уровни опыта вакансий (`dict_job_experiences`)

`GET/POST /api/v1/dictionaries/job-experiences`

Junior, Mid, Senior, Executive и т.д.

---

### Транзитные компании (`dict_transit_companies`)

`GET/POST /api/v1/dictionaries/transit-companies`
`GET/PUT/DELETE /api/v1/dictionaries/transit-companies/:id`

Каталог транзитных компаний платформы.

---

## Сводная таблица справочников

| Справочник | URL-prefix | Назначение |
|---|---|---|
| Shipment Modes | `/dictionaries/shipment-modes` | Режимы перевозки |
| Shipment Specificities | `/dictionaries/shipment-specificities` | Специфики грузов |
| Shipment Price Details | `/dictionaries/shipment-price-details` | Типы строк стоимости |
| Request Content Types | `/dictionaries/shipment-request-content-types` | Типы контента запроса |
| Product Types | `/dictionaries/product-types` | Типы продуктов |
| Message Types | `/dictionaries/message-types` | Типы уведомлений |
| Currencies | `/dictionaries/currencies` | Валюты |
| Accounting Entities | `/accounting-entities` | Бухгалтерские сущности |
| Metadata Prototypes | `/dictionaries/metadata-prototypes` | Прототипы метаданных |
| Causes | `/dictionaries/causes` | Коды причин |
| Attachment Types | `/dictionaries/attachment-types` | Типы вложений |
| Job Functionalities | `/dictionaries/job-functionalities` | Направления вакансий |
| Job Contracts | `/dictionaries/job-contracts` | Типы контрактов |
| Job Experiences | `/dictionaries/job-experiences` | Уровни опыта |
| Transit Companies | `/dictionaries/transit-companies` | Транзитные компании |

---

## Важное отличие от Back-Office

Back-Office **не может редактировать** эти справочники. Все изменения reference-данных (добавление новой валюты, нового типа вложения, нового режима перевозки) производятся исключительно через Admin-App администраторами платформы.

---

## 🔗 Граф-метаданные
- **id:** `admin-app.dictionary`
- **type:** module-doc · **domain:** Admin-App · **status:** implemented
- **confluence:** 632225793 · **repo:** `admin-app/dictionary/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Admin-App
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

