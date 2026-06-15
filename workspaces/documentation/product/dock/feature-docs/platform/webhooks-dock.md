---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631767106
source_type: confluence
---
# Webhooks — события DOCK для внешних систем (инструкция)

> Сверено с кодом 2026-06-13 | `controllers/api/webhooks.js`, `services/webhooks/provider.js`, `service.js`, `helpers/dataBuilder.js`, `models/webhook.js`, `webhook_credentials.js`, `config/default.json`

## Зачем (бизнес-контекст)

WMS/ERP клиента должна реагировать на происходящее на площадке **в момент события**, а не опрашивая API по таймеру: ворота открылись — готовь приёмку; бронь создана — резервируй ресурс; расписание изменилось — пересчитай план. Webhook — это исходящий HTTP-вызов от Shiptify в систему клиента при наступлении события.

---

## 1. Где найти и как настроить (UI)

**Путь:** основное приложение → **Administration → Webhooks** (раздел «all account webhooks», `frontend/public/app/administration`, пункт `webhooks`). Настройка на уровне аккаунта; доступ — администратор аккаунта.

**Шаги:**
1. Создать webhook: указать **URL** приёмника и **HTTP-метод** (POST/PUT).
2. Выбрать **тип авторизации** (как Shiptify докажет приёмнику, что вызов от него) — см. §3.
3. Подписать webhook на **события** (можно несколько на один URL) — см. §4.
4. Получить **secret** для проверки подписи (`GET /webhooks/secret`).

> Альтернатива UI — REST API (см. §2): для программной настройки интеграторами.

---

## 2. API регистрации

| Действие | Метод + путь |
|----------|--------------|
| Список вебхуков аккаунта | `GET /api/v1/webhooks` |
| Создать | `POST /api/v1/webhooks` |
| Изменить | `PATCH /api/v1/webhooks/:id` |
| Удалить | `DELETE /api/v1/webhooks/:id` |
| Назначить события | `POST /api/v1/webhooks/:id/events` |
| Привязать (assign) | `POST /api/v1/webhooks/:id/assign` |
| Получить secret для HMAC | `GET /api/v1/webhooks/secret` |

**Тело создания** (`models/webhook.js`): `url` (TEXT, обязательно), `method` (STRING — POST/PUT), `account_id` + привязка credential. Credential (`models/webhook_credentials.js`): `type` (тип авторизации), `key`, `auth_data` (JSON — зависит от типа).

---

## 3. Типы авторизации приёмника

Shiptify поддерживает 4 типа (`provider.js:110-117`) — это то, **как ваш сервер проверяет право на приём вызова**:

| Тип | Что отправляется | Поля `auth_data` | Когда использовать |
|-----|------------------|------------------|--------------------|
| **PUBLIC_AUTH** | Ничего (только тело с подписью) | — | Открытый endpoint; защита только HMAC-подписью |
| **QUERY_AUTH** | Параметры в query-string URL | ключ/значение | Приёмник проверяет токен в URL |
| **BASIC_AUTH** | Заголовок `Authorization: Basic …` | username + password | Стандартная Basic-аутентификация |
| **HEADER_AUTH** | Произвольные заголовки | имя+значение заголовка(ов) | API-ключ в кастомном заголовке (`X-Api-Key` и т.п.) |

При любом типе тело дополнительно подписывается HMAC (§5) — авторизация и подпись работают вместе.

---

## 4. События DOCK и payload

При наступлении события Shiptify ставит задачу в очередь и шлёт POST/PUT на ваш URL. Подписка — `POST /webhooks/:id/events`.

