---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/630390877
source_type: confluence
---
# Retro Consolidation — Финансовая консолидация отправок

> Источник требований: REQ-RS-013..020, REQ-TRACK-011..012, REQ-TRACK-015 | Слайды: 2025 06 - Retro Consolidation, SEA FREIGHT RATE SHEET STRUCTURE

---

## Концепция

Retro Consolidation (ретро-консолидация) — механизм **финансовой группировки** нескольких отправок задним числом. Позволяет пересчитать стоимость перевозок по консолидированному объёму (например, если несколько мелких отправок можно объединить в один тариф), что снижает итоговую стоимость.

**Ключевые сущности:**
- **Consolidation ID (CONSO ID)** — идентификатор финансовой группы
- **Mutualized Cost** — пересчитанная стоимость после консолидации
- **Initial Cost** — исходная стоимость (сохраняется, не меняется)

> ✅ ОТВЕТ ИЗ КОДА (2026-06-11): Проверки плана подписки **нет** — доступно всем. Единственный гейт — флаг `allow_financial_consolidation` на паре shipper-carrier division (`models/shipper_divisions_carrier_divisions.js:44`), и он проверяется **только при пересчёте**, не при назначении группы (`public-api/financial-groups/helper.js:428`).
> ✅ ОТВЕТ ИЗ КОДА: Лимита на количество SR **нет** — `assignFinancialGroup()` без валидаций количества.

---

## API: Назначение группы (REQ-RS-013)

### Добавление в группу

```
PUT /shipments/Financialconsolidation/{id}
PUT /shipment-requests/Financialconsolidation/{id}
```

**Параметры поиска:** `shipments[].id`, `internal_ref[].id`, `shipment-requests[].id`

**Тело запроса:**
```json
{
  "recalculateRates": true,
  "RSselection": "Shiptify"   // или "Cheapest"
}
```

### Удаление из группы

```
DELETE /shipments/Financialconsolidation/{id}
DELETE /shipment-requests/Financialconsolidation/{id}
```

### Пересчёт без переназначения

```
POST /recalculate/FinancialConsolidation/{id}
```

---

## Валидация при назначении группы (REQ-TRACK-011)

Требования для группировки SR:

| Условие | Описание |
|---------|----------|
| Статус отправки | Нельзя назначить SR в статусе WAITING CONFIRMATION |
| Транспортный режим | Все SR должны иметь **одинаковый** транспортный режим |
| Перевозчик | Все SR должны иметь **одинакового** перевозчика |
| Флаг финансовой консолидации | У перевозчика включён флаг «финансовая консолидация разрешена» на уровне режима |

---

## Правила пересчёта ставок (REQ-RS-014)

1. Все SR в группе должны иметь одинаковый **CARRIER ID**
2. Если используется Carrier Service — он должен быть **одинаков** для всех SR
3. Суммировать все пакинг-листы группы → запустить расчёт RS на суммарный объём
4. Проверить ограничения: entity, cargo types, logistics means, MIN/MAX Weight/CW/Volume/Linear Meter
5. Группировать SR по **географическим парам FROM/TO** (SUB GROUP)
6. Выполнить расчёт для каждой подгруппы отдельно
7. Разбить итоговую стоимость обратно по SR согласно правилам `dispatch` (fallback — gross weight)

> ✅ ОТВЕТ ИЗ КОДА (2026-06-11): Распределение — `splitPriceByDispatch()` (`services/transportRequests/index.js:1189`). Правило берётся из **`cost_segments.dispatch_scope`** рейтшита; варианты: по количеству TR, весу, chargeable weight, surface, числу грузовых единиц, уникальным entities. **Fallback по умолчанию — gross weight** (`splitByWeight`). Применение в консолидации — `dispatchConsolidatedGroups()` (`financialGroups/index.js:288`).
> ✅ ОТВЕТ ИЗ КОДА: **Не блокируется и не предупреждается** — incoterm не загружается и не участвует в валидации (`financial-groups/helper.js:500-543` проверяет carrier, mode, logzones). См. REQ-RS-019 ниже.

---

## Mutualized Cost (REQ-RS-015)

