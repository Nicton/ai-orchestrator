---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632848481
source_type: confluence
---
# Freight Units (FU) — Грузовые единицы

> Источник требований: REQ-FU-001..008 | Слайды: 2022 03 - VPE Freight Unit Generation

---

## Концепция

Freight Unit (FU) — объект, описывающий физическую единицу груза, которая перемещается через несколько транспортных плеч. FU создаётся внешним клиентом (например, Veepee) через API и существует независимо от конкретной отправки.

**Ключевые отличия от Packing List:**
- FU имеет собственный жизненный цикл (статус, маршрут)
- Один FU может проходить через несколько SH (цепочка плеч)
- FU содержит таблицы COLLECT и DISPATCH для автоматического расчёта маршрута

---

## API: Управление FU (REQ-FU-001)

| API | Метод | Описание |
|-----|-------|----------|
| `FU-100` | POST | Создать FU; возвращает `FU_Shiptify_ID` |
| `FU-101` | PUT | Обновить FU; данные перезаписываются |
| `FU-102` | DELETE | Удалить FU (только если не назначен на транспортировку) |
| `API-900` | GET | Получить детали SH |

**Структура FU:**
- `FU_Veepee_ID`, `FU_Name`, аккаунт Shipper
- Pick up location, Final destination
- Due dates
- Массив грузов: тип, количество, габариты, вес, специфика, признак DGD

---

## Вебхуки Shiptify → Клиент (REQ-FU-002)

| Вебхук | Событие |
|--------|---------|
| `FU-200` | SH создан с FU → SH ID + массив FU_ID |
| `FU-202` | SH отменён с FU → SH ID + массив FU_ID |
| `FU-300` | Состав FU в SH изменён → добавленные и удалённые FU_ID |
| `FU-400` | TP подтверждён → SH ID + FU_ID + детали TP (локация, дата, тип) |

---

## Статусы FU (REQ-FU-003)

| Статус | Цвет в UI | Условие |
|--------|----------|---------|
| **Pending Collect** | Оранжевый | FU не назначен ни на один SH/BK |
| **Assigned** | Синий | FU назначен на 1+ SH/BK и дата погрузки ≤ сегодня |
| **In Transit** | — | FU полностью назначен до пункта назначения |
| **Pending Dispatch** | — | FU назначен до Dispatch Hub, но не до конечного пункта |
| **Delivered** | — | FU доставлен в конечный пункт назначения |

---

## Поля маршрутизации FU (REQ-FU-004)

| Поле | Описание |
|------|----------|
| **Last Transit Location** | Автообновляется при назначении FU на SH (адрес доставки последнего SH в цепочке) |
| **Last Transit Location Date** | Обновляется при подтверждении доставки последнего SH |
| **Collect Location** | Рассчитывается по таблице COLLECT при загрузке FU |
| **Dispatch Location** | Рассчитывается по таблице DISPATCH при загрузке FU |

**Таблица COLLECT** (Zip, LogZone, Country → Collect Hub, Cut off, Leadtime, Carrier): читается сверху вниз, первое совпадение — стоп.

**Таблица DISPATCH** — аналогична COLLECT с полями Dispatch Hub.

Если Last Transit Location = конечный пункт назначения → поле оставляется пустым.

---

## Ручная маршрутизация (REQ-FU-005)

При выборе нескольких FU в статусе **Pending**:
- Кнопка «Create a Shipment» появляется
- Если все FU имеют одинаковый Collect Hub → пункт назначения преднастраивается автоматически
- Если Collect Hub разные → поле назначения подсвечивается красной рамкой

После выбора назначения → переход на шаг 2 CSW (выбор перевозчика или запрос цены).

При выборе FU в статусе **Assigned**:
- «Create a Shipment» + «Assign to a Shipment»
- «Assign to a Shipment» доступна только если у всех FU одинаковый Last Transit Location

---

## Автоматическая маршрутизация (REQ-FU-006)

«Find Routing» вычисляет следующий доступный маршрут к конечному Hub:
- Результат: SH сгруппированные по Origin/Destination, упорядоченные по дате погрузки
- Если Linear Meter > средняя вместимость → метка **«OVERLOADED TRUCK»**
- После подтверждения: FU автоматически назначаются на SH каждого плеча
- Если маршрут не найден → «No routing has been identified to reach the final destination»

---

## Листинг FU с фильтрами (REQ-FU-007)

| Фильтр | Описание |
|--------|----------|
| Pick up LogZone/Location | — |
| Final Destination LogZone/Location | — |
| Last Transit Point | — |
| Дата последнего транзита | — |
| Статус FU | — |

- Мультиселект в листинге для операций
- При наведении на LogZone → попап с полным именем, датой доставки и погрузки
- Клик на плечо маршрута → связанный SH в новой вкладке
- Оптимизирован для 1000+ FU (статусы записаны в БД, не вычисляются)

---

## Crossdock листинг (REQ-FU-008)

В Crossdock листинге отображаются FU, у которых Pick up Location = текущая Master Location.

**Статусы в Crossdock листинге:**

| Статус | Описание |
|--------|----------|
| Ready for Crossdock | — |
| Expected in N hours | — |
| Expected N hours ago | — |
| Assigned | — |
| Closed | — |

**Действия:**
- «Create a Shipment» — создать SH из выбранных FU
- «Assign to Shipment» — добавить FU к существующему SH (фильтр по Destination)
- «Close N lines» — архивировать завершённые строки

---

## Связанные функции

| Функция | Документ |
|---------|----------|
| Pallets Management | [pallets.md](./pallets.md) |
| FU Improvements (метрики, dispatch ratio) | [fu-improvements.md](./fu-improvements.md) |
| Tracking Points | [../shipments/03_details/tab_tracking.md](../shipments/03_details/tab_tracking.md) |

---

## 🔗 Граф-метаданные
- **id:** `tms.features.freight-units`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632848481 · **repo:** `tms/features/freight-units.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

