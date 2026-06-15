---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/633012289
source_type: confluence
---
# Претензии (Claims)

Claims — претензии по повреждению, потере или задержке груза. Shipper создаёт претензию к конкретной перевозке, ведётся переписка, фиксируется ущерб и решение.

## Кто использует

- **Shipper** — создаёт претензии, предоставляет документы
- **Carrier** — получает уведомление, отвечает
- **Admin** — мониторинг всех претензий

## Место в потоке

```
Shipment delivered (или в пути)
    ↓
Shipper обнаруживает повреждение / потерю
    ↓
Claim создаётся (из страницы Shipment → таб Claims / кнопка TrackingPoint)
    ↓
Carrier уведомлён → отвечает
    ↓
Претензия закрывается: resolved / rejected
```

---

## Страницы

| URL | Описание |
|-----|---------|
| `/claims` | Список всех претензий |
| `/claims?shipment_id={id}` | Претензии по конкретному Shipment |
| `/claims/{id}` | Детали претензии |
| `/claims-dashboard` | Дашборд: статистика претензий |

---

## Создание претензии

Способы создать Claim:

1. **Из страницы Shipment** → таб "Claims" → кнопка "Create Claim"
2. **Из TrackingPoint** с `status = incident` → кнопка "Open Claim"
3. **Из списка `/claims`** → кнопка "New Claim"

### Форма создания

| Поле | Описание | Обязательно |
|------|---------|------------|
| Shipment | Связанная перевозка | Да |
| Тип претензии | Damage / Loss / Delay / Other | Да |
| Описание | Что произошло | Да |
| Сумма ущерба | Оценка в валюте | Нет |
| Документы | Фото повреждений, акты | Нет |

---

## Детали претензии `/claims/{id}`

### Что видит пользователь

| Элемент | Описание |
|---------|---------|
| Статус | open / under_review / resolved / rejected |
| Тип | Damage / Loss / Delay |
| Перевозка | Ссылка на Shipment |
| Описание | Суть претензии |
| Сумма | Заявленный ущерб |
| Документы | Прикреплённые файлы |
| История | Переписка Shipper ↔ Carrier |

### Статусы Claims

| Статус | Описание |
|--------|---------|
| `open` | Только создана |
| `under_review` | Carrier изучает |
| `resolved` | Урегулирована (компенсация выплачена) |
| `rejected` | Carrier отклонил |
| `cancelled` | Shipper отозвал |

### Действия

| Действие | Кто | Что происходит |
|----------|-----|---------------|
| Добавить комментарий | Shipper, Carrier | Запись в историю |
| Загрузить документ | Shipper | `ClaimAttachment` создаётся в S3 |
| Изменить статус | Admin, Carrier | `Claim.status` обновляется |
| Закрыть претензию | Admin | `status = resolved/rejected` |

---

## Claims Dashboard `/claims-dashboard`

| Виджет | Описание |
|--------|---------|
| Открытых претензий | Count `status = open` |
| Под рассмотрением | Count `status = under_review` |
| Общая сумма претензий | SUM заявленного ущерба |
| По типам | Breakdown: Damage / Loss / Delay |
| Среднее время закрытия | Days from open to resolved |

---

## Мутации при создании Claim

**Внутренние:**
- `Claim` создаётся
- `Claim.shipment_id` привязывается
- `TrackingPoint.status = incident` (если из TP)

**Внешние:**
- Email `mailClaimCreatedToCarrier` → уведомление перевозчику
- Email `mailClaimCreatedToShipper` → подтверждение

---

## Backend

- Модель: `app/models/claim.js`
- Frontend: `workspaces/frontend/public/app/claims/`
- Worker emails: `worker/tasks/notify_by_email.js`

---

## Сверено с кодом (2026-06-11) — модель Claim

Статусы (`models/claim.js:42-47`): **NEW, CANCELED, SENT_TO_CARRIER, INCOMPLETE, REJECTED, UNSOLVED, ACCEPTED, REFUSED**; переходы — `statuses_matrix` (claim.js:158-209): NEW → SENT_TO_CARRIER → ответ перевозчика (ACCEPTED/REJECTED/INCOMPLETE...).

Поля: `claim_type` (default 'other'), `claim_type_id`, `is_fast` (0|1), обязательная связь `shipment_id`, стороны shipper/carrier + divisions.

API: `GET/POST /api/v1/claims`, `GET/PUT /api/v1/claims/:id` (права по shipper_ids / carrier_division_ids — `services/claims.js:11-66`). Дашборд `/claims-dashboard` — статистика по интервалам 0/7/15/30/60 дней.

---

## 🔗 Граф-метаданные
- **id:** `tms.claims`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 633012289 · **repo:** `tms/claims/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

