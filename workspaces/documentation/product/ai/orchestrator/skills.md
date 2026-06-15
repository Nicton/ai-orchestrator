---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632553473
source_type: confluence
---
# Каталог скиллов AI Orchestrator

Скиллы — это агентные роли, реализованные как Markdown-файлы (`SKILL.md`) в папке `skills/`. Каждый скилл описывает задачу агента, входные и выходные данные, правила работы.

Путь к скиллам: `skills/<id>/SKILL.md`
Реестр скиллов: `core/skills/SKILL_REGISTRY.yaml`
Команды: `core/skills/TEAMS.v1.yaml`

---

## Структура скилла

Каждый `SKILL.md` содержит YAML frontmatter и Markdown-тело:

```markdown
---
name: <id>
description: <однострочное описание>
---

# Название скилла

## Role / Mission
## Inputs
## Output (JSON schema)
## Rules / Done Criteria
```

---

## Команды агентов

| Команда | Скиллы |
|---|---|
| QA Automation / Testing | 00..06, 10..16, 20..27 |
| Documentation | docgen-writer |

---

## Группа 0x — Командные роли (Core QA Roles)

Роли общего управления и верификации. Тип: `role`. Зрелость: `beta`.

| ID | Название | Описание | Human review |
|---|---|---|---|
| `00-manager` | Manager | Единая точка входа для задач QA. Принимает абстрактные запросы, декомпозирует, делегирует другим ролям, отслеживает выполнение и отчитывается о завершении. Использовать, когда нужна оркестрация, декомпозиция или межскилловые передачи. | Нет |
| `01-analyst` | Analyst | Преобразует бизнес-запросы и документацию продукта в структурированные, тестируемые требования, допущения и зависимости. Использовать, когда задача ещё неясна и нужно оформить требования перед стратегией и автоматизацией. | Нет |
| `02-qa-architect` | QA Architect | Разрабатывает risk-based стратегию тестирования, матрицу покрытия и exit criteria для фичи. Использовать, когда требования известны, но план верификации ещё не определён. | Нет |
| `03-frontend-tagger` | Frontend Tagger | Вводит или стандартизирует `data-testid` маркеры для UI-автоматизации и трассировки. Использовать, когда в UI нет стабильных automation-хуков или когда конвенции селекторов нужно нормализовать. | Да |
| `04-manual-tester` | Manual Tester | Преобразует стратегию в исполняемые ручные тест-кейсы с ожидаемыми результатами и evidence. Использовать, когда сценарии требуют ручного выполнения или документирования перед автоматизацией. | Да |
| `05-automation` | Automation | Конвертирует одобренные тест-кейсы в Playwright-автоматизацию, отлаживает и обеспечивает стабильное выполнение. Использовать, когда ручные сценарии готовы к имплементации или стабилизации. | Да |
| `06-critic` | Critic | Независимая проверка качества выходных данных Manual + Automation ролей. Выявляет пробелы, приоритизирует доработки. Использовать как финальный gate перед signoff. | Нет |

**Входные данные:** бизнес-задача, описание требований, результаты upstream-ролей.
**Выходные данные:** план выполнения, матрица тестов, код, gap-анализ — в зависимости от роли.

---

## Группа 1x — Скиллы QA pipeline

Специализированные скиллы конвейера тестирования. Тип: `skill`.

