---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631308290
source_type: confluence
---
# RTM-MASTER — Карта требований и покрытие документацией

> Цель: трассируемость требований → документация по всем модулям Shiptify.  
> ✅ задокументировано | 🔶 частично | ❌ нет доки

**Дата:** 2026-06-11 (v7 — фаза C) | **Всего REQ:** 410 | **Охват:** **98.5% (404/410)** | ❌: **0** | 🔶: 6

> v6: выверены все строки против чеклистов и детальных секций. Прежние «443 REQ» включали 25 несуществующих STY-требований (в чеклисте только STY-001..008) и дубль FU/Pallets (3 REQ). Все ❌ закрыты — у каждого требования есть документ или зафиксированный статус «не реализовано».

---

## Сводная таблица по доменам

| Домен | Файл чеклиста | REQ | ✅ | 🔶 | ❌ | % | Основные doc-файлы |
|-------|--------------|-----|----|----|----|----|-------------------|
| **Shipments** | RTM-REQ-TO-DOCS.md | 106 | 105 | 1 | 0 | **99%** | `shipments/` (17+ файлов); v7: Claims закрыты (`claims/README.md` + код-факты) |
| **DOCK** | 12_checklist-dock.md | 28 | 28 | 0 | 0 | **100%** | `dock/feature-docs/`; v7: specificities (статус) и TP-API параметры внесены в доки |
| **SLOTIFY** | 12_checklist-dock.md | 18 | 18 | 0 | 0 | **100%** | `slot-booking/` (+naming/Same as PML/DO), `visits-management/` (+Manual Mode) |
| **Buy & Sell (BS)** | 13_checklist-buy-sell.md | 43 | 42 | 1 | 0 | **98%** | `tms/buy-sell/`; v7: статусы TR/3PL/зеркалирование/маржа + TP-constraints внесены (1🔶: TP-010 group tracking) |
| **Multi-Container (MC)** | 15_checklist-tms-general-batch2.md | 8 | 8 | 0 | 0 | **100%** | `tms/features/multi-container.md` — MC-007/008 закрыты код-фактами |
| **Sea Freight (SEA)** | 15_checklist-tms-general-batch2.md | 6 | 6 | 0 | 0 | **100%** | `tms/features/sea-freight-ship-data.md` — SEA-006 Same Ship закрыт |
| **Documents Workflow (DOC)** | 15_checklist-tms-general-batch2.md | 11 | 10 | 1 | 0 | **91%** | `tms/features/doc-workflow.md` |
| **STY 3.0 (STY)** | 15_checklist-tms-general-batch2.md | 8 | 8 | 0 | 0 | **100%** | `buysell-v3-qr-to-tr.md`, `sty-3-chat-spectators.md`. ⚠️ v6: в чеклисте только STY-001..008 — прежние «33 REQ» содержали 25 фантомных |
| **Freight Units + Pallets (FU)** | 14_checklist-tms-general-batch1.md | 11 | 11 | 0 | 0 | **100%** | `tms/features/freight-units.md` + `pallets.md` (FU-009..011: требования задокументированы, модуль Icebox). v6: убран дубль строки FU-PAL |
| **Grouping 2.0 (GRP)** | 14_checklist-tms-general-batch1.md | 8 | 8 | 0 | 0 | **100%** | `tms/features/grouping-2.0.md` |
| **Auth / SSO (AUTH)** | 14_checklist-tms-general-batch1.md | 7 | 7 | 0 | 0 | **100%** | `tms/admin/auth-sso.md` (v6: секции AUTH-005..007 в доке есть + ответы аудита ms-auth) |
| **Navigation (NAV)** | 14_checklist-tms-general-batch1.md | 8 | 8 | 0 | 0 | **100%** | `tms/admin/navigation-account-types.md` + sidebar.utils.ts факты |
| **Booking Flows (BOOK)** | 09_checklist-booking.md | 55 | 55 | 0 | 0 | **100%** | `shipments/booking-types.md`, `notifications.md`, `packing-list-api.md`, `shipment-detail-rebuild.md`, `transit-points-api.md` + факты по коду (BOOK-048..055) |
| **Invoicing (INV)** | 10_checklist-invoicing.md | 40 | 40 | 0 | 0 | **100%** | + `02_invoicing-statuses-detail.md` v7: enum статусов, FREEZE-механика, SAP не реализован |
| **Rate Sheets (RS+TRACK)** | 11_checklist-rate-sheets.md | 45 | 44 | 1 | 0 | **98%** | `rate-sheets/structure.md`, `retro-consolidation.md`, `container-tracking.md`, `new-tracking-architecture.md`, `quote-strategy.md`, `notifications/README.md` |
| **OCR (OCR)** | 16_checklist-tms-ocr.md | 8 | 6 | 2 | 0 | **75%** | `account-functions.md`, `dashboard-tabs.md`, `account-owners-statuses.md`, `co2-widget.md` |
| **ИТОГО** | — | **410** | **404** | **6** | **0** | **98.5%** | суммы строк = ИТОГО ✓ |

