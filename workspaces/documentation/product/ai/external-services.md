---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631963665
source_type: confluence
---
# Внешние AI-сервисы

Описание всех внешних AI-сервисов, используемых в Shiptify.

---

## Anthropic Claude (Claude Code CLI) — основной LLM AI Orchestrator

> ⚠️ **2026-06-08 (коммит 5039866): OpenAI SDK полностью заменён на Claude Code CLI.** Разделы про gpt-4o-mini/whisper-1 ниже удалены как устаревшие; переменные `OPENAI_*` в .env/k8s — мёртвый legacy.

### Модель и вызов

| Параметр | Значение |
|---|---|
| Модель по умолчанию | `claude-sonnet-4-6` (`src/config.ts:3`, override через `CLAUDE_MODEL`) |
| Способ вызова | spawn CLI `claude -p <prompt> --system-prompt ... --output-format json --model <model>` (`src/llm.ts:29-68`) |
| Аутентификация | `claude auth login` (интерактивно) или `ANTHROPIC_API_KEY` (Docker/CI) |

### Транскрипция аудио — ⚠️ СЛОМАНА

После удаления OpenAI Whisper функция `transcribeAudioFile()` бросает ошибку `Audio transcription is not supported with Claude Code CLI` (`src/llm.ts:70-75`). Intake pipeline принимает файлы (webm/wav/mp3/m4a/ogg, лимит 50MB), но транскрибировать их нечем — **нужен отдельный STT-провайдер**.

### Использование токенов

Для каждой стадии пайплайна сохраняются `promptTokens` / `completionTokens` / `totalTokens` в таблицах `StageRun` и `Task` (PostgreSQL).

### Mock-режим

```env
MOCK_LLM=1
```

Реальные вызовы Claude не выполняются, возвращаются stub-результаты (`src/llm.ts:19`). Работает и для ролей, и для транскрипции.

### Адаптеры

`src/adapters/openaiAdapter.ts` и `claudeAdapter.ts` — скелеты «not wired yet» для будущего event API, в работе не участвуют.

---

## AWS Textract

Используется в функции **AI Reader / Dual Screen** для OCR и извлечения структурированных полей из документов (пакинг-листы, накладные).

### Назначение

Textract извлекает следующие поля из загруженного документа:

| Поле | Описание |
|---|---|
| FROM | Адрес отправителя |
| TO | Адрес получателя |
| DATE | Дата |
| Transport mode | Вид транспорта |
| Packing List | Список товаров |
| Comments | Комментарии |

Каждому полю присваивается **confidence score**, который определяет цвет подсветки в UI.

### Статус интеграции (уточнено по коду 2026-06-11)

Textract работает в микросервисе **`ai-worker`** (`microservices/node/ai-worker/src/pdfProcessor/lib/aws/textract.ts`, пакет `@aws-sdk/client-textract`). Приём PDF — микросервис **`ai-extract`** (`/api/v1/ai-extract`, JWT), связь через Kafka. В основном бэкенде Textract нет (там AWS SDK только для S3 — это было верное наблюдение).

**Важно:** Textract выполняет только OCR. Парсинг извлечённого текста в структурированные данные выполняет **Google Gemini 2.5 Flash** — см. раздел ниже.

---

## Google Gemini — парсер AI Reader

| Параметр | Значение |
|---|---|
| Модель | `gemini-2.5-flash` (`ai-worker/src/pdfProcessor/lib/google/gemini.ts:24`) |
| SDK | `@google/generative-ai` |
| Ключ | `GOOGLE_API_KEY` (`ai-worker/src/config.ts:22`) |
| Назначение | Преобразование OCR-текста в структурированный JSON (`sh_request` / `cu_invoice`) |
| Статус | **Production — основной LLM продуктового кода TMS** |

Код AWS Bedrock (модель `anthropic.claude-3-5-sonnet`) существует рядом (`lib/aws/bedrock.ts`), но **не используется** — заменён на Gemini.

### Документация продукта

`workspaces/documentation/product/tms/shipments/ai-reader-dual-screen.md`

---

## EcoTransit

Специализированный сервис расчёта транспортных эмиссий CO2. Используется в виджете CO2 на грузоотправках.

**Важно:** EcoTransit — это не общеназначенный AI/ML сервис. Это калькулятор углеродного следа на основе методологии WTW/TTW.

