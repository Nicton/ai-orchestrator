---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632848465
source_type: confluence
---
# Dashboard — Вкладки, метрики и фильтры

> Источник требований: REQ-OCR-003 | Слайды (OCR): 2023 08 SAN - Update field in Dashboard screen | Верифицировано по коду 2026-06-11

---

## Вкладки главного дашборда

Константы вкладок: `frontend/public/app/tabs/index.js:1-157`.

| Вкладка (код) | FR-название (из слайдов) | Содержимое |
|---------------|--------------------------|-----------|
| TAB_NAME_TODAY | AUJOURD'HUI | Снимок на сегодня: прибытия/отправления |
| TAB_NAME_GENERAL | GENERAL | Сводные KPI (см. ниже) |
| TAB_NAME_QUOTES | COTATIONS À SUIVI | Статистика котировок (QR) |
| TAB_NAME_TRACKING | SUIVI | Проблемные перевозки, задержки |
| TAB_NAME_INVOICING | FACTURATION | Финансовые KPI |
| TAB_NAME_MONITORING | MONITORING | Мониторинг очередей и интеграций |
| TAB_NAME_CO2 | CO2 | Углеродный след (EcoTransit) |

---

## Метрики вкладки GENERAL

Контроллер: `dashboard/controllers/dashboard/general.js:50-100`.

| Метрика | Описание | Кому видна |
|---------|----------|-----------|
| Shipments | Количество отправок за период | Всем |
| Expenses | Расходы (в валюте аккаунта) | Всем |
| Quoting Time | Среднее время котировки («Délai de cotation») | Shipper |
| Savings | Экономия | Shipper |
| Mutualization Savings | Экономия от ретро-консолидации: `Sum(IC − MC, MC > 0)` | Shipper |

График «Nombre d'Expéditions» — тренд количества отправок за выбранный период.

> ⚠️ «Total Linear Meters» из слайдов в текущем коде вкладки GENERAL не найден — метрика либо убрана, либо в Power Data.

---

## Фильтры дашборда

Общие для вкладок (`dashboard/controllers/dashboard.js:26-100`):

| Фильтр | Описание |
|--------|----------|
| Date range | Диапазон дат |
| Carriers | Перевозчик(и) |
| From / To | Локации маршрута |
| Modes | Sea / Road / Air / Express |
| Accounting entities | Учётные сущности |
| Allowed shippers/carriers | Ограничение по доступу (multi-account/Galaxy) |

---

## Связанные документы

| Документ | Что покрывает |
|----------|--------------|
| [README.md](README.md) | Все дашборды: tracking, multivision, CO2, claims |
| [../features/co2-widget.md](../features/co2-widget.md) | CO2: статус по коду (SFTP batch) |
| [../features/retro-consolidation.md](../features/retro-consolidation.md) | Mutualization savings |

---

## 🔗 Граф-метаданные
- **id:** `tms.dashboards.dashboard-tabs`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632848465 · **repo:** `tms/dashboards/dashboard-tabs.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

