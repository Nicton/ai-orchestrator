---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632586289
source_type: confluence
---
# Container Return — Возврат порожних контейнеров

Функция отслеживания цикла возврата порожних контейнеров для Rail, Sea и Air/Sea перевозок.

> Источники: слайды `2026 03 - CONTAINER RETURN` и `2026 03 - CONTAINER RETURN extended`

---

## Базовая функция

### Где доступно
Кнопка **"+ Add Empty Return"** в нижней части маршрута Shipment.
Видна только для режимов: **Rail, Sea, Air/Sea**

### Поля формы

| Поле | Тип | Обязательное |
|------|-----|-------------|
| Delivery Location | Location | — |
| Load Empty Container | Date + Time | — |
| Unload Empty Container | Date + Time | — |

### При сохранении

Автоматически создаются 2 новых Tracking Point:
1. **"Load empty container return"** — статус: Planned
2. **"Unload empty container return"** — статус: Planned

Метка локации: `"Empty return at Point of return [city]"`

---

## Расширенная функция (Extended)

### Автоматическое создание при DDP + Rail/Sea/Air-Sea

Если Incoterm = **DDP** И режим = Rail/Sea/Air-Sea:
→ Система автоматически создаёт 2 TP для возврата контейнера

### Дополнительные поля SR (Pre-carriage)

| Поле | Описание |
|------|---------|
| **Empty Pickup Location (Depot)** | Депо для получения порожнего контейнера |
| **Empty Pickup Date (Detention Start)** | Дата начала срока detention |

### Многоперевозчиковая логика

Разные перевозчики могут быть назначены на каждый участок маршрута:

| Участок | Описание |
|---------|---------|
| PRE-CARRIAGE | Довозка до основного терминала |
| MAIN LEG | Основная перевозка |
| POST-CARRIAGE | Развозка от терминала |
| ON-CARRIAGE | Дополнительный участок |

### Sub-shipment

При наличии return и pickup лег — автоматически создаются sub-shipments по логике **FORWARD copy**.

---

## Терминология

| Термин | Определение |
|--------|------------|
| **Demurrage** | Время между выгрузкой в порту и следующей погрузкой |
| **Detention** | Время между выгрузкой в порту и возвратом порожнего контейнера |

---

## Roadmap (отложено)

- API changes для container return
- Dxx Incoterms automation
- Detention/Demurrage Smartlist

---

## 🔗 Граф-метаданные
- **id:** `tms.features.container.container-return`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632586289 · **repo:** `tms/features/container/container-return.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