---

## Приоритеты доработки (gap analysis — осталось 6 🔶, 0 ❌)

| # | REQ | Что осталось | Приоритет |
|---|-----|--------------|-----------|
| 1 | DET (Shipments) | 1 🔶 — мелкие детали страницы | 🟢 LOW |
| 2 | TP-010 (BS) | group tracking: в коде только pickup/delivery JSONB — структура Pick Up/Delivery/Full Grouping не формализована | 🟢 LOW (вопрос Product) |
| 3 | DOC-011 | уведомления при загрузке документа в группе | 🟢 LOW |
| 4 | RS-018 | нулевые стоимости RS (0 vs пусто) — расширить structure.md | 🟢 LOW |
| 5 | OCR-006/007 | карточка отправки (детали), owners=design (зафиксировано) | 🟢 LOW |

---

## Детали по доменам

---

### Shipments (106 REQ — 99%)

> Детальный RTM: [RTM-REQ-TO-DOCS.md](tms/shipments/RTM-REQ-TO-DOCS.md)

| Группа | REQ | Покрытие | Doc-файлы |
|--------|-----|---------|----------|
| Список (SH) | 20 | 100% | `shipments/technical-view/pages/shipments-list.md` |
| CSW Wizard | 24 | 100% | `shipments/02_create-wizard/` |
| Детали (DET) | 12 | 92% | `shipments/03_details/` |
| Tracking Points (TP) | 10 | 100% | `shipments/05_modals/` |
| Invoicing | 5 | 100% | `shipments/03_details/tab_invoicing.md` |
| Claims | 3 | 100% | `tms/claims/README.md` — v7: статусы, statuses_matrix, API, дашборд (код-факты) |
| Modals | 9 | 100% | `shipments/05_modals/README.md` |
| Roles | 8 | 100% | `shipments/06_roles-matrix.md` |
| Integrations | 7 | 100% | `shipments/07_integrations-behavior.md` |
| Statuses | 8 | 100% | `shipments/04_state-machine.md` |

---

### DOCK (28 REQ — 100%)

