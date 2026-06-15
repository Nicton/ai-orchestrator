# 04_USER_FLOWS.md

> Документ про end-to-end пользовательские сценарии (happy path + ключевые развилки).

## A) Создание delivery Milkrun (Shipper) — smoke/happy path

**Цель**: создать milkrun (2 pre-shipments) → подтвердить → увидеть связанные shipments и milkrun-индикаторы.

Условие Milkrun (по Qase 1625): во втором pre-shipment должны совпасть **pick-up или delivery (или оба) locations и дата** с предыдущим pre-shipment.

Verbatim expected result (Qase 1625, из экспорта):
- `After filling in all the mandatory fields of CSW and clicking [Add another delivery/picking point] button, by specifying the same pick-up or delivery (or both) locations and date as in previous pre-shipment, after booking confirmation, Milkrun is created and the booking tab opens`

### Шаги (по автотесту)
Источник: `/main-app-automation/src/tests/uiTests/smokeTest/creatingMilkrun.js`

1. Login как **Shipper** (`role.mainShipper`).
2. Sidebar: **+BOOK**.
3. Mode: **ROAD**.
4. Тип: **Spot purchase**.
5. CSW Step 1:
   - Shipment name: `Milkrun test [automation]`
   - (UI проверка из smoke) появляется alert `nShipmentsAlreadyExistAlert`
   - Cargo: `Box 60x30x30` qty+1
   - Pick-up: `Albuquerque` Today 10:00
   - Delivery #1: `Eiffel Tower` Today 18:00
6. Нажать **Add another delivery/picking point** (`addAnotherDeliveryPickingPointButton`) (создаёт второй pre-shipment).
7. Заполнить второй pre-shipment:
   - Cargo: `Box 60x40x40` qty+1
   - Pick-up: `Albuquerque`
   - Delivery #2: `AnotherLocation` Today 20:00
8. Нажать **DIRECT BOOKING**.
9. CSW Step 2: выбрать carrier `Green Carrier`.
10. Нажать **SEND BOOKING**.
11. На Booking tab нажать **AUTO-CONFIRM** → **AUTO-CONFIRM BOOKING**.
12. Проверки:
   - появляется блок **“2 Shipments”**
   - модалка brothers содержит оба shipments
13. Перейти на вкладку **Tracking**.
14. Проверить наличие **blueMilkrunBlock**.
15. Зафиксировать post-condition: milkrun в smoke подтверждается сразу тремя независимыми артефактами — `2 Shipments` brothers block, brothers modal с двумя маршрутами и `blueMilkrunBlock` на Tracking.

#### UI-идентификаторы/селекторы (из автотеста)
- `csw.firstStep.nShipmentsAlreadyExistAlert` — alert после ввода Shipment name (видимость проверяется).
- `csw.firstStep.addAnotherDeliveryPickingPointButton` — добавление второго pre-shipment.
- `tab.bookingTab.centralBlock.shipmentBrothersBlock` — блок `"2 Shipments"`.
- `brothers.brothersModal` + `brothers.shipmentBrother` — содержимое brothers modal.
- `tab.trackingTab.shipmentCard.blueMilkrunBlock` — маркер milkrun на Tracking tab.

### Ожидаемые артефакты в UI
- Brothers modal показывает связанные shipments (N=2).
- Tracking tab визуально маркирует milkrun.

### A.0) Milkrun + Rate Sheet price (Direct booking)

**Цель**: при создании milkrun через CSW убедиться, что:
- на CSW Step2 отображается **rate sheet price**
- после booking confirmation цена/Rate Sheet корректно отображаются на Booking и Invoicing

Источник: `/main-app-automation/src/tests/uiTests/rateSheets/usualRateSheets/countMilkrunRateSheet.js`

1. Login как **Shipper** (`role.mainShipper`).
2. Sidebar: **+BOOK** → Mode **ROAD** → **Spot purchase**.
3. CSW Step1:
   - Shipment name: `RS Milkrun [automation]`
   - Cargo: `Palette 60*80` (qty+)
   - Pick-up: `AnotherLocation` Today 08:00
   - Delivery #1: `Albuquerque` Today 18:00
   - **Add another delivery/picking point** → второй pre-shipment:
     - Cargo: `Palette 60*80`
     - Pick-up: `AnotherLocation`
     - Delivery #2: `Albuquerque`
4. **DIRECT BOOKING** → Carrier: `Green Carrier`.
5. Проверки на CSW Step2:
   - `rateSheetPrice` visible
   - текст цены = `10,000 €`
6. **SEND BOOKING** → на Booking tab:
   - `carrierPrice` = `10,000 €`
   - `appliedRateSheet` = `MILKRUN [Automation]`
7. **AUTO-CONFIRM** → **AUTO-CONFIRM BOOKING**.
8. Invoicing tab:
   - `validatedCost` / `agreedCost` = `10,000.00 €`
   - `appliedRateSheet` = `MILKRUN [Automation]`

### A.1) Tracking list: Milkrun label + tooltip (по Qase)
Источник: Qase-экспорт `/shiptify/test-cases/MA-2026-05-25.json`:
- 916 *Milkrun*
- 917 *List of milkrun addresses*
- 918 *Tooltip for milkrun*
- 925 *Indicator for multipoint shipment*

Флоу проверки (ожидаемый):
1. Открыть список (Tracking list / booking list) где видны карточки shipments/FO.
2. Найти карточку, где есть одинаковые pick-up/delivery locations + date у related shipments.
3. Проверить, что вместо одной из локаций отображается **"Milkrun"**.
4. Проверить, что под **"Milkrun"** отображается список адресов milkrun.
5. Навести на **blue circle** перед словом **"Milkrun"** → появляется tooltip со списком stops (location + date/time).
6. Если применимо: после одной из локаций отображается индикатор **"+n"** (число related shipments).

### A.2) Открытие Milkrun monitoring modal (Tracking tab → shipment card)
Источник: Qase-экспорт `/shiptify/test-cases/MA-2026-05-25.json` (suite path: `Main app / Freight Orders & Freight Units / Freight Orders`):
- 924 *Block for related shipments (milkrun)*
- 926 *Milkrun monitoring modal opening*
- 927 *Content of Milkrun monitoring modal*
- 1055 *Locations on block for milkrun* (проверка from/to адресов на баннере)
- 1061 *Routes on map* (проверка маршрутов на карте в monitoring modal)

**Verbatim expected results (Qase):**
- (924) `Banner with text "This shipment belongs to a Milkrun with x steps from 'From location' to 'To location'. Click here to see full Milkrun" displayed on shipment card, if this shipment is a part of milkrun`
- (926) `Milkrun monitoring modal window opens when clicking on the [Click here] button of milkrun banner on shipment card`
- (927) `Milkrun monitoring modal contains locations with dates (as on shipment card), all related shipments with their statuses (as on central menu of booking tab) and map with routes on it`
- (1055) `Correct addresses from where to where milkrun is moves are displayed on the block for milkrun...`

---

## B) Milkrun + rate sheet price (Shipper) — расчёт цены по rate sheet

**Цель**: создать milkrun shipment, где итоговая цена/расчёт подтягиваются из **Rate Sheet**.

Источник (UI autotest): `/main-app-automation/src/tests/uiTests/rateSheets/usualRateSheets/countMilkrunRateSheet.js`

Связанные тест-кейсы из Qase-экспорта `/shiptify/test-cases/MA-2026-05-25.json`:
- 4221 *Milkrun calculation* (suite: `Main app / Rate Sheets / Usual rate sheets / RS calculations`)
  - шаги (из экспорта):
    1) Upload xls table for milkrun sub-rate
    2) Open CSW
    3) Select cargo according to RS rules
    4) Create 2+ pre-shipments with at least one unique location (locations according to RS rules)
    5) Fill other mandatory fields
    6) Click [DIRECT BOOKING] → expected: `Carrier with milkrun price for corresponding cost segment is displayed`
    7) Click [SEND BOOKING] → expected: `SR is created with price for corresponding cost segment`

Что проверять в UI (минимум):
- rate sheet применяется к milkrun (booking/shipment),
- итоговая цена соответствует ожиданиям rate sheet,
- в интерфейсе видно applied rate sheet / price breakdown (если отображается).

### Конкретные проверки (из автотеста, как "ground truth")
Источник: `rateSheets/usualRateSheets/countMilkrunRateSheet.js`
- CSW step2: `rateSheetPrice` видим и текст = **`10,000 €`**.
- После **Send booking** (Booking tab):
  - carriers block: `carrierPrice` = **`10,000 €`**
  - central block: `appliedRateSheet` = **`MILKRUN [Automation]`**
- После auto-confirm (Invoicing tab):
  - `validatedCost` = **`10,000.00 €`**
  - `agreedCost` = **`10,000.00 €`**
  - `appliedRateSheet` = **`MILKRUN [Automation]`**

