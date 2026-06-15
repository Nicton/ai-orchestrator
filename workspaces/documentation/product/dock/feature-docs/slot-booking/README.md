---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/630390826
source_type: confluence
---
# Slot Booking — Бронирование слотов в основном приложении

Slot Booking — функциональность внутри основного приложения Shiptify, позволяющая Shipper'у и Carrier'у бронировать слоты без перехода в публичный портал Slotify.

## Точки входа

| Пользователь | Точка входа | Описание |
|-------------|-----------|----------|
| Shipper | Сайдбар → карточка **SLOT BOOKING** | Бронирование для входящих/исходящих отправок |
| Carrier | Синяя кнопка **+ BOOK A SLOT** | Бронирование на склад shipper'а |

**Предусловие:** флаг "Can book a slot" должен быть активирован в настройках аккаунта (Admin BO).

## Структура 6-шагового визарда

### Shipper side

```
Шаг 1: Тип операции
       ├── DELIVERY SLOT — резервирование для прибывающего груза
       └── PICK-UP SLOT — резервирование для убывающего груза
       Поля появляются:
         DELIVERY → ORIGIN OF SHIPMENT + DELIVERY SLOT BOOKING LOCATION
         PICKUP → DESTINATION + PICK-UP SLOT BOOKING LOCATION

Шаг 2: Выбор локации (Master Location / PML)

Шаг 3: Выбор зоны (LocationZone)
       Только зоны с matching direction (Reception / Expedition)

Шаг 4: Выбор перевозчика
       ├── Dropdown "Select Active Carrier" (если есть контакты)
       │   Показывает: логотип, название, город, кол-во активных/pending контактов
       │   SlotMail PDF отправляется всем пользователям перевозчика ("shoot to all")
       └── "OR ADD VIA EMAIL" (legacy fallback)
           Email-поле дублирует как pre-filter Active Carrier (точное/частичное совпадение)

Шаг 5: Дата и время
       Алгоритм: доступные окна с учётом capacity, Slot Interval, Number of Docks

Шаг 6: Данные о грузе и подтверждение
       Тип, количество, Floor/Stacked
       booking_source = SLOTBOOK_Shipper
```

### Carrier side (SlotBook)

```
Шаг 1: Тип операции (DELIVERY / PICKUP)

Шаг 2: Выбор склада (по названию или адресу)

Шаг 3: Выбор зоны

Шаг 4: Данные о грузе
       Тип, количество, вес, паллеты

Шаг 5: Дата и время

Шаг 6: Подтверждение
       booking_source = SLOTBOOK_Shipper (если через Shipper-side)
                      = API_slots (если через Carrier API)
```

## Выбор перевозчика (Slotbook — Carrier Selection)

Применяется только для Slot Book flow (Shipper или PML/Dock аккаунт).

### Active Carrier Dropdown

Показывается, если у пользователя есть хотя бы один контакт-перевозчик.

| Элемент карточки | Описание |
|-----------------|----------|
| Логотип | На уровне аккаунта (не пользователя) |
| Название | Официальное название компании |
| Город, страна | LogZone location |
| Active / Pending | Количество активных и pending контактов |

### Light Carrier Creation (нераспознанный email)

Если email перевозчика не найден в системе:
- First name: из email (мин. 2 символа), обязателен
- Last name: опционален
- Carrier name: из домена email (если не публичный домен — gmail, outlook и т.д.)

Два пути после подтверждения:
- **QUICK CREATE** — создать перевозчика и завершить (аналог slotbook/add-carrier)
- **Detailed Creation** — полный поток создания перевозчика

Новый пользователь создаётся со статусом `pending` (не `invite`), обогащается как carrier-контакт.

### Post-Creation Enrichment (обогащение со стороны перевозчика)

После того как перевозчик заполняет Country и City, система проверяет referential на соответствие:
- Если найден → запрос подтверждения
- Если подтверждён → carrier обогащается данными из referential
- Если "Don't know" → целевой перевозчик не назначается

## Динамическое именование слотов (Dynamic Slot Naming)

**Настройка:** My Settings → Slot naming

| Параметр | Значение |
|---------|----------|
| 2 направления | DELIVERY / PICK UP |
| 2 строки | Для каждого направления |
| "Same as PML" | Новый вариант по умолчанию — слот наследует именование PML |

**Доступные токены:**

| Токен | Описание |
|-------|----------|
| Slot ID | Внутренний ID слота |
| Visit ID | ID визита |
| Shipment Name | Название отправки |
| Shipment ID | ID отправки |
| Shipper Name | Название грузовладельца |
| Warehouse Customer Name | Название warehouse-клиента |
| Orders Reference | Ссылка на заказы |
| External reference | Dock-order reference |
| Carrier Name | Название перевозчика |
| Same as PML | Наследование от PML |

**Правило:** конфигурация влияет только на аккаунт, создающий слот. Перевозчики всегда видят Shipper Name + Order Reference независимо от настроек.

**Сервис:** `updateSlotsManualNamesAction` в `worker/tasks/slot_visit_delayed.js` — регенерирует названия слотов после изменения отправки.

## Recurring Slots (Повторяющиеся слоты)

Шаблон для регулярных рейсов.

**Таблица:** `recurring_slots`

| Поле | Описание |
|------|----------|
| `direction` | arrival / departure |
| `zone_id` | Зона |
| `dock_door_id` | Ворота |
| `days` | JSONB — дни недели |
| `time` | Время |
| `from_date` / `to_date` | Период действия |
| `default_workload` | Нагрузка по умолчанию |
| `can_carrier_update` | Может ли carrier изменять |

**API:**
- `POST /api/v1/slots/recurring-slot` — создать recurring slot
- `GET /api/v1/slots/recurring-slot/:id` — получить
- `DELETE /api/v1/slots/:slot_id/recurring-slot/:id/next` — удалить все будущие вхождения

## SlotBook (вид для Carrier)

| URL | Что показывает |
|-----|---------------|
| `/slotbook-ongoing-slots` | Текущие и предстоящие слоты |
| `/slotbook-history-slots` | История завершённых |
| `/slotbook-to-be-booked-slots` | Отправки без слота |

**Экспорт:**  
`GET /api/v1/slotbook-slots/export-excel` — Excel-выгрузка слотов перевозчика

---

## Сверено с кодом (2026-06-11) — именование и видимость DO (REQ-SLOTIFY-016/017)

### Динамическое именование

Конфиг **`location_settings.slot_naming`** (JSON: delivery/pick_up × public_page/slot_book/tm_same_galaxy × first/second line). Токены (`constants/slot_naming.js`): Slot ID, Shipment Name/ID, Shipper Name, WH Customer Name, Orders Reference, External reference, Carrier Name, Supplier Name, **Same as PML** (наследует конфиг Master Location, вторая строка блокируется). Генерация: `buildManualSlotName()` (`services/slots/delayed/slot-name.js:161-280`). Правило: настройка влияет только на аккаунт-создателя; перевозчик всегда видит Shipper Name + Order Reference.

### Видимость DO

Связь слота с заказами — таблица **`slots_orders`** (order_id, order_ref, company_name, buyer/seller_partner_id, is_contents_order). Отдельного механизма скрытия DO в Slotify нет — видимость определяется правами на слот.

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.slot-booking`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 630390826 · **repo:** `dock/feature-docs/slot-booking/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

