---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629506077
source_type: confluence
---
# Multivision / Control Tower — обзор по группе аккаунтов

> Сверено с кодом 2026-06-13 | `services/multivision.js`, `accounts.js:359-417`, routes `multivision.js`, frontend `multivision`

## Зачем (бизнес-контекст)

Компания с десятком филиалов/аккаунтов (Galaxy) не может управлять логистикой, заходя в каждый по отдельности. Multivision (Control Tower) — **единое окно** поверх всех доступных пользователю аккаунтов: все отправки, локации, перевозчики в одном списке. Это вид «башни управления» для galaxy-менеджера и multi-account пользователя: увидеть всю сеть сразу, не переключая контекст.

## Как устроено (код)

- Доступные аккаунты вычисляет **`loadAllowedAccounts(user, input, forMultiVision)`** (`accounts.js:359-399`): linked accounts (UserLinkedAccount), constellation accounts (UserLinkedConstellation→ConstellationAccount), managed accounts (customer_admin), главный аккаунт. Роли-триггеры: **MULTI_ACC**, **MULTI_VISION_MANAGER**.
- `getMultiVisionList()` → агрегирует shipments по allowedAccounts; `getMultiVisionShipment()` → деталь. Middleware `loadAllowedMultiVisionAccountsMiddleware` кладёт req.allowedAccounts.

## Где найти и настроить (UI)

| Что | Роут |
|-----|------|
| Список (все аккаунты) | `/multivision` (MultiVisionListCtrl) |
| Деталь отправки | `/multivision/{id}` |

API: `GET /multivision/{shipments,locations,shippers}`, `/multivision/shipments/:id` (+ tracking/metadata/attachments). Доступ — по ролям MULTI_ACC / MULTI_VISION_MANAGER (см. [Galaxy](../galaxy/galaxy-module.md)).

## Сценарии

1. **Контроль сети**: galaxy-менеджер открывает `/multivision` → видит отправки всех филиалов, фильтрует по перевозчику/маршруту.
2. **Поиск проблем по сети**: задержки/инциденты по всем аккаунтам в одном списке.
3. **Multi-account пользователь**: переключение не нужно — все его linked-аккаунты в одном вью.

---

## 🔗 Граф-метаданные
- **id:** `tms.multivision`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629506077 · **repo:** `tms/control-tower/multivision-module.md`
- **code_refs:** `backend/app/services/multivision.js`, `accounts.js:359-417`, `controllers/api/multivision.js`, `routes/api/multivision.js`, `frontend/public/app/multivision`
- **modules:** TMS, Galaxy
- **references:** `tms.galaxy`, `tms.shipments`, `tms.self-admin`
- **requirements:** нет — реализовано без требований