| ID | Название | Зрелость | Описание |
|---|---|---|---|
| `10-repo-intake` | Repo Intake | stable | Быстрое исследование целевого репозитория: архитектура тестов, паттерны, entrypoints. Использовать, когда нужно заземлить QA-работу в существующих паттернах репозитория, а не изобретать структуру с нуля. |
| `11-test-traceability-mapper` | Test Traceability Mapper | stable | Конвертирует требования, истории или задачи в матрицу трассировки: экраны, действия, ожидания, приоритеты, типы тестов. Использовать, когда нужно отобразить покрытие перед разбивкой на сценарии. |
| `12-test-case-splitter` | Test Case Splitter | beta | Разбивает сценарии или строки матрицы трассировки на атомарные automation-ready тест-кейсы. Использовать, когда широкие workflow нужно декомпозировать на happy/negative/edge/permission/race-condition тесты. |
| `13-playwright-writer` | Playwright Writer | beta | Генерирует production-ready Playwright-тесты и вспомогательный код в соответствии с архитектурой репозитория. Использовать, когда атомарные тест-кейсы одобрены и готовы к имплементации. |
| `14-assertion-injector` | Assertion Injector | beta | Усиливает Playwright-код значимыми post-action assertions близко к переходам состояний. Использовать, когда черновой тест кликает по UI без достаточной верификации. |
| `15-refactor-to-shared-helper` | Refactor to Shared Helper | experimental | Обнаруживает повторяющиеся тест-сценарии и рефакторит их в shared-хелперы без потери намерения и читаемости. Использовать только при реальном дублировании. |
| `16-flake-reviewer` | Flake Reviewer | beta | Анализирует нестабильные Playwright-падения по артефактам (trace/video/screenshot) и предлагает минимальный детерминированный фикс. Использовать при intermittent-падениях. |

### Детали по скиллу 10-repo-intake

**Вход:** путь к репозиторию (или cwd), опциональный целевой модуль.

**Выход (JSON):**
```json
{
  "architecture_summary": "...",
  "existing_patterns": ["..."],
  "anti_patterns": ["..."],
  "recommended_entrypoints": ["path/to/file"],
  "assumptions": ["..."]
}
```

### Детали по скиллу 11-test-traceability-mapper

**Вход:** текст задачи/истории/требования, опционально UI-flow заметки.

**Выход (JSON):**
```json
{
  "traceability_matrix": [
    {
      "screen": "...",
      "action": "...",
      "expected": "...",
      "test_type": "smoke|regression|edge|negative",
      "priority": "P1|P2|P3"
    }
  ],
  "scenario_priority": ["..."],
  "coverage_gaps": ["..."]
}
```

### Детали по скиллу 12-test-case-splitter

**Выход (JSON):**
```json
{
  "atomic_tests": [
    {
      "id": "...",
      "title": "...",
      "classification": "happy|negative|edge|permission|race",
      "preconditions": ["..."],
      "steps": ["..."],
      "expected": ["..."],
      "should_be_fixture_or_helper": ["..."]
    }
  ]
}
```

---

## Группа 2x — UI Mini-Engine

Скиллы для отладки UI-взаимодействий и детерминированного выполнения браузерных шагов. Все тип: `skill`.

| ID | Название | Зрелость | Описание |
|---|---|---|---|
| `20-ui-state-snapshot` | UI State Snapshot | experimental | Захватывает UI-состояние (до и после шага): активные модалки, видимые контролы, ошибки консоли, сетевое резюме, screenshot, DOM, a11y. Использовать для воспроизводимой отладки. |
| `21-locator-ranker` | Locator Ranker | beta | Ранжирует кандидатов для локатора по ожидаемой стабильности: `data-testid` > aria > label > text > css/xpath. Использовать, когда нужно выбрать стратегию локатора обдуманно. |
| `22-action-planner` | Action Planner | beta | Конвертирует natural-language UI-намерение в детерминированный контракт шага с postconditions и recovery-подсказками. Использовать для формализации браузерных действий. |
| `23-smart-click-executor` | Smart Click Executor | experimental | Выполняет клик как валидированный переход состояния: snapshot → rank → validate → click → verify → classify → recover (max 2-3 попытки). Использовать, когда обычный клик недостаточно надёжен. |
| `24-postcondition-verifier` | Postcondition Verifier | beta | Определяет, действительно ли шаг UI успешен, через проверку наиболее релевантного oracle изменения состояния. Использовать после завершения действия для явной верификации. |
| `25-failure-classifier` | Failure Classifier | beta | Классифицирует падение UI-шага по канонической таксономии и предлагает следующие recovery-действия. Использовать вместо ad-hoc диагностики. |
| `26-recovery-strategy` | Recovery Strategy | experimental | Выполняет ограниченные, предсказуемые recovery-действия после классифицированного падения. Max 2-3 попытки, затем останавливается и репортирует. |
| `27-sequence-debugger` | Sequence Debugger | beta | Анализирует многошаговый UI-поток и находит первое нарушение допущения (не просто последний упавший шаг). Использовать, когда e2e-сценарий расходится с ожидаемым. |

