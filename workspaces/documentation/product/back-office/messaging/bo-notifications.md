---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632225858
source_type: confluence
---
# BO Messaging — Уведомления Back-Office (BON)

Новая система inbox-уведомлений и задач в Back-Office на основе объекта BON (BO_notification).

> Источник: слайд `2026 04 - BO Messaging`

---

## Объект BON

| Поле | Тип | Описание |
|------|-----|---------|
| Source L1 | String | Источник первого уровня |
| Source L2 | String | Источник второго уровня |
| Enriched text | Text | Текст уведомления |
| Sender | User | Отправитель |
| Recipient | User | Получатель |
| Status | Enum | pending / archived / replanned |
| Read_Status | Boolean | Прочитано / не прочитано |

---

## Inbox — вкладки

| Вкладка | Описание |
|---------|---------|
| **Pending** | Непросмотренные уведомления |
| **To Do** | Запланированные задачи |
| → This Week | Задачи на эту неделю |
| → Next Week | Задачи на следующую неделю |
| → Later | Задачи дальше |
| **Archived** | Архив (авто-архивация через 20 дней) |

---

## Plan Task Modal (быстрые опции)

| Опция | Время |
|-------|-------|
| This afternoon | 14:00 |
| Tomorrow | 07:00 |
| In 2 Days | +2 дня, 07:00 |
| Next week | Пн следующей недели, 07:00 |
| In 7 days | +7 дней |
| Specific date | Выбор даты + время 07:00-18:00 |

---

## Горячие клавиши

| Клавиша | Действие |
|---------|---------|
| `ENTER` | Archive |
| `CTRL+R` | Replan modal |
| `R` | Reply |
| `A` | Archive |
| `D` | Replan |

---

## Touchpoints (изменение)

В AM Touchpoints: две раздельные кнопки вместо одной:
- 🔵 **Синяя** кнопка → Internal Note
- 🟢 **Зелёная** кнопка → TouchPoint (с mood/contact)

---

## 🔗 Граф-метаданные
- **id:** `back-office.messaging.bo-notifications`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 632225858 · **repo:** `back-office/messaging/bo-notifications.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

