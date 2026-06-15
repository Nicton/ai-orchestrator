# Operating Principles for LLM-Driven QA Core

This file defines the engineering behavior of the system across providers, skills, and projects.

## Purpose

The repository is not just a documentation bundle. It is intended to become an executable, provider-agnostic QA operating system for requirement analysis, test design, automation generation, stabilization, and review.

## Core Principles

### 1. Determinism over cleverness
- Prefer repeatable outputs over impressive but inconsistent ones.
- Stable artifacts beat ad-hoc prose.
- If a decision can be encoded as a contract, schema, checklist, or policy, encode it.

### 2. Artifacts over vibes
- Every stage should leave behind consumable artifacts.
- Human-readable markdown is useful, but machine-readable JSON/YAML is required for reliable chaining.
- No hidden reasoning dependencies between stages.

### 3. Provider-agnostic by default
- OpenAI, Gemini, Claude-style coding agents, and future providers may differ.
- The pipeline must depend on contracts and policies, not on one model’s personality.
- Provider-specific prompting must live in compatibility/routing layers, not inside business artifacts.

### 4. No implementation before readiness gates
Before implementation starts, the system must have:
- repo intake,
- traceability understanding,
- atomic candidate tests,
- explicit approval when required by workflow.

### 5. Every UI action needs an oracle
- No “click and hope”.
- Every meaningful action should have preconditions and postconditions.
- Failures must be evidence-backed.

### 6. Small explicit handoffs
- Each skill should receive a constrained input and produce a constrained output.
- If a handoff cannot be validated, the stage is not complete.

### 7. Parallelize only after contracts are stable
- Synchronous execution is acceptable for MVP.
- Parallel lanes are allowed only when shared artifacts and merge rules are clear.

### 8. Human attention is precious
The system should separate:
- what can be done autonomously from repo evidence,
- what can be done autonomously from established engineering/testing practice,
- what requires explicit human product or architectural decisions.

### 9. Best practice is allowed, invention is limited
- Use established QA, automation, architecture, and prompt-engineering best practices when the repo is silent.
- Do not invent product rules, acceptance criteria, or governance decisions that belong to the owner.

### 10. Evidence-first debugging
- Debugging conclusions must be linked to artifacts, traces, DOM state, or reproducible observations.
- “Probably” is acceptable only when explicitly marked as hypothesis.

## Decision Priority
When signals conflict, use this order:
1. Explicit human decision for this repository/project
2. Machine-readable contract/policy in repo
3. Human-readable canonical repo documentation
4. Stable existing implementation patterns in repo
5. Industry best practices / book-derived guidance
6. Temporary local assumption, explicitly marked

## Output Policy
Preferred output formats by maturity:
- Strategy / narrative: Markdown
- Handoffs / registries / routing / pipeline: YAML or JSON
- Validation: JSON Schema where practical

## What the system should optimize for
- portability,
- predictability,
- debuggability,
- maintainability,
- low prompt ambiguity,
- low provider lock-in.

## What the system should avoid
- hidden assumptions,
- duplicated sources of truth,
- provider-specific logic leaking into core process,
- free-form outputs when structured outputs are practical,
- adding new execution paths without explicit entry/exit contracts.
