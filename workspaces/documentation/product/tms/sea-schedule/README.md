---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629571610
source_type: confluence
---
# Sea Schedule — расписания морских линий

> Сверено с кодом 2026-06-13 | `services/sea_schedule.js`, controller/routes `sea_schedule.js`, frontend `sea-schedule`, интеграция OceanInsights + INTTRA

## Зачем (бизнес-контекст)

Морское бронирование начинается с вопроса «какое судно и когда идёт из порта A в порт B?». Эти данные — у провайдеров расписаний, не в Shiptify. Модуль Sea Schedule подтягивает расписания из **OceanInsights** (внешний API), сопоставляет перевозчиков по SCAC с теми, что подключены у шиппера, и позволяет забронировать рейс через **INTTRA**. Без него морскую отправку пришлось бы заводить вслепую, не зная реальных рейсов.

## Как устроено (код)

- Источник: внешний API **OceanInsights** (`config.oceanInsights`: apiUrl, apiToken; эндпоинты p2pquery/carriers/ports). Запрос расписания асинхронный с поллингом (p-retry).
- Сервис `sea_schedule.js`: getSchedule (departurePort/arrivalPort/etd/eta/weekPeriod/carrier), getCarriers, getPorts (кэш).
- Контроллер обогащает результат данными перевозчиков Shiptify по SCAC; фильтрует carriers по доступным шипперу.
- Бронирование: `POST /sea-schedule/booking/inttra` создаёт морскую SR; `PATCH` обновляет (через INTTRA-интеграцию, AS2).

## Где найти и настроить (UI)

Frontend `sea-schedule` → поиск расписаний (порт отправления/прибытия, даты, период недель, перевозчик) → выбор рейса → бронирование. API: `GET /sea-schedule`, `/sea-schedule/carriers`, `/sea-schedule/ports`, `POST/PATCH /sea-schedule/booking/inttra`.

## Сценарии

1. **Найти рейс**: задать POL→POD + окно дат → список доступных судов/линий с ETD/ETA.
2. **Забронировать через INTTRA**: выбрать рейс → booking/inttra → создаётся морская заявка с данными судна.
3. **Только подключённые перевозчики**: список carriers фильтруется по тем, с кем у шиппера есть связь (SCAC-матчинг).

---

## 🔗 Граф-метаданные
- **id:** `tms.sea-schedule`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629571610 · **repo:** `tms/sea-schedule/README.md`
- **code_refs:** `backend/app/services/sea_schedule.js`, `controllers/api/sea_schedule.js`, `routes/api/sea_schedule.js`, `frontend/public/app/sea-schedule`
- **modules:** TMS, Integrations (OceanInsights, INTTRA), Sea Freight
- **references:** `tms.carriers`, `integrations.edi`, `tms.features.sea-freight-ship-data`
- **requirements:** нет — реализовано без требований
