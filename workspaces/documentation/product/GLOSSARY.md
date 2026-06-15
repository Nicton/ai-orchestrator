---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631898113
title: Глоссарий Shiptify — аббревиатуры и сущности
source_type: local
---

# Глоссарий Shiptify TMS

Канонический список **аббревиатур** и **доменных сущностей** платформы Shiptify. Используется как навигационный хаб: каждая сущность ссылается на свой модульный документ. Этот файл — точка входа для поиска и графовой навигации («второй мозг»).

> Источники: старые страницы Confluence (05_GLOSSARY), слайды Dec 2025 — Feb 2026, и инвентаризация 317 документов (2026-06-15). Связи между сущностями — см. [SYSTEM-MAP.md](SYSTEM-MAP.md) и `tools/graph.json`.

---

## 1. Аббревиатуры — система и продукт

| Термин | Расшифровка | Описание |
|--------|------------|---------|
| **TMS** | Transport Management System | Основной продукт Shiptify |
| **TML** | TM Light | FreeTM — облегчённый бесплатный тир TMS |
| **TBS** | To Be Sold / Buy & Sell | Тип аккаунта: одновременно Buyer и Seller (3PL) |
| **DKS / DK** | — | Dock / Warehouse тип аккаунта |
| **BO** | Back-Office | Внутренний административный инструмент Shiptify |
| **1CM** | 1Centimeter | Стиль/паттерн навигационной панели BO |
| **CSW** | Create Shipment Wizard | Мастер/модал создания перевозки (8 шагов) |
| **ACL** | Access Control List | Список управления доступом (права на функцию/объект) |
| **RTM** | Requirements Traceability Matrix | Матрица прослеживаемости требований ↔ доков ↔ кода |

## 2. Аббревиатуры — заявки, котировки, бронирование

| Термин | Расшифровка | Описание |
|--------|------------|---------|
| **SR** | Shipment Request | Заявка на перевозку одному перевозчику |
| **QR** | Quote Request | Запрос котировок нескольким перевозчикам |
| **TR** | Transport Request | Запрос в Buy & Sell модуле (от 3PL Customer) |
| **RFQ** | Request for Quote | Входящий запрос котировки (в т.ч. через Public API) |
| **SH** / **Shipment** | — | Подтверждённая отправка (результат SR/QR) |
| **RTB** | Ready to Book | Booking сохранён, но ещё не отправлен/подтверждён (SAVE на CSW step 2) |
| **BFM** | Book For Me | Тип создания: внешний партнёр создаёт booking |
| **SC** | Standard Creation | Стандартное ручное создание через CSW |
| **DB** | Direct Booking | Прямое бронирование к 1 перевозчику |
| **FR** | First Responder | Первый перевозчик ниже максимальной цены получает заказ |

## 3. Аббревиатуры — трекинг и логистика

| Термин | Расшифровка | Описание |
|--------|------------|---------|
| **TP** | Tracking Point | Точка трекинга (departure, transit, arrival, custom) |
| **RTD** | Real-Time Departure | Подтверждение забора груза |
| **RTA** | Real-Time Arrival | Подтверждение доставки |
| **ETA** | Estimated Time of Arrival | Расчётное время прибытия |
| **POD** | Proof of Delivery | Подтверждение доставки (документ) |
| **DN** | Delivery Note | Накладная доставки |
| **CMR** | — | Международная товарно-транспортная накладная (автоперевозки) |
| **STY** | Status Type | Внутренние коды событий трекинга (STY0000…STY9999); полный словарь — 367 кодов в `public-api/src/services/tracking/dictionary/sty.js` |
| **STY0000 / STY9999** | — | Коды начальной и конечной точек в цепочке субподряда |
| **LTL** | Less Than Truckload | Неполная загрузка грузовика |
| **FTL** | Full Truckload | Полная загрузка грузовика |

## 4. Аббревиатуры — груз, локации, упаковка

| Термин | Расшифровка | Описание |
|--------|------------|---------|
| **FU** | Freight Unit | Единица груза (два аспекта: сущность и ключ) |
| **ML** | Master Location | Главная локация (склад, терминал) |
| **PML** | Public Master Location | Публичная главная локация (для разрешения адресов) |
| **ADR** | Accord Dangereuses Route | Стандарт перевозки опасных грузов |
| **DGD** | Dangerous Goods Descriptions | Описания опасных грузов |
| **SSCC** | Serial Shipping Container Code | Серийный код транспортной упаковки (этикетка) |
| **Incoterms** | International Commercial Terms | Условия поставки (FCA, CPT, CIF, …) |

## 5. Аббревиатуры — интеграции и EDI

