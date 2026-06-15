# 07_AUTOTEST_MAP.md

> Индекс автотестов → фичи/флоу/страницы. Цель: быстро находить "как это реально кликается".

Корень: `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests`

Текущее состояние репозитория (снимок): ~**156** файлов `*.js`/`*.ts` в `uiTests/` (count на 2026-05-31).

## 1) Smoke / основная регрессия

### Milkrun
- **Создание delivery milkrun (2 pre-shipments → 2 shipments)**
  - path: `smokeTest/creatingMilkrun.js`
  - ключевые данные из теста:
    - CSW step1:
      - shipment name: `Milkrun test [automation]`
      - при вводе имени появляется alert `nShipmentsAlreadyExistAlert` — по smoke-тестам это **неблокирующий warning** о том, что в системе уже есть shipments с таким же/похожим названием (в автотестах имена часто не уникальны)
      - cargo types: `Box 60x30x30` + `Box 60x40x40`
      - pick-up: `Albuquerque` (Today 10:00)
      - delivery#1: `Eiffel Tower` (Today 18:00)
      - delivery#2: `AnotherLocation` (Today 20:00)
    - carrier: `Green Carrier`
  - проверки:
    - CSW: `addAnotherDeliveryPickingPointButton`
    - Booking tab: shipmentBrothersBlock = `2 Shipments` + brothersModal count=2
    - Tracking tab: `blueMilkrunBlock` visible

- **Milkrun + Rate sheet price (direct booking) — расчёт цены и applied rate sheet**
  - path: `rateSheets/usualRateSheets/countMilkrunRateSheet.js`
  - ключевые данные:
    - shipment name: `RS Milkrun [automation]`
    - cargo: `Palette 60*80` (qty+)
    - pick-up: `AnotherLocation` Today 08:00
    - delivery#1: `Albuquerque` Today 18:00 (в тесте: `inputDeliveryLocationName('Albuquerque')` → `selectLocation('Albuquerque')`)
    - addAnotherDeliveryPickingPointButton → второй pre-shipment (cargo same; pick-up `AnotherLocation`; delivery `Albuquerque`)
    - carrier: `Green Carrier`
  - проверки:
    - CSW step2: виден `rateSheetPrice` и текст = `10,000 €`
    - Booking tab:
      - carriers block: `carrierPrice` = `10,000 €`
      - central block: `appliedRateSheet` = `MILKRUN [Automation]`
    - Invoicing tab:
      - validatedCost/agreedCost = `10,000.00 €`
      - `appliedRateSheet` = `MILKRUN [Automation]`

- **Обычный shipment + Rate sheet price (direct booking) — baseline для RS UI (НЕ milkrun)**
  - path: `smokeTest/rateSheet.js`
  - ключевые данные:
    - shipment name: `Rate sheet test [automation]`
    - cargo: `Cardboard box` qty=10, total weight=100
    - pick-up: `Albuquerque` Today 08:00
    - delivery: `AnotherLocation` Today 18:00
    - carrier: `Green Carrier`
  - проверки:
    - CSW step2: `rateSheetPrice` visible и текст = `8,500 €`
    - Booking tab:
      - carriers block: `carrierPrice` = `8,500 €`
      - central block: `appliedRateSheet` = `Rate Sheet for automation`
    - Invoicing tab:
      - validatedCost/agreedCost = `8,500.00 €`
      - `appliedRateSheet` = `Rate Sheet for automation`

- **Milkrun monitoring modal / tooltip / addresses (пока без автотеста, есть кейсы в Qase-экспорте)**
  - источник: `/shiptify/test-cases/MA-2026-05-25.json`
  - кейсы: **916** (milkrun label), **917** (addresses), **918** (tooltip), **924** (banner), **926** (modal opening), **927** (modal content), **925** (+n indicator), **1055** (from/to addresses), **1061** (routes on map)

