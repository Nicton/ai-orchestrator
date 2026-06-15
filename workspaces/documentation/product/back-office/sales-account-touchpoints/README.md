---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631963682
source_type: confluence
---
# Sales Account Touchpoints — CRM для Account Managers

Модуль **AM (Account Manager)** в Back-Office: управление аккаунтами клиентов, регистрация touchpoints (ToPo), отслеживание рисков оттока (churn).

> Источник: слайд `2026 01 - Sales Account Touchpoints` (93 страницы)

---

## Навигация в BO

Новый раздел **AM** добавлен после "Growth" в sidebar BO:
- `AM > Accounts` — список аккаунтов
- `AM > Touchpoints` — список всех ToPo

Growth сохраняет: Dock leads, TMS leads, NSM.

---

## Sales Account Listing

### Фильтры и правила:
- Не показывать churned аккаунты (только Active и Paused)
- Фильтры отражаются в URL (закладки)

### Колонки:
| Колонка | Описание |
|---------|---------|
| TOPO status | Статус последнего touchpoint |
| GROUP | Цветные метки (Top 1 🔴, Top 2 🟠, Top 3 🔵, Others ⚫) |
| Churn Risk | No idea / Low / Med / High |
| Last Touchpoint | On Time / Limit / Late |
| MRR | Общий по всем аккаунтам (не только отображаемым) |
| Features Opportunities | Охват функций |

---

## Call Frequency (частота контактов)

Новое поле в редактировании аккаунта (значения: 15, 30, 60, 90, 150, 300 дней).

### Цветовые правила Last Touchpoint:
- `LTP > CallFreq * 1.1` → 🔴 **LATE**
- `LTP > CallFreq * 0.8` → 🟠 **LIMIT**
- Иначе → 🔵 **ON TIME**

### TOPO on-time логика:
- Нет ToPo + прошло > 90 дней с создания → чёрная метка "none"
- Нет ToPo + менее 90 дней → ничего не показывается

---

## Touchpoint (ToPo) — создание

### Типы ToPo:
`Visio | Call | On-site | Steering Committee | Internal Note`

### Поля для внешних типов (Visio/Call/On-site/SC):

| Поле | Обязательное |
|------|-------------|
| Main Contact | ✅ (поиск по email из Sales Account) |
| Summary | — |
| Mood | ✅ (😠 Angry / 😢 Sad / 😐 Neutral / 😊 Happy / ❤️ Love) |
| Churn Risk | — (No Idea / Low / Medium / High) |
| What He Loves (WHL) | — |
| What He Hates (WHH) | — |

### Поля для Internal Note:
- Notes
- Churn Risk

После сохранения ToPo → обновляются 2 поля на уровне Sales Account: **Mood** и **Last Touchpoint Date**.

---

## ToPo отображение

В сайдбаре: чат-стиль (новые снизу):
- Имя контакта, тип ToPo, дата
- WHL, WHH, Mood picto, Notes, Churn Risk
- Время с предыдущего ToPo
- Автор записи

---

## Touchpoints Listing Page

Отдельная страница со столбцами:
- Логотип аккаунта
- L1 account name / L2 ToPo owner
- MRR, Mood, Churn Risk, Summary, WHL, WHH, дата

Клик по строке → открывает Sales Account.

---

## Contact Management

| Изменение | Описание |
|---------|---------|
| Переименование | "Account Key Contact" → "Decision Maker" |
| Новая роль | "Key User" (2-я позиция после Key Buyer) |
| Последняя роль | "Other" |
| Показываются в панели | Только Key User + Decision Maker |

Создание контакта: поиск в базе пользователей по email; при нахождении — автозаполнение First Name, Last Name, Phone.

---

## Features / Opportunities Tracker

Статусы покрытия функций: **Covered** 🟢 / **Pending** 🔵 / **N/A** ⚫ / **I don't know** 🟠

Отслеживаемые функции:
TMS, Freight, Labelling, Invoicing, Control Tower, Seatrack, API Connection, Visit, DOCK, Driver Welcome, Peripass, API, Multi-Site

### Фильтры в листинге:
"Covered" и "Pending" — mono-select нескольких функций → показывает аккаунты, где ВСЕ выбранные функции в этом статусе.

---

## Общий MRR в заголовке

Отражает полное количество аккаунтов (например, 678), а не только отображаемые 100 на странице.

---

## 🔗 Граф-метаданные
- **id:** `back-office.sales-account-touchpoints`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 631963682 · **repo:** `back-office/sales-account-touchpoints/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

