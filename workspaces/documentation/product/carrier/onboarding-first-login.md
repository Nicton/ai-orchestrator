---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632258610
source_type: confluence
---
# Carrier Onboarding — Первый вход

> ⚠️ СТАТУС ПО КОДУ (2026-06-12): по слайдовому неймингу (first login/onboarding wizard/welcome) реализация в backend/frontend **не найдена** двумя поисками. Product: «точно есть частичная реализация» — вероятно, под другим именем/экраном. TODO: указать роут/название экрана в проде — допроверим и привяжем к коду.

Переработанный флоу первого входа для пользователей-перевозчиков: 3-шаговый wizard вместо единого модала.

> Источник: слайд `2025 11 - Carrier onboarding screens`

---

## Триггер

Wizard запускается при **первом входе** пользователя-Carrier в систему.

---

## Шаги

### Шаг 1: Пароль

- Carrier пользователь устанавливает пароль при первом входе
- Только дизайн обновлён, string keys без изменений
- Билингвальный интерфейс (EN/FR)

### Шаг 2: Terms of Service

- Пользователь принимает Условия пользования (CGU)
- Новый string key: `Onboardui!25`
- FR: Conditions Générales d'Utilisation

### Шаг 3: Информация о пользователе (3 под-шага)

#### Шаг 3.1: Контактные данные
- Поля: First name, Last name, Phone code + number
- Dynamic preview: карточка контакта обновляется в реальном времени
- Новые string keys требуются

#### Шаг 3.2: Локация агентства
- Поля: Country, City (существующие)
- Preview карточки: Carrier Name, Logzone, City
- Новые string keys требуются

#### Шаг 3.3: Роль в компании
- Пользователь подтверждает свою роль в организации перевозчика
- Существующие варианты ролей
- В запросе указывается имя Carrier

---

## Логика выбора агентства (TARGET_CARRIER_ID)

При выборе существующего агентства:
1. BO логирует `TARGET_CARRIER_ID`
2. Targeted carrier получает запрос на подтверждение merge
3. После подтверждения → пользователь видит тот же вид, что и carrier

---

## Изменения в User Profile

Новое поле **"carrier name"** в профиле пользователя — для multi-account сценариев, чтобы видеть от чьего имени действует пользователь.

---

## Страница входа (redesign)

Обновлённые метки:
- "Se connecter" (Login)
- "Mot de passe oublié" (Forgot password)

---

## 🔗 Граф-метаданные
- **id:** `carrier.onboarding-first-login`
- **type:** module-doc · **domain:** Carrier · **status:** implemented
- **confluence:** 632258610 · **repo:** `carrier/onboarding-first-login.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** Carrier
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

