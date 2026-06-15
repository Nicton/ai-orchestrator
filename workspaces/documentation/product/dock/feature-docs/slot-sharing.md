---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631668755
source_type: confluence
---
# Slot Sharing — статус

> Проверено по коду 2026-06-12: сущностей `slot_sharing` / `shareSlot` в backend и frontend **не найдено**.

Что покрывает близкие сценарии сегодня: **whitelist партнёров зоны** (доступ к бронированию), **recurring_slot_participants** (партнёры регулярного слота), **выделенные recurring-слоты** под перевозчика (`private_carrier_id`) и **Grouping** (слияние слотов отправок в главный слот). Если под «slot sharing» имеется в виду иной сценарий (например, передача брони другому партнёру) — это feature request: опишите кейс, добавим в спецификацию.

## Где найти и как настроить

Отдельного экрана нет (функция не реализована). Близкие настройки, закрывающие смежные потребности:
- **Whitelist зоны**: Slotify → Location Settings → Slot validation → добавить партнёра.
- **Выделенный recurring-слот под перевозчика**: создание recurring slot с `private_carrier_id`.
- **Участники recurring-слота**: `recurring_slot_participants` (партнёры с доступом).
- **Grouping**: слияние слотов отправок в главный — см. [Grouping 2.0](../../tms/features/grouping-2.0.md).

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.slot-sharing`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 631668755 · **repo:** `dock/feature-docs/slot-sharing.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

