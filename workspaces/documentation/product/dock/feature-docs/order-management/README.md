---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631308370
source_type: confluence
---
# Order Management — модуль заказов склада

> Сверено с кодом 2026-06-12 | `models/order.js`, `order_product.js`, `order_tag.js`, `account-order-tag.js`, `services/orders/`, `controllers/api/orders.js`

## Зачем (бизнес-контекст)

Заказ — обещание поставки между покупателем и продавцом; склад планирует под него вместимость. Модуль Order Management — полный жизненный цикл этого обещания: создать (вручную / CSV / API), вести строки, двигать окна дат, связывать со слотами и закрывать фактом. Отличие от листинга **/dock-orders**: листинг — операционное окно «что с заказами в контексте погрузки» (зоны, визиты, статусы); Order Management — CRUD-ядро самой сущности.

## Состав

| Элемент | Что хранит |
|---------|-----------|
| `orders` | Заказ: направление INBOUND/OUTBOUND, окна shipping/arrival (date+time from/to), buyer/seller partner (multi-client), статус |
| `order_products` | Строки заказа (товар, количество) — единица назначения на слот |
| `slots_orders` | Связь строк со слотами |
| Parser (`services/orders/parser/`) | CSV/Excel импорт: dataValidator (структура) → dataParser (создание) |

Статусы и их механика (PENDING → ASSIGNED → DELIVERED, авто-MISSING_SLOT по дедлайну, CANCELLED) — подробно в [Dock Orders](../dock-orders/README.md#статусы-dock-order-механика-и-акторы-сверено-с-кодом-2026-06-12).

## Order Tags — теги заказов

Трёхуровневая модель: `order_tags` (связь) → `account_order_tags` (тег аккаунта: **имя, цвет, описание**) → `order_tag_types` (типология). Зачем: у каждого склада своя операционная разметка («приоритет», «холод», «ревизия») — теги дают её без доработок кода; используются в фильтрах листингов (`services/orders/query.js`). Влияние: тег ставит оператор/импорт; цвет виден в списках — мгновенная визуальная сортировка смены.

## Права

`accessOrders()` — просмотр (флаг `can_manage_orders` на Shipper + ACL `t_order*`); `accessModifyOrders()` — правки; multi-client видимость через `sharedOrdersAccountIds`.

## Где найти и как настроить (UI)

**Путь:** меню → **Orders / Dock Orders** (`/dock-orders` — листинг заказов площадки). Права: `accessOrders()` (просмотр), `accessModifyOrders()` (правки).

**Действия на экране:**
- **Создать заказ**: вручную (форма) или **импорт CSV** (кнопка Upload, Management-вкладка локации) — см. [CSV Uploads](../csv-uploads/README.md).
- **Правка окон дат**: `PATCH /dock-orders/:id/dates` — изменить shipping/arrival window (убирает MISSING_SLOT).
- **Фильтры**: зона, статус, окно дат, партнёр (buyer для inbound / seller для outbound).
- **Назначить слот**: из заказа забронировать/привязать слот (переводит PENDING→ASSIGNED).

**Order Tags:** создаются в настройках аккаунта (тег = имя+цвет+тип), навешиваются на заказ в его карточке; используются в фильтрах листинга.

## Сценарии

1. **План недели из Excel**: оператор выгружает заказы клиента → CSV-импорт (схема v2 buyer/seller) → заказы в статусе PENDING → поставщики бронируют слоты через Slotify (→ ASSIGNED).
2. **Контроль срывов**: фильтр по статусу MISSING_SLOT → «горящие» заказы без слота → оператор звонит поставщику / двигает окно дат.
3. **Мультиклиентский склад**: фильтр по партнёру → видеть только заказы конкретного клиента (3PL-сценарий).

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.order-management`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 631308370 · **repo:** `dock/feature-docs/order-management/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