---

## C) Milkrun & FTL (suite 274) — контейнеры/packing list на BK vs PSH level + PDF/email (черновик)

Источник: Qase-экспорт `/shiptify/test-cases/MA-2026-05-25.json` → suite **`Main app / Milkrun & FTL`** (id **274**).

Что там проверяется (по названиям кейсов):
- milkrun vs ordinary FO
- single container vs multiple containers
- уровень packing list:
  - **BK level** (booking level): кейсы **2027–2032**
  - **PSH level** (pre-shipment level): кейсы **2033–2038**
  - смешанный BK+PSH: кейсы **2037–2039**
- коммуникации/артефакты:
  - emailing shipment с cargo на разных уровнях: **2040–2042**
  - PDF files (documents) shipment с cargo на разных уровнях: **2043/2045/2046**

Связь с автотестами (что уже подтверждено):
- BK-level packing list (контейнеры на уровне booking) покрыт smoke автотестом:
  - `/main-app-automation/src/tests/uiTests/smokeTest/contentAtTheBookingLevel.js`
  - точный flow из теста:
    - CSW step1: **Define a logistics mean** → Containers dropdown → выбрать контейнер **Car**
    - CSW step1: нажать **Add detailed packing list** → выбрать cargo type **Rafter** → qty +1
    - CSW step2: виден блок `shipmentCard.contentFromTheBookingLevelZone`
    - Booking tab: в Packing list виден `packingList.contentFromTheBookingLevelZone`
    - Booking list: cargo summary = `1 Car` (в тесте сравнивается как `firstLineCargo.textContent == ' 1 Car '`)

Что нужно добрать для milkrun-stage (ручная проверка + TD Confluence):
- как именно UI различает BK vs PSH packing list для milkrun (где отображается; как выглядит в cargo contents modal)
- какие ограничения у Spectator/PML по PDF/email для milkrun

---

## D) Grouping / Pick-up grouping (Shipper) — операционные флоу

### D.1) Group departure / Group arrival / Group shipment
Источник: `/main-app-automation/src/tests/uiTests/smokeTest/grouping.js`

1. Login как **Shipper**.
2. Создать как минимум две совместимые отправки.
3. Sidebar → hover **GROUPING** → открыть **GROUPING**.
4. Выбрать shipment-ы и выполнить один из вариантов:
   - **Group departure** → выбрать общую дату/время pick-up + tag.
   - **Group arrival** → выбрать общую дату/время delivery + tag.
   - **Group shipment** → задать и pick-up, и delivery дату/время.
5. Проверка post-condition:
   - соответствующая modal закрылась;
   - у каждого shipment-а на Tracking tab появился link `Grouped with 1 other shipment`.

### D.2) Pick-up grouping: create group + assign shipment into existing group
Источник: `/main-app-automation/src/tests/uiTests/smokeTest/pickUpGrouping.js`

1. Login как **Shipper**.
2. Sidebar → hover **GROUPING** → открыть **PICK-UP GROUPING**.
3. Заполнить фильтры:
   - departure location,
   - mode `ROAD`,
   - carrier,
   - при необходимости `Past/Future`.
4. Выбрать shipment-ы → нажать **GROUP DEPARTURE**.
5. В modal **Grouped Pick Up**:
   - задать `group name`,
   - выбрать pick-up date/time,
   - нажать **GROUP**.
6. Проверить, что `nShipmentsButton` открывает список shipment-ов группы.
7. Для дозаписи нового shipment-а:
   - выбрать shipment,
   - выбрать существующую группу,
   - нажать **ASSIGN TO THE GROUP**,
   - в modal подтвердить **ASSIGN**.
8. Проверка post-condition:
   - shipment появляется внутри уже существующей group block / `nShipments` modal.

## E) Update Pick-up / Delivery location (shipper → carrier видит изменения)

**Цель**: обновить PU/DEL location (и дату/время) в Booking tab → увидеть системные сообщения в чате → убедиться, что изменения видит carrier.

Источник: `/main-app-automation/src/tests/uiTests/smokeTest/updateLocation.js`

### E.1) Shipper-side (part one)
1. Создать shipment через CSW (Direct booking):
   - cargo: `Cardboard box` (qty +1)
   - PU: `Albuquerque` Today 11:00
   - DEL: `Eiffel Tower` Today 23:00
   - carrier: `Green Carrier`
2. Booking tab: убедиться, что pick-up address = `Breaking Bad | Albuquerque`.
3. Booking tab → shipment card → **Update Pick-up location**:
   - открыть модалку `updatePickUpLocationModal`
   - `updatePickUpLocationButton`
   - location: `AnotherLocation`
   - date/time: Today 11:00
   - `nextButton` → `confirm`
4. Проверить: в чате Booking tab есть сообщение:
   - `Test has updated the Pick-up location.`
5. Перейти в sidebar → **BOOKING** (booking list):
   - search по shipment name
   - firstLineFromAddress = `AnotherLocation`
6. Открыть booking и проверить в shipment card:
   - pickUpAddress = `AnotherLocation`
   - deliveryAddress = `Eiffel Tower | Paris`
7. Booking tab → shipment card → **Update Delivery location**:
   - открыть `updateDeliveryLocationModal`
   - `updateDeliveryLocationButton`
   - location: `ChangedLocation`
   - date/time: Today 23:00
   - `nextButton` → `confirm`
8. Проверить: в чате есть сообщение:
   - `Test has updated the Delivery location.`
9. Booking list: firstLineToAddress = `ChangedLocation`.

### E.2) Carrier-side (part two)
1. Login как carrier → sidebar **BOOKING** → найти booking по shipment name.
2. Проверки (из smoke):
   - booking list: from=`AnotherLocation`, to=`ChangedLocation`
   - Booking tab shipment card: pickUpAddress=`AnotherLocation`, deliveryAddress=`ChangedLocation`
   - В чате видны оба сообщения shipper:
     - `Test has updated the Pick-up location.`
     - `Test has updated the Delivery location.`

**Milkrun-специфика**: в Qase есть отдельные кейсы 2826–2829 (update location for Delivery/Collect milkrun). В автотестах пока покрыт «обычный» shipment; для milkrun нужно подтвердить поведение на стенде /milkrun + вычитать TD Confluence.
- (1061) `Correct routes between all points of milkrun are displayed on the map of milkrun monitoring modal`

Флоу (как ожидается по описаниям expected results):
1. Открыть shipment, который является частью milkrun.
2. Перейти на **Tracking** → на shipment card найти milkrun banner с текстом про `x steps`.
3. Нажать на **[Click here]**.
4. Проверить, что открылась **Milkrun monitoring modal**.
5. Проверить содержимое:
   - locations с датами (как на shipment card)
   - related shipments + их статусы (как в центральном меню Booking tab)
   - map с маршрутами между всеми точками milkrun
6. Дополнительно: проверить корректность **from/to адресов** на milkrun banner (кейс 1055).

### A.2.1) Milkrun banner/block на стороне Spectator (ожидание vs баг)
Источник: Qase-экспорт `/shiptify/test-cases/MA-2026-05-25.json`:
- **1447** *Blue milkrun block isn't hidden on the spectator's side* (suite: Bugs)

Expected result из экспорта:
- `Milkrun block is hidden on the tracking tab of spectator's side`

Смежное ожидание по FU keys (Qase 1422, verbatim expected result):
- `Detailed page is opened and no possibility to switch tabs except TP from spectators`
  - трактуем как: spectator ограничен Tracking/TP и не должен видеть FU keys.

Что проверить на стенде:
1) Создать shipment/milkrun и добавить spectator.
2) Открыть shipment под spectator.
3) Проверить, отображается ли **milkrun banner / blue milkrun block** на Tracking tab.
4) Дополнительно (по Qase):
   - **1422** — spectator не видит FU keys (если на shipment присутствуют FU keys / milkrun-specific keys).
   - **1442** — spectator access to brothers (multicontainers): видит ли spectator brothers modal и какие элементы внутри.

Статус: **TBD** (нужно зафиксировать фактическое поведение; кейс помечен как баг).

## B) Milkrun: FU keys + Update location (milkrun-stage backlog)

### B.1) FU keys в milkrun (Qase 1417/1419/1421/1422) — сценарии для ручной проверки
Источник: `/shiptify/test-cases/MA-2026-05-25.json` (suite path: `Main app / Freight Orders & Freight Units / Freight Units`).

Цель: описать, **как в UI создаются/отображаются FU keys именно в milkrun** (и в multicontainers для milkrun), и какие ограничения у spectator.

#### Verbatim expected results (из Qase export)
- **1417**: `On the detail page is displayed new keys under the cargos`
- **1419**: `On the detail page is displayed  created  and existing keys under the cargos for milkrun`
- **1421**: `On the detail page is displayed  keys under every cargo after confirming carrier`
- **1422**: `Detailed page is opened and no possibility to switch tabs except TP from spectators`

