---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/628424737
source_type: confluence
---
# Граф-метаданные документации — спецификация

> Каждый документ в `product/` несёт блок метаданных для построения **графовой БД** (узлы: документы, модули, код-файлы, требования; рёбра: ссылки, покрытие). Цель — машинно извлекать граф и таблицу покрытия «требования ↔ документация ↔ код».

## Где размещается

В **конце** каждого .md — секция `## 🔗 Граф-метаданные`. Рендерится в Confluence как читаемый список, парсится регуляркой из репозитория.

## Схема (поля)

| Поле | Обяз. | Назначение в графе |
|------|-------|--------------------|
| `id` | ✅ | Уникальный ID узла-документа, формат `домен.модуль[.подмодуль]` (kebab/dot), напр. `dock.webhooks`, `tms.shipments.csw` |
| `type` | ✅ | `module-doc` \| `overview` \| `requirement-map` \| `open-questions` \| `spec-only` (фича не реализована) |
| `domain` | ✅ | TMS \| DOCK \| Integrations \| Back-Office \| Admin-App \| Mini-Apps \| AI \| Identity \| Chat \| Carrier |
| `confluence` | ✅ | ID страницы Confluence (или `—`, если не опубликовано) |
| `repo` | ✅ | Путь файла относительно `product/` |
| `code_refs` | ✅ | Список путей кода (снизу вверх — что документирует), напр. `backend/app/services/webhooks/` |
| `modules` | ✅ | Связанные модули-узлы (рёбра doc→module) |
| `references` | ⬜ | ID других документов, на которые ссылается (исходящие рёбра doc→doc) |
| `requirements` | ⬜ | REQ-ID или `нет (реализовано без требований)` — пусто допустимо |
| `status` | ✅ | `implemented` \| `partial` \| `not-implemented` \| `icebox` |

## Формат блока (копировать как шаблон)

```markdown
---

## 🔗 Граф-метаданные

- **id:** `домен.модуль`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 628424737 · **repo:** `dock/feature-docs/platform/webhooks-dock.md`
- **code_refs:** `backend/app/services/webhooks/provider.js`, `backend/app/models/webhook.js`
- **modules:** DOCK, Integrations
- **references:** `dock.visits`, `integrations.webhooks`
- **requirements:** REQ-DOCK-… *(или: нет — реализовано без требований)*
```

## Требования (REQ) — обратная связь к источникам

В RTM/чеклистах каждое требование получает поле **`source`** — откуда взято: путь к файлу слайда/чеклиста, URL Confluence, или код-файл. Формат строки REQ:
`| REQ-XXX-001 | Описание | P0 | source: slides/2025-11-foo.txt ИЛИ code: backend/.../bar.js |`

Это даёт ребро `requirement→source` и позволяет позже дотянуть требования к нереализованному/недокументированному.

## Извлечение графа (для будущей графовой БД)

Парсер проходит все `## 🔗 Граф-метаданные` блоки → строит:
- **Узлы:** doc(id), module(domain), code_file(path), requirement(REQ-ID)
- **Рёбра:** `doc -[documents]-> code_file`, `doc -[belongs_to]-> module`, `doc -[references]-> doc`, `requirement -[covered_by]-> doc`, `requirement -[from]-> source`, `doc -[published_as]-> confluence`
- **Таблица покрытия:** module × {есть doc?, есть requirements?, есть code?} — пробелы видны сразу.

Допущение: модуль может иметь код без требований (нормально — требования найдём позже); doc обязателен для каждого реализованного модуля.
