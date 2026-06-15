# 03_OBJECTS_STATES_TRANSITIONS.md

> Цель: описать сущности TMS + их состояния и переходы (state machine).

## 1) Requests & Shipments — базовая цепочка

### 1.1 Draft (черновик)
**Создание**
- CSW step1 → заполнить минимум (как минимум Shipment name) → **SAVE** → Draft создан.
- Вариант: сохранение как **RTB (Ready-to-book)** на CSW step2 (вместо отправки/запроса) — создаётся booking в статусе RTB (см. 1.1.1).

**Переходы**
- Draft → SR/QR (создание заявки из Draft)
- Draft → удалить/закрыть (не документировано в источниках этого шага)

**Источник**
- Qase: 1339 Creating Draft

### 1.1.1 RTB (Ready-to-book)
**Определение**: booking, который создан/сохранён, но ещё не отправлен перевозчику (дальше предполагаются массовые операции и/или дальнейшее редактирование/отправка).

**Создание (факт из Qase)**
- CSW заполнен как для SR/QR → на step2 вместо отправки нажать **SAVE** → создаётся RTB booking.

**UI-заметка из Qase-экспорта (возможная неточность формулировки)**
- В expected result кейса **1340** сказано: `booking list opens with enabled ‘Draft’ option in filter`.
  - Это выглядит как copy/paste из Draft кейса 1339, но пока фиксируем как факт из экспорта.
  - На milkrun-стенде желательно руками проверить: есть ли отдельный фильтр **Ready-to-book** / **RTB**, и что именно авто-включается после создания RTB.

**Источники**
- Qase: 1340 Creating Ready to book
- Autotest: `uiTests/smokeTest/readyToBook.js`

### 1.2 SR (Shipment Request)
**Определение**: заявка одному перевозчику.

**Переходы (факты из тест-кейсов)**
- Created → (Carrier) **Confirm** → Shipment created
- Created → (Carrier) **Decline** → Declined
- Created → (Shipper) **Auto-confirm** → Shipment created
- Created → (Shipper) **Cancel** → Cancelled

**Источники**
- Qase: 1337 Creating SR, 1342 Auto-confirm SR, 1344 Confirm SR (carrier), 1619 Decline SR, 1354 Cancel SR

### 1.3 QR (Quote Request)
**Определение**: запрос котировок нескольким перевозчикам.

**Переходы (факты из Qase + автотестов)**
- Created → (Carrier) send quote → **Quoted**
- Quoted → (Shipper) **Auto-quote** (ввод price + Save quote) → Quoted (обновление quote)
- Quoted → (Shipper) **Award** → **Shipment Request (SR) / Shipment** (в UI остаёмся в booking карточке, но дальше появляются действия auto-confirm и вкладки Shipment)
- Created/Quoted → (Carrier) **Decline** → Declined

> Примечание (важное наблюдение из автотеста): в smoke-флоу QR после Award + Auto-confirm происходит переход на сущности shipment/invoicing (URL меняется).

**Источники**
- Qase: 1338 Creating QR, 1343 Auto-confirm QR, 1345 Confirm QR (carrier), 4279 Decline QR, 3828 Add new carrier to QR, 4598 Auto quote QR
- Autotest: `smokeTest/quoteRequest.js` (Auto-quote → Award → Confirm → Auto-confirm → проверка URL `/shipment-requests/` → `/shipments/` → `/invoicing/`)

### 1.4 Shipment (SH)
**Определение**: подтверждённая отправка (результат SR/QR).

**Состав** (по тест-кейсам)
- Tracking tab: TP, статусы, действия confirm/replan/request info
- Invoicing tab: стоимость/валидация (есть кейсы и автотест для rate sheet)
- Claims tab: открытие claim

**Источники**
- Qase: 1342/1344 (создание Shipment через SR), 1360 Invoicing, 1361 Claim
- Autotest: `rateSheets/usualRateSheets/countMilkrunRateSheet.js`

## 2) Milkrun как «связка N Shipment (brothers)»

### 2.0) Milkrun + Multi-containers (по Qase: BK vs PSH level)
Источник: `/shiptify/test-cases/MA-2026-05-25.json` (suite: **Milkrun & FTL**).

Набор кейсов в Qase-экспорте (suite: **Main app / Milkrun & FTL (274)**) — важен для milkrun-stage:

