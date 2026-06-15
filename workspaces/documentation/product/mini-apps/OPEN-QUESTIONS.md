---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631767172
source_type: confluence
---
# Open Questions — Mini-Apps

> **Обновление 2026-06-11:** сверка с кодом `workspaces/mini-apps/`. ✅ — ответ из кода, ❓ — остаётся.

## Driver App

| # | Вопрос | Ответ |
|---|--------|-------|
| 1 ✅ | SMS/email ссылки | Отправка — **на стороне TMS**; mini-apps только принимает токен (`src/services/driver/index.js:24`). |
| 2 ✅ | Экспирация driverToken | **15 минут**; при истечении — редирект на `/contacts` (`src/services/driver/expiration.js:8,31`). |
| 3 ✅ | Французская строка | Это дефолт-текст, переводы есть в resources (`frontend/driver-app/actions/shipment.js:258`) — не баг, но дефолт стоит заменить на ключ i18n. |
| 4 ✅ | /old-driver | **Живой legacy-роут** параллельно новому (`driver/index.js:12`). |

## Carrier Portal

| # | Вопрос | Ответ |
|---|--------|-------|
| 5 ✅ | Carrier token | Генерируется в mainApp; mini-apps принимает `/carrier/:token` (`services/carrier/index.js:7`). |
| 6 ✅ | costRules структура | `{ [contentTypeId]: [{ units, type('less'|'equal'), priority, isDefault, rules: [{ weight, type, priority, isDefault, cost }] }] }` — `frontend/carrier/helper/rates.js:17-57`. |
| 7 ✅ | addNewAddress | Вызывается по «сохранить» в AddNewAddressModal после валидации requiredFields (`AddNewAddressModal.jsx:122,160`). |

## Slotify mini-app

| # | Вопрос | Ответ |
|---|--------|-------|
| 8 ✅ | Galaxy-адаптация | **Только брендинг**: домен из email → Galaxy → логотип (`booking/controllers/index.js:1513`). Логика не меняется. |
| 9 ✅ | Обязательность водителя | Поля: first/last name, document_type/number, phone, truck/trailer_license_plate; направления booking/pre_arrival/arrival; REQUIRED per direction (`booking/services/constants.js:27-68`). Настраивается в TMS на локации. |
| 10 ✅ | /slotify/status | **WebSocket** (GraphQL subscriptions, `wss://...`), не polling. |
| 11 ✅ | locationCustomerToken | Двухпараметрический URL фильтрует бронирование по customer (`slotify/locationCustomer.js:32,54`). |
| 12 ✅ | DIRECT_CONNECT_STEP | Пользователь остаётся на шаге, получает passwordless-email; вход ведёт в **основной TMS** (`booking/controllers/index.js:420,1097`). |

## Customs App

| # | Вопрос | Ответ |
|---|--------|-------|
| 13 ✅ | customs-токен | JWT, создаётся в mainApp; mini-apps только валидирует (`services/customs/index.js:23`). Триггер создания — на стороне TMS. |
| 14 ❓ | Прототипы метаданных | Определяются в TMS (metadata_prototypes); различия per-клиент — вопрос main-app доков. |
| 15 ✅ | websocketBackend | Отдельный WS-эндпоинт `wss://[env].shipt.io/subscriptions` (config per env, `middlewares/locals.js`). |

## Quick Shipment

| # | Вопрос | Ответ |
|---|--------|-------|
| 16 ⚠️ | QS-ссылка | Per-token URL `/quick-shipment/:token`; TTL не задан в mini-apps (зависит от JWT mainApp). Постоянная или per-user — определяется создателем в TMS. |
| 17 ❓ | cargo_type_ids фильтр | Настройка на shipper в TMS — вне mini-apps. |

## Transport Requests

| # | Вопрос | Ответ |
|---|--------|-------|
| 18 ✅ | AccessToken vs JWT | Модель `AccessToken` в БД: entity_name/id, user_id, account_id, email, token (encrypted), valid_to (`src/db/models/AccessToken.js:7-41`). Многоразовый до valid_to; отзывается удалением записи — в отличие от stateless JWT. |
| 19 ✅ | Несколько перевозчиков | У каждого **своя AccessToken-ссылка**; ответы видны всем на одном TR (`services/access-tokens/index.js:10`). ⚠️ Видимость чужих ответов — подтвердить с Product (может быть нежелательной для sealed-сценариев). |
| 20 ✅ | responder_email | Email фактического ответившего: из token (mini-app) или user (mainApp) — `transportRequestQuery.js:50-70`. |

## Общие

| # | Вопрос | Ответ |
|---|--------|-------|
| 21 ❓ | APM/observability | В коде только pino; Sentry/Datadog не найдены — DevOps. |
| 22 ❓ | Деплой | Dockerfile в репо есть; схема деплоя — DevOps. |
| 23 ✅ | /graphiql в prod | **Отключён** конфигом `config.graphiql` (`services/graphiql/index.js:6`). |
| 24 ✅ | buildVersion | Из `config.app.version` per NODE_ENV (`middlewares/locals.js:8`). |
| 25 ✅ | manup.min.js | App Update Manager для PWA-обновлений (github.com/GreaterThanCode/manup). |

## История
| Дата | Изменение |
|------|-----------|
| 2026-06-11 | Сверка с кодом: 19✅/1⚠️/5❓. Ключевое: driverToken 15 мин; TR-перевозчики видят ответы друг друга (проверить с Product!); /slotify/status на WebSocket; graphiql в prod выключен. |

---

## 🔗 Граф-метаданные
- **id:** `mini-apps.open-questions`
- **type:** module-doc · **domain:** Mini-Apps · **status:** implemented
- **confluence:** 631767172 · **repo:** `mini-apps/OPEN-QUESTIONS.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Mini-Apps
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

