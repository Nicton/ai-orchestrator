---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632553619
source_type: confluence
---
# Slotbook — Улучшенный выбор перевозчика

Новый флоу выбора перевозчика при бронировании слота: выбор из контактов, лёгкое создание, post-creation enrichment.

> Источник: слайд `2026 01 - Slotbook _ Improve carrier selection`

---

## Для кого

Только процесс **Slot Book** (Shipper или PML/Dock аккаунты).

---

## Новые опции выбора перевозчика

### 1. Select Active Carrier (dropdown)

Показывается только если у пользователя есть хотя бы 1 контакт-перевозчик.

Отображает:
- Логотип перевозчика
- Имя перевозчика
- LogZone город/страна (если задан)
- Количество активных и pending контактов

При выборе через dropdown → SlotMail PDF отправляется всем пользователям этого Carrier (shoot to all, конкретный email не таргетируется).

**Поиск** доступен рядом с dropdown.

### 2. OR ADD VIA EMAIL (legacy)

Существующий ввод email — сохраняется как fallback, постепенно уходит.

Email одновременно:
- Прямой ввод адреса
- Предфильтр для выбора Active Carrier (точное / частичное совпадение)

---

## Light Carrier Creation (новый перевозчик)

Когда email не распознан:
1. Автозаполнение: First name (из email, мин. 2 символа), Last name (опционально), Carrier name (из домена, если не публичный)
2. Все поля редактируемы

После подтверждения — два пути:
| Путь | Описание |
|------|---------|
| **QUICK CREATE** | Конец флоу, перевозчик создан (аналог slotbook/add-carrier) |
| **Detailed Creation** | Полный существующий флоу создания |

Новый пользователь создаётся как "pending" (не invite) и обогащается как carrier contact.

---

## Post-Creation Enrichment (со стороны перевозчика)

После того, как carrier заполняет Country и City:
1. Система проверяет соответствие в referential (targeted carrier)
2. Если совпадение найдено → запрос подтверждения идентичности
3. Подтверждение → carrier обогащается данными targeted carrier (POST CREATION ENRICHMENT, не при invite)
4. "Не знаю" → targeted carrier не назначается

**Будущее TBD:** targeted carrier подтверждает принадлежность пользователя → auto-merge. Если нет → очистка targeted carrier.

---

## Shipper-side enrichment (бонус / TBD)

На уровне carrier contact введётся индикатор "certified" (Random/Pro vs Noob):
- **Noob** = нет активных пользователей и аккаунт не активирован
- Клик на "noob" carrier → модал для изменения имени, страны/города, таргетинга carrier
- Работает как PATCH в BO referential (только если Noob и нет активного carrier user)

---

## 🔗 Граф-метаданные
- **id:** `tms.slots.slotbook-carrier-selection`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 632553619 · **repo:** `tms/slots/slotbook-carrier-selection.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** TMS
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

