---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632422598
source_type: confluence
---
# Slotbook UI — Улучшения контактного блока и packing list

UI-улучшения Slotbook на основе производственного feedback (Oct 2025).

> Источник: слайд `2025 10 - Slotbook UI in Prod feedback`

---

## 1. Contact Block (Stream 13-23)

### На уровне PML:
Показывается сгруппированный блок: **BOOKER** и **CARRIER**.

Правила:
- Если booker = carrier → показывается только блок booker
- Телефон и email берутся от user booker
- **Логотип = уровень ACCOUNT, не user**
- Если booker = SLOTIFY → брать информацию booker (минимум email)
- Если carrier не задан → блок размером на 1 элемент, не на 2

### На уровне Slotbooker:
Показывается: **PML** и **CARRIER**.

Правила:
- Телефон и email от user booker
- Телефон и mail из PML dock setting
- Логотип = уровень ACCOUNT, не user

### На уровне Slotbooker/Carrier:
Показывается: **Slotbooker** и **PML**.
- Телефон и mail из PML dock setting
- "No change but for documentation"

---

## 2. Packing List (Stream 24-29)

**Изменения:**
- Убрать заголовок "LOGISTICS MEAN"
- Значение logistic mean отображается inline, серым шрифтом ниже списка CARGO LINES

**Структура строки:**
```
Строка 1: содержимое packing list
Строка 2: вес / объём / etc.
Строка 3: logistic means (серый, inline)
```

Добавить визуальный разделитель между "Slot packing list" и "Orders".

> Не применяется к конфигурациям: DR, MULTE, CUSTOM.

---

## 3. MD Improvement Block (Stream 31-32)

**MD (Movement Declaration)** блок должен отображаться **ТОЛЬКО** если:
- Пользователь начал заполнять MD
- И формат MD получил "зелёный свет"

> Отмечено как SKIP (возможно отложено).

---

## 🔗 Граф-метаданные
- **id:** `tms.slots.slotbook-ui-feedback`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632422598 · **repo:** `tms/slots/slotbook-ui-feedback.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

