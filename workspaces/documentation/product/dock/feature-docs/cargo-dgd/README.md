---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631996481
source_type: confluence
---
# Cargo Types, Cargo Groups, Dangerous Goods — справочники груза и интеграция с Back-Office

> Сверено с кодом 2026-06-12 | `dict_shipment_request_content_types.js`, `cargo_groups.js`, `dict_dangerous_goods_descriptions.js`, back-office actions

## Зачем три уровня

| Уровень | Сущность | Откуда пришла | Роль |
|---------|----------|---------------|------|
| Тип груза | `dict_sh_request_content_types` | Номенклатура упаковки (палета EUR, бочка, контейнер 20DV…) | Что физически едет: размеры, вес, флаги `is_container`/`is_pallet`/`is_stackable`, режимы (for_road/sea/air/…), ISO-код контейнера |
| Группа | `cargo_groups` | Правилам зон не нужны 200 типов — нужны классы | Агрегат для правил: зона DOCK принимает ГРУППЫ (`location_zones.cargo_groups` JSONB), а не отдельные типы |
| Опасные грузы | `dict_dangerous_goods_descriptions` | Регуляторика ADR/IMDG | gref/service_code/feature_code, `has_sticker`, и **три JSONB-настройки**: общие, per-carrier (у перевозчиков свои требования), per-integration (как передавать в EDI/API) |

## Кто ведёт (Back-Office интеграция)

Полный CRUD — **Back-Office** (`/cargo-types`, `/cargo-groups`, `/dangerous-goods-descriptions`; DGD-валидация уникальности gref). Admin-App — чтение. Изменение справочника мгновенно влияет на: формы CSW (выбор типа), правила зон DOCK (приём групп), расчёт длительности слота (per_hour по типу), Transport Plans (ограничения по DGD/specificities), интеграции (маппинг в Brinks/UPS/Teliae через `is_pallet` и iso-коды).

## Влияние на DOCK

Зона объявляет `cargo_groups` → бронирование с типом вне групп зоны отклоняется/требует `allow_add_cargo_type`; производительность `cargo[].per_hour` по типу определяет длительность слота — см. [Slots Core](../slots-core/README.md).

## Где найти и как настроить (UI)

**Back-Office** (внутренний инструмент Shiptify) — sidebar:
- **Cargo Types** → `/cargo-types` (CRUD: имя, размеры, флаги is_container/is_pallet/is_stackable, режимы, ISO-код)
- **Cargo Groups** → `/cargo-groups` (CRUD групп для правил зон)
- **Dangerous Goods** → `/dangerous-goods-descriptions` (gref/service_code/feature_code, has_sticker, JSONB-настройки общие/per-carrier/per-integration)

Admin-App — только чтение этих справочников. **Привязка к зоне DOCK:** Slotify → Location Settings → Slot-вкладка зоны → выбрать разрешённые cargo groups (`location_zones.cargo_groups`).

## Сценарии

1. **Новый тип упаковки**: BO → Cargo Types → создать → добавить в нужную Cargo Group → зоны, принимающие эту группу, автоматически начинают её принимать.
2. **Опасный груз с требованиями перевозчика**: BO → DGD → задать `carrier_settings` (у DHL свои коды) → при бронировании/CSW требования подставляются автоматически.
3. **Ограничить зону**: зона принимает только группу «паллеты» → бронь контейнера в неё отклоняется (или требует allow_add_cargo_type).

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.cargo-dgd`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 631996481 · **repo:** `dock/feature-docs/cargo-dgd/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

