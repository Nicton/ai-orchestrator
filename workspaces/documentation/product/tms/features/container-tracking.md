---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632488003
source_type: confluence
---
# Container Tracking — Отслеживание контейнеров через Kpler

> Источник требований: REQ-TRACK-001..006, REQ-TRACK-013..014 | Слайды: 2024 08 - Sea Freight Container Tracking as a Service

---

## Концепция

Container Tracking — интеграция с сервисом Kpler Marine Traffic для автоматического отслеживания морских контейнеров. Позволяет получать реальные данные о местонахождении судна и автоматически создавать Tracking Points в Shiptify.

**Модель подписки:** Shiptify является подписчиком Kpler (единый credential для всей платформы). Включение/выключение работает на уровне аккаунтов-покупателей.

> ✅ ОТВЕТ ИЗ КОДА (2026-06-11): Для **контейнерного** трекинга Kpler — единственный, но всего провайдеров трекинга **четыре**: Project44 (TL, 27+ перевозчиков), Shippeo (GPS real-time), AfterShip (parcel, 900+), Marine Traffic/Kpler (море). Отдельных AIS/port EDI нет.
> ❓ ОТКРЫТЫЙ ВОПРОС (Product/Finance): Биллинг Kpler — в коде учёта стоимости/лимитов запросов нет (таблица `marine_traffic_tracking_requests` без полей стоимости); есть лог вызовов для статистики (REQ-TRACK-013). Кто платит и как перевыставляется — вне кода.

---

## Активация Container Tracking (REQ-TRACK-001)

Для работы сервиса необходимо:

| Условие | Уровень |
|---------|---------|
| Переключатель «Container Tracking» = YES | Аккаунт покупателя (Shipper) — **обязательно** |
| Активная интеграция Marine Traffic / Kpler | BO (Back-Office) |
| Container ID заполнен | Отправка |
| SCAC Code заполнен | Компания-перевозчик |

**Настройка активации:**
- Уровень Shipper — **обязательно**
- Уровень Carrier — опционально
- BO Companies — опционально

---

## Поле Container ID (REQ-TRACK-002)

- Отображается только если: Container Tracking = YES **И** Transport Mode = SEA FREIGHT
- Поле редактируемое; поддерживается для LCL и FCL
- Без Container ID вызов Kpler **невозможен**
- BL/BOL **не является** заменой Container ID
- Каждое изменение Container ID логируется в чате отправки

---

## Вызов Kpler API (REQ-TRACK-014)

**POST-запрос создания tracking request:**

```json
{
  "referenceNumberType": "container",
  "referenceNumber": "<Container ID>",
  "scac": "<SCAC CODE>",
  "tags": ["<shiptify_ref>"]
}
```

**Из ответа сохраняется:**
- `trackingRequestId`
- `shipmentId` (Kpler ID)
- Ссылка на tracking request

**Логика перед POST:**
1. Проверить (GET) — нет ли уже Container ID в статусе `not-completed`
2. Если существует — не создавать дубликат

**Публичная ссылка для пользователя:**
```
https://www.marinetraffic.com/en/containers/track-shipment?id={shipmentId}
```

В UI отображается баннер: «Tracking of the container {id} by Kpler Marine Traffic» + ссылка.

---

## Маппинг событий Kpler → Tracking Points Shiptify (REQ-TRACK-003)

| Событие Kpler | Shiptify TP Code | Источник данных |
|---------------|-----------------|-----------------|
| Departure from Origin Port | STY0446 | `portOfLoading.departureDate` |
| Arrival at transit Port | STY0448 | `portsOfTransshipment[n].arrivalDate` |
| Departure from transit Port | STY0451 | `portsOfTransshipment[n].departureDate` |
| Arrival at Destination Port | STY0364 | `portOfDischarge.arrivalDate` |

**Правила обработки статусов:**
- `status=planned` → дата используется как ETD/ETA
- `status=actual` → дата используется как ATD/ATA
- При `planned`: создать или обновить TP (replan)
- При `actual`: подтвердить TP