| Событие (код) | Когда срабатывает | Что внутри payload |
|---------------|-------------------|--------------------|
| `create_visit` | Создан визит | Объект визита (см. ниже) |
| `update_visit` | Изменён статус/время визита | Объект визита с новым состоянием |
| `cancel_visit` | Визит отменён | Объект визита (status=canceled) |
| `inform_automatic_gate` | Передача визитёров автоматическим воротам (Peripass и т.п.) | Визит + водители/ТС для СКУД |
| `create_recurring_slot` | Создано регулярное расписание | Объект recurring slot (зона, дни, время) |
| `update_slot_orders` | Изменена связка слот↔заказы | Слот + обновлённый список заказов |

**Структура объекта визита** (`buildVisitData`, dataBuilder.js:2322): `id`, `name`, `status`, окна `min_date`/`max_date`, `location_id` (адрес), `carrier_name`, вложенные массивы:
- `slots[]` — слоты визита (`buildSlot`: зона, время, статус, содержимое + связанные `slots_orders`);
- `drivers[]` — водители (`buildDriver`: имя, телефон, `is_checked` — активный первым);
- `transports[]` — ТС (`buildTransport`: номера тягача/прицепа, `is_checked`).

---

## 5. Подпись HMAC-SHA256 (обязательная проверка на приёмнике)

К **каждому** телу Shiptify добавляет три поля (`provider.js:51-72`):

```json
{
  "...данные события...": "...",
  "timestamp": 1718280000,
  "token": "<64 hex случайных символа>",
  "signature": "<hmac_sha256(timestamp + token, secret)>"
}
```

Алгоритм: `signature = HMAC_SHA256(key = ваш_secret, message = timestamp + token)` — конкатенация timestamp и token, ключ — secret из `GET /webhooks/secret`.

**Проверка на вашей стороне (псевдокод):**
```
expected = HMAC_SHA256(secret, body.timestamp + body.token)
if (expected !== body.signature) -> отклонить (401)
// опционально: отклонять, если body.timestamp старше N минут (анти-replay)
```

`token` случаен на каждый вызов — подпись не переиспользуется.

---

## 6. Доставка, ретраи, ошибки

- **Очередь**: события асинхронные (delayed task), не блокируют операцию в Shiptify.
- **Ретраи** (`config.webhooks.retry_delays`): **[30, 60, 240, 1440]** — повторы через 30 сек / 1 мин / 4 мин / 24 мин (4 попытки, отсчёт от первого вызова).
- **Неуспех**: HTTP-ответ не 2xx (`response.ok === false`) — код и тело ошибки логируются, запускается ретрай. Приёмник должен возвращать **2xx быстро** (приняли → обрабатываем у себя асинхронно).
- **Идемпотентность**: из-за ретраев событие может прийти повторно — дедуплицируйте по бизнес-ключу (id визита + статус) или по `token`.

---

## 7. Переменные и шаблоны

URL и заголовки **статичны** — подстановок вида `{{visit_id}}` в URL нет (проверено по коду). Вся вариативность — в **теле**: один URL принимает все события, на которые подписан; различать их приёмник должен по содержимому payload и по своей подписке. Нужны разные URL под разные события — заведите отдельные вебхуки с разными подписками.

---

## 8. Полный реестр событий платформы

DOCK — подмножество. Всего ~25 типов (shipment, SR, invoice, tracking, pricing, metadata, locations, FU…) — см. [integrations/webhooks](../../../integrations/webhooks/README.md). Механика (auth, HMAC, ретраи) едина для всех.

## Сценарии использования

1. **Синхронизация WMS**: подписка на `create_visit`/`update_visit`/`cancel_visit` → WMS всегда знает план приёмки без опроса API.
2. **СКУД площадки**: `inform_automatic_gate` → система контроля доступа заранее получает список ожидаемых водителей/ТС, открывает шлагбаум по номеру.
3. **Календарь ERP**: `create_recurring_slot` → регулярные окна площадки попадают в планировщик ERP.
4. **Перепривязка поставок**: `update_slot_orders` → ERP обновляет, какие заказы поедут каким слотом.

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.platform.webhooks-dock`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 631767106 · **repo:** `dock/feature-docs/platform/webhooks-dock.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

