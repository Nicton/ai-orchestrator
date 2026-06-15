---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632324097
source_type: confluence
---
# AI Интеграции — Спорные вопросы и пробелы

Вопросы для уточнения у Product и Engineering. Источники: slides, код AI Orchestrator, Backend код.

> **Обновление 2026-06-11:** проведена сверка с кодом (`workspaces/backend`, `workspaces/microservices`, `workspaces/frontend-mono`, `workspaces/public-api`, репозиторий ai-orchestrator). Большинство вопросов закрыто ответами из кода — помечены ✅. Оставшиеся открытые — помечены ❓ и требуют ответа Product.

---

## 1. AI Reader / Dual Screen (AWS Textract) — ✅ ЗАКРЫТО ПО КОДУ

| # | Вопрос | Ответ из кода |
|---|--------|---------------|
| 1.1 ✅ | Задеплоен или в разработке? | **Реализован полностью**: микросервисы `ai-extract` (upload API) + `ai-worker` (обработка) + фронтенд-пакет `frontend-mono/packages/ai-doc-reader`. Доступ управляется ACL-правом `ai_doc_reader` (globalProvider.ts:462) — включается per-account. |
| 1.2 ✅ | Textract напрямую или микросервис? | **Отдельные микросервисы**: `ai-extract` принимает PDF (`POST /api/v1/ai-extract/upload-pdf`), шлёт событие в Kafka → `ai-worker` конвертирует PDF в изображения, вызывает Textract (`pdfProcessor/lib/aws/textract.ts`), затем парсит текст через **Google Gemini 2.5 Flash** (gemini.ts:24). Не backend. |
| 1.3 ✅ | Confidence пороги low/medium/high? | **Порогов нет.** Textract confidence (0–100) передаётся на фронтенд как есть, без классификации и фильтрации. Если в UI есть подсветка — это дизайн-концепция, в коде порогов нет. |
| 1.4 ✅ | Address resolution + Google Maps? | **Google Maps НЕ используется.** Цепочка в коде: поиск в PML DB (`dbLoadAddressDataEnriched`) → если нет, создание нового адреса (`dbCreateAddressDataEnriched`) — convert-csw-data.ts:118-130. Google-этап из слайдов не реализован. |
| 1.5 ✅ | Документ прикрепляется как private? | **Не прикрепляется как attachment вообще.** Сохраняется только связь в metadata `ai_extract` (`used_for: {type:'sr', id}` — api-info.ts:93). Слайдовое «auto-attached as private» в коде не реализовано. |
| 1.6 ✅ | Только Shipper или и Carrier? | **Не ограничено ролью** — любой пользователь с ACL `ai_doc_reader` (проверка только права, без проверки shipper/carrier). Поддерживаемые типы документов: `sh_request` и `cu_invoice` (Customs Invoice). |

---

## 2. Vanna AI Analytics — ✅ ЗАКРЫТО ПО JIRA (проект AI, апрель 2026)

Главный вывод: Vanna — внешний сервис, но интеграция и поддержка **активно ведутся в Jira-проекте AI** (вне монорепо). Доступ в prod — по whitelist.

| # | Вопрос | Ответ |
|---|--------|-------|
| 2.1 ✅ | Встроен или редирект? | **Кнопка-редирект в admin panel** — AI-156 Done (2026-04-10). Дизайн конфигурации (AI-172): `VANNA_URL` (адрес редиректа), `VANNA_ALLOW_ALL_USERS=false` в prod, `VANNA_WHITE_LIST` — в prod 5 человек: celine, axel, rco, romain, sergey @shiptify.com. |
| 2.2 ✅ | Права на Favorites? | Управление доступом — на уровне **whitelist пользователей** (env), а не прав на папки. Внутри Vanna папки общие для допущенных. |
| 2.3 ✅ | Схема БД — вручную или авто? | **Полуавтоматически из DDL**: AI-200 Done — «change code for new ddl extraction, generate documentation based on ddl relations». КБ строится по DDL BI-базы (`migrations-bi`: shipment_stats, booking_stats, tracking_stats, quote_stats, slot_stats, visit_stats и др.). |
| 2.4 ✅ | 3 бага из тестирования исправлены? | **Да, серия фиксов апрель 2026**: AI-153 (wrong tablenames — вероятно, баг «booked shipments = 0»), AI-203 (LLM-галлюцинации), AI-202 (логи failed queries), AI-199 (улучшение поиска), AI-197 (разбор failed requests). Наблюдаемость: AI-213 (Arize Phoenix PoC). Открыт AI-286 «Investigate Vanna AI» (To Do, 2026-06-11). |
| 2.5 ❓ | Лимиты CSV/XLS экспорта? | Нигде не специфицированы (ни слайды, ни Jira). Практически — лимиты Vanna-инстанса. |
| 2.6 ✅ | Sidebar — убрали или оставили? | По слайдам решение: вместо прямой навигации — **структура Favorites** (Sales/Project/Support/Product) + пользовательские папки + «List of available fields» в отдельной вкладке. |

