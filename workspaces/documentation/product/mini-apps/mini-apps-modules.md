---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629080106
source_type: confluence
---
# Mini-Apps — внешние порталы по ссылке-токену

> Сверено с кодом 2026-06-13 | `mini-apps/src/services/*`, `db/models/{Driver,AccessToken,TransportRequest}.js`

## Зачем (бизнес-контекст)

Огромная часть участников логистики — водители, мелкие перевозчики, поставщики — не должны заводить аккаунт ради одного действия. Mini-apps дают им **доступ по ссылке-токену**: водитель подтверждает прибытие, перевозчик отвечает на котировку, поставщик бронирует слот — без регистрации. Это снимает барьер входа и делает Shiptify сетью, а не закрытой системой. Безопасность — на токенах (одноразовые/срочные) + IP-whitelist + JWT.

## Порталы

| Портал | URL | Что делает | Токен-механика |
|--------|-----|-----------|----------------|
| **Driver App** | `/driver/:driverToken/shipments/:id` | Водитель подтверждает прибытие, видит отправку | `Driver.token` (16 симв.), `expires_at` = +15 мин при открытии, opens_count; истёк → `/contacts` |
| **Carrier Portal** | `/carrier/:token` | Перевозчик смотрит маршруты, предлагает цену | token в URL; costRules расчёт; addNewAddress (Google Places) |
| **Slotify** | `/slotify/:locationToken[/:customerToken]` | Публичное бронирование слота | locationToken (+ customerToken для известного клиента), JWT authToken (10 дн), Galaxy-брендинг по домену, status-виджеты `/slotify/status/...` |
| **Customs** | `/customs/:token` | Таможенные документы отправки (Sea) | AccessToken (entity=customs), шифрован, valid_to; +IP-whitelist +JWT role customs |
| **Quick Shipment** | `/quick-shipment/:token` | Быстрое создание отправки от шиппера | shipper.token, JWT; IP-whitelist |
| **Transport Requests** | `/transport-requests/:token` | Перевозчик отвечает на TR (цена/условия) | AccessToken (entity=TR), quote_data JSONB, статусы NEW/ACCEPTED/.../DECLINED |
| **Shared Templates** | `/template-sharing/:token` | Бронирование по расшаренному шаблону | templateToken, JWT, API-прокси в main app (см. [templates](../tms/templates/README.md)) |

## Realtime и прочее

- **Subscriptions** (`/graphql`): GraphQL Yoga + WebSocket, PubSub; событие `attachmentAddedToShipment` (фильтр по shipment_id) — realtime-обновления в порталах.
- **Feedback** (`POST /api/v1/feedback`): сбор отзывов.
- **Slots API**: `listSlotsByToken` (scopes upcoming/delayed/current/completed) — данные для Slotify/status-табло.

## Токены — общая модель

- **Driver.token** — срочный (15 мин), per-driver.
- **AccessToken** (`AccessToken.js`): entity_name (customs/TR) + entity_id + token (encrypted) + valid_to — **многоразовый до истечения**; у каждого перевозчика на TR своя ссылка (видят ответы друг друга — см. DEFECTS).
- **JWT mini-app**: audience miniapp/legacy, 10 дней, HS256, роли в токене.

## Где найти

`app.blu.shiptify.com` генерирует ссылки; mini-apps — отдельный сервис (Express+EJS, GraphQL Yoga, Helmet). Деплой — отдельный контейнер.

## Сценарии

1. **Водитель подтверждает прибытие**: получил SMS-ссылку → `/driver/:token` (живёт 15 мин) → подтвердил → статус визита обновился.
2. **Перевозчик отвечает на котировку**: ссылка TR → ввёл цену → quote_data обновился → shipper видит ответ.
3. **Поставщик бронирует слот**: `/slotify/:locationToken` → форма (язык по браузеру, бренд галактики) → слот создан.

---

## 🔗 Граф-метаданные
- **id:** `mini-apps`
- **type:** module-doc · **domain:** Mini-Apps · **status:** implemented
- **confluence:** 629080106 · **repo:** `mini-apps/mini-apps-modules.md`
- **code_refs:** `mini-apps/src/services/{driver,carrier,slotify,slots,customs,quick-shipment,transport-requests,shared-templates,subscriptions,access-tokens,feedback}`, `db/models/{Driver,AccessToken,TransportRequest}.js`
- **modules:** Mini-Apps, DOCK (Slotify), TMS (TR/templates/customs)
- **references:** `dock.slots-core`, `tms.transport-plan`, `tms.templates`, `tms.customs`, `dock.drivers-and-sms`
- **requirements:** нет — реализовано без требований (TR-видимость чужих ответов → DEFECTS)
