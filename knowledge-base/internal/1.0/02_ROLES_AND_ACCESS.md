# 02_ROLES_AND_ACCESS.md

> Внутренний документ. Цель: фиксировать **роли/персоны** и их границы в TMS.

## 1) Роли (из тестов/терминологии)

### Shipper (Expéditeur)
- Создаёт SR/QR/Shipments через CSW.
- Может auto-confirm (как минимум в тестовом флоу).
- Основной пользователь для milkrun сценариев в автотестах.

**Источники**
- Qase: 1337/1338/1339/1340/1625
- Autotest: `smokeTest/creatingMilkrun.js` (логин как `role.mainShipper`)
- Role impl: `/main-app-automation/src/roles/mainShipper.js` (после логина выполняется `sessionStorage.removeItem('roleSection')`)

**Техническая заметка (из автотестов)**
- Для shipper UI-section определяется через `sessionStorage.roleSection`:
  - shipper: ключ **удаляется** (`removeItem`) → «дефолтный» основной интерфейс.

### Carrier (Transporteur)
- Получает SR/QR.
- Может **confirm / decline** SR и QR (как минимум по тест-кейсам).
- Может выполнять slot booking «со стороны перевозчика».
- По smoke `updateLocation.js` видит изменения Pick-up/Delivery location, которые внёс shipper:
  - обновлённые from/to адреса в booking list и shipment card
  - системные chat messages `Test has updated the Pick-up location.` / `Test has updated the Delivery location.`

**Источники**
- Qase: 1344 Confirm SR (carrier side), 1345 Confirm QR (carrier side), 1619 Decline SR, 4279 Decline QR, 4280 Slot Booking (carrier)
- Autotest: `smokeTest/slotBookingByCarrier.js` (логин как `role.mainCarrier`)
- Autotest: `smokeTest/confirmTP.js` (carrier подтверждает Arrival TP)
- Autotest: `smokeTest/addingFU.js` (carrier **не видит** FU в cargo contents в Booking/Tracking)
- Role impl: `/main-app-automation/src/roles/mainCarrier.js` (после логина выполняется `sessionStorage.setItem('roleSection', 'ops')`)
- Related: `/main-app-automation/src/roles/spectatorCarrier.js` (spectator в ops интерфейсе: `roleSection = ops`)

**Техническая заметка (из автотестов)**
- Для carrier UI-section принудительно ставится `sessionStorage.roleSection = "ops"` (ops interface).

### Admin / Feature toggles (по Qase)
- В тест-каталоге зафиксировано, что доступность **Grouping** в sidebar управляется фиче-тогглом **Show Milkrun** в **Admin menu**.
  - При включении чекбокса *Show Milkrun* вкладка Grouping появляется у **shipper** и у **carrier**.
  - Практический смысл для milkrun-stage: если на стенде нет пункта Grouping в sidebar — первым делом проверить состояние этого toggle.
  - Что дальше можно делать на Grouping page (по Qase): выбрать 2+ shipments → появится кнопка **[MILKRUN]** → откроется Create Milkrun Modal (кейсы 2013/2054).

**Источники**
- Qase: **2004** *Grouping tab in sidebar menu*

### Dock user (док-персона)
- Отдельная роль/персона, логинится в **/dock** (dock интерфейс).
- В smoke автотесте проверяется:
  - URL = `${BASE_URL}/dock`
  - виден блок **dockStatistics**
  - в header отображаются account data (в тесте: `Aaron`, `Bad Habits, Inc.`)

**Источники**
- Autotest: `smokeTest/loginAsDock.js` (role: `role.dockUser`)
- Role impl: `/main-app-automation/src/roles/dockUser.js` (после логина выполняется `sessionStorage.setItem('roleSection', 'dock')`)

**Техническая заметка (из автотестов)**
- Для dock interface используется `sessionStorage.roleSection = "dock"` + отдельный UI по URL `/dock`.

### Multi-account
- Переключение аккаунтов (не углубляемся, фиксируем как роль-персона).

**Источники**
- Qase: 1336 Login as multi-account

### Spectator (ограниченный доступ)
- Назначается на этапе CSW step1 (dropdown **Spectators**) при создании shipment.
- Milkrun-stage важный open question: видит ли spectator **milkrun banner / monitoring modal / blue milkrun block** и **FU keys** (см. Qase bug-case 1447 + Qase 1422 про keys).
- В milkrun/multi-PS сценариях (CSW с несколькими pre-shipment) в Qase есть явная функциональность spectator **на уровне pre-shipment (PS)**:
  - **1430** — поле Spectators отображается **на каждом pre-shipment**
  - **1431** — dropdown со списком spectators открывается и можно выбрать
  - Практический вывод для KB: spectator assignment существует не только на уровне shipment целиком, но и как минимум задуман на уровне каждого PS; это важно для milkrun, потому что один booking может разветвляться в несколько brothers shipment-ов.
  - Статус: в экспортированном JSON это только expected results → нужно руками подтвердить на стенде milkrun и после этого закрепить в матрице доступа.