---

## 3. Quote Strategy — ✅ ЗАКРЫТО: НЕ РЕАЛИЗОВАНО

Главный вывод: **ни одна из 5 стратегий не реализована в backend** (состояние на 2026-06-11). Это design-spec в roadmap.

| # | Вопрос | Ответ |
|---|--------|-------|
| 3.1 ✅ | Какие стратегии реализованы? | **Ноль из пяти.** В коде нет enum/обработчиков; только `quote_data: JSONB` (transport_requests.js:260). Jira **TMS-3557 «QUOTE STRATEGIES» — To Do** (оценка июнь 2026: design 2d + QA 1w; Erwan просит оценку в горизонте 2 недель) — разработка на подходе. |
| 3.2 ✅ | Safety net — кто выбирает победителя? | По слайдам (дословно): «the automation safely terminates. The QR will simply loop back to normal quote and the Shipper manually selects a winner from whatever bids were submitted» — **QR возвращается в обычную котировку, выбирает Shipper вручную**. Отдельный fallback-механизм убран из скоупа (single hardcoded behavior). |
| 3.3 ✅ | Длительность Reverse Auction? | **Отдельного таймера нет** — аукцион идёт до Answer Before deadline; «At the exact deadline, the lowest bidder automatically wins». Опциональный Reserve Price: если минимальная ставка выше резерва — авто-выбора нет, loop back к ручному выбору. Минимальный шаг ставки не специфицирован. |
| 3.4 ✅ | Где настраиваются N минут Hybrid? | Поле **«Time till visible (mins)»** при создании QR (вместе с Target Price и Answer Before). Дефолтное значение в слайдах не задано. |
| 3.5 ✅ | Billing plan или feature flag? | По спеке — **billing plan** (TMS Advanced и Buy&Sell) + toggle в Advanced General Settings (NO по умолчанию). В коде проверки нет (фича не реализована). |

---

## 4. CO2 / EcoTransit — ✅ В ОСНОВНОМ ЗАКРЫТО ПО КОДУ

Главный вывод: **реально работает только старый механизм — EcoTransit batch по SFTP.** Multi-source CO2 widget (DHL API, Manual Entry, Average) из слайдов June 2026 **не реализован**.

| # | Вопрос | Ответ из кода |
|---|--------|---------------|
| 4.1 ✅ | Пиктограмма заменила баннеры? | **Нет — новый widget не реализован.** В коде один старый CO2 Dashboard (`frontend/public/app/dashboard/controllers/dashboard/co2.js`). Слайды June 2026 — дизайн будущего. |
| 4.2 ✅ | FTP ещё работает? | **FTP — единственный механизм.** SFTP-клиент `ecotransit/ftpProvider.js`; цикл: shipment → очередь → bulk CSV upload → polling ZIP-результатов → `storeCO2Data()` пишет в `shipments.co2_amount`. Real-time API нет. |
| 4.3 ✅ | Алгоритм Average? | **Усреднения нет** — single source, значение просто перезаписывается (impl.js:859). Поля «источник CO2» в БД нет. Алгоритм Average — вопрос к будущей реализации. |
| 4.4 ✅ | DHL API для CO2? | **Не реализовано.** В интеграциях mydhl и dhl-global-forwarding упоминаний CO2 нет. |
| 4.5 ✅ | Кто вводит Manual CO2? | **Только Carrier**, через Public API: `POST /shipments/co2` с middleware `requireCarrier` + проверка `carrier_id` (public-api/src/routes/helpers/shipments.js:332). Shipper/Admin ручного ввода не имеют. |
| 4.6 ✅ | Историчность / пересчёт при смене перевозчика? | Хранится на Shipment (`co2_amount`, `distance`). **Триггеров пересчёта при смене carrier нет** — ни hooks, ни событий. Перезапись только через EcoTransit batch или ручной POST. |