### Приоритет локаторов (21-locator-ranker)

```
1. data-testid / data-qa / data-test-id
2. aria role + accessible name
3. label / placeholder
4. text within scoped container
5. css / xpath (последний вариант)
```

### Smart Click алгоритм (23-smart-click-executor)

```
1) ui-state-snapshot  — захват pre-state
2) locator-ranker     — вычисление кандидатов
3) validate           — visible / enabled / clickable
4) click
5) wait for UI movement signal
6) postcondition-verifier — проверка результата
7) failure-classifier + recovery-strategy (если шаг 6 провален)
```

### Таксономия падений (25-failure-classifier)

| Класс | Описание |
|---|---|
| `NO_CANDIDATE_FOUND` | Локатор не нашёл элемент |
| `CLICK_INTERCEPTED` | Клик перехвачен overlay/z-index |
| `ASYNC_NOT_SETTLED` | UI не завершил обновление |
| `WRONG_FRAME` | Элемент в iframe или shadow-root |
| `HIDDEN_MODAL_IN_DOM` | Скрытая модалка блокирует |

---

## Скилл docgen-writer

| ID | Тип | Зрелость | Описание |
|---|---|---|---|
| `docgen-writer` | skill | experimental | Генерирует JetBrains Writerside `.topic` XML-файл по структурированным требованиям и референс-ссылкам. Детерминированный и строго структурированный вывод. Использовать в docgen-пайплайне как финальную стадию. |

**Вход:** RUN INPUT с путём к файлу, режимом (create/update), комментарием и референс-ссылками. UPSTREAM RESULTS — структурированные требования и critic notes.

**Выход:** JSON с артефактом `writerside_topic_xml` — полное содержимое `.topic`-файла.

---

## Полный реестр скиллов

| ID | Тип | Зрелость | Human review |
|---|---|---|---|
| 00-manager | role | beta | — |
| 01-analyst | role | beta | — |
| 02-qa-architect | role | beta | — |
| 03-frontend-tagger | role | beta | Да |
| 04-manual-tester | role | beta | Да |
| 05-automation | role | beta | Да |
| 06-critic | role | beta | — |
| 10-repo-intake | skill | stable | — |
| 11-test-traceability-mapper | skill | stable | — |
| 12-test-case-splitter | skill | beta | — |
| 13-playwright-writer | skill | beta | — |
| 14-assertion-injector | skill | beta | — |
| 15-refactor-to-shared-helper | skill | experimental | — |
| 16-flake-reviewer | skill | beta | — |
| 20-ui-state-snapshot | skill | experimental | — |
| 21-locator-ranker | skill | beta | — |
| 22-action-planner | skill | beta | — |
| 23-smart-click-executor | skill | experimental | — |
| 24-postcondition-verifier | skill | beta | — |
| 25-failure-classifier | skill | beta | — |
| 26-recovery-strategy | skill | experimental | — |
| 27-sequence-debugger | skill | beta | — |
| docgen-writer | skill | experimental | — |

---

## 🔗 Граф-метаданные
- **id:** `ai.orchestrator.skills`
- **type:** module-doc · **domain:** AI · **status:** implemented
- **confluence:** 632553473 · **repo:** `ai/orchestrator/skills.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** AI
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

