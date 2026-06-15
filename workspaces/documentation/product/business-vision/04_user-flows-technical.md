---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632815617
source_type: confluence
---
# User Flows — Технические детали (с именами UI элементов)

Детальные пользовательские флоу с реальными именами кнопок, элементов и тестовых данных. Извлечено из автотестов и старой внутренней документации.

> Источник: Confluence 04_USER_FLOWS + автотесты main-app-automation

---

## 1. Создание Milkrun (Shipper, Happy Path)

**Источник:** `smokeTest/creatingMilkrun.js` | **Qase:** 1625

```
1. Login как Shipper (role.mainShipper)
2. Sidebar → +BOOK → Mode: ROAD → Type: Spot purchase
3. CSW Step 1 (Pre-shipment 1):
   - Shipment name: "Milkrun test [automation]"
   - ⚠️ Alert: nShipmentsAlreadyExistAlert (неблокирующее предупреждение)
   - Cargo: Box 60×30×30 (qty +1)
   - Pick-up: Albuquerque, Today 10:00
   - Delivery #1: Eiffel Tower, Today 18:00
4. Нажать: addAnotherDeliveryPickingPointButton
5. CSW Step 1 (Pre-shipment 2):
   - Cargo: Box 60×40×40 (qty +1)
   - Pick-up: Albuquerque (тот же!)  ← КЛЮЧЕВОЕ УСЛОВИЕ MILKRUN
   - Delivery #2: AnotherLocation, Today 20:00
6. Нажать: DIRECT BOOKING
7. CSW Step 2:
   - Выбрать: Green Carrier
   - Нажать: SEND BOOKING
8. Booking Tab → AUTO-CONFIRM BOOKING (autoConfirmButton)
9. Проверки:
   - shipmentBrothersBlock: "2 Shipments"
   - brothersModal: 2 связанных shipment
   - Tracking Tab → blueMilkrunBlock: виден
```

**Условие Milkrun (Qase 1625):** второй pre-shipment должен иметь совпадающую локацию pick-up ИЛИ delivery (или обе) И дату с предыдущим pre-shipment.

---

## 2. Milkrun с расчётом Rate Sheet

**Источник:** `rateSheets/usualRateSheets/countMilkrunRateSheet.js`

```
Cargo: Palette 60×80
PU: AnotherLocation, Today 08:00
DEL #1: Albuquerque, Today 18:00
DEL #2: Albuquerque, Today 18:00

CSW Step 2:
  rateSheetPrice = 10,000  (vs стандарт 8,500)
  
Booking Tab:
  carrierPrice = 10,000
  appliedRateSheet = "MILKRUN [Automation]"
  
Invoicing Tab:
  validatedCost/agreedCost = 10,000.00
```

**Правило расчёта:** Число DISTINCT PU или DEL локаций - 2 = индекс в левом столбце таблицы Rate Sheet.

---

## 3. Обновление локации PU/DEL

**Источник:** `smokeTest/updateLocation.js`

```
1. Создать перевозку: PU=Albuquerque 11:00, DEL=Eiffel Tower 23:00
2. Booking Tab → Shipment card
   - Адрес: "Breaking Bad | Albuquerque"
3. Нажать: updatePickUpLocationButton
   - Модал: updatePickUpLocationModal
   - Новая локация: AnotherLocation, Today 11:00
   - Confirm
   - Чат: "Test has updated the Pick-up location"
4. Booking list:
   - firstLineFromAddress = AnotherLocation
5. Нажать: updateDeliveryLocationButton
   - Модал: updateDeliveryLocationModal
   - Новая локация: ChangedLocation, Today 23:00
   - Confirm
   - Чат: "Test has updated the Delivery location"
6. Booking list:
   - firstLineToAddress = ChangedLocation

Carrier side:
  - Видит обновлённые локации в booking list
  - Видит оба сообщения в чате
```

**Побочный эффект:** может триггерить перегенерацию Transport Order PDF (см. `smokeTest/regenerationPDF.js`).

