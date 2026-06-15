---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631931011
source_type: confluence
---
# Orders (DO/SDO) и Transport Plan

> Источник требований: REQ-ORD-001..010, REQ-TP-001..010 | Слайды: 2025 07 - Order Structure DO and SDO, 2025 06 - Transport Plan V2

---

## Структура заказов: DO и SDO (REQ-ORD-001)

Таблица ORDER содержит три типа объектов:

| Тип | Описание |
|-----|----------|
| **TM Orders** | Заказы из TMS-модуля |
| **Dock Orders (DO)** | Основные заказы на поставку |
| **Sub Dock Orders (SDO)** | Бронирование конкретного слота под DO |

SDO имеет ту же структуру, что DO, плюс обязательное поле `father_id` (ссылка на DO).

Один DO может содержать несколько SDO. Изменения схемы DO автоматически применяются к SDO.

*Исторически:* `db.orders` → DO, `db.order_lines` → SDO.

---

## Статусы Dock Order (REQ-ORD-002)

| Статус | Условие |
|--------|---------|
| **Pending** | DO создан, не закрыт |
| **Missing Slot** | Нет SDO, назначенных на слот, и DO вышел за пределы диапазона доставки |
| **Closed** | Закрыт автоматически или вручную; переход обратно в Pending возможен |
| **Cancelled** | DO отменён |

---

## Статусы Sub Dock Order (REQ-ORD-003)

| Статус | Условие |
|--------|---------|
| **Planned** | SDO назначен на слот, без обновлений статуса слота |
| **Transferred** | SDO перенесён на другой слот (создаётся копия; исходный → Cancelled) |
| **Picked-up** | Слот объявлен LOADED |
| **Delivered** | Слот объявлен UNLOADED |
| **Cancelled** | Слот отменён/отклонён или перенесён |

---

## Перенос SDO между слотами (REQ-ORD-004)

| Случай | Поведение |
|--------|----------|
| Слот моно-SDO | Модал: «Отменить исходный слот?» (по умолчанию YES) |
| Слот мульти-SDO | Модал: «Обновить упаковочный лист исходного и целевого слота?» |

При переносе: исходный SDO → Transferred/Cancelled; создаётся **новый SDO** на целевой слот.

Полная история переносов сохраняется через цепочку: SDO1 → SDO2 → SDO3.

---

## Упаковочный лист SDO vs слота (REQ-ORD-005)

- Пакинг-лист SDO копируется из DO
- Изменение при бронировании создаёт **новый SDO** с изменённым составом
- **Пакинг-лист слота** = сумма пакинг-листов всех SDO в слоте (одинаковые типы консолидируются)
- Пользователь может изменить любое поле пакинг-листа слота независимо от SDO
- Вместимость слота рассчитывается по пакинг-листу **слота**, а не SDO

---

## Создание DO и SDO (REQ-ORD-006)

- DO и SDO создаются через CSW (wizard бронирования)
- DO из CSW могут скрываться (флаг `is_invisible`)
- Нераспознанные заказы из slotify/slotbook создают DO/SDO с флагом источника; такие DO скрыты — видны только SDO
- При бронировании нового слота из DO → всегда создаётся **новый SDO** для трассируемости
- API и XML (SOMFY) поддерживаются без изменений

---

## Transport Request (TR): связь с заказами (REQ-ORD-007)

- TR генерируется из QA (Buy & Sell) или создаётся вручную в модуле Booking → Transport Request
- TR может быть разбит на **SubTR** (leg A→C и C→B); обратное слияние — при совпадении точек
- Стоимость (buying cost) распределяется (dispatch) по TR при подтверждении SR
- Отображение TR: строки заказов с раскрытием SubTR

---

## Сообщения при поиске DO (REQ-ORD-008)

| Статус DO | Сообщение |
|-----------|----------|
| Closed | Инструкция с контактами PML для повторного открытия |
| Missing Slot | Диапазон доставки + контакты PML (телефон + email) |

В листинге DO: убраны колонки Origin/Destination (дублируют Supplier/Recipient). Даты в двух колонках Min/Max; если Min = Max → показывается одна.

---

## Инциденты и алертинг на уровне слота (REQ-ORD-009)

| Алерт | Условие |
|-------|---------|
| BOOKER over-booked | Пакинг-лист слота превышает норму |
| BOOKER under-booked | Пакинг-лист слота меньше нормы |
| CMR Reserve | При LOADED/UNLOADED → уведомление carrier/shipper/dock/TMS |

Предварительный алерт при расхождении суммы SDO и зафиксированного пакинг-листа слота.

---

## Иерархия объектов TBS (REQ-ORD-010)

```
1 SR = N PSH/SH = N QR = 1 SO = N QA = N PSH/SH = N TR
```

