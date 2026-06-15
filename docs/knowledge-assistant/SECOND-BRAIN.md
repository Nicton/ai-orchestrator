# Second Brain — графовая вики-память Shiptify

Реализация концепции «второго мозга» (LLM-Wiki) на базе ai-orchestrator: документация-вики + графовая модель + LLM-навигация + визуализация глубины. Соответствие концепции (Habr [1031970](https://habr.com/ru/articles/1031970/), прототип [Obsidian LLM Wiki](https://github.com/evylegzhanin/test-second-brain)) ниже.

## Слои (как в концепции)

| Слой концепции | У нас |
|----------------|-------|
| **Raw** (первоисточники) | код в `workspaces/*`, слайды, Confluence-источники |
| **Wiki** (страницы + связи) | `workspaces/documentation/product/**` — 317 .md с frontmatter `confluence_url` и блоком `## 🔗 Граф-метаданные` |
| **Schema** (правила агента) | `GRAPH-METADATA-SPEC.md` + этот файл; индексация в `src/knowledge.ts` |

## Операции (как в концепции)

- **Ingest** — `build-graph.cjs` строит граф из метаданных + извлекает фичи/экраны/модалки (гибрид) + `annotate-features.mjs` (LLM-разметка). `release-sync.mjs mirror` публикует вики в Confluence.
- **Query** — Searchify (`src/knowledge.ts`): план запроса → лексический поиск по 4 корням → ответ LLM со ссылками. Граф в БД доступен для навигации связей.
- **Lint / риски** — линк-чек (битые ссылки), overlay рисков в `/graph` (изоляты, `not-implemented`/`icebox`/`partial`), «висячие» references при загрузке графа.

## Графовая модель

**Узлы** (`KnowledgeEntity`, загружаются из `graph.json` → БД через `src/graphLoader.ts`):
`document` · `module` · `code_file` · `requirement` · `confluence` · `feature` · `screen` · `modal`.

**Рёбра** (`KnowledgeRelation`): `belongs_to` · `relates_to` · `documents` · `references` · `covered_by` · `published_as` · `has_feature` · `has_screen` · `has_modal` · `mentions` (кросс-модульная связь — одна фича/модалка, упомянутая в доках разных доменов).

Текущий масштаб: **1121 узел, ~3190 рёбер**, 46/55 фич — кросс-модульные.

## Визуализация глубины — `/graph`

- Слои-фильтры по типам (модули/фичи/модалки/экраны/доки/код/требования/Confluence).
- Фильтр по домену, поиск узла, zoom/pan.
- Кластерная раскладка: модули по кругу, узлы — рядом со своими модулями; кросс-модульные фичи садятся **между** модулями.
- Глубина = размер узла: модуль — по числу связей; фича/модалка — по числу доменов (кросс-модульный охват); док — по числу code_refs (глубина привязки к коду).
- Цвет = тип; доки тонируются по статусу. Розовые рёбра = `mentions` (кросс-модуль).
- **⚠ Риски** — подсветка `not-implemented`/`icebox`/`partial`/изолятов.

## Самодеплой

`docker-compose up` поднимает Postgres + app. Приложение на старте:
1. `db:push` — синхронизирует схему Prisma (таблицы Knowledge*).
2. `loadGraphIntoDb()` — грузит `graph.json` в БД (идемпотентно, по хешу содержимого; повторно не грузит без изменений).
3. Searchify и `/graph` работают на реальном графе.

Dockerfile копирует `workspaces/documentation/product/tools/graph.json` в образ — граф деплоится вместе с кодом.

## Обновление графа (CI / вручную)

```bash
# 1) (опц.) LLM-разметка фич/модалок — нужен claude CLI в окружении
node scripts/annotate-features.mjs                 # инкрементально, кэш в tools/feature-annotations.json
# 2) пересобрать граф из метаданных + аннотаций
node workspaces/documentation/product/tools/build-graph.cjs
# 3) синхронизировать вики с Confluence (идемпотентно)
node scripts/release-sync.mjs mirror
# 4) деплой — на старте граф перегрузится в БД автоматически (хеш изменится)
```

## Что дальше (бэклог)

- **Graph-aware retrieval**: учитывать рёбра при ответах (boost связанных сущностей, обход `mentions` для «что ещё затронуто»).
- **Полный прогон LLM-разметки** по всем 317 докам (нужен claude CLI; запускать в фоне, резюмируемо).
- **Lint-отчёт** как страница: противоречия, устаревшие статусы, изоляты — регулярно.

---

## 🔗 Граф-метаданные
- **id:** `knowledge-assistant.second-brain`
- **type:** reference · **domain:** AI · **status:** implemented
- **repo:** `docs/knowledge-assistant/SECOND-BRAIN.md`
- **code_refs:** `src/graphLoader.ts`, `src/knowledge.ts`, `src/public/graph.html`, `workspaces/documentation/product/tools/build-graph.cjs`, `scripts/annotate-features.mjs`, `scripts/release-sync.mjs`
- **modules:** AI, Microservices
