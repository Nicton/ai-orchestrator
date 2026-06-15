---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632127537
source_type: confluence
---
# AI Reader / Dual Screen — Создание перевозки из документа

**AI Reader (Dual Screen)** — интерфейс для автоматизированного создания заявки на перевозку из загруженного документа (например, packing list). Использует AWS Textract для извлечения данных.

> Источник: слайд `2025 11 - AI READER DUAL SCREEN`

> ✅ **СТАТУС ПО КОДУ (2026-06-11): реализовано.** Архитектура: микросервисы `ai-extract` (приём PDF) + `ai-worker` (Textract OCR → парсинг через **Google Gemini 2.5 Flash**) + React-пакет `frontend-mono/packages/ai-doc-reader`. Доступ — ACL `ai_doc_reader` (без привязки к роли). Расхождения дизайна с кодом помечены ниже. Подробный аудит: `product/ai/OPEN-QUESTIONS.md`, раздел 1.

---

## Интерфейс

```
┌─────────────────────┬─────────────────────┐
│   DOC READER        │   CSW FORM          │
│                     │                     │
│  [Загруженный       │  FROM: ___________  │
│   документ]         │  TO:   ___________  │
│                     │  DATE: ___________  │
│  Подсвеченные       │  Mode: ___________  │
│  фрагменты с        │  Packing List: ___  │
│  цветом доверия     │  Comments: ________ │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

---

## Обязательные поля (MUST HAVE)

- **FROM** — адрес отправки
- **TO** — адрес доставки
- **DATE** — дата
- **Transport mode** — режим транспортировки
- **Packing List** — список груза
- **Comments** — свободный текст

---

## Работа Textract

- Извлечённый текст подсвечивается на документе цветовым слоем
- Цвет фона поля = уровень доверия к извлечению
- При выборе/привязке фрагмента Textract → поле формы заполняется
- Несвязанный фрагмент Textract → копируется полностью (для ручной вставки)

---

## Разрешение адресов

Дизайн предполагал порядок:
1. PML центральная база данных
2. Адресная книга аккаунта
3. Google
4. Ручной ввод

> ⚠️ ПО КОДУ: реализована упрощённая цепочка — поиск в PML DB (`dbLoadAddressDataEnriched`) → создание нового адреса (`ai-worker/convert-csw-data.ts:118-130`). **Google Maps не используется** (ни вызовов, ни ключей).

Если несколько совпадений → пользователь выбирает из списка (выбранный адрес, другие варианты, ручной поиск/создание).

---

## Дополнительные поля

Пользователь может добавить поля через **Add field**:
- Incoterm
- Internal reference
- Metadata
- Другие поступательные поля

При большом количестве полей — поиск по названию поля.

---

## Логика создания заявки (submission)

| Условие | Результат |
|---------|----------|
| 1 перевозчик + цена | Booking |
| Нет цены | Quote или Booking |
| Несколько перевозчиков | Quote |

Исключены из начального скоупа: rate sheets, follower plan, transport plan.

После валидации — данные отправляются в `POST /shipment-request` или `POST /shipment` → создаётся Draft, Quote или Booking через существующий CSW2 флоу.

По дизайну документ автоматически прикрепляется к SR в private-режиме.

> ⚠️ ПО КОДУ: документ **не прикрепляется** как attachment — сохраняется только metadata-связь (`POST /document-used` → `used_for: {type:'sr', id}` в JSONB ai-extract). Файл остаётся в хранилище ai-extract.

---

## Техническая реализация

- ⚠️ ПО КОДУ: интерфейс — **React-пакет** `frontend-mono/packages/ai-doc-reader`; в Angular CSW встроена только кнопка входа (`ng-if="accessAIDocReader"` в csw.html)
- Парсинг текста после Textract выполняет **Google Gemini 2.5 Flash** (`ai-worker/pdfProcessor/lib/google/gemini.ts`); код Bedrock/Claude существует, но не используется
- Confidence Textract (0–100) передаётся как есть — пороги low/medium/high в коде не заданы
- Поддерживаемые типы: `sh_request`, `cu_invoice` (Customs Invoice)
- Будущее обогащение: постепенное добавление полей по мере выявления новых Textract-маппингов

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.ai-reader-dual-screen`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632127537 · **repo:** `tms/shipments/ai-reader-dual-screen.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

