# 05_GLOSSARY.md

> Канонический язык: **русский** (internal). Термины фиксируем так, как они встречаются в UI/тестах.

## Основные сокращения

- **TMS** — Transport Management System (в рамках ShiptiFy)
- **CSW** — Create Shipment Workflow (модалка/мастер создания)
- **SR** — Shipment Request (заявка одному перевозчику)
- **QR** — Quote Request (запрос котировок нескольким перевозчикам)
- **SH / Shipment** — подтверждённая отправка (результат SR/QR)
- **RTB** — Ready to Book (booking сохранён, но ещё не отправлен/не подтверждён; создаётся через **SAVE** на CSW step2)
  - заметка: в expected result Qase кейса **1340** после создания RTB упоминается авто-включение фильтра `Draft` в booking list — вероятно неточность, требуется верификация в UI.
- **TP** — Tracking Point (точка трекинга)
- **ML** — Master Location
- **PML** — Public Master Location
- **My Site** — страница/раздел со списком shipments, связанных с Master Location пользователя; есть переключатель направления **IN/OUT** (см. `smokeTest/displayingShipmentsOnTheMySite.js`).
- **FU** — Freight Unit (единица груза / ключ)
  - есть два разных, но связанных UI-аспекта:
    1) **Freight Unit как отдельная сущность** (страница **FREIGHT UNITS** в sidebar)
       - smoke факт (`smokeTest/creatingFU.js`): создание FU через модалку (Pick-up location + Delivery location + Availability date)
       - после создания показывается green alert `Freight units created!`
       - в списке FU виден префикс вида `007-` (похоже на account code + auto-numbering; подтвердить на других аккаунтах)
    2) **FU key как атрибут cargo/packing list** (через CSW → Add information)
       - smoke факт (`smokeTest/addingFU.js`): shipper видит `FU - <key>` в CSW step2 и в cargo contents modal на Booking/Tracking; carrier FU **не видит** (в тех же модалках) — похоже на ограничение видимости данных.
  - по Qase в milkrun ожидается отображение созданных/существующих FU keys "under the cargos" на detail page (кейсы 1417/1419)
  - для milkrun + multicontainers ожидается сохранение keys по каждому cargo после confirm carrier (кейс 1421)
  - ограничения видимости: в Qase есть кейс **1422** (FU keys are not displayed from spectators) — учитывать при проверке spectator access

## Термины интерфейса (как в тестах)

- **roleSection (sessionStorage)** — технический переключатель UI-секции, который используется в автотестах при логине:
  - shipper/spectator: `sessionStorage.removeItem('roleSection')`
  - carrier: `sessionStorage.setItem('roleSection', 'ops')`
  - dock: `sessionStorage.setItem('roleSection', 'dock')`
  
  Это **не** продуктовый термин, но полезно для дебага (почему UI/меню отличается между аккаунтами).

- **Direct booking** — сценарий, когда shipper сразу выбирает перевозчика и отправляет заявку.
- **Request a quote** — сценарий запроса котировок у нескольких перевозчиков.
- **Auto-confirm** — автоматическое подтверждение и создание shipment.
- **Auto quote** — автозаполнение/создание котировки в QR.
- **nShipmentsAlreadyExistAlert** — предупреждение в CSW step1 после ввода Shipment name (smoke проверка в `creatingMilkrun.js`).
  - смысл: non-blocking warning о том, что shipments с таким/похожим названием уже существуют.
- **Shipment brothers** — блок/модалка связанных shipments (milkrun).
  - пример строк маршрутов в brothers modal (из `smokeTest/creatingMilkrun.js`):
    - `Breaking Bad | Albuquerque > Eiffel Tower | Paris`
    - `Breaking Bad | Albuquerque > AnotherLocation`
- **Blue milkrun block** — визуальный блок/маркер на Tracking tab для milkrun.
  - В Qase есть спорный кейс **1447** (название vs expected result), где на spectator side ожидается, что milkrun block **скрыт** — требует ручной верификации на стенде milkrun.
