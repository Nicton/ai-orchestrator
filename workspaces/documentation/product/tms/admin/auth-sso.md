---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632684595
source_type: confluence
---
# Auth / SSO — Аутентификация и единый вход

> Источник требований: REQ-AUTH-001..007 | Источник: User Guide - Authentification & SSO v1.0

---

## Концепция

Аутентификация в Shiptify строится на принципе **SSO (Single Sign-On)** через внешний Identity Provider (IDP). Локальная аутентификация запрещена (кроме настройки и технической поддержки). Поддерживаются несколько потоков OAuth 2.0, SAML 2.0 и TLS для разных типов клиентских приложений.

> ✅ ОТВЕТ ИЗ КОДА (2026-06-11): Гайд написан по кейсу Chanel, но реализация в `microservices/node/auth` (ms-auth) — **generic multi-tenant**: IdP подбирается по домену email (таблицы `identity_providers` + `identity_provider_domains` + `sso_keys`), методы аутентификации настраиваются per-account (`accounts.auth_methods`, дефолт `['local','saml','google','admin_token']`). Применимо к любому enterprise-клиенту.
> ✅ ОТВЕТ ИЗ КОДА: Self-service **нет** — настройка IdP только через БД силами Shiptify; endpoint генерации SP metadata доступен только роли `super_user` (`generate-saml-sp-metadata.ts:46-83`).

---

## Identity Provider (IDP) требования (REQ-AUTH-001)

**Обязательные условия:**
- Все приложения используют Chanel IDP (Active Directory) для аутентификации
- Локальная аутентификация запрещена (кроме конфигурации и L3-поддержки)
- SSO реализован для конечных пользователей независимо от места хостинга приложения
- После успешной аутентификации приложение самостоятельно проверяет права доступа (авторизация отделена от аутентификации)

**Атрибуты AD, передаваемые IDP:**

| Атрибут | Описание |
|---------|----------|
| login | Логин пользователя |
| country | Страна |
| division | Подразделение |
| role | Роль |
| location | Локация |
| group membership | Членство в группах |

**Дополнительные условия:**
- Приложение **не хранит** локальные пароли пользователей; все сессии управляются через IDP-токены
- Self-Service Password Reset (SSPR) доступен всем зарегистрированным пользователям

---

## SAML 2.0 (REQ-AUTH-002)

SAML 2.0 используется для web-браузерной SSO аутентификации.

**Требования к SP-сертификату:**
- Максимальный срок действия: **3 года**
- Элемент `AuthnContextClassRef` удалён из SAML-запросов
- Алгоритм хэширования: **SHA-256** (обязательно)

**Поток аутентификации:**
```
1. Пользователь обращается к приложению
2. SP генерирует SAML-запрос → редирект на IDP
3. IDP запрашивает login/password (если нет активной сессии)
4. IDP возвращает закодированный SAML-ответ
5. Приложение верифицирует SAML-ответ → пользователь авторизован
```

**Claim Rules (передаются в SAML-токене):** Name Identifier, email, IGI и другие.

> ⚠️ ПО КОДУ (2026-06-11): Сертификаты хранятся в таблице `sso_keys` (public_cert + private_key). **Механизма ротации нет** — ни версионирования ключей, ни параллельной работы старого и нового сертификата. Обновление = замена записи в БД → риск прерывания SAML-сессий. Кандидат в техдолг.
> ❓ ОТКРЫТЫЙ ВОПРОС (Engineering): Процесс тестирования SAML-потока при обновлении SP Metadata не формализован.

---

## OAuth 2.0 — Implicit Grant для SPA (REQ-AUTH-003)

> ⚠️ Раздел описывает требования гайда; **фактически Implicit Grant в коде не используется** — SPA работает на JWT-cookie сессиях (см. ответ ниже).

Используется для Single Page Applications (веб-приложений без бэкенда).

**Поток:**
```
SPA → браузер → IDP (Authorization Endpoint)
IDP → возвращает ID Token + Access Token в URL-фрагменте (#)
SPA использует:
  - ID Token → атрибуты пользователя
  - Access Token → вызовы API
```

**Ограничения:**
- `Client Secret` в SPA **не хранится** (public client)
- Embedded WebView **запрещён** — только внешний браузер (user agent)
- IDP Endpoints: Authorization, Token, UserInfo — должны быть доступны

> ✅ ОТВЕТ ИЗ КОДА (2026-06-11): Вопрос неактуален в исходной формулировке — **Implicit Grant в коде не используется** (в `GRANT_TYPE` бэкенда его нет). SPA Shiptify работает не на OAuth, а на **JWT-cookie сессиях** (см. REQ-AUTH-007 ниже). OAuth (Authorization Code + client_credentials) применяется для M2M-интеграций. **PKCE не реализован** — добавлять имеет смысл только если SPA переведут на OAuth.

---

## OAuth 2.0 — Authorization Code Grant (REQ-AUTH-004)

