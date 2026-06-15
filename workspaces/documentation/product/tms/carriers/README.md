---
confluence_url: https://shiptify.atlassian.net/wiki/spaces/TD/pages/629374998
source_type: confluence
---
# Carriers & Shipper-Carrier — перевозчики и связи

> Сверено с кодом 2026-06-13 | `models/shipper_carrier*.js`, `private_carriers.js`, `carrier_groups*.js`, routes `shipper_carriers.js`, `shipper_carrier_contracts.js`, `private_carriers.js`

## Зачем (бизнес-контекст)

Перевозчик в Shiptify — не просто справочник. Шипперу нужно: подключить перевозчиков, с которыми он работает; задать **по каким режимам** (LTL/FTL/Sea/Air) с каждым; хранить контракты и сервисы; пускать пользователей перевозчика в нужные аккаунты. Отдельно — **Private Carrier**: перевозчик, которого шиппер завёл сам (мелкий локальный оператор без аккаунта Shiptify), чтобы бронировать и трекать через него. Без этого слоя нельзя выбрать перевозчика в CSW и применить его рейтшит.

## Как устроено (код)

| Сущность | Модель | Смысл |
|----------|--------|-------|
| Связь | `shipper_carrier.js` | shipper↔carrier — «я работаю с этим перевозчиком» |
| Режимы | `shipper_carrier_modes.js` | по каким mode (LTL/FTL/Parcel…) активна связь — определяет доступность в CSW |
| Сервисы | `shipper_carrier_service.js` | service_id (galaxy_services), tag_color/type |
| Контракты | `shipper_carrier_contract.js` | contract, product, is_active + ShipperCarrierReference (internal_ref) |
| Пользователи | `shipper_carrier_users.js` | user↔target_carrier/account, status active/disabled |
| Private | `private_carriers.js` | name, account_id, опц. carrier_id — кастомный перевозчик шиппера |
| Группы | `carrier_groups.js` + `_carriers.js` | группировка перевозчиков по mode |

## Где найти и настроить (UI)

| Что | Где |
|-----|-----|
| Подключение перевозчиков, режимы, пользователи | Self-Admin → `POST/PATCH/DELETE /self-admin/shipper/carriers`, `.../carrier/modes`, `.../carrier/user` |
| Контракты | `GET/POST/PATCH /shipper-carrier-contracts` (право `c_contracts`) |
| Private carriers | `GET /private-carriers`; frontend `private-carriers` |
| Сервисы (galaxy services) | frontend `shipper-carrier` → `/services/galaxies` |

## Сценарии

1. **Подключить нового перевозчика для авто-перевозок**: Self-Admin → добавить carrier → включить mode FTL → теперь он доступен в CSW для FTL и к нему применяется его рейтшит.
2. **Локальный курьер без Shiptify**: создать private carrier → бронировать/трекать через него вручную.
3. **Контракт с тарифным продуктом**: завести shipper-carrier contract (contract+product) → используется при расчёте/референсах в операциях.

---

## 🔗 Граф-метаданные
- **id:** `tms.carriers`
- **type:** module-doc · **domain:** TMS · **status:** implemented
- **confluence:** 629374998 · **repo:** `tms/carriers/README.md`
- **code_refs:** `backend/app/models/{shipper_carrier,shipper_carrier_modes,shipper_carrier_service,shipper_carrier_contract,shipper_carrier_users,private_carriers,carrier_groups}.js`, `routes/api/{shipper_carriers,shipper_carrier_contracts,private_carriers}.js`, `frontend/public/app/{carriers,shipper-carrier,private-carriers}`
- **modules:** TMS, Rate Sheets, Buy&Sell
- **references:** `tms.rate-sheets`, `tms.shipments.csw`, `tms.self-admin`
- **requirements:** нет — реализовано без требований
