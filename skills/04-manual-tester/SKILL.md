---
name: 04-manual-tester
description: Convert strategy into executable manual test cases AND, before any manual work, produce ready-made task analytics — what changes, a prioritized risk/test checklist, and likely bug locations — straight from Jira + the real feature-branch code in workspaces. Use when a tester needs a verification plan, browser-level execution, automation-ready steps, or an up-front "where the bugs probably are" briefing for a Jira task.
---

# Manual Tester Skill

## Role

Execute scenarios manually in browser based on QA architecture and document executable test cases. **Before execution**, run the Pre-Work Task Analysis (below) so the tester starts with a code-grounded briefing instead of a blank ticket.

## Inputs

- QA Architect test strategy/matrix
- Tagged UI (data-testid)
- A Jira key (e.g. `TMS-3726`) — for Pre-Work Task Analysis

## Outputs

- Test cases with clear steps/expected results
- Execution notes and evidence
- Referenced `data-testid` per step
- Defect notes (if any)
- **Pre-work briefing** (3 deliverables: what changes / risk checklist / defect candidates)

## Done Criteria

- Core and variant scenarios executed.
- Test cases are automation-ready.
- Evidence attached for pass/fail outcomes.

---

# Pre-Work Task Analysis (extended capability)

**Цель:** перед началом тестирования отдать тестировщику готовую аналитику по задаче — что меняется по сути, что проверять (приоритизировано, с шагами воспроизведения и `file:line`), и где вероятнее всего баги. Источник истины — **реальный код ветки**, а не описание задачи и не AI-сводка в комментариях.

## Принципы

- **Код > комментарии > описание.** AI-сводки и комментарии задают карту файлов, но каждый их тезис проверяется по диффу. Описание задачи — намерение, а не факт.
- **Один коммит, а не вся ветка.** `git diff merge-base..branch` тащит чужой дрейф develop. Смотри именно коммит(ы) задачи.
- **Контракты на стыках.** Большинство тихих багов — на границах: фронт↔бэк (значения enum/const), листинг↔дропдаун (ACL), легаси-колонка↔новый источник, ORM-версия (raw vs не-raw).

## Actions

1. **Достань задачу из Jira** (MCP Atlassian).
   - `getJiraIssue` c `fields: ["summary","description","status","assignee","comment","parent"]`, `responseContentFormat: "markdown"`.
   - ⚠️ Ответы JQL/issue часто превышают лимит токенов → сохраняются в файл. На этой машине **нет `jq`/`python`, но есть `node`** — парси файл узлом: `node -e 'const d=JSON.parse(require("fs").readFileSync(F));…'`.
   - Прочитай всю ветку комментариев: там продуктовые уточнения (что считать правильным поведением) и AI «Finish Summary» с картой файлов/функций.

2. **Собери контекст связей.**
   - JQL по тексту фичи → найди QA Review / STY Review сабтаски (критерии приёмки), предшественника фичи, и баги-соседи.
   - `getJiraIssueRemoteIssueLinks` — иногда там PR; пусто ≠ нет кода.

3. **Возьми реальный код ветки** (репозитории живут в `workspaces/<repo>` как настоящие git-репы).
   - Имя ветки по конвенции: `feature/<JIRA-KEY>`. `git fetch origin feature/<KEY>`.
   - Найди коммит(ы) задачи: в сообщении коммита есть ссылка на Jira → `git log --oneline --all --grep <KEY>` или хэш из AI-сводки.
   - `git show <commit>` и `git show <commit> --stat` — это и есть предмет ревью. Для контекста читай целые функции: `git show origin/feature/<KEY>:<path> | sed -n 'A,Bp'`.
   - Проверь фронт И бэк (обычно отдельные коммиты в `backend` и `frontend-mono`).

4. **Прогони код через эвристики «где прячутся баги»** (см. чеклист ниже). Для каждого подозрения — подтверди или сними по коду, зафиксируй `file:line`.

5. **Отдай 3 артефакта:**
   - **(A) Что меняется радикально** — суть поведения до/после (часто это смена семантики, а не модели данных; явно развей мифы из описания/AI-сводки, если код их опровергает).
   - **(B) Чеклист проверки** — приоритеты 🔴/🟠/🟡/🟢, для каждого пункта: конкретный сценарий воспроизведения + `file:line` + ожидаемое поведение. Негатив-кейсы обязательны.
   - **(C) Кандидаты в дефекты** (code review) — найденные/возможные баги с механизмом и фиксом; честно помечай «verify» там, где без прогона БД/приложения не уверен.

6. **Предложи следующий шаг:** оформить (B)/(C) в комментарий к QA-Review сабтаску, либо передать в `02-qa-architect` для матрицы, либо в `05-automation`.

## Чеклист «где прячутся баги» (Shiptify-специфика)

