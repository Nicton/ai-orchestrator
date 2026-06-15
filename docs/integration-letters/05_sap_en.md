# Letter — SAP (Transportation Management)
**To:** Via SAP for Me portal — https://me.sap.com/ (submit incident under component TM-TRP or via your SAP account executive)
**Subject:** SAP TM SOAP Integration Documentation Request — Freight Order API — Shiptify

---
 
Dear SAP Transportation Management Support Team,

My name is **Aleh Asmalouski**, Software Engineer at **Shiptify**, a European Transport Management System (TMS) platform. I am writing to request technical documentation and support for our integration with SAP Transportation Management (TM) via the SOAP Freight Order API.

---

## Background

Shiptify is integrated bidirectionally with SAP TM for several enterprise customers. Our integration covers:

**Inbound (SAP TM → Shiptify):**
- SAP creates, updates, or cancels Freight Units → Shiptify creates/manages Shipment Requests
- Direct booking and draft creation modes
- Incoterms, address mappings, dangerous goods data

**Outbound (Shiptify → SAP TM):**
- Carrier selection confirmation (Quote Request Awarded)
- Booking confirmation
- Real-time tracking point updates (pickup, in-transit, delivery, exceptions)
- Shipment cancellation notifications

The integration uses the SAP TM **SOAP Web Service API (Freight Order)**, compatible with both SAP TM 9.x and SAP S/4HANA with Extended Management.

---

## Documentation and Technical Gaps

Our team has identified several areas where **official documentation is insufficient** to fully implement and debug the integration. We request your help on the following points:

### 1. Complete SOAP WSDL / API Documentation

- We need access to the **complete, up-to-date WSDL** for the Freight Order SOAP API used for the inbound integration (SAP TM → Shiptify)
- Full field-by-field specification of the **Freight Unit payload structure**: mandatory vs optional fields, data types, enumerated values
- Documentation of the **outbound notification API** (for Shiptify → SAP TM events: booking confirmation, tracking updates, cancellation)
- Is this documented on the **SAP Business Accelerator Hub** (api.sap.com)? If so, which specific API entry covers our use case?

### 2. Transport Mode Codes

Our current implementation has gaps in **transport mode mapping** between Shiptify's internal modes and SAP TM codes:
- What is the complete list of **SAP TM transport mode codes** (truck types, rail, air, sea, etc.)?
- How do these codes map to SAP TM's "Means of Transport" configuration?
- Is there a standard mapping to ISO or UN/EDIFACT transport mode codes?

### 3. Event Codes for Tracking Notifications

- What are all the **SAP TM event codes** for tracking notifications (pickup arrival, pickup complete, in-transit, delivery attempt, delivery confirmation, exception)?
- Are these standard across SAP TM versions, or customer-configurable?
- Known issue: our integration does not always receive a delivery confirmation event from SAP TM — is there a configuration requirement on the SAP side to ensure delivery events are generated?

### 4. Zone Code and Master Location Handling

- How should **SAP TM geographic zone codes** be handled in the Freight Unit payload?
- Our current workaround uses Master Location codes instead of zone hierarchies — is there a recommended approach for mapping SAP zone codes to Shiptify address records?

### 5. Version Differences (SAP TM 9.x vs S/4HANA EM)

For customers migrating from SAP TM 9.x to SAP S/4HANA:
- Are there **differences in the SOAP API** between SAP TM 9.x and S/4HANA Extended Management?
- What fields or capabilities are available in S/4HANA that were not in TM 9.x?
- Is there a **migration guide** for integration partners?

### 6. Sandbox / Development Environment

- Does SAP provide a **shared sandbox or development environment** for SAP TM integration testing that does not require a full SAP customer contract?
- If not, what is the **recommended path** for testing integration changes without affecting production?
- Can the **SAP Business Accelerator Hub** (api.sap.com) be used to test Freight Order API calls?

### 7. Packaging and Freight Unit Structure

- What is the expected structure for **multi-line freight units** (multiple package types, weights, dimensions)?
- Known issue: there is a discrepancy between Shiptify's package count calculation and SAP TM's expected freight unit count — what is the authoritative source for how package quantities should be represented?

### 8. Incoterm Handling

- What is the complete list of **SAP TM Incoterm codes** and how should the `person_name` / company relationship be populated?
- Are there any validation rules that cause rejection when incoterms are missing from a Freight Unit payload?

---

## Current Known Issues We Would Like Help Resolving

| Issue | Description |
|---|---|
| Delivery confirmation event not always generated | Some delivery types do not trigger a status event in SAP TM, causing STY to miss delivery confirmation |
| Pickup arrival event not distributed | Exception handling for pickup arrival events has gaps |
| Transport mode codes incomplete | Not all STY transport modes have a valid SAP TM code mapping |
| Air freight packaging structure | Packaging information structured incorrectly for air freight payloads |
| Zone codes not supported | No native support for SAP geographic zone hierarchies |

---

## Request

We would appreciate:
1. Being connected with an **SAP TM technical integration specialist** or product team member
2. Access to complete API documentation and WSDL files
3. Guidance on the recommended **support channel** for SAP TM integration questions
4. Information about any **partner integration programs** that would facilitate ongoing technical collaboration

If required, we can submit a formal support incident via **SAP for Me** (me.sap.com) under the TM component. Please advise on the correct component code for Freight Order API / external integration issues.

Thank you for your time and assistance.

Best regards,

**Aleh Asmalouski**
Software Engineer — Integrations
Shiptify
aleh.asmalouski@shiptify.com
