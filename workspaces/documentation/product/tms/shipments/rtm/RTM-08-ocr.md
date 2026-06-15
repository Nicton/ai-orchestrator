---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632881286
source_type: confluence
---
# RTM-08: OCR — Требования → Документация
## 8 требований | Источник: 16_checklist-tms-ocr.md

---

| REQ-ID | Требование | Документация | Статус |
|--------|-----------|-------------|--------|
| REQ-OCR-001 | Управление функциями аккаунта (флаги: SLOT BOOKING, VISIBILITY, COLLABORATIVE и др.) | [06_roles-matrix.md](../06_roles-matrix.md) §Флаги | 🔶 роли описаны, флаги частично |
| REQ-OCR-002 | Switch Account: Ctrl+K, поиск, переключение без логина | [00_domain-map.ru.md](../00_domain-map.ru.md) §Switch | 🔶 упомянуто |
| REQ-OCR-003 | Dashboard: вкладки, метрики, фильтры | ❌ нет | ❌ |
| REQ-OCR-004 | CO2 Widget: источники, поля WTW/TTW, Compare Sources | [features/co2-widget.md](../../features/co2-widget.md) | ✅ |
| REQ-OCR-005 | CO2 Widget: ошибки и edge cases (FAILED, Manual Entry) | [features/co2-widget.md](../../features/co2-widget.md) §EdgeCases | ✅ |
| REQ-OCR-006 | Shipment Card Layout: TP, followers, статус-бейджи | [shipment-detail-rebuild.md](../shipment-detail-rebuild.md) §Card | ✅ |
| REQ-OCR-007 | Back-Office: Sales/CSM Owner, статусы аккаунта | ❌ нет | ❌ |
| REQ-OCR-008 | User Profile: поле Phone, USER TIMEZONE | ❌ нет | ❌ |

---

## Итог OCR

| Статус | Кол-во | % |
|--------|--------|---|
| ✅ Есть | 3 | 38% |
| 🔶 Частично | 2 | 25% |
| ❌ Нет | 3 | 37% |
| **Всего** | **8** | |

**Пробелы:**
- REQ-OCR-003 Dashboard → нужен `dashboards/README.md`
- REQ-OCR-007 BO Account Mgmt → нужен `back-office/account-mgmt.md`
- REQ-OCR-008 User Profile → нужен `admin/user-profile.md`

---

## 🔗 Граф-метаданные
- **id:** `tms.shipments.rtm.rtm-08-ocr`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632881286 · **repo:** `tms/shipments/rtm/RTM-08-ocr.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

