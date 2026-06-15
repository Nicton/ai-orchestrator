---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629243947
source_type: confluence
---
# Referrals, Agreement, Contracts — реферралы, согласия, контракты

> Сверено с кодом 2026-06-13 | `models/{referral,agreement,shipper_carrier_contract}.js`, `services/{referrals,agreement}.js`, routes `referrals.js`, `agreement.js`, `shipper_carrier_contracts.js`

Три смежных модуля «отношений и юридики». Объединены, т.к. малы по отдельности.

## Referrals — реферальная программа

**Зачем:** рост через приглашения — пользователь зовёт контрагента на платформу. **Код:** `referral.js` (email уникален per account, user_id, data JSONB: first_name/phone/lang/status, status=ongoing). Валидация: email не должен быть существующим юзером; при создании заводится домен; событие ReferralCreated. **API:** `GET/POST /referrals`. **UI:** Back-Office (referrals.ts). **Сценарий:** шиппер приглашает перевозчика → тот регистрируется → связь трекается.

## Agreement — принятие T&C (CGU/CGV)

**Зачем:** юридически зафиксировать согласие пользователя с условиями; разные документы для разных типов (напр. Heppner-перевозчики). **Код:** `agreement.js` (type, name, url, lang, **available_user_type** напр. 'heppner', soft-delete); акцепт через `users.last_accepted_cgu_cgv` (timestamp) — согласие действительно, если все доки созданы до этой метки. **API:** `GET /agreement` (статус: docs, last_accepted, проверки адреса/телефона/ролей), `PATCH /agreement` (принять), `PATCH /agreement/user-info`. **Сценарий:** при первом входе после обновления T&C → пользователь видит документы → принимает → метка обновляется.

## Contracts — контракты shipper-carrier

**Зачем:** зафиксировать коммерческую связь и её внутренние референсы для операций. **Код:** `shipper_carrier_contract.js` (carrier_id, shipper_id, contract, product, is_active) + ShipperCarrierReference (internal_ref уникален на пару). **API:** `GET/POST/PATCH /shipper-carrier-contracts`, `/check` (право `c_contracts`). **UI:** frontend `contracts`. **Сценарий:** завести контракт с номером и продуктом → его internal_ref используется в заявках/референсах. См. также [carriers](../carriers/README.md).

---

## 🔗 Граф-метаданные
- **id:** `tms.referrals-agreement-contracts`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629243947 · **repo:** `tms/referrals/README.md`
- **code_refs:** `backend/app/models/{referral,agreement,shipper_carrier_contract}.js`, `services/{referrals,agreement,shipper_carrier_contracts}.js`, `routes/api/{referrals,agreement,shipper_carrier_contracts}.js`, `frontend/public/app/{referrals,agreement,contracts}`, `back-office/client` (referrals)
- **modules:** TMS, Back-Office, Carrier (Heppner T&C)
- **references:** `tms.carriers`, `carrier.onboarding`
- **requirements:** нет — реализовано без требований
