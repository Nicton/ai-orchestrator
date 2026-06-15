---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632717345
source_type: confluence
---
# Открытые вопросы по документации TMS

> Дата: 2026-06-11 (v2 — сверка с кодом) | Статус: большинство вопросов закрыто ответами из кода

Этот файл агрегирует открытые вопросы из документации TMS. **2026-06-11 проведена сверка с кодом** (`workspaces/backend`, `workspaces/public-api`, `workspaces/microservices/node/auth`, `workspaces/migrations`): ✅ — ответ найден в коде, ⚠️ — частичный ответ, ❓ — остаётся открытым (нужен Product/Engineering).

---

## Multi Container
> Документ: [features/multi-container.md](features/multi-container.md)

| # | Вопрос | Ответ из кода |
|---|--------|---------------|
| MC-1 ✅ | Макс. количество контейнеров в MC-бронировании? | **20 по умолчанию**, переопределяется полем `max_containers_number` аккаунта/пользователя (`preShipments/index.js:933`, валидация в `lib/contents.js:477`). |
| MC-2 ✅ | Только FCL или также FTL? | **Не привязано к режиму транспорта**: MC включается при наличии контента с флагом `is_container` (`shipments/helper.js:154`) — проверки shipment_mode нет. Технически возможно и для FTL, если контент-тип контейнерный. |
| MC-3 ✅ | Переименование суффикса после подтверждения? | **Можно**: `PATCH /shipments/:id/name` обновляет `container_name` при `is_multicontainer` (`shipments.js:4197`). Проверяется только ACL (владелец/перевозчик), статус подтверждения **не блокирует**. Суффикс по умолчанию — 4-значный номер (`0001`...). |
| MC-4 ✅ | Инцидент одного контейнера блокирует трекинг остальных? | **Нет**: статусы контейнеров-«братьев» (`shipment_brothers`, общий `pre_shipment_id`) полностью независимы. |
| MC-5 ⚠️ | Счёт при отмене части контейнеров? | MC-специфичной invoicing-логики в коде **нет** — счета формируются на уровне shipment_request без дифференциации по контейнерам. Поведение при частичной отмене не определено кодом → вопрос Product. |
| MC-6 ⚠️ | Кто может отменять отдельный контейнер? | Отмена (`canceler_id`) доступна **обеим сторонам** в рамках их прав на бронирование (carrier — если владелец carrier_id; shipper — владелец или `CAN_EDIT_BOOKING_KEY`). ⚠️ Важно: установка canceler_id вызывает `cancelShipmentRequestById()` — **отменяется всё бронирование**, отмена строго одного контейнера в коде не найдена. |

---

## Sea Freight Ship Data
> Документ: [features/sea-freight-ship-data.md](features/sea-freight-ship-data.md)

| # | Вопрос | Ответ из кода |
|---|--------|---------------|
| SEA-1 ✅ | Макс. количество SeaLeg? | **Лимита нет** — валидация `shipmentTransitDetails/index.js:113` требует минимум 1 точку, максимума нет. |
| SEA-2 ✅ | Итоговый ETA при нескольких SeaLeg? | **ETA последнего leg**: tracking points строятся из первой (departure) и последней (arrival) точек (`processToBuildTpData`, `shipmentTransitDetails/index.js:345-365`). |
| SEA-3 ✅ | Справочник морских перевозчиков? | Таблица **`DictionaryTransitCompany`** (с полем `code` = SCAC). Управление — через BO (`controllers/api/carriers.js`); признак sea carrier на компании. |
| SEA-4 ✅ | SCAC не заполнен → Kpler? | **Блокировка без ошибки пользователю**: `createContainerTracking()` возвращает `false` без SCAC (`marine-traffic/impl.js:299-307`); перевозчики без SCAC отфильтровываются из tracking-параметров (`dataResolver.js:553`). Tracking просто не создаётся. |
| SEA-5 ✅ | Разные SeaLeg разным контейнерам в MC? | **Да**: каждый контейнер (shipment) имеет свой `shipment_transit_detail` (FK `shipment_id`); обработка братьев — `processTransitDetailsForBrotherShipments` (`index.js:561`). |
| SEA-6 ✅ | Same Ship при частично назначенных SeaLeg? | Документ применяется только к контейнерам с совпадающим судном/transit company; контейнеры **без SeaLeg исключаются** (категория Unassigned не отображается). |

