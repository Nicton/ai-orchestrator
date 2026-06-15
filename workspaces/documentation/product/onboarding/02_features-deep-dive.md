---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632324161
source_type: confluence
---
# Часть 2 — Дополнительный функционал Main App

> Источник: видео Part 2 (QA-инженер Ярик).

---

## Orders (Заказы)

> "Сам бизнес-логику этого функционала не до конца понимаю. По секрету сказать — мало кто её понимает."

- Создание **Order** → создание **Lines** (строк заказа)
- Из Lines можно создать Shipment (попадаешь в CSW)
- Только для определённых клиентов (не массовая функция)

---

## Freight Order (FO) / Milkrun

**Freight Order** = несколько точек забора/доставки на одном маршруте.

**Аналогия Milkrun:**
> "Грузовик развозит молоко: выезжает из одной точки, по пути собирает бутылки у нескольких домов. Или наоборот — развозит из одной в несколько."

**Как создать FO в CSW:**
1. Заполнить обычные поля
2. Нажать **"Add another Delivery/Picking Point"** → открывается ещё одна форма
3. Если выбрать тот же Pickup локейшн — автоматически подставляется дата/время
4. Добавить другой Delivery локейшн
5. Создать букинг → это и есть **Freight Order** (в нашей логике)

---

## Freight Units (FU)

FU = ключ для отслеживания груза внутри Freight Order.

**Проблема:** один груз может двигаться по нескольким шипментам FO (например, забрали 3 ящика, 1 выгрузили, 2 поехали дальше).

**Решение:** поле **Freight Unit** с ключом. Создаёт связь между грузом и Freight Order.

**Страница Freight Units:**
- Список всех FU ключей
- Открыть FU → видно связанные Shipments и Tracking Points

---

## Grouping (Группировка)

Страница `/grouping` — все Shipments начиная с сегодня (не прошедшие).

**Кнопки группировки (зависят от совпадения локейшенов):**
| Совпадение | Кнопка |
|-----------|--------|
| Совпадают оба (Pickup + Delivery) | Group Shipments |
| Только Pickup | Group by Pickup |
| Только Delivery | Group by Delivery |

**После группировки:**
- Shipments объединяются в один общий Tracking Point
- Если оба локейшена — нужно выбрать общее время для pickup и delivery
- В букинге появляется подпись: "Сгруппирован ещё с X шипментами"

---

## Tracking List

Страница со всеми **подтверждёнными** Shipments (только SH, не SR).

---

## My Site

Страница: только Shipments связанные с **моим Master Location** (ML).

Предпосылка:
- В Address Book есть адреса с меткой **Master** — это Master Location
- Если создать Booking с этим ML → Shipment появляется на My Site

---

## Master Location (ML) — Настройки

Открыть карточку ML в Address Book → страница настроек:

```
Master Location
  └── Zones (зоны)
        └── Docks (доки)
              └── Dock Doors (двери)
```

**Настройки зоны:**
- Разрешённый Cargo
- Дни работы
- Настройки слотов

**При создании букинга на ML:**
- После выбора ML → предлагают выбрать **Зону**
- Отображаются доступные **слоты** (занятые по времени закрыты)

---

## Planning

Страница Planning — Shipments на **Master Location** (прибывающие/убывающие).

**Вкладки:**
| Вкладка | Вид |
|---------|-----|
| Board | Карточки |
| Day | Конкретный день + слоты |
| Week | Вся неделя — видно %, насколько занято |

**Фильтры:** Зоны, Carriers, Locations, Modes.

На **Week** tab: видно загрузку — "100% = слот полностью занят, нельзя добавить ещё".

---

## Invoicing List, Claims List

Просто листинги со своими фильтрами:
- **Invoicing** — Shipments с доступным инвойсингом, прайсами, статусами
- **Claims** — все претензии

---

## Multivision

**Предпосылка:** Multi-Account пользователи имеют доступ к нескольким аккаунтам.

**Multivision** = единый дашборд для всех доступных аккаунтов → все Shipments со всех аккаунтов на одном экране.

