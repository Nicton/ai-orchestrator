---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632258577
source_type: confluence
---
# AMOpps — Управление возможностями (Account Manager Opportunities)

Новая система отслеживания возможностей продаж по каждому продукту для каждого аккаунта.

> Источники: `2026 03 - Sales Account AMOpps`, `2026 03 - AM v1.1`, `2026 03 - AM v1.3 Dashboards`, `2026 05 - BO AM 1.3`

---

## Что такое AMOpps

AMOpps — система отслеживания Coverage/Pipeline функций Shiptify у каждого клиента.

Для каждого аккаунта можно отметить статус по каждому продукту.

### Семейства продуктов

**TM (Transport Management):**
- Plug & Play
- Labelling
- Seatrack
- Invoicing
- Control Tower
- API Connection

**Dock:**
- Plug & Play
- Visit
- Driver Welcome
- API Connection

---

## Статусы AMOpps

| Статус | Описание |
|--------|---------|
| **Covered** 🟢 | Клиент использует |
| **Pending** 🔵 | В процессе продажи/активации |
| **N/A** ⚫ | Не применимо |
| **I don't know** 🟠 | Неизвестно |

---

## Поля в модале AMOpps

| Поле | Обязательное | Условие |
|------|-------------|---------|
| STATUS | ✅ | Всегда |
| NOTES | — | Авто-расширяется |
| VALUE | Только если Pending/Refused/Competitor | Числовое значение в EUR |

---

## AMOpps listing (глобальный)

Новая страница с двухуровневой группировкой колонок (L1/L2).

Формат суммы: `"16,0 k euro"` — отсортировано по убыванию Pending суммы.

---

## Новые поля Sales Account (AM 1.3 + BO AM 1.3)

### Категоризация (новые поля)

| Поле | Тип |
|------|-----|
| Role | String |
| Size | String |
| Business | String |
| Sub-business | String |
| ERP | Dropdown: SAP, Oracle, Odoo, Others |
| WMS | Dropdown: Generix, Reflex, Sitaci, Mecalux, SAP, Others |

### 9 boolean флагов

Manufacturer / Retailer B2C / Retailer B2B / E-marketplace / Contract Logistics / Forwarding Air/Sea / Forwarding Road / Customs broker / Carrier

---

## Group (переименование)

| Старое | Новое |
|--------|-------|
| Top 1 (красный) | **VHP** — Very High Potential |
| Top 2 (оранжевый) | **Potential** |
| Top 3 (синий) | **Tapped** |

Редактирование Group ограничено: только `rco@shiptify.com`, `laure.flotard@shiptify.com`.

---

## Конкуренты (новое поле)

Dropdown: Excel/Mail, DDS, MyTower, Tesisquare, SAP, Oracle, Dashdoc, Transporeon, Generix, Alpega, GoRamp, Other

Новый дашборд: competitor MRR.

---

## AM Dashboard (v1.3)

Три виджета:

| Виджет | Данные |
|--------|--------|
| **Customers** | Mood / churn по клиентам |
| **Touchpoints** | Количество TP per AM per month |
| **AMOpps** | Pipeline по функциям |

---

## Иерархия аккаунтов (v1.1)

Новая 3-уровневая структура:
```
N Ops Accounts → 1 Billing Account → 1 Sales Account
```
Раньше было только 2 уровня.

---

## Контактная информация

| Поле | Новое значение |
|------|---------------|
| Count column | 0 контактов → ORANGE тег, 1+ → Very Light Blue |
| Per-contact last TP duration | Показывается рядом с контактом |

---

## Референсы

- [AM categorization reference](https://docs.google.com/spreadsheets/d/1C7mhFxe5GKz_g3xOKPWDPiavfTcGXWxoCQwFutIXLGw/edit?gid=1133164459)

---

## 🔗 Граф-метаданные
- **id:** `back-office.am.amopps`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 632258577 · **repo:** `back-office/am/amopps.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

