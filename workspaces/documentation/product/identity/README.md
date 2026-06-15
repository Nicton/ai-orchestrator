---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632455202
source_type: confluence
---
# Shiptify Identity

## Что это

Identity — планируемый централизованный сервис аутентификации и управления сессиями для Shiptify. Сейчас аутентификация реализована **независимо** в нескольких приложениях платформы.

**Отдельного репозитория `identity` пока нет.** Репозиторий `gitlab.com/shiptify/apps/identity` существует, но содержит только дефолтный README GitLab. Это зарезервированный репозиторий под будущий сервис.

---

## Текущее состояние: аутентификация в каждом приложении отдельно

### 1. Main App (backend)

**Стек:** `express-jwt` + Passport.js, JWT в cookie или Authorization header.

**Методы входа:**
- `POST /login/local` — email + пароль (Passport local strategy)
- `POST /login/saml/:domain` — SAML SSO по домену email
- `GET /login/admin-as-user` — impersonation через admin-token
- `GET /oauth/callback/:env` — OAuth2 callback (Auth0-совместимый flow)
- Passwordless (one-time link): `POST /login/request-one-time`, `GET /login/one-time`

**Важно:** Большая часть логики аутентификации main app **уже вынесена в микросервис `ms-auth`** (репозиторий `workspaces/microservices/node/auth/`). Микросервис реализован на TypeScript и включает: local login, SAML, Google OAuth, passwordless, reset password, switch account.

**Токен:** JWT, подписывается секретом из конфига (`JWT_TOKEN_SECRET`). Токен содержит `uid` (user id). Срок жизни настраивается на уровне аккаунта (поле `session_expiration_time`), дефолт из константы `DEFAULT_EXPIRATION_TIME`.

**Ревокация токенов:** через Redis (`revoked:{tokenId}` → TTL 86400 сек). Проверяется в middleware `isRevoked`.

**Загрузка пользователя:** `loadAuthUserMiddleware` — десериализует токен, загружает `User` + `Account` из БД, пишет в `req.user`.

**Роли пользователей** (строка через запятую в `users.roles`):
```
login          — базовый доступ к платформе
self_admin     — администратор аккаунта
super_user     — администратор платформы
galaxy_manager — управление multi-account (Galaxy)
spectator      — только чтение
multi_vision_manager — просмотр нескольких аккаунтов
multi_acc      — multi-account access
api            — API-доступ
```

**ACL:** помимо ролей, используется многоуровневый ACL:
- `ShipperACL` — доступ к дивизионам shipper
- `CarrierACL` — доступ к дивизионам carrier
- `UserLocationZone` — доступ к локациям
- `acl_permissions` в сессии запроса — гранулярные разрешения на действия (например, `can_cancel`, `can_edit_booking`)

**Типы аккаунтов:** `shipper` (грузоотправитель), `carrier` (перевозчик).

**Мультиаккаунт:** пользователь может принадлежать нескольким аккаунтам, переключение через `switch-account`.

**SAML/SSO:** в модели `IdentityProvider` + `SsoKey` + `IdentityProviderDomain`. Поиск IdP по домену email (сервис `identity_providers.js`). SSO-ключи хранятся в таблице `sso_keys` (private_key, public_cert, signature_algorithm).

**Login events:** при успешной аутентификации создаётся событие через `queue-login-event.ts` в `ms-auth` (асинхронно через очередь).

---

### 2. Back-Office (BO)

**Стек:** Passport.js с JWT-стратегией (`passport-jwt`), Bearer token из Authorization header.

**Метод входа:** только JWT (токен генерируется main app или отдельным механизмом).

**Требования к пользователю:** роли `login` И `manager` — без обеих ролей доступ закрыт.

**Middleware:**
- `requireAuth` — проверяет `req.isAuthenticated()`
- `requireAdmin` — требует роль `admin`
- `requireShipper` — требует роль `shipper`

**Важно:** Back-Office использует **ту же таблицу пользователей** (`users`) что и main app, но имеет **собственный auth middleware** и собственную Passport-стратегию. Конфиг токена: `config.token.secret`.

