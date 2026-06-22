---
name: 31-release-notes-writer
description: Generate Shiptify PROD release notes "by all the rules" for THREE audiences — QA/testers (changed areas, touched frontend routes, DB changes, mandatory regression, likely-bug zones from the code), developers (who shipped what, by which task — contribution view), and business (value per module, which customer type benefits, where product value grew). Starts from the git delta since the last release across all prod repos (baseline only), then enriches via Jira + code analysis. Use when assembling/announcing a release or previewing what a release-candidate contains.
---

# Skill: release-notes-writer

## Mission

Превратить **дельту кода с прошлого релиза** (точка отсчёта, не самоцель) в **три отчёта под три ЦА**. Сырой список коммитов — лишь вход; ценность — в агрегации коммиты→задачи→модули→ценность и в код-анализе влияния. Один прогон даёт три самостоятельных markdown-отчёта (QA / Devs / Business), пригодных для хранения в истории searchify, копирования и перевода по запросу.

Релиз в Shiptify — это **coordinated release train**: каждый прод-репозиторий версионируется своим semver-тегом и деплоится отдельно, а ноты сводят всё смёрженное к дате выката по всем репам. Источник истины — **git + Jira + код**, не Jira `fixVersion` (он не используется).

## Inputs

- `to` (optional) — верхняя граница релиза. Default: `origin/develop` HEAD каждого репо (или release-candidate тег).
- `from` (optional) — точка отсчёта. Default: **последний prod-тег каждого репо** (`v*`, см. ниже). Можно задать датой (тогда — коммиты после даты прошлого релиза).
- `repos` (optional) — список репо. Default: 17 прод-деплоящихся (см. «Состав релиза»).
- `lang` (optional) — язык генерации отчётов. Default `ru`. Перевод на другие языки — **по запросу**, не предгенерить.
- `audiences` (optional) — какие из трёх отчётов собрать. Default: все три.

## Состав релиза (прод-репозитории, baseline-источники)

Дельту собирать по этим репам (у всех есть prod-деплой). Группы GitLab `shiptify/…`:

| Репо | Путь | Что покрывает | Версия-тег |
|---|---|---|---|
| backend | apps/main-app/backend | API, бизнес-логика, модели, миграции в коде | `v0.x` |
| frontend-mono | apps/frontend-mono | Основной фронт (монорепо) | `v1.x` |
| frontend | apps/main-app/frontend | Легаси-фронт (почти мигрирован) | `v*` |
| mini-apps | (top) | DOCK-экраны, slotify | `v*` |
| back-office | apps/back-office | Back-Office UI | `v*` |
| admin-app | (top) | Admin BO (интеграц. конфиги) | `v*` |
| public-api | apps/public-api | Публичный API | `v*` |
| public-api-docs | (top) | Доки публичного API | `v*` |
| integrations | apps/integrations/integrations | Коннекторы интеграций (SI-*) | `v1.x` |
| ups | apps/integrations/ups | UPS | `v*` |
| brinks | apps/integrations/brinks | Brinks | `v*` |
| generate | apps/attachments/generate | Генерация вложений/CMR | `v*` |
| emailing | (top) | Шаблоны писем | `v*` |
| notifications | apps/notifications | Нотификации | `v*` |
| microservices | apps/microservices | Микросервисы (auth и пр.), release-стадия | release-cli |
| migrations | apps/db/migrations | DB-миграции (прод job) | `job.production` |
| migrations-bi | apps/db/migrations-bi | Datalake/BI миграции | prod |

НЕ входят (не деплоятся / заготовки): `core-libs`, `stream-topics`, `translations`/`package-translations` (пакеты, потребляются на сборке), `chat`, `identity` (пустые), `documentation`, `main-app-automation`, `run-local`, `testing-tools`, `ai-shared`. Их коммиты в ноты не тянуть (кроме `translations` — как индикатор i18n-работы, опционально).

## Actions

### 1. Baseline — собрать дельту (точка отсчёта)
Для каждого прод-репо в `workspaces/<repo>`:
```
git fetch --quiet --all
LAST=$(git tag --sort=-creatordate | grep -E '^v[0-9]' | head -1)   # последний prod-тег
git log "$LAST"..origin/develop --no-merges --pretty='%H%x09%an%x09%ad%x09%s' --date=short
git diff --name-only "$LAST"..origin/develop                        # затронутые файлы
```
- Если `from` задан датой — `--since`. Если репо тегов не имеет (microservices) — взять прошлый release-тег/коммит из CI.
- Из каждого коммита извлечь: **conventional-type** (`feat|fix|chore|refactor|perf|...`), **Jira-ключи** (`[A-Z]+-\d+`), автора, файлы.
- ⚠️ Коммиты без Jira-ключа (`chore: …`) — это секция **Other**, не теряй их.

### 2. Агрегация коммиты → задачи
- Сгруппировать все коммиты (по всем репам) по **Jira-ключу** → одна «единица релиза» на тикет (тикет может жить в нескольких репах: backend+frontend-mono+migrations).
- Подтянуть из Jira (`getJiraIssue`, см. грабли ниже): `summary, issuetype, status, assignee, components, labels, parent, project`.
- Классифицировать: **Feature** (Story/Task feat), **Bugfix** (Bug/fix), **Other** (chore/refactor/infra, в т.ч. без ключа).
- Привязать к **модулю продукта**: по Jira-проекту (TMS/DOCK/SI/TD), `components`/`labels` и по путям изменённых файлов (см. карту ниже).