- **Milkrun & FTL: packing list / cargo levels (BK vs PSH) — частичное покрытие**
  - Qase suite: `Main app / Milkrun & FTL` (suite id **274**)
  - кейсы: **2027–2046** (milkrun/обычный FO + single/multi containers на **BK level** и **PSH level**, а также emailing/PDF)
  - автотесты (что есть сейчас):
    - `smokeTest/contentAtTheBookingLevel.js` — проверяет добавление контейнера/packing list на **booking level (BK)**:
      - CSW step1: Define a logistics mean → Containers dropdown → `Car` → Add detailed packing list
      - CSW step2: виден `shipmentCard.contentFromTheBookingLevelZone`
      - Booking tab: виден `packingList.contentFromTheBookingLevelZone`
      - Booking list: cargo summary = `1 Car` (`firstLineCargo.textContent == ' 1 Car '`)
  - что НЕ покрыто автотестами (по текущему набору uiTests):
    - PSH-level packing list (pre-shipment level) именно для milkrun/FTL (кейсы 2033–2038)
    - emailing/PDF flows для milkrun & FTL (кейсы 2040–2046)

### Grouping / Pick-up grouping
- **Export Grouping list (.xlsx)**
  - path: `export/exportGrouping/exportGrouping.js`
  - проверки:
    - Sidebar → **GROUPING**
    - поиск `Future [automation]`
    - `totalShipments` = `1 Shipments`
    - **EXPORT** скачивает xlsx, который сравнивается с `expectedFile.xlsx`
- **Grouping (departure/arrival/shipment)**
  - path: `smokeTest/grouping.js`
  - проверки:
    - после grouping на Tracking tab видны ссылки `Grouped with 1 other shipment` (departure/arrival)
    - модалки: `groupedPickUpModal` / `groupedDeliveryModal` / `groupedPickUpAndDeliveryModal`
- **Pick-up grouping (создание группы + assign shipment)**
  - path: `smokeTest/pickUpGrouping.js`
  - ключевые действия:
    - фильтры: departure location + ROAD + carrier + Past/Future
    - выбор shipments: `selectShipment(<name>)`
    - `groupDepartureButton` → modal **Grouped Pick Up** → ввод `group name` → выбрать дату → **Group**
    - проверка: `groupBlock.visible == true` + кнопка `nShipmentsButton` раскрывает список shipments в группе
    - `assignToTheGroupButton` → modal **Assign shipments to the group** → **Assign**

### Tracking sharing (Spectator)
- **Добавление spectator в CSW и проверка blue block на Tracking (shipper side)**
  - path: `smokeTest/addingSpectator.js`
  - проверка: `blueSpectatorBlock` text = `This shipment tracking is shared with Shipper`
- **Открытие shipment под spectator и проверка Tracking-only доступа (spectator side)**
  - path: `smokeTest/addingSpectator.js` (part two)
  - проверки:
    - tabs: Tracking ✅, Booking ❌, Invoicing ❌
    - `blueSpectatorBlock` text = `This shipment tracking is shared by reppihS`

### Update location (Booking tab)
- **Update pick-up/delivery location (shipper) + visibility for carrier**
  - path: `smokeTest/updateLocation.js`
  - ключевые шаги/данные:
    - shipment name генерируется как `Update location test <timestamp> [automation]`
    - CSW step1:
      - cargo: `Cardboard box` (qty +1)
      - PU: `Albuquerque` Today 11:00
      - DEL: `Eiffel Tower` Today 23:00
      - direct booking → carrier `Green Carrier`
    - Update PU modal:
      - `updatePickUpLocationButton` → location `AnotherLocation` → Today 11:00 → `nextButton` → `confirm`
    - Update DEL modal:
      - `updateDeliveryLocationButton` → location `ChangedLocation` → Today 23:00 → `nextButton` → `confirm`
  - checks:
    - Booking tab chat messages:
      - `Test has updated the Pick-up location.`
      - `Test has updated the Delivery location.`
    - shipment card baseline before/after:
      - before update: `pickUpAddress = Breaking Bad | Albuquerque`
      - after PU update: `pickUpAddress = AnotherLocation`
      - after DEL update: `deliveryAddress = ChangedLocation`
    - Booking list:
      - firstLineFromAddress = `AnotherLocation`
      - firstLineToAddress = `ChangedLocation`
    - Carrier side:
      - видит обновлённые from/to в booking list + в shipment card
      - видит оба сообщения в чате
  - milkrun-stage note:
    - Qase кейсы 2826–2829 описывают update location именно для milkrun (Delivery/Collect) — пока нет отдельного автотеста, нужно закрепить в KB по TD Confluence + ручной проверке на /milkrun.

