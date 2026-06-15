---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/633045091
source_type: confluence
---
# Transit Points API — Транзитные точки маршрута

> Источник требований: REQ-BOOK-029..030 | Слайды: 2025 07 - API POST_shipment_transit

---

## Обзор

Transit Points — промежуточные точки маршрута для морских отправок, позволяющие описать путь судна с перевалками (transhipment). API принимает контейнерные данные и массив транзитных точек.

---

## POST /shipments/{id}/transit — REQ-BOOK-029

### Структура запроса

```json
{
  "container": {
    "CONTAINER_ID": "MSCU1234567",   // опционально
    "Waybill": "BL123456"            // опционально
  },
  "Transit_Point": [
    {
      "position": 1,
      "COMPANYCODE": "MSCU",         // SCAC-код перевозчика (обязательно)
      "DEPARTURE_CODE": "FRLEH",     // UNLOCODE пункта отправки
      "ETD": "2025-08-01T10:00:00Z",
      "ARRIVAL_CODE": "SGSIN",       // UNLOCODE пункта прибытия
      "ETA": "2025-08-20T08:00:00Z",
      "vessel_name": "MSC OSCAR"     // опционально
    },
    {
      "position": 2,
      "COMPANYCODE": "MSCU",
      "DEPARTURE_CODE": "SGSIN",
      "ETD": "2025-08-22T12:00:00Z",
      "ARRIVAL_CODE": "CNSHA",
      "ETA": "2025-08-28T09:00:00Z"
    }
  ]
}
```

### Правила позиций

| Позиция | Роль |
|---------|------|
| 1 | FIRST POINT (первая нога маршрута) |
| 2 | Добавляется как отдельная нога; arrival position 1 становится TRANSHIP LOCATION |
| N (нарастающий) | Каждая последующая нога — следующая часть маршрута |

### Поведение при повторной отправке

- Та же позиция + другой `DEPARTURE_CODE` → **обновление** TP (не дублирование)
- Новая позиция 2 → arrival position 1 автоматически становится промежуточной точкой transhipment
- Отправка только `CONTAINER_ID` без `Transit_Point` → обновляет только container без изменения TP

---

## Валидация кодов — REQ-BOOK-030

### SCAC / IATA / ICAO (COMPANYCODE)

| Режим транспорта | Интерпретация COMPANYCODE |
|-----------------|--------------------------|
| SEA / RIVER / RORO | SCAC-код |
| AIR | IATA-код |
| AIR-SEA | SCAC, IATA или ICAO |

- Если SCAC найден в базе Shiptify → название компании подставляется в Transit Details автоматически
- Если SCAC не найден → API возвращает ошибку: `SCAC code not matching shiptify referential please contact support to make the adjustment`

### DEPARTURE / ARRIVAL CODE

| Режим | Формат | Пример |
|-------|--------|--------|
| SEA | UNLOCODE — 5 символов | `FRLEH` |
| AIR | IATA — 3 символа (если 5 символов — проверяется как LOCODE) | `CDG` |

### POST /shipments/{id}/transitsea

Дополнительный endpoint с поддержкой Bill of Lading:
- Принимает `BL_ID` (Bill of Lading number)
- Повторная отправка другого `BL_ID` → **заменяет** предыдущий

---

## Связанные документы

| Документ | Путь |
|----------|------|
| Packing List API | [packing-list-api.md](packing-list-api.md) |
| Container Tracking | [../features/container-tracking.md](../features/container-tracking.md) |
| Sea Freight Ship Data | [../features/sea-freight-ship-data.md](../features/sea-freight-ship-data.md) |

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.transit-points-api`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 633045091 · **repo:** `tms/shipments/transit-points-api.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