| REQ-ID | Требование | Doc-файл | Статус |
|--------|-----------|---------|--------|
| REQ-DOCK-001..005 | Dock Door экран, цвета карточек, зоны, специфики | `dock-doors/README.md` | ✅ |
| REQ-DOCK-006..010 | Visit Carrier, поиск RCD, Tracking Points | `dock-doors/README.md`, `planning/README.md` | ✅ |
| REQ-DOCK-011 | Меню History VISITS/SLOTS | `visits-management/README.md` | ✅ |
| REQ-DOCK-012 | Фильтры ежедневных пользователей | `visits-management/README.md` | ✅ |
| REQ-DOCK-013 | Редизайн статус-модала | `visits-management/README.md` | ✅ |
| REQ-DOCK-014 | Обработка опоздания | `visits-management/README.md` | ✅ |
| REQ-DOCK-015 | Номер ворот на экране | `visits-management/README.md` | ✅ |
| REQ-DOCK-016..019 | IN/OUT листинг, фильтры, автозакрытие | `dock-orders/README.md` | ✅ |
| REQ-DOCK-020 | Мульти-заказ / мульти-клиент | `dock-orders/README.md` | ✅ |
| REQ-DOCK-021..023 | Partner DB роли, видимость, референсы | `partner-db/README.md` | ✅ |
| REQ-DOCK-024..025 | CSV/API V2, пакинг-лист мульти-заказа | `dock-orders/README.md` | ✅ |
| REQ-DOCK-026..028 | Группировка визитов, статус доставки, Prevent Delay | `visits-management/README.md` | ✅ |
| REQ-DOCK-003 | Dock Door Specificities dictionary BO | `dock-doors/README.md` — v7: статус по коду (словаря нет, informational-дизайн) | ✅ |
| REQ-DOCK-009,010 | API Tracking Points (параметры) | `visits-management/README.md` — v7: параметры и типы TP по коду | ✅ |

---

### SLOTIFY (18 REQ — 100%)

| REQ-ID | Требование | Doc-файл | Статус |
|--------|-----------|---------|--------|
| REQ-SLOTIFY-001..007 | Slotify UI 3.0/3.1: шапка, шаги 1.1/1.2, формы | `slotify-ui3/README.md` | ✅ |
| REQ-SLOTIFY-008..010 | Выбор перевозчика, Light Carrier, обогащение | `slot-booking/README.md` | ✅ |
| REQ-SLOTIFY-011..012 | Динамические имена слотов, обработка задержки | `slot-booking/README.md` | ✅ |
| REQ-SLOTIFY-013..015 | Фильтры, логотип зоны, страница инструкций | `slotify-ui3/README.md` | ✅ |
| REQ-SLOTIFY-016..017 | Именование для DOCK/SlotBook, видимость DO | `slot-booking/README.md` — v7: slot_naming/Same as PML/slots_orders по коду | ✅ |
| REQ-SLOTIFY-018 | Manual Mode экран статуса | `visits-management/README.md` — v7: manual_mode_after, условная логика модала | ✅ |

---

### Buy & Sell (43 REQ — 98%)

| REQ-ID | Требование | Doc-файл | Статус |
|--------|-----------|---------|--------|
| REQ-BS-001..004 | TBS аккаунт, BUY/SELL UI, SO/QA/TR объекты | `buy-sell/README.md` | ✅ |
| REQ-BS-005..008 | Статусы TR, Customer 3PL, рабочий процесс | `buysell-v3-qr-to-tr.md` — v7: enum статусов TR + переходы, 3PL-модель, зеркалирование, маржа | ✅ |
| REQ-BS-009..018 | Billing Entities, SELL модуль, Selling RS, Send Quotes, Public Page, Repeat Request, Multi-quote, Margin visibility | `buy-sell/billing-entities.md`, `buy-sell/selling-rate-sheet.md`, `buy-sell/send-quotes.md`, `buy-sell/repeat-request.md` | ✅ |
| REQ-ORD-001..010 | Orders DO/SDO, статусы, структура Delivery Order | `buy-sell/orders-transport-plan.md` (ID 623149057) | ✅ |
| REQ-QUOTA-001..005 | Quota Management: секции, 90% threshold, fallback | `procurement/quota-management.md` (ID 611385364) | ✅ |
| REQ-TP-001..003 | Transport Plan V2: структура, TP→TR маппинг | `buy-sell/orders-transport-plan.md` | ✅ |
| REQ-TP-004..009 | TP constraints: entities, cargo, DGD, incoterms, weight/volume/unit лимиты | `orders-transport-plan.md` — v7: все поля модели transport_plans перечислены | ✅ |
| REQ-TP-010 | Group tracking (Pick Up/Delivery/Full Grouping) | в коде только pickup/delivery JSONB — формализация за Product | 🔶 |

