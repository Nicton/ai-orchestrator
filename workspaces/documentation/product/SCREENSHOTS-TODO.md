---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632160273
source_type: confluence
---
# Скриншоты — что снять (для последующего наполнения)

> Стенд: `app.blu.shiptify.com/fr/login` (креды в .env), BO: `back.blu.shipt.io/login`, Admin: `admin.blu.shiptify.com/login`.
> Скрины пока НЕ сняты. Здесь — реестр мест, где они нужны. Позже Product пропишет ключевые сценарии и пошаговый путь до каждого экрана — тогда снимем эффективно (Playwright).
> Колонка «Путь (шаги)» — заполняется Product. Колонка «Готово» — отметка после съёмки.

## DOCK

| # | Экран / что показать | Док | UI-роут | Путь (шаги) | Готово |
|---|----------------------|-----|---------|-------------|--------|
| D1 | Зона — вкладка General | dock/zones | `/locations/{id}/settings/{zoneId}/general` | _Product_ | ⬜ |
| D2 | Зона — Slot (capacity/cargo) | dock/zones | `/slot/{zoneId}` | | ⬜ |
| D3 | Зона — Constraints (replan/cancel cutoff) | dock/zones | `/constraints/{zoneId}` | | ⬜ |
| D4 | Зона — Slot validation + whitelist | dock/slot-validation | `/slot-validation/{zoneId}` | | ⬜ |
| D5 | Зона — Calendar (часы + override на дату) | dock/pml-settings | `/calendar/{zoneId}` | | ⬜ |
| D6 | Planning — Week | dock/planning | `/slotify/{day}` | | ⬜ |
| D7 | Planning — Board (карточки, цвета статусов) | dock/planning | `/slotify/board/{day}` | | ⬜ |
| D8 | Load — тепловая карта | dock/load-view | `/slotify/load/{day}` | | ⬜ |
| D9 | Assignment — drag ворот | dock/load-view | `/slotify/load/{day}` | | ⬜ |
| D10 | TV Display — табло | dock/tv-display | `/display` | | ⬜ |
| D11 | Dock Center | dock/dock-center | `/dock` | | ⬜ |
| D12 | Dock Orders — листинг + фильтры | dock/order-management | `/dock-orders` | | ⬜ |
| D13 | Визит — карточка/статусы | dock/visits-management | (визит) | | ⬜ |
| D14 | CSV upload — экран импорта | dock/csv-uploads | Location → Management | | ⬜ |
| D15 | Партнёры локации | dock/external-partners | `/locations/{id}/partners` | | ⬜ |
| D16 | Статус-модал слота (опоздание) | dock/slots-core | (слот) | | ⬜ |

## TMS (волна 1 + ядро)

| # | Экран | Док | UI-роут | Путь | Готово |
|---|-------|-----|---------|------|--------|
| T1 | Список шаблонов | tms/templates | `/shipment-templates` | | ⬜ |
| T2 | Группы шаблонов | tms/templates | `/template-groups` | | ⬜ |
| T3 | Шаринг шаблона (Direct to Carrier) | tms/templates | (модал share) | | ⬜ |
| T4 | MD на объекте (вкладка Metadata) | tms/metadata | (shipment → Metadata) | | ⬜ |
| T5 | Реестр metadata-requests | tms/metadata | `/metadata-requests` | | ⬜ |
| T6 | Followers — блок добавления | tms/followers | (вкладка обсуждения) | | ⬜ |
| T7 | Follower Plans — настройка | tms/followers | (настройки) | | ⬜ |
| T8 | Подключение перевозчика (Self-Admin) | tms/carriers | Self-Admin | | ⬜ |
| T9 | Customs invoice — деталь | tms/customs | `/customs-invoices/:id` | | ⬜ |
| T10 | Doc Center — реестр+выгрузка | tms/doc-center | `/doc-center` | | ⬜ |
| T11 | Cross-Dock — экран кроссдока | tms/cross-dock | `/cross-dock` | | ⬜ |
| T12 | Sea Schedule — поиск рейсов | tms/sea-schedule | `/sea-schedule` | | ⬜ |
| T13 | CSW Wizard — шаги + выбор перевозчика | tms/shipments | `/shipments` (CSW) | | ⬜ |
| T14 | Visual Indicators (PML/Manual) | tms/features/visual-indicators | `/shipments` (колонка) | | ⬜ |

## Дополняется по мере волн 2-6

| # | Экран | Док | UI-роут | Путь | Готово |
|---|-------|-----|---------|------|--------|
| _(волна 2: Milkrun, Transport Plan, Master Data, Self-Admin/Rights — добавить сюда)_ | | | | | |
| _(волна 4: Back-Office Sales/Billing/NSM — добавить)_ | | | | | |
| _(волна 5: Admin-App Dictionaries — добавить)_ | | | | | |
| _(волна 6: Mini-Apps Driver/Carrier/Quick Shipment — добавить)_ | | | | | |

---
> При съёмке: класть файлы в `product/_screenshots/<домен>/<имя>.png`, в доке вставлять ссылкой; в граф-метаданные добавится `screenshots: [...]`.
