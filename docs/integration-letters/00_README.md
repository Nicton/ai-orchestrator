# Integration Letters — Summary

Letters prepared by Aleh Asmalouski (Shiptify) requesting API documentation and sandbox access from integration providers.

## Letters Overview

| # | File | Company | Contact | Language | Priority |
|---|---|---|---|---|---|
| 1 | `01_teliae_fr.md` | **Teliae** | Nicolas Labille — commerce@teliae.fr | 🇫🇷 French | HIGH — no docs, no sandbox |
| 2 | `02_dsv_schenker_en.md` | **DSV (ex-DB Schenker)** | developer.support@dsv.com | 🇬🇧 English | HIGH — D96A→D01B migration unclear |
| 3 | `03_calvaedi_fr.md` | **CalvaEDI (Calvacom)** | Willy Berthelot — via calvaedi.com/calvaedi-contactez-nous-11.htm | 🇫🇷 French | MEDIUM — partial docs exist |
| 4 | `04_gtf_inovert_fr.md` | **GTF / INOVERT** (for DHL Inovert) | inovert@gtff.org — Jean-Marc Ors / Pierre Gérard | 🇫🇷 French | HIGH — no docs for DISPOR spec |
| 5 | `05_sap_en.md` | **SAP TM** | me.sap.com (portal) | 🇬🇧 English | HIGH — no sandbox, known bugs |

## Key Contacts Found

### Teliae (teliae.fr)
- **Nicolas Labille** — Directeur Commercial → commerce@teliae.fr
- **Support portal** → support.teliae.fr
- **Technical staff** → François-Xavier Lonjon (LinkedIn: /in/fxlonjon/)
- Phone: +33 (0)4 78 48 23 17

### DSV / DB Schenker
- **⚠️ DB Schenker was acquired by DSV — April 30, 2025. Use DSV contacts.**
- **Developer Support** → developer.support@dsv.com
- **Developer Portal** → https://developer.dsv.com/
- **EDI Getting Started** → https://developer.dsv.com/getting-started-with-edi

### CalvaEDI
- **Willy Berthelot** — Directeur Général → Contact via https://www.calvaedi.com/calvaedi-contactez-nous-11.htm
- **Gérard Stévenin** — PDG/Founder
- Phone: +33 (0)1 43 13 31 31
- LinkedIn: https://fr.linkedin.com/in/willy-berthelot-calva

### GTF / INOVERT (for DHL Inovert + Teliway)
- **inovert@gtff.org** (official standard body for DISPOR/REPORT messages)
- **Jean-Marc Ors** — Président GTF
- **Pierre Gérard** — Délégué Général
- Phone: +33 (0)6 701 78 600
- Address: 1 Rue de Stockholm, 75008 Paris

### SAP TM
- **me.sap.com** — submit support incident (requires SAP S-user ID)
- **api.sap.com** — Business Accelerator Hub (sandbox, API catalog)
- **SAP Community** → pages.community.sap.com/topics/transportation-management
- No named individual available publicly — escalate through customers' SAP account reps

## Critical Discoveries

1. **DB Schenker no longer exists independently** — acquired by DSV April 2025. Use developer.dsv.com.
2. **"DHL Inovert" is the INOVERT standard by GTF** — not a DHL product. GTF owns and maintains DISPOR/REPORT spec.
3. **Teliway is Teliae's TMS software** — same company. The Teliae letter covers Teliway (Urby/Evol) integrations too.
4. **Teliae is a TMS mediator, not a direct carrier** — it routes shipments to DHL Express.
5. **CalvaEDI is the EDI intermediary for XPO Logistics France** — they translate DISPOR → XPO internal.

## Sending Instructions

### Teliae (Letter 1)
Send to: **commerce@teliae.fr**
Subject: `Demande de documentation technique et accès sandbox — Intégration Shiptify × Teliae`
Also try: LinkedIn DM to Nicolas Labille or François-Xavier Lonjon

### DSV / DB Schenker (Letter 2)
Send to: **developer.support@dsv.com**
Subject: `EDIFACT Integration Documentation Request — IFTMIN/IFTSTA — Shiptify`
Also: Register on developer.dsv.com and submit via their support form

### CalvaEDI (Letter 3)
Send via: https://www.calvaedi.com/calvaedi-contactez-nous-11.htm
Or LinkedIn DM to: Willy Berthelot
Subject: `Demande de documentation technique — Intégration EDIFACT DISPOR/REPORT — Shiptify × CalvaEDI`

### GTF / INOVERT (Letter 4)
Send to: **inovert@gtff.org**
Subject: `Demande de spécification INOVERT (DISPOR / REPORT) — Shiptify`
Or call: +33 (0)6 701 78 600

### SAP (Letter 5)
Submit via: **me.sap.com** (support incident, component TM or TM-TRP)
Or post on: SAP Community (transportation-management)
Or escalate through your customers' SAP account executives