> NB: в экспорте нет steps/скринов. Поэтому тут нужен либо ресёрч в TD Confluence, либо ручная фиксация фактического UI на /milkrun.

#### Что уже точно известно из UI autotests (не milkrun-специфично, но база по FU keys)
Источник: `uiTests/smokeTest/addingFU.js`

---

## C.1) Packing list / Containers: добавление контейнера на **BK level** (Smoke)

Источник: `uiTests/smokeTest/contentAtTheBookingLevel.js`

Цель: зафиксировать **как кликается** включение контейнера/packing list на *booking level* (BK) и какие артефакты появляются в UI.

Шаги (как в автотесте):
1) Login Shipper (`role.mainShipper`).
2) `+BOOK` → Mode `ROAD` → Spot purchase.
3) CSW step1:
   - Shipment name: `Content at the BK level test <timestamp> [automation]`
   - Нажать `Define a logistics mean`.
   - Containers dropdown → выбрать `Car`.
   - Нажать `Add detailed packing list`.
   - Cargo type: `Rafter` + увеличить quantity.
   - PU: `Albuquerque` Today `08:00`
   - DEL: `Eiffel Tower` Today `20:00`
4) `DIRECT BOOKING` → carrier `Green Carrier`.
5) CSW step2: проверить, что видна зона `contentFromTheBookingLevelZone`.
6) `SEND BOOKING`.
7) Booking tab: проверить, что видна `packingList.contentFromTheBookingLevelZone`.
8) Booking list: найти booking по shipment name и проверить cargo summary:
   - `firstLineCargo.textContent == " 1 Car "`

Практический смысл для milkrun-stage:
- это «база» для кейсов suite 274 (Milkrun & FTL), где сравниваются BK level vs PSH level.
- PSH-level аналог пока **не найден** в uiTests → нужно добрать из TD Confluence и/или добавить отдельный autotest.

---

**Как добавить FU key при создании shipment (Shipper):**
1. CSW step1 → Cargo → нажать **Add information**.
2. В blue modal:
   - ввести/выбрать Freight Unit: `FU key [automation]`
   - подтвердить (**Confirm**)
3. Проверка в CSW step1: в комменте Add information отображается `FU: FU key [automation]`.
4. После выбора carrier (CSW step2) в shipment card отображается `FU - FU key [automation]`.
5. На Booking tab → Packing list → Cargo contents modal: отображается `FU - FU key [automation]`.
6. На Tracking tab → Packing list → Cargo contents modal: отображается `FU - FU key [automation]`.

**Ограничение видимости (Carrier):**
- Carrier, открывая тот же booking/shipment, **не видит** FU key в Cargo contents modal ни на Booking, ни на Tracking tab (в тесте проверяется `cargoFreightUnit.exists == notOk`).

#### Что осталось закрыть (milkrun-stage)
- Применить те же проверки на milkrun shipments (brothers) и на multicontainers (BK/PSH level):
  - отображаются ли keys «под каждым cargo» для каждого brother shipment (Qase 1417/1419/1421)
  - spectator: keys не отображаются + Tracking-only access (Qase 1422)

- **1417**: Create keys for milkrun
- **1419**: created + existing keys displayed on detail page for milkrun (expected: *created and existing keys under the cargos for milkrun*)
- **1421**: saving keys multicontainers for milkrun (expected: *keys under every cargo after confirming carrier*)
- **1422**: keys are not displayed from spectators (expected: *no possibility to switch tabs except TP from spectators*)

Статус: **TBD** — в экспорте нет steps/expected results. Порядок закрытия:
1) найти Confluence TD страницу по Freight Units / keys / milkrun;
2) либо воспроизвести на стенде `/milkrun` после создания milkrun и описать фактические шаги.

Точка опоры из автотеста (не milkrun-specific, но показывает механику): `smokeTest/addingFU.js`.

### B.2) Update PU/DEL locations в milkrun (Qase 2826–2829) — сценарии для ручной проверки
Источник: `/shiptify/test-cases/MA-2026-05-25.json` (suite: *Location update*).

Кейсы:
- **2826** Update Pick-up location of Delivery milkrun
- **2827** Update Delivery location of Delivery milkrun
- **2828** Update Pick-up location of Collect milkrun
- **2829** Update Delivery location of Collect milkrun

Статус: **TBD** — в экспортированном JSON (MA-2026-05-25.json) у кейсов **2826–2829** отсутствуют description/expected results (пусто); есть только titles.

Точка опоры из автотеста (обычный shipment, не milkrun): `smokeTest/updateLocation.js`.

## C) Grouping: Group departure / arrival / shipment (smoke flow)

Источник: `/main-app-automation/src/tests/uiTests/smokeTest/grouping.js`

### B.1) Group departure (Grouped pick-up)
1) Создать 2 shipments (spot purchase) и auto-confirm:
   - `Grouped departure test1 [automation]` (PU: Albuquerque 06:00 → DEL: Eiffel Tower 18:00)
   - `Grouped departure test2 [automation]` (PU: Albuquerque 10:00 → DEL: AnotherLocation 20:00)
2) Открыть **GROUPING** страницу в sidebar.
3) В таблице shipments увеличить пагинацию до `100 per page`.
4) Выбрать оба shipments → нажать **Group departure**.
5) В модалке `groupedPickUpModal`:
   - выбрать departure datetime (в smoke: Today 08:00)
   - выбрать tag (в smoke: `purple`)
   - нажать **GROUP**
6) Проверки на Tracking tab каждого shipment:
   - видна ссылка `Grouped with 1 other shipment` (элементы `groupedDepartureLink`)

### B.2) Group arrival (Grouped delivery)
1) Создать 2 shipments и auto-confirm:
   - `Grouped arrival test1 [automation]` (PU: Albuquerque 06:00 → DEL: Eiffel Tower 18:00)
   - `Grouped arrival test2 [automation]` (PU: AnotherLocation 08:00 → DEL: Eiffel Tower 22:00)
2) GROUPING page → выбрать оба shipments → **Group arrival**.
3) В модалке `groupedDeliveryModal`:
   - arrival datetime (smoke: Today 20:00)
   - tag (smoke: `green`)
   - **GROUP**
4) Проверка: на Tracking tab каждого shipment есть `groupedArrivalLink` = `Grouped with 1 other shipment`.

### B.3) Group shipment (pick-up + delivery одновременно)
1) Создать 2 shipments и auto-confirm:
   - `Grouped shipment test1 [automation]` (PU: Albuquerque 06:00 → DEL: Eiffel Tower 18:00)
   - `Grouped shipment test2 [automation]` (PU: Albuquerque 10:00 → DEL: Eiffel Tower 22:00)
2) GROUPING page → выбрать оба shipments → нажать **Group** (общая кнопка).
3) Появится промежуточная модалка `selectGroupOptionsModal` → выбрать опцию **Group shipment** (`groupShipmentButton`).
4) Откроется модалка `groupedPickUpAndDeliveryModal`:
   - выбрать pick-up datetime (smoke: Today 08:00)
   - выбрать delivery datetime (smoke: Today 20:00)
   - нажать **GROUP**
5) Проверки на Tracking tab каждого shipment:
   - `groupedDepartureLink` visible + text `Grouped with 1 other shipment`
   - `groupedArrivalLink` visible + text `Grouped with 1 other shipment`

Примечание: в этом сценарии теги (цвета) в модалке не выбирались (в отличие от departure/arrival, где выбираются `purple`/`green`).

## C) Create Milkrun через Grouping page (не CSW milkrun)

> Важно: это альтернативный путь создания milkrun через **Grouping page** (выбор существующих shipments), а не через CSW pre-shipments.

Источники (Qase):
- **2004** — *Grouping tab in sidebar menu* (доступность через Admin menu toggle **Show Milkrun**)
- **2013** — *Milkrun button* (при выборе 2+ shipments появляется кнопка **[MILKRUN]**)
- **2054** — *Create milkrun modal* (по клику на [MILKRUN] открывается modal)
- **2014** — *Functionality of the "Milkrun"* (после клика **[GROUP]** shipments отображаются со статусом **grouped**)

Черновой flow (по expected results Qase):
1) (Если нет пункта Grouping в sidebar) Admin menu → включить чекбокс **Show Milkrun** (для shipper/carrier) → убедиться, что появился пункт **Grouping**.
2) Открыть **Grouping** page.
3) Выбрать в таблице **2+ shipments**.
4) Проверить, что появилась кнопка **[MILKRUN]**.
5) Нажать **[MILKRUN]** → откроется **Create Milkrun Modal**.
6) Нажать **[GROUP]** в модалке.
7) Проверить, что выбранные shipments получили статус **grouped**.

Статус: **TBD** (нужны детали полей модалки + фактический результат на стенде /milkrun).

