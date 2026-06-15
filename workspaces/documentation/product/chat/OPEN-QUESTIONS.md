---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631930946
source_type: confluence
---
# Chat — Открытые вопросы

> **Примечание 2026-06-11:** вопросы ниже — архитектурные решения о будущем выносе чата (репозиторий пуст), код на них не отвечает. Текущее состояние подтверждено кодом: чат в main app backend (msg_threads/msg_posts/msg_members), real-time — микросервисы `ms-msg-ws` + `ms-msg-notif` + `ms-msg-offload` (verifyJWT через @shiptify/node-auth), email-digest cron. Детали: `product/chat/README.md` (Confluence 623083536). Решения по выносу — за Engineering/Architecture.

## Почему репозиторий пустой

Репозиторий `gitlab.com/shiptify/apps/chat` создан, но не содержит кода. Дефолтный README GitLab — признак того, что репозиторий зарезервирован под будущую разработку, но работа ещё не началась.

Чат **сейчас полностью встроен** в main app backend. Переход на отдельный сервис — это архитектурное решение, которое ещё не принято финально.

---

## Открытые вопросы

### 1. Область выноса
**Что именно планируется вынести в `chat`?**
- Только WebSocket-доставку (уже частично есть `ms-msg-ws`, `ms-msg-notif` в microservices)?
- Всю логику тредов и постов (msg_threads, msg_posts)?
- Систему followers?
- Email-уведомления по чату?
- API чата (`/api/v1/discussions`)?

Примечание: частичный вынос уже произошёл — микросервисы `ms-msg-ws`, `ms-msg-notif`, `ms-msg-offload` уже существуют в `workspaces/microservices/node/`. Возможно, `chat` — это агрегирующий репозиторий для всех chat-микросервисов, или следующий этап более глубокого выноса.

### 2. Схема данных
**Где будут жить данные?**
- Останется ли основная БД (msg_threads, msg_posts)?
- Или чат-сервис получит собственную базу данных?
- Как будет решена согласованность с ACL (followers завязаны на ShipperACL, CarrierACL, дивизионы)?

### 3. Обратная совместимость
**Что происходит с текущими потребителями чата?**
- Public API для внешних систем (`createBookingChatMessage`, `createTrackingChatMessage`) используется в `backend/app/services/messages.js` и вызывается из нескольких мест
- Фронтенд обращается к `/api/v1/discussions` напрямую
- Как будет выглядеть миграция без downtime?

### 4. Связь с identity
**Как чат-сервис будет аутентифицировать запросы?**
- Через тот же JWT?
- Через планируемый `identity`-сервис?
- Как `ms-msg-ws` будет проверять токены — сейчас он импортирует `@shiptify/node-auth` для verifyJWT

### 5. Timeline
**Когда планируется начать разработку?**
- Нет известных тикетов или планов с датами
- Репозиторий создан без описания — неизвестно, кто принял это решение и когда

### 6. Монорепо или отдельные репозитории
**Как соотносится новый репозиторий `chat` с существующими микросервисами?**
- `ms-msg-ws`, `ms-msg-notif`, `ms-msg-offload` находятся в `workspaces/microservices/node/` в репозитории microservices
- Будет ли `chat` включать эти сервисы, или это новый независимый сервис?

---

## Что известно точно

- Репозиторий `chat` создан на GitLab: `gitlab.com/shiptify/apps/chat`
- Код в репозитории: только один файл `.` (пустой README)
- Текущий чат работает и не нарушен — это долгосрочное архитектурное решение
- Частичный вынос уже есть в виде `ms-msg-ws` и `ms-msg-notif`

---

## 🔗 Граф-метаданные
- **id:** `chat.open-questions`
- **type:** module-doc · **domain:** Chat · **status:** implemented
- **confluence:** 631930946 · **repo:** `chat/OPEN-QUESTIONS.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Chat
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