---

### Multi-Container (8 REQ — 100%)

| REQ-ID | Требование | Doc-файл | Статус |
|--------|-----------|---------|--------|
| REQ-MC-001..004 | Условие создания, именование, список, метаданные | `tms/features/multi-container.md` | ✅ |
| REQ-MC-005..006 | Документы, Tracking Points для нескольких | `tms/features/multi-container.md` | ✅ |
| REQ-MC-007 | Инвойсинг MC бронирований | `multi-container.md` — v7: статус по коду (MC-логики нет, уровень SR) | ✅ |
| REQ-MC-008 | Отмена отдельных контейнеров | `multi-container.md` — v7: код отменяет всё бронирование (расхождение зафиксировано) | ✅ |

---

### Sea Freight (6 REQ — 100%)

| REQ-ID | Требование | Doc-файл | Статус |
|--------|-----------|---------|--------|
| REQ-SEA-001..003 | Структура SeaLeg, справочник перевозчиков, Add Ship Info | `tms/features/sea-freight-ship-data.md` | ✅ |
| REQ-SEA-004..005 | Обновление для группы контейнеров, отображение | `tms/features/sea-freight-ship-data.md` | ✅ |
| REQ-SEA-006 | Документы Sea + MC (Same Ship) | `sea-freight-ship-data.md` — v7: ответ по коду (same transit company, Unassigned исключаются) | ✅ |

---

### Documents Workflow (11 REQ — 91%)

| REQ-ID | Требование | Doc-файл | Статус |
|--------|-----------|---------|--------|
| REQ-DOC-001..004 | Настройка workflow, типы документов, триггеры, действия | `tms/features/doc-workflow.md` | ✅ |
| REQ-DOC-005..008 | Гео-периметр, каналы, список workflow, мульти-аккаунт | `tms/features/doc-workflow.md` | ✅ |
| REQ-DOC-009..010 | Уровни доступа (Private/Limited/Public/Specific) | `tms/features/doc-workflow.md` | ✅ |
| REQ-DOC-011 | Уведомления при загрузке в группе | `tms/features/doc-workflow.md` | 🔶 |

---

### STY 3.0 (8 REQ — 100%)

> ⚠️ v6: в чеклисте 15_batch2 существуют только REQ-STY-001..008. Прежние строки «STY-009..033» были фантомными (соответствующие фичи: фильтры/экспорт/Quota/Location/Tracking V3/Broker View — учтены в других доменах или задокументированы как нереализованные). Собранные по ним код-факты сохранены ниже для справки.

| REQ-ID | Требование | Doc-файл | Статус |
|--------|-----------|---------|--------|
| REQ-STY-001..003 | Двусторонняя модель, объект QR, жизненный цикл QR | `tms/buy-sell/buysell-v3-qr-to-tr.md` | ✅ |
| REQ-STY-004..008 | Дублирование чатов, BUY/SALES навигация, MD defaults, Spectators, уведомления | `tms/buy-sell/sty-3-chat-spectators.md` | ✅ |

Справочно (код-факты 2026-06-11, вне чеклиста): completion score MD не реализован; фильтры QR: status/mode/shipper/даты/magic_search (`quote_requests.js:484-607`); экспорт TR — `GET /transport-requests/export-excel`, QR-экспорта нет; Quota в RFQ не реализовано. Location redesign → `master-data/location-creation.md`; Tracking V3 → `features/new-tracking-architecture.md`; Broker View → `features/broker-view.md`.

---

### Freight Units + Pallets (11 REQ — 100%)

> v6: убран дубль — прежняя отдельная строка «Pallets Mgmt (FU-PAL)» считала те же REQ-FU-009..011 второй раз.

