---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632815634
source_type: confluence
---
# Shiptify Chat

## Что это

Чат в Shiptify — это встроенная система обмена сообщениями, привязанная к сущностям платформы: shipment, booking (quote request), claim, transport request, slot, visit. Чат является частью основного backend-репозитория и реализован как подсистема треды/посты (thread/post).

**Отдельного репозитория `chat` пока нет.** Репозиторий `gitlab.com/shiptify/apps/chat` существует, но содержит только дефолтный README GitLab. Это новый пустой репозиторий — вероятно, зарезервированный под будущий вынос чата в микросервис.

---

## Текущее состояние: чат встроен в main app

### Модель данных

Чат реализован через три ключевые модели в `backend/app/models/`:

| Модель | Таблица | Назначение |
|---|---|---|
| `MsgThread` | `msg_threads` | Тред, привязанный к сущности (shipment, claim, quote_request и т.д.) |
| `MsgPost` | `msg_posts` | Отдельный пост (сообщение или системное событие) в треде |
| `MsgMember` | `msg_members` | Участник треда |
| `MsgNotifUser` | `msg_notif_users` | Уведомление пользователя о новых постах |

`MsgThread` связан с конкретной сущностью через FK-поля: `shipment_id`, `quote_request_id`, `claim_id`, `transport_request_id`, `slot_id`, `visit_id`.

### Типы постов (`MsgPost.Types`)

```
act   — системное действие (изменение статуса, подтверждение TP и т.д.)
msg   — пользовательское сообщение (обычный чат)
att   — одно вложение
atts  — несколько вложений
tp    — подтверждение tracking point
inv   — invoicing-событие
```

### Scopes (контекст треда)

```
quotes            — в рамках booking/quote request
tracking          — в рамках shipment tracking
invoicing         — в рамках invoicing
claims            — в рамках claim
transport_request — transport request
slots             — slot
visits            — visit
```

### Followers (подписчики)

Система followers определяет, кто получает уведомления и кто видит чат по сущности. Реализована в `backend/app/services/followers.js` и `followers/`.

Логика автоматического добавления followers:
- Shipper-пользователи по дивизиону, к которому относится shipment
- Carrier-пользователи
- Partner-аккаунты (spectators, bookers) через `AccountConnectionSetting`
- Пользователи локаций (master location) через `UserLocationZone`
- Пользователи по default locations

Типы участников: `shipper`, `carrier`, `spectator`, `booker`.

### Системные сообщения

Системные сообщения (тип `act`) создаются автоматически при:
- Подтверждении tracking point (TP) — тип `tp`
- Изменении статуса booking/shipment
- Создании вложений — тип `att`, `atts`
- Invoicing-событиях — тип `inv`

Инициирует создание системных сообщений: `backend/app/services/messages.js` через `createMessage()`.

### @Mentions

Поддержка @mentions встроена в систему обработки постов. При создании поста парсятся упоминания пользователей — они получают персональные уведомления через `serviceNotifications`.

### Real-time доставка

Чат использует WebSocket для real-time-уведомлений. Текущая архитектура (transition-период):

1. **Legacy sockets** — `backend/app/lib/sockets.js` (прямое socket.io на стороне основного приложения)
2. **Микросервис `ms-msg-ws`** — отдельный микросервис (TypeScript, Socket.IO + Redis Adapter), к которому backend делает RPC-вызовы через `rpc-msg-ws.js`:
   - `POST /rpc/v1/notify-users` — уведомить конкретных пользователей
   - `POST /rpc/v1/emit-with-acl` — уведомить с учётом ACL
3. **Микросервис `ms-msg-notif`** — управление статусом прочитанности треда, RPC: `POST /rpc/v1/read-thread`
4. **Микросервис `ms-msg-offload`** — офлоад сообщений (async processing)

### Email-уведомления по чату

Cron-задача `backend/app/cron/email-chat-activities.js` агрегирует непрочитанные сообщения и отправляет email-дайджесты участникам треда через `backend/app/services/emails/chat.js`.

### API

Основные эндпоинты чата в `backend/app/routes/api/discussions.js`:
- `GET /api/v1/discussions` — получить треды
- `POST /api/v1/discussions` — создать пост в треде
- `GET /api/v1/discussions/:id/posts` — получить посты

Public API для внешних систем (`backend/app/services/messages.js`):
- `createBookingChatMessage(params)` — добавить сообщение в чат booking
- `createTrackingChatMessage(params)` — добавить сообщение в чат shipment
- Поддержка `custom_sender` (имя/email внешнего отправителя)

---

## Текущая архитектура (схема)

```
┌────────────────────────────────────┐
│         Frontend (SPA)             │
│  Chat UI компонент в карточке      │
│  shipment / booking / claim        │
└────────────┬───────────────────────┘
             │ HTTP + WebSocket
             ▼
┌────────────────────────────────────┐
│    Main App Backend (Node.js)      │
│  /api/v1/discussions               │
│  services/discussions.js           │
│  services/followers.js             │
│  services/messages.js              │
│  models: MsgThread, MsgPost,       │
│          MsgMember, MsgNotifUser   │
└────┬───────────┬────────────────────┘
     │ RPC       │ RPC
     ▼           ▼
┌─────────┐  ┌──────────────┐
│ms-msg-ws│  │ms-msg-notif  │
│WebSocket│  │Read status   │
│delivery │  │management    │
└─────────┘  └──────────────┘
```

База данных: таблицы `msg_threads`, `msg_posts`, `msg_members`, `msg_notif_users` в основной PostgreSQL.

---

## Репозиторий `chat` (пустой)

Репозиторий `gitlab.com/shiptify/apps/chat` создан, но **не содержит кода** — только дефолтный шаблонный README GitLab. Это означает:

- Намерение вынести чат в отдельный микросервис зафиксировано через создание репозитория
- Разработка ещё не начата
- Текущие пользователи чата продолжают работать через main app

См. [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) — открытые вопросы по планированию.

---

## 🔗 Граф-метаданные
- **id:** `chat`
- **type:** overview · **domain:** Chat · **status:** implemented
- **confluence:** 632815634 · **repo:** `chat/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Chat
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

