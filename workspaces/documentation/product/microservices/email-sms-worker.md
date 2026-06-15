---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629506110
source_type: confluence
---
# Emailing — Воркер Email/SMS (отдельный сервис)

**emailing** (`workspaces/emailing`) — отдельный воркер отправки Email и SMS. Это **не** `microservices/msg-email`: чистый Node.js worker на Kue (Redis), а не NestJS-микросервис. Ранее имел только упоминания — заполняем пробел.

> Репозиторий: `workspaces/emailing`.

---

## 1. Зачем (бизнес)

Асинхронная доставка уведомлений вынесена в отдельный воркер, чтобы:
- отправлять Email (через **Mailgun**) и SMS (через API-провайдера) вне основного запроса;
- ретраить неуспешные отправки с backoff (Email — до 5 попыток, SMS-статус — задержки 5/15/30/60 мин);
- обрабатывать bounce/complaint-списки Mailgun;
- санитизировать HTML писем.

---

## 2. Как устроено (код, file:line)

| Компонент | Файл | Назначение |
|-----------|------|-----------|
| Инициализация | `app/worker.js:1-50` | Kue + 8 worker-процессов, processors |
| Email processor | `app/worker.js:125-158` | retry-логика (max 5, backoff 5 мин) |
| SMS processor | `app/worker.js:173-203` | отправка SMS, callback в очередь `smsNotifier` |
| SMS status | `app/worker.js:205-266` | polling статуса с экспоненциальным backoff |
| Email task | `app/tasks/send_email.js:1-60` | EJS-шаблоны, `EmailTemplates`, Mailgun API |
| Bounces | `app/tasks/mailgun_bounses.js` | обработка bounce/complaint |
| Санитайзер | `app/tasks/sanitize-email.js` | очистка HTML |

**Очереди (вход):** `send_email`, `send_sms`, `check_sms_status`, `add_email_bounces`. **Выход:** `smsNotifier`. **Healthcheck:** HTTP `config.healthz.port`. Логи — `@shiptify/lib-core` (см. [core-libs.md](core-libs.md)), алерты — Telegram, маскирование секретов — `slow-redact`.

---

## 3. Где найти и настроить

- **Провайдеры:** ключи Mailgun и SMS-API — в конфиге/окружении сервиса.
- **Шаблоны писем:** библиотека `EmailTemplates` + EJS.
- **Масштабирование:** число worker-процессов (по умолчанию 8) в `app/worker.js`.

---

## 4. Сценарии

1. **Отправка письма.** Backend кладёт задачу `send_email` → воркер рендерит EJS-шаблон → Mailgun API. При сбое — до 5 ретраев.
2. **SMS с подтверждением.** Задача `send_sms` → отправка → `check_sms_status` опрашивает доставку (5/15/30/60 мин) → результат в `smsNotifier`.
3. **Bounce-обработка.** Mailgun-события прилетают в `add_email_bounces` → адрес помечается, повторные отправки на него не выполняются.

---

## Связанные документы

- [README.md](README.md) — карта микросервисов
- [core-libs.md](core-libs.md) — общие библиотеки (логирование)
- [attachments-generate.md](attachments-generate.md) — генерация вложений (PDF к письмам)

---

## 🔗 Граф-метаданные
- **id:** `microservices.email-sms-worker`
- **type:** module-doc · **domain:** Microservices · **status:** implemented
- **confluence:** 629506110 · **repo:** `microservices/email-sms-worker.md`
- **code_refs:** `emailing/app/worker.js:1-50`, `emailing/app/worker.js:125-158`, `emailing/app/worker.js:205-266`, `emailing/app/tasks/send_email.js:1-60`
- **modules:** Microservices
- **references:** microservices.overview, microservices.core-libs, microservices.attachments-generate
- **requirements:** нет требований — инфраструктурный воркер (источник: код `workspaces/emailing`)
