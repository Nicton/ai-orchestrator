---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632913985
source_type: confluence
---
# Location Creation — Создание локаций

Переработанный wizard создания локаций и автоматическая привязка к партнёрам.

> Источники: `2026 02 - Location creation`, `2026 02 - Link Address id and Partner id`

---

## Создание локации (новый wizard)

### Новый 2-экранный флоу

1. **Экран 1:** Ввод адреса (обязательный, до выбора типа)
2. **Экран 2:** Тип локации + дополнительные поля

### Изменения

| Было | Стало |
|------|-------|
| "Final Customer" | **B2C** (бэкенд автоматически ставит `THIS LOCATION IS A PERSONAL LOCATION = 1`) |
| Toggle "Save into my network" | **Убран** — локации всегда сохраняются автоматически |
| Toggle "This location is a personal location" | **Убран** из UI |

### Типы локаций (полный список)

`Warehouse` / `Factory` / `Store` / `Head office` / `Port` / `Airport` / `B2C` / `Other`

---

## Привязка Адреса к Партнёру

### Автоматическое создание партнёра

При заполнении поля **COMPANY NAME** на локации → автоматически создаётся Partner с ролями: **SUPPLIER + CUSTOMER** (по умолчанию).

### Кликабельный тег

Тег с именем компании в списке локаций становится кликабельным → открывает карточку Partner в новой вкладке.

### Partner modal

- Привязанная локация показывается как **read-only card**
- (Известный UI баг: inline edit задокументирован)

### В CSW wizard

- Поле SUPPLIER **автоматически предзаполняется** из COMPANY NAME адреса
- Приоритет в dropdown:
  1. Partner + location link (оба совпадают)
  2. Partner только (без совпадения локации)
  3. Чистый адрес (исключая совпавшие элементы)

---

## 🔗 Граф-метаданные
- **id:** `tms.master-data.location-creation`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632913985 · **repo:** `tms/master-data/location-creation.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

