---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/631930913
source_type: confluence
---
# BO Alerting — Система оповещений Back-Office

Система для создания и управления баннерами-оповещениями внутри Shiptify app. Администраторы могут создавать алерты, таргетированные на конкретную аудиторию.

> Источник: слайд `2026 02 - BO _ ALERTING`

---

## Создание алерта

Новая категория **ALERT** в Admin Panel Back-Office. Действия: CREATE, EDIT, DELETE.

### Поля алерта

| Поле | Обязательное | Описание |
|------|-------------|---------|
| Severity | ✅ | Цвет баннера: 🔴 Red / 🟠 Orange / 🔵 Blue |
| Audience | ✅ | Минимум 1 тип аккаунта ИЛИ 1 флаг функционала |
| Message (EN) | ✅ | Минимум 30 символов |
| Message (FR) | — | Опционально |
| Message (ES) | — | Опционально |
| Validity period | — | Опциональные start/end даты |

---

## Таргетинг аудитории

| Опция | Пример |
|-------|--------|
| По типу аккаунта | CARRIER / ALL / комбинация (carriers + TBS) |
| По флагу функционала | Если у аккаунта включена конкретная фича |

---

## Языковая логика

| Язык пользователя | Показывается |
|------------------|-------------|
| EN | EN |
| FR | FR (fallback EN если FR не заполнен) |
| ES | ES (fallback EN если ES не заполнен) |
| Другой | EN |

Без Tolgee-ключей (строки вводятся напрямую в BO).

---

## Поведение для пользователей

- При публикации алерта → мгновенно показывается всем целевым пользователям
- Пользователь закрыл алерт → при следующем входе алерт появится снова

---

## 🔗 Граф-метаданные
- **id:** `back-office.alerting`
- **type:** module-doc · **domain:** Back-Office · **status:** implemented
- **confluence:** 631930913 · **repo:** `back-office/alerting/README.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Back-Office
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