---

## Container Tracking (Kpler)
> Документ: [features/container-tracking.md](features/container-tracking.md)

| # | Вопрос | Ответ из кода |
|---|--------|---------------|
| TRACK-1 ✅ | Kpler — единственный провайдер? | **Нет.** Провайдеры трекинга в коде: **Project44** (TL, 27+ перевозчиков), **Shippeo** (GPS real-time), **AfterShip** (parcel, 900+), **Marine Traffic/Kpler** (море). AIS/port EDI отдельно — нет. |
| TRACK-2 ❓ | Биллинг Kpler (~3-4$/контейнер)? | В коде учёта стоимости/лимитов запросов **нет** (`marine_traffic_tracking_requests` без полей стоимости). Кто платит и как перевыставляется — вопрос Product/Finance. |
| TRACK-3 ⚠️ | Индикатор расхождения Kpler vs ручной? | Логика приоритета есть: Kpler actual без подтверждения Carrier → Kpler; оба actual → **Carrier**; расхождение >12ч → **оранжевая подсветка**. Отдельного «конфликт-индикатора» в коде нет. |
| TRACK-4 ⚠️ | Интервал опроса Kpler? | Два cron-джоба (`cron/marine-traffic-update-tracking.js`, `marine-traffic-update-external-shipment-id.js`), но **интервал задаётся вне кода** — через конфиг `cronHeartBeatUrls` / расписание планировщика окружения. Уточнить у DevOps. |
| TRACK-5 ✅ | Закрытие tracking request после доставки? | **Автоматическое**: когда все destination-port точки получили `realDate` → `setTrackingRequestFinished()`, статус `FINISHED` (`trackingPoints.js:268-277, 368`). |

---

## Retro Consolidation
> Документ: [features/retro-consolidation.md](features/retro-consolidation.md)

| # | Вопрос | Ответ из кода |
|---|--------|---------------|
| RETRO-1 ✅ | Доступность — план подписки? | Плана/аккаунт-флага **нет** — доступно всем. Единственная проверка — флаг **`allow_financial_consolidation`** на уровне пары shipper-carrier division (`shipper_divisions_carrier_divisions.js:44`), и проверяется он **только при пересчёте**, не при назначении группы (`financial-groups/helper.js:428`). |
| RETRO-2 ✅ | Лимит SR в группе? | **Лимита нет** — `assignFinancialGroup()` без проверок количества. |
| RETRO-3 ✅ | Алгоритм dispatch? | `splitPriceByDispatch()` (`transportRequests/index.js:1189`): варианты — по количеству TR, **весу**, chargeable weight, surface, числу грузовых единиц, уникальным entities. Источник правила — `cost_segments.dispatch_scope` из Rate Sheet. **Fallback по умолчанию — gross weight** (`splitByWeight`). |
| RETRO-4 ✅ | Разные инкотермы — блокировка? | **Нет**: incoterm не загружается и не проверяется в валидации (`helper.js:500-543` проверяет carrier, mode, logzones — без incoterm). Консолидация с разными инкотермами проходит. |
| RETRO-5 ❓ | Когда добавят проверку incoterm? | В коде TODO нет; требование зафиксировано только в доке (REQ-RS-019). Блок или предупреждение — решение Product. |

---

## Auth / SSO
> Документ: [admin/auth-sso.md](admin/auth-sso.md)

