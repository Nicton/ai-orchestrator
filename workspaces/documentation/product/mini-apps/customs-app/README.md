---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631668804
source_type: confluence
---
# Customs App — Портал для таможенного агента

## Назначение

Customs App — защищённый портал для таможенных агентов. Агент получает ссылку с JWT-токеном и видит полные данные конкретной отгрузки: реквизиты, груз, трекинговые точки, таможенные документы. Агент может обновлять фактические даты прибытия/отправки и заполнять поля таможенных метаданных.

## Метод доступа

| Параметр | Значение |
|---|---|
| URL-паттерн (первичный) | `/customs/:token` — сервер верифицирует JWT, извлекает `shipmentId` и делает redirect на `/customs#!/shipments/:id` |
| URL-паттерн (прямой) | `/customs` — страница SPA, читает токен из cookie |
| Аутентификация | JWT-токен с роль `customs`. Проверяется через `jwtMiddleware` + `authMiddleware('customs')` |
| Данные в `window` | `window.token`, `window.currUser`, `window.tokenInfo` (содержит `trackingId` и `shipmentId`), `window.websocketBackend` |
| IP Whitelist | Поддерживается: `checkCustomsIpInWhitelistMiddleware` ограничивает доступ по IP если настроен |

**Типичный сценарий:** менеджер в TMS генерирует таможенную ссылку для конкретной отгрузки и конкретного трекинг-пункта. Ссылка отправляется таможенному агенту по email. Агент открывает страницу, видит данные отгрузки и обновляет таможенные поля.

## Тип пользователя

Таможенный агент — внешний участник, работающий с таможенным оформлением. Не имеет аккаунта в Shiptify TMS.

## Маршрут (ui-router)

| State | URL | Controller |
|---|---|---|
| `shipment` | `/shipments/:id` | `ShipmentViewCtrl` |

## Данные, доступные агенту

Загружаются одним GraphQL-запросом `shipmentForCustomsByTracking(id, tracking_point_id)`:

- Грузоотправитель и перевозчик (название, логотип)
- Адреса отправки и назначения
- Даты и время по заявке на перевозку (shipping / arrival date ranges)
- Содержимое груза (типы, количество, объём, вес)
- Все трекинговые точки с позициями и адресами
- Вложения (CMR, таможенные документы) с типами и метками
- Метаданные с определениями прототипов (таможенные значения, декларируемые стоимости)

## GraphQL-операции

| Операция | Тип | Назначение |
|---|---|---|
| `shipmentForCustomsByTracking(id, tracking_point_id)` | query | Загрузка полных данных отгрузки с таможенными полями |
| `updateTrackingPointByCustoms(input)` | mutation | Обновление фактической даты/времени трекинговой точки |
| `updateMetadataByCustoms(input)` | mutation | Обновление таможенных метаданных (декларируемые значения и т.д.) |
| `attachmentAddedToShipment(shipmentId)` | subscription | Real-time уведомление о новом вложении к отгрузке |

## Real-time подписка

Customs App — единственное мини-приложение, использующее GraphQL Subscription. При добавлении нового вложения к отгрузке (например, водитель загружает CMR) агент видит обновление мгновенно без перезагрузки страницы. WebSocket endpoint передаётся через `window.websocketBackend`.

## Технический стек

- AngularJS 1.8 + ui-router 1.0
- angular-translate 2.19
- ng-file-upload (загрузка вложений)
- Apollo Client 4 (с поддержкой WebSocket-подписок)
- Webpack 5 + SWC
- SCSS

## Открытые вопросы

См. [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).

---

## 🔗 Граф-метаданные
- **id:** `mini-apps.customs-app`
- **type:** module-doc · **domain:** Mini-Apps · **status:** implemented
- **confluence:** 631668804 · **repo:** `mini-apps/customs-app/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Mini-Apps
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

