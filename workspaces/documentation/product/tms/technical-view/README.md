---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631472148
source_type: confluence
---
# Technical View — Технический взгляд на страницы TMS

Документация для разработчика. Каждая страница описана с точки зрения того, кто будет в ней что-то менять.

## Зачем это нужно

Когда разработчик получает задачу "добавить поле на страницу списка перевозок" — он должен знать:
- Откуда берётся каждое поле (какой API endpoint, какая модель)
- Какие другие страницы зависят от этой
- Что нужно было создать в системе, чтобы эта страница показала данные
- Сколько путей существует к нужному экрану

## Файлы

| Файл | Содержимое |
|------|-----------|
| [page-inventory.md](page-inventory.md) | Все страницы TMS по типам (list / detail / wizard / modal / dashboard) |
| [navigation-graph.md](navigation-graph.md) | Граф навигации: как страницы связаны между собой |
| [pages/shipments-list.md](pages/shipments-list.md) | Детальный технический разбор страницы списка перевозок |
| [pages/shipment-detail.md](pages/shipment-detail.md) | Детальный технический разбор страницы деталей перевозки |
| [navigation-graph.md](navigation-graph.md) | CSW wizard: зависимости, что создаётся, предусловия |

## Формат описания каждой страницы

```
Тип страницы:    List / Detail / Wizard / Modal / Dashboard / Calendar
URL:             /route/{param}
Предусловия:     что должно существовать в системе
Источники данных: API endpoints + модели БД
Данные:          поля и откуда они берутся
Действия:        что можно сделать, что меняется
Навигация ИЗ:   откуда можно попасть на эту страницу
Навигация НА:   куда можно перейти с этой страницы
Зависимые стр.: какие другие страницы используют те же данные
Код:             frontend + backend + worker
```

## Как читать граф зависимостей

**Предусловие** = что должно существовать в БД, чтобы страница работала корректно.

Пример: страница трекинга `/shipments/{id}` → таб Tracking
```
Нужно:
  ├── Shipment с этим id (создаётся из ShipmentRequest)
  │   └── ShipmentRequest (создаётся через CSW wizard)
  │       └── Locations (настраиваются в Master Data)
  ├── TrackingPoints (создаются автоматически с Shipment)
  └── Доступ пользователя (ShipperACL или CarrierACL)
```

Пути попасть на трекинг:
1. Список перевозок → клик по строке → таб Tracking (по умолчанию)
2. Email-уведомление → ссылка на Shipment → таб Tracking
3. Dashboard → клик на перевозку → таб Tracking
4. Публичная ссылка (без логина) → `/public-tracking/{token}`

---

## 🔗 Граф-метаданные
- **id:** `tms.technical-view`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631472148 · **repo:** `tms/technical-view/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

