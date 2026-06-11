---
name: 30-code-truth-verifier
description: Answer "open questions" about product behaviour from CODE, not from people. Given a list of questions (from docs, slides, test cases, or Product), greps the Shiptify workspaces, returns verdicts with file:line evidence — answered / partially / genuinely-for-Product. Use BEFORE escalating any question to Product/Engineering.
---

# Skill: code-truth-verifier

## Mission

**Код — источник истины.** Каждый «открытый вопрос» сначала проверяется по коду. Практика родилась из аудита 2026-06-11: ~85% из ~240 вопросов, неделями ждавших Product, закрылись грепом за минуты. Скилл превращает список вопросов в список вердиктов с доказательствами, оставляя людям только то, на что код действительно не отвечает.

## Inputs

- `questions`: список вопросов (текст; опционально с ID вида MC-1, AUTH-4)
- `domain_hints` (optional): модуль/папки для поиска (например, `backend/app/services/integration/`, `mini-apps/`)
- `output_doc` (optional): путь к md-файлу OPEN-QUESTIONS для обновления ответами

## Actions

1. **Классифицируй каждый вопрос** по типу:
   - `behaviour` — «как работает X?» → ищи реализацию
   - `exists` — «реализовано ли X?» → ищи код фичи; отсутствие = ответ «НЕ РЕАЛИЗОВАНО»
   - `config` — «где настраивается / какой лимит / дефолт?» → ищи константы, модели, config/*.json
   - `decision` — «почему / когда планируется / кто отвечает?» → код не ответит → пометь для людей, НО собери контекст (Jira-тикеты, TODO в коде)
2. **Ищи в правильных местах** (Shiptify):
   - поведение/лимиты: `workspaces/backend/app/{models,services,controllers,constants}`
   - доступ/права: ACL, флаги Account/Shipper, `permissions-control.js`, продукты `PRODUCT_*`
   - интеграции: `backend/app/services/integration/<name>/`, `workspaces/integrations` (RPC), cron в `app/cron/`
   - auth: `microservices/node/auth`; статусы — enum в моделях (`schema.Statuses`)
   - UI-поведение: `frontend/public/app`, `frontend-mono/packages`
   - решения/статусы фич: Jira API (проекты TMS, TD, AI, DOCK) — поиск по тексту
3. **Для каждого вопроса верни вердикт**:
   - ✅ `answered` — ответ + цитата кода + `file:line`
   - ⚠️ `partial` — что нашлось, чего не хватает
   - ❌ `not-implemented` — фича отсутствует (это ТОЖЕ ответ; укажи, что искал)
   - ❓ `for-humans` — кому адресовать (Product / DevOps / Finance) и почему код не отвечает
4. **Если указан `output_doc`** — перепиши строки вопросов ответами (формат: `> ✅ ОТВЕТ ИЗ КОДА (дата): … (file:line)`), добавь итоговую строку в историю файла.
5. **Сигнализируй о дефект-кандидатах**: если код ПРОТИВОРЕЧИТ требованию из вопроса — пометь `defect-candidate` (для DEFECTS-CANDIDATES.md).

## Rules

- Никогда не отвечай «по памяти» или из слайдов — только цитата кода или явное «НЕ НАЙДЕНО, искал: <пути/паттерны>».
- Отсутствие кода — полноценный ответ: формулируй «не реализовано (спецификация)», а не «неизвестно».
- Вопросы вида «когда планируется» — сначала Jira-поиск; пустой результат → for-humans.
- Не смешивай дизайн и факт: если в доке описан дизайн, а код иной — фиксируй оба с пометкой расхождения.

## Output (JSON)

```json
{
  "answered": [{"id": "MC-1", "answer": "max 20, override account.max_containers_number", "evidence": "backend/app/services/preShipments/index.js:933"}],
  "partial": [{"id": "TRACK-4", "found": "cron jobs exist", "missing": "interval set outside code (scheduler)", "next": "DevOps"}],
  "not_implemented": [{"id": "QUOTA-1", "searched": ["quota", "allocation"], "note": "spec-only feature"}],
  "for_humans": [{"id": "RETRO-5", "addressee": "Product", "why": "decision about future validation, no TODO in code"}],
  "defect_candidates": [{"id": "MC-8", "requirement": "cancel one container only", "code_reality": "cancels whole booking", "evidence": "services/shipments.js:1969"}]
}
```

## Reference run (2026-06-11)

10 списков, ~240 вопросов → 85% закрыто; 28 дефект-кандидатов → 9 Jira-тикетов (TMS-3738..3741, TD-1222..1226). Артефакты: `workspaces/documentation/product/*/OPEN-QUESTIONS.md`, `DEFECTS-CANDIDATES.md`, RTM-MASTER 98.5%.
