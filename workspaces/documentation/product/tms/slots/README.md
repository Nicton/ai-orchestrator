---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631504997
source_type: confluence
---
# Слоты (Slots)

Тайм-слоты — это зарезервированные временные окна для операций на складе или воротах (dock). Shipper или Carrier бронирует слот под конкретный Shipment, оператор склада подтверждает.

## Кто использует

- **Shipper** — бронирует слоты на своих складах для входящих перевозок
- **Carrier** — бронирует слоты для выезда/въезда на склад shipper'а
- **Operator / Dock manager** — подтверждает и управляет слотами на воротах
- **Admin** — полный доступ

---

## Файлы этого раздела

| Файл | Содержимое |
|------|-----------|
| [01_list.md](01_list.md) | Страница списка слотов: фильтры, статусы, действия |
| [02_slotify.md](02_slotify.md) | Slotify: календарный/board вид управления слотами |

---

## Место в потоке

```
Shipment создан
      ↓
Carrier / Shipper бронирует Slot
      ↓
Slot.status = confirmed (оператор подтверждает)
      ↓
Carrier приезжает в зарезервированное время
      ↓
Shipment.status обновляется (slot_confirmed)
```

---

## Статусы Slot

| Статус | Описание |
|--------|---------|
| `pending` | Слот запрошен, ожидает подтверждения |
| `confirmed` | Оператор подтвердил временное окно |
| `cancelled` | Слот отменён |
| `done` | Операция завершена |

---

## Ключевые модели

| Модель | Файл | Описание |
|--------|------|---------|
| `Slot` | `app/models/slot.js` | Запись слота |
| `SlotShipment` | `app/models/slot_shipment.js` | Связь Slot ↔ Shipment |
| `DockDoor` | `app/models/dock_door.js` | Конкретные ворота на складе |
| `Location` | `app/models/location.js` | Склад/точка |

---

## Backend

- Сервис: `app/services/slots/index.js` — сложная логика резервирования
- Frontend: `workspaces/frontend/public/app/slots/`
- Slotify (calendar): `workspaces/mini-apps/frontend/slotify/`

---

## Экран Dock Door — назначение на ворота (REQ-DOCK-001..005)

### Концепция

Новый экран **Dock Door** — это временна́я сетка для назначения слотов на конкретные ворота склада.

```
Временная сетка:
Ось X — время (в рамках часов открытия зоны)
Ось Y — ворота (Dock Doors)

[Лоток неназначенных слотов] ← внизу экрана
```

**Drag & drop:**
- Из лотка на ворота
- Между воротами
- Перепланировка времени с этого экрана **недоступна**

**Карточка слота на экране:**

| Поле | Описание |
|------|----------|
| Строка 1 | Название слота + логотип перевозчика |
| Planned/Ongoing | Плановое время начала — конца |
| Closed | Фактическое время начала — конца |
| В лотке | Плановое время + общая длительность (09:00–11:00 (2ч)) |

**Цвета карточек:**
- Белый — Planned
- Голубой — Ongoing
- Светло-зелёный — Closed
- Оранжевый — перекрытие двух Planned-слотов на одних воротах

Слоты со статусом Anomaly не отображаются. Фильтрация по зонам — ворота и неназначенные слоты фильтруются вместе.

### Специфики ворот (Dock Door Specificities)

В BO создаётся словарь Dock Specificities:

| Поле | Описание |
|------|----------|
| id | Идентификатор |
| Name | Строковый ключ для перевода |
| Предустановленные значения | ADR, Side loading, Temperature controlled, Bulk |

- Настройка в **My Settings → Dock Door Specificities** (только для DOCK-аккаунтов)
- Пользователь активирует / деактивирует специфики (как метаданные)
- Привязка специфик к конкретным воротам: раздел **Dock Door configuration** в настройках дока
- Tooltip при наведении на иконку (i) у ворот — отображает привязанные специфики

---

## Visit Carrier — перевозчик визита (REQ-DOCK-006..009)

**Visit Carrier** — отдельное поле, независимое от Booking/Shipment Carrier:
- Привязывается к **Visit**, а не к Booking или Shipment
- Поддерживает сценарий субподряда: разные перевозчики для Pickup и Delivery
- Видимо и редактируемо на экранах Visit и Slot
- Доступно через API

### Поиск перевозчика при бронировании слота

**При NOTIFY CARRIER BY MAIL = NO:**
- Поле «Carrier Name» обязательно
- Поиск в RCD (Random Carrier Database)
- Если имя не найдено — добавляется в RCD при подтверждении

