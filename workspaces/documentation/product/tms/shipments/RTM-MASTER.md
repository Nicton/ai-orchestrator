---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631046247
source_type: confluence
---
# RTM Master — Требования → Документация
## TMS: все домены, 443 требования

> Проверка: каждое требование из чек-листов (08-16) сопоставлено с существующей документацией.
> Статус: ✅ Документация есть | 🔶 Частично | ❌ Нет документации

---

## Итоговая таблица по доменам

| Домен | Файл RTM | Всего REQ | ✅ Есть | 🔶 Частично | ❌ Нет | % покрытия |
|-------|---------|-----------|---------|------------|-------|-----------|
| Shipments (из кода) | [RTM-REQ-TO-DOCS.md](RTM-REQ-TO-DOCS.md) | 106 | 103 | 3 | 0 | **97%** |
| Booking | [rtm/RTM-01-booking.md](rtm/RTM-01-booking.md) | 55 | 36 | 11 | 8 | **65%** |
| Invoicing | [rtm/RTM-02-invoicing.md](rtm/RTM-02-invoicing.md) | 40 | 32 | 6 | 2 | **80%** |
| Rate Sheets + Tracking + Notif | [rtm/RTM-03-rate-sheets.md](rtm/RTM-03-rate-sheets.md) | 45 | 0 | 28 | 17 | **0% full** |
| Dock + Slotify | [rtm/RTM-04-dock.md](rtm/RTM-04-dock.md) | 46 | 12 | 28 | 6 | **26%** |
| Buy & Sell + Orders | [rtm/RTM-05-buy-sell.md](rtm/RTM-05-buy-sell.md) | 43 | 18 | 17 | 8 | **42%** |
| General Batch 1 (Grouping/FU/Auth/Nav) | [rtm/RTM-06-general-batch1.md](rtm/RTM-06-general-batch1.md) | 42 | 8 | 20 | 14 | **19%** |
| General Batch 2 (MC/Sea/Docs/STY) | [rtm/RTM-07-general-batch2.md](rtm/RTM-07-general-batch2.md) | 58 | 0 | 19 | 39 | **0% full** |
| OCR | [rtm/RTM-08-ocr.md](rtm/RTM-08-ocr.md) | 8 | 3 | 2 | 3 | **38%** |
| **ИТОГО** | | **443** | **212** | **134** | **97** | **48%** |

---

## Что задокументировано хорошо ✅

| Домен | Документация |
|-------|-------------|
| Shipments core (список, CSW wizard, TP, роли) | `02_create-wizard/`, `03_details/`, `05_modals/`, `06_roles-matrix.md` |
| Flow Types (все 10 типов создания + 7 типов бронирования) | `flow-types.md` |
| Cancel / Replan Reason Codes | `replan-cancel-reason-codes.md` |
| Rebuilt UI (Quick Status Update, CO2 пиктограмма, Actions panel) | `shipment-detail-rebuild.md` |
| Invoicing процесс (пре-инвойсы, статусы, фильтры, magic filters) | `invoicing/README.md` + `invoice-line-improvements.md` |
| Buy & Sell аккаунт, Billing Entities, Selling Rate Sheet, Send Quotes | `buy-sell/` |
| Slotify UI 3.0/3.1, SlotBook carrier selection, Dynamic slot naming | `slots/slotify-ui-3.md`, `slots/slotbook-carrier-selection.md`, `slots/dynamic-slot-naming.md` |
| CO2 Widget | `features/co2-widget.md` |
| Notifications (базовый уровень) | `notifications/README.md` |

---

## Главные пробелы (❌ нет документации)

