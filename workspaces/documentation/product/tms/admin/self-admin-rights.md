---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629375079
source_type: confluence
---
# Self-Admin / Rights / Roles / Teams — пользователи и доступы

> Сверено с кодом 2026-06-13 | `services/{self_admin,roles-groups,users-roles-teams,teams,scopes}.js`, frontend `self-admin`, `rights-management`, `users`

## Зачем (бизнес-контекст)

В аккаунте клиента — разные люди с разными обязанностями: кто-то только бронирует, кто-то ведёт финансы, кто-то админит. Давать всем всё — риск; обращаться в саппорт за каждой настройкой — медленно. **Self-Admin** даёт администратору аккаунта самостоятельно приглашать пользователей, назначать роли, собирать команды и раздавать права по scope (booking/tracking/invoicing/claims…). Это автономия клиента над своим доступом + принцип наименьших привилегий.

## Как устроено (код)

| Сущность | Модель | Ключевое |
|----------|--------|----------|
| Группа ролей | `roles_groups.js` | name, type (shipper/carrier) |
| Роль | `roles.js` | roles_group_id, name |
| Связь юзер-роль | `users-roles.js` | user_id ↔ role_id |
| Команда | `team.js` | account, name |
| Связь юзер-команда | `users_teams.js` | user_id ↔ team_id |
| Scopes | `scopes.js` | QUOTES/BOOKING/TRACKING/INVOICING/CLAIMS/DETAILS/ADDRESSES/TRANSPORT_REQUEST/INVOICES/SLOTS/VISITS/CUSTOMS_INVOICES → колонки уведомлений |

`saveUserRolesTeams` (транзакция: пересоздаёт связи + событие). Системные роли (login/self_admin/super_user/spectator/galaxy_manager/multi_acc) — на пользователе.

## Где найти и настроить (UI)

| Что | Роут |
|-----|------|
| Пользователи (роли/команды/права) | `/self-admin` |
| Перевозчики шиппера | `/self-admin/carriers` |
| Пользователи перевозчика | `/self-admin/carrier/users` |
| Группы перевозчиков | `/self-admin/carrier-groups` |
| Follower Plans | `/self-admin/follower-plans` |
| Приглашение пользователя | модал CreateUserCtrl |

API: `GET /roles-groups`, `GET/POST/PATCH/DELETE /teams`. DOCK-права (DockPermissions) — см. [auth-management](../../dock/feature-docs/platform/auth-management.md).

## Сценарии

1. **Новый сотрудник-букер**: пригласить → роль с scope booking+tracking, без invoicing → видит и бронирует, не видит финансы.
2. **Команда по региону**: создать team «FR» → добавить пользователей → использовать в follower plans/фильтрах.
3. **Galaxy-менеджер**: роль galaxy_manager → доступ к constellations/managed accounts (см. [Galaxy](../galaxy/galaxy-module.md)).

---

## 🔗 Граф-метаданные
- **id:** `tms.self-admin`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629375079 · **repo:** `tms/admin/self-admin-rights.md`
- **code_refs:** `backend/app/services/{self_admin,roles-groups,users-roles-teams,teams,scopes}.js`, `models/{roles_groups,roles,users-roles,team,users_teams}.js`, `frontend/public/app/{self-admin,rights-management,users}`
- **modules:** TMS, Galaxy, DOCK (DockPermissions)
- **references:** `tms.galaxy`, `tms.carriers`, `tms.followers`, `dock.auth-management`
- **requirements:** нет — реализовано без требований (роли — в identity/README)
