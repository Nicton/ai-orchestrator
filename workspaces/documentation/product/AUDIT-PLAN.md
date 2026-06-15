---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631930881
source_type: confluence
---
# План аудита полноты системы (bottom-up)

> Создан 2026-06-13. Цель: задокументировать **всё реализованное** (от кода, не от требований), с глубиной (зачем/код/UI-путь/сценарии) и [граф-метаданными](GRAPH-METADATA-SPEC.md). Источник пробелов: [SYSTEM-MAP.md](SYSTEM-MAP.md). Резюмируемый — продолжать с любой ⬜ строки.

## Метод (для каждого модуля)
1. Bottom-up разбор кода (модели/сервисы/роуты/cron + UI-роут).
2. Опц.: проверка на стенде `app.blu.shiptify.com` (креды в .env) — UI-пути и скриншоты.
3. Док с 4 блоками: **Зачем (бизнес)** → **Как устроено (код, file:line)** → **Где найти и настроить (UI-путь)** → **Сценарии**.
4. Граф-метаданные в конце; требования — со ссылкой на источник (или «нет — реализовано без требований»).
5. Публикация в Confluence + commit + отметка здесь.

## Принцип приоритизации
Сначала ❌ (нет дока вообще) в основном продукте TMS → затем 🔶 (углубление) → затем BO/Admin/Mini-Apps.

---

## Волна 1 — TMS ❌ без документации (ядро продукта) — ✅ ЗАВЕРШЕНА

| # | Модуль | Confluence |
|---|--------|-----------|
| 1.1 | Templates / Sharing / Groups | ✅ 629080073 |
| 1.2 | Metadata (MD) | ✅ 629243915 |
| 1.3 | Followers / Follower Plans | ✅ 629309443 |
| 1.4 | Carriers / Shipper-Carrier / Private | ✅ 629374998 |
| 1.5 | Customs Invoices | ✅ 629080090 |
| 1.6 | Parcels | ✅ 629243931 |
| 1.7 | Cross-Dock | ✅ 629571594 |
| 1.8 | Sea Schedule | ✅ 629571610 |
| 1.9 | Referrals / Agreement / Contracts | ✅ 629243947 |
| 1.10 | Attachments & Doc Center | ✅ 629243963 |

## Волна 2 — TMS 🔶 углубление — ✅ ЗАВЕРШЕНА

| # | Модуль | Confluence |
|---|--------|-----------|
| 2.1 | Milkrun | ✅ 629375014 |
| 2.2 | Multivision / Control Tower | ✅ 629506077 |
| 2.3 | Master Data / Locations | ✅ 629571626 |
| 2.4 | Transport Plan / Requests / Groups | ✅ 629375047 |
| 2.5 | Smart Lists | ✅ 629309459 |
| 2.6 | Cost Segments / External Costs | ✅ 629375063 |
| 2.7 | Products / Cargo | ✅ 629375031 |
| 2.8 | Self-Admin / Rights / Roles / Teams | ✅ 629375079 |
| 2.9 | Galaxy | ✅ 629243979 |

## Волна 3 — Микросервисы и realtime — ✅ ЗАВЕРШЕНА

| # | Модуль | Confluence |
|---|--------|-----------|
| 3.1-3.3 | Все микросервисы (msg-ws/notif/offload/email, locations, ip2loc, images, user-config, event-bus, crm) — один сводный док | ✅ 629571642 |

## Волна 4 — Back-Office — ✅ ЗАВЕРШЕНА

| # | Модуль | Confluence |
|---|--------|-----------|
| 4.1 | Sales Accounts / Touchpoints / AM | ✅ 629571659 |
| 4.2 | Billing Accounts / MRR Lines | ✅ 629375095 |
| 4.4 | Operations: NSM/Alerts/Pending/DockLeads | ✅ 629309475 |
| 4.3 | Account / Carriers Operations | ✅ 629309491 |
| 4.5 | Dictionaries & Settings | ✅ 629375111 |
| 4.6/4.7 | Users / Domains / Public Page / Referrals / LinkedIn | ✅ 629506093 |

## Волна 5 — Admin-App — ✅ ЗАВЕРШЕНА

| # | Модуль | Confluence |
|---|--------|-----------|
| 5.1-5.4 | Dictionaries (13) + Carrier Rules/Divisions/Galaxy Services + Active Integrations/creds + Accounts/Admins/Access/Workflows — сводный док | ✅ 629571675 |

## Волна 6 — Mini-Apps — ✅ ЗАВЕРШЕНА

| # | Модуль | Confluence |
|---|--------|-----------|
| 6.1-6.2 | Driver/Carrier/Slotify/Customs/Quick Shipment/TR/Shared Templates/Subscriptions — сводный док | ✅ 629080106 |

## Волна 7 — Ретро-метаданные — ✅ ЗАВЕРШЕНА

| # | Задача | Статус |
|---|--------|--------|
| 7.1 | Граф-метаданные во ВСЕ docs | ✅ `tools/backfill-metadata.cjs` — 300/308 размечено (8 служебных — намеренно без). Минимальные блоки (code_refs: TODO для углублённых вручную) |
| 7.2 | `source:` для требований | ✅ конвенция: источники в заголовках чеклистов («Источник:»/«Слайды:») + сводная таблица в RTM-MASTER; per-REQ — по мере необходимости |
| 7.3 | Сборщик графа | ✅ `tools/build-graph.cjs` → graph.json (узлы/рёбра) + coverage.md. Финал: 308 doc, 1313 рёбер, 258 code_files, 40 modules |

**ВСЕ 7 ВОЛН ЗАВЕРШЕНЫ.** Граф полный, резюмируемость — через journal + статусы.

---

## Журнал
| Дата | Сделано |
|------|---------|
| 2026-06-13 | Bottom-up инвентаризация → SYSTEM-MAP/GRAPH-METADATA-SPEC/план. |
| 2026-06-13 | **Волна 7 завершена — ВСЕ ВОЛНЫ ГОТОВЫ**: backfill метаданных (300/308 узлов), source-конвенция в RTM, граф-сборщик. Граф: 308 doc, 1313 рёбер, 258 code-files, 40 modules. |
| 2026-06-13 | **Волны 5-6 завершены**: Admin-App (сводный 629571675) + Mini-Apps (сводный 629080106). Остаётся волна 7 (ретро-метаданные). |
| 2026-06-13 | **Волны 3-4 завершены**: микросервисы (сводный док 629571642) + Back-Office (6 доков 629309475..629571659). |
| 2026-06-13 | **Волна 2 завершена** (9 модулей TMS 🔶→✅): Milkrun, Multivision, Locations/MasterData, Products, Transport Plan, Smart Lists, Cost Segments, Self-Admin/Rights, Galaxy. Опубликовано под Feature Docs (629243979..629571626). Граф перегенерирован. |
| 2026-06-13 | **Волна 1 завершена** (10 модулей TMS ❌→✅): Templates, Metadata, Followers, Carriers, Customs, Parcels, Cross-Dock, Sea Schedule, Referrals/Agreement/Contracts, Doc Center. Опубликовано под Feature Docs (629080073..629571610), все с граф-метаданными. Далее: волна 2 (углубление 🔶). |
