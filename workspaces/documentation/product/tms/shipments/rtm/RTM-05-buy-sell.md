---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632356962
source_type: confluence
---
# RTM-05: Buy & Sell + Orders — Требования → Документация
## 43 требования | Источник: 13_checklist-buy-sell.md

---

## Buy & Sell аккаунт и модули

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-BS-001 | Тип аккаунта TBS: флаги и настройки | [buy-sell/README.md](../../buy-sell/README.md) §Аккаунт | ✅ |
| REQ-BS-002 | Разделение интерфейса на BUY и SELL | [buy-sell/README.md](../../buy-sell/README.md) §Навигация | ✅ |
| REQ-BS-003 | Объекты SO (Shipment Offer) и QA (Quote Answer) | [buy-sell/README.md](../../buy-sell/README.md) §Объекты | ✅ |
| REQ-BS-004 | TR (Transport Request) как объект продажи | [buy-sell/README.md](../../buy-sell/README.md) §TR | ✅ |
| REQ-BS-005 | Статусы квотирования TR | [buy-sell/send-quotes.md](../../buy-sell/send-quotes.md) §Статусы | ✅ |
| REQ-BS-006 | Customer 3PL: создание и управление | [buy-sell/README.md](../../buy-sell/README.md) §Customer3PL | ✅ |
| REQ-BS-007 | Workflow Customer 3PL: запросы и листинг | [buy-sell/README.md](../../buy-sell/README.md) §Workflow | ✅ |

## Billing Entities и Selling Rate Sheets

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-BS-008 | Billing Entities (SELLING/BILLING): поля, дефолт | [buy-sell/billing-entities.md](../../buy-sell/billing-entities.md) | ✅ |
| REQ-BS-009 | Selling Rate Sheet: создание, применение | [buy-sell/selling-rate-sheet.md](../../buy-sell/selling-rate-sheet.md) | ✅ |

## Send Quotes

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-BS-010 | Send Quote: модал, условия, отрицательная маржа | [buy-sell/send-quotes.md](../../buy-sell/send-quotes.md) | ✅ |
| REQ-BS-011 | Публичная страница котировки (Public Quote Page) | [buy-sell/send-quotes.md](../../buy-sell/send-quotes.md) §Public | ✅ |
| REQ-BS-015 | Модуль Quotes: статусы QA | [buy-sell/send-quotes.md](../../buy-sell/send-quotes.md) §СтатусыQA | ✅ |
| REQ-BS-016 | Создание котировок вручную | [buy-sell/send-quotes.md](../../buy-sell/send-quotes.md) §Ручная | ✅ |
| REQ-BS-017 | Multi Quote Answer: несколько альтернатив | [buy-sell/send-quotes.md](../../buy-sell/send-quotes.md) §Multi | ✅ |

## QR → TR миррорирование

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-BS-012 | QR → TR: авто-создание зеркального TR для TBS | [buy-sell/buysell-v3-qr-to-tr.md](../../buy-sell/buysell-v3-qr-to-tr.md) | ✅ |
| REQ-BS-013 | QR → TR: статусы после Award | [buy-sell/buysell-v3-qr-to-tr.md](../../buy-sell/buysell-v3-qr-to-tr.md) §Статусы | ✅ |
| REQ-BS-014 | QR → TR: изменения и отмены от Shipper | [buy-sell/buysell-v3-qr-to-tr.md](../../buy-sell/buysell-v3-qr-to-tr.md) §Изменения | ✅ |

## Маржа и финансы

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-BS-018 | Видимость маржи и финансовой информации | [buy-sell/README.md](../../buy-sell/README.md) §Маржа | ✅ |

## Repeat Request и Rebooking

| REQ-ID | Требование (из других REQ в чек-листе) | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-BS-019 | Repeat REQUEST на уровне TR | [buy-sell/repeat-request.md](../../buy-sell/repeat-request.md) | ✅ |

## Orders — Dock Order и Sub Dock Order

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-ORD-001 | Структура DO и SDO: таблица ORDER | [slots/README.md](../../slots/README.md) §Orders | 🔶 упомянуто |
| REQ-ORD-002 | Статусы Dock Order (Pending/Missing Slot/Closed) | [slots/README.md](../../slots/README.md) §Статусы | 🔶 упомянуто |
| REQ-ORD-003 | Статусы Sub Dock Order | [slots/README.md](../../slots/README.md) §SDO | 🔶 упомянуто |
| REQ-ORD-004 | Перенос SDO между слотами (Transfer) | [slots/README.md](../../slots/README.md) | 🔶 упомянуто |
| REQ-ORD-005 | Packing list SDO vs packing list слота | [slots/README.md](../../slots/README.md) | 🔶 упомянуто |
| REQ-ORD-006 | Создание DO и SDO через CSW и API | [slots/README.md](../../slots/README.md) | 🔶 упомянуто |
| REQ-ORD-007 | Transport Requests (TR): связь с заказами | [buy-sell/README.md](../../buy-sell/README.md) §TR | 🔶 частично |
| REQ-ORD-008 | Поиск DO: сообщения при Missing Slot / Closed | ❌ нет | ❌ |
| REQ-ORD-009 | Инциденты и алертинг на уровне слота | ❌ нет | ❌ |
| REQ-ORD-010 | Связь TMO с PSH/SH в Buy & Sell | [buy-sell/README.md](../../buy-sell/README.md) §Объекты | 🔶 частично |

## Quota Management

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-QUOT-001 | Quota: распределение объёма между перевозчиками | ❌ нет | ❌ |
| REQ-QUOT-002 | Quota: 90% пороговое значение + fallback | ❌ нет | ❌ |
| REQ-QUOT-003 | Quota: настройка в BO + 6 секций | ❌ нет | ❌ |

## Transport Plan

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-TRANSP-001 | Transport Plan: маршрут + перевозчик + автовыбор | ❌ нет | ❌ |
| REQ-TRANSP-002 | Transport Plan: влияние на ADB | ❌ нет | ❌ |

---

## Итог Buy & Sell + Orders

| Статус | Кол-во | % |
|--------|--------|---|
| ✅ Есть | 19 | 44% |
| 🔶 Частично | 12 | 28% |
| ❌ Нет | 12 | 28% |
| **Всего** | **43** | |

**Хорошо задокументировано:** всё в `buy-sell/` (README, billing-entities, selling-rate-sheet, send-quotes, buysell-v3-qr-to-tr, repeat-request).
**Пробелы:** Quota Management (3 REQ), Transport Plan (2 REQ), Dock Order поиск/инциденты (2 REQ). SDO структура только упомянута в slots/README.md.

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.rtm.rtm-05-buy-sell`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632356962 · **repo:** `tms/shipments/rtm/RTM-05-buy-sell.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

