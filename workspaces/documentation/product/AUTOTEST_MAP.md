---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631963649
source_type: confluence
---
# Autotest Map — Карта автотестов UI

Индекс файлов автотестов → фичи/флоу/страницы. Репозиторий: `main-app-automation`.

> Источник: Confluence 07_AUTOTEST_MAP (синхронизировано 2026-05-31). ~156 файлов в `uiTests/`.
> Корень тестов: `/main-app-automation/src/tests/uiTests/`

---

## Smoke Tests — Основная регрессия

### Milkrun & Перевозки

| Файл | Фича | Тестовые данные |
|------|------|----------------|
| `smokeTest/creatingMilkrun.js` | Создание Milkrun (2 pre-shipments) | Shipment: "Milkrun test [automation]", Cargo: Box 60x30x30 + Box 60x40x40, PU: Albuquerque 10:00, DEL: Eiffel Tower 18:00 + AnotherLocation 20:00, Carrier: Green Carrier |
| `smokeTest/shipmentRequest.js` | Создание SR, auto-confirm | DIRECT BOOKING → Green Carrier → autoConfirmButton |
| `smokeTest/quoteRequest.js` | Создание QR, auto-quote, award | REQUEST A QUOTE → 3 carriers → Auto-Quote → Award |
| `smokeTest/creatingDraft.js` | Сохранение Draft | SAVE DRAFT → статус "Draft" в booking list |
| `smokeTest/readyToBook.js` | Создание RTB | SAVE на step 2 CSW вместо отправки |

### Tracking Points

| Файл | Фича | Детали |
|------|------|--------|
| `smokeTest/confirmTP.js` | Подтверждение TP | Shipper: Departure, Carrier: Arrival. Чат: "Loading at [location] has been confirmed by [user]" |
| `smokeTest/replanTP.js` | Перенос TP | Hover → "Show actions" → datepicker. Чат: "has been replanned by [user]" |
| `smokeTest/requestInfoTP.js` | Запрос информации по TP | Модал: "Just need confirmation" / "Still expect [time]". Чат: уведомление Carrier |

### Локации и документы

| Файл | Фича | Детали |
|------|------|--------|
| `smokeTest/updateLocation.js` | Обновление локации PU/DEL | Shipment: "Update location test timestamp [automation]". Carrier видит изменения. Чат: "Test has updated the Pick-up/Delivery location" |
| `smokeTest/updateDate.js` | Обновление даты TP | Datepicker без смены локации |
| `smokeTest/regenerationPDF.js` | Перегенерация PDF документа | Триггеры: изменение cargo qty / PU/DEL / стоимости. Чат: "Transport Order has been regenerated". Версионирование в Documents |

### Freight Units (FU)

| Файл | Фича | Детали |
|------|------|--------|
| `smokeTest/creatingFU.js` | Создание FU | FU: PU + DEL location + Availability date. Alert: "Freight units created!". Prefix формат: `007-` |
| `smokeTest/addingFU.js` | Добавление FU к перевозке | CSW step1 → "Add information" → FU key. Carrier НЕ видит FU keys |

### Слоты и планирование

| Файл | Фича | Детали |
|------|------|--------|
| `smokeTest/slotBookingByShipper.js` | Бронирование слота (Shipper) | Тип: DELIVERY |
| `smokeTest/slotBookingByCarrier.js` | Бронирование слота (Carrier) | Тип: PICK-UP |
| `smokeTest/planning.js` | Planning view (Board/Day) | Tabs: Board/Day, Toggle: RECEPTION/EXPEDITION. Default ML: из User Profile / Dock Settings |

### Доступ и роли

| Файл | Фича | Детали |
|------|------|--------|
| `smokeTest/addingSpectator.js` | Добавление Spectator | Blue block: "This shipment tracking is shared with/by [name]". Только Tracking tab |
| `smokeTest/publicMasterLocationUser.js` | PML User доступ | Booker создаёт shipment с PML локацией → PML user видит только Tracking |
| `smokeTest/displayingShipmentsOnTheMySite.js` | My Site (IN/OUT toggle) | "My Site REC test [automation]" (IN), "My Site EXP test [automation]" (OUT) |
| `smokeTest/loginAsDock.js` | Dock интерфейс | URL /dock → dockStatistics + header |