- **Update pick-up/delivery date-time only (без смены location)**
  - path: `smokeTest/updateDate.js`
  - идея: открыть update PU/DEL modal и поменять только дату/время через datepicker; затем Next→Confirm.
  - note: проверить фактический текст системных сообщений в чате (может совпадать с updateLocation).

- **Transport Order regeneration / PDF versioning after updates**
  - path: `smokeTest/regenerationPDF.js`
  - what it validates (high level):
    - после изменения cargo quantity / update PU / update DEL / edit cost (Invoicing) появляется green alert `Booking transport order has been generated`
    - в чате появляется `Transport Order has been regenerated.`
    - в **Documents list** растёт количество attachments; 1 active + остальные disabled (версионирование PDF)

- **Milkrun-stage: update location for milkrun (Delivery/Collect)**
  - автотеста нет (в UI autotests не найдено отдельного `milkrun update location` сценария)
  - Qase cases (suite `Location update`): **2826–2829**
  - статус: TBD — нужно вычитать TD Confluence/проверить на стенде `/milkrun`

### Tracking Points (TP)
- **Confirm TP (shipper + carrier)**
  - path: `smokeTest/confirmTP.js`
  - проверки:
    - shipper подтверждает Departure → исчезают Confirm/Replan → чат: `Loading at ... has been confirmed by reppihS:`
    - carrier подтверждает Arrival → исчезают Confirm/Replan arrival → чат: `Delivery in ... has been confirmed by Green Carrier:`
- **Replan TP (shipper)**
  - path: `smokeTest/replanTP.js`
  - ключевые моменты:
    - hover Departure TP → видно исходное время
    - Show actions → Replan → week datepicker (выбор времени) → Next → Replan tracking point
    - проверка: время TP обновилось (например, `23:15` → `23:30`)
    - чат: `Loading at Breaking Bad | Albuquerque has been replanned by reppihS:`
- **Request info TP (shipper)**
  - path: `smokeTest/requestInfoTP.js`
  - проверки:
    - modal Request information закрывается после веток *Just need confirmation* / *Still expect*
    - чат: regex на сообщение-запрос перевозчику (confirm or replan)

### Chat followers
- **Назначение followers в чате (Teammates/Partners)**
  - path: `smokeTest/assigningFollowers.js`

### Freight Unit (FU)
- **Создание Freight Unit (отдельная сущность) через страницу FREIGHT UNITS**
  - path: `smokeTest/creatingFU.js`
  - ключевые шаги/проверки:
    - Sidebar → **FREIGHT UNITS** → **Create**
    - заполнить **Pick-up location** + **Delivery location**
    - выбрать **Availability date = Today**
    - Confirm → green alert `Freight units created!`
    - в списке FU: фильтр Availability date = Today → ожидается строка с префиксом вида `007-` (вероятно account code + auto-number)

- **Добавление FU key к cargo при создании shipment + проверки видимости (Shipper vs Carrier)**
  - path: `smokeTest/addingFU.js`
  - что проверяет (детально):
    - Shipper (CSW step1) → **Add information** → `Freight Unit = FU key [automation]`
    - CSW step1 comment: `FU: FU key [automation]`
    - CSW step2 shipment card: `FU - FU key [automation]`
    - Booking tab → Packing list → Cargo contents modal: `FU - FU key [automation]`
    - Tracking tab → Packing list → Cargo contents modal: `FU - FU key [automation]`
    - Carrier: **FU key не отображается** (`cargoFreightUnit.exists == false`) ни на Booking, ни на Tracking

### Dock
- **Login as Dock user (dock interface)**
  - path: `smokeTest/loginAsDock.js`
  - проверки:
    - URL `/dock`
    - `dockStatistics` visible
    - header account data (имя + компания)

### SR / QR / Draft / Slot booking / Planning

#### Draft
- path: `smokeTest/creatingDraft.js`
- ключевые шаги:
  - CSW step1 → заполнить shipment name + cargo + pick-up/delivery (business days) → **SAVE DRAFT**
  - проверка в booking list: status = `Draft`