| Термин | Расшифровка | Описание |
|--------|------------|---------|
| **EDI** | Electronic Data Interchange | Электронный обмен данными |
| **EDIFACT** | EDI For Administration, Commerce and Transport | Стандарт EDI-сообщений |
| **DESADV** | Dispatch Advice | EDI-сообщение об отправке |
| **AS2** | Applicability Statement 2 | Протокол передачи EDI-сообщений |
| **SFTP** | Secure File Transfer Protocol | Защищённая передача файлов (обмен с интеграциями) |
| **SAP** | — | ERP-система; интеграция инвойсов/заказов |
| **RPC** | Remote Procedure Call | Синхронный вызов микросервиса из backend |

## 6. Аббревиатуры — финансы, CRM, роли

| Термин | Расшифровка | Описание |
|--------|------------|---------|
| **MRR** | Monthly Recurring Revenue | Ежемесячный регулярный доход (BO Billing) |
| **AM** | Account Manager | Внутренний менеджер по клиентам (роль BO) |
| **AMOpps** | AM Opportunities | Трекер покрытия продуктами по каждому клиенту |
| **ToPo** | Touchpoint | Запись взаимодействия с клиентом (звонок, встреча) |
| **WHL** | What He Loves | Поле touchpoint: что нравится клиенту |
| **WHH** | What He Hates | Поле touchpoint: что не нравится клиенту |
| **NSM** | New Shipment Monitoring | Оперативный мониторинг новых перевозок (BO Operations) |

---

## 7. Роли пользователей

| Роль | Описание |
|------|---------|
| **Shipper** | Грузоотправитель — создаёт заявки, управляет перевозками |
| **Carrier** | Перевозчик — получает заявки, выполняет перевозки |
| **Driver** | Водитель — использует Driver App для подтверждения pick-up/delivery |
| **Operator / Dock Manager** | Оператор склада — управляет слотами и воротами |
| **Admin** | Администратор — полный доступ к системе |
| **Account Manager (AM)** | Внутренний менеджер Shiptify — работает в Back-Office |
| **Spectator** | Наблюдатель — только просмотр, без действий (через sharing) |
| **Booker** | Создаёт заявки от имени другого аккаунта |
| **3PL Customer** | Клиент 3PL-оператора в Buy & Sell модуле |

---

## 8. Доменные сущности (навигационный индекс)

> Каждая сущность ссылается на свой основной документ. Это карта объектов системы для быстрой навигации.

### Перевозки и заявки

| Сущность | Назначение | Документ |
|----------|-----------|----------|
| **Shipment** | Подтверждённая перевозка (Booking/Tracking/Invoicing/Claims) | [tms/shipments/README.md](tms/shipments/README.md) |
| **Shipment Request (SR)** | Заявка одному перевозчику; статусы Draft→RTB→Pending→Confirmed | [tms/requests/README.md](tms/requests/README.md) |
| **Quote Request (QR)** | Запрос котировок нескольким перевозчикам | [tms/requests/README.md](tms/requests/README.md) |
| **Transport Request (TR)** | Заявка в Buy & Sell (от 3PL Customer) | [tms/buy-sell/README.md](tms/buy-sell/README.md) |
| **Pre-Shipment** | Предварительная отправка в составе заявки (шаг CSW) | [tms/shipments/README.md](tms/shipments/README.md) |
| **Quote** | Предложение цены от Carrier в ответ на QR | [tms/requests/README.md](tms/requests/README.md) |

### Трекинг

| Сущность | Назначение | Документ |
|----------|-----------|----------|
| **Tracking Point (TP)** | Событие в жизни перевозки (departure/arrival/transit) | [tms/tracking/README.md](tms/tracking/README.md) |
| **Claim / Reclamation** | Претензия (задержка, потеря, повреждение) | [tms/tracking/README.md](tms/tracking/README.md) |

### Финансы

| Сущность | Назначение | Документ |
|----------|-----------|----------|
| **Invoice** | Финальный счёт от Carrier | [tms/invoicing/README.md](tms/invoicing/README.md) |
| **Pre-Invoice** | Предварительный счёт перед финальной Invoice | [tms/invoicing/README.md](tms/invoicing/README.md) |
| **Invoice Line** | Строка счёта (позиция + сумма) | [tms/invoicing/invoice-line-improvements.md](tms/invoicing/invoice-line-improvements.md) |
| **Cost Segment** | Статья затрат (фрахт, топливный сбор, страховка) | [tms/invoicing/cost-segments.md](tms/invoicing/cost-segments.md) |
| **External Cost** | Доп. затраты сверх базовой ставки | [tms/invoicing/cost-segments.md](tms/invoicing/cost-segments.md) |
| **Rate Sheet** | Тарифный лист Carrier для Shipper | [tms/rate-sheets/README.md](tms/rate-sheets/README.md) |
| **Financial Group** | Группа для разделения финансовых данных | [back-office/billing-accounts/billing-module.md](back-office/billing-accounts/billing-module.md) |
| **Accounting Entity** | Юрлицо для выставления счетов | [tms/invoicing/README.md](tms/invoicing/README.md) |