| # | Вопрос | Ответ из кода (микросервис `ms-auth`) |
|---|--------|---------------|
| AUTH-1 ✅ | Требования Chanel или generic? | **Generic multi-tenant**: IdP подбирается по домену email (таблицы `identity_providers` + `identity_provider_domains` + `sso_keys`); `auth_methods` настраивается per-account (`['local','saml','google','admin_token']`). Chanel в коде не упоминается — гайд писался под кейс Chanel, но реализация общая. |
| AUTH-2 ✅ | Self-service SSO? | **Нет.** Настройка IdP — только через БД/Shiptify; endpoint генерации SP metadata доступен только `super_user`. |
| AUTH-3 ⚠️ | Ротация SP-сертификата? | Сертификаты в таблице `sso_keys` (public_cert + private_key). **Механизма ротации нет** — ни версионирования, ни параллельных ключей. Обновление = замена в БД (риск downtime). |
| AUTH-4 ✅ | Implicit Grant → PKCE? | **Implicit не используется** (в `GRANT_TYPE` его нет). Есть Authorization Code (для M2M-интеграций) и client_credentials. **PKCE не реализован**. SPA использует не OAuth, а **JWT-cookie сессии**. Вопрос миграции неактуален в исходной формулировке. |
| AUTH-5 ✅ | Ротация Client Secret? | **Механизма нет** — секрет из конфига, один активный. Ротация = ручная замена + рестарт. |
| AUTH-6 ✅ | Внешние партнёры без домена? | **Локальные пароли (bcrypt) + passwordless magic-link** (`passwordless.ts`: одноразовый токен в Redis, отправка на email). Отдельного IDP нет — все в одной таблице `users`, SSO-пользователи помечены `use_sso`. |
| AUTH-7 ✅ | MFA? | **Нет MFA для логина** (grep totp/mfa — пусто; `speakeasy` в backend — только для интеграции FedEx API). Безопасность = пароли/SAML IdP + JWT revocation. |
| AUTH-8 ✅ | Истечение Access Token? | Полностью реализовано: JWT TTL **35 мин** (`TOKEN_MAX_AGE=2100`), **auto-refresh** после 30 мин (`session.ts:16-24`), revocation-blacklist в Redis по подписи токена (`revoked-jwt.ts`), per-account `session_expiration_time`. Для M2M OAuth — refresh tokens в БД (encrypted) + cron `refresh-oauth-tokens.js`. |

---

## Expected Orders
> Документ: [features/expected-orders.md](features/expected-orders.md)

> ⚠️ **Главный вывод: EO как сущность НЕ реализована** — в коде есть только `Order` / Dock Order / SlotOrder. Все «вопросы по EO» — вопросы к будущему дизайну.

| # | Вопрос | Ответ из кода |
|---|--------|---------------|
| EO-1 ✅ | Замена Dock Order или параллельно? | **EO в коде нет.** Существует модель `Order` (статусы PENDING/ASSIGNED/DELIVERED/CANCELLED/MISSING_SLOT) + SlotOrder. Миграций/каркаса EO нет — фича на уровне спецификации. |
| EO-2 ❓ | Лимит EO на аккаунт PML? | Не определено (фича не реализована). |
| EO-3 ⚠️ | Несколько Orders от разных поставщиков? | В текущей модели `Order` — одна пара `buyer_partner_id`/`seller_partner_id` на заказ (миграция 20250807113551). N:N с поставщиками нет. |
| EO-4 ✅ | Уведомления поставщику? | В коде dock-orders **нет** отправки уведомлений при создании заказа. |
| EO-5 ✅ | Может ли поставщик отклонить EO? | Статуса REJECTED/DECLINED **нет**; только бронирование слота или удаление DO (с проверкой `checkAbilityToDeleteDockOrder`). |
| EO-6 ✅ | Миграция исторических заказов? | Миграционных скриптов EO **нет** (есть только миграции полей `orders`). План миграции (PENDING→Open и т.д.) — только в доке. |
| EO-7 ❓ | CANCELLED — мигрируют? | Не определено: таблица маппинга в доке не покрывает CANCELLED, скриптов нет. Решение за Product. |

---

## Quota Management
> Документ: [features/quota-management.md](features/quota-management.md)

> ⚠️ **Главный вывод: Quota Management полностью НЕ реализован** (как и Quote Strategy) — ни моделей, ни контроллеров, ни UI. Все 8 вопросов — вопросы к дизайну будущей фичи, код ответов не даёт.

| # | Вопрос | Статус |
|---|--------|--------|
| QUOTA-1 ❓ | База расчёта (отправки/вес/стоимость)? | Не решено — в спеке поле «Calculation Basis» без вариантов. **P0 перед разработкой.** |
| QUOTA-2 ❓ | Период (месяц/rolling)? | Не решено — в спеке «Frequency» (monthly/weekly). **P0.** |
| QUOTA-3 ❓ | Перевозчик в нескольких квотах? | Спека предполагает (квоты по логзонам from/to), констрейнты не определены. |
| QUOTA-4 ❓ | Смена перевозчика → пересчёт? | Не определено. |
| QUOTA-5 ❓ | Exception management? | В спеке секция есть, механизм не определён. |
| QUOTA-6 ❓ | Кому алерт при 90%? | Не определено; кода уведомлений нет. |
| QUOTA-7 ❓ | Push to Spot Market? | В спеке опции Block/Warn/Auto-push; упоминается Brokerage module. Реализация не определена. |
| QUOTA-8 ❓ | Dashboard — стандартный UI или BI? | Не решено. |

