---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/632422451
source_type: confluence
---
# Localization — языки Slotify/DOCK

> Сверено с кодом 2026-06-12 | `mfe-auth/contexts/language.tsx:23-36`, `user.lang` (`user.js:79`), Tolgee-проект 25 (`translations/.../mini-apps/slotify.json`)

## Зачем

Slotify пользуются водители и кладовщики поставщиков по всей Европе — язык интерфейса не должен требовать настройки. Принцип: **гость получает язык браузера, пользователь — язык профиля**.

| Слой | Механизм |
|------|---------|
| Определение для гостя | `getBrowserLanguageCode()` — navigator.languages[0] против SUPPORTED_LANGS, fallback FR |
| Пользователь системы | `users.lang` (default en) |
| URL | Языковой префикс `/:lang/...` в Slotify — ссылка фиксирует язык (можно слать «французскую» ссылку) |
| Тексты UI | Tolgee, проект mini-apps/slotify → `translations/resources/i18n/mini-apps/slotify.json` |
| Письма | `emailing.json` + переводы в msg-email |
| SMS | язык водителя `account_drivers.language` (см. Drivers & SMS) |

Добавление языка = добавить локаль в Tolgee + конфиг `translations/config` (s3langs) — без правок кода фич. Текущий охват: EN/FR полные; DE/UK и др. — по мере перевода.

## Где найти и как настроить (UI)

- **Пользователь системы**: профиль → язык (`users.lang`).
- **Гость Slotify**: язык определяется автоматически из браузера; можно прислать ссылку с языковым префиксом `/:lang/...` — она зафиксирует язык интерфейса.
- **Добавить язык** (для команды): Tolgee-проект mini-apps/slotify + конфиг `translations/config` (s3langs) — без правок кода фич.

## Сценарии

1. **Польский поставщик**: открывает Slotify-ссылку → интерфейс на польском (если язык в SUPPORTED_LANGS), иначе fallback FR.
2. **Рассылка франкоязычным**: слать ссылку `/fr/...` — гарантированно французский UI независимо от браузера.

---

## 🔗 Граф-метаданные
- **id:** `dock.feature-docs.platform.localization`
- **type:** module-doc · **domain:** DOCK · **status:** implemented
- **confluence:** 632422451 · **repo:** `dock/feature-docs/platform/localization.md`
- **code_refs:** TODO (заполнить при углублении)
- **modules:** DOCK
- **references:** —
- **requirements:** см. чеклисты/RTM (source backfill — волна 7.2)