| Группа требований | Кол-во REQ | Что нужно написать |
|------------------|-----------|-------------------|
| **API: Packing List** (PUT/POST/PATCH /contents) | 4 | `api/packing-list-api.md` |
| **API: Transit Points** (POST /transit, валидация SCAC) | 2 | добавить в `07_integrations-behavior.md` |
| **Container Tracking (Kpler)** — активация, маппинг событий, приоритет | 5 | `features/container-tracking.md` |
| **Retro Consolidation** — API, пересчёт ставок, mutualized cost | 5 | `features/retro-consolidation.md` |
| **New Tracking Architecture** (3 экрана, STY-коды, публичная страница) | 3 | `tracking/new-tracking-architecture.md` |
| **Multi Container** — создание, именование, управление | 8 | `features/multi-container.md` |
| **Sea Freight Ship Data** — SeaLeg, Add Ship Info | 6 | `features/sea-freight-ship-data.md` |
| **Expected Orders (EO)** | 4+ | `features/expected-orders.md` |
| **Auth / SSO (SAML 2.0, OAuth, TLS)** | 7 | `admin/auth-sso.md` |
| **Pallets Management** | 3 | низкий приоритет |
| **Dashboard** (вкладки, метрики, фильтры) | 1 | `dashboards/README.md` |
| **BO Account Management** (Sales/CSM Owner, статусы) | 1 | `back-office/account-mgmt.md` |
| **User Profile** (телефон, timezone) | 1 | `admin/user-profile.md` |
| **Billing Account enhancement** (buyer accounts linkage) | 2 | добавить в `invoicing/` |

---

## Приоритет написания документации (по критичности)

### P0 — Нужно в первую очередь

| REQ | Тема | Предлагаемый файл |
|-----|------|-------------------|
| REQ-BOOK-023..026 | API Packing List (PUT/POST/PATCH) | `api/packing-list-api.md` |
| REQ-MC-001..008 | Multi Container — полный функционал | `features/multi-container.md` |
| REQ-SEA-001..006 | Sea Freight Ship Data (SeaLeg, Add Ship Info) | `features/sea-freight-ship-data.md` |
| REQ-TRACK-001..006 | Container Tracking Service (Kpler) | `features/container-tracking.md` |
| REQ-TRACK-011..012 | Retro Consolidation API + валидация | `features/retro-consolidation.md` |

### P1 — Важно, но не срочно

| REQ | Тема | Предлагаемый файл |
|-----|------|-------------------|
| REQ-BOOK-027..030 | CW на уровне TR, API transit | добавить в `07_integrations-behavior.md` |
| REQ-TRACK-007..009 | New Tracking Architecture (3 экрана) | `tracking/new-tracking-architecture.md` |
| REQ-TRACK-013..015 | Kpler логирование + retro export | добавить в `features/container-tracking.md` |
| REQ-RS-013..016 | Retro Consolidation пересчёт ставок | `features/retro-consolidation.md` |
| REQ-NOTIF-001..010 | Notification Center / Business Log | расширить `notifications/README.md` |
| REQ-EO-001..004 | Expected Orders | `features/expected-orders.md` |
| REQ-AUTH-001..007 | SSO / SAML / OAuth | `admin/auth-sso.md` |
| REQ-INV-035..036 | Billing Account + Settings hierarchy | добавить в `invoicing/` |

### P2 — Низкий приоритет

| REQ | Тема |
|-----|------|
| REQ-FU-009..011 | Pallets Management |
| REQ-BOOK-033 | Email Digest (vacation mode) |
| REQ-OCR-007 | BO Account Management (Sales/CSM Owner) |
| REQ-OCR-008 | User Profile (телефон + timezone) |

---

## Вложенные файлы RTM

- [RTM-REQ-TO-DOCS.md](RTM-REQ-TO-DOCS.md) — Shipments core (108 REQ, 97% покрытие)
- [rtm/RTM-01-booking.md](rtm/RTM-01-booking.md) — Booking: все 55 REQ-BOOK
- [rtm/RTM-02-invoicing.md](rtm/RTM-02-invoicing.md) — Invoicing: все 40 REQ-INV
- [rtm/RTM-03-rate-sheets.md](rtm/RTM-03-rate-sheets.md) — Rate Sheets + Tracking + Notifications: 45 REQ
- [rtm/RTM-04-dock.md](rtm/RTM-04-dock.md) — Dock + Slotify: 46 REQ
- [rtm/RTM-05-buy-sell.md](rtm/RTM-05-buy-sell.md) — Buy & Sell + Orders: 43 REQ
- [rtm/RTM-06-general-batch1.md](rtm/RTM-06-general-batch1.md) — Grouping / FU / Auth / Nav: 42 REQ
- [rtm/RTM-07-general-batch2.md](rtm/RTM-07-general-batch2.md) — Multi Container / Sea / Docs / STY: 58 REQ
- [rtm/RTM-08-ocr.md](rtm/RTM-08-ocr.md) — OCR: 8 REQ

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.rtm-master`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631046247 · **repo:** `tms/shipments/RTM-MASTER.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