- **Milkrun label (Tracking list)** — текст **"Milkrun"** в карточке shipment/FO в списке (когда есть related shipments с одинаковыми pick-up/delivery locations + date). Под ним может отображаться список адресов (см. кейсы 916/917).
- **Milkrun tooltip (Tracking list)** — tooltip при hover на **blue circle** перед словом **"Milkrun"**; отображает stops (location + date/time) (кейс 918).
- **"+n" indicator (multipoint shipment)** — индикатор количества related shipments в списке после одной из локаций (кейс 925).
- **Milkrun banner** — баннер на shipment card (Tracking tab) с текстом: `This shipment belongs to a Milkrun with x steps from 'From location' to 'To location'. Click here to see full Milkrun` и кликом **[Click here]** открывает monitoring modal.
- **Milkrun monitoring modal** — модалка мониторинга milkrun, открывается из milkrun banner; содержит locations+dates, related shipments+statuses и map с маршрутами (кейсы 926/927; корректность маршрутов — 1061).
- **"+n" indicator** — индикатор количества related shipments в tracking list после одной из локаций (Qase 925).
- **/milkrun (milkrun stage page)** — отдельная страница стенда для ручной проверки milkrun monitoring UI: https://app.blu.shiptify.com/milkrun
  - ожидаемая точка входа: milkrun banner на shipment card (Tracking tab) → ссылка/кнопка **[Click here]**.
- **Content at BK level / contentFromTheBookingLevelZone** — UI-зона/маркер, который появляется, когда packing list/контейнеры заданы **на уровне booking** (BK level).
  - подтверждено smoke автотестом `smokeTest/contentAtTheBookingLevel.js`:
    - CSW step2: `shipmentCard.contentFromTheBookingLevelZone.visible == true`
    - Booking tab: `packingList.contentFromTheBookingLevelZone.visible == true`
    - Booking list: cargo summary = `1 Car`
- **Milkrun calculation rule (Rate sheet)** — правило расчёта цены milkrun в rate sheet (Qase 4221): искать слева направо первый столбец, где `(кол-во distinct PU или DEL locations - 2) in BK` соответствует значению; стоимость берётся из найденного столбца (детализация формулы/пример — TBD).
- **Update Pick-up/Delivery location** — модалки обновления локации/даты (Booking tab): запускаются из shipment card; после confirm в чате появляется системное сообщение `...has updated the Pick-up/Delivery location.` (см. `smokeTest/updateLocation.js`).
- **Transport Order regeneration / Transport Order has been regenerated** — побочный эффект некоторых изменений в shipment/booking, который приводит к пересозданию PDF (Transport Order) и появлению нового системного сообщения в чате.
  - smoke факт (`smokeTest/regenerationPDF.js`): после update cargo / update PU location / update DEL location / edit cost (Invoicing) появляется green alert `Booking transport order has been generated` и в чате сообщение `Transport Order has been regenerated.`
  - в **Documents list** при этом добавляется новая версия PDF: count attachments растёт, один attachment остаётся active, предыдущие становятся disabled.
- **Blue spectator block** — blue block на Tracking tab, показывающий что трекинг шарится со spectator:
  - shipper side (smoke): ` This shipment tracking is shared with Shipper ` (в тесте сравнивается `textContent`, включая пробелы)
  - spectator side (smoke): ` This shipment tracking is shared by reppihS ` (shipper отображается как `reppihS` — инвертированная строка `Shipper`, считаем это тестовой особенностью/данными)
- **FO (Freight Order)** — термин из автотестов smoke (`creatingFO.js`). По UI выглядит как booking, который после auto-confirm показывает `2 Shipments` в brothers block. Требуется уточнение доменной модели (FO vs Milkrun vs обычный booking).
- **MC (Multi-container)** — сценарий/тип booking с несколькими контейнерами (в smoke: `3 Containers`). В brothers modal отображаются контейнеры `0001/0002/0003`, а на Tracking/Invoicing есть отдельные блоки про контейнеры.

