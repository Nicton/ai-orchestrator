# Skill Package Standard

## Goal
Keep skills lean, triggerable, and easy to evolve without turning the repo into a pile of one-off markdown files.

## Standard package shape

```text
skills/<skill-name>/
  SKILL.md
  references/        # optional, preferred for detailed guidance
  scripts/           # optional, deterministic helpers
  assets/            # optional, templates/examples not meant for prompt loading
```

## `SKILL.md` rules

### Frontmatter
Every skill must start with YAML frontmatter:

```yaml
---
name: skill-name
description: What the skill does and when to use it.
---
```

Rules:
- Use only `name` and `description`.
- Match `name` to the folder name.
- Put trigger guidance in `description`, not in a separate “when to use” section.
- Keep descriptions explicit enough that another agent can route to the skill correctly.

### Body
Keep the body lean. It should cover:
- mission / contract
- essential rules and boundaries
- navigation to bundled references

Prefer the entry file to answer:
- what this skill is for
- what it must not do
- what it should return
- which reference file to read next

## `references/` rules
Use references when details would otherwise bloat `SKILL.md`.

Preferred baseline files for non-trivial skills:
- `references/workflows.md`
- `references/output-patterns.md`

Add more only when they earn their keep.

Good candidates for references:
- workflow steps
- anti-patterns
- output contracts and quality bars
- trigger / no-trigger examples
- domain heuristics

Avoid moving core identity/mission out of `SKILL.md`.

## `scripts/` rules
Add scripts only when the task benefits from deterministic repeatability.

Good candidates:
- packaging helpers
- transformations that are repeatedly rewritten
- validation or extraction helpers

Do not add scripts just because a skill exists.

## `assets/` rules
Use `assets/` for templates or examples that should be copied/used, not loaded as prompt context.

## Progressive disclosure policy
Use the smallest layer that solves the problem:
1. frontmatter for triggerability
2. `SKILL.md` body for core instructions
3. `references/` for detailed guidance
4. `scripts/` and `assets/` for reusable operational support

## Packaging posture for this repo
- Thin role skills may stay thin if that is intentional.
- High-leverage implementation skills should move toward package form.
- Prefer fewer, reusable reference files over large monolithic entry prompts.
