---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632750081
source_type: confluence
---
# 1CM Navigation Bar — Навигация Back-Office

Back-Office использует навигационную панель **1Centimeter (1CM)** с 9 основными меню.

> Источник: слайд `2025 10 - 1Centimeter BO`

---

## 9 меню BO

| № | Меню | Псевдоним | Иконка |
|---|------|----------|--------|
| 1 | Masterdata | Data | 🗂 |
| 2 | Curation | Cure | — |
| 3 | CRM | CRM | — |
| 4 | Marketing | Mkt | — |
| 5 | Growth | Growth | — |
| 6 | Billing | Rev | — |
| 7 | Dictionary | Dico | — |
| 8 | Dashboard | Dash | — |
| 9 | Admin | Admin | — |

Ссылка **Visit app** отображается жёлтым цветом в левом нижнем углу 1CM-панели.

---

## Технические требования

- 9 иконок (picto) в стиле 1CM App bar — задача для дизайнера (CM)
- Общая иконка для всех подменю изначально; индивидуальные — позже
- Будущее: управление правами видимости меню per user (не в начальном скоупе)

---

## Поведение подменю

**Взаимодействие: клик** (не hover/mouseover).

Кликабельный вход в 1CM bar → открываются подменю соответствующего раздела.

> Hover-модель была откатана в марте 2026 (см. `2026 03 - 1cm mouseover rollback`)

---

## Session Persistence

При переподключении пользователь попадает на то же **MENU** и ту же **PAGE**, что были открыты при последнем посещении.

---

## История изменений

| Дата | Изменение |
|------|-----------|
| Mar 2025 | Первое введение 1CM bar для BO |
| Oct 2025 | Уточнение названий меню и иконок (данный слайд) |
| Mar 2026 | Откат с hover на click для открытия подменю |

---

## 🔗 Граф-метаданные
- **id:** `back-office.navigation.1cm-bar-bo`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 632750081 · **repo:** `back-office/navigation/1cm-bar-bo.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