## Milkrun (операционное определение)
Milkrun — сценарий/тип отправки, где один booking приводит к **нескольким связанным shipments** (related shipments). Создаётся добавлением второго pre-shipment в CSW.

Источник: автотест `smokeTest/creatingMilkrun.js`, Qase 1625.

## Дополнительные термины (для milkrun stage)

- **Pre-shipment (PS)** — под-блок в CSW step1 для каждой связанной отправки внутри Milkrun (создаётся кнопкой *Add another delivery/picking point*). В Qase есть отдельные кейсы про настройки на уровне PS (spectators/incoterm/multicontainers).
- **PSH level** — «pre-shipment level» (уровень PS). Используется в названиях кейсов milkrun + multicontainers (2035/2036).
- **BK level** — «booking level» (уровень booking целиком). Используется в названиях кейсов milkrun + multicontainers (2030/2031).
- **INCOTERM** — условие поставки; настраивается в CSW.
  - smoke факт (`smokeTest/incoterms.js`): есть **Buy/Sell** incoterms (purchase/sales), в карточке shipment locations отображаются как `DDP <Pick-up> → DDU <Delivery>`, а на Booking/Tracking есть incoterm иконки с tooltip + data blocks; в packing list (cargo contents) также видна строка с incoterms.
  - по Qase также есть кейсы про PS-level для milkrun (1432/1434) — нужно подтверждение в UI.
  Источники: Qase 1759 (общий), milkrun PS-level: 1432/1434.
- **Followers** — подписчики уведомлений по shipment/booking; в UI в чате есть вкладки *Messages / Teammates / Partners*.
- **Slot booking / Slotify** — флоу бронирования слота (отдельный wizard/модалка, запускается через **+BOOK → SLOT BOOKING**).
  - slot types (из smoke): **DELIVERY** (shipper) / **PICK-UP** (carrier)
  - шаги: Location → Orders → Zone → Packing list → Time slot → (опционально) Carrier data → Confirmation
- **Planning (Slotify Planning)** — раздел **PLANNING** в сайдбаре для просмотра/планирования слотов и shipments.
  - вкладки: **Board** / **Day**
  - направления: **RECEPTION** / **EXPEDITION**
- **Show actions** — кнопка в Tracking Points block, открывает доступные действия для TP (Confirm/Replan/Request info).
- **Request information (TP)** — модалка запроса подтверждения/реплана у перевозчика; варианты: *Just need confirmation* / *Still expect*.
- **Grouping / Grouped Pick Up** — операция объединения существующих shipments в группу (не путать с Milkrun).
  - Источник: Qase 4593.
- **Group departure / Group arrival / Group shipment** — три основные bulk-операции на странице **GROUPING**.
  - smoke (`grouping.js`): после подтверждения операции на Tracking tab появляется link `Grouped with 1 other shipment`.
- **Assign to the group** — действие страницы **PICK-UP GROUPING**, которое добавляет выбранный shipment в уже существующую pick-up group.
  - smoke (`pickUpGrouping.js`): после assign shipment виден через `nShipmentsButton` / `nShipments` modal.
- **[MILKRUN] button (grouping page)** — кнопка на странице Grouping, появляется при выборе >1 shipment и открывает Create Milkrun Modal (кейсы 2013/2054).
- **Create Milkrun Modal** — модалка создания milkrun на grouping page; содержит действие **[GROUP]** (после него shipments имеют статус **`grouped`**) (кейс 2014).
- **grouped (status)** — статус shipment на grouping page после выполнения операции **Create Milkrun → [GROUP]** (Qase 2014). Доменная модель/что именно меняется в данных — TBD.
- **MERGE IN A MILKRUN toggle** — toggle, который встречается в сценариях **Crossdock / Transit via** (Qase 4141/4152) и, вероятно, влияет на «мердж» в milkrun.
  - по exported expected results (Qase) toggle находится в **Transit via modal**, где также есть mini shipment card, поле **“Transit via”** и кнопка **[CONFIRM]**.
  - важная деталь: toggle **не отображается**, если выбран только **1 RTB**.
  - кейсы: **4141** (precondition: toggle disabled), **4152** (precondition: toggle enabled).
  - что именно мерджится и как выглядит результат — TBD (нужна вычитка Confluence TD / ручная проверка).
