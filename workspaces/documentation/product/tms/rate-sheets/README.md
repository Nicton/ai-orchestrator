---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631799859
source_type: confluence
---
# Rate Sheets (Тарифные листы)

Rate Sheets — тарифные таблицы, по которым рассчитывается стоимость перевозки. Carrier настраивает тарифы для конкретного Shipper'а (или глобально), система автоматически подставляет цену при создании QR.

## Кто использует

- **Carrier** — создаёт и управляет своими тарифами
- **Shipper** — видит применённые тарифы в котировках
- **Admin** — полный доступ

---

## Страницы

| URL | Описание |
|-----|---------|
| `/rate-sheets` | Список всех тарифных листов |
| `/rate-sheets/add` | Создать новый |
| `/rate-sheets/{id}` | Детали (5 табов) |
| `/rate-sheets/{id}/rules` | Правила тарификации |
| `/rate-sheets/{id}/leadtime` | Сроки доставки |
| `/rate-sheets/{id}/settings` | Настройки |
| `/rate-sheets/{id}/fuel-surcharge` | Топливная надбавка |

---

## Структура Rate Sheet

```
RateSheet
  ├── Базовый тариф (фрахт)
  ├── Rules (правила) — условия применения тарифа
  │   ├── By weight range (50-100 kg → X EUR/kg)
  │   ├── By volume range
  │   ├── By route (Locations A→B)
  │   └── By cargo type
  ├── Leadtime — сроки доставки по маршрутам
  ├── Fuel Surcharge — топливная надбавка (%)
  └── Settings — настройки применения
```

---

## Табы Rate Sheet

### Таб: Rules (Правила)

Условия, при которых применяется этот тариф:

| Поле | Описание |
|------|---------|
| Weight range | Диапазон веса (от / до) |
| Volume range | Диапазон объёма |
| Маршрут | От / До локации |
| Cargo type | Тип груза |
| Цена | EUR/kg или фиксированная |
| Валюта | Валюта тарифа |

### Таб: Leadtime (Сроки)

Сколько дней занимает доставка по конкретным маршрутам:

| Откуда | Куда | Дней |
|--------|------|------|
| Paris | Lyon | 1 |
| Paris | Berlin | 3 |

### Таб: Fuel Surcharge (Топливная надбавка)

- Процент от базовой стоимости
- ⚠️ По коду (2026-06-11): **обновляется только вручную** (загрузка XLS через rate_sheet_upload) — cron-обновления нет

---

## Как Rate Sheet применяется при QR

```
Shipper создаёт QR
    ↓
Система находит Rate Sheets для каждого Carrier
    ↓
Для каждого Rate Sheet проверяет Rules:
  вес груза попадает в диапазон?
  маршрут совпадает?
  тип груза разрешён?
    ↓
Если правило подходит → цена рассчитывается автоматически
    ↓
Carrier видит предзаполненную цену в форме котировки
  (может изменить)
```

---

## Мутации

**Создание Rate Sheet:**
- `RateSheet` создаётся
- `RateSheetRule[]` создаются

**Применение при QR:**
- `Quote.price` рассчитывается из `RateSheet`
- `Quote.rate_sheet_id` привязывается

---

## Backend

- Модели: `app/models/rate_sheet.js`, `app/models/rate_sheet_rule.js`
- Frontend: `workspaces/frontend/public/app/rateSheets/`
- ~~Cron: обновление fuel surcharge~~ — ⚠️ по коду cron-задачи нет; модель fuel_surcharge_sheets (year/month/value) наполняется вручную

---

## 🔗 Граф-метаданные
- **id:** `tms.rate-sheets`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631799859 · **repo:** `tms/rate-sheets/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