---

## 5. AI Orchestrator (QA автоматизация) — ✅ ЗАКРЫТО ПО КОДУ

| # | Вопрос | Ответ из кода |
|---|--------|---------------|
| 5.1 ✅ | Только QA или часть продукта? | **Внутренний demo/admin-инструмент** (README:41: «demo/admin product»). Развивается модуль voice-intake (голос → RequirementCard → Jira) — тоже внутренний процесс, не продукт TMS. |
| 5.2 ✅ | 23 скилла — статусы? | `core/skills/SKILL_REGISTRY.yaml`: 7 ролей (все beta) + 16 скиллов: **2 stable** (repo-intake, traceability-mapper), **9 beta**, **5 experimental**. |
| 5.3 ✅ | Браузеры Playwright? | **Только Chromium**, headless (playwright.config.ts:10). |
| 5.4 ✅ | Mock mode? | ENV-переменная **`MOCK_LLM=1`** (src/llm.ts:19) — и для ролей, и для транскрипции. |
| 5.5 ✅ | YouTrack — направления? | **Оба**: читает (search по `State: {To Do} summary: "[AI]"`, hydrate с комментариями/линками) и пишет (addComment, executeCommand для смены State). Триггеры: webhook + poll (app.ts:761-790). |
| 5.6 ✅ | Форматы /transcribe? | Принимает webm, wav, mp3, m4a, ogg (intake.ts:24). **НО: транскрипция сейчас сломана** — после замены OpenAI на Claude CLI `transcribeAudioFile()` бросает ошибку «Audio transcription is not supported with Claude Code CLI» (llm.ts:70). Нужен отдельный STT-провайдер. |
| 5.7 ✅ | Timeout для зависших агентов? | **Timeout на выполнение стейджа НЕ настроен** — агент может висеть бесконечно. Есть только `CALLBACK_TIMEOUT_MS=10000` (для уведомлений) и `WORKER_POLL_MS=2000`. ⚠️ Технический долг. |

---

## 6. LLM-провайдеры — ✅ ЗАКРЫТО ПО КОДУ (картина изменилась!)

| # | Вопрос | Ответ из кода |
|---|--------|---------------|
| 6.1 ✅ | Какие модели? | **OpenAI полностью удалён** (коммит 5039866, 2026-06-08). AI Orchestrator работает через **Claude Code CLI**, модель `claude-sonnet-4-6` (src/config.ts:3, override через `CLAUDE_MODEL`). Переменные OPENAI_* в .env/k8s — мёртвый legacy. |
| 6.2 ✅ | Whisper chunking? | **Whisper удалён вместе с OpenAI SDK.** Транскрипция аудио не работает (см. 5.6). Лимит multipart upload — 50MB (app.ts:28). |
| 6.3 ✅ | Ключи per-environment? | Один ключ на deployment, разные секреты по окружениям (k8s secret `openai-secret` — legacy; для Claude — `claude auth` или ANTHROPIC_API_KEY). |
| 6.4 ✅ | Embeddings? | **Не используются** — ноль упоминаний в src/. |

### Продуктовый код TMS (не orchestrator) использует:

| Провайдер | Модель | Где | Статус |
|-----------|--------|-----|--------|
| AWS Textract | — | `microservices/node/ai-worker` (OCR) | Production |
| **Google Gemini** | **gemini-2.5-flash** | `ai-worker/pdfProcessor/lib/google/gemini.ts` — основной парсер текста AI Reader | **Production** |
| AWS Bedrock | claude-3-5-sonnet | `ai-worker/lib/aws/bedrock.ts` | Код есть, не используется (заменён Gemini) |
| OpenAI | — | — | В продуктовом коде не используется |

