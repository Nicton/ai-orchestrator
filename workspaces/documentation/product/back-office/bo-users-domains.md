---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629506093
source_type: confluence
---
# BO Users, Domains, Public Page & Engagement

> Сверено с кодом 2026-06-13 | BO client containers domains/publicPage/spectators/roles/users/sites/referrals/linkedin, routes

## Зачем (бизнес-контекст)

Back-Office управляет доступом и присутствием: BO-пользователи и их роли (RBAC), домены аккаунтов (брендинг, логотипы), публичные страницы трекинга для клиентов галактик, спектаторы (просмотр), а также маркетинг-инструменты (LinkedIn-посты) и реферралы. Это «административный контур» — кто работает в BO, как клиенты видят бренд, и как растёт воронка.

## Как устроено (код) и где найти

| Раздел | Что делает | Роут BO |
|--------|-----------|---------|
| Public Page | Клиентские страницы трекинга галактики (customer status, теги, режимы, фильтры стран/зон) | `/public-page` |
| Domains | Домены аккаунтов: создание, источники, логотипы (async generation), привязка к аккаунтам | `/domains` |
| Spectators | Просмотр-only пользователи с фильтрованной видимостью шипперов | `/spectators` |
| Roles | RBAC: группы ролей и роли с матрицей прав | `/roles` (+`/roles-groups`) |
| Users | BO-пользователи: создание, фильтры, multi-account linking, constellation, reset password | `/users` |
| Sites | Локации/сайты шипперов (как spectators, с site-фильтрами) | `/sites` |
| Referrals | Источники рефералов и приглашённые аккаунты | `/referrals` |
| LinkedIn | Контент-маркетинг: создание/управление постами | `/linkedin` |

API: `/domains` (+creator-accounts/creation-sources/:name/request-logo), `/roles-groups` (+:id/role), `/users` (+:id/account, reset-password), `/referrals`, `/linkedin-posts`.

## Сценарии

1. **Брендированный домен клиента**: BO → Domains → создать домен + логотип → клиентские страницы и письма брендируются.
2. **Новый BO-сотрудник**: Users → создать → роль (RBAC) → доступ к нужным разделам.
3. **Публичный трекинг**: Public Page → настроить для галактики → клиент видит свои отправки по ссылке.

---

## 🔗 Граф-метаданные
- **id:** `back-office.users-domains`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 629506093 · **repo:** `back-office/bo-users-domains.md`
- **code_refs:** `back-office/client/containers/{publicPage,domains,spectators,roles,users,sites,referrals,linkedin}.tsx`, `server/routes/api/{domains,roles_groups,users,referrals,linkedin}.js`
- **modules:** Back-Office, Identity, TMS (referrals)
- **references:** `tms.referrals-agreement-contracts`, `identity`, `tms.galaxy`
- **requirements:** нет — реализовано без требований