### 3. Код-анализ влияния (для QA-отчёта)
По набору изменённых файлов вывести:
- **Затронутые фронт-роуты/экраны.** Файлы в `frontend-mono/packages/frontend/public/app/<module>/…`, `mini-apps`, `back-office`, `admin-app` → модуль/роут/экран. Сопоставь с граф-нодами searchify (`screen`/`modal`/`module` в `graph.json`).
- **Изменения БД.** Любые коммиты в `migrations`/`migrations-bi`; новые/изменённые `backend/app/models/*`; изменения, требующие `db:push`. Перечисли таблицы/колонки.
- **Backend-поверхность.** Изменённые `controllers/*`, `routes/*`, `services/*` → API-эндпоинты и доменные области.
- **Зоны риска** (где вероятнее баги) — применить эвристики из `[[04-manual-tester]]` (паритет ACL, размножение строк в JOIN, контракт фронт↔бэк, легаси-колонка vs новый источник, falsy-фолбэки, диспатч-фолбэк, индексы). Плюс структурные сигналы: большой diff, изменения в shared/core-хелперах, ACL/permissions-файлах, файлах с историей дефектов (`docs/qa/defects-index.json`), кросс-модульные правки.
- **Обязательный регресс.** Из затронутых модулей/экранов — список разделов под регресс; приоритезировать по «риск × охват пользователей».

### 4. Сборка трёх отчётов
Каждый отчёт — самостоятельный markdown с шапкой: `release id` (дата + перечень repo@tag), ЦА, дата генерации.

**A. QA / Тестировщики** (что и где проверять)
- Разделы программы с изменениями (по модулям) + ссылки на задачи и их QA-Review сабтаски.
- Затронутые фронт-роуты/экраны.
- Изменения БД (таблицы/колонки/миграции).
- 🔴 Обязательный регресс (список разделов).
- ⚠️ Зоны риска с **обоснованием по коду** (`file:line`, какая эвристика сработала).

**B. Developers / Разработчики** (вклад)
- Сгруппировано **по людям**: автор → его задачи в релизе (Jira-ключ + summary + репо/фича).
- Счётчики: задач/коммитов на человека, по типам (feat/fix/other).
- Кросс-репные задачи отметить (фича в backend+frontend-mono).
- Цель — чтобы каждый видел свой вклад; тон нейтральный, без рейтингов «лучше/хуже».

**C. Business / Бизнес** (ценность)
- По **модулям**: что стало лучше, какая клиентская боль закрыта.
- Для **каких типов клиентов**: shipper / carrier / forwarder / dock (склад) / back-office / public-API-интеграторы.
- Где **выросла ценность продукта** (новые возможности, меньше ручной работы, надёжность).
- Без тех-жаргона и без номеров задач в теле (можно ссылками в конце). Не выдумывать метрики — формулировать из сути задачи/модуля.

### 5. Выдача
Вернуть **три отдельных отчёта** + приложить **baseline** (repo@from→to, сырой список задач) как раскрываемую секцию/артефакт. Каждый отчёт — с собственным заголовком и release id, чтобы searchify мог хранить их по отдельности, давать ссылку, копировать и переводить.

## Rules
- **Коммиты — точка отсчёта, не отчёт.** Никогда не отдавать сырой `git log` как «релиз ноты». Цепочка: коммиты → задачи → модули → (QA-импакт | вклад | ценность).
- **Источник истины — код+Jira+git.** Бизнес-ценность выводить из задачи и модуля, не фантазировать цифры/проценты.
- **Состав репо фиксирован** (список выше). Пакеты-библиотеки и тест/док-репы в ноты не попадают.
- **Baseline = последний prod-тег репо** (`v*`), не «N дней назад».
- **Перевод — только по запросу.** Отчёты генерятся на языке источника; перевод on-demand и кешируется (см. ТЗ для searchify).
- Bug-кандидаты, найденные при код-анализе, помечать и предлагать завести (cross-link `[[30-code-truth-verifier]]` / `[[04-manual-tester]]`).

## Output (структура)
```
RELEASE <date>  (backend@v0.389.0, frontend-mono@v1.13.0, …)
── Report A (QA) ──   <markdown>
── Report B (Devs) ── <markdown>
── Report C (Business) ── <markdown>
── Baseline ──        repo@from→to + задачи (raw, collapsible)
```

## Грабли (Shiptify-специфика)
- Jira MCP (`searchJiraIssuesUsingJql` / `getJiraIssue`) часто превышает лимит токенов → результат пишется в файл. На этой машине **нет `jq`/`python`, но есть `node`** — парсить узлом.
- Репозитории живут в `workspaces/<repo>` как настоящие git-репы; перед дельтой делать `git fetch`.
- Дефолт-ветка везде `origin/develop`; релиз-мёрджи: `feature/<KEY>`, `hotfix/vX`, `Merge tag 'vX' into develop`.
- Jira `fixVersion` пуст — не опираться на него; релиз определяется по тегам + дате нот в Slack `#full_team`.

## Reference run
Эталон — анализ релиза **2026-06-11** (анонс в Slack `#full_team`, файл нот `2026-06-11.md`): 108 Jira-ключей (TMS 43 / SI 35 / DOCK 25 / TD 5) по 17 прод-репам; ядро вклада — `backend` + `frontend-mono`. Этот разбор показал и сам принцип (release train, git/MR-derived, независимые semver-теги), и карту репо.

## Связь с searchify
Кнопочная генерация, история со ссылкой, копирование со ссылкой на отчёт в searchify и перевод по запросу — на стороне приложения searchify. ТЗ: `docs/specs/release-notes-searchify-TZ.md`. Этот скил — «движок» (методология), searchify — обвязка (UI/история/перевод).
