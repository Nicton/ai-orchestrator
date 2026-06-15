---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632193025
source_type: confluence
---
# System Map — инвентаризация кода снизу вверх

> Построено 2026-06-13 обходом КОДА (не требований): backend 240 сервисов / 466 моделей / 119 контроллеров / 48 cron, frontend 90+ app-папок, 18 микросервисов, back-office 60+ контейнеров, admin-app 70+ эндпоинтов, mini-apps 25 сервисов. Статус документации: ✅ есть · 🔶 частично · ❌ нет. Это источник для AUDIT-PLAN и графовой БД.

> Принцип: **документируем всё реализованное**, даже без требований (требования найдём позже). Каждый модуль ниже = будущий узел графа.

## Легенда статуса
✅ задокументирован с глубиной (зачем/код/UI/сценарии) · 🔶 есть, но мелко/без UI-путей · ❌ нет дока · 🆕 создан в эту волну

---

## Домен TMS — основное приложение (frontend/public/app + backend services)

| Модуль | Код (frontend / backend) | Док | Статус |
|--------|--------------------------|-----|--------|
| Shipments (список/деталь/CSW) | `shipments`, `s-requests` / `shipments`, `shRequests` | tms/shipments/* | ✅ |
| Quote/Shipment Requests | `q-requests` / `quote_requests`, `quoteRequest` | tms/requests/* | ✅ |
| Tracking | `shipments` tabs / `tracking` | tms/tracking/* | ✅ |
| Invoicing / Pre-invoices / Invoice-lines | `invoices`, `invoicing`, `pre-invoices`, `invoicing-documents` / `invoices`, `invoicing.js`, `pre_invoices`, `inv_detailed_cost` | tms/invoicing/* | ✅ |
| Rate Sheets | `rate-sheets` / `rateSheets` | tms/rate-sheets/* | ✅ |
| Orders | `orders` / `orders`, `order_products` | tms/orders, dock order-management | ✅ |
| Freight Units | `freight-units` / `freightUnits` | tms/features/freight-units | ✅ |
| Milkrun | `milkrun` / `milkrun` | tms/milkrun | 🔶 |
| Multivision / Control Tower | `multivision` / `multivision.js` | tms/control-tower | 🔶 |
| Claims | `claims`, `claims-dashboard` / `claims.js` | tms/claims | ✅ |
| Master Data / Locations | `locations`, `my-sites` / `locations`, `location_*` | tms/master-data | 🔶 |
| Transport Plan / Requests / Groups | `transport-plan`, `transport-requests`, `transport-request-groups` / `transportPlans`, `transportRequests`, `transportRequestGroups` | tms/buy-sell/orders-transport-plan | 🔶 |
| Templates / Sharing | `templates`, `shipment-templates`, `template-groups` / `templates.js`, `shipment-templates.js`, `template_sharing.js` | — | ❌ |
| Smart Lists | `smart-lists` / (filters) | shipments (упомянут) | 🔶 |
| Magic Filters | (system) / `filters.js` | tms/features/magic-filters | ✅ |
| Cross-Dock | `cross-dock` / `crossdock.js` | — | ❌ |
| Sea Schedule | `sea-schedule` / `sea_schedule.js` | — | ❌ |
| Metadata (MD) | `metadata-requests` / `metadata`, `metadata.js` | — | ❌ |
| Attachments / Doc Center | `attachments-categories`, `doc-center`, `account-doc-center` / `attachments`, `doc-center.js`, `documents` | tms/features/doc-workflow, labels-sscc | 🔶 |
| Cost Segments / External Costs | `cost-segments`, `external-costs` / `cost-segments.js`, `external_costs.js` | invoicing (упомянут) | 🔶 |
| Followers / Follower Plans | (system) / `followers`, `follower_plans.js` | — | ❌ |
| Notifications | (system) / `notifications`, `notifications-v2.js` | tms/notifications | ✅ |
| Discussions / Chat | (common) / `discussions.js`, `messages.js` | chat/* | 🔶 |
| Carriers / Shipper-Carrier | `carriers`, `shipper-carrier`, `private-carriers` / `carriers`, `shipper_carrier_*` | — | ❌ |
| Products / Cargo | `products`, `dicts` / `products.js`, `contents` | dock cargo-dgd | 🔶 |
| Customs / Customs-invoices | `customs-invoices`, `customs-invoice-lines` / `customs`, `customs-invoices` | ai/ai-reader (частично) | ❌ |
| Parcels | (s-requests) / `parcels`, `parcels.js` | — | ❌ |
| Buy & Sell (TBS) | `shared-orders`, `shippers` / (transportRequests) | tms/buy-sell/* | ✅ |
| Galaxy | `galaxy` / `galaxies` | tms/galaxy (→BO) | 🔶 |
| Dashboards | `dashboard` / `dashboards`, stats-сервисы | tms/dashboards | ✅ |
| Self-Admin / Rights / Roles | `self-admin`, `rights-management` / `self_admin.js`, `roles-groups.js`, `users-roles-teams.js` | dock auth-management (частично) | 🔶 |
| Referrals / Agreement / Contracts | `referrals`, `agreement`, `contracts` / `referrals.js`, `agreement.js`, `shipper_carrier_contracts.js` | — | ❌ |
| Webhooks | `webhooks` / `webhooks`, `webhooks-ui` | dock webhooks, integrations | ✅ |
| Zapier integration | (—) / `zapier.js` | — | ❌ |

## Домен DOCK (slotify, slots, visits, dock)

| Модуль | Код | Док | Статус |
|--------|-----|-----|--------|
| Slots Core / Slotify / Slot-counts | `slotify`, `slots`, `pre-booked-slots` / `slotify`, `slots`, `slot-counts.js`, `dedicated-slots` | dock/feature-docs/slots-core | 🆕✅ |
| Visits | `visits` / `visits`, `visits_slots` | dock/feature-docs/visits-management | 🆕✅ |
| Dock Orders / Slot-dock-orders | `dock-orders`, `slot-dock-orders` / `dock-orders`, `slot-dock-orders` | dock order-management, dock-orders | 🆕✅ |
| Zones / Dock Doors | (slotify settings) / `location_zones.js`, `dock_door.js` | dock/feature-docs/zones, dock-doors | 🆕✅ |
| PML Settings | (slotify location-settings) / `locations`, `location_statuses.js` | dock/feature-docs/pml-settings | 🆕✅ |
| Slot Validation | (zone-slot-validation) / `slotify` whitelist | dock/feature-docs/slot-validation | 🆕✅ |
| CSV Uploads | (management) / `slots-csv`, `orders-csv` | dock/feature-docs/csv-uploads | 🆕✅ |
| Load / Planning / TV Display / Dock Center | `slotify`, `dock` / (slotify) | dock load-view, planning, tv-display, dock-center | 🆕✅ |
| Recurring Slots | (—) / `recurring-slots` | pml-settings (упомянут) | 🔶 |
| Site Shipment Statuses | (—) / `site_shipment_statuses` | slots-core (статусы) | 🔶 |
| Partner DB / Location Customers | `partners`, `partnership` / `partners`, `location_customers`, `partnerships.js` | dock external-partners, partner-db | 🆕✅ |
| Drivers / Account Drivers | `drivers`, `account-drivers` / `drivers`, `account_drivers.js` | dock drivers-and-sms | 🆕✅ |
| SMS | (—) / `sms-impl.js`, `sms-notify`, `sms.js` | dock drivers-and-sms | 🆕✅ |

## Микросервисы (microservices/node)

| Сервис | Назначение | Док | Статус |
|--------|-----------|-----|--------|
| auth (ms-auth) | SAML/JWT/passwordless | identity/*, tms/admin/auth-sso | ✅ |
| ai-extract, ai-worker | AI Reader (Textract+Gemini) | ai/features/ai-reader | ✅ |
| msg-email, msg-notif, msg-ws, msg-offload | Чат/уведомления realtime | chat/* | 🔶 |
| crm | CRM | back-office/crm-bo-dashboard | 🔶 |
| locations | Микросервис локаций | — | ❌ |
| ip2loc, images, user-config, event-bus | Инфра-сервисы | — | ❌ |

## Back-Office (back-office/client/containers) — внутренний инструмент

| Модуль | Док | Статус |
|--------|-----|--------|
| Sales Accounts / Touchpoints / AM Dashboard / AM Opportunities | back-office/sales-accounts, am | 🔶 |
| Billing Accounts / MRR Lines | back-office/billing-accounts | 🔶 |
| Cargo Types / Groups / Dangerous Goods | dock cargo-dgd | 🆕✅ |
| Accounts / Companies / Carriers / Killed Carriers / New Sellers | back-office/account-management | 🔶 |
| Galaxies / Galaxies Operations | tms/galaxy | 🔶 |
| Metadata / Metadata Value | — | ❌ |
| Payment Terms / Unit Measurements / Incidents | — | ❌ |
| NSM / Alerts / Pending Docks / Pending TM / Dock Leads | back-office/operations, alerting | 🔶 |
| Public Page / Domains / Spectators / Roles / Users | back-office/* | 🔶 |
| LinkedIn / Referrals | — | ❌ |
| Vanna AI | back-office/vanna-ai-analytics | ✅ |
| BON (notifications) | back-office/bon-notifications | 🔶(спека) |

## Admin-App (admin-app/app/controllers/api) — конфигурация

| Модуль | Док | Статус |
|--------|-----|--------|
| Accounts / Admins / Access (users↔accounts/locations) | admin-app/* (OPEN-QUESTIONS) | 🔶 |
| Active Integrations + per-carrier creds (DHL GF/Express, Dachser, FedEx, Brinks) | integrations/* | 🔶 |
| Dictionaries (currencies, modes, content-types, specificities, metadata-prototypes, transit-companies, causes, message-types, product-types, job-*) | admin-app (упомянут) | ❌ |
| Carrier Rules / Divisions / Galaxy Services | — | ❌ |
| Customer Auth Credentials / Customer Workflows | admin-app OPEN-QUESTIONS | 🔶 |

## Mini-Apps (mini-apps/src/services) — внешние порталы

| Модуль | Док | Статус |
|--------|-----|--------|
| Driver app, Carrier portal, Slotify, Customs, Quick Shipment, Transport Requests | mini-apps/* (OPEN-QUESTIONS) | 🔶 |
| Access Tokens / Shared Templates / Subscriptions (WS) | mini-apps (частично) | 🔶 |

## Сводка пробелов (кандидаты на документирование)

**❌ нет дока вообще (приоритет волн):** Templates/Sharing, Cross-Dock, Sea Schedule, Metadata (MD), Followers/Follower Plans, Carriers/Shipper-Carrier, Customs, Parcels, Referrals/Agreement/Contracts, Zapier, локации-микросервис, BO Dictionaries/Payment Terms/Incidents, Admin-App Dictionaries/Carrier Rules.

**🔶 мелко / без UI-путей:** Milkrun, Multivision/Control Tower, Master Data, Transport Plan, Smart Lists, Attachments/Doc Center, Cost/External Costs, Chat-realtime, Products/Cargo, Galaxy, Self-Admin/Rights, Recurring Slots, BO/Admin/Mini-Apps секции.

---

## Отдельные репозитории-сервисы (standalone workspaces) — добавлено 2026-06-13

> ⚠️ Эти репозитории **не входят в backend** и были упущены при первой инвентаризации (были только упоминания). Аудит «по всем репозиториям» (2026-06-13) их выявил и задокументировал bottom-up.

| Репозиторий | Файлов | Что это | Док | Статус |
|-------------|--------|---------|-----|--------|
| `public-api` | 583 | Публичный REST API для внешних интеграторов (API-ключи, carrier/shipper ACL, Galaxy) | integrations/public-api/README.md | ✅🆕 |
| `brinks` | ~165 | Интеграция перевозчика Brinks (NestJS+Prisma+Kafka, отдельный сервис) | integrations/carriers/brinks.md | ✅🆕 |
| `ups` | ~181 | Интеграция UPS (NestJS+Kue+Kafka, этикетки ZPL/GIF, cron) | integrations/carriers/ups.md | ✅🆕 |
| `emailing` | ~22 | Воркер Email (Mailgun) / SMS на Kue — НЕ msg-email | microservices/email-sms-worker.md | ✅🆕 |
| `generate` | ~12 | Генерация PDF (этикетки/CMR/манифесты) через Puppeteer → S3 | microservices/attachments-generate.md | ✅🆕 |
| `stream-topics` | ~35 | `@shiptify/stream-events` — контракты Kafka-событий (типы/версии/AJV) | microservices/stream-topics.md | ✅🆕 |
| `core-libs` | ~146 | `@shiptify/*` — lib-core, node-auth, stream-core/kafka/pg/redis (было 0 ссылок!) | microservices/core-libs.md | ✅🆕 |

### Репозитории НЕ для продуктовой документации (инфра/QA/i18n — намеренно не углубляем)

| Репозиторий | Категория |
|-------------|-----------|
| `main-app-automation`, `testing-tools` | QA / автотесты |
| `migrations`, `migrations-bi` | миграции БД |
| `package-translations`, `translations` | i18n |
| `run-local` | локальный запуск/devops |

### Пустые / зарезервированные (аннотированы ранее)
`ai-shared`, `chat`, `identity`, `docs`, `maintain`, `notifications` — пустые или заглушки.