- После создания shipment:
  - у основного аккаунта (shipper) на Tracking tab виден blue block вида:
    - `This shipment tracking is shared with <spectator account name>`
  - у spectator в Tracking tab виден блок вида:
    - `This shipment tracking is shared by <main shipper account name>`
- По тест-кейсам spectator имеет доступ **только к Tracking tab**.

**Источники**
- Qase: 4164 Spectator (expected: shipment появляется в tracking list spectator; spectator имеет доступ только к Tracking tab; blue blocks on both sides)
- Доп. кейсы (вынести детали позже): **1754** Tracking tab of shipment from spectator's side; **1755** Tooltip in the tracking list from spectator's side
  - смежные/углубляющие кейсы (пока не вычитаны):
    - 1128 — Spectator followers block
    - 1442 — MULTICONTAINERS: Spectator access to brothers
    - 1422 — FU: keys are not displayed from spectators (важно для milkrun/FTL stage)
      - verbatim expected result (Qase 1422): `Detailed page is opened and no possibility to switch tabs except TP from spectators` (т.е. spectator по сути Tracking-only)
- Autotest: `smokeTest/addingSpectator.js` (ожидаемый текст в `blueSpectatorBlock.textContent`: ` This shipment tracking is shared with Shipper ` — обратите внимание на пробелы по краям строки)
- Role impl: `/main-app-automation/src/roles/spectator.js` (после логина выполняется `sessionStorage.removeItem('roleSection')` → по механике UI-section spectator совпадает с shipper-дефолтом, но права отличаются по ACL)

### Booker (служебная персона для создания shipments)
- Используется в автотестах как отдельный аккаунт, который **создаёт shipment** с pick-up/delivery привязанными к PML/ML.
- По смыслу: «тот, кто бронирует/создаёт», чтобы затем другой пользователь увидел shipment через Public Master Location.

**Источники**
- Autotest: `smokeTest/publicMasterLocationUser.js` (логин как `role.booker`)

### Public Master Location (PML) user (ограниченный доступ)
- Владелец Master Location видит shipments, где его ML указан как pick-up/delivery location (созданные другим аккаунтом).
- Доступ **только к Tracking tab** (Booking/Invoicing tabs отсутствуют).

**Как воспроизвести (по автотесту)**
- Part 1 (создание): логин `role.booker` → создать shipment с **pick-up location = TestLocation** + zone `ZONE FOR AUTOMATION` → Direct booking → Auto-confirm.
- Part 2 (проверка доступов): логин `role.mainShipper` → TRACKING list → открыть shipment по имени →
  - Tracking tab ✅
  - Booking tab ❌
  - Invoicing tab ❌

**Источники**
- Qase: 4165 Public Master Location (PML) user
- Autotest: `smokeTest/publicMasterLocationUser.js`

## 2) Матрица доступа (черновая, по фактам из тест-кейсов)

| Возможность | Shipper | Carrier | Spectator/PML user |
|---|---:|---:|---:|
| Логин | ✅ | ✅ | ✅ (Spectator: подтверждено автотестом) |
| Создать SR/QR/Draft/RTB | ✅ | ❌ | ❌ |
| Confirm SR/QR | ✅ (auto-confirm) | ✅ (manual confirm) | ❌ |
| Decline SR/QR | ? | ✅ | ❌ |
| Доступ к Shipment tabs | ✅ (Booking/Tracking/Invoicing/Claims) | ✅ (как минимум Tracking/Booking по кейсам) | ✅ **только Tracking** (Spectator: подтверждено автотестом; PML: по Qase) |
| Replan/Confirm TP | ✅/✅ (по кейсам) | ✅/✅ (по кейсам) | ❌ |
| Slot booking | ✅ (DELIVERY slot) | ✅ (PICK-UP slot) | ❌ |
| Просмотр FU (Freight Unit) в packing list | ✅ (видит FU label в CSW step2 + Booking/Tracking cargo contents) | ❌ (в smoke FU скрыт у carrier в Booking/Tracking cargo contents) | ❌? (по Qase 1422 spectator Tracking-only; FU keys ожидаемо скрыты) |
| Grouping page / Create Milkrun via Grouping | ✅? (при включённом Show Milkrun, Qase 2004/2013/2054/2014) | ✅? (Qase 2004 говорит, что вкладка Grouping появляется и у carrier; отдельного smoke автотеста на carrier-side grouping пока нет) | ❌ / TBD |
| Pick-up grouping page / assign shipments to group | ✅ (smoke `pickUpGrouping.js`) | ? | ❌ / TBD |
| Milkrun banner / blueMilkrunBlock | ✅ (smoke `creatingMilkrun.js`) | ? | ❌? / TBD (Qase 1447 expected: block hidden on spectator side) |
| Видит chat/system messages после Update location | ✅ | ✅ (smoke `updateLocation.js`) | ❌ / TBD |

