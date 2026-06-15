---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632750113
source_type: confluence
---
# Auth Management — доступы в DOCK

> Сверено с кодом 2026-06-12 | `models/user.js:246-254`, `location_settings.js`, `controllers/api/self_admin.js`

## Зачем

На складе разные роли с разной ценой ошибки: диспетчер бронирует, бригадир двигает статусы, супервайзер разруливает аномалии. Права DOCK гранулярны по **действиям над статусами** — именно смена статуса является «опасной» операцией (она двигает KPI и уведомления).

## DockPermissions (JSONB на пользователе, дефолт — все true)

| Право | Что разрешает |
|-------|---------------|
| CAN_SLOT_BOOKING / CAN_BOOK_RECURRING_SLOT / CAN_BOOK_VISIT | Создание броней/визитов |
| CAN_FORCE_SLOT | Пробить переполненный слот (оранжевый) — осознанное превышение capacity |
| CAN_VALIDATE_SLOT / CAN_DECLINE_SLOT | Очередь валидации |
| CAN_MANAGE_SLOT_GENERAL/ONGOING/CLOSED/ANOMALY_STATUS | Смена статусов по группам: «в работе», «закрытие», «аномалии» — раздельно |
| CAN_MANAGE_VISIT_STATUS / VISIT_ANOMALY_STATUS | То же для визитов |

Раздельность GENERAL/ONGOING/CLOSED/ANOMALY — продуктовое решение: закрывать слот и объявлять NO_SHOW может не тот же человек, который отмечает «машина у дока».

## Уровень страницы и локации

- `user.show_page` (JSONB) — какие страницы DOCK видны пользователю
- `location_settings.has_slotify_access` — включён ли публичный портал площадки
- Управление — Self-Admin (`controllers/api/self_admin.js`): админ аккаунта раздаёт права без обращения в саппорт

Связанное: внешние бронирующие аутентифицируются passwordless-магией Slotify (см. identity-доки), операторы — обычной учёткой.

## Где найти и как настроить (UI)

**Путь:** основное приложение → **Self-Admin** (управление пользователями аккаунта, `controllers/api/self_admin.js`) → пользователь → вкладка **Dock permissions**. Админ аккаунта проставляет чекбоксы прав без обращения в саппорт.

- **Видимость страниц** пользователя — `show_page` (там же).
- **Включить Slotify на площадке** — Location Settings → `has_slotify_access`.

## Сценарии

1. **Новый диспетчер**: дать CAN_SLOT_BOOKING + CAN_MANAGE_SLOT_GENERAL_STATUS, но НЕ давать CAN_MANAGE_SLOT_ANOMALY_STATUS (no-show/refuse оставить супервайзеру).
2. **Бригадир дока**: CAN_MANAGE_SLOT_ONGOING/CLOSED_STATUS (двигать «у дока → отгружено»), без права валидации чужих броней.
3. **Супервайзер**: CAN_FORCE_SLOT (пробивать переполнение) + все ANOMALY-права.

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.platform.auth-management`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 632750113 · **repo:** `dock/feature-docs/platform/auth-management.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