### BK level (booking-level packing list)
- **2027** Delivery milkrun with one container at BK level
- **2028** Collect milkrun with one container at BK level
- **2029** Ordinary FO with one container at BK level
- **2030** Delivery milkrun with multiple containers at BK level
- **2031** Collect milkrun with multiple containers at BK level
- **2032** Ordinary FO with multiple containers at BK level

### PSH level (pre-shipment-level packing list)
- **2033** Delivery milkrun with one container at PSH level
- **2034** Collect milkrun with one container at PSH level
- **2035** Delivery milkrun with multiple containers at PSH level
- **2036** Collect milkrun with multiple containers at PSH level

### BK + PSH (оба уровня одновременно)
- **2037** Delivery milkrun with both BK and PSH packing lists
- **2038** Collect milkrun with both BK and PSH packing lists
- **2039** Ordinary FO with both BK and PSH packing lists

### Email / PDF
- **2040** Email of shipment with cargo at BK level
- **2041** Email of shipment with cargo at PSH level
- **2042** Email of shipment with cargo at both BK and PSH levels
- **2043** PDF files of shipment with cargo at BK level
- **2045** PDF files of shipment with cargo at PSH level
- **2046** PDF files of shipment with cargo at both BK and PSH levels
- **2029** Ordinary FO with one container at **BK level**
- **2030** Delivery milkrun with multiple containers at **BK level**
- **2031** Collect milkrun with multiple containers at **BK level**
- **2032** Ordinary FO with multiple containers at **BK level**
- **2033** Delivery milkrun with one container at **PSH level**
- **2034** Collect milkrun with one container at **PSH level**
- **2035** Delivery milkrun with multiple containers at **PSH level**
- **2036** Collect milkrun with multiple containers at **PSH level**
- **2037** Delivery milkrun with both **BK and PSH** packing lists
- **2038** Collect milkrun with both **BK and PSH** packing lists
- **2039** Ordinary FO with both **BK and PSH** packing lists

(Соседние артефакты по письмам/PDF, полезны для проверки контента packing list: 2040–2046.)

Пока в экспорте нет шагов/деталей (в основном только titles/expected results). Фиксируем терминологию и гипотезу:
- **BK level** = настройки мультиконтейнеров/containers задаются на уровне booking целиком.
- **PSH level** = настройки контейнеров задаются на уровне каждого pre-shipment (PS) внутри CSW (важно для milkrun, где PS > 1).

Задача на milkrun-stage: руками проверить в CSW (step1) где переключается Containers и как это влияет на brothers block (Shipments vs Containers), packing list и FU keys (см. 1417/1419/1421).

> NB: в UI существует общий паттерн "brothers" (shipmentBrothersBlock + brothers modal), который используется и для Milkrun/FO (связанные shipments), и для Multi-container (список контейнеров). Это важно не перепутать при описании логики.

### Определение (операционное)
Milkrun = сценарий, когда **один booking** (через CSW) приводит к **нескольким связанным shipments** («brothers»), созданным из нескольких **pre-shipments** в CSW.

### Создание / переход
- В CSW step1 добавляется второй pre-shipment: **Add another delivery/picking point** (`addAnotherDeliveryPickingPointButton`).
- Условие для Milkrun (Qase **1625**, verbatim): `by specifying the same pick-up or delivery (or both) locations and date as in previous pre-shipment`.
- Конкретный smoke baseline (`creatingMilkrun.js`):
  - PS1 = `Albuquerque` (10:00) → `Eiffel Tower` (18:00)
  - PS2 = `Albuquerque` → `AnotherLocation` (20:00)
  - совпадает **pick-up** + дата, поэтому booking после send/confirm интерпретируется как milkrun.
- После booking confirmation Milkrun создаётся и открывается Booking tab (Qase 1625).
- После подтверждения booking создаётся **N shipments** (в smoke — N=2).

### Наблюдаемые признаки (UI)
- Booking tab: блок **“2 Shipments”** (shipment brothers block) → открывает brothers modal со списком связанных shipments.
- Tracking tab: **blueMilkrunBlock** (визуальная маркировка milkrun).

**Источники**
- Qase: 1625 Creating Milkrun
- Autotest: `smokeTest/creatingMilkrun.js`

### 2.1) Milkrun UI-индикаторы (Tracking list / shipment card) + monitoring modal (по Qase)

### 2.2) Milkrun: Update location (PU/DEL) — milkrun-specific cases (Qase)
Suite: `Main app / Location update` (из `/shiptify/test-cases/MA-2026-05-25.json`).

