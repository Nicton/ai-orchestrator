---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631701589
source_type: confluence
---
# Quick Shipment — Быстрое создание заявки на перевозку

## Назначение

Quick Shipment — упрощённая форма для сотрудников грузоотправителя, чтобы быстро создать черновик Transport Request (заявки на перевозку) без входа в основной TMS. Страница доступна по токену, привязанному к аккаунту грузоотправителя.

## Метод доступа

| Параметр | Значение |
|---|---|
| URL-паттерн (с токеном) | `/quick-shipment/:token` — сервер загружает shipper, валидирует токен и делает redirect на `/quick-shipment#!` |
| URL-паттерн (прямой) | `/quick-shipment` — SPA, читает токен из cookie |
| Аутентификация | JWT-токен сотрудника, проверяется через `loadAuthUserMiddleware`. IP-whitelist через `checkQuickShipmentIpInWhitelistMiddleware` |
| Данные в `window` | `window.token`, `window.authToken`, `window.shipper`, `window.user` |

**Типичный сценарий:** администратор грузоотправителя создаёт в TMS ссылку Quick Shipment для своего отдела продаж. Менеджер по продажам открывает ссылку и за несколько кликов создаёт заявку на перевозку — без доступа ко всему TMS.

## Тип пользователя

Сотрудник грузоотправителя (менеджер по продажам, логист), которому нужен упрощённый доступ без полного TMS-интерфейса.

## Маршрут (ui-router)

| State | URL | Controller |
|---|---|---|
| `draft` | `/draft` | `ShipmentRequestCtrl` |

## Поля формы

- Адрес отправки — Google Places или поиск по адресам грузоотправителя
- Адрес назначения — Google Places или поиск по адресам грузоотправителя
- Режим перевозки: `Air`, `Sea`, `Road`, `Rail`, `Express`
- Содержимое груза: тип + специфика + количество + габариты (длина/ширина/высота)
- Дата доставки
- Email заявителя

## GraphQL-операции

| Операция | Тип | Назначение |
|---|---|---|
| `addresses(shipper_id, str)` | query | Поиск адресов грузоотправителя по строке |
| `googlePlacesDetails(place_id)` | query | Детали адреса из Google Places |
| `shipmentRequestContentTypes` | query | Типы груза, отфильтрованные по `cargo_type_ids` грузоотправителя |
| `shipmentSpecificities` | query | Специфики груза |
| `newDraftShipmentRequest(input)` | mutation | Создание черновика Transport Request |

## Технический стек

- AngularJS 1.8 + ui-router 1.0
- Apollo Client 4
- Webpack 5 + SWC
- SCSS

## Открытые вопросы

См. [OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).

---

## 🔗 Граф-метаданные
- **id:** `mini-apps.quick-shipment`
- **type:** module-doc · **domain:** Mini-Apps · **status:** implemented
- **confluence:** 631701589 · **repo:** `mini-apps/quick-shipment/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Mini-Apps
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