**Session store:** Redis через `connect-redis` (`SESSION_REDIS_HOST`, `SESSION_REDIS_PORT`).

---

### 3. Admin App

**Стек:** Passport.js (local strategy + Google OAuth 2.0), JWT через cookie или Authorization header (`express-jwt 3.x`).

**Методы входа:**
- Форма логина: `POST /login` (email + пароль)
- Google OAuth: `GET /login/google` (корпоративный аккаунт Shiptify)

**Требования:** `is_admin = true` на пользователе. Обычные пользователи платформы не могут войти.

---

### 4. Микросервис `ms-auth` (уже существует)

Находится в `workspaces/microservices/node/auth/`. Реализован на TypeScript. Включает:
- `api-local.ts` — email/пароль, passwordless, forgot/reset password
- `api-saml.ts` — SAML SSO (`POST /login/saml/:domain`, `POST /api/v2/auth/login/saml`)
- `api-google.ts` — Google OAuth
- `api-auth-management.ts` — управление auth (смена пароля и т.д.)
- `api-reporting.ts` — отчётность по login-событиям
- `rpc.ts` — RPC-эндпоинты для вызовов из других сервисов
- `app/session.ts` — генерация и управление сессиями
- `app/switch-account.ts` — переключение аккаунта
- `app/signup.ts` — регистрация
- `app/invite.ts` — приглашения
- `passport/` — стратегии Passport

Этот микросервис уже существует и активно используется main app (см. `auth.js` controller, который вызывает `oauth2LoginCallback` и `generateAuthSessionInfo`).

---

## Текущая архитектура (схема)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Main App    │  │  Back-Office │  │  Admin App   │
│  Frontend    │  │  Frontend    │  │  AngularJS   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │ JWT              │ JWT              │ JWT/Cookie
       ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  ms-auth     │  │  BO Server   │  │  Admin Server│
│ (TypeScript) │  │  (Express +  │  │  (Express +  │
│  SAML/local/ │  │  passport-   │  │  Passport +  │
│  Google/pw-  │  │  jwt)        │  │  Google)     │
│  less        │  └──────┬───────┘  └──────┬───────┘
└──────┬───────┘         │                  │
       │                 └──────────────────┘
       │                          │
       ▼                          ▼
┌─────────────────────────────────────┐
│           PostgreSQL                │
│  users, accounts, sso_keys,         │
│  identity_providers,                │
│  identity_provider_domains          │
└─────────────────────────────────────┘
                 │
                 ▼
         ┌──────────┐
         │  Redis   │
         │ sessions │
         │ revoked  │
         │ tokens   │
         └──────────┘
```

---

## Репозиторий `identity` (пустой)

Репозиторий `gitlab.com/shiptify/apps/identity` создан, но **не содержит кода** — только шаблонный README GitLab. Это означает:

- Намерение создать централизованный identity-сервис зафиксировано
- Разработка ещё не начата
- Текущие системы аутентификации продолжают работать независимо в каждом приложении

См. [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) — открытые вопросы по планированию.

---

## Сверено с кодом ms-auth (2026-06-11)

- SAML — **generic multi-tenant**: IdP по домену email (`identity_providers` + `identity_provider_domains` + `sso_keys`); `accounts.auth_methods` per-account
- Сессии: JWT-cookie TTL **35 мин**, авто-refresh после 30 мин, revocation — Redis-blacklist по подписи; per-account `session_expiration_time`
- **MFA нет** (speakeasy в backend — только для FedEx API); **PKCE нет** (SPA не использует OAuth); passwordless magic-link есть
- Ротация SP-сертификатов и Client Secret **не реализована** (техдолг)
- Self-service SSO нет — IdP настраивается через БД; SP-metadata endpoint только для super_user

Полный аудит: [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md), `tms/admin/auth-sso.md`

---

## 🔗 Граф-метаданные
- **id:** `identity`
- **type:** overview · **domain:** Identity · **status:** implemented
- **confluence:** 632455202 · **repo:** `identity/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Identity
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

