# Skill System Audit (Night Review)

## Why this review exists

The current repository already has a useful skill taxonomy, but many skills are still shaped like **single markdown instructions** rather than richer skill packages. That is enough for early orchestration, but weak for long-term reliability, provider portability, and reuse.

This review was updated after comparing the repository’s current skill format with:
- external guidance on building richer Claude/agent skills,
- the user-provided `ai-engineering-skills` repository,
- especially the `flutter-cleanup-assessor` example.

## Main conclusion

A robust skill is usually **not just one short prompt file**. The stronger pattern is:

- `SKILL.md` for mission + workflow + routing/navigation
- `references/*` for domain-specific guidance, checklists, patterns, anti-patterns, output formats
- `scripts/*` for deterministic or repeated operations
- `assets/*` for templates/examples that should not bloat the main prompt

This matches the direction already suggested by the local `skill-creator` guidance: keep the entry file lean, but provide progressive disclosure through references and reusable resources.

## What the external example demonstrates well

The `flutter-cleanup-assessor` example is strong because it does **all** of the following:

1. Defines a clear boundary:
   - cleanup/refactor skill,
   - not a feature-generation skill.
2. Provides a real workflow:
   - establish baseline,
   - inventory architecture,
   - detect smells,
   - choose target shape,
   - refactor in safe batches,
   - validate and summarize.
3. Uses reference packs by concern:
   - architecture,
   - maintainability,
   - state management,
   - testing,
   - performance,
   - tooling.
4. Defines a strong output contract:
   - smells,
   - risks,
   - target architecture,
   - plan,
   - file-level changes,
   - verification,
   - deferred work.
5. Includes troubleshooting and trigger examples.

That is much more operational than “here is a short markdown and vibes”.

## Gap in the current repository

Many current skills still look like this:
- mission
- inputs
- outputs
- a few rules

That is useful, but incomplete.

What is often still missing:
- explicit workflow steps,
- references split by concern,
- anti-pattern lists,
- troubleshooting,
- output patterns/examples,
- scripts for repeatable operations,
- trigger/no-trigger examples,
- stronger progressive disclosure.

## What improved during this night revision

### Already implemented
- `13-playwright-writer` now has a package-style `references/` folder with workflow and output guidance.
- `10-repo-intake` gained package-style references for workflow and output patterns.
- `16-flake-reviewer` gained package-style references for workflow and output patterns.
- The direction is now validated by real repo changes, not just audit theory.

### Why those first picks make sense
- `13-playwright-writer` is high leverage because it drives production code changes.
- `10-repo-intake` is the foundation skill that prevents architecture drift.
- `16-flake-reviewer` benefits from evidence-driven and anti-pattern-heavy guidance that should not bloat the entry file.

## What to improve in this repository’s skill system

### 1. Keep `SKILL.md` as the entrypoint, but stop treating it as the whole skill
Each important skill should evolve toward:

```text
skills/<skill>/
  SKILL.md
  references/
    workflows.md
    output-patterns.md
    anti-patterns.md
    examples.md
  scripts/
    ... optional deterministic helpers ...
  assets/
    ... optional templates/examples ...
```

### 2. Move detailed guidance out of the entry file
`SKILL.md` should stay lean and answer:
- what this skill does,
- what it must not do,
- how to navigate the rest of the pack,
- which references to read for which situation.

### 3. Add stronger output contracts
Skills should define not only “what to do”, but “what shape to return”.
This is especially important for:
- repo-intake,
- traceability,
- test splitting,
- playwright writing,
- flake review,
- critic review.

### 4. Add concern-specific references
For example, `13-playwright-writer` should eventually have references for:
- abstraction layers,
- wait policy,
- locator policy,
- postcondition rules,
- spec readability,
- anti-patterns.

### 5. Add trigger examples
Each skill should clarify:
- should trigger for …
- should not trigger for …

This reduces accidental overreach.

## Next migration candidates (ordered)

### High priority
1. `11-test-traceability-mapper`
   - needs richer output contract examples
   - benefits from domain mapping heuristics and gap patterns
2. `12-test-case-splitter`
   - needs splitting heuristics, duplication rules, and edge-case policy
3. `14-assertion-injector`
   - needs assertion placement rules and anti-pattern catalog
4. `15-refactor-to-shared-helper`
   - needs thresholds for extraction, helper-shape examples, and black-box anti-patterns

### Medium priority
5. `21-locator-ranker`
6. `24-postcondition-verifier`
7. `25-failure-classifier`
8. `27-sequence-debugger`

### Lower priority for packaging, but still worth eventual hardening
9. role skills `00`–`06`
10. execution micro-skills `22`, `23`, `26` once the surrounding tool-contract layer stabilizes

## Recommended direction for this repository

### Short term
- strengthen key `SKILL.md` files,
- add references folders for the most important skills,
- codify output patterns and anti-patterns.

### Medium term
- add deterministic helper scripts where repeated logic appears,
- standardize references like `workflows.md` and `output-patterns.md` across key skills,
- align skill registry maturity with skill packaging maturity.

### Long term
- make the skill layer closer to a real agent operating system and less like a folder of short prompts.

## Strategic takeaway

The repository’s current skill system is a good conceptual skeleton.
The next maturity jump is not “write slightly better markdown”.
It is:

- package skills more richly,
- disclose details progressively,
- separate workflow from references,
- separate guidance from deterministic execution,
- make outputs and failure modes explicit.
