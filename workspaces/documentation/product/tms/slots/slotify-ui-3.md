---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632094900
source_type: confluence
---
# Slotify UI 3.0 и 3.1 — Переработка интерфейса

Масштабная переработка Slotify UI (May 2026): новый процесс регистрации, Department поле, улучшенный поиск городов.

> Источники: `2026 05 - Slotify UI 3.0` и `2026 05 - Slotify UI 3.1`

---

## Slotify UI 3.0

### Процесс регистрации (разделён)

Регистрация разбита на отдельные шаги:
- Шаг 1: основные данные (email **убран** из шага 1)
- Шаг 2 (новый): email + дополнительные данные + **номер телефона (обязателен)**

### Новое поле "Department"

Только для пользователей типа Supplier/Customer.
Сохраняется на уровне **DOMAIN** при первом создании.

| Значение | Описание |
|---------|---------|
| Sales Administration (ADV) | Администрирование продаж |
| Planning | Планирование |
| Purchasing/Procurement | Закупки |
| Warehouse & Operations | Склад и операции |
| Transport & Freight | Транспорт и грузоперевозки |
| Production/Manufacturing | Производство |
| Finance & Accounting | Финансы |
| Maintenance & Facilities | Техобслуживание |
| Customer Service | Служба поддержки |
| General Management | Общее руководство |
| Other | Другое |

i18n ключ: `slotify.service.key`

### Поиск городов

- Совпадения "начинается с" — первые (алфавитный порядок, без учёта дефисов)
- Затем — частичные совпадения

### Packing List (routing)

- 2+ заказа → всегда переходит к General Packing List (пропускает детализацию по заказу)

### Последний экран

- Показывать **INSTRUCTIONS** вместо карты
- Driver/truck данные в формате METADATA
- Группировка: Instructions → COMMENT

---

## Slotify UI 3.1

### Заголовок страницы входа (обновлён)

- Убрать текст "Slot Booking"
- Адрес: 2-строчный формат
- Добавить: "Slotbook services provided by"
- Добавить: "Contact us" → `contact.slotify@shiptify.com`

### Разделение Шага 1 → 1.1 + 1.2

- **1.1:** Deliver/Pickup + Carrier/Supplier-Customer
- **1.2:** email + телефон (обязательны)

### Floor field логика

| Состояние | Отображение |
|----------|------------|
| Floor = Total (default) | Серый цвет |
| Total > Floor | Очень светло-синий |
| Тип = "Floor" | Поля переходят на 2-ю строку |

### Языковая поддержка

Language-aware redirect: при входе на Slotify — сохраняется язык страницы → попадает на шаг ввода пароля с правильным языком.

### Country flags (обновлён стиль)

- Flat design (без теней)
- Флаг: **слева**
- Dropdown открывается: **снизу**
- Inline поиск в dropdown
- ISO5-код города НЕ показывается

---

## 🔗 Граф-метаданные
- **id:** `tms.slots.slotify-ui-3`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632094900 · **repo:** `tms/slots/slotify-ui-3.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

