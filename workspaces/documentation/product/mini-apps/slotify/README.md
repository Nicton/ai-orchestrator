---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632750146
source_type: confluence
---
# Slotify — Публичный портал бронирования слотов

## Назначение

Slotify — самое сложное мини-приложение. Это публичный портал для бронирования временных слотов погрузки/разгрузки на складе грузоотправителя. Им пользуются поставщики, перевозчики и клиенты — без аккаунта в Shiptify. Страница доступна по уникальной ссылке склада (location token).

В одном пакете также находится **Slot Status** — экран-табло для вывода на телевизор или монитор у ворот склада (отдельный роут: `/slotify/status/:zoneToken`).

## Метод доступа

| Параметр | Значение |
|---|---|
| URL-паттерн бронирования | `/slotify/:locationToken` или `/slotify/:locationToken/:locationCustomerToken` |
| URL-паттерн просмотра отгрузки | `/slotify/shipments` (после редиректа с `/slotify/shipment/:token`) |
| URL-паттерн Slot Status | `/slotify/status/:locationZoneToken` или `/slotify/status/location/:locationToken` |
| Аутентификация | `locationToken` — публичный токен склада. Сервер загружает Location из БД, создаёт mini-app JWT и записывает в cookie. Дополнительный `locationCustomerToken` ограничивает видимость по клиенту |
| Данные в `window` | `window.authToken`, `window.masterLocationId`, `window.customerToken`, `window.user`, `window.shipper` |
| IP Whitelist | Поддерживается: если у аккаунта настроен IP-whitelist (`checkSlotifyIpInWhitelistMiddleware`), доступ ограничивается |

**Типичный сценарий:** грузоотправитель создаёт в TMS склад (Location) и публикует ссылку Slotify для своих поставщиков. Поставщик открывает ссылку, проходит мастер бронирования и получает подтверждение слота.

## Тип пользователей

- **Поставщик (Supplier)** — бронирует слот для доставки заказа
- **Перевозчик (Carrier)** — бронирует слот для выполнения рейса
- **Клиент (Customer)** — бронирует слот (если склад настроен для multi-customer)

## Маршруты (ui-router)

| State | URL | Controller | Описание |
|---|---|---|---|
| `booking` | `/locations/book` | `BookingCtrl` | Основной мастер бронирования |
| `shipment` | `/shipments/:id` | `ShipmentCtrl` | Просмотр деталей слота / трекинга |

## Шаги мастера бронирования (14 шагов)

| Шаг | Константа | Описание |
|---|---|---|
| 1 | `SLOTS_DETAILS_STEP` | Email пользователя, выбор роли (Supplier/Carrier/Customer), ввод реквизитов |
| 2 | `MESSAGE_SELECT_STEP` | Показ временного сообщения от склада (если есть) |
| 3 | `ORDER_SELECT_STEP` | Поиск и привязка заказов (ERP-ссылки) |
| 4 | `SELECT_CUSTOMERS_STEP` | Выбор клиента грузоотправителя (при multi-customer складе) |
| 5 | `SELECT_ZONE_STEP` | Выбор зоны дока (inbound/outbound) |
| 6 | `ORDERS_PACKING_LIST_STEP` | Подтверждение упаковочного листа по заказу |
| 7 | `SLOT_PACKING_LIST_STEP` | Финальное содержимое груза для слота |
| 8 | `SELECT_DATE_STEP` | Календарь + выбор времени (цветовая индикация загруженности: зелёный/оранжевый/красный) |
| 9 | `CONFIRMATION_STEP` | Финальный обзор + данные водителя (имя, документ, номер авто) |
| 10 | `SLOT_CREATING_STEP` | Отправка бронирования |
| 11 | `ACTIVATE_ACCOUNT_STEP` | Предложение создать аккаунт Shiptify |
| 12 | `SLOT_ERROR_CREATED_STEP` | Состояние ошибки |
| 13 | `ERROR_SELECT_TIME_STEP` | Время стало недоступным между шагами |
| 14 | `DIRECT_CONNECT_STEP` | Отправлен email для passwordless-входа |

## Алгоритм цветовой индикации слотов

Цвет ячейки на календаре определяется по степени заполненности:
- Зелёный (`GREEN_CLASS_COLOR`) — слоты доступны (`AVAILABLE`)
- Оранжевый (`ORANGE_CLASS_COLOR`) — слоты заполняются
- Красный (`RED_CLASS_COLOR`) — слоты недоступны (`UNAVAILABLE`) / закрыты

Логика реализована в `frontend/slotify/booking/services/helper-date.js` (`prioritySlots`, `AVAILABLE`/`UNAVAILABLE`).

## Ключевые GraphQL-операции

**Queries:**
`location`, `zones`, `locationCustomers`, `locationMessages`, `locationCountriesPhoneCodes`, `shipmentsByMasterLocation`, `slotCapacity`, `carrier`, `galaxy`, `user`, `supplier`, `companies`, `metadataInfo`, `orders`, `order`, `booker`, `countries`, `countryCities`, `getCarriersByEmailCountryCity`, `shipmentRequestContentTypes`, `getAttachmentPublicUrl`, `getAttachmentPreviewUrl`

**Mutations:**
`newBooking`, `newActivateAccount`, `newSendInvite`, `createAccountByEmail`, `passwordlessLoginEmail`, `updateLocationPositions`

## Galaxy (Brand Group)

При вводе email на шаге 1 система определяет домен и запрашивает `query galaxy(domain)`. Если домен принадлежит группе брендов, интерфейс адаптируется под брендинг группы.

## Slot Status (дочернее приложение)

Slot Status — отдельный React 19 бандл (`slot-status.js`), запускаемый на тех же EJS-шаблонах и GraphQL-эндпоинте. Используется как цифровое табло у ворот склада.

**Роуты (HashRouter):**
- `/upcoming` — текущие и предстоящие слоты по статусам
- `/delayed` — задержанные слоты
- `/analytics/pending` — аналитика ожидающих
- `/analytics/completed` — аналитика завершённых

**Статусы слотов:** `incident`, `not_confirmed`, `delayed`, `on_time`, `upcoming`

**Источники бронирований:** `SLOTIFY_Supplier`, `SLOTIFY_Carrier`, `SLOTIFY_Customer`, `SLOTBOOK_Shipper`, `SLOTBOOK_Carrier`, `API_slots`, `API_visits`, `CSV_slots`, `orders_csv`

**Стек Slot Status:** React 19, Redux Toolkit 2, Apollo Client 4, react-intl 7, React Router DOM 7.

## Технический стек Slotify

- AngularJS 1.8 + ui-router 1.0
- ui-bootstrap 2.5.6
- angular-translate 2.19
- ng-file-upload (загрузка вложений)
- Apollo Client 4 (через Angular-сервис `apollo`)
- Mapbox GL 3 (карта расположения склада)
- angularjs-slider (слайдер выбора времени)
- moment + moment-timezone (работа с временными зонами)
- libphonenumber-js (телефонный ввод)

## Открытые вопросы

См. [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).

---

## 🔗 Граф-метаданные
- **id:** `mini-apps.slotify`
- **type:** module-doc · **domain:** Mini-Apps · **status:** implemented
- **confluence:** 632750146 · **repo:** `mini-apps/slotify/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Mini-Apps
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

