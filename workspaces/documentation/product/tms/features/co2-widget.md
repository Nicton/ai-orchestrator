---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632881186
source_type: confluence
---
# CO2 Widget — Виджет углеродного следа

Переработанный виджет расчёта CO2 с поддержкой нескольких источников данных.

> Источник: слайд `2026 03 - CO2 widget`

> ⚠️ **СТАТУС ПО КОДУ (2026-06-11): multi-source виджет НЕ реализован.** Реально работает только batch-интеграция EcoTransit по SFTP (`backend/app/services/integration/ecotransit/`), значение перезаписывается в `shipments.co2_amount` без хранения источника. DHL API как источник CO2 — нет; усреднения — нет. Ручной ввод CO2 — **только Carrier** через Public API `POST /shipments/co2` (`requireCarrier`). Всё описанное ниже — дизайн будущей фичи.

---

## Основное отображение

```
Carbon Footprint: 145 kg CO2e  WTW  |  832 km
```

| Компонент | Описание |
|-----------|---------|
| Значение | В kg CO2e |
| Scope label | WTW (Well-to-Wheel) или TTW (Tank-to-Wheel) |
| Дистанция | В км |

---

## Multi-source режим

Если несколько источников данных — показывается среднее:

```
Average (3)  →  показывается среднее по 3 источникам
```

### Источники данных

| Источник | Описание |
|---------|---------|
| **EcoTransit** | Основной расчётный движок |
| **DHL API** | Данные от DHL напрямую |
| **Manual Entry** | Ручной ввод пользователем |
| **EcoTransit Benchmark** | Бенчмарк EcoTransit |

---

## Детализация загрязнителей

На каждый источник:
- CO2e
- NOx
- SOx
- NMHC
- PM (мелкие частицы)

---

## Manual Override

| Поле | Тип | Обязательное |
|------|-----|-------------|
| Distance (km) | Number | ✅ |
| CO2e WTW (kg) | Number | ✅ |
| CO2e TTW (kg) | Number | — |

---

## Ошибки источника

Источник с ошибкой показывается:
```
[FAILED]  ← красный бейдж
  ▼  HTTP 502 Bad Gateway  ← раскрываемый лог
```

---

## Jira

Редизайн CO2 модала: [TMS-2922](https://shiptify.atlassian.net/browse/TMS-2922)

---

## 🔗 Граф-метаданные
- **id:** `tms.features.co2-widget`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632881186 · **repo:** `tms/features/co2-widget.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

