---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/633143346
source_type: confluence
---
# New Tracking Architecture (2026) — Новая архитектура трекинга

> Источник требований: REQ-TRACK-007..010 | Слайды: 2026 04 - NEW TRACKING

---

## Концепция

Новая архитектура трекинга (апрель 2026) переосмысляет отображение Tracking Points. Вместо единого списка событий вводятся **три отдельных экрана**, которые можно конфигурировать независимо для каждого режима транспорта.

---

## Три экрана управления трекингом (REQ-TRACK-007)

| Экран | Назначение |
|-------|-----------|
| **Setup Screen** | Настройка кодов событий, флагов исключений, group/order отображения |
| **Shipment Screen** | Внутреннее отображение tracking timeline для операторов (не публичное) |
| **Public Shipment Tracking Page** | Публичное отображение — отделено от внутреннего |

**Правила поведения:**
- Если setup **не настроен** — используется текущий экран (обратная совместимость)
- Если setup настроен для конкретного режима (Air) — применяется только для этого режима
- Если setup настроен на уровне покупателя — используются настройки покупателя

---

## Setup Screen: коды событий и исключения (REQ-TRACK-008)

В Setup Screen можно настроить каждый STY-код:

| Параметр | Описание |
|---------|---------|
| **exception** | Пометить STY-код как исключение (да / нет) |
| **group** | Принадлежность к группе процессных событий |

**Правила:**
- Кнопка **Add Code** доступна только для кодов с `exception=YES`
- Исключения **нельзя** добавлять в группу `misc` процессных событий
- Публичная сортировка: от последнего к первому
- Внутренняя сортировка: от первого к последнему

---

## Public Tracking Page: UI и AI-функции (REQ-TRACK-009)

Новая публичная страница отслеживания грузовладельца.

### Визуальные компоненты

| Компонент | Описание |
|-----------|---------|
| **Map Visualization** | Карта Origin A → Destination B с географическим контекстом |
| **Predicted ETA** | AI/ML предсказание расчётного прибытия vs Original SLA |
| **Status Badge** | `At Risk` / `On Time` с визуальной индикацией |
| **Share** | Кнопка поделиться ссылкой на отслеживание |
| **Get Updates** | Подписка на обновления статуса |
| **Powered by Shiptify** | Footprint на публичной странице |

### Public tracking link

```
https://www.marinetraffic.com/en/containers/track-shipment?id={shipmentId}
```

---

## Sea Freight: создание TP при инициализации Pre-carriage (REQ-TRACK-010)

При транспортном режиме **SEA FREIGHT** с Pre-carriage SRS:

- При наличии Pre-carriage SRS → автоматически создаётся **STY0446** (Departure from Origin Port) с POL как location
- Открытый вопрос: создавать ли STY0446 если нет данных ETD

### API POST TRANSIT POINT

Новый endpoint для добавления транзитных точек: `POST /shipments/{id}/transit` (подробнее — [transit-points-api.md](../shipments/transit-points-api.md))

Для каждого зарегистрированного адреса в системе должна быть возможность сопоставить LOCODE.

---

## Связанные документы

| Документ | Путь |
|----------|------|
| Container Tracking (Kpler) | [container-tracking.md](container-tracking.md) |
| Transit Points API | [../shipments/transit-points-api.md](../shipments/transit-points-api.md) |
| Retro Consolidation (TRACK-011..015) | [retro-consolidation.md](retro-consolidation.md) |
| Sea Freight Ship Data | [sea-freight-ship-data.md](sea-freight-ship-data.md) |

---

## 🔗 Граф-метаданные
- **id:** `tms.features.new-tracking-architecture`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 633143346 · **repo:** `tms/features/new-tracking-architecture.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

