---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/630390860
source_type: confluence
---
# Attachment Type Category — Категории вложений

Новое поле `category` для типов вложений (Attachment Type entity).

> Источник: слайд `2026 02 - Improve Dictionnary Attachment`

---

## Поле category

**Тип:** hardcoded enum (11 значений, НЕ свободный текст)

Пример записи:
```json
{
  "id": 115,
  "label": "CMR Livraison - Doc",
  "category": "PROOF_OF_DELIVERY",
  "status": "active"
}
```

---

## Затронутые API endpoints (8)

Поле `category` добавлено в ответы:
- GET `/shipments`
- GET `/shipment-requests`
- GET `/dictionary`
- И 5 вариантов для galaxy-carrier

---

## Webhook

Поле `category` добавлено в payload:
- `upload_shipment_attachment` webhook

---

## Реализация

- Предпочтительно: hardcoded dropdown (не free text)
- 11 предустановленных значений (PROOF_OF_DELIVERY и другие)

---

## 🔗 Граф-метаданные
- **id:** `tms.features.attachment-category`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 630390860 · **repo:** `tms/features/attachment-category.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

