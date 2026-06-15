---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632422531
source_type: confluence
---
# Database — PostgreSQL

PostgreSQL 16.4, ~466 таблиц, ORM Sequelize v3.35.1.

## Файлы

| Файл | Содержимое |
|------|-----------|
| [er-model.md](er-model.md) | ER-диаграмма ключевых моделей (Mermaid) |
| [lifecycle-diagrams.md](lifecycle-diagrams.md) | Диаграммы состояний и жизненного цикла моделей |

## Ключевые группы таблиц

| Группа | Таблицы | Описание |
|--------|---------|---------|
| Аккаунты | `accounts`, `users`, `shippers`, `carriers` | Мультиарендность |
| ACL | `shipper_acls`, `carrier_acls`, `user_location_zones` | Права доступа |
| Перевозки | `shipments`, `shipment_requests`, `quote_requests`, `quotes` | Core TMS |
| Трекинг | `tracking_points` | События перевозки |
| Слоты | `slots`, `slot_shipments`, `dock_doors` | Тайм-слоты |
| Инвойсинг | `pre_invoices`, `invoices`, `cost_segments` | Финансы |
| Локации | `locations`, `location_zones`, `dock_doors` | Склады и адреса |
| Документы | `shipment_attachments`, `attachment_requests` | Файлы |
| Заказы | `orders`, `order_lines` | Заказы и строки |
| Galaxy | `galaxies`, `galaxy_accounts`, `constellations` | Мультиаккаунт |

## Особенности схемы

- **Soft delete**: большинство таблиц использует `deleted_at` (paranoid mode в Sequelize). `WHERE deleted_at IS NULL` добавляется автоматически.
- **Timestamps**: все таблицы имеют `created_at`, `updated_at`
- **Multi-tenant изоляция**: через `shipper_id` / `carrier_id` + ACL таблицы
- **Нет FK constraints** в части таблиц (legacy, проверки на уровне кода)

## Уникальные ключи (примеры)

| Таблица | Уникальный ключ | Описание |
|---------|----------------|---------|
| `shipments` | `tracking_code` | Внешний трекинг-код |
| `users` | `email` | Email уникален глобально |
| `locations` | `(account_id, name)` | Уникальное имя в рамках аккаунта |
| `slots` | `(location_id, start_time, dock_door_id)` | Один слот на ворота в одно время |
| `shipment_attachments` | `(shipment_id, file_name)` | Уникальное имя файла |

## Инструменты

```bash
# Миграции
cd workspaces/migrations
npm run migrate          # применить все
npm run migrate:undo     # откатить последнюю
npm run migrate:create   # создать новую

# Посмотреть список миграций
npm run migrate -- --list
```

---

## 🔗 Граф-метаданные
- **id:** `tms.implementation.database`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632422531 · **repo:** `tms/implementation/database/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