---

## 4. Бронирование слота (Shipper, Delivery)

**Источник:** `smokeTest/slotBookingByShipper.js`

```
1. Login как Shipper
2. +BOOK → SLOT BOOKING
3. Шаги:
   a. Выбор локации
   b. Выбор Orders Zone
   c. Packing list
   d. Выбор тайм-слота
   e. Выбор перевозчика
   f. Confirm
```

---

## 5. Подтверждение Tracking Point (Shipper + Carrier)

**Источник:** `smokeTest/confirmTP.js`

```
Shipper:
  Hover over TP → "Show actions" → Confirm Departure
  Чат: "Loading at [location] has been confirmed by [user]"
  После: кнопки Confirm/Replan исчезают

Carrier:
  То же для Arrival TP
```

---

## Индикаторы Milkrun (Tracking list, Qase 916-927)

| Qase | Элемент | Поведение |
|------|---------|----------|
| 916 | Текст "Milkrun" | Вместо локации (если совпадает с другими братьями) |
| 917 | Список адресов | Ниже "Milkrun" — все адреса маршрута |
| 918 | Синий кружок | Перед "Milkrun"; hover = тултип с локацией + время |
| 925 | +n индикатор | После локации — количество связанных shipments |
| 924-927 | Monitoring Modal | Клик "Click here" на баннере → модал с картой |

### Текст баннера (Qase 1055/1061):
> "This shipment belongs to a Milkrun with X steps from '[From]' to '[To]'. Click here to see full Milkrun"

---

## UI Elements Dictionary

| Имя элемента | Тип | Назначение |
|-------------|-----|-----------|
| `nShipmentsAlreadyExistAlert` | Alert | Предупреждение о похожих заявках |
| `addAnotherDeliveryPickingPointButton` | Button | Второй pre-shipment в CSW |
| `shipmentBrothersBlock` | Block | "2 Shipments" для Milkrun |
| `brothers.brothersModal` | Modal | Список связанных shipments |
| `blueMilkrunBlock` | Visual | Milkrun индикатор на Tracking tab |
| `updatePickUpLocationButton` | Button | Обновить PU локацию |
| `updatePickUpLocationModal` | Modal | Форма обновления PU |
| `updateDeliveryLocationButton` | Button | Обновить DEL локацию |
| `updateDeliveryLocationModal` | Modal | Форма обновления DEL |
| `contentFromTheBookingLevelZone` | Zone | PL на уровне Booking |
| `rateSheetPrice` | Field | Рассчитанная цена Rate Sheet |
| `appliedRateSheet` | Field | Название применённого RS |
| `carrierPrice` | Field | Финальная цена перевозчика |
| `autoConfirmButton` | Button | AUTO-CONFIRM BOOKING |
| `firstLineFromAddress` | Field | PU адрес в booking list |
| `firstLineToAddress` | Field | DEL адрес в booking list |
| `dockStatistics` | Block | Статистика для Dock интерфейса |
| `groupedPickUpModal` | Modal | Группировка pick-up точек |
| `groupedDeliveryModal` | Modal | Группировка delivery точек |
| `groupDepartureButton` | Button | Создать группу отправки |
| `assignToTheGroupButton` | Button | Добавить shipment в группу |

---

## Технические детали ролей (sessionStorage)

| Роль | sessionStorage.roleSection | Интерфейс |
|------|--------------------------|-----------|
| Shipper | `removeItem('roleSection')` | Основной TMS |
| Carrier | `setItem('roleSection', 'ops')` | Ops интерфейс |
| Spectator | `removeItem('roleSection')` | Только Tracking |
| Dock User | `setItem('roleSection', 'dock')` | /dock интерфейс |

Файлы ролей: `/main-app-automation/src/roles/{mainShipper,mainCarrier,spectator,dockUser}.js`

---

## 🔗 Граф-метаданные
- **id:** `business-vision.04_user-flows-technical`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632815617 · **repo:** `business-vision/04_user-flows-technical.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

