---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632782962
source_type: confluence
---
# Трекинг: Обработка источников для чек-листов

> Обновляется по мере обработки слайдов, кода и документов.
> Цель: максимальное покрытие требований TMS

---

## Статусы

| Статус | Значение |
|--------|---------|
| ✅ Done | Обработан, добавлен в чек-лист |
| 🔄 In Progress | Обрабатывается |
| ⏳ Pending | Очередь |
| ❌ Skip | Не релевантно для TMS |

---

## Код (Frontend + Backend)

| Источник | Покрытый модуль | Статус | Файл чек-листа |
|---------|----------------|--------|---------------|
| `shipments/controllers/list.js` | Список перевозок | ✅ | 08_requirements-map.md |
| `shipments/controllers/view.js` | Детали: Tracking tab | ✅ | 08_requirements-map.md |
| `s-requests/controllers/view.js` | Детали: Booking tab | ✅ | 08_requirements-map.md |
| `s-requests/dirrectives/new-s-request/` | CSW Wizard (4 секции) | ✅ | 08_requirements-map.md |
| `tabs/index.js` | Все вкладки SR/SH | ✅ | 08_requirements-map.md |
| `shipments/controllers/edit-tracking-point.js` | TP модал (7 шагов) | ✅ | 08_requirements-map.md |
| `backend/app/routes/api/shipments.js` | 30+ API эндпоинтов | ✅ | 08_requirements-map.md |
| `backend/app/routes/api/shipment_requests.js` | 25+ API эндпоинтов | ✅ | 08_requirements-map.md |
| `backend/app/models/shipment.js` | Все поля Shipment | ✅ | 07_integrations-behavior.md |
| `backend/app/models/shipment_request.js` | Все поля SR | ✅ | 02_create-wizard/ |
| `backend/app/services/shipment_requests.js` | SR create logic | ✅ | 02_create-wizard/api.md |
| `common/permissions/` | Матрица прав | ✅ | 06_roles-matrix.md |
| `backend/app/services/shipments.js` integrations | 21 integration task | ✅ | 07_integrations-behavior.md |
| `q-requests/controllers/view.js` | QR detail page | ⏳ | — |
| `invoicing/controllers/` | Invoicing controllers | ⏳ | — |
| `claims/controllers/` | Claims controllers | ⏳ | — |
| `grouping/controllers/` | Grouping controllers | ⏳ | — |
| `tracking-points/` services | TP backend logic | ⏳ | — |

---

## Слайды — TMS (приоритет 1)

| Файл | Домен | Статус | Ключевые темы |
|------|-------|--------|--------------|
| 2026 06 - Shipment rebuild | TMS_BOOKING | ⏳ | Quick Status Update, CO2, Chat |
| 2026 05 - QR to TR | BUY_SELL | ⏳ | QR→TR auto-create для TBS |
| 2026 04 - NEW TRACKING | TRACKING | ⏳ | New tracking architecture |
| 2026 04 - Statuses Update | DOCK | ⏳ | Status update modal |
| 2026 01 - Flow Types | TMS_BOOKING | ⏳ | 10 creation types + 7 booking types |
| 2026 01 - Invoice Improvement | INVOICING | ⏳ | Magic filters, POD filter |
| 2025 12 - Buy&Sell Accounting entities | BUY_SELL | ⏳ | Billing Entities |
| 2025 12 - Buy&Sell Send Quotes | BUY_SELL | ⏳ | Send Quotes flow |
| 2025 12 _ BUY AND SELL ACCOUNT | BUY_SELL | ⏳ | TBS account type |
| 2026 01 - Replan reason code | TMS_BOOKING | ⏳ | Reason codes cancel/replan |
| 2025 09 - EPIC - Notification | TMS_GENERAL | ⏳ | Notification system |
| 2024 09 - Update Packing List | TMS_BOOKING | ⏳ | Packing list update |
| 2025 06 - Retro Consolidation | RATE_SHEETS | ⏳ | Retro consolidation logic |
| 2025 05 - Invoicing V2 | INVOICING | ⏳ | Invoicing V2 |
| 2025 03 - CW display TR vs SR | TMS_BOOKING | ⏳ | TR vs SR display |
| 2025 01 - Incoterm UX | TMS_BOOKING | ⏳ | Incoterm simplification |
| 2024 12 - New version API Tracking | TRACKING | ⏳ | New tracking API |
| 2024 09 - Dangerous Goods Teliae | INTEGRATION | ⏳ | DGD + Teliae |
| 2023 05 - Invoicing Process | INVOICING | ⏳ | Full invoicing process |
| SEA FREIGHT RATE SHEET STRUCTURE | RATE_SHEETS | ⏳ | Sea RS structure |
| User Guide Incoterm Rate Sheet | RATE_SHEETS | ⏳ | Incoterm → RS logic |
| User Guide Retro Consolidation | RATE_SHEETS | ⏳ | Retro consolidation |