### Протокол интеграции

**FTP + CSV batch** — асинхронный обмен файлами.

| Направление | Описание |
|---|---|
| Outbound | Shiptify загружает CSV с данными отправок на FTP EcoTransit |
| Inbound | EcoTransit возвращает ZIP + CSV с результатами расчётов |

### Данные отправляемого CSV

| Поле | Пример |
|---|---|
| `shipment_id` | `STY_12345` (префикс `STY_`) |
| `freight_weight` | `1500` |
| `main_transport_mode` | `Road` / `Air` / `Sea` / `Ro-Ro` |
| `weight_unit` | `kg` |
| Локации | Зависят от вида транспорта |

### Форматы локаций

| Вид транспорта | Формат |
|---|---|
| Air | IATA код аэропорта |
| Sea / Ro-Ro | UN/LOCODE порта |
| Road / Express | Почтовый индекс или геокоординаты |

### Формат возвращаемых данных

EcoTransit возвращает CO2 в **тоннах**. Бэкенд конвертирует:

```javascript
co2_amount_kg = co2AmountInT * 1000
```

### Ключевые файлы бэкенда

| Файл | Назначение |
|---|---|
| `workspaces/backend/app/services/integration/ecotransit/impl.js` | Основная логика интеграции |
| `workspaces/backend/app/services/integration/ecotransit/dataBuilder.js` | Построение CSV-строк |
| `workspaces/backend/app/services/integration/ecotransit/constants.js` | Коды режимов, единицы |
| `workspaces/backend/app/services/integration/ecotransit/ftpProvider.js` | FTP-клиент |
| `workspaces/backend/app/services/integration/ecotransit/tasks.js` | Cron-задачи отправки и получения |

### Функции

- `buildAndQueueEcotransitShipmentData()` — формирует CSV-строку и добавляет в очередь `ShipmentIntegrationEcotransitShipmentQueue`
- `bulkSendToEcotransit()` — батч-отправка на FTP сервер EcoTransit
- Cron-задача — опрашивает FTP EcoTransit, скачивает ZIP, парсит CSV, сохраняет `co2_amount` и `distance` на запись Shipment

### Поддерживаемые режимы транспорта

Road, Air, Sea, Ro-Ro, Milkrun (мульти-плечевые маршруты).

---

## Vanna AI

Используется во внутреннем Back-Office Admin Panel для natural-language-to-SQL запросов.

### Статус интеграции

Vanna AI — **внешний SaaS**, подключается через **embed (iframe)** или **redirect**. Код интеграции в основном бэкенде Shiptify не найден.

### Назначение

Позволяет внутренним командам (Sales, Support, Product, Project) задавать вопросы о данных платформы на естественном языке без написания SQL.

### Документация продукта

`workspaces/documentation/product/back-office/vanna-ai-analytics.md`

---

## Сводная таблица (актуализировано 2026-06-11)

| Сервис | Протокол | Аутентификация | Где используется | Статус |
|---|---|---|---|---|
| Anthropic Claude (`claude-sonnet-4-6`) | Claude Code CLI (spawn) | claude auth / ANTHROPIC_API_KEY | AI Orchestrator: пайплайны, questionnaire, RequirementCard | Production (заменил OpenAI 2026-06-08) |
| ~~OpenAI GPT-4o-mini / Whisper-1~~ | — | — | Удалены из orchestrator (коммит 5039866); транскрипция аудио сломана | Удалено |
| AWS Textract | SDK, микросервис `ai-worker` | AWS IAM | AI Reader: OCR | Production |
| Google Gemini 2.5 Flash | SDK `@google/generative-ai` | GOOGLE_API_KEY | AI Reader: парсинг OCR-текста → JSON | Production |
| AWS Bedrock (Claude 3.5) | SDK | AWS IAM | `ai-worker` — код есть, не используется | Не используется |
| EcoTransit | SFTP + CSV batch | FTP credentials | CO2 на грузоотправках | Production |
| Vanna AI | внешний SaaS | — | Вне монорепо; embed/redirect в BO не реализован | Standalone |

---

## 🔗 Граф-метаданные
- **id:** `ai.external-services`
- **type:** module-doc · **domain:** AI · **status:** implemented
- **confluence:** 631963665 · **repo:** `ai/external-services.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** AI
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