## C.1) Где искать UI-подсказки
- Autotest: `smokeTest/grouping.js` (группировка departure/arrival/shipment; полезно для навигации и модалок)

## D) Milkrun: PS-level настройки в CSW (milkrun stage, TBD)

## B0) Milkrun stage (/milkrun): что руками проверить на стенде
### B0.1) Быстрый чек-лист (milkrun UI)

Стенд: https://app.blu.shiptify.com/milkrun

1) **Tracking list** (кейсы 916/917/918/925)
- На карточке shipment/FO проверить появление **"Milkrun"** вместо одной из локаций.
- Ниже — список stops (адресов).
- Hover на **blue circle** → tooltip со stops (location + date/time).
- Наличие **"+n"** индикатора.

2) **Shipment card → Tracking tab** (кейсы 924/926/927)
- Баннер: `This shipment belongs to a Milkrun... Click here...`
- Клик по **[Click here]** → открывается monitoring modal.
- В modal: stops+dates, related shipments+statuses, карта с маршрутами.

3) **Качество данных** (edge-cases)
- (1055) корректность **from/to** адресов на баннере.
- (1061) корректность маршрутов на карте (особенно при 3+ stops).

### B0.2) FU keys в milkrun (кейсы 1417/1419/1421/1422)

- 1417: на detail page должны отображаться **новые keys под cargos** (создание keys для milkrun).
- 1419: на detail page должны отображаться **created и existing keys** под cargos.
- 1421: для multi-containers в milkrun keys должны **сохраняться** после confirm carrier.
- 1422: под spectator keys **не должны отображаться**, spectator ограничен Tracking/TP-only (verbatim expected result: `no possibility to switch tabs except TP`).

### B0.3) Update locations в milkrun (кейсы 2826–2829)

Кейсы (Qase export, suite: *Location update*):
- **2826** Update Pick-up location of Delivery milkrun
- **2827** Update Delivery location of Delivery milkrun
- **2828** Update Pick-up location of Collect milkrun
- **2829** Update Delivery location of Collect milkrun

Статус источника: в экспортированном JSON **description пустой** для 2826–2829, поэтому шаги/ожидания нужно искать в **Confluence TD** и/или проверять руками на стенде `/milkrun`.

В экспортированном JSON у кейсов **2826/2827/2828/2829** отсутствует description/expected results.
Нужно найти первоисточник в Confluence TD и зафиксировать:
- где именно находится действие **Update Pick-up/Delivery location** (Booking tab? Tracking point action?);
- на каком уровне оно применяется (BK vs PS/pre-shipment);
- как это влияет на milkrun tooltip/monitoring modal/related shipments statuses.

#### Опорный smoke флоу: Update location (не milkrun, но полезен как «как кликается»)
Источник: `uiTests/smokeTest/updateLocation.js`.

Краткий сценарий:
1) Shipper создаёт SR (Direct booking → Green Carrier → Send booking).
2) Booking tab:
   - открыть **Update Pick-up location** → выбрать новый location + дата/время → Next → Confirm.
   - открыть **Update Delivery location** → выбрать новый location + дата/время → Next → Confirm.
3) Проверки:
   - в чате появляются сообщения `Test has updated the Pick-up location.` и `Test has updated the Delivery location.`
   - в Booking list обновляются From/To.
4) Carrier side: видит обновлённые адреса и те же сообщения в чате.

Как использовать для Milkrun:
- вероятно, entrypoint и шаги модалки совпадают;
- **обязательно** руками проверить, что меняется в milkrun stops/tooltip/monitoring modal и остаются ли корректными related shipments.

Стенд: https://app.blu.shiptify.com/milkrun

Qase ориентиры для обычного shipment (Update location UI, не milkrun-специфика):
- **948** Update location modal
- **950** Update location functionality
- **952** Update content

Быстрая навигация к monitoring modal (практика для ручной проверки):
1) Откройте любой shipment, который явно является частью milkrun (есть blue milkrun block или brothers/related shipments).
2) Перейдите на **Tracking** → найдите **milkrun banner** (`This shipment belongs to a Milkrun... Click here...`).
3) Нажмите **[Click here]** → откроется **Milkrun monitoring modal** (дальше проверяйте контент/маршруты по кейсам 926/927/1061).

Цель этого чеклиста — быстро собрать факты, которых **нет** в ui autotests, но они есть в Qase и часто ломаются.

### 1) Tracking list / Booking list: визуальные маркеры Milkrun
Ориентиры Qase: 916 / 917 / 918 / 925.
- Метка **"Milkrun"** в карточке вместо одной из локаций.
- Под меткой — список адресов/stops.
- **Blue circle** перед "Milkrun" + tooltip со stops (location + date/time).
- Индикатор **"+n"** после локации (multipoint/related shipments).

### 2) Shipment card (Tracking tab): milkrun banner + monitoring modal
Ориентиры Qase: 924 / 926 / 927 / 1055 / 1061.
- Баннер `This shipment belongs to a Milkrun with x steps from ... to ...`.
- Клик **[Click here]** открывает monitoring modal.
- В monitoring modal проверить:
  - список locations + dates (как на shipment card),
  - related shipments + их статусы (как в центральном меню Booking tab),
  - map + маршруты между всеми точками.
- Отдельно (как баг-риск): корректность **from/to** на баннере (1055) и маршрутов на карте (1061).

### 3) Spectator side: видимость Milkrun UI
Ориентиры Qase: 4164 (Tracking-only), 1447 (bug/ambiguity).
- Под spectator: есть ли **milkrun banner / blue milkrun block / monitoring modal**.
- Зафиксировать факт: кейс 1447 конфликтует (title vs expected).

### 4) FU keys в milkrun (+ multicontainers)
Ориентиры Qase: 1417 / 1419 / 1421 / 1422.
- На "detail page" (уточнить, какой именно экран в TMS): отображаются keys **under the cargos**.
- Milkrun + multicontainers: keys под каждым cargo после confirm carrier (1421).
- Spectator: keys скрыты + нет возможности переключать табы кроме TP/Tracking (1422).

## B-1) Milkrun: Update locations (Delivery/Collect) — сценарии на верификацию
Источник: Qase-экспорт `/shiptify/test-cases/MA-2026-05-25.json`.
Кейсы:
- 2826 Update Pick-up location of Delivery milkrun
- 2827 Update Delivery location of Delivery milkrun
- 2828 Update Pick-up location of Collect milkrun
- 2829 Update Delivery location of Collect milkrun

Примечание: в экспортированном JSON у кейсов 2826–2829 **пустое описание**, поэтому детализацию шагов/expected results нужно брать из **Confluence TD** (или фиксировать вручную на стенде `/milkrun`).

Цель: на стенде `https://app.blu.shiptify.com/milkrun` зафиксировать:
- где в UI меняются PU/DEL у milkrun (на уровне booking? shipment? stop/step?),
- как это отражается на milkrun banner/monitoring modal (from/to, routes),
- меняются ли related shipments / их статусы / stops.


Источник: Qase-экспорт `/shiptify/test-cases/MA-2026-05-25.json`.
Кейсы: **1430/1431/1432/1434/1441**.

Цель: понять, какие поля в CSW step1 доступны **на уровне каждого pre-shipment (PS)** и как они влияют на generated shipments.

Чеклист ручной верификации на стенде `https://app.blu.shiptify.com/milkrun`:
1) Создать milkrun (2+ pre-shipments).
2) Для каждого pre-shipment проверить наличие/работоспособность:
   - **Spectators** (поле отображается на каждом PS; dropdown открывается; можно выбрать) — 1430/1431.
   - **Incoterms** на PS (incoterms отображаются на каждом PS; выбранный incoterm виден в «blue zone» рядом с адресом) — 1432/1434.
   - **Containers / Multicontainers** на PS (переключатель/вкладка/блок контейнеров на уровне PS) — 1441.
3) После Send + (Auto-)confirm проверить, что именно «перенеслось» в shipment (Tracking/Booking):
   - видимость spectator sharing блоков,
   - отображение incoterms (иконки/tooltip/data),
   - контейнеры: brothers block = Shipments vs Containers; packing list dropdown.

## B) Milkrun + FU keys (milkrun stage)

## B0) Milkrun + Multi-containers (BK level vs PSH level) — сценарии на верификацию
Источник: Qase-экспорт `/shiptify/test-cases/MA-2026-05-25.json`.
Кейсы: **2027 / 2028 / 2030 / 2031 / 2033 / 2034 / 2035 / 2036 / 2037 / 2038** (+ контрольные FO кейсы **2029 / 2032 / 2039**).

Цель: понять, как работают контейнеры в milkrun и где именно включается multicontainers:
- **BK level** (booking level): контейнеры задаются один раз для booking.
- **PSH level** (pre-shipment level): контейнеры задаются отдельно для каждого PS внутри CSW.

