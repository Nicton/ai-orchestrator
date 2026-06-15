---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/633077876
source_type: confluence
---
# RTM-02: Invoicing — Требования → Документация
## 40 требований | Источник: 10_checklist-invoicing.md

> ✅ Документация есть | 🔶 Частично | ❌ Нет

---

## Пре-инвойс: создание и управление (REQ-INV-001..013)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-INV-001 | Фильтр статуса PENDING при генерации пре-инвойса | [invoicing/README.md](../../invoicing/README.md) + [invoice-line-improvements.md](../../invoicing/invoice-line-improvements.md) | ✅ |
| REQ-INV-002 | SELECT ALL в заголовке таблицы | [invoice-line-improvements.md](../../invoicing/invoice-line-improvements.md) | ✅ |
| REQ-INV-003 | Генерация: 1 пре-инвойс на партнёра (Shipper или Carrier) | [invoicing/README.md](../../invoicing/README.md) | ✅ |
| REQ-INV-004 | Кнопка Generate Invoices для SELLER с Invoicing Creation=YES | [invoicing/README.md](../../invoicing/README.md) | ✅ |
| REQ-INV-005 | Имя пре-инвойса: PI [YYYY][MM]-[000001] (глобальный инкремент) | [invoicing/README.md](../../invoicing/README.md) | ✅ |
| REQ-INV-006 | Период отображения: последние 2 месяца + текущий | [invoicing/README.md](../../invoicing/README.md) | ✅ |
| REQ-INV-007 | 7 статусов пре-инвойса: DRAFT/PENDING/TO CHECK/BLOCKED/CHECKED/VALIDATED/CANCELLED | [02_invoicing-statuses-detail.md](../../invoicing/02_invoicing-statuses-detail.md) | ✅ |
| REQ-INV-008 | Ролевые ограничения: CREATOR vs CHECKER по статусам | [02_invoicing-statuses-detail.md](../../invoicing/02_invoicing-statuses-detail.md) | ✅ |
| REQ-INV-009 | Видимость пре-инвойса: DRAFT только CREATOR | [02_invoicing-statuses-detail.md](../../invoicing/02_invoicing-statuses-detail.md) | ✅ |
| REQ-INV-010 | Отмена пре-инвойса: снятие всех строк → PENDING | [invoicing/README.md](../../invoicing/README.md) | ✅ |
| REQ-INV-011 | Навигация: Listing / Pre-Invoices / Invoices | [invoicing/README.md](../../invoicing/README.md) | ✅ |
| REQ-INV-012 | Карточка пре-инвойса: сводная инфо + счётчики по статусам | [invoicing/README.md](../../invoicing/README.md) | ✅ |
| REQ-INV-013 | Страница деталей пре-инвойса: только привязанные строки | [invoicing/README.md](../../invoicing/README.md) | ✅ |

---

## Статусы строк и инвойс (REQ-INV-014..020)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-INV-014 | 5 статусов строки: NOT PRICED / TO CHECK / GAP / BLOCKED / CHECKED | [02_invoicing-statuses-detail.md](../../invoicing/02_invoicing-statuses-detail.md) | ✅ |
| REQ-INV-015 | Статус инвойсирования: Pending / Pre-invoiced / Invoiced / No Invoice / Cancelled | [02_invoicing-statuses-detail.md](../../invoicing/02_invoicing-statuses-detail.md) | ✅ |
| REQ-INV-016 | Gap Analysis: initial vs validated vs invoiced + % отклонения | [invoice-line-improvements.md](../../invoicing/invoice-line-improvements.md) | ✅ |
| REQ-INV-017 | Создание инвойса вручную: обязательные поля, Invoice Number уникален | [01_invoices.md](../../invoicing/01_invoices.md) | ✅ |
| REQ-INV-018 | Кредит-нота: отрицательная строка | [01_invoices.md](../../invoicing/01_invoices.md) | ✅ |
| REQ-INV-019 | Тип строки: BUY или SELL | [01_invoices.md](../../invoicing/01_invoices.md) | ✅ |
| REQ-INV-020 | SAP-экспорт: webhook при VALIDATED → SENT TO SAP | [invoicing/README.md](../../invoicing/README.md) + [02_invoicing-statuses-detail.md](../../invoicing/02_invoicing-statuses-detail.md) | ✅ |