- **Show Milkrun (Admin menu toggle)** — feature toggle, который включает отображение вкладки **Grouping** в sidebar для shipper/carrier (кейс 2004).
  - если toggle выключен, сценарии Create Milkrun via Grouping / pick-up grouping может быть банально некуда запускать из sidebar.
- **Grouped with N other shipment (link)** — текст/ссылка на Tracking tab в Tracking Points block, появляется после операций grouping (departure/arrival/shipment) и показывает, что TP сгруппирован с другими shipments (см. `smokeTest/grouping.js`).


- **FU (Freight Unit)** — ключ/идентификатор freight unit, который можно привязать к cargo через CSW → Add information.
  - В UI (по автотесту) отображается как `FU: <key>` (комментарий в CSW) и `FU - <key>` (в карточках/packing list).
  - Может быть скрыт от carrier в packing list (см. `uiTests/smokeTest/addingFU.js`).

- **blueMilkrunBlock** — UI-блок на Tracking tab, который отмечает, что shipment принадлежит milkrun (см. `uiTests/smokeTest/creatingMilkrun.js`).
- **Milkrun banner / related shipments block** — баннер на shipment card (Tracking tab) с текстом вида: `This shipment belongs to a Milkrun with x steps from 'From' to 'To'. Click here to see full Milkrun`.
  - по клику на **[Click here]** должен открываться **Milkrun monitoring modal** (Qase 924/926).
- **Milkrun monitoring modal** — модальное окно, которое показывает:
  - список **stops/locations + dates** (как на shipment card),
  - список **related shipments + their statuses** (как в центральном меню Booking tab),
  - **map** с маршрутами между всеми точками milkrun (Qase 927/1061).
- **Milkrun steps/stops** — количество точек/перемещений в milkrun; используется в баннере (`x steps`) и в tooltip/list of addresses (Qase 917/918).
  - в monitoring modal stops должны отображаться вместе с **dates**, а не только с адресами (Qase 927).
- **related shipments** — «братья»/связанные shipments внутри milkrun; проявляются в brothers block/modals и в monitoring modal.

## Milkrun monitoring modal
Модальное окно, открывающееся из milkrun banner/related shipments block на shipment card по клику **"Click here"**.

Ожидаемое содержимое (Qase 927):
- locations + dates (stops)
- список related shipments + их statuses
- map с routes

См. также: Qase 924/926/927; 04_USER_FLOWS.md.

## Related shipments block (milkrun banner)
Баннер на shipment card, который сигнализирует, что shipment принадлежит milkrun, и даёт переход в monitoring modal.
Текст из expected result (Qase 924):
`This shipment belongs to a Milkrun with x steps from 'From location' to 'To location'. Click here to see full Milkrun`

## FU keys (Freight Unit keys)
Ключи/идентификаторы Freight Unit (FU), которые могут отображаться под cargos на detail page.
Qase milkrun-stage ориентиры: 1417/1419/1421.
Ограничение для spectator: Qase 1422 (Tracking-only, без доступа к другим табам → keys ожидаемо скрыты).
## Milkrun-stage (термины, которые встречаются в артефактах)

- **Milkrun (related shipments)** — несколько связанных shipments под одним booking/FO; UI: label `Milkrun`, banner `This shipment belongs to a Milkrun...`, monitoring modal.
- **Milkrun monitoring modal** — модалка по клику на banner, показывает stops + related shipments + map routes (Qase **926/927**).
- **FU key (Freight Unit key)** — ключ/маркер под cargo; виден shipper'у, но скрыт от carrier'а (autotest `smokeTest/addingFU.js`); milkrun-specific поведение: Qase **1417/1419/1421/1422**.