Что нужно зафиксировать на стенде `https://app.blu.shiptify.com/milkrun`:
1) Где в CSW step1 включается Containers и какие есть варианты (qty/тип).
2) Как выглядит результат после Send + (Auto-)confirm:
   - brothers block = `N Shipments` или `N Containers`?
   - packing list / cargo contents: есть ли dropdown контейнеров?
   - где отображаются **FU keys** и связаны ли они с контейнерами/PS.

Статус: **TBD** (в экспорте Qase шагов нет).


Источник: Qase-экспорт `/shiptify/test-cases/MA-2026-05-25.json`.
Кейсы: **1417 / 1419 / 1421**.

Цель: зафиксировать, что для milkrun на **detail page** отображаются **FU keys под cargos**, включая сценарий milkrun + multicontainers (keys под каждым cargo после confirm carrier).

### Ожидания из Qase (как есть в экспорте)
- **1417**: `On the detail page is displayed new keys under the cargos`
- **1419**: `On the detail page is displayed created and existing keys under the cargos for milkrun`
- **1421**: `On the detail page is displayed keys under every cargo after confirming carrier`

Статус: шаги/реальное UI-расположение нужно уточнить на стенде milkrun; в smoke автотестах есть только общий флоу FU (см. D3).

## C) Milkrun + Rate Sheet price (Shipper)

Источник: `/main-app-automation/src/tests/uiTests/rateSheets/usualRateSheets/countMilkrunRateSheet.js`

1. Login Shipper (`role.mainShipper`).
2. +BOOK → ROAD → Spot purchase.
3. CSW Step 1:
   - Shipment name: `RS Milkrun [automation]`
   - Cargo type: `Palette 60*80` (+qty)
   - Pick-up: `AnotherLocation` Today 08:00
   - Delivery #1: `Albuquerque` Today 18:00 (в автотесте используется `inputDeliveryLocationName('Albuquerque')` → затем `selectLocation('Albuquerque')`, т.е. иногда нужно сначала ввести строку, потом выбрать из dropdown)
   - Add another delivery/picking point → второй pre-shipment:
     - Cargo type: `Palette 60*80`
     - Pick-up: `AnotherLocation`
     - Delivery #2: `Albuquerque`
4. Direct booking → carrier `Green Carrier`.
5. CSW Step 2: проверка **rateSheetPrice**:
   - visible
   - text = `10,000 €`
6. Send booking:
   - Booking tab carrier price = `10,000 €`
   - applied rate sheet = `MILKRUN [Automation]`
7. Auto-confirm → Invoicing tab:
   - validatedCost = `10,000.00 €`
   - agreedCost = `10,000.00 €`
   - applied rate sheet = `MILKRUN [Automation]`

## C) Grouping: объединение shipments (Shipper) — smoke/happy path

## C.0) Grouping page: Create Milkrun modal (по Qase, без автотеста)
Источник: `/shiptify/test-cases/MA-2026-05-25.json`
- **2054**: по клику на кнопку **[MILKRUN]** открывается **Create Milkrun Modal**.
- **2014**: после клика **[GROUP]** shipments отображаются со статусом **grouped**.

Ожидаемый (черновой) флоу:
1. Открыть **GROUPING → GROUPING**.
2. Выбрать 2+ shipments в таблице.
3. Нажать **[MILKRUN]**.
4. В модалке (Create Milkrun) нажать **[GROUP]**.
5. Проверить, что в таблице shipments получили статус **grouped**.

> NB: это отдельный механизм milkrun через grouping page (не CSW milkrun через multiple pre-shipments).

Источник: `/main-app-automation/src/tests/uiTests/smokeTest/grouping.js`

### C1) Group Departure (Grouped Pick Up)
1. Login Shipper.
2. Создать 2 shipments (Direct booking → Green Carrier → Send → Auto-confirm) с разными departure times.
3. Sidebar → **GROUPING → GROUPING**.
4. Увеличить page size: **100 per page**.
5. Выбрать 2 shipments в таблице.
6. Нажать **Group departure** (`groupDepartureButton`).
7. В модалке **Grouped Pick Up**:
   - выбрать дату/время departure (datepicker + time picker)
   - выбрать tag (в автотесте: `purple`)
   - нажать **Group**.
8. Открыть каждый shipment → Tracking tab.
9. Проверка: есть link `Grouped with 1 other shipment` для departure.

### C2) Group Arrival (Grouped Delivery)
1. Создать 2 shipments.
2. GROUPING page → выбрать 2 shipments.
3. Нажать **Group arrival** (`groupArrivalButton`).
4. В модалке **Grouped Delivery**:
   - выбрать дату/время arrival
   - выбрать tag (в автотесте: `green`)
   - нажать **Group**.
5. Открыть каждый shipment → Tracking.
6. Проверка: есть link `Grouped with 1 other shipment` для arrival.

### C3) Group Shipment (departure + arrival одновременно)
1. Создать 2 shipments.
2. GROUPING page → выбрать 2 shipments.
3. Нажать **Group** (`groupButton`) → появляется modal **Select group options**.
4. Выбрать **Group shipment** (`groupShipmentButton`).
5. В модалке **Grouped Pick Up and Delivery**:
   - выбрать дату/время для pick-up и delivery
   - нажать **Group**.
6. Открыть shipment → Tracking.
7. Проверка: отображаются оба link: groupedDepartureLink + groupedArrivalLink.

> NB: Это **Grouping**, не Milkrun из CSW pre-shipments. Отдельный объект/операция.

## D) Pick-up grouping: группы отгрузок по месту отправления (Shipper) — smoke/happy path

Источник: `/main-app-automation/src/tests/uiTests/smokeTest/pickUpGrouping.js`

1. Login Shipper.
2. Создать 2 shipments с одинаковой pick-up location (в автотесте: `Eiffel Tower | Paris`) → Direct booking → Green Carrier → Auto-confirm.
3. Sidebar → **GROUPING → PICK-UP GROUPING**.
4. В фильтрах выбрать:
   - Departure location (ввод + select)
   - Mode: ROAD
   - Carrier: Green Carrier
   - (опционально) toggles Past/Future
5. Выбрать 2 shipments → нажать **Group departure**.
6. В модалке **Grouped Pick Up**:
   - ввести group name (в автотесте: `Pickup group [automation]`)
   - выбрать дату/время pick-up
   - нажать **Group**.
7. Нажать **nShipments** → проверить список shipments в группе.
8. (Assign): создать ещё один shipment → вернуться в PICK-UP GROUPING → выбрать shipment + group → **Assign to the group** → подтвердить.

## E) SR/QR/Draft/RTB — краткая карта сценариев

### E1) Создание Draft (Shipper)
Источник: `uiTests/smokeTest/creatingDraft.js`

1. Login Shipper.
2. +BOOK → ROAD → Spot purchase.
3. CSW Step 1: заполнить shipment name + cargo + pick-up/delivery (в smoke используется business-day логика).
4. Нажать **SAVE DRAFT**.
5. Проверка: CSW закрылась, в Booking list запись имеет status **Draft**.

### E2) Создание SR (Shipment Request) + Auto-confirm (Shipper)
Источник: `uiTests/smokeTest/shipmentRequest.js`

**Создание SR**
1. Login Shipper.
2. +BOOK → ROAD → Spot purchase.
3. CSW Step 1: заполнить shipment name `SR test [automation]` + cargo + pick-up `Albuquerque Today 08:00` + delivery `Eiffel Tower Today 18:00`.
4. Нажать **DIRECT BOOKING**.
5. CSW Step 2: выбрать carrier `Green Carrier` → **SEND BOOKING**.
6. Проверки на Booking tab:
   - видна кнопка **AUTO-CONFIRM**
   - в чате сообщение: `...awarded you a shipment. Please confirm the booking!`

**Auto-confirm SR**
1. BOOKING list → открыть `SR test [automation]`.
2. **AUTO-CONFIRM** → **AUTO-CONFIRM BOOKING**.
3. Проверки:
   - вкладки Tracking/Invoicing/Booking существуют
   - URL содержит `/shipment-requests/`, а после переключения вкладок меняется на `/shipments/` и `/invoicing/`

### E3) Создание QR (Quote Request) + Auto-quote + Award + Auto-confirm (Shipper)
Источник: `uiTests/smokeTest/quoteRequest.js`

**Создание QR**
1. Login Shipper.
2. +BOOK → ROAD → Spot purchase.
3. CSW Step 1: shipment name `QR test [automation]` + cargo + pick-up/delivery (аналогично SR).
4. Нажать **REQUEST A QUOTE**.
5. CSW Step 2: выбрать carriers `Green Carrier`, `Red Carrier`, `Urby Blu` → **REQUEST QUOTES**.
6. Проверки:
   - доступна кнопка **AUTO-QUOTE**
   - чат содержит `...has opened a quote request.`