#### SR (Shipment Request)
- path: `smokeTest/shipmentRequest.js`
- ключевые шаги:
  - CSW step1 → **DIRECT BOOKING** → выбрать carrier → **SEND BOOKING**
  - проверка: виден `autoConfirmButton`, в чате сообщение `...awarded you a shipment...`
- auto-confirm SR:
  - открыть booking по имени → **AUTO-CONFIRM** → **AUTO-CONFIRM BOOKING**
  - проверки: появляются вкладки Tracking/Invoicing/Booking + URL переход `/shipment-requests/` → `/shipments/` → `/invoicing/`

#### QR (Quote Request)
- path: `smokeTest/quoteRequest.js`
- ключевые шаги:
  - CSW step1 → **REQUEST A QUOTE** → выбрать 3 carriers → **REQUEST QUOTES**
  - auto-quote: выбрать carrier → **AUTO-QUOTE** → price → **SAVE QUOTE**
  - award: **AWARD** → Confirm modal
  - auto-confirm: **AUTO-CONFIRM** → **AUTO-CONFIRM BOOKING**
  - проверки: URL переход `/shipment-requests/` → `/shipments/` → `/invoicing/`

#### Public Master Location (PML) user access
- path: `smokeTest/publicMasterLocationUser.js`
- смысл: shipment создан с pick-up=TestLocation (PML/ML) + Zone → в другом аккаунте доступен только Tracking tab.
  - вкладки Booking/Invoicing отсутствуют (Tracking-only)

#### My Site (IN/OUT) listing
- path: `smokeTest/displayingShipmentsOnTheMySite.js`
- смысл: список shipments по собственной ML пользователя
  - переключатель направления: **IN** (delivery=ML) / **OUT** (pick-up=ML)
  - smoke: IN показывает `My Site REC test [automation]`, OUT показывает `My Site EXP test [automation]`.

#### Slot booking (shipper/carrier)
- `smokeTest/slotBookingByShipper.js` — slot type **DELIVERY**, шаги: Location → Orders → Zone → Packing list → Time slot → Carrier → Confirm
- `smokeTest/slotBookingByCarrier.js` — slot type **PICK-UP**, шаги аналогично (без carrier data step)

#### Planning (Slotify Planning)
- `smokeTest/planning.js` — создание 2 shipments (REC/EXP) + проверка Planning:
  - Board tab: видимость slot cards по названию shipment
  - Переключение направлений: RECEPTION/EXPEDITION (фильтр)
  - Day tab: URL `/schedule/` + shipment cards по локациям (Albuquerque/Paris)
  - Default ML проверка: My Profile location = `Address1, City, Country` + Dock Settings ML = `TestLocation` (id 41695)

#### Ready-to-Book (RTB)
- `smokeTest/readyToBook.js` — создание booking в статусе Ready-to-book (сохранение на step2 вместо отправки) + базовые проверки наличия в списке
  - заметка из Qase-экспорта (кейс 1340): после создания RTB якобы включается фильтр `Draft` в booking list — выглядит как copy/paste, но пока оставляем как известную ambiguity до ручной верификации.

#### Incoterms
- `smokeTest/incoterms.js` — выбор/установка Incoterm в CSW + проверка отображения incoterm в UI (before locations / shipment card / packing list)

#### Followers (manage / default)
- `smokeTest/managingFollowers.js` — управление followers в чате (Teammates/Partners)
- `smokeTest/assigningFollowers.js` — выбор followers + проверка системных сообщений в чате
- `followerTests/*` — расширенные сценарии вокруг default followers / multi-account / followers in QR

### Brothers modal: связанные shipments vs контейнеры (не Milkrun)
- **FO (Freight Order) с 2 shipments (brothers = 2 Shipments)**
  - path: `smokeTest/creatingFO.js`
  - признаки:
    - после auto-confirm появляется `shipmentBrothersBlock` с текстом `2 Shipments`
    - в brothers modal строки маршрутов (пример):
      - `Breaking Bad | Albuquerque > Eiffel Tower | Paris`
      - `Minsk > Grodno`