Кейсы:
- **2826** Update Pick-up location of **Delivery milkrun**
- **2827** Update Delivery location of **Delivery milkrun**
- **2828** Update Pick-up location of **Collect milkrun**
- **2829** Update Delivery location of **Collect milkrun**

Статус: **TBD** — в текущем JSON-экспорте (MA-2026-05-25.json) у кейсов **2826–2829** отсутствуют description/steps/expected result (в экспорте есть только titles). Нужны:
1) Confluence TD страницы/спеки по Location update + milkrun.
2) Либо ручная проверка на стенде `/milkrun` (после создания milkrun) и фиксация фактического поведения.

### 2.3) Milkrun: Freight Unit (FU) keys — milkrun-specific cases (Qase)
Suite: `Main app / Freight Orders & Freight Units / Freight Units`.

Кейсы + verbatim expected result (из `/shiptify/test-cases/MA-2026-05-25.json`):
- **1417** *FU - Create keys for milkrun*
  - `On the detail page is displayed new keys under the cargos`
- **1419** *FU - created and existing keys displayed on the detail page for milkrun*
  - `On the detail page is displayed  created  and existing keys under the cargos for milkrun`
- **1421** *FU - Saving keys multicontainers for milkrun*
  - `On the detail page is displayed  keys under every cargo after confirming carrier`
- **1422** *FU - keys are not displayed from spectators*
  - `Detailed page is opened and no possibility to switch tabs except TP from spectators`

Статус: **TBD** — в экспортированном JSON есть только expected results без steps. Для локальной KB нужно:
1) вычитать Confluence TD (спека/описание UI), и/или
2) руками подтвердить на стенде `/milkrun` (что именно является “keys”, где они отображаются «under the cargos», и в какой момент появляется “confirming carrier”).

Гипотеза (на основе smoke `addingFU.js` как baseline для non-milkrun):
- FU key в обычном shipment отображается в packing list / cargo contents modal как `FU - <key>` у shipper.
- У carrier FU может быть скрыт в cargo contents modal.
- Для spectator ожидается Tracking-only доступ + FU keys не видны (кейс 1422).
#### Tracking list (кейсы 916/917/918/925)

Ожидаемая логика (по Qase-экспорту, verbatim expected results см. `MA-2026-05-25.json`):
- **916 Milkrun**: если у freight order/shipments одинаковые pick-up или delivery locations и date, вместо одной из локаций показывается текст **"Milkrun"**.
- **917 List of milkrun addresses**: под строкой **"Milkrun"** отображается список milkrun locations (stops).
- **918 Tooltip for milkrun**: слева от слова **"Milkrun"** отображается **blue circle**; при hover показывается tooltip со stops (location + date/time).
- **925 Indicator for multipoint shipment**: после одной из локаций в карточке отображается **"+n"** (количество related shipments).

#### Shipment card (Tracking tab): related shipments banner + monitoring modal (кейсы 924/926/927/1055/1061)

- **924 Block for related shipments (milkrun)** (verbatim):
  `Banner with text "This shipment belongs to a Milkrun with x steps from 'From location' to 'To location'. Click here to see full Milkrun" displayed on shipment card, if this shipment is a part of milkrun`
- **926 Milkrun monitoring modal opening** (verbatim):
  `Milkrun monitoring modal window opens when clicking on the [Click here] button of milkrun banner on shipment card`
- **927 Content of Milkrun monitoring modal** (verbatim):
  `Milkrun monitoring modal contains locations with dates (as on shipment card), all related shipments with their statuses (as on central menu of booking tab) and map with routes on it`
- **1055 Locations on block for milkrun**: дополнительно проверить корректность **from/to addresses** на баннере.
- **1061 Routes on map**: дополнительно проверить корректность маршрутов на карте между всеми точками.

Статус: **нет автотеста** на modal/tooltip/addresses → нужно руками подтвердить на стенде **/milkrun** и после подтверждения зафиксировать скрин/поведение в KB.

Источник: `/shiptify/test-cases/MA-2026-05-25.json` (Milkrun suite).

Наблюдаемые/ожидаемые элементы:

#### A) Tracking list: "Milkrun" label / addresses / tooltip
- **Milkrun label** (Qase **916** *Milkrun*):
  - если freight order в списке бронирований/треккинга имеет одинаковые pick-up или delivery locations + date, то в карточке вместо одной из локаций отображается текст **"Milkrun"**.
