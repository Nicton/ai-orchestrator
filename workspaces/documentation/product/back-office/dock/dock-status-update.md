---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632422418
source_type: confluence
---
# Dock Status Update Modal — Упрощённый модал статусов

Новый единый модал для обновления статусов слотов в Dock.

> Источник: слайд `2026 04 - Statuses Update`

---

## Изменения

**Было:** несколько отдельных модалов для разных статусов.
**Стало:** единый упрощённый модал.

### Новый модал

- Предзаполняет текущее время
- Поле **Dock Door** показывается только если не было введено ранее
- Порог on-time/late задаётся в Jira [DOCK-1544](https://shiptify.atlassian.net/browse/DOCK-1544)

---

## Условная логика

### "Driver called" статус

Гейтится на наличии данных о водителе. Показывается 3-кнопочный модал:
1. **Set later** — установить позже
2. **Set anyway** — установить без данных
3. **Provide driver** — ввести данные водителя

### LOADED / UNLOADED

Перед модалом даты/времени — сначала модал обновления packing list.

При 2+ заказах — добавляется шаг reconciliation (сверки).

---

## Backdating (ручной режим)

Если `manual_mode = true + on_time = true + closed = status`:

→ Единый модал для **всех** статусов сразу (bulk date/time update).

---

## 🔗 Граф-метаданные
- **id:** `back-office.dock.dock-status-update`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 632422418 · **repo:** `back-office/dock/dock-status-update.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