- **MC (Multi-container) (brothers = 3 Containers)**
  - path: `smokeTest/creatingMC.js`
  - признаки:
    - после auto-confirm появляется `shipmentBrothersBlock` с текстом `3 Containers`
    - brothers modal показывает контейнеры `0001/0002/0003`
    - Tracking tab: packing list block `2 other containers on this booking` + dropdown brothers
    - Invoicing tab: block `3 containers were booked` + список контейнеров

## 2) Кроме smokeTest: что ещё есть в uiTests (быстрая карта папок)

Это не полный аудит, но уже видно, что кроме `smokeTest/*` активно используются такие направления:
- `rateSheets/*` — сценарии вокруг rate sheets (в т.ч. milkrun), locode/country/logzone/zipcode, CRUD rate sheets.
- `invoicing/*` — создание invoice/pre-invoice, фильтры lines, add costs.
- `transportRequests/*` — TR сценарии (например, создание TR из SR).
- `followerTests/*` — default followers, multi-account, followers in QR.

> Цель этого раздела: быстро понимать «куда копать», когда нужно расширять KB/регрессию.

## 3) Rate Sheets

### Milkrun rate sheet price
- **Milkrun shipment with price from the rate sheet**
  - path: `rateSheets/usualRateSheets/countMilkrunRateSheet.js`
  - проверки:
    - CSW step2: `rateSheetPrice` visible, текст `10,000 €`
    - Booking tab: applied rate sheet `MILKRUN [Automation]`
    - Invoicing tab: validated/agreed costs `10,000.00 €`

## 4) Прочие smokeTest-сценарии (список файлов в наборе)
Папка `uiTests/smokeTest/` содержит множество флоу (SR/QR/Draft/Slot booking/Tracking и др.).

Минимально полезные для текущей фазы milkrun:
- `creatingDraft.js` — создание Draft
- `shipmentRequest.js` — SR
- `quoteRequest.js` — QR
- `slotBookingByShipper.js` / `slotBookingByCarrier.js` — Slot booking
- `planning.js` — planning views

(Детализация по этим сценариям — следующей итерацией, после стабилизации milkrun docs.)

## 5) Backlog: чего не хватает в автотестах (milkrun stage)

Ниже — список проверок, которые уже есть в Qase, но **пока не закреплены UI автотестами** (кандидаты на расширение regression):
- Milkrun **Tracking list**: label `Milkrun` + addresses list + blue-circle tooltip + `+n` indicator (кейсы 916/917/918/925).
- Milkrun **update PU/DEL locations** (Delivery/Collect) (кейсы 2826-2829) — пока нет автотестов.
- Milkrun **banner** на shipment card + **monitoring modal** opening/content + from/to correctness (кейсы 924/926/927/1055) + routes on map (1061).
- **Create Milkrun** lifecycle на странице Grouping: [MILKRUN] button → Create Milkrun Modal → status `grouped` (кейсы 2013/2054/2014) — пока без UI autotest.
- Milkrun + **FU keys** (1417/1419/1421) и ограничения для spectator (1422/1447) — пока нет UI autotest.
- Milkrun + **FU keys** (detail page, created/existing keys under cargos, multicontainers + confirm carrier) (кейсы 1417/1419/1421).
- Milkrun **PS-level features** в CSW (кандидаты на тесты/ручную верификацию):
  - Spectators @ PS level (1430/1431)
  - Incoterms @ PS level + blue zone next to address (1432/1434)
  - Multicontainers @ PS level (1441)
- Spectator side:
  - **milkrun block visibility** (кейс 1447 — есть противоречие между названием и expected result; сначала нужна ручная верификация на стенде)
  - **FU keys visibility** (кейс 1422 — keys are not displayed from spectators)
  - **brothers modal access** для multicontainers (кейс 1442)
- Milkrun + **multicontainers** (BK level / PSH level) — кандидаты на отдельный smoke/regression UI autotest после ручной вычитки шагов/ожиданий.
  - Milkrun suite (Qase export): 2027/2028 (one container @BK), 2030/2031 (multi @BK), 2033/2034 (one @PSH), 2035/2036 (multi @PSH), 2037/2038 (both BK+PSH).
  - Контрольные Ordinary FO кейсы для сравнения поведения: 2029/2032/2039.