- **List of milkrun addresses** (Qase **917** *List of milkrun addresses*):
  - ниже текста **"Milkrun"** отображается список locations, которые имеют одинаковую pick-up или delivery location.
- **Tooltip for milkrun** (Qase **918** *Tooltip for milkrun*):
  - перед текстом **"Milkrun"** находится **blue circle**;
  - при hover появляется black pop-up tooltip;
  - tooltip показывает список stops: locations + date/time.
- **Indicator for multipoint shipment** (Qase **925** *Indicator for multipoint shipment*):
  - если shipment в tracking list имеет одинаковые pick-up или delivery locations, отображается индикатор **"+n"** (кол-во related shipments) после одной из локаций.

#### B) Shipment card (Tracking tab): milkrun banner + monitoring modal
- **Milkrun banner** (Qase **924** *Block for related shipments (milkrun)*):
  - текст: `This shipment belongs to a Milkrun with x steps from 'From location' to 'To location'. Click here to see full Milkrun`
  - кликабельная часть: **[Click here]**.
- **Milkrun monitoring modal opening** (Qase **926**):
  - modal открывается по клику на **[Click here]**.
- **Content of Milkrun monitoring modal** (Qase **927**):
  - locations с датами (как на shipment card)
  - все related shipments + их статусы (как в центральном меню Booking tab)
  - map с маршрутами между всеми точками milkrun
- **From/To addresses correctness** (Qase **1055**, bug):
  - на баннере должны отображаться корректные from/to адреса для milkrun.
- **Routes on map correctness** (Qase **1061**, bug):
  - в monitoring modal на карте должны отображаться корректные маршруты между всеми точками milkrun.

#### C) FU keys для milkrun (по Qase)
Источник: `/shiptify/test-cases/MA-2026-05-25.json`.
- **1417** FU - Create keys for milkrun: на detail page отображаются **новые keys** под cargos.
- **1419** FU - created and existing keys displayed on the detail page for milkrun: на detail page отображаются **и созданные, и существующие** keys под cargos.
- **1421** FU - Saving keys multicontainers for milkrun: после **confirm carrier** keys отображаются **под каждым cargo** (акцент: milkrun + multicontainers).
- **1422** FU - keys are not displayed from spectators (verbatim expected result из экспорта): `Detailed page is opened and no possibility to switch tabs except TP from spectators`.
  - интерпретация для KB: spectator в принципе ограничен Tracking-only (TP), и FU keys должны быть скрыты.
- **1442** MULTICONTAINERS - Spectator access to brothers (verbatim expected result): `Shipment for each container is displayed on the tracking list and have own ID`.
  - трактуем как: при multicontainers у spectator должны появляться отдельные shipment entries (по контейнеру) в tracking list; требует проверки на стенде, чтобы понять как это соотносится с brothers modal/packing list.

Связь с существующими smoke автотестами:
- общий UI-паттерн добавления FU покрыт кейсом **4423** и автотестом `smokeTest/addingFU.js`.
  - важный факт из smoke:
    - **Shipper видит FU**:
      - CSW step2: `FU - <key>` в shipment card (`cargoFreightUnit`)
      - Booking tab → Packing list → Cargo contents modal: `FU - <key>`
      - Tracking tab → Packing list → Cargo contents modal: `FU - <key>`
    - **Carrier FU не видит** (в smoke ожидается `cargoFreightUnit.exists == false`) в cargo contents modal на Booking и Tracking tabs.
  - промежуточный UI факт: после Add information на CSW step1 появляется комментарий `FU: <key>` (элемент `addInformationComment`).

Это похоже на осознанное ограничение видимости FU keys для carrier (нужно подтвердить на milkrun-stage, т.к. milkrun кейсы 1417/1419/1421 предполагают дополнительные ключи/привязки).
- milkrun-специфика (1417/1419/1421) пока **не закреплена автотестом** → нужно либо добавить отдельный UI autotest, либо прогнать вручную на стенде milkrun и зафиксировать факт (как именно выглядит "detail page" для milkrun и где отображаются keys).

## 2.1) Контейнеры / Multi-container (не Milkrun)

