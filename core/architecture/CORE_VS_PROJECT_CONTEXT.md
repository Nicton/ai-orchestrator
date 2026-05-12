# Core vs Project Context (Datamola Model)

## Why split
To make the system portable across clients/projects, we split:
1) **Core** — reusable knowledge/process/quality engine.
2) **Project Context** — domain-specific requirements, constraints, and data.

---

## 1) CORE (portable, reusable)

Core must be project-agnostic and transferable.

Includes:
- Role system and handoffs (Manager, Analyst, QA Architect, Tester, Automation, Critic)
- Universal testing philosophy and methods
- DoR/DoD and PR quality gates
- Test design techniques (risk-based, boundary, equivalence, negative paths)
- CI quality policy (blocking vs quarantine)
- Defect quality standard and evidence requirements
- Traceability model template
- Governance/checklist patterns

Core artifacts in repo (current):
- `core/process/PIPELINE.md`
- `core/process/CODING_STANDARDS.md`
- `core/testing/TESTING_PILLAR_BINDER.md`
- `core/knowledge/LEARNING_SYNTHESIS_V1.md`
- `core/testing/wave1/*`

---

## 2) PROJECT CONTEXT (replaceable per project)

Project Context contains everything specific to one client/product.

Includes:
- Product domain and business glossary
- Functional requirements and acceptance criteria
- Non-functional constraints (SLA, performance, security)
- Integrations and external systems
- Environment topology and data contracts
- Project-specific risks and priorities
- Regulatory/legal constraints for that product
- UI/domain selectors and test data conventions

Recommended location:
- `projects/<project-name>/context/*`

---

## 3) Operating contract between Core and Context

Core asks:
- requirement IDs,
- acceptance criteria,
- risk profile,
- expected outcomes.

Context provides:
- concrete product behavior and boundaries.

Core returns:
- standardized execution (roles, tests, checklists, quality gates) independent of project.

---

## 4) Minimal context package needed to start a new project

1. `PROJECT_OVERVIEW.md` (purpose, users, key flows)
2. `REQUIREMENTS_INDEX.md` (IDs + statuses)
3. `ACCEPTANCE_CRITERIA.md`
4. `RISK_PROFILE.md`
5. `NFR.md` (performance/reliability/security)
6. `INTEGRATIONS.md`
7. `TEST_DATA_POLICY.md`
8. `SELECTOR_POLICY.md` (if UI involved)

With this package, the Core can execute immediately.

---

## 5) Versioning strategy

- Core versioned independently (`core v1.x`).
- Project Context versioned per project (`project-context vY`).
- Compatibility note required when either side changes.

---

## 6) Migration rule (project to project)

When moving to a new project:
- keep Core unchanged,
- swap Project Context package,
- run readiness checklist,
- validate first pilot feature end-to-end.

This preserves quality while minimizing setup cost.