| Тип стоимости | Описание | Изменяется? |
|--------------|----------|-------------|
| Initial Cost | Исходная стоимость до консолидации | Нет, сохраняется |
| Mutualized Cost | Пересчитанная стоимость (snapshot) | Только при пересчёте |
| Validated Cost | = Mutualized Cost, становится активной стоимостью | — |

**Правила:**
- Комментарий к invoice line: `«New price from retro consolidation (<Consolidation ID>)»`
- При импорте GIE: `«New price from retro consolidation (IMPORT <File name> by <user>)»`
- Если пользователь вручную изменяет стоимость после консолидации — Mutualized Cost **не меняется**
- Округление при распределении: разница добавляется к одному SR (при совпадении — случайно)
- Mutualized Cost отображается в **Power Data Booking Tab** и экспортируется в файл данных

---

## Загрузка Mutualized Cost через XLS (REQ-RS-016)

**Настройка в BO:** переключатель `«Can upload harmonized cost xls»` (по умолчанию NO) — настраивается на уровне покупателя и перевозчика.

**Формат файла:**

| Колонка | Описание |
|---------|----------|
| SR_ID | ID запроса отправки |
| Value | Стоимость (2 знака после запятой) |
| Currency | ISO3 код валюты |

**Права загрузки:**
- Перевозчик: только для SR, где он является назначенным перевозчиком
- Покупатель: только для SR в рамках своего доступа (multi-account / Galaxy)
- Повторная загрузка для одного SR_ID: значение заменяется последней загрузкой

**Тип загрузки в UI:** EN — «Mutualized Rates XLS» / FR — «Coûts mutualisés XLS»

---

## Обработка ошибок API (REQ-TRACK-012)

| Ошибка | Сообщение |
|--------|-----------|
| SR уже имеет CONSO ID | `SHIPMENT is already having a CONSO ID, remove and rerun` |
| Разные Carrier ID | `Carrier ID isn't the same for all references` |
| Разные Carrier Service | `Carrier service isn't the same for all references` |
| Нет подходящего RS | `NO RATES APPLIED TO CONSO ID` |
| Ошибка при пересчёте dispatch | `Recalculated but error in dispatch, nothing done` |

Частичное отклонение (partial reject): планируется в будущем. Текущее поведение — **отклонять полностью**.

---

## Экспорт данных (REQ-TRACK-015)

В data export добавляются колонки перед METADATA:

| Колонка | Описание |
|---------|----------|
| BK MUTUALIZED COST | Мутуализированная стоимость бронирования |
| BK MUTUALIZED CURRENCY | Валюта |
| CONSOLIDATED ID | ID группы консолидации |

**Блок «Mutualisation savings»:** отображается только если значение > 0.  
Формула: `Sum(IC - MC, где MC > 0)` по всем BKI в диапазоне дат.

---

## Инкотерм и консолидация (REQ-RS-019)

- Ретро-консолидация корректна только если все SR имеют **одинаковый incoterm**
- В текущей реализации incoterm как критерий **не проверяется** (игнорируется)
- В будущем: добавить проверку incoterm как обязательный критерий совместимости

> ❓ ОТКРЫТЫЙ ВОПРОС (Product): Когда будет добавлена проверка по incoterm — блокирующее условие или предупреждение? По коду (2026-06-11): TODO в исходниках нет, требование живёт только здесь (REQ-RS-019).

---

## Автозаполнение страны из LOCODE (REQ-RS-020)

При наличии LOCODE-структуры в SRS система может автоматически определять страну Origin/Destination:

| SRS-тип | Автозаполнение |
|---------|--------------|
| Pre-carriage SRS (From LOCODE → POL) | DEPARTURE COUNTRY CODE из LOCODE |
| Post-carriage SRS (POD → To LOCODE) | DELIVERY COUNTRY CODE из LOCODE |

Источник: поле COUNTRY CODE в SRS **И** сам UNLOCODE (первые 2 символа = ISO-2 страна).

---

## Связанные функции

| Функция | Документ |
|---------|----------|
| Rate Sheets Sea Freight | [structure.md](../rate-sheets/structure.md) |
| Container Tracking | [container-tracking.md](./container-tracking.md) |
| Invoice Lines | [../invoicing/README.md](../invoicing/README.md) |

---

## 🔗 Граф-метаданные
- **id:** `tms.features.retro-consolidation`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 630390877 · **repo:** `tms/features/retro-consolidation.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

