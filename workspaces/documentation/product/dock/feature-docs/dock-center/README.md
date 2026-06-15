---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632062018
source_type: confluence
---
# Dock Center — главный экран склада

> Сверено с кодом 2026-06-12 | `frontend/public/app/dock/router.js:4-9`, `dock/view/index.html`

## Зачем (бизнес-контекст)

Оператору склада нужен один экран «что происходит прямо сейчас», без переключения между листингами. Dock Center (роут **`/dock`**, контроллер DockCtrl) — стартовая точка смены: четыре колонки реального времени.

| Колонка | Что показывает | Зачем |
|---------|----------------|-------|
| **Last Slot** | Последний обработанный слот | Контекст «на чём остановились» |
| **Inbound** | Входящие (приёмка) на сегодня | Очередь работ Reception |
| **Outbound** | Исходящие (отгрузка) | Очередь работ Expedition |
| **Updates** | Лента изменений | Отмены/переносы/новые брони — без обновления страницы |

> Уточнение к Load View: ранее мы писали «Dock Center не существует» — поиск по старому фронту это пропустил; экран живёт в `app/dock/` и дополняет связку Load/Assignment/Planning как оперативная «приборная панель».

Связанные: [Planning](../planning/README.md) · [Load View](../load-view/README.md) · [TV Display](../tv-display/README.md)

## Где найти

**Путь:** меню → **DOCK** (`/dock`, `dock/router.js`). Виден пользователям с привязкой к master-локации (`master_location_id`) — для них это стартовая страница вместо `/shipments` (`mfe-shared.ts:93`).

## Сценарии

1. **Начало смены**: открыть `/dock` → одним взглядом оценить Inbound/Outbound очереди и ленту Updates (что изменилось за ночь).
2. **Переход к деталям**: из колонки → в Planning/конкретный слот.

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.dock-center`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 632062018 · **repo:** `dock/feature-docs/dock-center/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

