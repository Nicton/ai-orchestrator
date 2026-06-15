---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629375031
source_type: confluence
---
# Products & Cargo Types — каталог товаров и типы груза

> Сверено с кодом 2026-06-13 | `models/product.js`, `product_category.js`, `dict_shipment_request_content_types.js`, `services/products.js`, routes `products.js`, frontend `products`, `dicts`

## Зачем (бизнес-контекст)

Шиппер возит конкретные товары — у каждого вес, HS-код, цена, инструкции перевозчику. **Product** — каталог этих товаров, чтобы не вводить их параметры каждый раз и переиспользовать в заказах/таможне. **Cargo Type** (content type) — физическая форма груза (палета/контейнер/коробка) с размерами и режимами. Вместе они дают: быстрое заполнение CSW, корректную таможню (HS-код из продукта), правильный расчёт (тип груза → производительность зоны/рейтшит).

## Как устроено (код)

| Сущность | Модель | Ключевое |
|----------|--------|----------|
| Продукт | `product.js` | code, name, category, unit, **hs_code**, cost, sales_price, weight, carrier_instructions, supplier_code/name, is_active |
| Категория | `product_category.js` | account-specific, пользовательская |
| Единица | `product_unit.js` | глобальный справочник |
| Тип груза | `dict_shipment_request_content_types.js` | name, размеры, **is_container/is_pallet/is_stackable**, режимы for_air/road/sea…, iso_container_type, **cargo_group_id**, account/galaxy-specific |

Сервис: listProducts (с unit+category), createProductByInput (создаёт продукт или категорию в транзакции), findAllowedProduct.

## Где найти и настроить (UI)

| Что | Роут |
|-----|------|
| Каталог продуктов | `/products` (ProductsCtrl) |
| Создать/редактировать | `/products/add`, `/products/{id}/edit` |
| Типы груза (справочник) | `/dicts` (list-content-types) |

API: `GET/POST/PATCH /products[/:id]`, `/products/units`, `/products/categories`. Типы груза ведутся в Back-Office (см. [Cargo & DGD](../../dock/feature-docs/cargo-dgd/README.md)); cargo_group привязывает тип к группам зон DOCK.

## Сценарии

1. **Каталог для заказов**: завести продукты (HS-код, вес) → в заказе/таможне они подставляются по коду.
2. **Тип груза для зоны**: тип с cargo_group → зона DOCK принимает группу → производительность per_hour определяет длительность слота.
3. **Контейнерный груз**: тип is_container=true + iso_container_type → включает Multi-Container логику.

---

## 🔗 Граф-метаданные
- **id:** `tms.master-data.products`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629375031 · **repo:** `tms/master-data/products.md`
- **code_refs:** `backend/app/models/{product,product_category,product_unit,dict_shipment_request_content_types}.js`, `services/products.js`, `routes/api/products.js`, `frontend/public/app/{products,dicts}`
- **modules:** TMS, DOCK (cargo groups), Back-Office (dictionaries)
- **references:** `dock.cargo-dgd`, `tms.customs`, `tms.features.multi-container`
- **requirements:** нет — реализовано без требований