### MC (Multi-container) — операционное описание по автотесту
- В CSW step1 можно переключиться на вкладку **Containers** и выбрать тип контейнера + количество.
- После booking + auto-confirm на Booking tab появляется brothers block вида **`3 Containers`**.
- Brothers modal показывает элементы `0001 / 0002 / 0003`.
- На Tracking tab (packing list) появляется блок **`2 other containers on this booking`** + dropdown для переключения "brothers".
- На Invoicing tab появляется блок **`3 containers were booked`** + список контейнеров.

Источник: `uiTests/smokeTest/creatingMC.js`.

### FO (Freight Order) как частный случай "2 Shipments" brothers
В smoke-наборе встречается сценарий, где после auto-confirm отображается brothers block **`2 Shipments`** и в modal видны два маршрута (2 shipments). По UI-артефактам выглядит похоже на Milkrun (и может быть milkrun-подобной логикой), но в документации разделяем:
- **Milkrun** — связывание shipments через несколько pre-shipments (см. 2)
- **FO** — отдельный тип/термин, встречающийся в тестах; требуется уточнение по доменной модели в TD Confluence

Источник: `uiTests/smokeTest/creatingFO.js`.

## 2.2) Grouping (не Milkrun)

Grouping = объединение существующих shipments в **группу** (например, *Grouped Pick Up / Grouped Delivery*). Это отдельная сущность/операция, не связанная напрямую с CSW pre-shipments (Milkrun из раздела 2).

### 2.2.1) Операции grouping (факты из автотестов)
Источник: `uiTests/smokeTest/grouping.js`

Базовые переходы состояния/TP, которые уже подтверждены smoke:
- выбрать 2 shipment-а на странице **GROUPING** → активируется соответствующая bulk-action кнопка
- подтвердить группировку через modal → modal закрывается, а Tracking tab у каждого shipment-а получает link `Grouped with 1 other shipment`
- фактически grouping меняет не только list-level grouping status, но и оставляет след в Tracking Points UI конкретных shipment-ов

- **Group departure** (`groupDepartureButton`) → модалка `groupedPickUpModal`:
  - выбирается дата/время departure
  - выбирается tag (в smoke: `purple`)
  - после Group в Tracking Points block появляется ссылка `Grouped with 1 other shipment` (departure)
- **Group arrival** (`groupArrivalButton`) → модалка `groupedDeliveryModal`:
  - выбирается дата/время arrival
  - tag (в smoke: `green`)
  - после Group в Tracking появляется link `Grouped with 1 other shipment` (arrival)
- **Group shipment** (`groupButton` → `selectGroupOptionsModal` → `groupShipmentButton`) → модалка `groupedPickUpAndDeliveryModal`:
  - задаются даты/время и для pick-up, и для delivery
  - в Tracking появляются оба link: groupedDepartureLink + groupedArrivalLink

### 2.2.2) Pick-up grouping (страница PICK-UP GROUPING)
Источник: `uiTests/smokeTest/pickUpGrouping.js`
- Фильтры: departure location + mode (ROAD) + carrier + (Past/Future)
- Операция **Group departure** создаёт pick-up group с полем **group name**.
- Операция **Assign to the group** назначает shipment в существующую группу.

**Источник (test cases)**
- Qase: 4593 Pick-up grouping

### 2.2.1) "Create Milkrun" как операция на странице Grouping

> Важно: это **не тот же Milkrun**, что создаётся через CSW pre-shipments (раздел 2). Это операция "смерджить/сгруппировать" несколько существующих shipments в milkrun-группу на отдельной странице.

Опорные тест-кейсы (Qase export):
- **2013** — при выборе >1 shipment появляется кнопка **[MILKRUN]**
- **2054** — по клику открывается **Create Milkrun Modal**
- **2014** — после **[GROUP]** выбранные shipments отображаются со статусом **`grouped`**
- **4141/4152** — toggle **MERGE IN A MILKRUN** можно enable/disable

#### Наблюдаемые факты (Qase-экспорт, verbatim expected results)
- (2013) После открытия grouping page и выбора **более одного shipment** на странице отображается кнопка **[MILKRUN]**.
- (2054) По клику на **[MILKRUN]** открывается **Create Milkrun Modal**.
- (2014) После клика на **[GROUP]** в Create Milkrun Modal выбранные shipments отображаются со статусом **grouped**.
- (4141 / 4152) Toggle **MERGE IN A MILKRUN** можно **enable/disable**.