---

## Pallets Management
> Документ: [features/pallets.md](features/pallets.md)

> ⚠️ **Главный вывод: модуль в Icebox.** Единственное, что есть в коде — флаг `is_pallet` на content-types (добавлен 2025-09, миграция 20250924085819), используемый интеграциями Brinks (`BRINKS_PACKAGE_TYPES.PALL`), UPS (packaging builder) и Teliae (`palletExchangeSpecIds`, `returnablePalletsNumber`). Моделей движений/инвентаря/arbitration нет.

| # | Вопрос | Статус |
|---|--------|--------|
| PAL-1 ✅ | Активация модуля? | **Заморожен (Icebox)**: feature flag `Pallets_Mgt` из спеки в коде не существует; моделей/роутов/UI нет. Клиентский спрос — вопрос Product. |
| PAL-2 ⚠️ | Типы поддонов? | В коде типов нет — только generic `is_pallet` флаг (+ старые content-type IDs: PALLET=3, EUROPALLET=1 во frontend). EUR/EPAL/Chep/UK/Industrial — из спеки. |
| PAL-3 ❓ | Разрешение Arbitration? | Не реализовано — вопрос к дизайну. |
| PAL-4 ❓ | Авто-закрытие движения? | Не реализовано. |
| PAL-5 ❓ | Invoice за движения? | Не реализовано; связи с invoicing нет. |
| PAL-6 ❓ | Связь с отправками (SH)? | Не реализовано; FK нет. |

---

## Итого (после сверки с кодом 2026-06-11)

| Домен | Вопросов | ✅ закрыто | ⚠️ частично | ❓ открыто (Product) |
|-------|----------|-----------|-------------|---------------------|
| Multi Container | 6 | 4 | 2 | 0 |
| Sea Freight | 6 | 6 | 0 | 0 |
| Container Tracking | 5 | 2 | 2 | 1 |
| Retro Consolidation | 5 | 4 | 0 | 1 |
| Auth / SSO | 8 | 6 | 1 | 1 (ротация cert — скорее задача, чем вопрос) |
| Expected Orders | 7 | 4 | 1 | 2 |
| Quota Management | 8 | 0 | 0 | 8 (фича не реализована) |
| Pallets Management | 6 | 1 | 1 | 4 (фича в Icebox) |
| **Всего** | **51** | **27** | **7** | **17** |

**Ключевые открытия:**
1. **Quota Management и Expected Orders не реализованы** — это спецификации; их «открытые вопросы» относятся к дизайну, не к документированию текущего поведения.
2. **Pallets — Icebox**, в коде только флаг `is_pallet` для интеграций.
3. MC-лимит = **20 контейнеров** (настраиваемо), MC **не привязан к FCL**.
4. SCAC обязателен для Kpler — без него tracking **тихо не создаётся**.
5. Retro dispatch: **gross weight по умолчанию**, правило из `cost_segments.dispatch_scope`; **incoterm не проверяется**; доступно всем (флаг только на уровне carrier-mode и только при пересчёте).
6. Auth: **MFA нет**, PKCE нет (SPA на JWT-cookie), refresh + Redis revocation полностью реализованы; SSO generic multi-tenant.
7. Трекинг-провайдеров **четыре**: P44, Shippeo, AfterShip, Kpler.

**Оставшиеся 17 ❓ — Product-решения** (дизайн нереализованных фич + биллинг Kpler + миграция EO/CANCELLED).

---

## История

| Дата | Изменение |
|------|-----------|
| 2026-06-10 | Первая версия — 51 вопрос, 14 P0. |
| 2026-06-11 | v2: сверка с кодом (8 параллельных исследований). Закрыто 27, частично 7, осталось 17 (в осн. дизайн нереализованных Quota/EO/Pallets). |

---

## 🔗 Граф-метаданные
- **id:** `tms.open-questions`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632717345 · **repo:** `tms/OPEN-QUESTIONS.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

