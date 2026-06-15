---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632651842
source_type: confluence
---
# TMS — Спорные вопросы и пробелы (из видео-инструктажей)

> Источники: видео Part 2/4, тест-кейсы Qase, слайды. **2026-06-11: сверка с кодом** — ✅ ответ из кода, ⚠️ частично, ❓ Product.

## 1. Orders

| # | Вопрос | Ответ |
|---|--------|-------|
| 1.1 ✅ | Кому доступна вкладка Orders? | Флаг **`shipper.can_manage_orders`** (default false, `models/shipper.js:96`) + ACL-роли `t_order`/`t_order_line`/`t_order_mod`; фронт: `accessOrders()` (`permissions-control.js:28`). Включается избранным клиентам через Admin. |
| 1.2 ✅ | Orders v3.0 vs v4.0 | Версионирования в коде **нет** — PO 3.0/4.0 это нумерация тест-сьютов. Эволюция полей через миграции 2025 (buyer/seller_partner_id, order_name). |
| 1.3 ✅ | C-Shadow | **В коде не существует** (грепы пустые) — документировать нечего; вероятно жаргон/устаревшее. |
| 1.4 ✅ | Product Database | Модель **`product`**: code, name, category, unit, hs_code, cost, sales_price, currency, weight, carrier_instructions, supplier (`models/product.js`). Используется в order_product и SR-позициях. CRUD: `/api/v1/products`. |

## 2. RTB (Ready to Book)

| # | Вопрос | Ответ |
|---|--------|-------|
| 2.1-2.3 ✅ | RTB = Draft или отдельный статус? | **Отдельный статус** `ready_to_book` в SR: `new → ready_to_book → sent_to_carrier → awarded → confirmed` (`shipment_request.js:718,825`). В booking list — собственная вкладка **«Ready to book»** (синяя, `shipment_request_statuses.js:29`). Qase-кейс 1340 «включается фильтр Draft» — **подтверждена copy-paste ошибка**. |

## 3. Multi-Container

| # | Вопрос | Ответ |
|---|--------|-------|
| 3.1 ✅ | 1 контейнер = MC? | Да: `checkIfMulticontainer()` = наличие контента с `is_container` (`shipments/helper.js:154`) — даже один контейнер помечает SR как multicontainer. |
| 3.2 ✅ | 4 контейнера → 4 чего? | **4 Shipment-«брата»** (общий `pre_shipment_id`/SR, сервис `shipment_brothers.js`) — отсюда 4 строки в Tracking List. SR один. |
| 3.3 ✅ | Milkrun + MC | Ограничений **нет** — `is_multicontainer` участвует в условной логике (attachments, MD), но MC-shipment можно добавлять в milkrun-группы (`milkrun/index.js:1965`). |

## 4. Статусы Tracking Points

| # | Вопрос | Ответ |
|---|--------|-------|
| 4.1 ✅ | Expected Pick-up | Это **статус Shipment** (`shipment.js:337`), не TP — выставляется бизнес-логикой по времени, не запросом к P44/Shippeo (те присылают TP-события). |
| 4.2 ✅ | Slot Confirmed | Тоже **статус Shipment** (`shipment.js:345`), параллельный; `SlotTrackingPoint.Types` — отдельная система этапов слота на доке. Не замена. |
| 4.3 ✅ | TP при отмене Shipment | TP **сохраняются** (история, paranoid); отменяются связанные slots/visits (`shipments.js:1755-1773`); создаётся чат-пост с `cancellation_data`. |

## 5. Invoicing

| # | Вопрос | Ответ |
|---|--------|-------|
| 5.1 ❓ | Gap Analysis — кто разрешает? | Бизнес-процесса в коде нет — статус информационный. Ответственный (Shipper vs AM) — Product. |
| 5.2 ✅ | FREEZE — можно ли Credit Note? | FREEZE = проверки на VALIDATED (строки/payment terms блокируются, `invoices/index.js:677,711`). **Credit Note возможен** — это отрицательная строка нового инвойса (INV-018), не правка замороженного. SAP-экспорт после FREEZE **не реализован** (только generic webhook). |
| 5.3 ✅ | Pre-Invoice vs Invoice | Жизненный цикл строк: PENDING → PRE-INVOICED → INVOICED; pre-invoice и invoice — разные объекты с одинаковым Assign/Unassign UI; создавать может и Carrier (upload PDF → PENDING), и система из pre-invoice. |
| 5.4 ✅ | Detailed Costs vs Cost Segments vs Pre-Invoice | **Три разные сущности**: Cost Segments — справочник статей затрат (RS/инвойсинг); Detailed Costs — построчные цены TR (selling/purchase, `transport_request_detailed_costs.js`); Pre-Invoice — контейнер строк до инвойса. |

## 6. Claims

| # | Вопрос | Ответ |
|---|--------|-------|
| 6.1 ✅ | Статусы Claims | **NEW, CANCELED, SENT_TO_CARRIER, INCOMPLETE, REJECTED, UNSOLVED, ACCEPTED, REFUSED** + statuses_matrix (`models/claim.js:42,158`). |
| 6.2 ✅ | Кто открывает | Создание — shipper-сторона (кнопка Open Claim); права через ACL-модуль `claims`; carrier отвечает на SENT_TO_CARRIER (accept/reject/incomplete). |
| 6.3 ✅ | Связь с Invoice | Прямой связи в коде **нет** — независимые сущности (claim → shipment_id). |

