# 01_PRODUCT_MAP.md

> Область: **ShiptiFy TMS** (internal). Фокус стенда: https://app.blu.shiptify.com/milkrun

## 1) Высокоуровневая карта продукта (TMS)

### Основные домены/модули
- **Booking / CSW (Create Shipment Workflow)**
  - входная точка создания перевозки/заявки
  - режимы: **Direct Booking** / **Request a Quote** / Draft / Ready-to-book
- **Requests**
  - **SR** (Shipment Request) — заявка одному перевозчику
  - **QR** (Quote Request) — запрос котировок нескольким перевозчикам
- **Shipments (SH)**
  - подтверждённый результат SR/QR (после confirm/auto-confirm)
  - вкладки/разделы: Booking / Tracking / Invoicing / Claims
  - факт из тестов: после Auto-confirm для SR/QR становятся доступны Tracking + Invoicing tabs (см. Qase 1342, автотесты rate sheets)
- **Tracking**
  - список отправок + детальная вкладка Tracking
  - Update location (PU/DEL) — основной механизм изменения локаций/дат на уровне shipment/booking через модалки **Update Pick-up location / Update Delivery location** (подтверждено smoke автотестом `smokeTest/updateLocation.js`; side-effect: возможна регенерация Transport Order PDF и версионирование в Documents list — см. `smokeTest/regenerationPDF.js`; milkrun-специфика 2826–2829 требует вычитки TD/ручной проверки)
  - **Tracking Points (TP)**: confirm / replan / request info
    - действия доступны через hover по TP → **Show actions**
    - подтверждение TP оставляет системное сообщение в чате (см. confirmTP.js)
    - request info TP генерирует запрос перевозчику + сообщение в чате (см. requestInfoTP.js)
  - sharing tracking (Spectator / PML user) — blue blocks
  - общий чат/вложения/метаданные (по автотестам)
- **Milkrun**
  - логика «связанных отправок» (related shipments)
  - два разных источника milkrun-логики:
    - **CSW milkrun**: один booking → несколько shipments через несколько pre-shipments (см. `creatingMilkrun.js`)
      - условие Milkrun (Qase 1625): во втором pre-shipment должны совпасть **pick-up или delivery (или оба) locations и дата** с предыдущим pre-shipment
      - smoke-факт: первый pre-shipment в `creatingMilkrun.js` = `Albuquerque (Today 10:00) → Eiffel Tower (Today 18:00)`, второй = `Albuquerque → AnotherLocation (Today 20:00)`; общий pick-up `Albuquerque` и общая дата дают milkrun-связку
      - smoke-факт: при вводе имени shipment в CSW появляется alert `nShipmentsAlreadyExistAlert` — по поведению в smoke автотестах это выглядит как **warning о найденных shipments с таким же/похожим названием** (в тестах имена часто переиспользуются, поэтому alert ожидаем и считаем «неблокирующим»)
      - smoke-факт: после **AUTO-CONFIRM** на Booking tab появляется блок **`2 Shipments`**, который открывает brothers modal
      - smoke-факт: в brothers modal отображаются маршруты вида:
        - `Breaking Bad | Albuquerque > Eiffel Tower | Paris`
        - `Breaking Bad | Albuquerque > AnotherLocation`
      - smoke-факт: на Tracking tab у shipment card виден `blueMilkrunBlock` (т.е. milkrun дополнительно маркируется уже после auto-confirm)
    - **Grouping milkrun**: кнопка **[MILKRUN]** на grouping page → Create Milkrun Modal (кейсы 2013/2054/2014)
  - визуальные элементы: blue milkrun block, label **"Milkrun"** в списках + addresses list + tooltip (blue circle), `+n` indicator, milkrun banner на shipment card + **Monitoring modal**
    - ожидаемое поведение (verbatim expected results из Qase; suite path: `Main app / Freight Orders & Freight Units / Freight Orders`):
      - 916: если у freight order в booking list одинаковые pick-up или delivery locations и date, вместо одной из локаций показывается текст **"Milkrun"**
      - 917: ниже **"Milkrun"** отображается список locations
      - 918: перед **"Milkrun"** есть blue circle; при hover tooltip со stops (location + date/time)
      - 925: в tracking list после одной из локаций отображается **"+n"** (кол-во related shipments)
      - 924: на shipment card отображается banner с текстом `This shipment belongs to a Milkrun... Click here...`
      - 926: по клику на **[Click here]** открывается Milkrun monitoring modal
      - 927: modal содержит locations+dates, related shipments+statuses и map с маршрутами
    - известные проблемные места из Qase (требуют ручной верификации на стенде milkrun):
      - 1055: корректность from/to адресов на milkrun banner
      - 1061: корректность маршрутов на карте в monitoring modal
    - отдельные подпроцессы milkrun-stage (TBD → зафиксировать из Confluence TD + руками; в Qase-экспорте MA-2026-05-25.json по этим кейсам нет нормальных шагов/expected results → нужно вычитать Confluence TD/проверить на стенде):
      - **FU keys в milkrun** (suite: *Freight Orders & Freight Units / Freight Units*) — кейсы **1417/1419/1421** + ограничения для spectator (**1422**)
      - **Update PU/DEL locations в milkrun** (suite: *Location update*) (Delivery/Collect) — кейсы **2826–2829**
      - **PS-level настройки CSW (важно для milkrun, где pre-shipment > 1)** (suite: *Freight Orders & Freight Units / Freight Orders*) — кейсы:
        - **Spectators @ PS level**: 1430/1431
        - **Incoterms @ PS level**: 1432/1434 (в т.ч. "blue zone" рядом с адресом)
        - **Multicontainers @ PS level**: 1441