**Auto-quote + Award + Auto-confirm**
1. BOOKING list → открыть `QR test [automation]`.
2. Выбрать carrier `Green Carrier` → **AUTO-QUOTE** → ввести price `400` → **SAVE QUOTE**.
3. Нажать **AWARD** → в Confirm modal нажать **CONFIRM**.
4. Нажать **AUTO-CONFIRM** → **AUTO-CONFIRM BOOKING**.
5. Проверки:
   - chat: `...has selected Green Carrier as carrier...`
   - вкладки Tracking/Invoicing/Booking существуют
   - URL меняется `/shipment-requests/` → `/shipments/` → `/invoicing/`

### E4) Ready-to-Book (RTB)
Источники: Qase 1340, Autotest `uiTests/smokeTest/readyToBook.js`.

Базовый смысл (по expected result из Qase):
1. CSW заполнен как для SR/QR.
2. На step2 (carrier selection) вместо отправки нажать **[SAVE]**.
3. В результате создаётся booking в статусе **Ready-to-book** (RTB) и открывается booking list (в фильтрах упоминается Draft/RTB — требует верификации в UI).

> NB: RTB далее используется для мульти-операций (см. Qase 1346 Multi-RTB) — пока не детализируем, пока приоритет milkrun-stage.

## C0) Slot Booking (shipper/carrier) — smoke/happy path
Источники:
- Qase: 1341 (shipper slot booking), 4280 (carrier slot booking)
- `uiTests/smokeTest/slotBookingByShipper.js`
- `uiTests/smokeTest/slotBookingByCarrier.js`

## C0.3) Planning (Slotify Planning) — smoke/happy path
Источники:
- Qase: 2863 (displaying shipments), 2866 (default ML), 2869 (Week/Day/Board)
- Autotest: `uiTests/smokeTest/planning.js`

### C0.3.1) Предусловие: создать 2 shipments/slots (RECEPTION и EXPEDITION)
Автотест создаёт два shipment-а через CSW (Direct booking) так, чтобы они появились на Planning board:

1. Login Shipper.
2. Создать shipment **"Planning REC test [automation]"**:
   - pick-up: `Albuquerque` (Today 22:00)
   - delivery: `TestLocation` (ZONE FOR AUTOMATION) (Today 23:00)
   - carrier: `Green Carrier` → Send booking → Auto-confirm.
   - Проверка: в booking chat появляется сообщение **`This slot was booked by`**.
3. Создать shipment **"Planning EXP test [automation]"**:
   - pick-up: `TestLocation` (ZONE FOR AUTOMATION) (Today 22:00)
   - delivery: `Eiffel Tower` (Today 23:00)
   - carrier: `Green Carrier` → Send booking → Auto-confirm.
   - Проверка: в booking chat появляется **`This slot was booked by`**.

### C0.3.2) Board tab: отображение карточек + фильтр направления
1. Sidebar → **PLANNING**.
2. По умолчанию активна вкладка **Board**.
3. Проверка: на board видны slot cards с названиями обоих shipments:
   - `Planning REC test [automation]`
   - `Planning EXP test [automation]`
4. Переключить направление на **RECEPTION**:
   - `Planning REC test [automation]` — **visible**
   - `Planning EXP test [automation]` — **not exists**
5. Переключить направление на **EXPEDITION**:
   - `Planning EXP test [automation]` — **visible**
   - `Planning REC test [automation]` — **not exists**

### C0.3.3) Day tab: маршруты/карточки + фильтр направления
1. На Planning нажать таб **DAY**.
2. Проверки:
   - активная вкладка = **Day**
   - URL содержит `/schedule/`
   - на Day tab есть shipment cards с локациями:
     - `Breaking Bad | Albuquerque`
     - `Eiffel Tower | Paris`
3. Переключение направлений:
   - для **RECEPTION** (ожидаемо): показывается карточка `Breaking Bad | Albuquerque`, а `Eiffel Tower | Paris` скрыта
   - для **EXPEDITION** (ожидаемо): показывается `Eiffel Tower | Paris`, а `Breaking Bad | Albuquerque` скрыта

> Примечание по автотесту: в `planning.js` второй вызов `dayTab.switchDirection('EXPEDITION')` выглядит как опечатка (должно быть `RECEPTION` → `EXPEDITION`), но ассерты явно проверяют взаимное скрытие двух карточек. Если тест падает/флапает — проверить этот участок.

### C0.1) Slot Booking by shipper
1. Login Shipper.
2. Sidebar: **+BOOK → SLOT BOOKING**.
3. Slot type: **DELIVERY**.
4. Location: `TestLocation` → Next.
5. Orders: заполнить order (name+supplier) → **Add order** → Next.
6. Zone: `ZONE FOR AUTOMATION`.
7. Packing list: content type `Others`, увеличить qty → Next.
8. Выбрать слот по времени: `23:30 — 24:00`.
9. Carrier: **Assign carrier without notification** → ввести `Carrier Name` → Next.
10. Confirm → Finish.
11. В списке Slots: найти по search → ожидается ровно 1 результат.

### C0.2) Slot Booking by carrier
1. Login Carrier.
2. Sidebar: **+BOOK → SLOT BOOKING**.
3. Slot type: **PICK-UP**.
4. Дальше шаги аналогично (Location/Orders/Zone/Packing list/time).
5. Confirm → Finish.
6. В slots list поиск по имени → 1 результат.

### C1) Draft
- CSW step1 → заполнить минимум → **SAVE** → Draft создан, в списке с фильтром Draft.
Источник: Qase 1339.

### C2) SR
- CSW → Direct booking → Send → дальше либо:
  - Shipper auto-confirm (Qase 1342)
  - Carrier confirm (Qase 1344)
  - Carrier decline (Qase 1619)
  - Shipper cancel (Qase 1354)

### C3) QR
- CSW → Request a quote → выбрать carriers → Request quotes → дальше:
  - Carrier sends quote / shipper selects / award
  - Auto quote / auto confirm (Qase 1343 / 4598)
  - Carrier decline (Qase 4279)
  - Add new carrier to QR (Qase 3828)

### C4) RTB
- Создание ready-to-book и мульти-операции по RTB (есть отдельные кейсы, не расписываем до приоритизации milkrun).

## D) Incoterms (Buy/Sell) — smoke/happy path

Источник: `/main-app-automation/src/tests/uiTests/smokeTest/incoterms.js`

Цель: настроить **purchase + sales incoterms** в CSW и проверить отображение до/после auto-confirm.

Шаги (как в тесте):
1. Login Shipper.
2. +BOOK → ROAD → Spot purchase.
3. CSW step1:
   - Shipment name: `Incoterms test [automation]`
   - Cargo type: `Others` (+ qty)
   - **Buy switcher** → Supplier: `Supplier [automation]` → Incoterm: `DDP`
   - Pick-up: `Albuquerque` Today 08:00
   - **Sell switcher** → Customer: `Customer [automation]` → Incoterm: `DDU`
   - Delivery: `Eiffel Tower` Today 18:00
4. Direct booking → carrier `Green Carrier`.
5. Проверка на CSW step2 (shipment card): `DDP Breaking Bad | Albuquerque → DDU Eiffel Tower | Paris`.
6. Send booking.
7. Booking tab:
   - purchaseIncotermIcon + tooltip visible (проверка regex на Supplier + адрес)
   - purchaseIncotermData содержит `Purchase to Supplier [automation] | ... DDP ... Albuquerque (US87)`
   - salesIncotermIcon + tooltip visible (Customer + адрес)
   - salesIncotermData содержит `Sales to Customer [automation] | ... DDU ... Paris (FR75)`
   - packing list (cargo contents modal) отображает `DDP ... → DDU ...`
8. Auto-confirm → Tracking tab:
   - purchase/sales incoterm icons + tooltips + data blocks также отображаются.

> NB: это «каноническая» проверка, что incoterms проходят через CSW → booking/shipment и доступны на Tracking tab.

## E) Tracking: spectator sharing / followers / freight unit / PML (из smoke автотестов)

### D1) Назначение Spectator при создании shipment (Shipper)
Источник: `uiTests/smokeTest/addingSpectator.js`

1. Login Shipper.
2. +BOOK → ROAD → Spot purchase.
3. CSW step1: заполнить cargo + locations + даты.
4. CSW step1: раскрыть **Spectators** → выбрать `Shipper`.
5. Direct booking → выбрать `Green Carrier` → Send booking.
6. Auto-confirm → перейти на Tracking.
7. Проверка: на Tracking отображается blue блок:
   - `This shipment tracking is shared with Shipper`

### D1.1) Spectator открывает тот же shipment (Tracking-only)
Источник: `uiTests/smokeTest/addingSpectator.js` (part two)

1. Login как `role.spectator`.
2. Sidebar → открыть **TRACKING** list.
3. В search найти shipment по имени (используется timestamp).
4. Открыть shipment.
5. Проверки прав:
   - URL содержит `/shipments/`
   - вкладка **Tracking** есть
   - вкладок **Booking** и **Invoicing** **нет**