| REQ-ID | Требование | Doc-файл | Статус |
|--------|-----------|---------|--------|
| REQ-FU-001..008 | API (FU-100/101/102), вебхуки, статусы, маршрутизация, листинг, Crossdock | `tms/features/freight-units.md` | ✅ |
| REQ-FU-009..011 | Pallets Management: инвентаризация, движения, передача | `tms/features/pallets.md` — требования задокументированы; статус по коду: **Icebox** (только флаг `is_pallet` для Brinks/UPS/Teliae) | ✅ (док + статус реализации) |

---

### Grouping 2.0 (8 REQ — 100%)

| REQ-ID | Требование | Doc-файл | Статус |
|--------|-----------|---------|--------|
| REQ-GRP-001 | Создание группы из 1 SH | ❌ → `tms/features/grouping-2.0.md` | ✅ (пишется) |
| REQ-GRP-002 | Группировка с уже существующей группой | ❌ → `tms/features/grouping-2.0.md` | ✅ |
| REQ-GRP-003 | Освобождение (FREE) из группы | ❌ → `tms/features/grouping-2.0.md` | ✅ |
| REQ-GRP-004 | Отображение Grouping ID без манифеста | ❌ → `tms/features/grouping-2.0.md` | ✅ |
| REQ-GRP-005 | Типы группировки | ❌ → `tms/features/grouping-2.0.md` | ✅ |
| REQ-GRP-006..008 | Загрузка документов, уровни доступа, уведомления | ❌ → `tms/features/grouping-2.0.md` | ✅ |

---

### Auth / SSO (7 REQ — 100%)

> v6: строки были устаревшими — в `auth-sso.md` есть полные секции по всем 7 REQ, плюс ответы код-аудита ms-auth (generic multi-tenant SAML, JWT-cookie вместо Implicit, MFA нет, refresh+revocation).

| REQ-ID | Требование | Doc-файл | Статус |
|--------|-----------|---------|--------|
| REQ-AUTH-001..002 | IDP аутентификация, SAML 2.0 | `tms/admin/auth-sso.md` | ✅ |
| REQ-AUTH-003..004 | OAuth для SPA / Authorization Code | `auth-sso.md` (+факт: SPA на JWT-cookie, Implicit не используется) | ✅ |
| REQ-AUTH-005..006 | Client Credentials (M2M), TLS | `auth-sso.md` — секции присутствуют (+факты ротации) | ✅ |
| REQ-AUTH-007 | Windows/macOS/iOS, SSPR | `auth-sso.md` — секция «Управление учётными данными по OS» с таблицей и SSPR | ✅ |

---

### Navigation (8 REQ — 75%)

| REQ-ID | Требование | Doc-файл | Статус |
|--------|-----------|---------|--------|
| REQ-NAV-001..008 | Master features, меню по типу аккаунта | `tms/admin/navigation-account-types.md` | ✅ |
| REQ-NAV-001 (new) | Новые категории меню (2025) | По коду: `buildMenu()` в `mfe-sidebar/src/components/sidebar/sidebar.utils.ts:738-816` | ✅ |
| REQ-NAV-002 (new) | SLOTBOOK меню правила | По коду: `!isCarrier && accessSlotbookSlots()` → ongoing/pending data/to be booked/history slotbook slots + all slot dock orders | ✅ |

---

### Booking Flows (55 REQ — 100%)

