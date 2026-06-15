---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632094836
source_type: confluence
---
# Transport Requests — Ответ перевозчика на котировку

## Назначение

Transport Requests — публичная страница для ответа перевозчика на полученную котировку (Transport Request). Перевозчик получает email со ссылкой и может принять или отклонить предложение без регистрации в системе.

## Метод доступа

| Параметр | Значение |
|---|---|
| URL-паттерн | `/transport-requests/:token` |
| Аутентификация | `token` — access-token из таблицы `AccessToken`, тип `TR`. Сервер валидирует через `loadAccessTokenMiddleware`, загружает пользователя (`loadUser`) и записывает сессию в cookie (`setTrSessionCookie`). Apollo Client использует cookie для GraphQL-запросов |
| Данные в `window` | Нет явных `window.*` globals — данные загружаются GraphQL-запросом `transportRequestByToken` (токен передаётся через cookie-сессию) |

**Типичный сценарий:** менеджер в TMS создаёт Transport Request и рассылает котировку перевозчикам. Каждый перевозчик получает уникальную ссылку вида `https://app.shiptify.com/transport-requests/abc123xyz`. Перевозчик видит детали заявки и нажимает «Принять» или «Отклонить».

**Обработка ошибок:** если токен недействителен или TR не найден, сервер возвращает сообщение: *"Sorry! This page isn't any more valid, you probably received another quote link, please check your email."*

## Тип пользователя

Перевозчик — получатель котировки. Не имеет аккаунта в Shiptify. Может быть один из нескольких перевозчиков, которым одновременно отправлена котировка.

## Маршрут (ui-router)

| State | URL | Controller |
|---|---|---|
| `transport-request` | `/public` | `TransportRequestCtrl` |

## Данные, отображаемые перевозчику

Загружаются через `query transportRequestByToken`:

- Название TR, статус, `quote_status` (accepted / declined / pending)
- Запрошенная цена, валюта, детализация стоимости (`prices[]`)
- Даты и времена отправки/прибытия (диапазоны)
- Содержимое груза с габаритами (с поддержкой имперской/метрической системы)
- Общий объём, вес, линейные метры, chargeable weight
- Адреса отправки и назначения
- Вложения (файлы к котировке)
- Данные грузоотправителя (название, логотип, единицы измерения)
- Данные отправителя котировки (имя, email, телефон, язык)
- Режим перевозки
- `valid_to` — срок действия котировки
- `sendDate` — дата отправки

## Единицы измерения

Если `shipper.account.measurement_system === 'imperial'`, все размеры и веса конвертируются в имперские единицы через `convertEntityWithContentsInImperial`. По умолчанию — метрическая система.

## Логика выбора языка

1. Проверяется `localStorage` по ключу `tr-public-page-lang-{id}-{email}`
2. Если нет — берётся язык отправителя котировки (`sender.lang`)
3. Если нет — французский (fallback)

При смене языка страница перезагружается (`window.location.reload()`).

## GraphQL-операции

| Операция | Тип | Назначение |
|---|---|---|
| `transportRequestByToken` | query | Загрузка полных данных TR с ценами, содержимым, адресами |
| `respondToTransportRequest(action: String!)` | mutation | Принять (`"accept"`) или отклонить (`"decline"`) котировку |

## Защита от повторного ответа

Если `quote_status` уже равен `accepted` или `declined`, кнопки ответа не активны (`ctrl.isResponded = true`). Отображается дата ответа и кто ответил (`ctrl.respondEmail`).

## Срок действия котировки

Если `valid_to` задан и `moment(validTo).isBefore(moment())`, флаг `ctrl.isValidityExceeded = true`. Интерфейс показывает, что срок действия истёк.

## Поддерживаемые языки

17 языков: FR, EN, ES, PL, IT, DE, PT, RO, SK, CS, NL, TR, RU, JA, ZH, KO, TH.

## Технический стек

- AngularJS 1.8 + ui-router 1.0
- angular-translate 2.19 + angular-dynamic-locale
- Apollo Client 4
- moment 2.30 (форматирование дат)
- Webpack 5 + SWC
- SCSS

## Открытые вопросы

См. [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).

---

## 🔗 Граф-метаданные
- **id:** `mini-apps.transport-requests`
- **type:** module-doc · **domain:** Mini-Apps · **status:** implemented
- **confluence:** 632094836 · **repo:** `mini-apps/transport-requests/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Mini-Apps
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