6. Проверка текста blue spectator block:
   - ` This shipment tracking is shared by reppihS ` (в smoke проверяется `textContent` целиком, включая пробелы по краям строки; shipper отображается как `reppihS` — инвертированная строка `Shipper`).

### D2) Followers в чате (Teammates/Partners) — на уровне booking/shipment
Источник: `uiTests/smokeTest/assigningFollowers.js`

- В правом блоке чата есть вкладки: **Messages / Teammates / Partners**.
- Можно активировать/деактивировать followers и отправлять сообщение.
- Ожидаемое поведение: при включённом follower появляется системное сообщение вида:
  - `<FollowerName> have been notified.`

### D3) Создание Freight Unit (FU) на странице FREIGHT UNITS (Shipper)
Источник: `uiTests/smokeTest/creatingFU.js`

Цель: создать отдельную сущность **Freight Unit** и убедиться, что она появляется в списке по фильтру Availability date.

Шаги (как в smoke):
1) Login Shipper.
2) Sidebar → **FREIGHT UNITS**.
3) Нажать **Create**.
4) В модалке Create Freight Units:
   - Pick-up location: выбрать `Seoul | Seoul` (в тесте через ввод `test` + select).
   - Delivery location: выбрать `Gomel | Gomel`.
   - Availability date: выбрать **Today**.
5) Нажать **Create**.
6) Проверки:
   - модалка закрылась
   - появился green alert с текстом `Freight units created!`
   - в списке применить фильтр Availability date = Today → видна строка с префиксом `007-` (вероятно account code; подтвердить на других аккаунтах).

### D4) Добавление Freight Unit (FU) через Add information
Источники:
- Qase: 4423 Adding FU (expected: FU key отображается под cargo в packing list)
- Autotest: `uiTests/smokeTest/addingFU.js`

1. CSW step1 → **Add information**.
2. В blue modal ввести FU key и выбрать его из списка.
3. После confirm в CSW отображается комментарий:
   - `FU: <key>`
4. На CSW step2 (карточка shipment) отображается:
   - `FU - <key>`
5. После Send + Auto-confirm:
   - Shipper видит `FU - <key>` в cargo contents modal на Booking tab и Tracking tab.
   - Carrier (в smoke) **не видит** FU в cargo contents modal на Booking/Tracking (ожидается `cargoFreightUnit.exists == false`).

> Важно: это выглядит как намеренное ограничение видимости FU для carrier. Уточнить на milkrun stage: относится ли это только к UI, или реально в данных FU не шарится перевозчику.

### D4) Public Master Location (PML) user: Tracking-only доступ
Источник: `uiTests/smokeTest/publicMasterLocationUser.js` + Qase 4165.

Флоу (по smoke):
1) Booker создаёт shipment с pick-up location на PML/ML (`TestLocation` + zone `ZONE FOR AUTOMATION`) → Direct booking → Auto-confirm.
2) Другой пользователь открывает shipment из Tracking list.
3) Проверка доступов:
   - Tracking tab ✅
   - Booking tab ❌
   - Invoicing tab ❌

### D5) My Site: входящие/исходящие shipments для своей ML
Источник: `uiTests/smokeTest/displayingShipmentsOnTheMySite.js`.

Флоу (по smoke):
1) Создать 2 shipments:
   - **REC**: delivery = `TestLocation` (zone) → ожидается в My Site **IN**.
   - **EXP**: pick-up = `TestLocation` (zone) → ожидается в My Site **OUT**.
2) Sidebar → **MY SITE**.
3) Direction **IN**: видим только `My Site REC test [automation]`.
4) Direction **OUT**: видим только `My Site EXP test [automation]`.

## E) Tracking Points: confirm / replan / request info

Источники:
- Qase: 1350 Confirm TP, 1349 Replan TP, 1615 Request info TP.
- Autotests:
  - `uiTests/smokeTest/confirmTP.js`
  - `uiTests/smokeTest/replanTP.js`
  - `uiTests/smokeTest/requestInfoTP.js`

### E1) Confirm TP (shipper side) — happy path
1. Создать shipment (Direct booking → Green Carrier → Send booking → Auto-confirm).
2. Перейти на tab **Tracking**.
3. Hover по **Departure TP** → **Show actions** → **Confirm**.
4. В модалке Confirm: **Confirm** → **Confirm tracking point**.
5. Проверки:
   - модалка закрылась
   - для Departure TP кнопок **Confirm** и **Replan** больше нет
   - в чате есть системное сообщение: `Loading at Breaking Bad | Albuquerque has been confirmed by reppihS:`

### E2) Confirm TP (carrier side) — happy path
1. Login Carrier → Tracking list → найти shipment по имени (timestamp).
2. Открыть shipment → Tracking tab.
3. Hover по **Arrival TP** → **Confirm arrival**.
4. В модалке Confirm: **Confirm** → **Confirm tracking point**.
5. Проверки:
   - для Arrival TP исчезают confirm/replan
   - в чате сообщение: `Delivery in Eiffel Tower | Paris has been confirmed by Green Carrier:`

### E3) Request info TP (shipper side)
1. Создать shipment (Direct booking → Auto-confirm) и открыть Tracking.
2. Hover Departure TP → **Show actions** → **Request info**.
3. В модалке Request information:
   - выбрать **Request feedback**
   - ветка 1: **Just need confirmation** → модалка закрывается
4. Проверка: в чате появляется сообщение-запрос перевозчику (в автотесте — regex), смысл:
   - `<shipper> needs a confirmation from <carrier> regarding the Loading at <shipment>: ... Can you please confirm the Departure, or replan it.`
5. Повторить: Request info → Request feedback → ветка 2 **Still expect** (проверяется закрытие модалки).

### E4) Replan TP (shipper side) — happy path
Источник: `uiTests/smokeTest/replanTP.js`

1. Создать shipment (Direct booking → Green Carrier → Send booking → Auto-confirm).
2. Tracking tab → hover Departure TP → убедиться, что в инфо отображается исходное время.
3. **Show actions** → **Replan**.
4. В модалке Replan:
   - выбрать новое время через week datepicker
   - **Next** → **Replan tracking point**
5. Проверки:
   - модалка закрылась
   - время Departure TP обновилось
   - в чате системное сообщение: `Loading at Breaking Bad | Albuquerque has been replanned by reppihS:`

## F) Grouping (выборочно, смежно с Milkrun)

> NB: **Milkrun** и **Grouping** — разные сценарии: milkrun создаёт несколько связанных shipments из одного CSW (pre-shipments), а grouping объединяет уже существующие shipments в группу для pick-up/dispatch.

### F1) Pick-up grouping
Источник: Qase 4593 (Pick-up grouping)

Наблюдаемое поведение:
- На списке/борде при выборе (checkbox) хотя бы одного shipment появляется синяя кнопка **GROUP DEPARTURE**.
- После клика открывается модалка **Create a Grouped Pick Up** → выбор даты → **ASSIGN**.
- Альтернативный путь: выбрать существующую группу → появляется **ASSIGN TO THE GROUP** → модалка назначения shipments → **ASSIGN**.

(Детали UI-страницы/расположения кнопок нужно подтвердить на стенде milkrun.)

### F2) Create Milkrun через grouping page (не CSW Milkrun)
Источник: Qase-экспорт `/shiptify/test-cases/MA-2026-05-25.json`.

Флоу (по названиям/expected results кейсов, требует верификации):
1. Открыть **Grouping page**.
2. Выбрать (checkbox) **более одного shipment**.
3. Проверить, что появилась кнопка **[MILKRUN]**. (кейс 2013)
4. Нажать **[MILKRUN]** → открывается **Create Milkrun Modal**. (кейс 2054)
5. В модалке нажать **[GROUP]** → shipments отображаются со статусом **grouped**. (кейс 2014)
6. В модалке/на странице присутствует toggle **MERGE IN A MILKRUN** (можно enable/disable). (кейс 4141)

> Примечание: в текущей документации считаем это отдельным сценарием "группировка в milkrun", чтобы не смешивать с milkrun, создаваемым в CSW через pre-shipments.

## Flow: Создание Milkrun через CSW (pre-shipments → shipments)
Источник: `uiTests/smokeTest/creatingMilkrun.js`, Qase кейс **1625**.

1. Shipper → sidebar **+BOOK**
2. Mode: **ROAD** → Spot purchase
3. CSW step1 заполнить shipment name, cargo, PU/DEL + дату/время.
   - Shipment name: `Milkrun test [automation]` (после ввода появляется предупреждение `nShipmentsAlreadyExistAlert` — в smoke это ожидаемо).
   - Cargo type: `Box 60x30x30` + увеличить quantity (кнопка `increaseCargoQuantity`).
   - Pick-up: `Albuquerque`, Today `10:00`.
   - Delivery: `Eiffel Tower`, Today `18:00`.