#### Черновик state machine (нужна верификация на стенде)
- `Show Milkrun = enabled` → sidebar содержит **Grouping** (Qase 2004)
- `shipments: selected (N>1)` → **[MILKRUN]** (Qase 2013) → `Create Milkrun Modal` (Qase 2054) → **[GROUP]** → `shipments.status = grouped` (Qase 2014, в таблице grouping page)

Открытые вопросы (TBD):
- Что именно меняется в data model при статусе `grouped`: появляется ли отдельный объект milkrun/group или это только UI-агрегация?
- В каких случаях включение **MERGE IN A MILKRUN** меняет результат (мердж stops? мердж shipment? перенос TP? перерасчёт стоимости?)

Источники: `/shiptify/test-cases/MA-2026-05-25.json` (кейсы 2013/2014/2054/4141/4152).

### 2.2.1.2) Crossdock / Transit via: MERGE IN A MILKRUN toggle (факт из Qase)
Источник: Qase-экспорт `/shiptify/test-cases/MA-2026-05-25.json`.
- **4141** MERGE IN A MILKRUN toggle (suite: Crossdock part1 / Transit via / Without merge)
- **4152** MERGE IN A MILKRUN toggle (suite: Crossdock part1 / Transit via / With merge)

Что уже явно видно из exported expected results (полезно для state machine/UI контракта):
- Операция завязана на **modal** (контекст: transit via), в котором должны быть элементы:
  - Close button
  - Mini shipment card
  - поле **“Transit via”**
  - toggle **[MERGE IN A MILKRUN]**
    - **не отображается**, если выбран только **1 RTB**
  - кнопка **[CONFIRM]**
- В кейсах присутствуют предусловия:
  - toggle должен быть **disabled** (вариант проверки)
  - toggle должен быть **enabled** (вариант проверки)

TBD для state machine (после вычитки Confluence TD / ручной проверки):
- что именно означает "merge" в контексте transit via (мердж shipment? booking? stops?)
- какие объекты/атрибуты меняются при enable/disable
- как это связано с Milkrun (CSW milkrun vs grouping milkrun) и влияет ли на milkrun monitoring/stops

### 2.2.1.1) Update locations для milkrun (Delivery/Collect)
Источник: Qase-экспорт `/shiptify/test-cases/MA-2026-05-25.json`.
- **2826** Update Pick-up location of Delivery milkrun
- **2827** Update Delivery location of Delivery milkrun
- **2828** Update Pick-up location of Collect milkrun
- **2829** Update Delivery location of Collect milkrun

Статус источника: в экспортированном JSON **description пустой** для 2826–2829, поэтому шаги/ожидания нужно искать в **Confluence TD** и/или проверять руками на стенде `/milkrun`.

#### Ближайший «аналог» шагов из UI autotests (не Milkrun, но тот же механизм Update location)
Источник: `uiTests/smokeTest/updateLocation.js`.

Наблюдаемая механика (Shipment Request / Booking tab):
- На **Booking tab** в shipment card есть действия:
  - **Update Pick-up location** → открывается modal `updatePickUpLocationModal`
  - **Update Delivery location** → открывается modal `updateDeliveryLocationModal`
- В модалке (обе ветки) флоу одинаковый:
  1) Нажать кнопку начала обновления (`updatePickUpLocationButton` / `updateDeliveryLocationButton`).
  2) Ввести/выбрать новый location (в тесте: `AnotherLocation`, `ChangedLocation`).
  3) Выбрать дату (simple datepicker) + время (simple time picker).
  4) **Next** → **Confirm**.
- После подтверждения:
  - модалка закрывается,
  - в booking chat появляется системное сообщение:
    - `Test has updated the Pick-up location.`
    - `Test has updated the Delivery location.`
  - в **Booking list** меняются from/to адреса (проверяется по `firstLineFromAddress` / `firstLineToAddress`).
  - при открытии booking значения на shipment card обновлены.
- На стороне **carrier** (тот же booking) обновлённые адреса видны и системные сообщения в чате присутствуют.

Как применить к Milkrun-кейсам 2826–2829 (гипотеза до верификации):
- UI entrypoint и механика модалки, вероятно, те же.
- Отличие Milkrun: нужно руками проверить, как update одной PU/DEL влияет на:
  - stops/steps в milkrun monitoring modal,
  - label `Milkrun`/tooltip в tracking list,
  - связи related shipments (brothers) и их статусы.

Пока без детальных шагов именно для Milkrun: фиксируем, что базовый механизм update location **уже** покрыт smoke автотестом (не milkrun).