- **Паритет ACL.** Один путь (листинг) и второй (дропдаун/экспорт/виджет) часто имеют ДВЕ копии правил доступа → разъезжаются. Сверь, что вторичный путь гейтит ветки по `account.access_list` так же, как основной (`buildTemplateAccessConditions` и аналоги).
- **Размножение строк в JOIN.** `required:true` `hasMany`-include без `distinct`/`group` → дубли родителя при нескольких дочерних. В Sequelize **3.x** не-`raw` findAll сам схлопывает по PK, а `raw:true` — нет (тогда нужен явный `group`). Версия ORM решает исход — проверь `package.json`.
- **Пагинация/счётчики** ломаются вслед за дублями строк.
- **Контракт фронт↔бэк.** Значения enum/const должны совпадать буквально (пример: `direction` `'from'/'dest'` на фронте = колонка `dir` на бэке). Несовпадение → тихо пустой результат.
- **Легаси-колонка vs новый источник.** Если фильтр/отображение берут данные из разных мест (`from_address_id` колонка ↔ join-таблица), они расходятся. Проверь, что запись идёт в оба и есть бэкафилл.
- **«Новая» таблица, которая старая.** Перед паникой про миграцию — `git grep` по `db/migrations`: таблица может существовать годами и наполняться при сохранении.
- **Falsy-фолбэки.** `forceArray(x) || DEFAULT` — мёртв, т.к. `forceArray(undefined) === [undefined]` (truthy). Полагается на то, что вызывающий всегда шлёт параметр.
- **Диспатч-фолбэк.** Условие вида `if (flagA && cond && account.shipper_id)` при пустом `shipper_id` тихо проваливается в другую ветку (часто — «показать всё»).
- **LIKE без экранирования.** `%${q}%` + `$ilike` — `%`/`_`/`\` во вводе работают как шаблон (не инъекция — Sequelize биндит — но кривой поиск).
- **Дубли данных.** Дедуп по PK (`group: ['Model.id']`) не убирает дубликаты одной сущности, лежащей разными строками (наследие задач «remove duplicate»).
- **Индексы под новый горячий путь** (join/фильтр по новым колонкам) — проверь, что есть.

## Rules

- Никогда не пиши «по описанию» — только то, что подтверждено диффом ветки (`file:line`) или явно помечено «verify (нужен прогон)».
- AI «Finish Summary» — гипотеза, не факт; сверяй с кодом (в reference-run она верно называла файлы, но не раскрывала риски дублей/паритета).
- Различай дизайн и факт: если дока описывает одно, а код делает другое — фиксируй оба с пометкой расхождения (это кандидат в дефект).
- Severity честно: 🔴 функциональный баг с воспроизведением, 🟠 расхождение/возможный баг, 🟡 verify/edge, 🟢 робастность.

## Output (структура брифинга)

```
A. Что меняется: <2–5 строк, до/после, развенчание мифов>
B. Чеклист проверки:
   🔴 <название> — repro: <шаги>; expected: <…>; code: <file:line>
   🟠 …  🟡 …  🟢 …
C. Кандидаты в дефекты:
   [severity] <название> — <механизм> — <file:line> — <фикс>
Next: <куда передать>
```

## Reference run (2026-06-19 → TMS-3726 «Template Filtering: Location FROM/TO»)

Jira `getJiraIssue` (+comments) → нашли AI Finish Summary и продуктовый тезис erwan «match any FROM / any TO». Связи через JQL: QA-Review `TMS-3800`, STY-Review `TMS-3853/3854` (Done), предшественник `TMS-3725`. Код: `git fetch origin feature/TMS-3726` в `workspaces/backend` (коммит `d86e60da0a`) и `workspaces/frontend-mono` (`b0f900512d`); читали целые функции `listLocationsByTemplatesAndDirection` ([locations.js](../../workspaces/backend/app/services/locations.js)), `loadShipmentTemplates`/`buildTemplateAccessConditions` ([shipment-templates.js](../../workspaces/backend/app/services/shipment-templates.js), [templates.js](../../workspaces/backend/app/services/templates.js)). Итог брифинга:
- (A) «радикально» = смена семантики фильтра «первый адрес → любой адрес шаблона» + источник дропдауна `byShipments→byTemplates`; модель данных НЕ менялась (таблица `sh_template_addresses` с 2017 г.) — миф из описания снят кодом.
- (C) реальный дефект: **дропдаун не гейтит ACL по `access_list`**, в отличие от листинга → опции фильтра без результатов; + verify-пункты по дублям строк (Sequelize 3.35.1) и дублям адресов (наследие TMS-3658).
Вывод: блокеров нет, главный фикс — паритет ACL; (B)/(C) пригодны как основа приёмки в QA-Review сабтаске.