- **Grouping**
  - отдельные страницы: **GROUPING** и **PICK-UP GROUPING**
  - вход в раздел может быть скрыт feature-toggle'ом **Show Milkrun** в **Admin menu**; по Qase 2004 после включения toggle вкладка Grouping появляется и у shipper, и у carrier
  - в Qase есть общий suite **4167 Grouping** (полезно как «входная точка» для чтения ожиданий/прав)
  - операции: group departure / group arrival / group shipment; создание pick-up groups; assign shipments to group
  - UI-артефакты: ссылки `Grouped with N other shipment` на Tracking tab
  - доступность в sidebar может быть скрыта и включается через Admin menu toggle **Show Milkrun** (Qase **2004**)
  - smoke baseline (`smokeTest/grouping.js`):
    - shipper создаёт пары shipment-ов и на странице **GROUPING** выполняет три операции:
      - **Group departure** → модалка `groupedPickUpModal` → выбирается дата/время + tag `purple`
      - **Group arrival** → модалка `groupedDeliveryModal` → выбирается дата/время + tag `green`
      - **Group shipment** → комбинированная группировка pick-up + delivery
    - результат: у обоих shipment-ов на Tracking tab появляются ссылки `Grouped with 1 other shipment`
  - smoke baseline (`smokeTest/pickUpGrouping.js`) для **PICK-UP GROUPING**:
    - фильтры: departure location + mode `ROAD` + carrier + `Past/Future`
    - создание группы: **Group departure** → `Grouped Pick Up` modal → `group name` + pick-up date/time
    - дозапись в существующую группу: выбрать shipment + group → **Assign to the group** → modal confirm
    - контрольный UI-артефакт: `nShipmentsButton` открывает список shipment-ов внутри группы
  - отдельная операция **Create Milkrun** на странице Grouping (не CSW milkrun):
    - при выборе >1 shipment появляется кнопка **[MILKRUN]** (Qase **2013**)
    - по клику открывается **Create Milkrun Modal** (Qase **2054**)
    - действие **[GROUP]** переводит выбранные shipments в статус **grouped** (Qase **2014**)
- **Slot booking / Slotify**
  - бронирование временных слотов (как shipper, так и carrier)
  - вход через sidebar: **+BOOK → SLOT BOOKING**
  - типы слотов (из автотестов): **DELIVERY** (shipper) / **PICK-UP** (carrier)
  - зависит от Master Location / зоны (Zone) и доступности слотов
- **Planning (Slotify Planning)**
  - отдельный раздел сайдбара: **PLANNING**
  - вкладки: **Board** / **Day** (и в Qase также фигурирует **Week**) 
  - переключатель направления: **RECEPTION** / **EXPEDITION**
  - отображает shipments/slots из Slot booking/CSW
  - что проверяется в Qase (smoke):
    - 2863 — shipment cards отображаются под корректной датой/временем (по location = user ML)
    - 2866 — Default ML на Planning отображается по умолчанию и не меняется (для Board + Reception/Expedition)
    - 2869 — переключение Week/Day/Board меняет main board