Заметки:
- Для Spectator/PML user нужны отдельные прогоны/вычитка из Confluence TD space (в Qase есть детальные кейсы).

## 3) Важные UI-ограничения (гипотезы для верификации)
- «Ограничения для Tracking tab» присутствуют в тест-наборе (есть соответствующие кейсы), но требуется конкретизация прав по ролям и статусам.

## 4) Тестовые аккаунты/персоны (из автотестов)
> Полезно для дебага: это **не** полный список ролей системы, а только то, что явно используется в UI autotests.

- `role.mainShipper` — основной shipper (см. большинство smoke).
- `role.mainCarrier` — основной carrier (confirm TP, slot booking carrier-side и т.п.).
- `role.spectator` — spectator account (Tracking-only доступ, blue blocks).
- `role.spectatorCarrier` — spectator user в carrier UI-section (`roleSection = ops`) — встречается в uiTests (например, followerList) и может быть полезен для проверки «spectator-from-carrier-side» поведения.
- `role.booker` — аккаунт, создающий shipment для последующей проверки видимости у PML user.

Источник: `/main-app-automation/src/tests/uiTests` (по импортам `role.*` в smoke тестах).

Дополнительно по Milkrun/Spectator (по Qase-экспорту):
- Qase **1447**: **"Blue milkrun block isn't hidden on the spectator's side"**.
  - Важно: в exported expected result указано: **`Milkrun block is hidden on the tracking tab of spectator's side`**.
  - Фиксируем как **ambiguity/bug naming mismatch**: по названию кейса ожидается, что блок *не скрыт*, но expected result говорит, что *скрыт*.
  - На стенде (milkrun stage) нужно руками проверить, видит ли spectator:
    - **blueMilkrunBlock** на Tracking tab
    - milkrun banner на shipment card ("This shipment belongs to a Milkrun...")
    - monitoring modal по клику
  - После верификации — обновить матрицу доступа и, при необходимости, завести баг/уточнить спецификацию (и поправить формулировку кейса/ожиданий в Qase/Confluence).

Дополнение (смежное ожидание по Qase **1422**): spectator открывает detail page, но **нет возможности переключать вкладки кроме TP** (Tracking-only) — это косвенно подтверждает, что milkrun UI/keys могут быть скрыты от spectator (проверить на стенде).

## Дополнение (milkrun stage): Spectator vs Milkrun
- Qase кейс-ориентиры:
  - **4164** Spectator: shipment отображается в tracking list spectator; spectator имеет доступ только к Tracking tab; blue blocks на обеих сторонах.
  - **1422** FU - keys are not displayed from spectators (ожидание из экспорта): `Detailed page is opened and no possibility to switch tabs except TP from spectators`.
  - Milkrun monitoring UI: 916-918, 924-927, 1055, 1061 (нужно сверить, какие из элементов видимы spectator).
- Multicontainers: spectator access to brothers (Qase **1442**, expected: `Shipment for each container is displayed on the tracking list and have own ID`) — уточнить, появляется ли у spectator brothers modal и/или отдельные shipment entries per container.
- Autotest-ориентиры:
  - `uiTests/smokeTest/addingSpectator.js` (проверяет Tracking-only доступ)
  - `uiTests/smokeTest/creatingMilkrun.js` (проверяет наличие milkrun blue block на Tracking tab)
## Milkrun-stage: роли/видимость (черновик для уточнения)

- **Shipper**: полный доступ к Booking/Tracking/Invoicing (база — smoke автотесты).
- **Carrier**: полный доступ к своим shipments; при этом **FU keys скрыты** (см. autotest `smokeTest/addingFU.js`).
- **Spectator / PML user**: доступ **только Tracking** (см. autotest `smokeTest/addingSpectator.js` + `smokeTest/publicMasterLocationUser.js`).

Milkrun-specific backlog (нужно подтвердить по TD Confluence + руками на /milkrun):
- Spectator: видимость **milkrun block / banner** (Qase **1447**).
- Spectator: **FU keys not displayed** (Qase **1422**).

Suite paths (Qase export):
- 1447 → `Main app / Freight Orders & Freight Units / Freight Orders / Bugs`
- 1422 → `Main app / Freight Orders & Freight Units / Freight Units`
