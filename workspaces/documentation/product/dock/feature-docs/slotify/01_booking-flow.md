---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/633110529
source_type: confluence
---
# Slotify — Поток бронирования (6 шагов)

Детальное описание всех шагов бронирования через публичный портал Slotify. Применимо для внешних пользователей (поставщики, экспедиторы) и для Carrier через Slotbook.

## Обзор шагов

```
Шаг 1.1 → Шаг 1.2 → Шаг 2 → Шаг 3 → Шаг 4 → Шаг 5 → Шаг 6 (финал)

1.1: Тип операции + тип пользователя
1.2: Email + телефон
2:   Данные о компании / регистрация
3:   Данные о грузе (cargo)
4:   Выбор даты и времени
5:   Данные водителя и транспорта (metadata)
6:   Подтверждение → Инструкции
```

---

## Шаг 1.1 — Тип операции и пользователя

**Что заполняется:**
- **DELIVER TO / PICKUP FROM** — направление слота
  - DELIVER TO → зона с `is_reception=true`
  - PICKUP FROM → зона с `is_expedition=true`
- **Тип пользователя:** Carrier или Supplier/Customer

**Условная логика:**
- Carrier → поле Department **не показывается**
- Supplier/Customer → показывается поле **Department**

---

## Шаг 1.2 — Контактные данные

**Что заполняется:**
- **Email** (обязателен) — используется для идентификации аккаунта
- **Телефон** (обязателен, с UI 3.0) — страна + номер
  - Поле: флаг страны (плоский дизайн, ISO), код + номер
  - Выбор страны: инлайн-поиск в дропдауне, флаг слева

**Если email уже известен системе:** пользователь авторизуется, данные предзаполняются.

**Язык интерфейса:** сохраняется с первого шага → страница пароля отображается на том же языке.

---

## Шаг 2 — Данные о компании (регистрация)

**Что заполняется:**
- Название компании
- Страна
- Город (поиск: сначала "starts with", затем частичные; дефисы игнорируются)
- **Department** (только для Supplier/Customer):
  - Sales Administration, Planning, Purchasing/Procurement
  - Warehouse & Operations, Transport & Freight
  - Production/Manufacturing, Finance & Accounting
  - Maintenance & Facilities, Customer Service
  - General Management, Other
  - i18n ключ: `slotify.service.key`
  - Сохраняется на уровне DOMAIN при первом создании

**Если пользователь уже зарегистрирован:** данные предзаполняются, поля можно отредактировать.

**Light Carrier Creation** (для нераспознанного email):
- First name: из email (мин. 2 символа), обязателен
- Last name: опционален
- Carrier name: из домена email (если не публичный домен)
- Два пути после подтверждения:
  - **QUICK CREATE** — создать и завершить (≈ slotbook/add-carrier)
  - **Detailed Creation** — полный поток создания

---

## Шаг 3 — Данные о грузе

**Что заполняется:**
- Тип груза (из разрешённых типов зоны: `slot_contents.type_id`)
- Количество единиц
- Floor / Stacked (если тип груза поддерживает)
- Вес, объём (опционально)
- Дополнительные флаги: `is_dangerous`, `is_controlled_temperature`

**Логика Floor / Stacked:**

| Состояние поля Floor | Отображение |
|---------------------|-------------|
| Floor = Total (по умолчанию) | Серый цвет поля |
| Total > Floor | Очень светло-голубой |
| Тип груза = "Floor" | Поля переезжают во вторую строку |

**Пример расчёта времени:**
```
Заказано 5 ящиков:
  1 → On Floor (30 мин/ед.)
  4 → Stacked (15 мин/ед.)

Базовое время = 1×30 + 4×15 = 90 мин
+ Fixed Time Per Slot = 60 мин
Итого: 150 мин → округляется до интервала зоны
```

---

## Шаг 4 — Выбор даты и времени

**Что показывается:**
- Календарь с доступными днями (в пределах диапазона `available.to` зоны)
- Закрытые дни (праздники, настройки `LocationZoneDateSetting`) — недоступны
- После выбора дня: сетка временных слотов (`buildTimes()`)
  - Шаг сетки = `interval` зоны (например, 30 мин)
  - Закрытые окна = вне рабочих часов зоны
  - Занятые окна = уже забронированы (с учётом `capacity` / `docks`)

**Алгоритм проверки доступности:**  
`getCurrentSlotIndex()` / `getCurrentShipmentIndex()` — маппинг ETA/ETD в корзину временной сетки. Подробнее: [02_algorithm.md](02_algorithm.md).

**Min Prior Notice:** дни до сегодня + `pre_advice` дней недоступны.

---

## Шаг 5 — Данные водителя и транспорта

**Что заполняется (отображается как Metadata):**
- Имя водителя
- Номер телефона водителя
- Номер транспортного средства
- Номер прицепа

**Группировка на экране:**
```
Instructions → COMMENT (комментарий слота)
Metadata (driver/truck data)
```

**Peripass интеграция:** данные о водителе/визите синхронизируются с Peripass через aftercommit.

---

## Шаг 6 — Подтверждение

**Что показывается на финальном экране:**
- **ИНСТРУКЦИИ** (не карта!) — специфические инструкции склада
- Данные о слоте: дата, время, зона, ворота (если назначены)
- Краткая информация о грузе
- Контактный email: `contact.slotify@shiptify.com`

**Логика маршрутизации packing list:**
- 1 заказ → детальный экран packing list по заказу
- 2+ заказов → General Packing List (пропускается детальный экран)

**Что создаётся в системе:**
```
Worker: bookShipment → bookSlotifyShipment()
  ├── ShipmentRequest (created)
  ├── QuoteRequest (created + confirmed)
  ├── Shipment (created)
  ├── Slot (created, booking_source=SLOTIFY_Supplier)
  ├── SlotShipment (M:M link)
  ├── SlotParticipants (visibility)
  ├── SlotSuppliers (supplier link)
  └── Metadata + Attachment requests
```

---

## Тест-кейсы (Slotbook)

Согласно `test-documentation/slots/slotbook.md`:
- **Всего:** 116 тест-кейсов, 0% автоматизировано
- **Точки входа:** Shipper side (SLOT BOOKING card), Carrier side (+ BOOK A SLOT)
- **Предусловие:** "Can book a slot" активировано в настройках аккаунта (Admin BO)

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.slotify.01_booking-flow`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 633110529 · **repo:** `dock/feature-docs/slotify/01_booking-flow.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