- **Rate Sheets**
  - расчёт цены при выборе перевозчика/подтверждении (CSW step2 → Booking → Invoicing)
  - smoke (НЕ milkrun): `smokeTest/rateSheet.js`
    - CSW step2: `rateSheetPrice = 8,500 €`
    - Booking tab: `carrierPrice = 8,500 €`, `appliedRateSheet = Rate Sheet for automation`
    - Invoicing tab: `validatedCost/agreedCost = 8,500.00 €`
  - smoke (milkrun): `rateSheets/usualRateSheets/countMilkrunRateSheet.js`
    - CSW step2: `rateSheetPrice = 10,000 €`
    - Booking tab: `carrierPrice = 10,000 €`, `appliedRateSheet = MILKRUN [Automation]`
    - Invoicing tab: `validatedCost/agreedCost = 10,000.00 €`

### Milkrun & FTL (packing list уровни: BK vs PSH)
Источник: Qase export `/shiptify/test-cases/MA-2026-05-25.json`, suite **Main app / Milkrun & FTL (274)**.
- BK level: 2027–2032
- PSH level: 2033–2036
- BK+PSH: 2037–2039
- Email/PDF: 2040–2046

### Связь с UI autotests (что уже точно кликается)
- BK-level packing list (booking-level containers) покрыт smoke автотестом:
  - `/main-app-automation/src/tests/uiTests/smokeTest/contentAtTheBookingLevel.js`
  - проверяемые артефакты:
    - CSW step2: `shipmentCard.contentFromTheBookingLevelZone` visible
    - Booking tab: `packingList.contentFromTheBookingLevelZone` visible
    - Booking list: cargo summary = `1 Car`

  - расчёт цены при выборе перевозчика/подтверждении, в т.ч. для Milkrun
  - **Milkrun calculation (Qase 4221)** — правила расчёта (для *milkrun sub-rate* таблицы в rate sheet):
    - CALCULATION RULES (verbatim):
      - Go from **LEFT TO RIGHT**
      - Lookup first column where
        - `(Number of DISTINCT PU or DEL Locations - 2) in BK = Number`
      - You found the cost
    - Минимальный сценарий (по шагам Qase 4221):
      1) Upload xls table for milkrun sub-rate
      2) Open CSW
      3) Select cargo according to RS rules
      4) Create 2+ pre-shipments with at least one unique location (locations according to RS rules)
      5) Fill other mandatory fields
      6) Click **[DIRECT BOOKING]** → carrier с milkrun price для соответствующего cost segment отображается
      7) Click **[SEND BOOKING]** → SR создаётся с price для соответствующего cost segment

    > NB: тут важно чётко определить, что именно считается *DISTINCT PU/DEL locations* на уровне BK (и как это мапится на колонки). Это нужно подтвердить в Confluence TD/или руками на стенде.

  - smoke факт (UI autotest `rateSheets/usualRateSheets/countMilkrunRateSheet.js`):
    - в CSW step2 отображается `rateSheetPrice = 10,000 €`
    - после Send booking:
      - Booking tab: `carrierPrice = 10,000 €`
      - Booking tab (central block): `appliedRateSheet = MILKRUN [Automation]`
      - Invoicing tab: `validatedCost/agreedCost = 10,000.00 €` + `appliedRateSheet = MILKRUN [Automation]`
- **Master Location (ML) / Public Master Location (PML)**
  - влияет на планирование/слоты/видимость трекинга и подсказки
- **Dock**
  - отдельный интерфейс `/dock` для dock-персон (см. роль `dockUser` в smoke автотестах)
  - минимальные признаки: dockStatistics на странице + account header data
- **My Site**
  - список shipments, привязанный к **собственной Master Location** пользователя, с фильтром направления:
    - **IN**: shipments где ML пользователя = delivery location
    - **OUT**: shipments где ML пользователя = pick-up location
  - подтверждено smoke автотестом `smokeTest/displayingShipmentsOnTheMySite.js` (см. также 07_AUTOTEST_MAP.md)
