---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631668787
source_type: confluence
---
# Интеграции с перевозчиками

Shiptify интегрируется с 18 перевозчиками. Каждый перевозчик имеет собственную папку в `app/services/integration/`. Ниже — полный перечень с типом подключения и реализованными функциями.

---

## Сводная таблица перевозчиков

| Перевозчик | Константа | Тип API | Папка | Функции |
|-----------|-----------|---------|-------|---------|
| DHL | `dhl` | FTP / CSV | `integration/dhl/` | Трекинг (HAWB, MAWB, customer-ref, container) |
| DHL Global Forwarding | `dhl_global_forwarding` | RPC (микросервис) | `integration/dhl-global-forwarding/` | Трекинг, проверка активности |
| MyDHL | `mydhl` | RPC (микросервис) | `integration/mydhl/` | Создание отправки, печать этикеток |
| DHL Inovert | `dhl_inovert` | EDIFACT / FTP | _(через teliae)_ | DHL через промежуточный Inovert |
| DHL FCA | `dhl-fca` | FTP / CSV | _(вариант dhl)_ | DHL FCA-вариант |
| FedEx (legacy) | `teliae-fedex` | FTP / CSV | `integration/fedex/` | Трекинг по CSV-файлам |
| FedEx API | `fedex-api` | REST API | `integration/fedex-api/` | Создание, отмена, пикап, POD, фрахт, этикетки |
| UPS | `ups` | REST API | `integration/ups/` | Трекинг, ZPL→PDF этикетки, вложения |
| DB Schenker | `db_schenker` | EDIFACT / FTP | `integration/db-schenker/` | IFTMIN (бронирование), IFTSTA (трекинг) |
| Heppner | `heppner` | REST API | `integration/heppner/` | Бронирование, POD, инфо-запросы, отмена |
| Kuehne+Nagel | `kuehne-nagel` | REST API (OAuth2) | `integration/kuehne-nagel/` | Трекинг cargo/info flow, документы |
| Dachser | `dachser` | REST API | `integration/dachser/` | Скачивание POD |
| Dimotrans | _(нет константы)_ | REST API | `integration/dimotrans/` | Трекинг (polling) |
| Teliae | `teliae` | FTP / CSV | `integration/teliae/` | Бронирование, трекинг, ZPL→PDF этикетки |
| Teliway | _(нет константы)_ | EDIFACT / FTP | `integration/teliway/` | DISPOR (бронирование), REPORT (трекинг) |
| Calvacom | _(нет константы)_ | EDIFACT / FTP | `integration/calvacom/` | DISPOR (бронирование), REPORT (трекинг), POD |
| Brinks | `brinks` | REST API | `integration/brinks/` | Трекинг ценных грузов, POD, этикетки, HAWB |
| LivingPackets | `living-packets` | REST API (OAuth2) | `integration/livingpacket/` | Создание отправки (умная упаковка) |
| INTTRA | _(нет константы)_ | AS2 / XML вебхук | `integration/inttra/` | Бронирование морских перевозок |
| Terrial | _(нет константы)_ | REST API | `integration/terrial/` | Подтверждение отправки |

---

## Детали по перевозчикам

### DHL — три отдельные интеграции

**1. DHL (основная)** — `integration/dhl/`
- Тип: FTP-опрос CSV-файлов трекинга
- Типы референсов: HAWB, MAWB, customer-reference, container-number
- Константа: `INTEGRATION_TYPES.DHL = 'dhl'`

**2. DHL Global Forwarding** — `integration/dhl-global-forwarding/`
- Тип: RPC к микросервису `workspaces/integrations/`
- Переменная среды: `RPC_DHL_GF_URL`
- Файлы: только `rpc.js` + `provider.js`
- Константа: `INTEGRATION_TYPES.DHL_GF = 'dhl_global_forwarding'`

**3. MyDHL (DHL API v2)** — `integration/mydhl/`
- Тип: RPC к микросервису `workspaces/integrations/`
- Переменная среды: `RPC_MYDHL_URL`
- Функции: создание отправки, печать этикеток
- Вложения хранятся публично (S3 public)
- Константа: `INTEGRATION_TYPES.MYDHL = 'mydhl'`

**4. DHL FCA** — вариант основной DHL (`dhl-fca`)

**5. DHL Inovert** — DHL через промежуточный Inovert (`dhl_inovert`); трансформер трекинга использует `inovert`

---

### FedEx — две отдельные интеграции

**1. FedEx legacy** — `integration/fedex/`
- Тип: FTP-опрос CSV-файлов
- Константа: `INTEGRATION_TYPES.FEDEX = 'teliae-fedex'` (обрабатывается через Teliae data)
- Находит shipmentId через `ShipmentIntegrationTeliaeData`
- Некоторые коды событий FedEx пропускаются

**2. FedEx API** — `integration/fedex-api/`
- Тип: REST API + FTP CSV (fallback трекинг)
- Константа: `INTEGRATION_TYPES.FEDEX_API = 'fedex-api'`
- Функции:
  - `createFedexShipmentImpl` — создание отправки
  - `cancelFedexShipment` — отмена
  - `createFedexPickupImpl` — заказ пикапа
  - `downloadPODDocument` — скачивание POD
  - `fetchFreightPrice` — получение цены фрахта
  - Регистрация аккаунта, EULA

---

### UPS — `integration/ups/`

- Тип: REST API (аналогичная структура Brinks)
- Функции: трекинг, ZPL→PDF (Labelary), вложения на S3, метаданные
- STY-коды через `getSTYDataByCode`