Используется для Web App и Native (мобильных) приложений.

**Web App поток:**
```
1. Редирект → IDP → получение Authorization Code
2. Обмен Code на ID Token + Access Token
   (используются Client ID + Client Secret)
3. Access Token → вызовы Web API
4. ID Token → атрибуты пользователя
```

**Native (iOS) App:**
- Использует Authorization Code + **PKCE**
- Поток через внешний браузер (не WebView)

**Срок Pre-shared Key (Client Secret):** 3 года с процессом обновления.

**Проверка JWT-подписи:**
- Верифицируется клиентом и resource server через OpenID Connect discovery endpoint
- При необходимости доступа к O365 используется Azure AD вместо ADFS

---

## OAuth 2.0 — Client Credentials Grant (M2M) (REQ-AUTH-005)

Используется для daemon-приложений и сервис-аккаунтов (machine-to-machine).

**Поток:**
```
Daemon → Client ID + Client Secret → IDP
IDP → Access Token
Daemon → Web API (с Access Token)
```

**APIM Gateway:**
- Верифицирует подпись токена
- Web API доверяет соединению через APIM (не обязан повторно проверять)

**Защита Web API через APIM:**
- HTTP Basic Auth
- SSL Mutual Auth
- IP Whitelisting
- Azure VNet

**Логирование:** call metadata для аналитики через APIM.

> ✅ ОТВЕТ ИЗ КОДА (2026-06-11): Механизма ротации **нет** — секрет один, из конфига (`authorization/oauth-tokens.js:301-330`), поддержки двух активных секретов нет. Ротация = ручная замена конфига + рестарт (downtime). Кандидат в техдолг.

---

## TLS — Аутентификация M2M с сертификатами (REQ-AUTH-006)

Используется для защищённых M2M коммуникаций.

**Требования:**
- TLS версия: **1.2** (обязательно)
- Длина RSA ключа: **≥ 2048 бит**
- Приватный ключ защищён passphrase и **никогда не передаётся**
- Subject Alt Name (SAN) содержит FQDN приложения

**Генерация CSR:**
```
CSR генерируется на устройстве, где запущено приложение
Organization, OU, Location, Email — все заполнены
```

**TLS Handshake:**
```
Client Hello → Server Hello + Certificate Request
→ Client Key Exchange + Client Certificate
→ Взаимная верификация → Encrypted session
```

**Обновление сертификата:**
При компрометации или истечении — новый CSR с **новой ключевой парой**.

---

## Управление учётными данными по OS (REQ-AUTH-007)

| Среда | Поведение |
|-------|-----------|
| Windows 10 (BLUE), Edge/IE/Chrome, внутренняя сеть | Прозрачная аутентификация (без запроса пароля) |
| Windows 10, Firefox, первое подключение | Запрос учётных данных |
| macOS/iOS + VPN | Как внутренняя сеть |
| macOS/iOS без VPN | Запрос учётных данных при первом подключении (все браузеры) |

**Self-Service Password Reset (SSPR):** доступен по SSPR-URL для всех зарегистрированных пользователей.

**Resource Owner Password Grant:** разрешается **только с явным derogation** от Chanel IT + security assessment.

**HA (High Availability):**
- Chanel IDP развёрнут в **3 регионах** (mutual support)
- DRP возможности обеспечены

> ✅ ОТВЕТ ИЗ КОДА (2026-06-11): Внешние партнёры — **локальные пароли (bcrypt)** + **passwordless magic-link** (одноразовый токен в Redis, отправка на email — `passwordless.ts:17-39`). Отдельного IDP нет: все пользователи в одной таблице `users`, SSO-пользователи помечены флагом `use_sso`.
> ✅ ОТВЕТ ИЗ КОДА: **MFA не реализована** — поиск totp/mfa в ms-auth пуст (`speakeasy` в backend используется только для интеграции FedEx API). Кандидат в security-бэклог.
> ✅ ОТВЕТ ИЗ КОДА: **Автоматический refresh**: JWT TTL = 35 мин (`TOKEN_MAX_AGE=2100`), сессия авто-обновляется после 30 мин (`session.ts:16-24`, `refreshSessionWithPayload`); отзыв — Redis-blacklist по подписи токена (`revoked-jwt.ts`); TTL настраивается per-account (`session_expiration_time`). Для M2M OAuth — refresh tokens в БД (encrypted) + cron `refresh-oauth-tokens.js`.

---

## Связанные функции

| Функция | Документ |
|---------|----------|
| Роли и типы аккаунтов | [../shipments/06_roles-matrix.md](../shipments/06_roles-matrix.md) |
| Навигация и типы аккаунтов | [../shipments/00_domain-map.ru.md](../shipments/00_domain-map.ru.md) |

---

## 🔗 Граф-метаданные
- **id:** `tms.admin.auth-sso`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632684595 · **repo:** `tms/admin/auth-sso.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

