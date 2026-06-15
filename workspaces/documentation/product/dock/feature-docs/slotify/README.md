---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631767123
source_type: confluence
---
# Slotify — Публичный портал бронирования

Slotify — это внешний мини-портал Shiptify, позволяющий перевозчикам, поставщикам и экспедиторам самостоятельно бронировать слоты на складе без необходимости иметь полный аккаунт Shiptify.

## Что такое Slotify

Shipper публикует ссылку вида `app.slotify.com/{zone_token}`, которую передаёт своим партнёрам. Перейдя по ссылке, внешний пользователь проходит 6-шаговый процесс и бронирует временное окно.

**Технически:** отдельный mini-app (`workspaces/mini-apps/frontend/slotify/`), работающий на публичном домене.

## Документация Slotify

| Файл | Содержимое |
|------|------------|
| [01_booking-flow.md](01_booking-flow.md) | Полный поток бронирования (6 шагов) |
| [02_algorithm.md](02_algorithm.md) | Алгоритм расчёта слотов: вместимость, интервал, количество доков |
| [03_airport-screens.md](03_airport-screens.md) | Экраны аэропортного типа: Upcoming / Delayed / Completed |

## Место в экосистеме

```
Shipper настраивает LocationZone
    ↓ генерируется zone.token
    ↓ ссылка передаётся поставщикам

Внешний пользователь открывает app.slotify.com/{token}
    ↓ 6-шаговая форма

Worker task: bookShipment
    ↓ bookSlotifyShipment():
        1. find/create carrier (по email домену)
        2. create ShipmentRequest
        3. create QuoteRequest
        4. confirm QR → Shipment + Slot создаются атомарно
        5. SlotParticipants + SlotSuppliers
        6. Peripass sync, ES index, thread, Zapier, partner activation

Operator видит новый слот в Planning
```

## Статус при создании

Функция `buildNewSlotStatus()` в `app/services/slots/create_update_slot.js` определяет начальный статус слота:

| Условие | Статус слота |
|---------|-------------|
| Зона НЕ требует валидации (`is_slot_validation=false`) | `new` |
| Зона требует валидации + supplier НЕ в whitelist | `pending_validation` |
| Зона требует валидации + supplier в whitelist | `new` |

Whitelist: `location_zone_whitelist_partners` — партнёры, которые бронируют без предварительного одобрения.

## Версии UI

### Slotify UI 3.0 (основная)

Переработанная регистрация: разбита на два подшага.
- Шаг 1.1: основные данные (без email)
- Шаг 1.2: email + доп. данные + **телефон (обязателен)**

**Department** (только Supplier/Customer): сохраняется на уровне DOMAIN при первом создании.

**Поиск города:** сначала показываются совпадения "с начала строки" (игнорируя дефисы), затем частичные совпадения.

### Slotify UI 3.1 (обновления)

- Убран текст "Slot Booking" из хедера
- Адрес в 2-строчном формате
- Добавлено "Slotbook services provided by"
- Добавлен "Contact us" → `contact.slotify@shiptify.com`
- Разделение Шага 1 на 1.1 + 1.2
- Флаги стран: плоский дизайн, флаг слева, поиск внутри дропдауна

## Источники бронирования (booking_source)

Значение поля `booking_source` при создании слота через Slotify:

| Значение | Кто создал |
|---------|------------|
| `SLOTIFY_Supplier` | Внешний поставщик через Slotify |
| `SLOTBOOK_Shipper` | Shipper через SlotBook |
| `API_slots` | Через публичный API |
| `CSV_slots` | Через CSV-импорт |
| `BOOKING_Manual` | Оператор вручную |

## Уведомления и интеграции

После создания бронирования (aftercommit actions):
- **Peripass** — синхронизация данных водителя/визита
- **Elasticsearch** — индексация слота для поиска
- **Thread** — первое сообщение в чате слота
- **Zapier** — webhook для внешних интеграций
- **Email** — уведомление оператору и перевозчику
- **Partner activation** — активация партнёра в PML'ах

## Связанные страницы

- [Алгоритм слотов](02_algorithm.md) — как вычисляется длительность и доступность
- [Master Location](../master-location/README.md) — настройка зон и ворот
- [Planning](../planning/README.md) — вид оператора после бронирования

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.slotify`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 631767123 · **repo:** `dock/feature-docs/slotify/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