### Груз и содержимое

| Сущность | Назначение | Документ |
|----------|-----------|----------|
| **Freight Unit (FU)** | Единица груза (запись + ключ fu_key) | [tms/features/freight-units.md](tms/features/freight-units.md) |
| **Parcel** | Посылка для экспресс-режима (трек-номер FedEx/UPS/DHL) | [tms/parcels/README.md](tms/parcels/README.md) |
| **Customs Invoice** | Таможенная декларация (HS-коды, стоимость) | [tms/customs/README.md](tms/customs/README.md) |
| **Content Type** | Тип содержимого/упаковки груза | [tms/master-data/products.md](tms/master-data/products.md) |

### DOCK / склады

| Сущность | Назначение | Документ |
|----------|-----------|----------|
| **Slot** | Временное окно на складе (погрузка/разгрузка) | [dock/README.md](dock/README.md) |
| **Recurring Slot** | Повторяющийся слот для регулярных рейсов | [dock/README.md](dock/README.md) |
| **Visit** | Физическое прибытие ТС на склад (содержит слоты) | [dock/README.md](dock/README.md) |
| **Dock Door** | Ворота склада (характеристики, статус) | [dock/README.md](dock/README.md) |
| **Location Zone** | Зона на Master Location (группировка ворот/правил) | [dock/README.md](dock/README.md) |
| **Master Location** | Главный склад/терминал с зонами и воротами | [tms/master-data/locations-module.md](tms/master-data/locations-module.md) |

### Конфигурация и шаблоны

| Сущность | Назначение | Документ |
|----------|-----------|----------|
| **Template** | Шаблон перевозки (снимок маршрута) | [tms/templates/README.md](tms/templates/README.md) |
| **Template Group** | Группа шаблонов (повторяющиеся операции) | [tms/templates/README.md](tms/templates/README.md) |
| **Metadata / Metadata Prototype** | Кастомные поля платформы (SAP-номер, темп. режим) | [tms/metadata/README.md](tms/metadata/README.md) |
| **Tag** | Метка для фильтрации/организации | [tms/master-data/README.md](tms/master-data/README.md) |
| **Attachment** | Документ к перевозке (CMR, счёт, POD) | [tms/doc-center.md](tms/doc-center/README.md) |

### Участники и мастер-данные

| Сущность | Назначение | Документ |
|----------|-----------|----------|
| **Account** | Корень multi-tenant изоляции (Shipper/Carrier/Admin/Dock) | [tms/master-data/README.md](tms/master-data/README.md) |
| **Location** | Адрес (склад, офис, пункт pick-up/delivery) | [tms/master-data/locations-module.md](tms/master-data/locations-module.md) |
| **Carrier / Shipper Division** | Структурное подразделение участника | [tms/master-data/README.md](tms/master-data/README.md) |
| **Follower / Follower Plan** | Подписчик объекта + правило автоназначения | [tms/followers/README.md](tms/followers/README.md) |
| **Partner** | Партнёрское отношение Shipper↔Carrier | [tms/carriers/README.md](tms/carriers/README.md) |
| **Team** | Группа пользователей для управления доступом | [tms/admin/self-admin-rights.md](tms/admin/self-admin-rights.md) |

### Группировка и консолидация

| Сущность | Назначение | Документ |
|----------|-----------|----------|
| **Milkrun** | Перевозка с несколькими точками забора/доставки | [tms/milkrun/milkrun-module.md](tms/milkrun/milkrun-module.md) |
| **Cross-Dock** | Кроссдок-консолидация (разбор + переупаковка) | [tms/cross-dock/README.md](tms/cross-dock/README.md) |
| **Retro-Consolidation** | Консолидация стоимости нескольких SR | [tms/features/retro-consolidation.md](tms/features/retro-consolidation.md) |
| **Transport Plan** | План перевозок / группировка заявок | [tms/transport-requests/transport-plan-module.md](tms/transport-requests/transport-plan-module.md) |

### Мультиарендность (Galaxy)

