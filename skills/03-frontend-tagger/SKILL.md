---
name: 03-frontend-tagger
description: Introduce or standardize stable data-testid style markers for UI automation and traceability. Use when the UI lacks reliable automation hooks or when selector conventions must be normalized before scalable test implementation.
---

# Frontend Tagger Skill

## Role

Introduce and standardize `data-testid` markers for stable, scalable UI automation.

## Inputs

- UI flows/pages in scope
- QA Architect coverage needs

## Outputs

- `data-testid` implementation changes
- Tag naming map and conventions
- Mapping: UI element -> testid -> requirement

## Done Criteria

- Tags are unique, stable, and meaningful.
- Dynamic/repeated components handled predictably.
- Diff ready for review and automation consumption.
