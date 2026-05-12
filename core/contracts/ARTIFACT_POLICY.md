# Artifact Policy

## Purpose
Define how pipeline stages exchange information in a way that is reliable for both humans and LLM/runtime orchestration.

## Rule: dual-format by default
For important pipeline artifacts, prefer two sibling outputs:
- human-readable `.md`
- machine-readable `.json` or `.yaml`

Example:
- `TRACEABILITY_MATRIX.md`
- `TRACEABILITY_MATRIX.json`

## Required properties of machine-readable artifacts
- stable field names
- explicit version field where practical
- no hidden assumptions in free-form prose fields
- references to source documents or evidence when available

## Required properties of markdown artifacts
- concise explanation of intent
- key assumptions visible to human reviewer
- links/paths to sibling machine artifact

## Recommended canonical artifacts
- requirements baseline
- assumptions
- traceability matrix
- atomic test cases
- approved scope
- run report
- gap analysis
- final readiness status

## Validation policy
- if a machine-readable contract exists, downstream stages should consume it first
- markdown is for review and audit, not the primary machine handoff
- invalid machine artifacts should block the dependent stage

## Naming convention
- Use uppercase names for project-facing canonical docs if current repo convention requires it
- Use lowercase or kebab-case under `core/contracts/` and internal machine layers

## Minimum migration strategy
1. Keep current markdown artifacts
2. Add sibling JSON/YAML for new work
3. Backfill machine-readable twins for high-value artifacts first

## First targets for structured handoffs
1. traceability matrix
2. atomic test cases
3. approved scope
4. gap analysis
5. final status
