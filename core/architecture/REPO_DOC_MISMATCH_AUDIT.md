# Repo / Docs Mismatch Audit

## Purpose
Continue the architecture revision audit by turning the previously noted mismatches into a concrete remediation list.

## Summary
The repo is no longer in the “missing core scaffolds” state described in the early revision plan.
Several planned artifacts already exist, so the main issue has shifted from missing scaffolding to **documentation drift** and **source-of-truth ambiguity**.

## Findings

### 1. Planned artifacts now exist
The following items are present and should no longer be described as pending scaffolds:
- `core/contracts/ARTIFACT_POLICY.md`
- `core/contracts/handoffs/*.schema.json`
- `core/model-routing/*.yaml`
- `core/orchestration/pipeline.v1.yaml`
- `core/skills/SKILL_REGISTRY.yaml`

### 2. README still references a missing operations doc
Referenced path:
- `docs/operations/CODECANVAS_SETUP.md`

Current status:
- file not found in repo

Impact:
- onboarding/documentation dead end
- weakens trust in repo guidance

Recommended action:
- either add the doc, or remove/replace the README reference with the canonical current setup path

### 3. Pipeline docs still reference a missing templates directory
Referenced path:
- `core/templates/`

Current status:
- directory not found in repo

Impact:
- implies reusable artifacts exist when they do not
- confuses LLM ingestion and human navigation

Recommended action:
- either create `core/templates/` with at least starter artifacts, or update the docs to point at the real contract/template locations

### 4. Source-of-truth is ambiguous between MkDocs and Writerside
Evidence:
- `Writerside/README.md` says Writerside should be treated as the new source of truth
- `scripts/migrate-to-writerside.js` says Writerside is the source of truth
- `ARCHITECTURE_REVISION_PLAN.md` still lists source-of-truth policy as unresolved
- mirrored content still exists under `docs-mk/` and `skills/`

Impact:
- easy for future edits to land in the wrong tree
- high risk of silent divergence

Recommended action:
- explicitly declare canonical authoring paths per content class
- document what is generated, mirrored, or legacy
- add lightweight consistency checks if dual maintenance continues

### 5. Skill packages are partially migrated, not yet normalized
Current state:
- `13-playwright-writer` uses package-style references
- most other skills still rely on `SKILL.md` only
- this night revision adds the same package pattern to `10-repo-intake` and `16-flake-reviewer`

Impact:
- uneven maturity across the skill layer
- harder to predict where to find detailed guidance

Recommended action:
- define a minimal package maturity standard
- migrate highest-leverage skills first (`11`, `12`, `14`, `15`)

## Remediation order
1. Fix or remove broken README/doc references
2. Declare source-of-truth policy in one canonical place
3. Normalize skill packaging expectations
4. Backfill `core/templates/` only if the pipeline truly depends on it
5. Add drift checks for mirrored docs if both doc systems stay active

## Suggested status update for the main architecture plan
The architecture revision plan should distinguish between:
- **completed scaffolds**
- **documentation cleanup still pending**
- **owner decisions still genuinely unresolved**

That will keep the plan honest and easier to execute incrementally.