---

## 7. Будущие AI фичи — ✅ СТАТУСЫ ПРОВЕРЕНЫ ПО КОДУ

| # | Фича | Статус по коду |
|---|------|----------------|
| 7.1 ✅ | TAI (Text AI) | **Кода нет** — только roadmap. |
| 7.2 ✅ | PDFAI | **Это и есть AI Reader** (ai-extract + ai-worker: Textract → Gemini). Поддерживает `sh_request` и `cu_invoice`. Отдельной «PDFAI» не существует. |
| 7.3 ✅ | BFM AI | BFM существует как ACL-право `book_for_me` (shipment-template.js:123) — **без AI**. AI-вариант только в планах. |
| 7.4 ✅ | TM Light AI | **Кода нет** — только roadmap. |
| 7.5 ✅ | gpt-realtime-whisper | Неактуально: OpenAI удалён из orchestrator, в продукте не используется. |

---

## 8. Противоречия — ✅ РАЗРЕШЕНЫ

| # | Противоречие | Разрешение |
|---|-------------|------------|
| 8.1 ✅ | AI Reader: «rebuilt in Angular» vs «existing CSW2» | Реальность: AI Reader — **React-пакет** `frontend-mono/packages/ai-doc-reader`, кнопка входа встроена в Angular CSW (`ng-if="accessAIDocReader"` в csw.html). Оба утверждения частично верны. |
| 8.2 ✅ | EcoTransit FTP vs CO2 widget | **FTP — единственный работающий механизм.** Multi-source widget не реализован; «баннеры заменены» — дизайн будущего, не текущее состояние. |
| 8.3 ✅ | «5 стратегий» vs код | Подтверждено: в коде **0 из 5** — Quote Strategy полностью в спецификации. |
| 8.4 ✅ | Порт 4321 vs 3018 | **Один сервис на 4321** (Fastify: UI + API + WebSocket). Порт 3018 в кодовой базе не существует. |

---

## Оставшиеся открытые вопросы

| # | Вопрос | Кому |
|---|--------|------|
| 2.5 | Лимиты экспорта CSV/XLS в Vanna (не специфицированы нигде) | Владелец Vanna-инстанса |
| 3.4a | Дефолт «Time till visible (mins)» в Hybrid + минимальный шаг ставки в Auction | Product — при реализации TMS-3557 |
| — | План восстановления транскрипции в orchestrator (STT-провайдер после удаления Whisper); в слайдах voice-intake спеки нет | Engineering (внутр.) |

---

## История

| Дата | Изменение |
|------|-----------|
| 2026-06-10 | Первая версия — 35+ вопросов по слайдам и докам. |
| 2026-06-11 | Сверка с кодом (6 параллельных исследований). Закрыто ~29 вопросов; ключевые открытия: AI Reader парсит через **Gemini 2.5 Flash** (не только Textract), Quote Strategy **не реализована**, CO2 multi-source **не реализован** (только EcoTransit SFTP batch), OpenAI **полностью удалён** из orchestrator (Claude Code CLI), транскрипция аудио **сломана**, Vanna — внешний SaaS без кода в монорепо. |
| 2026-06-11 (v3) | Добивка по Jira + слайдам: **Vanna — редирект-кнопка в admin panel сделана** (AI-156 Done; prod-whitelist 5 чел., VANNA_URL/VANNA_ALLOW_ALL_USERS), баги исправлены (AI-153/197/199/200/202/203), КБ строится из DDL BI-базы (migrations-bi). **Quote Strategy: TMS-3557 To Do** (оценка июнь 2026); Safety Net = loop back to normal quote; Reverse Auction — без таймера, до Answer Before; Hybrid — поле «Time till visible (mins)». Осталось 3 мелких вопроса. |

---

## 🔗 Граф-метаданные
- **id:** `ai.open-questions`
- **type:** module-doc · **domain:** AI · **status:** implemented
- **confluence:** 632324097 · **repo:** `ai/OPEN-QUESTIONS.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** AI
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

