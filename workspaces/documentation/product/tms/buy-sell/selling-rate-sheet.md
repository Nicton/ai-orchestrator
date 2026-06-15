---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632062099
source_type: confluence
---
# Selling Rate Sheet — Тарифный лист для клиентов

**Selling Rate Sheet** — тарифная таблица для продажи транспортных услуг 3PL Customers. Симметричен существующему Rate Sheet (Buy/Buying Rate Sheet) для покупки у перевозчиков.

> Источник: слайд `2025 12 - Buy&Sell - Selling Rate Sheet`

---

## Когда доступно

- Тип аккаунта: **Buy & Sell**
- Rate Sheet включён (по умолчанию включён для TBS-аккаунтов)

В навигации появляются два пункта рядом: **Rate Sheet** и **Selling Rate Sheet**.

---

## Отличия от Buy Rate Sheet

| Параметр | Buy Rate Sheet | Selling Rate Sheet |
|----------|---------------|-------------------|
| Логотип в списке | Логотип перевозчика | Логотип 3PL Customer / Partner |
| Поле "Partner" | Carrier | Переименовано в "Customer" (опционально) |
| Привязана к Entity | Buying Entity | Selling Entity |
| Уровень Galaxy | Да | Нет (пока не нужен) |
| Service concept | Видим | Скрыт (пока) |

---

## Поля Selling Rate Sheet

| Поле | Обязательное | Описание |
|------|-------------|---------|
| Name | ✅ | Название тарифного листа |
| Customer | — | 3PL Customer (опционально; если не указан — применяется ко всем) |
| Mode | ✅ | Режим транспортировки |
| Range of validity | — | Период действия |
| Selling Entity | — | Юридическое лицо продавца |

**Selling Rate Sheet без Customer** = общий тариф (GENERAL) — применяется ко всем клиентам.

---

## Применение при создании TR (CSW Step 2)

```
Пользователь заполняет TR
    ↓
На шаге 2 (выбор тарифа):
  Вариант A: кнопка "Check Rates" — ручной запрос
  Вариант B: автоматический расчёт (предпочтительный)
    ↓
Отображаются результаты Selling Rate Sheets
    ↓
Всегда внизу: "Manual QUOTE" — ручной ввод цены
```

---

## Отображение результатов

| Тип Rate Sheet | Логотип | Что показывается |
|---------------|---------|-----------------|
| GENERAL (без Customer) | Логотип BUYER | Название RS, цена, lead time, routing |
| С конкретным Customer | Логотип Customer | Название RS, цена, lead time, routing |

Не показываются: имя перевозчика, локация.

---

## После выбора тарифа

- Цена на TR обновляется
- Предыдущие данные о ценообразовании стираются и заменяются
- В чат TR добавляются записи лога

---

## Поведение при изменениях TR

- Если изменён Packing List или локации → появляется кнопка **Recalculate**
- Если тарифы ещё не проверялись → появляется кнопка **Check Rates**

---

## 🔗 Граф-метаданные
- **id:** `tms.buy-sell.selling-rate-sheet`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632062099 · **repo:** `tms/buy-sell/selling-rate-sheet.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

