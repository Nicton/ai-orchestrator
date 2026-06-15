---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632848433
source_type: confluence
---
# Интеграции — Спорные вопросы и пробелы

Вопросы для уточнения у разработчиков и DevOps. Источники: код бэкенда, slides, техническая документация.

> **Обновление 2026-06-11:** проведена сверка с кодом (`backend/app/services/integration/`, `backend/app/cron/`, `config/production.json`, модели, миграции, `workspaces/integrations` RPC-сервис). ✅ — закрыто по коду, ⚠️ — частично, ❓ — остаётся (DevOps/Product).

---

## 1. Статус интеграций в Production

| # | Вопрос | Ответ |
|---|--------|-------|
| 1.1 ⚠️ | Какие интеграции активны в PROD? | Код не отвечает полностью: фактическая активация — записи в таблице `active_integrations` (per shipper-carrier-mode). По `production.json` сконфигурированы и живы: Teliae, Teliway (urby+evol), Heppner, MyDHL, DHL GF, P44, Marine Traffic (`enabled:true, useMock:false`), Dachser и др. Точный список — запрос в prod-БД. |
| 1.2 ✅ | Heppner активна? | **Да, полностью живая**: рабочий сервис + очередь, prod-конфиг `production.json:1497` (`hermes.heppner.fr/external-services-api`, galaxyId=8), email поддержки настроен. Признаков деактивации нет. |
| 1.3 ✅ | Teliae vs Teliway vs Urby/Evol | **Разные протоколы.** Teliae — самостоятельная интеграция (HTTP+FTP, один baseDir, без ретраев). Teliway — EDIFACT-протокол с **двумя окружениями-вариантами**: `teliway_urby` и `teliway_evol` (отдельные FTP-креды, общие retry_delays [30,60,240,1440]); cron получает environment аргументом. |
| 1.4 ✅ | BIC DESADV задеплоен? | **Кода нет нигде** — ни в backend, ни в `microservices/node/*`, ни в `workspaces/integrations`. Планируемая фича (слайды 2025-11, оценка 90-120 чел.-дней). |
| 1.5 ✅ | Marine Traffic используется? | **Да**: `production.json:1561` — `enabled:true, useMock:false, technicalUserId:96693`; два живых cron-джоба; сложный dataResolver (459 строк). |

---

## 2. Архитектура и конфигурация

| # | Вопрос | Ответ |
|---|--------|-------|
| 2.1 ✅ | Схема integration_settings.config | Per-integration ключи живут в **config (production.json)**, а не в JSONB. Примеры: Teliae — url, accountId, technicalUserId, ftp.baseDir, retry_delays, palletExchangeSpecIds; Teliway — ftp.baseDirIn/Out per env; MyDHL — baseUrl, itnMetadataPrototypeId, attachmentTypesMapping (INV/PNV/COO/CIN/DCL/AWB/NAF); Heppner — API.baseUrl/key, galaxyId; P44 — API.baseUrl, API.shippers; Dachser — metadataPrototypeId. Модель `integration_settings` хранит: integration_name, shipment_mode_id, metadata_prototype_id, reference_field_name. |
| 2.2 ✅ | deleted_at / реактивация | `active_integrations` — **paranoid:true** (модель :120): soft delete через `deleted_at`, единый для всех. Реактивация — стандартный Sequelize `restore()`, спец-логики «can_reactivate» нет. |
| 2.3 ✅ | deleted_at или is_active? | **Только `deleted_at`** — поля `is_active` в модели нет вообще. Деактивация = soft delete записи active_integrations. |
| 2.4 ✅ | RPC-сервисы — где развёрнуты? | **Отдельный сервис `integrations-app:3000`** (workspace `workspaces/integrations`) — HTTP RPC: `RPC_MYDHL_URL`, `RPC_DHL_GF_URL`, `RPC_AFTERSHIP_URL` (дефолт `http://integrations-app:3000/rpc/<name>`). Вызов через `rpcFetch()`; 404/412 = интеграция не найдена. |
| 2.5 ✅ | Retry strategy | **Per-integration массив задержек**, не «3 попытки»: утилита `lib/delayedRetryJob.js` — `retryDelays` это абсолютные офсеты от T0 (сек). Teliae `[]` (без ретраев), Teliway/DHL DISPOR/webhooks `[30,60,240,1440]`, Terrial `[60,1440]`. |

---

## 3. DHL