В чат добавляется запись: `«On the vessel <name> & Voyage <voyageNumber>»`

> Kpler **не влияет** на STY00000 и STY99999 (системные события).

---

## Приоритет источников данных: Carrier vs Kpler (REQ-TRACK-004)

| Ситуация | Поведение |
|----------|-----------|
| Carrier дал planned, Kpler дал planned | Используется **данные Carrier** |
| Kpler дал actual, Carrier не подтвердил | Используется **Kpler** |
| Оба дали actual | Используется **Carrier** |
| Разница Kpler vs Buyer/Seller > 12 ч | Выделяется **оранжевым цветом** |

Событие Kpler **всегда отображается** рядом с событием Buyer/Seller для сравнения.

> ⚠️ ПО КОДУ (2026-06-11): Отдельного «конфликт-индикатора» нет — только оранжевая подсветка при расхождении >12 ч (см. таблицу выше) и отображение события Kpler рядом с событием Buyer/Seller. Мерж точек — `services/tracking/external.js` (сравнение адресов `isSameAddress()`).

---

## Логирование вызовов Kpler (REQ-TRACK-013)

Каждый вызов Kpler API записывается в отдельную таблицу:

| Поле | Описание |
|------|----------|
| `container_id` | ID контейнера |
| `SH_ID` | ID отправки в Shiptify |
| `SR_ID` | ID запроса отправки |
| `shipper_id` | ID аккаунта покупателя |
| `user_id` | ID пользователя |
| `timestamp` | Дата и время вызова |

Таблица доступна через BO для выгрузки статистики по аккаунтам (используется для биллинга).

---

## Совместимость с API Tracking (REQ-TRACK-005, REQ-TRACK-006)

Container Tracking работает совместно с общим API Tracking. API поддерживает:

**POST `/shipments/{id}/tracking-points`** принимает `location` в трёх форматах:
- `{country, city, zip, address}` — адресный формат
- `{UNLOCODE}` — стандарт ООН для морских портов
- `{IATACODE}` — для авиа-отправок

**Логика CREATE vs UPDATE:**
| Запрос | Результат |
|--------|-----------|
| POST с PLANNED + ISO location | CREATE если нет, UPDATE если есть |
| POST с PLANNED + не-ISO location | Всегда CREATE |
| POST с PLANNED + добавление ACTUAL | UPDATE существующего TP |
| POST с ACTUAL + та же дата/время | Ничего (дубликат) |
| POST с ACTUAL + другая дата/время | CREATE нового TP |

> ⚠️ ПО КОДУ (2026-06-11): Опрос — два cron-джоба (`cron/marine-traffic-update-tracking.js` — синк точек, `marine-traffic-update-external-shipment-id.js` — заполнение Kpler ID), но **интервал задаётся вне кода** (планировщик окружения / `cronHeartBeatUrls`). Точную частоту уточнить у DevOps.
> ✅ ОТВЕТ ИЗ КОДА: **Закрывается автоматически** — когда все точки destination port получили `realDate`, вызывается `setTrackingRequestFinished()` → статус `FINISHED` (`marine-traffic/trackingPoints.js:268-277, 368-370`).

---

## Связанные функции

| Функция | Документ |
|---------|----------|
| Sea Freight данные судна | [sea-freight-ship-data.md](./sea-freight-ship-data.md) |
| Multi Container | [multi-container.md](./multi-container.md) |
| Новая архитектура Tracking 2026 | [tracking/new-tracking-architecture.md](../tracking/new-tracking-architecture.md) *(нет документации)* |
| Rate Sheets LOCODE | [../shipments/11_checklist-rate-sheets.md](../shipments/11_checklist-rate-sheets.md) |

---

## 🔗 Граф-метаданные
- **id:** `tms.features.container-tracking`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632488003 · **repo:** `tms/features/container-tracking.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

