---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629571626
source_type: confluence
---
# Locations / Master Data — справочник адресов

> Сверено с кодом 2026-06-13 | `models/location.js`, `location_customers.js`, `location_settings.js`, `services/locations.js`, routes `locations.js`, frontend `locations`, `my-sites`

## Зачем (бизнес-контекст)

Каждая перевозка — это «откуда» и «куда». Если адреса вводить руками каждый раз, будет хаос (опечатки, дубли, нет геокодинга). **Locations** — централизованный справочник адресов аккаунта: типы (склад/завод/магазин/порт/аэропорт/финальный клиент), геоданные (lat/lng, place_id, LOCODE), контакты, slot-booking настройки. Master Location (`is_master`) — особый адрес-площадка, от которой зависят зоны/слоты DOCK и публичный портал. Без качественного справочника не работают ни CSW, ни рейтшиты (логзоны), ни DOCK.

## Как устроено (код)

| Сущность | Модель | Ключевое |
|----------|--------|----------|
| Локация | `location.js` (таблица addresses) | name, **type**, **is_master**/master_id, адрес+city+zip+country+country_code+**logistic_zone**+**locode**, lat/lng/place_id, slot_booking_*, контакты, token, timezone, is_active/is_visible, provider (google/algolia/mapbox), trust_level |
| Клиент локации | `location_customers.js` | name, public_name/id, partner_id (companies), capacity, partner_visibility |
| Настройки | `location_settings.js` | slot_naming, is_supplier_control_to_book, carrier_update_cargo_block, has_slotify_access |
| Статусы площадки | `site_shipment_status_setting.js` | type, direction (from/dest), color, group, authorize_entry/exit |

Сервис: loadAllowedLocationsForUser, createLocation (wizard), location customers, zones, site-status-settings. Поиск адреса — Google Places (`/locations/google`).

## Где найти и настроить (UI)

| Что | Роут |
|-----|------|
| Адресная книга | `/locations` (LocationsCtrl) |
| Создать (wizard) | `/locations/add` |
| Редактировать | `/locations/{id}/edit` |
| Добавить контакт | `/locations/{id}/add-contact` |
| Личные/master-локации | `/my-sites` |

API: `GET/POST/PATCH/DELETE /locations[/:id]`, `/locations/:id/{zones,customers,statuses,metadata}`, `/locations/slotify` (публичные master-локации), `/locations/:id/replace` (заменить адрес в отправке). Типы локаций и slot_type определяют [Visual Indicators](../features/visual-indicators.md) и [PML Settings](../../dock/feature-docs/pml-settings/README.md).

## Сценарии

1. **Новый склад клиента**: создать локацию (type=warehouse) → задать LOCODE/логзону → используется в CSW и для расчёта рейтшита по зоне.
2. **Master Location для DOCK**: is_master + has_slotify_access → появляются зоны/слоты, публичный портал Slotify.
3. **Замена адреса**: `/locations/:id/replace` → переназначить локацию в существующих отправках без пересоздания.

---

## 🔗 Граф-метаданные
- **id:** `tms.master-data.locations`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629571626 · **repo:** `tms/master-data/locations-module.md`
- **code_refs:** `backend/app/models/{location,location_customers,location_settings,site_shipment_status_setting}.js`, `services/locations.js`, `routes/api/locations.js`, `frontend/public/app/{locations,my-sites}`
- **modules:** TMS, DOCK (master location), Rate Sheets (logzone)
- **references:** `dock.pml-settings`, `tms.features.visual-indicators`, `tms.rate-sheets`
- **requirements:** нет — реализовано без требований (связь Location creation redesign — слайды)
