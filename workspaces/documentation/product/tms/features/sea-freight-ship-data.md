---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632881219
source_type: confluence
---
# Sea Freight — Данные судна (Ship Data)

> Источник требований: REQ-SEA-001..006 | Слайды: 2023 01 - SeaFreight - Ship Data

---

## Концепция

Sea Freight Ship Data — модуль для фиксации информации о судне (SeaLeg) в контексте морских отправок. Позволяет указывать судно, маршрут и коносамент (Bill of Lading) для каждой отправки.

Работает как для одиночных морских отправок, так и для [Multi Container (MC)](./multi-container.md).

---

## Структура данных SeaLeg (REQ-SEA-001)

Одна морская отправка поддерживает:
- **1 BL (Bill of Lading)** на уровне отправки
- **N SeaLeg** (морских переходов / legs)

Каждый SeaLeg содержит:

| Поле | Описание |
|------|----------|
| Ship Name | Название судна |
| Ship IMO | Уникальный идентификатор судна (7 цифр) |
| Company IMO | Идентификатор судоходной компании |
| Company Name | Название перевозчика |
| Port of Loading | ISO-код порта погрузки (LOCODE) |
| ETD | Плановая дата отправления |
| Port of Arrival | ISO-код порта прибытия (LOCODE) |
| ETA | Плановая дата прибытия |

> Поле **BL ID** хранится на уровне отправки, не на уровне отдельного перехода.

> ✅ ОТВЕТ ИЗ КОДА (2026-06-11): Лимита **нет** — валидация (`services/shipmentTransitDetails/index.js:113`) требует минимум 1 точку маршрута, максимум не ограничен.
> ✅ ОТВЕТ ИЗ КОДА: Итоговый ETA = **ETA последнего leg**. Tracking points строятся из первой точки (departure) и последней (arrival): `processToBuildTpData` (`shipmentTransitDetails/index.js:345-365`).

---

## Справочник морских перевозчиков (REQ-SEA-002)

Shiptify поддерживает центральный справочник морских перевозчиков:

- Охватывает ~20–30 крупнейших перевозчиков (95% мировых потоков)
- При выборе перевозчика отображается логотип компании
- Поле перевозчика — **ограниченный список** (не свободный ввод)
- Компания может быть добавлена как морской перевозчик с признаком `sea carrier`

> ✅ ОТВЕТ ИЗ КОДА (2026-06-11): Справочник — таблица **`DictionaryTransitCompany`** (поле `code` = SCAC). Управление через Back-Office (`controllers/api/carriers.js`) — добавление нового перевозчика выполняет команда Shiptify через BO.
> ✅ ОТВЕТ ИЗ КОДА: Без SCAC — **тихая блокировка**: `createContainerTracking()` возвращает `false` (`integration/marine-traffic/impl.js:299-307`), перевозчики без SCAC отфильтровываются (`dataResolver.js:553`). Tracking request не создаётся, **ошибки пользователю не показывается** — потенциальная UX-проблема.

---

## Добавление данных о судне (REQ-SEA-003)

Кнопка **«Add Ship Info»** доступна для всех морских отправок (MC и не-MC).

**Форма «Add Ship Info»:**

| Поле | Описание |
|------|----------|
| Carrier | Выбор из справочника перевозчиков |
| Ship Name | Название судна |
| Port From | LOCODE порта отправления |
| ETD | Плановая дата отправления |
| Port To | LOCODE порта прибытия |
| ETA | Плановая дата прибытия |
| BL ID | Идентификатор коносамента |
| + add transhipment | Добавить промежуточный переход |

**Поведение кнопки подтверждения:**
- Для **не-MC** отправок: кнопка «UPDATE» (закрывает модал)
- Для **MC** отправок: кнопка «NEXT» (переходит к следующему шагу — выбор контейнеров)

---

## Обновление данных судна для группы контейнеров (REQ-SEA-004)

При MC или связанных отправках отображается выбор области применения:

| Вариант | Описание |
|---------|----------|
| All containers | Обновить SeaLeg для всех контейнеров бронирования |
| Selection | Показать список контейнеров с текущими данными SeaLeg |
| Unassigned | Только контейнеры без назначенного SeaLeg |
| This container only | Только текущий контейнер |

После обновления данные SeaLeg синхронизируются для всех выбранных контейнеров.

> ✅ ОТВЕТ ИЗ КОДА (2026-06-11): **Можно** — каждый контейнер (shipment) имеет собственный `shipment_transit_detail` (FK `shipment_id`); обработка контейнеров-братьев — `processTransitDetailsForBrotherShipments` (`shipmentTransitDetails/index.js:561-605`). Вариант «Selection» в форме как раз для назначения разных судов.

---

## Отображение данных судна в UI (REQ-SEA-005)

Данные судна отображаются в формате:

```
Ship Name | PORT_FROM Date > PORT_TO Date
```

Примеры портов (LOCODE): `FRHAV` (Le Havre), `SISGP` (Singapore), `AE DXB` (Dubai).

Поведение:
- При нескольких SeaLeg — все переходы отображаются **последовательно**
- Информация доступна через mouseover на логотип судоходной компании
- Данные доступны через API для интеграций

---

## Документы Sea Freight + MC: Same Ship (REQ-SEA-006)

При загрузке документов в контексте Sea Freight MC доступен вариант **«Same Ship»**:

```
Варианты распространения документа:
├── This shipment
├── All shipments
├── Selection (выбрать вручную)
└── Same Ship (все контейнеры на одном судне)
```

**Правила:**
- «Same Ship» применяет документ ко всем контейнерам с одинаковым SeaLeg (судном)
- Категория «Unassigned» (без SeaLeg) **не отображается** в диалоге
- Компонент выбора показывает текущий SeaLeg каждого контейнера

> ✅ ОТВЕТ ИЗ КОДА (2026-06-11): **Да** — документ применяется только к контейнерам с совпадающим судном/transit company; контейнеры без SeaLeg исключаются из диалога (категория Unassigned не отображается).

---

## Связанные функции

| Функция | Документ |
|---------|----------|
| Multi Container | [multi-container.md](./multi-container.md) |
| Container Tracking (Kpler) | [container-tracking.md](./container-tracking.md) |
| Rate Sheets: Sea Freight LOCODE | [../shipments/11_checklist-rate-sheets.md](../shipments/11_checklist-rate-sheets.md) |
| Grouping документов | [../grouping/README.md](../grouping/README.md) |

---

## 🔗 Граф-метаданные
- **id:** `tms.features.sea-freight-ship-data`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632881219 · **repo:** `tms/features/sea-freight-ship-data.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