| Сущность | Назначение | Документ |
|----------|-----------|----------|
| **Galaxy** | Группа аккаунтов под owner-аккаунтом (единый брендинг) | [tms/galaxy/galaxy-module.md](tms/galaxy/galaxy-module.md) |
| **Constellation** | Подгруппа в Galaxy (связь carrier↔shipper) | [tms/galaxy/galaxy-module.md](tms/galaxy/galaxy-module.md) |
| **Galaxy Service** | Конфиг требований по режиму доставки | [tms/galaxy/galaxy-module.md](tms/galaxy/galaxy-module.md) |
| **Multivision** | Сводный контроль-центр для аккаунтов Galaxy | [tms/control-tower/multivision-module.md](tms/control-tower/multivision-module.md) |

### Back-Office / CRM

| Сущность | Назначение | Документ |
|----------|-----------|----------|
| **Sales Account** | Коммерческая сущность CRM (уровень AM) | [back-office/sales-accounts/sales-am-module.md](back-office/sales-accounts/sales-am-module.md) |
| **Billing Account** | Контракт/счёт (уровень ниже Sales Account) | [back-office/billing-accounts/billing-module.md](back-office/billing-accounts/billing-module.md) |
| **Touchpoint (ToPo)** | Запись взаимодействия AM с клиентом | [back-office/sales-accounts/sales-am-module.md](back-office/sales-accounts/sales-am-module.md) |
| **Opportunity** | Возможность up-sell для клиента | [back-office/sales-accounts/sales-am-module.md](back-office/sales-accounts/sales-am-module.md) |

### Интеграции

| Сущность | Назначение | Документ |
|----------|-----------|----------|
| **Integration / Active Integration** | Подключение к внешней системе для пары Shipper+Carrier | [integrations/README.md](integrations/README.md) |
| **Integration Settings** | Настройки конкретной интеграции | [integrations/setup-guide.md](integrations/setup-guide.md) |
| **Webhook** | Входящее/исходящее сообщение интеграции | [integrations/webhooks/README.md](integrations/webhooks/README.md) |
| **Public API Key** | Ключ доступа внешнего интегратора | [integrations/public-api/README.md](integrations/public-api/README.md) |

### AI

| Сущность | Назначение | Документ |
|----------|-----------|----------|
| **AI Reader** | Распознавание документов (Textract → Gemini) → создание SR | [ai/features/ai-reader.md](ai/features/ai-reader.md) |
| **Quote Strategy** | Авто-выбор перевозчика (5 стратегий) — в планах | [ai/features/quote-strategy.md](ai/features/quote-strategy.md) |

---

## 9. Технические термины

| Термин | Описание |
|--------|---------|
| **My Site** | Раздел со списком Shipments, привязанных к ML пользователя; переключатель IN/OUT |
| **Stringkey** | Внутренняя система i18n string-key для переводов |
| **TARGET_CARRIER_ID** | ID в BO, связывающий нового carrier-user с существующим carrier-аккаунтом |
| **Linked Booking / Linked Request** | Связь parent-child между Bookings/TR при дублировании (Repeat) |
| **QUICK CREATE** | Быстрое создание carrier без детального флоу |
| **Noob carrier** | Carrier без активных пользователей и неактивированного аккаунта |
| **Galaxy Mentor** | Наставник Galaxy: sales member / csm member |

---

## 10. Статусы (справочник)

### Статусы SR
Draft · Ready to Book (RTB) · Pending · Confirmed · Booked · On Quote · Declined · Cancelled

### Статусы TR (Buy & Sell)
Created · Pending · Quoted · Quote Sent · Quote Accepted · Quote Declined · Booked

### Статусы трекинга
Planned · Expected Pick-up · In Transit (Estimate) · In Transit · Expected Delivery · Delivered (Estimate) · Delivered · Slot Confirmed · Cancelled

### Статусы инвойсинга
Not Priced · Waiting for Invoice · Gap Analysis Ongoing · Blocked · Checked · Invoiced · Closed

---

## Заметки о RTB

> RTB (Ready-to-book): создаётся через SAVE на CSW step 2 (вместо отправки заявки). В Qase-кейсе 1340 прежняя формулировка про авто-фильтр «Draft» — неточность (copy-paste из кейса 1339); статусы `new` (Draft) и `ready_to_book` раздельны (код: `shipment_request.js:718,825`).

---

## 🔗 Граф-метаданные
- **id:** `glossary`
- **type:** reference · **domain:** TMS · **status:** implemented
- **confluence:** 631898113 · **repo:** `GLOSSARY.md`
- **code_refs:** `public-api/src/services/tracking/dictionary/sty.js` (STY-коды)
- **modules:** TMS, DOCK, Integrations, Back-Office, AI, Microservices
- **references:** SYSTEM-MAP, tms.shipments, tms.requests, tms.invoicing, tms.tracking, dock, integrations, back-office.sales, ai.features.ai-reader
- **requirements:** —
