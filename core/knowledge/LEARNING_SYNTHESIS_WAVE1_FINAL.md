# Learning Synthesis — Wave 1 (Final)

This is the **consolidated “what we learned”** from the Wave 1 source set and how it changes day‑to‑day execution.

Wave 1 scope (explicit): **Testing domain** (test design, automation reliability, quality gates, roles).

Canonical Wave 1 outputs:
- QA package: `core/testing/wave1/QA_*`
- Programmer package: `core/testing/wave1/PROGRAMMER_*`
- Binder pillar: `core/testing/TESTING_PILLAR_BINDER.md`

---

## 1) The core philosophy (the non-negotiables)

1) **Model-first testing**
   - Build tests from use cases, acceptance criteria, and state models *before* (or alongside) implementation.

2) **Contracts + state + invariants are the backbone**
   - Verify preconditions/postconditions, invariants, and valid/invalid state transitions.

3) **Interaction is first-class**
   - Protocols, events, exceptions, timing and error behavior matter as much as “happy path”.

4) **Risk/use-profile drives coverage**
   - High impact + high likelihood gets deep coverage (positive + negative + boundaries + transitions).

5) **Determinism is the primary reliability lever**
   - Stable selectors, stable data, stable waits, and verified service-method contracts.

---

## 2) Wave 1 role principles (what each role must do)

### 2.1 Tester (execution + evidence)
- Derive compact test sets using equivalence classes + boundaries + negative paths.
- Execute in risk order.
- Provide evidence that accelerates triage (inputs, expected vs actual, env/build, artifacts).

### 2.2 QA Architect (strategy + coverage architecture)
- Publish scope/non-scope, risk profile, coverage model, traceability model, entry/exit criteria.
- Enforce the “verify once at cheapest reliable layer” design rule.
- Define CI gates (blocking vs quarantine) and artifact requirements.

### 2.3 Programmer writing tests (testing-first engineering)
- Ensure testability: inject dependencies (time/random/IO), isolate side effects.
- Prefer behavior/contract tests over implementation-detail tests.
- Keep suites fast and actionable.

### 2.4 Automation Engineer (suite engineering)
- Build reusable services/shared steps and keep test specs high-level.
- Keep selectors stable (test-ids), stabilize waits, reduce flake.
- Produce useful failure artifacts.

### 2.5 Analyst (requirement quality)
- Requirements must be testable and unambiguous.
- Acceptance criteria must include negative paths and state transitions where relevant.

### 2.6 Manager + Critic (governance)
- Governance is a control system: DoR/DoD + PR gates + traceability.
- Critic reviews the shape of coverage (invariants, transitions, interactions, boundaries), not only pass/fail.

---

## 3) Practical operational rules (summary)

- Prefer **stable, deterministic checks** over “clever” but fragile automation.
- Always include **negative + boundary** cases for high-risk behavior.
- Keep a **traceability map** requirement → scenario → test → evidence.
- Treat flakiness as **quality debt** with explicit owner + deadline.

---

## 4) Source set (Wave 1)

Primary sources used:
- Binder — *Practical Guide to Testing Object-Oriented Software*
- Copeland — *A Practitioner’s Guide to Software Test Design*
- Myers et al. — *The Art of Software Testing*
- Crispin & Gregory — *Agile Testing*
- This repository’s process/testing docs

---

## 5) What is deliberately NOT included yet

- Deep language-specific engineering rules (beyond what supports testability).
- Domain-specific context (belongs in `projects/<name>/context/`).
- Performance/security deep-dive.

These will be handled in later waves.