## 7. Galaxy / Multi-Account

| # | Вопрос | Ответ |
|---|--------|-------|
| 7.1 ✅ | Видимость Galaxy Owner | Через **дочерние аккаунты Constellation** (galaxy_id→shipper) и **ManagedAccount** (`galaxies/accounts.js:42-99`), **не** через общих carriers. |
| 7.2 ✅ | Managed Account и SR | Поля `is_managed` нет — есть **`managed_by_account_id`** (`account.js:129`). Запрет создания SR — не жёсткий constraint, а ACL/настройки приложения. |
| 7.3 ✅ | Connected Galaxy vs Constellation | В коде существует только **Constellation** (модель с galaxy_id). «Connected Galaxy» как сущности нет — терминологический дубль. |

## 8. Buy & Sell (TBS)

| # | Вопрос | Ответ |
|---|--------|-------|
| 8.1 ✅ | NO CUSTOMER | Создаётся обычный **SR**; Transport Requests генерируются из SR (`transformShRequestToTransportRequests()`, helper.js:299). Без клиента TR-цепочка не нужна. |
| 8.2 ✅ | Когда видна маржа | `buildMargin()` = requested_price − purchased_cost — считается, когда есть **обе цены** (selling задана и закупка известна, т.е. после award). |
| 8.3 ✅ | TBS = Shipper И Carrier? | **Да, уже работает**: в Account оба FK nullable — `shipper_id` и `carrier_id` могут быть заполнены одновременно (`account.js:20-28`). |
| 8.4 ✅ | Конфликт Default Billing Entity | Невозможен: при `is_default=true` остальные сущности шиппера автоматически сбрасываются в false (`accounting_entities.js:428-440`). Ни блока, ни предупреждения не нужно. |

## 9. Rate Sheets

| # | Вопрос | Ответ |
|---|--------|-------|
| 9.1 ✅ | Selling RS — активация | Отдельного флага нет — доступ через продукт **`PRODUCT_tms_buy_sell`**; у RS общий `is_active`. |
| 9.2 ✅ | Fuel Surcharge | **Cron-обновления НЕТ** — только ручная загрузка XLS (`fuel_surcharge_sheets`: year/month/value + rate_sheet_upload). Формулировка «обновляется cron» в доках неверна → исправить. |
| 9.3 ✅ | LOCODE RS | `is_locode_based=true` + спец-подтипы `SubRate.LOCODE_TYPES` (FROM_LOCODE_TO_POL, POD_TO_LOCODE, POL_TO_POD, *_FLAT_FEE...) и отдельный калькулятор `rateSheets/calculations/locode/` — структура отличается от стандартной. |

## 10. Notifications / Followers

| # | Вопрос | Ответ |
|---|--------|-------|
| 10.1 ✅ | Default Followers | Автоматического набора **нет** — followers выбираются вручную (My Team/Partners); при апдейтах наследуются (подтверждено автотестом `followerTests/defaultFollowers.js`). |
| 10.2 ✅ | Чат vs shipment followers | **Одна система**: `msg_members` + `MsgNotifUser` со scope-флагами (is_tracking, is_quotes, is_invoicing, is_claims, is_slots...). «Followers shipment» = tracking-scope подписчики его треда. |
| 10.3 ✅ | Пустой список | Явного fallback «отправить всем» нет — работают **NOTIFICATION_RULES** (создатель на shipper-стороне; carrier-пользователи по правилам событий, `services/notifications.js:46-100`). |

## 11. FreeTM / TM Light

| # | Вопрос | Ответ |
|---|--------|-------|
| 11.1 ✅ | Что отключает freemium | Почти ничего напрямую: `is_freemium` влияет на заголовок UI и скрытие billing_data. Реальные ограничения — через **продукты** (PRODUCT_tms_light/standard/advanced/slot_book/buy_sell). |
| 11.2 ✅ | Book a Transport vs Book a Slot | Раздельные продукты: `PRODUCT_tms_slot_book` (Book Slot) vs TMS-продукты; кнопки/меню строятся по продуктам аккаунта (`global.js:241`, `canBookSlot()`). |

---

## Итог

**29 из 32 вопросов закрыто кодом**; 1 ❓ Product (5.1 Gap Analysis — владелец процесса); находки: RTB — отдельный статус (ошибка в Qase-кейсе 1340 подтверждена), C-Shadow не существует, **Fuel Surcharge без crona** (док требует правки), TBS-двойственность уже работает.

| Дата | Изменение |
|------|-----------|
| 2026-06-10 | Список вопросов из видео. |
| 2026-06-11 | Сверка с кодом (3 параллельных исследования): 29✅/2⚠️/1❓. |

---

## 🔗 Граф-метаданные
- **id:** `tms.open-questions-video`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632651842 · **repo:** `tms/OPEN-QUESTIONS-VIDEO.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

