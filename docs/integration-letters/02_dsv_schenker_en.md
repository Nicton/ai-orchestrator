# Letter — DSV (formerly DB Schenker)
**To:** developer.support@dsv.com
**Subject:** EDIFACT Integration Documentation Request — IFTMIN/IFTSTA — Shiptify

---

Dear DSV Developer Support Team,

My name is **Aleh Asmalouski**, Software Engineer at **Shiptify** (a European TMS platform), and I am writing to request technical documentation and support regarding our EDIFACT-based integration with DB Schenker — now part of the DSV group following the acquisition completed in April 2025.

We have been operating an EDIFACT integration with DB Schenker for shipment booking and tracking for several years, and we would like to ensure continuity and improvement of this integration as the transition to DSV progresses.

---

## Our Current Integration

We currently exchange the following EDIFACT messages:

| Direction | Message Type | Version | Purpose |
|---|---|---|---|
| Shiptify → Carrier | IFTMIN | D96A | Shipment booking instruction |
| Carrier → Shiptify | IFTSTA | D01B | Shipment status updates (tracking) |

The integration operates via FTP file exchange. We also have a QA EDIFACT agency configured on our staging environment (`db_schenker_qa`).

We are aware that DB Schenker was migrating from IFTMIN D96A to D01B on the outbound side — we have already noted log entries referencing "IFTMIN D01B" in our QA documentation.

---

## Documentation and Support Needs

### 1. IFTMIN Migration: D96A to D01B

We understand the migration from IFTMIN D96A to D01B is in progress. We need:

- **Official migration guide** from IFTMIN D96A to D01B
- **Target deadline** for the migration (when will D96A stop being accepted?)
- **Diff of fields** between D96A and D01B — what's new, what's deprecated, what's changed?
- Confirmation that our existing D96A messages will continue to be processed during the transition period

### 2. Complete IFTMIN Field Specification (D96A + D01B)

Our current implementation is based on reverse-engineering and limited documentation. We need:

- **Full IFTMIN D96A field specification** (all segments and their mapping to shipment data) in the DSV/DB Schenker context
- **Full IFTMIN D01B field specification** for the target format
- For each field: mandatory vs optional, accepted values, format, maximum length
- Documentation of any DSV/DB Schenker **specific extensions** or constraints on top of the standard

### 3. Complete IFTSTA Status Event Codes (D01B)

- Exhaustive list of all **IFTSTA event codes** sent by DSV/DB Schenker
- Meaning and business context of each status event
- Are there any DSV-specific status codes beyond the standard IFTSTA spec?

### 4. QA / Test Environment

We currently have a QA EDIFACT agency configured (`QADBSCHENKER` / `db_schenker_qa` environment). We need to confirm:

- Is this QA FTP environment still operational and maintained after the DSV acquisition?
- Are there changes to FTP credentials, hostnames, or directory structure post-acquisition?
- Is there a dedicated DSV API/EDIFACT test environment we should migrate to?

### 5. GLN / Sender Code Requirements

For onboarding new shippers onto the DB Schenker/DSV EDIFACT integration:

- What GLN (Global Location Number) or sender code is required per shipper?
- What is the process to register a new shipper code for EDIFACT exchange?
- Is there a web portal for self-service registration?

### 6. FTP Infrastructure Changes Post-Acquisition

- Are there any planned changes to FTP hostnames, directories, or protocols as part of the DSV integration?
- Will there be a migration to DSV's API platform (`developer.dsv.com`) for EDIFACT exchanges?
- What is the timeline for any infrastructure changes?

---

## Request for a Technical Contact

We would appreciate being connected with a **dedicated technical contact** (or integration manager) at DSV who can assist with these questions, particularly as the DB Schenker → DSV transition progresses. Having a named contact would significantly improve our ability to maintain and evolve the integration.

---

We are an active integration partner and are committed to adapting our implementation to meet DSV's evolving standards. We are available for a technical call at your convenience.

Thank you for your time and support.

Best regards,

**Aleh Asmalouski**
Software Engineer — Integrations
Shiptify
aleh.asmalouski@shiptify.com

---

*P.S. We have also registered on the DSV Developer Portal at developer.dsv.com and would welcome guidance on whether EDIFACT support is documented there or handled through a separate channel.*
