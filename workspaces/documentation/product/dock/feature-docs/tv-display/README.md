---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632225874
source_type: confluence
---
# TV Display — режим табло для склада

> Сверено с кодом 2026-06-12 | `slotify/services/constants.js:21,29`, `controllers/location-settings/display.js`, URL `/display`

## Зачем (бизнес-контекст)

Работникам на полу не выдают ноутбуки — им нужен **экран на стене**: кто следующий, кто опаздывает, что завершено. TV Display — упрощённый режим без интерактива, рассчитанный на телевизор/киоск: крупно, читаемо с расстояния, автообновление.

## Четыре табло

| Табло | URL | Контент |
|-------|-----|---------|
| Upcoming | `/upcoming` | Предстоящие слоты — очередь на ближайшие часы |
| Delayed | `/delayed` | **Опаздывающие** — машина не прибыла к плановому времени |
| Current | `/analytics/pending` | В работе прямо сейчас |
| Completed | `/analytics/completed` | Завершённые за день |

Настройка — Location Settings → Display: оператор выбирает, какие табло выводить на конкретный экран. Видимость опозданий/отмен — те же правила подсветки, что в Planning (см. [Видимость опозданий](../planning/README.md#видимость-опозданий-и-отмен)).

## Где найти и как настроить (UI)

**Путь:** Slotify → **`/display`** (роут TV Display, `slotify/router.js:374`). Настройка табло — Location Settings → Display (`location-settings/display.js`): оператор выбирает, какие из 4 табло выводить на конкретный экран.

**Запуск на телевизоре:** открыть `/display` в браузере киоск-режима на ТВ у дока; страница автообновляется, интерактив не нужен.

## Сценарии

1. **Табло у въезда**: вывести Upcoming + Delayed → водители и охрана видят, кого ждут и кто опаздывает.
2. **Экран бригадира**: Current + Completed → прогресс смены в реальном времени.

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.tv-display`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 632225874 · **repo:** `dock/feature-docs/tv-display/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

