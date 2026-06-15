---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631767140
source_type: confluence
---
# Identity — Открытые вопросы

> **Примечание 2026-06-11 (код-аудит ms-auth):** все вопросы ниже — архитектурные решения о будущем сервисе (репозиторий пуст), код на них не отвечает. Из аудита `microservices/node/auth` известно дополнительно: SAML — generic multi-tenant (IdP по домену email, таблицы identity_providers/sso_keys/identity_provider_domains); управление sso_keys — только прямая БД + super_user-endpoint метаданных (self-service нет); JWT TTL 35 мин с авто-refresh и Redis-revocation; **MFA нет**, **PKCE нет** (SPA на JWT-cookie); passwordless magic-link есть; ротация сертификатов/секретов не реализована. Эти факты — вход для проектирования identity. Полные ответы: `tms/admin/auth-sso.md`.

## Почему репозиторий пустой

Репозиторий `gitlab.com/shiptify/apps/identity` создан, но не содержит кода. Дефолтный README GitLab — признак зарезервированного места под будущий сервис. Разработка не начата.

Аутентификация **сейчас работает** через три независимых системы: `ms-auth` (main app), Back-Office (отдельный Passport middleware), Admin App (отдельный Passport + Google OAuth). Единого identity-сервиса нет.

---

## Открытые вопросы

### 1. Область нового сервиса
**Что именно войдёт в `identity`?**
- `ms-auth` уже существует и покрывает main app — будет ли `identity` его заменой или надстройкой?
- Планируется ли единый SSO для main app, Back-Office и Admin App?
- Будет ли Back-Office мигрировать с собственного `passport-jwt` на `identity`?
- Войдёт ли Admin App (Google OAuth + локальный логин) в единый identity-поток?

### 2. Соотношение с `ms-auth`
**Как `identity` соотносится с уже существующим микросервисом `ms-auth`?**
- `ms-auth` в `workspaces/microservices/node/auth/` уже реализует: local login, SAML, Google OAuth, passwordless, reset password, switch-account, invite
- Возможно, `identity` — это переименование или эволюция `ms-auth`
- Или `identity` — новый репозиторий с другой областью ответственности (например, централизованный SSO/IdP)

### 3. SSO и SAML
**Как развивается поддержка SSO?**
- Сейчас SAML настраивается через `IdentityProvider` + `SsoKey` + `IdentityProviderDomain` в основной БД
- Параметры: `signature_algorithm`, `private_key`, `public_cert` в таблице `sso_keys`
- Кто управляет этими данными? Через Admin App? Через BO? Через прямую БД?
- Будет ли `identity` добавлять self-service SSO-конфигурацию для enterprise-клиентов?

### 4. Управление токенами
**Останется ли текущая схема JWT?**
- Сейчас JWT подписывается секретом (`JWT_TOKEN_SECRET`), ревокация через Redis
- Back-Office использует отдельный `config.token.secret` — он совпадает с `JWT_TOKEN_SECRET` main app?
- Будет ли `identity` выпускать токены централизованно (Authorization Server)?
- Рассматривается ли переход на стандарт OpenID Connect?

### 5. Multi-account и роли
**Как `identity` будет работать с multi-account и ACL?**
- Роли пользователей (`self_admin`, `galaxy_manager`, `spectator` и т.д.) хранятся в таблице `users` как строка
- ACL (ShipperACL, CarrierACL, UserLocationZone) привязан к основной БД main app
- Кто будет отвечать за роли и ACL: `identity` или main app?

### 6. Обратная совместимость
**Что происходит с текущими клиентами при миграции?**
- Фронтенд main app обращается к `/login/local`, `/login/saml/:domain` напрямую
- Back-Office читает JWT из Authorization header и проверяет через свою Passport-стратегию
- Миграция потребует синхронного изменения нескольких приложений

### 7. Login events / аудит
**Останется ли аудит login-событий?**
- Сейчас `ms-auth` генерирует login events через `queue-login-event.ts`
- Admin App отображает эти события в дашборде
- Войдёт ли audit log в `identity` или останется в Admin App / Admin-App Analytics?

### 8. Timeline
**Когда планируется начать разработку?**
- Нет известных тикетов или планов с датами
- Репозиторий создан без описания

---

## Что известно точно

- Репозиторий `identity` создан на GitLab: `gitlab.com/shiptify/apps/identity`
- Код в репозитории: только шаблонный README GitLab
- Микросервис `ms-auth` уже существует и работает — это ближайший аналог будущего identity-сервиса
- Текущие системы аутентификации работают и не нарушены
- Три независимых auth-системы (main app, Back-Office, Admin App) создают дублирование, которое `identity` призван устранить

---

## 🔗 Граф-метаданные
- **id:** `identity.open-questions`
- **type:** module-doc · **domain:** Identity · **status:** implemented
- **confluence:** 631767140 · **repo:** `identity/OPEN-QUESTIONS.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Identity
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

