---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631668820
source_type: confluence
---
# Broker View — Вид и действия брокера

Новый модуль IM/EX для аккаунтов, работающих как таможенные брокеры.

> Источник: слайд `2026 04 - Broker view and action`

---

## Условие отображения

Вкладки EXPORT / IMPORT / DONE видны только если у аккаунта есть хотя бы 1 подтверждённый SR, где аккаунт указан как брокер.

---

## Вкладки

| Вкладка | Описание |
|---------|---------|
| **EXPORT** | Исходящие таможенные операции |
| **IMPORT** | Входящие таможенные операции |
| **DONE** | Завершённые операции |

### Автоматический переход в DONE

- EXPORT → DONE при достижении TP: **STY0590** (Export Customs Clearance by Broker)
- IMPORT → DONE при достижении TP: **STY0380** (Import Customs Cleared)

---

## Что видит брокер

✅ Доступно:
- CHAT
- Tracking points
- Customs invoice
- Identity destination broker
- Documents

❌ Не доступно:
- Spectators
- SR/Invoicing
- Cancel shipment
- Share tracking
- Truck driver info

---

## Tracking Point коды (таможня)

| Код | Значение |
|-----|---------|
| STY0445 | Export Customs Declaration |
| STY0590 | Export Customs Clearance by Broker |
| STY0449 | Import Customs Declaration |
| STY0357 | Import Customs Declaration (import leg) |
| STY0380 | Import Customs Cleared |

---

## API

```
POST /shipment-requests/{id}/broker
{
  "BROKER_TYPE": "ORIGIN" | "DESTINATION",
  "BROKER_ID": <integer>
}
```

---

## 🔗 Граф-метаданные
- **id:** `tms.features.broker-view`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 631668820 · **repo:** `tms/features/broker-view.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