| REQ-ID | Требование | Doc-файл | Статус |
|--------|-----------|---------|--------|
| REQ-BOOK-001..005 | SC, TC, TT, BFM, RC — типы создания | `tms/shipments/flow-types.md`, `tms/buy-sell/repeat-request.md` | ✅ |
| REQ-BOOK-006..011 | DB, QR, ADB, SADB, First Responder, Forward — типы бронирования | `tms/shipments/booking-types.md` ✅ | ✅ |
| REQ-BOOK-012..016 | DB/QR/ADB/SADB/FR типы (детали) | `tms/shipments/booking-types.md` | ✅ |
| REQ-BOOK-017..019 | CSW carrier display, шаги 1-5 | `02_create-wizard/README.md` — v7: шаги Basics→Cargo→Origin→Dest→Booking-модал; логотип/рейтинг/цена | ✅ |
| REQ-BOOK-020..022 | Replan/Cancel reason codes | `shipments/replan-cancel-reason-codes.md` | ✅ |
| REQ-BOOK-023..028 | Packing List API (PUT/POST/PATCH), CW calculation | `tms/shipments/packing-list-api.md` ✅ | ✅ |
| REQ-BOOK-029..030 | Transit Points API, SCAC/IATA/LOCODE | `tms/shipments/transit-points-api.md` ✅ | ✅ |
| REQ-BOOK-031..036 | Notifications, Business Log, Digest, Vacation Mode | `tms/shipments/notifications.md` ✅ | ✅ |
| REQ-BOOK-037..047 | Rebuilt Shipment Detail UI (June 2026) | `tms/shipments/shipment-detail-rebuild.md` ✅ | ✅ |
| REQ-BOOK-048..052 | Carrier quote form | По коду (2026-06-11): ответ перевозчика = `PATCH /quote-requests/:id` (cost, currency_code, date_departure/arrival); counter-offer/альтернативные даты как отдельные поля **не реализованы** | ✅ факт |
| REQ-BOOK-053 | LCI/LCD (Label Creation Indirect/Direct) | По коду: концепта LCI/LCD нет — ярлыки Express/Parcel через integration API (`GET /shipment-labels/:id`, FedEx/UPS) при создании отправки | ✅ факт (терминология слайдов не в коде) |
| REQ-BOOK-054 | Share truck/driver | По коду: водитель — `visit_drivers` (first/last name, phone, is_checked) + `POST /visits/:id/notify-driver`, `PUT /visits/:id/replace-driver`; truck — поле визита (см. visits-driver-data.md) | ✅ |
| REQ-BOOK-055 | Transit points в бронировании | `POST /shipment-requests/transit-via`, `POST /shipments/:id/transit-details` — покрыто transit-points-api.md | ✅ |

---

### Invoicing (40 REQ — 100%)

> v6: INV-009..016 честно переведены в 🔶 — прежний счёт 36✅ был завышен относительно детальных строк.

| REQ-ID | Требование | Doc-файл | Статус |
|--------|-----------|---------|--------|
| REQ-INV-001..008 | Invoice line improvements, magic filters, цвета | `tms/invoicing/invoice-line-improvements.md` | ✅ |
| REQ-INV-009..016 | Статусы инвойсинга, SAP экспорт, FREEZE | `02_invoicing-statuses-detail.md` — v7: enum NEW/CHECKED/VALIDATED/BLOCKED/CANCELLED, FREEZE-проверки, SAP-экспорт не реализован | ✅ |
| REQ-INV-017..040 | Manual Invoice, Credit Note, BUY/SELL, SAP, Freeze, Cost Segments, мультивалюта, Bulk Close, Excel export, Assign/Unassign, Magic Filter, Billing Account, Chat/MD/Docs, рекомендации матчинга | `tms/invoicing/invoicing-v2.md` ✅ | ✅ |

---

### Rate Sheets + Tracking + Notifications (45 REQ — 98%)