**При NOTIFY CARRIER BY MAIL = YES:**
- Email обязателен
- Если email найден в Shiptify DB → логотип и имя, Carrier Name скрыт
- Если не найден → Carrier Name обязателен + создаётся в RCD

**Отображение в листинге:**
- Shiptify-перевозчик → логотип (указывает на видимость в системе)
- RCD-перевозчик → только имя, без логотипа

---

## Обновление статуса слота — модал (REQ-DOCK-013..015)

### Новый дизайн модала

- Статусы — **большие кнопки с пиктограммами** (не список)
- Аномальные статусы в отдельной группе с горизонтальным разделителем
- CONFIRM — полная ширина; BACK — маленькая серая кнопка
- Поле комментария и прикрепление файлов — на последнем шаге
- После статуса (UN)LOADED → открывается модал обновления упаковочного листа

**Обработка опоздания:**
- Если разница между плановым и фактическим временем > размера слота → «X мин опоздания»
- Ввод будущей даты/времени **запрещён**
- Экран «Multiple Date» появляется ДО экрана ON TIME / LATE

**Статусы Visit:** Pending → On site → In site → Left site → Refused / No show

**Статусы Slot:** Pending → Called → At dock → Loading/Unloading → Loaded/Unloaded → Refused / No show

TP сохраняется при каждом изменении статуса Visit и Slot (дата/время + тип действия). Дата/время TP корректируется вручную через UI.

---

## Dock Orders (DO) — листинг и управление (REQ-DOCK-016..024)

### Разделение Inbound / Outbound

- Отдельные листинги для входящих и исходящих заказов
- INBOUND — отображается первым по умолчанию
- Если у аккаунта есть только OUTBOUND — показывается только Outbound

### Фильтры листинга

| Фильтр | Описание |
|--------|----------|
| Поиск | order id, order ref, supplier ref, customer ref |
| Supplier / Customer name | — |
| Window Validity | Срок действия окна поставки |
| Zone | Зона склада |
| DOCK ORDER status | Open / Closed / Cancelled |
| SDO status | Статус Sub-Dock Order |
| Deadline | Deadline on track / approaching / exceeded |

Magic Filter в наличии.

### Действия по Dock Order

| Действие | Поведение |
|----------|----------|
| Клик на SLOT ID в SDO | Открыть слот в новом окне (с проверкой прав) |
| Кнопка «Missing SLOT» | CLOSE ORDER / DELETE ORDER / Modify window |
| Клик на статус DO (открытый, нет SDO) | CLOSE или DELETE |
| Клик на статус DO (закрытый) | OPEN |
| Переоткрытие DO с SDO | Предложить продлить окно и снять флаг MONO |

**Автозакрытие по сроку:**
- MAX Delivery Window ≥ текущая дата + 3 дня → «Deadline approaching»
- MAX Delivery Window ≥ текущая дата → «Deadline exceeded» → **автозакрытие DO**

### Multi Order / Multi Customer на одном слоте (REQ-DOCK-020)

Один слот может содержать Dock Orders от **разных партнёров** при условии:
- Совпадение Direction (INBOUND/OUTBOUND)
- Совпадение Zone ID
- Совпадение Customer/Supplier ID

Направления INBOUND и OUTBOUND **нельзя смешивать** в одном слоте.

### Partner DB: роли в DO (REQ-DOCK-021)

| Направление | SELLER ID | BUYER ID |
|-------------|-----------|----------|
| INBOUND | Supplier ID | Customer ID |
| OUTBOUND | Customer ID | Supplier ID |

BOOKER ID — опционален в обоих случаях. Если ID заполнен — имя, введённое вручную, игнорируется.

### Видимость DO для партнёров (REQ-DOCK-022)

| Роль | Видимость |
|------|----------|
| BOOKER | Видит DO в TRACK/DOCK ORDER, может создать слот из DO, перепланировать / отменить |
| SUPPLIER | Видит статус DO в TRACK; видимость слота — ограниченная (только свои заказы) |

### Референсы партнёров (REQ-DOCK-023)

- Поиск по SELLER REF / BUYER REF / BOOKER REF
- Поле EXTERNAL REF — «плавающий» референс без влияния на процесс
- Поле SUPPLIER SLOT скрыто для CARRIER и PML (избыточная информация)

---

## 🔗 Граф-метаданные
- **id:** `tms.slots`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631504997 · **repo:** `tms/slots/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