---

### DB Schenker — `integration/db-schenker/`

Двунаправленная EDIFACT-интеграция через FTP:

| Направление | Формат | Событие |
|------------|--------|---------|
| Исходящий | IFTMIN D96A | Бронирование отправки |
| Входящий | IFTSTA D01B | Статусы трекинга |

- Метаданные HAWB/MAWB хранятся в БД
- Дедупликация файлов через `edifact_incoming_messages`

---

### Heppner — `integration/heppner/`

- Константа: `INTEGRATION_TYPES.HEPPNER = 'heppner'` (HPR)
- Тип: REST API
- Функции:
  - `createHeppnerRequest` — полное бронирование
  - `sendInformationRequest` — запрос информации
  - `sendRemindOrCancelRequest` — напоминание / отмена
  - `requestProofOfDelivery` — запрос POD
  - `sendTrackingRequestInfo` — запрос трекинга
  - `contactMessage` — сообщение перевозчику

Подробнее: [heppner.md](heppner.md)

---

### Kuehne+Nagel — `integration/kuehne-nagel/`

- Константа: `INTEGRATION_TYPES.KN = 'kuehne-nagel'`
- Тип: REST API (V2/V3), polling (cron)
- Аутентификация: OAuth2 или username/password (per-shipper credentials из БД)
- Типы референсов: HAWB, MAWB, customer ref, `ALL_CUSTOMER_REFERENCES`
- Потоки данных:
  - `cargo flow` — физические статусы груза
  - `information flow` — информационные статусы
- Дополнительно: скачивание документов

---

### Calvacom — `integration/calvacom/`

Телематика / GPS-трекинг через двунаправленный EDIFACT по FTP:

| Направление | Формат | Описание |
|------------|--------|---------|
| Исходящий | DISPOR | Отправка заказов на перевозку |
| Входящий | REPORT | Получение событий трекинга |

- Также обрабатывает POD-документы
- Метаданные хранятся на уровне отправки

---

### Teliae — `integration/teliae/`

- Константа: `INTEGRATION_TYPES.TELIAE = 'teliae'`
- Тип: FTP / CSV
- Функции:
  - Отправка данных бронирования на FTP Teliae
  - Получение CSV-файлов трекинга
  - Получение CSV-файлов POD
  - Генерация этикеток (ZPL → PDF через Labelary)
  - Возвраты: флаг `PICKUP_FLAG_RETURN`

---

### Teliway — `integration/teliway/`

- Тип: EDIFACT / FTP (два окружения: `teliway_urby`, `teliway_evol`)
- Функции: DISPOR (бронирование), REPORT (трекинг)
- Структура аналогична Calvacom

---

### Brinks — `integration/brinks/`

- Константа: `INTEGRATION_TYPES.BRINKS = 'brinks'`
- Специализация: ценные грузы
- Функции: трекинг по HAWB, обработка вложений (этикетки, POD), хранение метаданных

---

### LivingPackets — `integration/livingpacket/`

- Константа: `INTEGRATION_TYPES.LIVING_PACKETS = 'living-packets'`
- Тип: REST API с OAuth2 per-account
- Функция: `createShipment` — создание отправки с мониторируемой умной упаковкой
- Хранит `partner_id` и `shipment_id` в БД

---

### INTTRA — `integration/inttra/`

Платформа морских перевозок:

- Тип: входящий AS2 / XML вебхук
- Обрабатывает XML-сообщения:
  - CONTRL (подтверждение получения)
  - Booking accepted / rejected
  - Cancellation accepted / rejected
  - Booking confirmation / decline

---

### Терминал Terrial — `integration/terrial/`

- Тип: REST API
- Функция: `confirmShipment`
- Проверка shipper ID через конфигурацию

---

## Паттерны трекинга

Все трекинговые трансформеры конвертируют специфичные коды перевозчика в внутренние **STY-коды**:

| STY-код | Значение |
|---------|---------|
| STY0000 | Departure (отправка) |
| STY0016 | Arrival at first stop |
| STY0019 | Departure from first stop |
| STY9999 | Arrival (прибытие) |
| STY0507 | Delivered (доставлено) |

```javascript
// Пример трансформации в impl.js
const trackingPoints = mapTrackingPointsFromAPI(response);
await processTrackingPoints(shipmentId, trackingPoints);
```

---

## Генерация этикеток (ZPL → PDF)

Используется для: FedEx API, Teliae, UPS, MyDHL

```
Carrier API response (ZPL label)
    ↓
Labelary provider (external API)
    ↓
PDF buffer
    ↓
uploadToS3(pdfBuffer)
    ↓
storeAttachment(shipmentId, s3Url)
```

Провайдер: `app/services/integration/common/providers/labelaryProvider.js`

---

## Связанные документы

- [dhl.md](dhl.md) — DHL: все варианты интеграций
- [heppner.md](heppner.md) — Heppner: HPR Galaxy, полная документация
- [brinks.md](brinks.md) — Brinks: отдельный микросервис (NestJS+Prisma+Kafka)
- [ups.md](ups.md) — UPS: отдельный микросервис (этикетки ZPL/GIF, cron)
- [../architecture/README.md](../architecture/README.md) — техническая архитектура
- [../setup-guide.md](../setup-guide.md) — активация интеграции

---

## 🔗 Граф-метаданные
- **id:** `integrations.carriers`
- **type:** module-doc · **domain:** Integrations · **status:** implemented
- **confluence:** 631668787 · **repo:** `integrations/carriers/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Integrations
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