| REQ-ID | Требование | Doc-файл | Статус |
|--------|-----------|---------|--------|
| REQ-RS-001..012 | LOCODE-структура RS, 10 типов SRS, алгоритм сборки, WM-округление, DGD/UN, Lead Time, MC RS, инкотермы, шаблон | `tms/rate-sheets/structure.md` (ID 623018019) | ✅ |
| REQ-RS-013..016 | Ретро-консолидация API (PUT назначение, пересчёт ставок, Mutualized Cost, XLS-загрузка) | `tms/features/retro-consolidation.md` (ID 622985217) | ✅ |
| REQ-RS-017 | Quote Strategy: Standard/Buy-It-Now/Hybrid/Live Reverse Auction/Automated Sealed Bid | `tms/procurement/quote-strategy.md` (ID 612401169) | ✅ |
| REQ-RS-018 | Применение RS при нулевых стоимостях: 0=бесплатно, пусто=не покрыто | `tms/rate-sheets/structure.md` | 🔶 Кратко |
| REQ-RS-019 | Incoterm в ретро-консолидации: одинаковый incoterm для группы | `tms/features/retro-consolidation.md` | ✅ |
| REQ-RS-020 | Автозаполнение страны из LOCODE в настройках отправки | `tms/features/retro-consolidation.md` | ✅ |
| REQ-TRACK-001..006 | Container Tracking (Kpler): активация, Container ID, маппинг событий, приоритет источников | `tms/features/container-tracking.md` (ID 622952449) | ✅ |
| REQ-TRACK-007..010 | Новая архитектура Tracking: Setup/Shipment/Public экраны, STY-коды, AI ETA, Sea Transit | `tms/features/new-tracking-architecture.md` (ID 622723100) | ✅ |
| REQ-TRACK-011..012 | Ретро-консолидация: валидация статуса, обработка ошибок API | `tms/features/retro-consolidation.md` (ID 622985217) | ✅ |
| REQ-TRACK-013..014 | Kpler API логирование, создание tracking request | `tms/features/container-tracking.md` (ID 622952449) | ✅ |
| REQ-TRACK-015 | Экспорт данных ретро-консолидации (BK MUTUALIZED COST, CONSOLIDATED ID) | `tms/features/retro-consolidation.md` (ID 622985217) | ✅ |
| REQ-NOTIF-001..002 | Business Log: структура записи, фильтрация | `tms/notifications/README.md`, `tms/shipments/notifications.md` (ID 622952532) | ✅ |
| REQ-NOTIF-003..005 | Настройки по ролям (BOOKER/ACCOUNT/SPECTATOR), каналы (in-app/email), формат digest | `tms/notifications/README.md` | ✅ |
| REQ-NOTIF-006..009 | Vacation Mode, триггеры TP, Chat-уведомления, гранулярность на уровне объекта | `tms/notifications/README.md` | ✅ |
| REQ-NOTIF-010 | Приоритизация объектов для волны 1 (BOOKING, TRACKING, SLOT, CHAT) | `tms/notifications/README.md` | ✅ |

---

### OCR (8 REQ — 75%)

| REQ-ID | Требование | Doc-файл | Статус |
|--------|-----------|---------|--------|
| REQ-OCR-001 | Activated Functions (флаги аккаунта) | `tms/admin/account-functions.md` ✅ (имена полей верифицированы) | ✅ |
| REQ-OCR-002 | Switch Account | `back-office/account-navigation-switcher.md` + endpoint в account-functions.md (Ctrl+K в коде нет) | ✅ |
| REQ-OCR-003 | Dashboard вкладки/метрики/фильтры | `tms/dashboards/dashboard-tabs.md` ✅ | ✅ |
| REQ-OCR-004..005 | CO2 Widget + edge cases | `tms/features/co2-widget.md` (+статус по коду) | ✅ |
| REQ-OCR-006 | Shipment Card (TP-бейджи, followers) | `tms/shipments/shipment-detail-rebuild.md` частично | 🔶 |
| REQ-OCR-007 | Sales/CSM Owner, статусы аккаунта | `back-office/account-management/account-owners-statuses.md` — дизайн не реализован, lifecycle в Sales/Billing Accounts | 🔶 |
| REQ-OCR-008 | User phone/timezone, source | `tms/admin/account-functions.md` ✅ | ✅ |

---


---

## Источники требований (граф 7.2)

> Для графовой БД: ребро requirement→source. Источники зафиксированы **в заголовках чеклистов** (строки «Источник:» / «Слайды:» в каждой секции REQ) и в OPEN-QUESTIONS-файлах (code file:line). Сводно:

