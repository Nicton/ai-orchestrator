# Skill Review Checklist

Use this before considering a skill package “done enough”.

## Triggerability
- [ ] `SKILL.md` has YAML frontmatter
- [ ] `name` matches the folder name
- [ ] `description` says both what the skill does and when to use it

## Entry-file discipline
- [ ] `SKILL.md` is an entrypoint, not a dump of every rule
- [ ] mission, constraints, and output contract are easy to locate
- [ ] detailed guidance is moved to `references/` when warranted

## Package quality
- [ ] `references/` exists for skills that need workflows or output examples
- [ ] reference filenames are specific and discoverable
- [ ] `SKILL.md` points directly to the references another agent should read
- [ ] there is no duplicate guidance split across multiple places without reason

## Output contract
- [ ] the expected output shape is explicit
- [ ] quality bar / anti-patterns are stated for non-trivial outputs
- [ ] assumptions and gaps are surfaced instead of hidden

## Boundaries
- [ ] the skill says what it should not do when confusion is likely
- [ ] trigger / no-trigger examples exist for reusable or easily-overlapping skills

## Reusability
- [ ] repeated detailed logic is in a reference instead of copied into multiple skills
- [ ] scripts/assets are used only when they genuinely reduce drift or repetition

## Keep it lean
- [ ] no extra vanity docs
- [ ] no bloated prose that repeats what the model already knows
- [ ] package structure earns its complexity