### Группировка

| Файл | Фича | Детали |
|------|------|--------|
| `smokeTest/grouping.js` | Grouping (departure/arrival) | Modals: groupedPickUpModal, groupedDeliveryModal |
| `smokeTest/pickUpGrouping.js` | Pick-up Grouping | Фильтры: локация + ROAD + carrier + Past/Future. Actions: selectShipment → groupDepartureButton → assignToTheGroupButton |

### Другие

| Файл | Фича | Детали |
|------|------|--------|
| `smokeTest/managingFollowers.js` | Управление followers в чате | Teammates/Partners |
| `smokeTest/assigningFollowers.js` | Назначение followers | Системные сообщения |
| `smokeTest/incoterms.js` | Incoterms | Buy/Sell toggles, DDP/DDU. Иконка + тултип на Booking/Tracking tabs |
| `smokeTest/creatingFO.js` | Freight Orders (brothers modal) | 2 Shipments с маршрутными линиями |
| `smokeTest/creatingMC.js` | Multi-container (3 контейнера) | Labels: 0001/0002/0003 |
| `smokeTest/contentAtTheBookingLevel.js` | Packing list на BK уровне | CSW: Define logistics mean → Containers (Car). В списке: "1 Car" |

---

## Rate Sheets Tests

| Файл | Фича | Тестовые данные |
|------|------|----------------|
| `rateSheets/usualRateSheets/countMilkrunRateSheet.js` | Расчёт цены Milkrun по Rate Sheet | Cargo: Palette 60×80, Locations: AnotherLocation → Albuquerque x2. Цена: 10,000 (vs стандарт 8,500). RS: "MILKRUN [Automation]" |
| `smokeTest/rateSheet.js` | Базовый Rate Sheet | Cargo: Cardboard box (qty 10, 100kg). Locations: Albuquerque → AnotherLocation. Цена: 8,500 |

---

## Тестовые данные (канонические)

### Локации
| Название | Использование |
|---------|--------------|
| **Albuquerque** | Основная PU-локация |
| **Eiffel Tower / Paris** | Основная DEL-локация |
| **AnotherLocation** | Вторичная DEL-локация |
| **ChangedLocation** | Для тестов обновления локации |
| **TestLocation** | Для PML user |

### Перевозчики
- **Green Carrier** — основной тестовый перевозчик для direct booking

### Типы груза
- Box 60×30×30, Box 60×40×40, Palette 60×80, Cardboard box

### Ценовые точки
- Стандартный rate sheet: **8,500**
- Milkrun rate sheet: **10,000**

### UI элементы (имена)
| Имя элемента | Что делает |
|-------------|-----------|
| `nShipmentsAlreadyExistAlert` | Предупреждение о похожих заявках |
| `addAnotherDeliveryPickingPointButton` | Добавить второй pre-shipment |
| `shipmentBrothersBlock` | Блок "2 Shipments" для Milkrun |
| `blueMilkrunBlock` | Синий индикатор Milkrun на Tracking tab |
| `updatePickUpLocationButton` | Кнопка обновления PU локации |
| `updateDeliveryLocationButton` | Кнопка обновления DEL локации |
| `rateSheetPrice` | Отображение рассчитанной цены |
| `appliedRateSheet` | Название применённого Rate Sheet |
| `autoConfirmButton` | AUTO-CONFIRM BOOKING |

---

## Расширенные сьюты

| Папка | Содержимое |
|-------|-----------|
| `rateSheets/*` | Rate sheet CRUD, locode/country/logzone/zipcode, milkrun расчёты |
| `invoicing/*` | Invoice/pre-invoice создание, фильтрация строк, добавление стоимости |
| `transportRequests/*` | TR сценарии (создание TR из SR) |
| `followerTests/*` | Default followers, multi-account followers, QR follower сценарии |

---

## 🔗 Граф-метаданные
- **id:** `autotest_map`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631963649 · **repo:** `AUTOTEST_MAP.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

