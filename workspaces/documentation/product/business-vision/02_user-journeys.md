---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631930929
source_type: confluence
---
# User Journeys — Сценарии использования

Три основных сценария, покрывающих 90% работы в системе.

---

## Journey 1: Стандартная перевозка (SR — Shipment Request)

**Участники:** Shipper + Carrier
**Когда используется:** Shipper уже знает, кого хочет нанять. Один перевозчик, прямое бронирование.

```
[Shipper] Создаёт заявку в CSW wizard (8 шагов)
          ↓ выбирает 1 перевозчика → SR создан
          ↓ status: pending

[Carrier] Получает email: "Новая заявка на перевозку"
          ↓ открывает ссылку → страница SR
          ↓ изучает параметры груза, маршрут, даты

[Carrier] Подтверждает бронирование
          ↓ status: confirmed
          ↓ Shipment автоматически создаётся

[Carrier] Приезжает за грузом в назначенное время
          ↓ подтверждает TrackingPoint "departure" (через UI или Driver App)
          ↓ Shipment.status → in_transit
          ↓ Shipper получает уведомление

[Carrier] Доставляет груз получателю
          ↓ подтверждает TrackingPoint "arrival"
          ↓ Shipment.status → delivered

[Shipper] Видит статус "Доставлено"
          ↓ скачивает CMR / проверяет POD

[Carrier] Выставляет Pre-Invoice с фактической стоимостью
          ↓ Shipper верифицирует
          ↓ Invoice финализируется
```

**Длительность типичного цикла:** 1–14 дней (от создания заявки до инвойса)

---

## Journey 2: Тендер на перевозку (QR — Quote Request)

**Участники:** Shipper + 2–10 Carrier'ов
**Когда используется:** Shipper хочет получить лучшую цену или не знает точно, кто выполнит.

```
[Shipper] Создаёт QR в CSW wizard
          ↓ выбирает 3 перевозчиков + устанавливает deadline ответа
          ↓ QuoteRequest создаётся, status: pending_quotes

[Carrier A, B, C] Получают email с параметрами груза
          ↓ каждый видит маршрут, вес, даты, но НЕ видит чужие цены

[Carrier A] → отвечает: 1 200 EUR, доставка за 3 дня
[Carrier B] → отвечает: 980 EUR, доставка за 4 дня
[Carrier C] → не отвечает до deadline

[Shipper] Видит таблицу котировок с ценами и условиями
          ↓ сравнивает, выбирает Carrier B (980 EUR)

[Система] Shipment создаётся с Carrier B
          ↓ Carrier A, C получают email: "Котировка отклонена"

[Carrier B] Продолжает как в Journey 1: трекинг → инвойс
```

**Когда QR теряет смысл:** Если Carrier не ответил до deadline — QR истекает, Shipper создаёт новый или переходит к SR.

---

## Journey 3: Milkrun (один маршрут, несколько отправлений)

**Участники:** Shipper + Carrier
**Когда используется:** Carrier едет по одному маршруту и забирает груз в нескольких точках, либо развозит несколько отправлений.

**Вариант A — Создание через CSW:**
```
[Shipper] Создаёт заявку с несколькими pre-shipments
          ↓ второй pre-shipment совпадает по локации или дате с первым
          ↓ система определяет как Milkrun автоматически

[Carrier] Получает один маршрут с несколькими точками забора/доставки
          ↓ подтверждает TrackingPoint по каждой точке маршрута
```

**Вариант B — Группировка существующих Shipment'ов:**
```
[Shipper] Открывает страницу группировки (/pick-up-grouping)
          ↓ видит Shipment'ы, которые можно объединить
          ↓ нажимает [MILKRUN] → выбирает Shipment'ы для объединения
          ↓ Milkrun создаётся как связка нескольких Shipment'ов
```

**Условие Milkrun:** второй pre-shipment должен совпадать по pick-up или delivery location и дате с предыдущим.

---

## Journey 4: Водитель обновляет трекинг (Driver App)

**Участники:** Carrier + Driver
**Когда используется:** Когда нужно обновить трекинг с мобильного устройства прямо на месте.

```
[Carrier] Назначает водителя на Shipment
          ↓ Driver получает уведомление в Driver App

[Driver] Открывает приложение
         ↓ видит список назначенных рейсов

[Driver] На месте забора груза:
         ↓ нажимает "Confirm pick-up"
         ↓ (опционально) фотографирует CMR-документ

[Driver] На месте доставки:
         ↓ нажимает "Confirm delivery"
         ↓ фотографирует подпись получателя / CMR

[Система] TrackingPoints обновляются, Shipment.status пересчитывается
          ↓ Shipper получает push/email уведомление
```

---

## Journey 5: Управление слотами (Operator)

**Участники:** Carrier + Operator (Dock Manager)
**Когда используется:** Когда нужно зарезервировать временное окно на складе.

```
[Carrier] Планирует приехать на склад Shipper'а
          ↓ бронирует слот в системе → выбирает дату, время, склад
          ↓ Slot создаётся, status: pending

[Operator] Получает уведомление о новом запросе
           ↓ открывает Slotify (календарный вид)
           ↓ видит занятость ворот на неделю

[Operator] Подтверждает слот или предлагает другое время
           ↓ Slot.status → confirmed
           ↓ Carrier получает подтверждение

[Carrier] Приезжает в зарезервированное окно
          ↓ после операции: TrackingPoint подтверждается
          ↓ Slot.status → done
```

---

## 🔗 Граф-метаданные
- **id:** `business-vision.02_user-journeys`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631930929 · **repo:** `business-vision/02_user-journeys.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