4. Нажать **Add another delivery/picking point** и заполнить второй pre-shipment.
   - Cargo type: `Box 60x40x40` + увеличить quantity.
   - Pick-up: `Albuquerque` (совпадает с первым pre-shipment).
   - Delivery: `AnotherLocation`, Today `20:00`.
   - Важный критерий milkrun (Qase 1625): во втором pre-shipment должны совпасть **pick-up или delivery (или оба) locations и date** с предыдущим pre-shipment.
5. **DIRECT BOOKING** → выбрать carrier `Green Carrier` → **SEND BOOKING**.
6. Booking tab: выполнить **AUTO-CONFIRM**.
7. Проверки результата:
   - в Booking tab виден блок **2 Shipments** (shipment brothers) → по клику открывается brothers modal со списком 2 shipments.
   - пример маршрутов в brothers modal (smoke):
     - `Breaking Bad | Albuquerque > Eiffel Tower | Paris`
     - `Breaking Bad | Albuquerque > AnotherLocation`
   - в Tracking tab виден **blueMilkrunBlock**.

## Flow: Milkrun monitoring modal (shipment card → "Click here")
Источник: Qase **924/926/927/1055/1061** (expected results), стенд: `/milkrun`.

1) Открыть shipment (FO) в Tracking/Booking и перейти на карточку shipment.
2) Если shipment является частью milkrun — на shipment card должен быть баннер (related shipments block) с текстом:
   - `This shipment belongs to a Milkrun with x steps from 'From location' to 'To location'. Click here to see full Milkrun` (Qase **924**)
3) Нажать **Click here** → открывается **Milkrun monitoring modal** (Qase **926**).
4) Ожидаемое содержимое модалки (Qase **927**):
   - список locations со своими dates (как на shipment card)
   - список related shipments + их статусы (как в central menu Booking tab)
   - map с маршрутами (routes)

Нюансы/риски (требует ручной верификации на стенде):
- корректность from/to адресов на баннере (Qase bug **1055**)
- корректность routes на map в monitoring modal (Qase bug **1061**)

## D) Pick-up grouping (создание группы + assign shipment)
Источник: `/main-app-automation/src/tests/uiTests/smokeTest/pickUpGrouping.js`

**Цель**: на странице **PICK-UP GROUPING** создать группу (group departure) и затем назначить в неё ещё один shipment.

### D.1) Создать pick-up group (Group departure)
1) Login как Shipper.
2) Создать и auto-confirm 2 shipments (Spot purchase, ROAD) с одинаковым **Pick-up location**:
   - `Pick-up grouping test1 [automation]`: PU `Eiffel Tower | Paris` Today 21:00 → DEL `TestGomel | Gomel` Today 22:00 → carrier `Green Carrier`.
   - `Pick-up grouping test2 [automation]`: PU `Eiffel Tower | Paris` Today 21:00 → DEL `AnotherLocation` Today 22:00 → carrier `Green Carrier`.
3) Sidebar (свернуть меню если нужно): **GROUPING → PICK-UP GROUPING**.
4) На странице pick-up grouping выставить фильтры:
   - Departure location: `Eiffel Tower | Paris`
   - Mode: ROAD
   - Carrier: `Green Carrier`
   - переключить `Past` и `Future` фильтры по дате (в тесте кликаются оба: `filterByDatePast`, затем `filterByDateFuture`).
5) В таблице выбрать оба shipments → нажать **Group departure** (`groupDepartureButton`).
6) В модалке **Grouped Pick Up**:
   - Group name: `Pickup group [automation]`
   - Pick-up date/time: Today 21:00
   - нажать **GROUP** (`groupButton`).
7) Проверки:
   - модалка закрылась
   - по кнопке `nShipmentsButton` открывается модалка списка shipments, где видны оба созданных shipment name.

### D.2) Assign shipment to existing group
1) Создать и auto-confirm ещё один shipment:
   - `Pick-up grouping test3 [automation]`: PU `Eiffel Tower | Paris` Today 21:00 → DEL `Eiffel Tower` Today 22:00 → carrier `Green Carrier`.
2) Вернуться **GROUPING → PICK-UP GROUPING**.
3) Выбрать shipment `Pick-up grouping test3 [automation]` и существующую группу `Pickup group [automation]`.
4) Нажать **Assign to the group** (`assignToTheGroupButton`).
5) В модалке **Assign shipments to the group** нажать **ASSIGN**.
6) Проверки:
   - виден `groupBlock`
   - по `nShipmentsButton` в списке есть `Pick-up grouping test3 [automation]`.

## Flow: Update Pick-up/Delivery location (модалки update location)
Источник: autotest `uiTests/smokeTest/updateLocation.js` + Qase suite *Location update*.

Базовый флоу (на обычном shipment; для milkrun ожидаем аналогичную механику, но проверить отдельно по Qase **2826–2829**):
1) Открыть shipment → Booking tab.
2) На shipment card нажать **Update Pick-up location**.
3) В модалке нажать кнопку обновления (пример: `updatePickUpLocationButton`).
4) Ввести/выбрать Location (autocomplete), открыть datepicker, выбрать date+time.
5) **Next** → **Confirm**.
6) Проверить системное сообщение в чате: `Test has updated the Pick-up location.`
7) Аналогично для **Update Delivery location** (message: `Test has updated the Delivery location.`).

Наблюдения из smoke autotest `uiTests/smokeTest/regenerationPDF.js` (не milkrun-специфично, но важно для понимания side-effects):
- после Confirm update location появляется green alert: `Booking transport order has been generated`
- в чате Booking/Invoicing появляется сообщение: `Transport Order has been regenerated.`
- в **Documents list** количество вложений (PDF) увеличивается, при этом:
  - ровно один attachment остаётся **active**
  - предыдущие версии становятся **disabled**
  - pdfName сохраняется (новая версия добавляется с тем же именем)

Milkrun-specific (suite: *Location update*, кейсы **2826–2829**):
- Update Pick-up/Delivery location для **Delivery milkrun** и **Collect milkrun**.
- В экспортированном JSON нет детальных шагов/expected result → нужно вычитать соответствующие TD Confluence страницы и/или руками на стенде зафиксировать:
  - меняется ли milkrun banner / monitoring modal stops
  - как пересчитываются routes на map
  - отображаются ли изменения на всех related shipments или только на одном

### Flow: Update location — carrier side visibility (из smoke `updateLocation.js`)
Цель: убедиться, что изменения pick-up/delivery location, сделанные shipper, видны перевозчику.

1) После того как shipper сделал update PU/DEL (см. выше) — logout.
2) Login как **Carrier** (`role.mainCarrier`).
3) Открыть sidebar → **BOOKING**.
4) Search shipment по имени.
5) Проверки в booking list:
   - `firstLineFromAddress = AnotherLocation`
   - `firstLineToAddress = ChangedLocation`
6) Открыть booking → shipment card:
   - `pickUpAddress = AnotherLocation`
   - `deliveryAddress = ChangedLocation`
7) Проверки в чате (Booking tab): carrier видит системные сообщения:
   - `Test has updated the Pick-up location.`
   - `Test has updated the Delivery location.`

### Flow: Update date/time (без смены location) — smoke `updateDate.js`
Источник: `/main-app-automation/src/tests/uiTests/smokeTest/updateDate.js`.

Цель: обновить только дату/время pick-up и delivery (location остаётся прежней).

1) Создать shipment через CSW (Direct booking, carrier `Green Carrier`).
2) Booking tab → shipment card → открыть **Update Pick-up location** modal.
3) В модалке **не менять location**, только:
   - открыть datepicker
   - выбрать date/time
   - **Next** → **Confirm**
4) Аналогично открыть **Update Delivery location** modal и обновить date/time.

Ожидание (по smoke логике):
- модалки закрываются;
- изменения отражаются на shipment card/в списках; (текст системного сообщения в чате — проверить, совпадает ли с updateLocation или отличается).
## Milkrun-stage flows (backlog to detail)

Ниже — список сценариев, которые нужно расписать шагами/expected (и по возможности подтвердить на стенде /milkrun + привязать к TD Confluence).

1) **Milkrun indicators in lists** (Booking/Tracking list): Qase **916/917/918/925**.
2) **Milkrun banner + Monitoring modal**: Qase **924/926/927** (+ edge cases **1055/1061**).
3) **FU keys for milkrun**: Qase **1417/1419/1421** (+ spectator restriction **1422**).
4) **Update location for milkrun** (Delivery/Collect): Qase **2826–2829**.
5) **Milkrun & FTL containers** (BK vs PSH levels): suite **274**, cases **2027–2039**; Email/PDF **2040–2046**.

См. также: `07_AUTOTEST_MAP.md` (что уже покрыто автотестами) и `08_LINKS_REGISTRY.md` (поиск TD страниц).