| # | Вопрос | Ответ |
|---|--------|-------|
| 3.1 ✅ | DHL FTP + DHL GF одновременно? | Конфликта нет архитектурно: **DHL GF — единственная интеграция booking-уровня** (комментарий в `common/helpers/resolvers.js:403`: «currently, only DGF is at booking level»), остальные DHL — shipment-уровень. Явной проверки конфликтов нет, но уровни не пересекаются. |
| 3.2 ✅ | DHL FCA / Inovert | Оба существуют как отдельные INTEGRATION_TYPES: `dhl-fca`, `dhl_inovert` (`common/helpers/constants.js:4-8`); всего 5 DHL-вариантов в `DHL_INTEGRATIONS`. Inovert умеет CO2-событие (STY0305/GES в `dictionary/inovert.js:1534`). |
| 3.3 ✅ | HAWB/MAWB/customer-ref | Для DHL reference types: housebill, **customer-reference (default)**, masterbill, container-number (`constants.js:46-51`). HAWB/MAWB как термины — у Kuehne-Nagel. |
| 3.4 ✅ | Полнота DHL→STY маппинга | Словарь `tracking/dictionary/dhl.js` — **40 уникальных кодов / 54 записи** (один код может давать разные STY по режиму SEA/ROA/AIR). Unmapped → `null` (событие пропускается, `transformer/dhl.js:36-45`). |

---

## 4. Heppner

| # | Вопрос | Ответ |
|---|--------|-------|
| 4.1 ⚠️ | carrier_product_code | В коде Heppner явных product codes нет — идентификатор интеграции `heppner` (constants.js:16). 'HPR' из доки — внутреннее сокращение в логах («HPR IMPL: …»). |
| 4.2 ✅ | HPR Galaxy | Не отдельная интеграция, а **механизм доступа**: `heppner/service.js:22-31` — carriers загружаются из Galaxy (`config.heppner.galaxyId=8`), shipper проверяется как managed account этой Galaxy. |
| 4.3 ✅ | CO2 через Heppner | В `heppner/` кода CO2 **нет**. CO2-событие есть только в маппинге Inovert (STY0305). Тест-кейсы CO2 для Heppner, вероятно, относятся к EcoTransit-расчёту обычных отправок Heppner. |
| 4.4 ✅ | Heppner CSW → SR | **Обычный флоу**: SR создаётся стандартно, затем queue-задача `integrationHeppner:createHeppnerRequest` шлёт данные в HPR API (`impl.js:19-42`). При ошибке — fallback **отменяет SR** (`fallback.js:14-28`). |

---

## 5. P44 / Shippeo

| # | Вопрос | Ответ |
|---|--------|-------|
| 5.1 ✅ | P44 — все shipments? | **Только при наличии записи active_integrations** для пары shipper/carrier/mode: hook при создании shipment (`services/shipments.js:2418` → `integrateP44Shipment`) → если интеграция найдена, queue-задача регистрации; иначе null. Tracking затем тянет cron `checkTrackingPointsP44()` по таблице `shipment_integration_p44`. |
| 5.2 ✅ | Shippeo — активация | Нужно: креды `authUser/authPassword` per-shipper в `config.shippeo.API.shippers` + записи integration_settings/active_integrations. OAuth-токены — таблица `shippeo_tokens` (авто-обновление, `tokenValidDays`). Отдельного UI-флоу нет — конфигурация серверная. |
| 5.3 ✅ | P44+Shippeo вместе — дубли? | **Дедупа между источниками нет, приоритета нет** — TP создаются обоими. Источник помечается полем **`tracking.tag`** ('p44' / 'shippeo', `models/tracking.js:104,163`). Dedup работает только внутри по type/code/address/dates (`tracking/external.js:196-231`) — совпадающие события всё равно задублируются при разных датах. ⚠️ Реальный риск дублей. |
| 5.4 ✅ | Схема shipment_integration_p44 | `id, shipment_id (FK), internal_shipment_id (BIGINT — ID в P44), created_at, updated_at`. Для Shippeo аналога **нет** — только `shippeo_tokens` + active_integrations. |

---

## 6. SAP

| # | Вопрос | Ответ |
|---|--------|-------|
| 6.1 ✅ | Transport Plans — путь создания | Единый путь: `sap/impl.js` — `createShipmentRequestDraft()` / `createShipmentRequestDirectBooking()` вызывают `getTransportPlanData()` и создают SR + TP **в одной транзакции** (`helpers/transportPlan.js:189`). Не через CSW UI — но через те же сервисы домена. |
| 6.2 ✅ | Milkrun от SAP | Спец-обработчика **нет** — milkrun используется только при отмене (`freeShipmentsFromMilkrunGroups`, impl.js:478). |
| 6.3 ✅ | accounting_entity_id обязателен? | **Опционален**: `allowNull:true, defaultValue:null` (active_integrations.js:86); используется только если задан (transportPlan.js:166). |
| 6.4 ✅ | SAP Invoice sync — триггер | **Не реализован**: в sap/ нет обработчиков invoice вообще (только SR/QR/Tracking события). «Экспорт в SAP после FREEZE» из слайдов Invoicing V2 — планируемая функциональность. |

---

## 7. EDI