- **Supporting**
  - Address book (locations)
  - **Freight Units (FU)**
    - отдельная страница **FREIGHT UNITS** в sidebar (из smoke автотеста `smokeTest/creatingFU.js`)
    - создание FU: Pick-up location + Delivery location + Availability date → **Freight units created!** (green alert)
    - в списке FU после создания отображается строка с префиксом вида `007-` (вероятно account code + auto-numbering; проверить для других аккаунтов)
  - **Incoterms** (задаются в CSW и отображаются рядом с locations / на shipment card / в packing list)
  - по smoke автотесту `smokeTest/incoterms.js`:
    - в CSW step1 доступны переключатели **Buy**/**Sell** (purchase/sales incoterms)
    - для buy/sell выбираются контрагенты (Supplier/Customer) + тип incoterm (пример: **DDP** / **DDU**)
    - на CSW step2 в карточке shipment строка locations отображается как: `DDP <Pick-up> → DDU <Delivery>`
    - после send booking/auto-confirm на Booking и Tracking табах видны incoterm иконки с tooltip + data block; в packing list (cargo contents modal) также отображается строка `DDP ... → DDU ...`
  - Followers (chat notifications)
  - Spectators / PML users (tracking sharing)
  - Export

- **Crossdock / Transit via**
  - в Qase-экспорте есть функциональность **MERGE IN A MILKRUN** toggle в сценариях Crossdock (Transit via):
  - toggle проверяется в двух ветках (`Without merge` / `With merge`), и в обеих Qase ожидает именно возможность **enable/disable**, а не конкретный итоговый доменный результат — это признак, что пока у нас зафиксирован только UI-контракт переключателя, но не бизнес-правило эффекта merge
    - suite: `Crossdock part1 / Transit via / Without merge` (кейс 4141)
    - suite: `Crossdock part1 / Transit via / With merge` (кейс 4152)
  - что уже явно видно из exported expected results (Qase):
    - действие выполняется через **modal** (на уровне RTB/multi-selection), в котором должны быть:
      - Close button
      - Mini shipment card
      - поле **“Transit via”**
      - toggle **[MERGE IN A MILKRUN]**
        - **не отображается**, если выбран только **1 RTB**
      - кнопка **[CONFIRM]**
    - есть предусловия для кейсов: toggle должен быть **disabled** / **enabled** (т.е. это проверяется как переключаемое состояние).
  - пока неизвестно: что именно означает “merge” на уровне доменной модели (что мерджится и как выглядит результат) — нужно вычитку Confluence TD и/или ручную проверку.

## 2) Ключевые сущности (минимальный словарь домена)

| Сущность | Коротко | Где проявляется |
|---|---|---|
| **CSW** | мастер/модалка создания | +BOOK → Road → Spot purchase |
| **Draft** | черновик (минимальные данные, можно сохранить) | Booking list с фильтром Draft |
| **RTB** | Ready-to-book | массовое создание, список/модалки |
| **SR** | Shipment Request (1 carrier) | создание/confirm/decline/cancel |
| **QR** | Quote Request (N carriers) | quotes, auto-quote, add carrier |
| **Shipment (SH)** | подтверждённая отправка | Tracking/Booking/Invoicing/Claims |
| **TP** | tracking point | confirm/replan/request info |
| **Milkrun** | связанные shipments (братья) | related shipments block + monitoring |
| **Rate sheet** | правила расчёта стоимости | CSW step2 + invoicing |
| **ML/PML** | локация-«владелец» слотов | слоты/подсказки/ограничения |

## 3) Карта покрытия по тест-кейсам (Qase export → suites)

Источник: `/shiptify/test-cases/MA-2026-05-25.json` (3101 cases).

Наиболее «толстые» области (уровень suite-1, приблизительный ориентир для приоритизации документации):
- Create Shipment Wizard — 240
- Heppner — 214
- New dashboards — 210
- Product orders — 198
- Freight Orders & Freight Units — 145
- Update location — 130 (есть smoke UI autotest `smokeTest/updateLocation.js`, см. 07_AUTOTEST_MAP.md)
- Address book — 127
- Slotbook — 116
- Invite booster — 104
- Smoke test — 98
- Spectator & Booker — 95
- Emailing — 93
- Booking list — 88
- Grouping — 79
- **Milkrun & FTL** — suite id **274** (важно для стенда /milkrun)
- Rate Sheets — 75
- Planning-related UI widgets: Datepickers — 63; Slot time picker — 51
- Notifications — 61

> Заметка: это «карта покрытия тест-репозитория», не продуктовая архитектура. Но удобно как список тем, которые точно есть в регрессии.

## 4) Канонические источники фактов (ссылки на тестовые артефакты)

### Qase (экспорт test cases)
Файл: `/home/user/.openclaw/workspace/shiptify/test-cases/MA-2026-05-25.json`

Опорные кейсы:
- 1625 — **Creating Milkrun**
- 1337 — Creating SR; 1338 — Creating QR; 1339 — Creating Draft; 1340 — Ready to book
- 1341/4280 — Slot Booking (shipper/carrier)

### UI Autotests (как «реально кликается»)
Корень: `/home/user/.openclaw/workspace/main-app-automation/src/tests/uiTests`

Опорные тесты:
- `smokeTest/creatingMilkrun.js` — создание delivery milkrun (2 pre-shipments → 2 shipments)
- `rateSheets/usualRateSheets/countMilkrunRateSheet.js` — milkrun + цена из rate sheet

## 4) Milkrun (что уже точно видим по автотестам)

### 4.0) Быстрый список UI-артефактов (autotest → UI)
Источник: `uiTests/smokeTest/creatingMilkrun.js`
- CSW step1: `nShipmentsAlreadyExistAlert` (alert после ввода Shipment name).
- CSW step1: `addAnotherDeliveryPickingPointButton` (создание второго pre-shipment).
- Booking tab: `shipmentBrothersBlock` с текстом `2 Shipments` + brothers modal.
- Tracking tab: `blueMilkrunBlock` (маркер milkrun на карточке shipment).
- Создаётся из CSW добавлением второго pre-shipment через кнопку **Add another delivery/picking point** (`addAnotherDeliveryPickingPointButton`).
- После auto-confirm появляется блок **“2 Shipments”** (shipment brothers) и модалка со списком связанных отправок/маршрутов (в smoke: `Breaking Bad | Albuquerque > Eiffel Tower | Paris` и `Breaking Bad | Albuquerque > AnotherLocation`).
- На Tracking tab отображается **blueMilkrunBlock**.

См. автотест: `uiTests/smokeTest/creatingMilkrun.js`.

## 4.1) Milkrun индикаторы в списках (по Qase)
Источник: `/shiptify/test-cases/MA-2026-05-25.json`.
- В tracking/booking list может отображаться текст **"Milkrun"** вместо одной из локаций, если есть related shipments с одинаковыми pick-up или delivery locations + date (кейс 916).
- Под **"Milkrun"** отображается список адресов (кейс 917).
- Перед словом **"Milkrun"** расположен **blue circle** с tooltip при hover; tooltip показывает stops (location + date/time) (кейс 918).
- Возможен индикатор **"+n"** (количество related shipments) после локации (кейс 925).

### 4.1) Milkrun (что покрыто в Qase, но ещё не расписано в KB)
Источник: `/shiptify/test-cases/MA-2026-05-25.json`.

Полезные кейсы для детализации milkrun-stage:
- 916 — Milkrun
- 917 — List of milkrun addresses
- 918 — Tooltip for milkrun
- 924 — Block for related shipments (milkrun)
- 926 — Milkrun monitoring modal opening
- 927 — Content of Milkrun monitoring modal

Milkrun & FTL (контейнеры, BK level vs PSH level) — ориентиры для ручной верификации на стенде:
- 2027/2028 — delivery/collect milkrun with **one container** at **BK level**
- 2030/2031 — delivery/collect milkrun with **multiple containers** at **BK level**
- 2033/2034 — delivery/collect milkrun with **one container** at **PSH level**
- 2035/2036 — delivery/collect milkrun with **multiple containers** at **PSH level**
- 2037/2038 — delivery/collect milkrun with **both BK and PSH packing lists**
- Контрольные (ordinary FO): 2029/2032/2039

> Примечание: это «карта того, что есть в тест-каталоге» — сами шаги/ожидания нужно вычитать из описаний кейсов и перенести в 03/04 документы.

## 5) Brothers modal (related shipments vs containers) — важное различие
По автотестам UI один и тот же паттерн `shipmentBrothersBlock` используется для разных сценариев:
- **Milkrun / FO**: `2 Shipments` → brothers modal содержит связанные shipments (маршруты).
- **MC (Multi-container)**: `3 Containers` → brothers modal содержит контейнеры `0001/0002/0003`.

Источники:
- `uiTests/smokeTest/creatingFO.js`
- `uiTests/smokeTest/creatingMC.js`

## Milkrun (страница /milkrun)
- Стенд для ручной проверки milkrun monitoring: https://app.blu.shiptify.com/milkrun
- Смежные сущности/области:
  - Grouping (страница с таблицей shipments + действия группировки)
  - Create Milkrun modal (группировка/merge)
  - Shipment card (Tracking tab): milkrun banner + monitoring modal (см. Qase: 916-918, 924-927, 1055, 1061)

Источники:
- Autotests: `uiTests/smokeTest/creatingMilkrun.js`
- Test cases export: `/shiptify/test-cases/MA-2026-05-25.json` (кейсы 1625, 916-918, 924-927, 1055, 1061)

Suite paths (Qase export, полезно для поиска в дереве suites):
- 916/917/918/924/925/926/927 → `Main app / Freight Orders & Freight Units / Freight Orders`
- 1055/1061 → `Main app / Freight Orders & Freight Units / Freight Orders / Bugs`
