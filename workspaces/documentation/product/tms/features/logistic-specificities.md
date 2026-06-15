---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632881203
source_type: confluence
---
# Logistic Specificities — Специфики груза и транспортного средства

> Источник требований: REQ-LOG-001..005 | Слайды: 2024 07 - (Counter) Logistic Mean vs Packing list

---

## Концепция

Функция заменяет понятие «Logistic Means» структурированным справочником специфик, разделённых на два уровня:

| Уровень | Применение |
|---------|-----------|
| **Shipment Specificities** | Применяются ко всей отправке (тип прицепа, оборудование) |
| **Cargo Specificities** | Применяются к уровню содержимого (температура, DGD, ограничения) |

---

## Справочник специфик (REQ-LOG-001)

Структура справочника:

| Поле | Описание |
|------|----------|
| ID | Идентификатор |
| Name FR | Название на французском |
| Name EN | Название на английском |
| Scope | LTL / LCL / FTL / FCL |
| Mode | Транспортный режим |
| Category | Группа специфики |

**Категории:** Cargo Service, Trailer Type, Vehicle Equipment, Additional Services и другие.

Клиент выбирает, какие специфики включить (self-admin в разделе specificities).

---

## Специфики отправки (REQ-LOG-002)

При клике «Add Shipment specificities» открывается модал выбора.

**Типы прицепов (Trailer Type):**
Box, Tautliner, Open-top, Open-box, Double Decker, Mega/Jumbo, Bulk Commodity, Tank, Dump, Coil Pit, Car Carrier, Logging, Livestock

**Оборудование транспортного средства (Vehicle Equipment):**
Liftgate (pickup/delivery), Pallet truck, Tensioning belts, Seal, Ropes, Chains

**Дополнительные услуги водителя:**
2 drivers, Native speaking, Local driver

Пользователь может выбрать ни одного, одно или несколько значений.

---

## Специфики груза (REQ-LOG-003)

**Флаги груза:**
- Fragile, OOG (Out of Gauge), AOG (Aircraft on Ground), Critical

**Ограничения с тогглом Allow/Refuse:**
- Spin, Stack, Co-load, Transhipment

**Температура груза:**
- Диапазон температур (Celsius или Fahrenheit)
- Поле скрыто, если температура не активирована

**Опасные грузы (DGD):**
- UN CODE, Packing Group, Class, DGD description
- Поле скрыто, если DGD не активирован

---

## Sub-packing list для FTL/FCL (REQ-LOG-004)

FTL/FCL отправка может содержать детальный пакинг-лист (sub-packing list) в формате LTL:
- Модал добавления идентичен модалу определения LTL отправки
- Cargo constraints уровня отправки: температура, опасные грузы, тип груза
- Все специфики синтезируются в комментариях для перевозчика

---

## Справочник в BO и переводы (REQ-LOG-005)

- Справочник специфик хранится в BO с поддержкой FR и EN
- Процесс перевода аналогичен переводам в приложении (через Tolgee)
- Специфики автоматически синтезируются в **пиктограммы** для визуальной идентификации в UI

---

## Связанные функции

| Функция | Документ |
|---------|----------|
| Transport Plan (фильтры по спецификам) | [../buy-sell/orders-transport-plan.md](../buy-sell/orders-transport-plan.md) |
| Rate Sheet (DGD rules) | [../rate-sheets/README.md](../rate-sheets/README.md) |

---

## 🔗 Граф-метаданные
- **id:** `tms.features.logistic-specificities`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632881203 · **repo:** `tms/features/logistic-specificities.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

