---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629309443
source_type: confluence
---
# Followers & Follower Plans — подписчики объектов

> Сверено с кодом 2026-06-13 | `services/followers.js`, `follower_plans.js`, `models/follower_plans.js`, routes `followers.js`, `follower_plans.js`

## Зачем (бизнес-контекст)

На одной перевозке завязаны несколько людей: менеджер, бухгалтер, склад, клиент. Кому слать уведомления о событиях? Ручное добавление на каждой отправке не масштабируется. **Follower** — подписчик объекта (получает уведомления и доступ к обсуждению по scope). **Follower Plan** — правило автоназначения: «на всех морских отправках из Франции в подписчики добавлять Анну и Бориса». Это убирает рутину и гарантирует, что нужные люди в курсе, без ручной работы на каждом объекте.

## Как устроено (код)

- **Follower** — подписка пользователя на объект по **scope** через notification thread (`MsgNotifUser`): флаги is_quotes/tracking/invoicing/claims/transport_request/slots/visits_follower. То есть один человек может следить за tracking, но не за invoicing того же объекта.
- **Follower Plan** (`follower_plans.js`): shipper/carrier + owner_account, name, type (quote/direct_booking), **mode_ids/pickup_countries/delivery_countries** (условия срабатывания, JSONB), **user_ids** (кого добавить), position. При создании объекта, матчащего условия, план автодобавляет пользователей в подписчики.
- Доступные для добавления: teammates (своя команда) и partners (партнёрские аккаунты) — `entity-users` эндпоинты.

## Где найти и настроить (UI)

| Что | Где |
|-----|-----|
| Followers объекта | блок Followers на вкладках обсуждения/трекинга — директива `common/followers` (add из teammates/partners) |
| Follower Plans | настройки (право `follower_plan`); API `GET/POST/PUT /follower-plans`, `/follower-plans/available` (применимые к контексту) |

## Сценарии

1. **Авто-подписка склада**: plan с delivery_countries=[FR] + user_ids=[склад FR] → каждая доставка во Францию автоматически имеет склад в подписчиках.
2. **Точечный контроль**: на проблемной отправке добавить клиента в tracking-followers (но не в invoicing) → клиент видит трекинг, не видит финансы.
3. **Разделение по типу**: разные планы для quote и direct_booking — разные команды на разные потоки.

---

## 🔗 Граф-метаданные
- **id:** `tms.followers`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629309443 · **repo:** `tms/followers/README.md`
- **code_refs:** `backend/app/services/followers.js`, `follower_plans.js`, `models/follower_plans.js`, `routes/api/{followers,follower_plans}.js`, `frontend/public/app/common/followers`
- **modules:** TMS, Chat/Notifications
- **references:** `tms.notifications`, `tms.metadata`, `chat`
- **requirements:** нет — реализовано без требований (кандидат: NOTIF-домен)
