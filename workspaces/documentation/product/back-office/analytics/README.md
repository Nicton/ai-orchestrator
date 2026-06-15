---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631504931
source_type: confluence
---
# Analytics — Дашборды и аналитика в Back-Office

## Обзор

Back-Office содержит два типа аналитических инструментов:
1. **Iframe-дашборды** — внешние дашборды (Today, Ops), встроенные через подписанный JWT
2. **Native AM Dashboard** — нативный React-дашборд для Account Managers (реализован в v1.0, отгружен 2026-04-20)

## AM Dashboard (нативный дашборд Account Managers)

**Маршрут в приложении:** `/am-dashboard`
**Redux-контейнер:** `amDashboard.tsx`

Dashboard размещён на отдельном маршруте (не вложен в страницу Sales Accounts). Фильтр по Account Manager применяется ко всем трём панелям одновременно.

### Панель 1 — Customers (Клиенты)

**API:** `GET /api/v1/sales-accounts/dashboard/customers`
**Параметры:** `accountManagerId` (опционально)

Агрегирует данные по активным и paused Sales Accounts:

| Метрика | Описание |
|---|---|
| `mood.total` | Общее число аккаунтов |
| `mood.distribution` | Массив `{mood: 1-5, count, percentage}` |
| `churnRisk.distribution` | Массив `{riskLevel, count, percentage, mrrSum}` |

Мood берётся из последнего тачпоинта по каждому аккаунту (`ORDER BY created_at DESC LIMIT 1`). Risk level — из поля `sales_accounts.risk_level`.

**Emoji настроения:** 1=Angry, 2=Sad, 3=Neutral, 4=Happy, 5=Love (константы из `client/constants/salesAccount.ts`).

### Панель 2 — Touchpoints per AM (Тачпоинты по AM)

**API:** `GET /api/v1/sales-accounts/dashboard/touchpoints`
**Параметры:** `accountManagerId` (опционально)

Показывает таблицу: AM × месяц (6 месяцев скользящим окном). Каждая ячейка = число уникальных Sales Accounts, с которыми AM взаимодействовал в этом месяце.

**Источник данных:** `sa_touchpoints_history` JOIN `sales_accounts_touchpoints` (не прямо из тачпоинтов — источником является история).

**Правила подсчёта:**
- Internal Note исключается (`IS DISTINCT FROM 'internal_note'`)
- Один аккаунт, тронутый дважды в одном месяце, считается как 1
- Строка TOTAL: уникальные аккаунты кросс-AM (аккаунт, тронутый двумя AM, в TOTAL считается один раз)
- Атрибуция идёт по **актору** (`h.user_id`), а не по владельцу аккаунта

**Ответ:**
```
{
  months: ["2026-06-01", "2026-05-01", ...],  // 6 месяцев DESC
  rows: [{ accountManagerId, accountManagerName, counts: [n, n, ...] }],
  total: { counts: [n, n, ...] }
}
```

### Панель 3 — AMOpps Pipeline

**API:** `GET /api/v1/sales-accounts/dashboard/amopps`
**Параметры:** `accountManagerId` (опционально)

Агрегирует суммы возможностей AMOpps по типам продуктов (только активные/paused аккаунты, статусы: `pending`, `refused`, `competitor`).

**Ответ:**
```
{
  rows: [{ type, pendingSum, refusedSum, competitorSum }]
}
```

Суммы форматируются как компактные EUR (например, `16.0 k€`) через утилиту `client/utils/formatEur.ts`.

Порядок сортировки — по умолчанию Pending DESC (пользовательская сортировка не предусмотрена).

### Фильтр AM Dashboard

Фильтр по Account Manager — Single-select с возможностью сброса (isClearable). Компонент `DashboardFilter` использует те же CSS-классы (`p-table__filters`, `p-table__filters-group`), что и страница AM Sales Accounts — для визуальной согласованности.

## NSM (North-South Metrics)

**Маршрут:** `nsm.tsx`
**API:** `GET /api/v1/nsm-statistic`

Показывает помесячную динамику уникальных активных аккаунтов за 25 месяцев по 4 сегментам:

| Сегмент | Описание |
|---|---|
| TM Stats | Аккаунты с ≥10 TM-отправками в месяц |
| SB Stats | Аккаунты с <10 TM и >5 Slotbook-отправками |
| Slotify Stats | Аккаунты Slotify |
| TMSB Stats | Комбинированный TM+Slotbook |

Данные кэшируются в Redis (ключ `nsm`, TTL из конфига `CACHE_REDIS_TTL`). Текущий месяц загружается live поверх кэша при каждом запросе.

## Iframe-дашборды (Today / Ops)

**API:** `GET /api/v1/dashboards/today` и `GET /api/v1/dashboards/ops`

Оба эндпоинта возвращают подписанный URL вида:
```
{config.dashboardUrl}/dashboards/{type}/{token}?isExternal=true
```

Токен генерируется через `generateShareableDashboardToken` с полезной нагрузкой `{type}`. TTL: 7 дней для внутреннего использования, 1 день для shared-ссылок.

Excel-экспорт Ops-дашборда запускается через очередь задач (`publishExcelActions('operationsDashboardExport', { input: { startDate, endDate } })`) и возвращается асинхронно.

## Технические решения v1.0 AM Dashboard

- Источник истории тачпоинтов — `sa_touchpoints_history` (не `sales_accounts_touchpoints`) — обеспечивает атрибуцию по актору изменения
- Независимые флаги загрузки по панелям (`customers/loading`, `touchpoints/touchpointsLoading`, `amopps/amoppsLoading`) — быстрые эндпоинты рисуют раньше медленных
- SCSS дашборда использует flat BEM-селекторы по аналогии с `_p-am-opportunities.scss`
- Нулевые изменения фронтенда при смене источника данных в Phase 4 (shape ответа сохранён byte-identical)

---

## 🔗 Граф-метаданные
- **id:** `back-office.analytics`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 631504931 · **repo:** `back-office/analytics/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