---

## Управление инвойсом (REQ-INV-021..025)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-INV-021 | Freeze: редактирование заблокировано после VALIDATED | [02_invoicing-statuses-detail.md](../../invoicing/02_invoicing-statuses-detail.md) | ✅ |
| REQ-INV-022 | Cost Segments: настройка и применение | [invoicing/README.md](../../invoicing/README.md) | ✅ |
| REQ-INV-023 | Детализация: initial / validated / invoiced + % consume | [invoice-line-improvements.md](../../invoicing/invoice-line-improvements.md) | ✅ |
| REQ-INV-024 | Мультивалюта: Custom Currency в настройках | [invoicing/README.md](../../invoicing/README.md) | 🔶 |
| REQ-INV-025 | Массовое закрытие пре-инвойсов | [invoicing/README.md](../../invoicing/README.md) | 🔶 |

---

## Invoice Line improvements (REQ-INV-026..033)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-INV-026 | Excel-экспорт листинга строк | [invoice-line-improvements.md](../../invoicing/invoice-line-improvements.md) | ✅ |
| REQ-INV-027 | Assign/Unassign строк с инвойса | [invoice-line-improvements.md](../../invoicing/invoice-line-improvements.md) | ✅ |
| REQ-INV-028 | Фильтрация при назначении: дата / POD / Priced | [invoice-line-improvements.md](../../invoicing/invoice-line-improvements.md) | ✅ |
| REQ-INV-029 | Magic Filter: сохранение избранных запросов | [invoice-line-improvements.md](../../invoicing/invoice-line-improvements.md) | ✅ |
| REQ-INV-030 | Статус строк после назначения: PENDING → PRE-INVOICED → INVOICED | [02_invoicing-statuses-detail.md](../../invoicing/02_invoicing-statuses-detail.md) | ✅ |
| REQ-INV-031 | Empty invoice: создание без строк | [01_invoices.md](../../invoicing/01_invoices.md) | 🔶 |
| REQ-INV-032 | Ручное создание строки без привязки к SR | [01_invoices.md](../../invoicing/01_invoices.md) | 🔶 |
| REQ-INV-033 | Несколько строк на один SR (разные периоды/типы) | [01_invoices.md](../../invoicing/01_invoices.md) | 🔶 |

---

## Upload и Billing Account (REQ-INV-034..036)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-INV-034 | Upload инвойса от контрагента (PDF → форма) | [01_invoices.md](../../invoicing/01_invoices.md) | ✅ |
| REQ-INV-035 | Billing Account: привязка Buyer Accounts | ❌ Нет | ❌ |
| REQ-INV-036 | Settings hierarchy: My company > My carrier > My setting | ❌ Нет | ❌ |

**Нужно создать:** добавить §Billing Account и §Settings hierarchy в `invoicing/README.md`.

---

## UX improvements (REQ-INV-037..040)

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-INV-037 | Переименование колонки: Pick-up date → DATE с тултипом | [invoice-line-improvements.md](../../invoicing/invoice-line-improvements.md) | ✅ |
| REQ-INV-038 | Компоненты: Chat / Metadata / Documents / Notifications на уровне инвойса | [invoicing/README.md](../../invoicing/README.md) | 🔶 |
| REQ-INV-039 | Search for additional lines (матчинг по BKI/SR/tracking ref) | [invoice-line-improvements.md](../../invoicing/invoice-line-improvements.md) | 🔶 |
| REQ-INV-040 | Округление сумм до 1 знака после запятой | [invoicing/README.md](../../invoicing/README.md) | 🔶 |

---

## Итог по Invoicing

| Статус | Кол-во | % |
|--------|--------|---|
| ✅ Есть | 32 | 80% |
| 🔶 Частично | 6 | 15% |
| ❌ Нет | 2 | 5% |
| **Итого** | **40** | |

**Главный пробел:** Billing Account enhancement (REQ-INV-035) + Settings hierarchy (REQ-INV-036).

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.rtm.rtm-02-invoicing`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 633077876 · **repo:** `tms/shipments/rtm/RTM-02-invoicing.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

