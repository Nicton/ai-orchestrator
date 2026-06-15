---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631701538
source_type: confluence
---
# Vanna AI — Аналитика Back-Office на естественном языке

**Vanna UI** — инструмент аналитики внутри Admin Panel Shiptify Back-Office, позволяющий делать SQL-запросы на естественном языке.

> Источник: слайд `2025 12 - Vanna UI`

---

## Для кого

Только внутренние команды (Sales, Support, Product). Недоступно для Shipper/Carrier.

---

## Интерфейс

```
BO Shiptify Analytics with Vanna AI
  ┌──────────────────────────────┐
  │  [Sales Fav] [Project Fav]   │
  │  [Support Fav] [Product Fav] │
  ├──────────────────────────────┤
  │  Or enter your own question: │
  │  [_________________________] │
  │                              │
  │  [List of available fields ↗] │
  └──────────────────────────────┘
```

---

## Возможности

| Функция | Описание |
|---------|---------|
| Избранные запросы | Сохранение запроса в именованную папку, цвет папки, описание |
| Группы избранного | Sales / Project / Support / Product Favorites |
| Free-text вопрос | Пользователь вводит вопрос на естественном языке |
| Available fields | Панель доступных полей (открывается в отдельной вкладке) |
| Export | CSV или XLS |

---

## Правила обогащения промптов (применяются автоматически AI)

1. Если запрошен листинг без сортировки → применяется `SORT DESC` по умолчанию
2. Если запрошено "most active", "listing" и т.д. без лимита → применяется `TOP 15` по умолчанию

---

## Известные проблемы (из тестирования)

- Добавление фильтра по shipper_id неожиданно снижает количество записей
- Массив shipper IDs изменяет количество результатов непредсказуемо
- Предустановленный запрос на "booked shipments" возвращает 0 (вероятно, использует тип 'Shipment' вместо 'Shipment Request')
- Изменение временного окна с 7 на 30 дней вызывает сбой запроса

---

## Внедрение

- Embed Vanna напрямую в Admin Panel (предпочтительно)
- Если сложно → кнопка редиректа на Vanna интерфейс

> ✅ ПО JIRA (2026-06-11): выбран и реализован вариант **редирект-кнопки** — AI-156 Done (2026-04-10), интеграция вне монорепо. Доступ в prod — whitelist 5 пользователей (`VANNA_WHITE_LIST`), на остальных окружениях `VANNA_ALLOW_ALL_USERS=true`. Баги из тестирования исправлены (AI-153, AI-197..203, апрель 2026); КБ генерируется из DDL BI-базы (AI-200, схема в `migrations-bi`).

---

## 🔗 Граф-метаданные
- **id:** `back-office.vanna-ai-analytics`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 631701538 · **repo:** `back-office/vanna-ai-analytics.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