---

## Doc Center

Страница `/doc-center`:
- Список всех **Attachments**, прикреплённых к букингам
- Удобно для поиска нужного документа по всем шипментам

---

## Book & Slot (Carrier side)

Carrier тоже может создавать Shipments — через кнопку **Book & Slot**:
- Выбирается **Master Location** (обязательно, только ML доступны)
- Выбирается **Cargo** (только доступный для этого ML)
- Выбирается **Slot**
- Указывается **имя Shipper** (от чьего имени)

Тот же функционал добавлен и для Shipper — через **Slot Booking** в +BOOK.

---

## Настройки Settings

| Страница | Что содержит |
|---------|-------------|
| My Teams | Пользователи моего аккаунта |
| Carrier Contacts | Пользователи из аккаунтов Carriers (юзеры) |
| Carriers Per Mode | Аккаунты Carriers с которыми работаю |
| Address Book | Адреса (локейшены) |
| Attachment Types | Доступные типы вложений |
| Cargo Types | Доступные типы груза (активация из общего списка) |
| Metadata | Доступные метаданные |
| Tags | Теги для букингов |
| Entities | Юридические лица (для инвойсинга) |
| Goods Types | Дополнительные параметры груза (Fragile, Dangerous...) |
| Custom Currency | Доступные валюты |
| Services | Сервисы Carrier (Fast, Cheap — при Air/Sea) |
| Advanced Transport Plan | Сложная таблица маршрутов (редко используется) |
| Rate Sheets | Загрузка XL с прайсами для автоматического расчёта |

**Rate Sheets:** загружается Excel → при создании букинга на шаге 2 CSW автоматически рассчитывается цена для Carrier на основе параметров груза.

---

## Followers (Фолловеры)

При любом действии (сообщение в чате, metadata, attachment, confirm TP, update cargo/location) —
нужно выбрать кого уведомить (Followers).

Уведомления приходят:
- На почту
- В колокольчик (Notifications)
- В сайдбар

Управление: в чате список Followers можно убирать/добавлять.

---

## Spectators (Спектаторы)

Аккаунт с доступом только на **просмотр Shipment** (только вкладка Tracking, без Booking/Invoicing).

**Добавление:**
1. В CSW есть поле **Spectators**
2. Выбрать аккаунт из списка (предварительно добавленного в Settings → Spectators)
3. После Confirm → Spectator видит Shipment

**Что может Spectator:** только наблюдать + Confirm Tracking Points.

---

## Bookers

Аккаунт с правом **создавать Bookings** из шаблонов (Templates).

**Добавление:**
1. В Template есть поле **Booker**
2. Выбрать аккаунт Booker
3. Booker видит этот Template → может создать из него Booking

**Результат:** Booker видит только вкладку Booking (без Tracking/Invoicing). Основной аккаунт видит Booking созданный Booker.

---

## PML (Public Master Location)

Обычный ML с галочкой **"Visible by the Community"**.

**Что это означает:**
- Другие пользователи могут найти этот ML в поиске при создании Booking
- Когда они создают и подтверждают Booking на этот ML — владелец PML автоматически получает доступ к Tracking вкладке

**PML User** = пользователь, чей ML является публичным и виден другим.

---

## Invites (Приглашения)

Через +BOOK или страницу Settings → несколько кнопок Invite:

| Кнопка | Что делает |
|--------|-----------|
| Colleague | Приглашение в мой аккаунт (через My Team) |
| Carrier | Новый/существующий Carrier (через Carrier Contacts) |
| Customer/Supplier | Создание связи для Spectators/Bookers |
| Another Shipper | Ещё одна компания-Shipper |
| Subsidiary | Дочерняя компания |

Процесс: email → получатель кликает на ссылку → создаёт пароль → создаётся пользователь.

---

## 🔗 Граф-метаданные
- **id:** `onboarding.02_features-deep-dive`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 632324161 · **repo:** `onboarding/02_features-deep-dive.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