| # | Вопрос | Ответ |
|---|--------|-------|
| 7.1 ✅ | edifact_incoming_messages | Хранит **полное сообщение** (поле `data` TEXT) + filename, status (new/completed/failed), environment, message_type, failed_attempts_count. Не только дедупликация — полноценная очередь обработки с ретраями. |
| 7.2 ⚠️ | FTP polling interval | Cron-задачи per-integration (db-schenker-, calvacom-tracking-statuses.js и др.); **интервал задаётся вне кода** — планировщиком окружения (`cronHeartBeatUrls`). Уточнить у DevOps. |
| 7.3 ✅ | D96A vs D01B | **Разные движки**, не техдолг одной версии: DB Schenker = IFTMIN **D96A** (исходящие) + IFTSTA **D01B** (входящие) — `services/edifact/iftmin/d96a/`, `iftsta/d01b/`. Calvacom = **DISPOR v3.2 и v4.0** (`edifact/dispor/version_3.2/`). Миграция DB Schenker на D01B — вопрос к контрагенту, не к коду. |
| 7.4 ✅ | INTTRA — протокол | **AS2** (отдельная очередь `AS2ServerTasks`, задача `postMessageToInttra`); в коде только senderId/receiverId, сертификаты/endpoint — в конфиге вне git. |

---

## 8. Webhooks

| # | Вопрос | Ответ |
|---|--------|-------|
| 8.1 ✅ | upload_shipment_attachment — когда? | **При любой загрузке вложения**, без фильтра по типу (`attachments.js:1982` → `webhookUploadAttachment`); работает для 4 сущностей: shipment, sh_request, quote_request, transport_request. |
| 8.2 ✅ | Peripass — направление | **Входящие** вебхуки от Peripass (gate events: VEHICLE_ARRIVED→STY0200, VEHICLE_DEPARTED→STY0300, LOADING_STARTED/COMPLETED→STY0210/0220) + Shiptify **отправляет** визитёров в Peripass при создании визита (`webhookInformAutomaticGate` → `createOrUpdatePeripassVisitorsForVisit`). Двунаправленная. |
| 8.3 ✅ | HMAC | **HMAC-SHA256 для исходящих** вебхуков: `webhooks/provider.js:51-58` — подпись = HMAC(timestamp+token, secret), кладётся в тело каждого запроса. Входящие — свои механизмы (INTTRA — IP whitelist). |
| 8.4 ✅ | Настройка исходящих вебхуков | Модели **`webhook` + `webhook_events` + `webhook_credentials`** (BASIC/QUERY/HEADER/PUBLIC auth); управление через backend API (`controllers/api/webhooks.js`). UI-настройки в админке нет. ~25 типов событий: SR create/update/cancel/decline, shipment tracking/contents/dates, FU, attachment, invoice (CREATE/VALIDATE/...), visits, slots, pricing, metadata, locations. |

---

## 9. Пробелы документации — данные собраны

| # | Что нужно | Результат |
|---|-----------|----------|
| 9.1 ✅ | Схема config per-integration | См. 2.1 — ключи по 8 основным интеграциям. |
| 9.2 ✅ | Полный список STY-кодов | **367 кодов** (STY0000..STY0366 + STY9999) в `public-api/src/services/tracking/dictionary/sty.js` (4027 строк); 30+ категорий типов (collection, delivered, claim, customs, port/airport events, GES=CO2...). |
| 9.3 ✅ | LABEL-генерация (ZPL→PDF) | **Teliae** (через Labelary API, `labelaryProvider.js`, батчи по 48), **FedEx API** (ярлыки в ответе API), **UPS** (label.builder.ts в workspace ups/). Dachser/Brinks — только POD. |
| 9.4 ✅ | Cron-задачи интеграций | 21 задача: p44-, teliae- (tracking/EOD/POD), teliway- (per env), marine-traffic- (×2), brinks- (×3: invoice/POD/tracking), calvacom-, dachser-POD, db-schenker-, dimotrans-, ecotransit (×2), fedex-api- (×2), fedex-express-, kuehne-nagel-tracking-statuses. |

---

## Оставшиеся вопросы (DevOps/Product)

| # | Вопрос | Кому |
|---|--------|------|
| 1.1 | Фактический список активных пар в prod (`SELECT ... FROM active_integrations`) | DevOps/DBA |
| 7.2 | Частота cron-планировщика для FTP polling | DevOps |
| 5.3a | Допустим ли двойной трекинг P44+Shippeo для одной пары — нужен ли приоритет источников? | Product (риск дублей TP подтверждён кодом) |
| 6.4a | SAP Invoice sync — когда планируется реализация (слайды Invoicing V2)? | Product |

---

## История

| Дата | Изменение |
|------|-----------|
| 2026-06-10 | Первая версия — 35 вопросов. |
| 2026-06-11 | Сверка с кодом (5 параллельных исследований). Закрыто 31 из 35. Ключевое: BIC DESADV не реализован; SAP invoice sync не реализован; deleted_at (не is_active); RPC = integrations-app:3000; retry per-integration; P44+Shippeo дублируют TP (tag-поле, без приоритета); 367 STY-кодов; HMAC только исходящие. |

---

## 🔗 Граф-метаданные
- **id:** `integrations.open-questions`
- **type:** module-doc · **domain:** Integrations · **status:** implemented
- **confluence:** 632848433 · **repo:** `integrations/OPEN-QUESTIONS.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Integrations
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

