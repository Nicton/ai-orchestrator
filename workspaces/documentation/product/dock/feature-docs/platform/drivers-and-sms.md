---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/633012241
source_type: confluence
---
# Slot Drivers & SMS — водители и уведомления

> Сверено с кодом 2026-06-12 | `models/visit_drivers.js`, `services/visits/drivers.js`, `sms-impl.js`, `sms-notify/`, `worker/tasks/notify_by_sms.js`

## Slot Drivers — данные водителя

**Откуда:** охране и автоматическим воротам нужно знать, кого пускать; перевозчику — кому отправить инструкции. Водитель привязан к **визиту** (`visit_drivers`: ФИО, телефон, `is_checked`, is_gap), а слот наследует через visit.

**Как попадают данные:** форма Slotify (обязательность полей настраивается per-direction на локации), `POST /visits/:id/notify-driver`, `PUT /visits/:id/replace-driver`. **`is_checked`** — «активный» водитель: при нескольких водителях именно он получает SMS/email (`sms-notify/impl.js:35-65`, fallback — первый в списке). Влияние: перевозчик меняет водителя → replace-driver → уведомления автоматически идут новому.

## SMS

**Зачем:** у водителя нет приложения — единственный гарантированный канал это телефон. SMS несут ссылку driver-app (подтверждение прибытия, срок ссылки 15 мин) и статусные уведомления.

| Аспект | Реализация |
|--------|-----------|
| Доставка | Очередь `send_sms` (Kue/Redis) → `worker/tasks/notify_by_sms.js` |
| Формирование | `sms-impl.js` — из driver + shipment + address; лимит **149 символов** |
| Языки | `account_drivers.language` (DOCK-2320 — расширение списка); тексты в Tolgee (`translations/.../slotify.json`) |
| Триггеры | Назначение водителя на отправку/слот, ручная отправка оператором (manual notification) |

В чат слота пишется пост об отправке SMS — след для разбора «водитель не получил».

## Где найти и как настроить (UI)

- **Данные водителя**: форма Slotify при бронировании (поля настраиваются per-direction: Location Settings → Data fields, `/data-fields`); смена водителя — на визите кнопка replace-driver.
- **Ручная отправка SMS**: на экране визита/слота — действие manual SMS notification (выбирается `is_checked`-водитель).
- **Языки SMS**: язык водителя (`account_drivers.language`); тексты — Tolgee-проект slotify.

## Сценарии

1. **Уведомить водителя о слоте**: назначить водителя → авто-SMS со ссылкой подтверждения прибытия (живёт 15 мин).
2. **Замена в последний момент**: replace-driver → новый водитель получает SMS, старый — нет.

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.platform.drivers-and-sms`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 633012241 · **repo:** `dock/feature-docs/platform/drivers-and-sms.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