- TR #N связывается с PSH
- Несколько TR с одинаковым origin/destination → группируются в один PSH
- При подтверждении SH: все связанные объекты получают ссылки `root_sr_id`, `root_qr_id`, `root_sh_id`, `root_slot_id`
- При цепочке TBS→TBS: Slot ID остаётся **одним и тем же** через все аккаунты

---

## Transport Plan V2 — Расширенные настройки

### Управление строками плана (REQ-TP-001..003)

| Функция | Описание |
|---------|----------|
| Копирование строки | Кнопка Copy → предзаполненный модал; поле Name очищается |
| Имя плана | Необязательное поле; фильтр поиска по имени |
| Email спектатора | Опциональное поле для трекинга отгрузки (аналогично CSW) |

### Ограничение по сущностям (REQ-TP-004)

- Пользователь выбирает одну или несколько entities для ограничения применимости
- Если entities не заданы — план применяется для любой сущности
- Проверка entities выполняется **до** географической фильтрации

### Ограничение по специфике груза (REQ-TP-005)

| Поле | Логика |
|------|--------|
| Specificities | Если хотя бы одна специфика груза не совпадает — план исключается |
| Goods type | Аналогичная логика |

Если поле не задано — план применяется для любых грузов.

### Опасные грузы (REQ-TP-006)

| Тоггл Dangerous Goods | Поведение |
|-----------------------|----------|
| NO (по умолчанию) | Опасные грузы исключены |
| YES, без DGD ID | Все опасные грузы приняты |
| YES, с DGD ID | Приняты только указанные DGD |

Тоггл **Exclude Stacked Content**: при YES — исключает контент с флагом stacked.

Обычные (не опасные) грузы всегда принимаются независимо от тоггла.

### Ограничения по инкотермам (REQ-TP-007)

| Вариант | Описание |
|---------|----------|
| По умолчанию | Все BUY & SELL инкотермы разрешены |
| Отключить BUY инкотермы | С возможностью ограничения до конкретных |
| Отключить SELL инкотермы | Аналогично |
| Оба отключены | План несовместим с любым зафиксированным инкотермом |

### Весовые и объёмные ограничения (REQ-TP-008..009)

**На уровне отправки:**

| Ограничение | MIN / MAX |
|-------------|-----------|
| Total Weight | ✅ |
| Total Chargeable Weight | ✅ |
| Total Cargo Number | ✅ |
| Total Volume | ✅ |
| Total Linear Meter | ✅ |

Если объём или LM отсутствует в SR, а MIN/MAX заданы — план исключается.

**На уровне единицы контента:**

Length, Width, Height, Weight — MIN/MAX. Если единица выходит за пределы хотя бы одного ограничения — план исключается.

### Групповой трекинг (REQ-TP-010)

Система определяет группировку PSH:

| Группа | Критерий |
|--------|----------|
| Pick Up Grouping | Одинаковый origin |
| Delivery Grouping | Одинаковый destination |
| Full Group | Оба критерия |

При групповом трекинге:
- Событие DEPARTURE → реплицируется на все SH в Pick Up Group
- Событие ARRIVAL → реплицируется на Delivery Group
- Системный запрос: «Применить событие ко всем связанным SH?»

---

## Связанные функции

| Функция | Документ |
|---------|----------|
| Buy & Sell аккаунт | [README.md](./README.md) |
| Dock Orders в слотах | [../slots/README.md](../slots/README.md) |
| Expected Orders (EO) | [../features/expected-orders.md](../features/expected-orders.md) |

---

## Сверено с кодом (2026-06-11) — поля ограничений Transport Plan (REQ-TP-004..010)

Все ограничения существуют в модели `transport_plans.js:72-194` + связанных таблицах:

| Ограничение | Реализация |
|-------------|-----------|
| Accounting entities (TP-004) | `transport_plan_entities` (accounting_entity_id) |
| Cargo specificities (TP-005) | `transport_plan_specificities` (spec_id) |
| Dangerous goods DGD (TP-006) | `transport_plan_dangerous_good_descriptions` |
| Incoterms (TP-007) | `transport_plan_incoterms` (code, type) |
| MIN/MAX weight / CW / volume / LM (TP-008) | `min/max_total_weight`, `_chargeable_weight`, `_volume`, `_linear_meter` |
| Unit-level лимиты (TP-009) | `min/max_unitary_length/width/height/weight` + `exclude_stacked_content` |
| Insured value | `min/max_insured_value`, `insured_currency_id` |
| Group tracking (TP-010) | ⚠️ частично: только JSONB-объекты `pickup`/`delivery`; явных Pick Up/Delivery/Full Grouping флагов нет |

Валидации диапазонов — `services/transportPlans/query.js:55-105` (`rangeCondition()`).

---

## 🔗 Граф-метаданные
- **id:** `tms.buy-sell.orders-transport-plan`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631931011 · **repo:** `tms/buy-sell/orders-transport-plan.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

