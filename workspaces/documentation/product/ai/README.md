---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632225809
source_type: confluence
---
# AI в Shiptify — обзор

Настоящий раздел описывает все AI-возможности платформы Shiptify: как встроенные функции TMS, так и отдельный проект AI Orchestrator.

---

## Карта AI-возможностей

| Область | Функция | Статус | Внешний сервис |
|---|---|---|---|
| TMS | AI Reader / Dual Screen | Production | AWS Textract |
| Back-Office | Vanna AI Analytics | Production | Vanna AI (SaaS) |
| TMS Procurement | Quote Strategy | Production | — (логика платформы) |
| TMS Shipments | CO2 / EcoTransit | Production | EcoTransit (FTP API) |
| AI Orchestrator | Pipeline Orchestrator | Demo/Internal | OpenAI GPT-4o-mini |
| AI Orchestrator | Intake Pipeline | Demo/Internal | OpenAI Whisper-1 + GPT-4o-mini |

---

## Продуктовые AI-функции

### AI Reader / Dual Screen
Двухпанельный интерфейс для создания Shipment Request из загруженного документа (пакинг-лист, накладная). Левая панель — документ с цветовой подсветкой confidence, правая — форма CSW. Основан на AWS Textract.

Подробнее: [features/ai-reader.md](features/ai-reader.md)

### Vanna AI Analytics
Инструмент natural-language-to-SQL для внутренних команд (Sales, Support, Product, Project). Пользователь вводит вопрос на естественном языке, AI конвертирует его в SQL и возвращает результат. Доступен только в Back-Office Admin Panel.

Подробнее: [features/vanna-analytics.md](features/vanna-analytics.md)

### Quote Strategy
Автоматизированный выбор перевозчика через 5 стратегий конкурентных торгов: Standard, Buy-It-Now, Hybrid, Live Reverse Auction, Automated Sealed Bid. Не использует ML-модели — реализовано через правила платформы.

Подробнее: [features/quote-strategy.md](features/quote-strategy.md)

### CO2 / EcoTransit
Виджет углеродного следа на грузоотправках. Показывает CO2e в кг по методологии WTW или TTW. Поддерживает несколько источников данных одновременно с усреднением: EcoTransit, DHL API, ручной ввод.

Подробнее: [features/co2-ecotransit.md](features/co2-ecotransit.md)

---

## AI Orchestrator

Отдельный внутренний сервис для AI-агентных пайплайнов и автоматизации QA. Не входит в основной TMS-бэкенд. Работает на стеке TypeScript + Fastify + Prisma + PostgreSQL.

Два основных модуля:

**Pipeline Orchestrator** — многоэтапный AI-агентный runner на основе YAML-спецификаций. Пайплайны содержат стадии со скиллами/ролями, зависимостями (DAG) и gate-условиями. Используется для автоматизации QA.

**Intake Pipeline** — цепочка голос/текст → транскрипция (Whisper) → структурированная анкета (GPT) → RequirementCard → задача в Jira.

Подробнее:
- [orchestrator/README.md](orchestrator/README.md) — архитектура, пайплайны, агентная система
- [orchestrator/skills.md](orchestrator/skills.md) — каталог всех 23 скиллов
- [orchestrator/intake-flow.md](orchestrator/intake-flow.md) — Intake Pipeline: эндпоинты, воркер, диаграммы

---

## Внешние AI-сервисы

| Сервис | Модель | Протокол | Использование |
|---|---|---|---|
| Anthropic Claude | claude-sonnet-4-6 (Claude Code CLI) | spawn CLI | Стадии пайплайна, questionnaire, RequirementCard — **заменил OpenAI 2026-06-08** |
| ~~OpenAI whisper-1~~ | — | — | Удалён; ⚠️ транскрипция аудио сломана, нужен новый STT |
| AWS Textract | — | SDK | OCR документов (AI Reader) |
| EcoTransit | — | FTP + CSV | Расчёт CO2 эмиссий |
| Vanna AI | — | SaaS embed | Text-to-SQL для аналитики |

Подробнее: [external-services.md](external-services.md)

---

## 🔗 Граф-метаданные
- **id:** `ai`
- **type:** overview · **domain:** AI · **status:** implemented
- **confluence:** 632225809 · **repo:** `ai/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** AI
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