---

## Слайды — DOCK (приоритет 2)

| Файл | Статус |
|------|--------|
| 2026 05 - Dock Door assignment screen | ⏳ |
| 2026 05 - Dock Door specificities | ⏳ |
| 2026 05 - Dock order pending visibility | ⏳ |
| 2026 04 - Statuses Update | ⏳ |
| 2025 10 - Slotbook UI in Prod feedback | ⏳ |
| 2025 06 - DOCK Slot Grouping | ⏳ |
| 2025 05 - SLOT MULTI ORDER MULTI CUSTOMER | ⏳ |
| 2023 11 - DOCK Filters and Menu | ⏳ |
| 2023 11 - DOCK assign Carrier | ⏳ |
| Dock Order Listing | ⏳ |
| Dock order recognition improvement | ⏳ |

---

## Слайды — Integrations (приоритет 3)

| Папка | Файлов | Статус |
|-------|--------|--------|
| 05_Integrations/DHL/ | ? | ⏳ |
| 05_Integrations/Fedex/ | ? | ⏳ |
| 05_Integrations/Teliae Axel Master/ | ? | ⏳ |
| 05_Integrations/Calvacom/ | ? | ⏳ |
| 05_Integrations/DB Schenker/ | ? | ⏳ |
| 05_Integrations/EcoTransit/ | ? | ⏳ |
| 05_Integrations/Edifact/ | ? | ⏳ |
| 05_Integrations/BRINKS/ | ? | ⏳ |

---

## 00 - Ongoing Specs (приоритет 4)

> 689 файлов — самая большая коллекция, обрабатывать по темам

| Подпапка | Статус |
|---------|--------|
| 00 - Workshops/ | ⏳ |
| 00 - FM shared/ | ⏳ |
| 00 - Archives non triées/ | ⏳ |
| 00 Icebox/ | ⏳ |

---

## Extraction Results (2026-06-10)

| Домен | Файлов | Символов | Качество |
|-------|--------|---------|---------|
| TMS_BOOKING | 7 | 41K | ✅ все good |
| TMS_GENERAL | 102 | 3,333K | ✅ 93 good, 5 poor |
| TRACKING | 5 | 55K | ✅ все good |
| INVOICING | 7 | 33K | ✅ все good |
| RATE_SHEETS | 5 | 64K | ✅ все good |
| BUY_SELL | 11 | 60K | ✅ все good |
| DOCK | 8 | 21K | ✅ 7 good |
| DOCK_SLOT | 7 | 34K | ✅ все good |
| DOCK_SLOTBOOK | 3 | 12K | ✅ все good |
| INTEGRATION | 27 | 1,556K | ✅ 26 good |
| BACK_OFFICE | 12 | 115K | ✅ 10 good |
| CARRIER | 8 | 32K | ✅ все good |
| **ИТОГО** | **202 PDF** | **~5.3M** | **~95% good** |

> ⚠️ Ещё 207 файлов нуждаются в OCR (изображения без текстового слоя)
> ⚠️ 681 .pptx файл в 00_Ongoing_Specs — не обработаны (следующий приоритет)

---

## Текущее покрытие чек-листа (08_requirements-map.md)

| Домен | REQ сейчас | Источник | Покрытие |
|-------|-----------|---------|---------|
| TMS Список | 20 | код | ~40% |
| CSW Wizard | 25 | код | ~50% |
| Детали | 12 | код | ~35% |
| Tracking Points | 10 | код | ~40% |
| Invoicing | 5 | код | ~20% |
| Claims | 3 | код | ~15% |
| Modals | 9 | код | ~60% |
| Роли | 8 | код | ~70% |
| Интеграции | 7 | код | ~20% |
| Статусы | 8 | код | ~50% |
| **ИТОГО** | **107** | **только код** | **~35%** |

**После обработки слайдов цель: 500+ пунктов, 80%+ покрытие**

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.checklist-tracking`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632782962 · **repo:** `tms/shipments/CHECKLIST-TRACKING.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