Qase кейсы, которые напрямую относятся к Update location для обычного shipment (не milkrun):
- **948** Update location modal
- **950** Update location functionality
- **952** Update content

## 3) Incoterms как атрибут booking/shipment

Incoterms (purchase/sales) настраиваются в CSW step1 и далее отображаются в карточке shipment после отправки/подтверждения.

Подтверждённые факты (smoke `smokeTest/incoterms.js`):
- В CSW step1 есть блок incoterms с переключателями **Buy**/**Sell**.
- Для Buy задаётся Supplier + тип incoterm (пример: **DDP**).
- Для Sell задаётся Customer + тип incoterm (пример: **DDU**).
- На CSW step2 строка locations в shipment card включает оба incoterm: `DDP <Pick-up> → DDU <Delivery>`.
- После send booking и после auto-confirm incoterms отображаются:
  - в data block на Booking tab и Tracking tab (purchase/sales)
  - в tooltip по иконкам incoterm
  - в packing list (cargo contents)

Связанные кейсы (Qase): 1759 + PS-level: 1432/1434 (см. ниже).

## 4) CSW pre-shipment (PS) level features (milkrun/multi-PS)

По Qase-экспорту присутствуют кейсы, показывающие, что часть полей/настроек может быть доступна **на уровне pre-shipment** (PS) внутри CSW (важно для milkrun, где PS > 1). Suite path в экспорте: `Freight Orders & Freight Units / Freight Orders`:
- 1430 — **SPECTATORS - assign at preshipment level**
- 1431 — **SPECTATORS - select from dropdown list**
- 1432/1434 — **INCOTERM** на PS уровне (включая "blue zone" рядом с адресом)
- 1441 — **MULTICONTAINERS - functionality at PS level**

**Verbatim expected results (Qase):**
- (1430) `The field of spectators is displayed on each pre-shipment`
- (1431) `List of spectators in dropdown opens and can be chosen`
- (1432) `Incoterms are displayed on each pre-shipment`
- (1434) `The selected incoterm is displayed in blue zone next to the address`
- (1441) `Muticonainers are available and displayed at PS level`

> Статус: в экспортированном JSON шаги отсутствуют (только названия/expected results в description). Нужна верификация в UI на стенде milkrun + уточнение: где именно в CSW это настраивается (step1/PS card) и как влияет на generated shipments.
>
> Что именно ожидается по описаниям expected results (Qase):
> - **1430 Spectators @ PS level**: поле Spectators отображается **на каждом pre-shipment**.
> - **1431 Spectators dropdown**: список spectators в dropdown открывается и можно выбрать.
> - **1432 Incoterms @ PS level**: incoterms отображаются **на каждом pre-shipment**.
> - **1434 Incoterm blue zone**: выбранный incoterm отображается в **blue zone рядом с адресом**.
> - **1441 Multicontainers @ PS level**: multicontainers доступны и отображаются **на PS уровне**.

## 4) Tracking visibility sharing (Spectator / PML)

### 3.1 Spectator sharing (blue blocks)
- При создании shipment можно назначить **Spectator** (CSW step1 → dropdown *Spectators*).
- После создания:
  - на Tracking tab основного аккаунта отображается **blueSpectatorBlock**:
    - `This shipment tracking is shared with <spectator account name>`
  - spectator видит соответствующий блок о том, что трекинг «shared by».
- Важно: spectator имеет доступ **только к Tracking tab** (по ожидаемому результату тест-кейса).

**Источники**
- Qase: 4164
- Autotest: `smokeTest/addingSpectator.js`

### 3.2 PML user visibility
- ML owner видит shipments, где его ML указан как pick-up/delivery.
- Доступ **только Tracking**.

**Источник**
- Qase: 4165

## 4) Tracking Points (TP) — действия и статусы

### Операции (из кейсов)
- **Confirm TP**
- **Replan TP** (смена даты/времени)
- **Request info TP** (запрос подтверждения/реплана, когда TP просрочен)
- **Cancel TP confirmation** (отмена подтверждения)

### Операции (подтверждено автотестами)
- TP actions вызываются через hover по TP → кнопка **Show actions**.
- Confirm TP (shipper side): после подтверждения **Confirm/Replan** для этого TP исчезают; в чат добавляется системное сообщение.
- Confirm TP (carrier side): carrier подтверждает **Arrival TP**, после чего confirm/replan arrival исчезают; в чат добавляется системное сообщение.
- Request info TP (shipper side): открывает modal *Request information* → ветки **Just need confirmation** / **Still expect**; в чат появляется сообщение-запрос перевозчику.

**Источники**
- Qase: 1349 Replan TP, 1350 Confirm TP, 1615 Request info TP, 4281 Cancelling of TP confirmation
- Autotest: `smokeTest/confirmTP.js`
- Autotest: `smokeTest/requestInfoTP.js`

## 4) Rate sheet (как влияние на цену)

- На шаге выбора перевозчика (CSW step2) может отображаться цена из rate sheet.
- После создания shipment цена сохраняется и отображается в Booking и Invoicing.

**Источники**
- Autotest: `rateSheets/usualRateSheets/countMilkrunRateSheet.js`
- Qase: **4221** (Milkrun calculation)

### 4.1) Milkrun calculation rules (из Qase 4221, без примера)
Текст из экспорта (как есть):
- Go from LEFT TO RIGHT.
- Lookup first column where (Number of DISTINCTS PU or DEL Locations - 2) in BK = Number.
- You found the cost.

> Расшифровка/пример на стенде — TBD (нужно сверить с конкретной rate sheet таблицей и понять, что считается PU/DEL distinct, и что означает BK в формуле).

## Freight Unit (FU) — сущность + отображение/доступность (TMS)

### FU как отдельная сущность (FREIGHT UNITS page)
Источник: autotest `uiTests/smokeTest/creatingFU.js`.

Наблюдаемое поведение (по smoke):
- Sidebar → **FREIGHT UNITS** → **Create**.
- Модалка требует минимум:
  - Pick-up location
  - Delivery location
  - Availability date
- После создания:
  - модалка закрывается
  - green alert содержит `Freight units created!`
  - по фильтру Availability date = Today появляется строка в списке FU с префиксом `007-` (интерпретируем как account code; уточнить соответствие для других аккаунтов).

### FU key как атрибут cargo/packing list (CSW → Add information)
- Источник: autotest `uiTests/smokeTest/addingFU.js`, Qase кейс **4423**.
- Наблюдаемое поведение (по автотесту):
  - **Shipper**:
    - CSW step1 → Add information: можно выбрать FU key; после confirm показывается комментарий `FU: <key>`.
    - CSW step2 (карточка shipment) показывает `FU - <key>`.
    - Booking/Tracking tabs: в Cargo contents modal отображается `FU - <key>`.
  - **Carrier**:
    - Booking/Tracking tabs: в Cargo contents modal **FU не отображается** (`cargoFreightUnit.exists == false`).
- Вывод для модели доступа: FU — часть данных shipment, но может быть **скрыта от carrier** (как минимум в UI packing list).

## Milkrun monitoring modal (объект/компонент UI)
Источник: Qase **924/926/927**.

### Related shipments block / Milkrun banner (на shipment card)
- Отображается, если shipment является частью milkrun.
- Текст (expected result, Qase 924):
  - `This shipment belongs to a Milkrun with x steps from 'From location' to 'To location'. Click here to see full Milkrun`
- Содержит CTA **Click here** → открывает monitoring modal.

### Milkrun monitoring modal
Ожидаемые блоки (Qase 927):
- stops: locations + dates (как на shipment card)
- related shipments list + statuses (как в central menu Booking tab)
- map: routes между stops

### Known-risk areas (проверить на /milkrun стенде)
- Qase bug **1055**: корректность from/to адресов на milkrun banner.
- Qase bug **1061**: корректность routes на map.
## Milkrun-stage: объекты/состояния/переходы (TODO уточнить)

- **Milkrun** как связь/группа между shipments (related shipments):
  - индикаторы: label `Milkrun` (Qase **916**), addresses list (**917**), tooltip (**918**), `+n` indicator (**925**).
  - shipment card banner + monitoring modal: (**924**, **926**, **927**), корректность from/to (**1055**) и routes on map (**1061**) — требуется ручная верификация.
- **Update location (milkrun)**: Delivery/Collect milkrun update PU/DEL (Qase **2826–2829**) — ожидаемый side-effect: system messages в чате + обновление booking list/card (аналогично `smokeTest/updateLocation.js`).
- **Freight Unit keys в milkrun**: отображение created/existing keys под cargos, включая multicontainers + after confirming carrier (Qase **1417/1419/1421**).