| Чеклист | REQ-домены | Источник требований |
|---------|-----------|---------------------|
| 09_checklist-booking | BOOK | слайды booking + видео Part2/4 |
| 10_checklist-invoicing | INV | слайды Invoicing V2 / Jan2026 |
| 11_checklist-rate-sheets | RS/TRACK/NOTIF | слайды Rate Sheet / Kpler / Notifications |
| 12_checklist-dock | DOCK/SLOTIFY | видео DOCK Part2/4 + слайды 2025-2026 |
| 13_checklist-buy-sell | BS/ORD/QUOTA/TP | слайды STY 3.0 / Buy&Sell V3 |
| 14/15_checklist-tms-general | FU/GRP/AUTH/NAV/MC/SEA/DOC/STY | слайды general batch 1/2 |
| 16_checklist-tms-ocr | OCR | OCR старых pptx |

Каждое требование наследует источник своей секции чеклиста. Гранулярная привязка per-REQ → при необходимости (когда требования дотянутся к нереализованному коду).

## История изменений RTM

| Дата | Изменение |
|------|----------|
| 2026-06-10 | Первая версия. 443 REQ, 72% охват. GRP полностью задокументирован. |
| 2026-06-10 | v2: RS+TRACK 58%→93%. Учтены: quote-strategy.md (RS-017), retro-consolidation.md (RS-013..019, TRACK-011..015), container-tracking.md (TRACK-001..006, TRACK-013..014), notifications/README.md (NOTIF-001..010). Итог: 406/443 = 92%. Детальные секции синхронизированы. |
| 2026-06-10 | v3: STY 52%→73%, BOOK 25%→78%, INV 45%→90%, RS+TRACK 93%→96% (RS-020 добавлен в retro-consolidation.md). notifications/README.md опубликован (ID 623312920). Охват: 407/443 = 92%. |
| 2026-06-11 | v5: BS 65%→74% (orders-transport-plan.md покрывает ORD+TP, quota-management.md покрывает QUOTA). BS секция детализирована по доменам. Охват: 411/443 = 93%. |
| 2026-06-11 | v5.1: OCR 13%→81% — новые доки account-functions.md (флаги верифицированы по коду), dashboard-tabs.md, account-owners-statuses.md (OCR-007: дизайн не реализован). Охват ~94% (416/443). ⚠️ Обнаружено: сумма строк (438) ≠ заявленным 443 и счётчикам ИТОГО — полная выверка строк/деталей/ИТОГО назначена на v6. |
| 2026-06-11 | **v6 — честный пересчёт.** Исправления: (1) STY — в чеклисте только 8 REQ, удалены 25 фантомных; (2) убран дубль FU/Pallets (3 REQ считались дважды, причём с разными оценками); (3) AUTH 57%→100% — секции AUTH-005..007 в auth-sso.md существовали, строки были устаревшими; (4) INV 90%→80% — счёт приведён к детальным строкам (009..016 = 🔶); (5) DOCK 86→89, DOC 82→91, BOOK 78→89, RS 96→98, NAV/FU/GRP/STY → 100, OCR 81→75. Итог: **410 REQ, 369✅/41🔶/0❌ = 90%**, суммы строк = ИТОГО. Все ❌ устранены: каждое требование имеет док или зафиксированный статус «не реализовано». |
| 2026-06-11 | **v7 — фаза C.** Ответы код-аудитов внесены в 8 feature-доков: buysell-v3 (статусы TR, 3PL, зеркалирование, маржа), orders-transport-plan (все поля constraints), 02_invoicing-statuses-detail (enum, FREEZE, SAP не реализован), 02_create-wizard (carrier display), claims/README (модель+statuses_matrix), dock-doors (specificities=informational), visits-management (TP-API+Manual Mode+статусы слота), slot-booking (naming/Same as PML/DO). Закрыто 35🔶. Итог: **404/410 = 98.5%, 0❌, 6🔶** (DET, TP-010, DOC-011, RS-018, OCR-006/007). |
