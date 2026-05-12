# Skill System Implementation Matrix

## Purpose
Turn the audit into a working migration plan: recommendation → current status → gap → next action.

## Status legend
- **done** — implemented in repo now
- **partial** — some pieces exist, but the skill/package is still thin
- **todo** — not implemented yet

| Recommendation | Current status | Gap | Next action |
|---|---|---|---|
| Treat `SKILL.md` as entrypoint, not full package | **partial** | Most skills are still single-file prompts | Keep `SKILL.md` lean and route to `references/` for high-value skills first |
| Require YAML frontmatter with `name` + `description` | **todo** before this pass | Existing skills lacked machine-friendly trigger metadata | Add frontmatter to all skills and align names to folder names |
| Strengthen trigger guidance in descriptions | **todo** before this pass | Triggering logic lived mostly in body text or not at all | Encode what the skill does and when to use it directly in frontmatter descriptions |
| Standardize package shape (`SKILL.md`, `references/`, optional `scripts/`, `assets/`) | **partial** | Only some skills have `references/`; no repo-level standard doc | Add a concise repo standard and validation script |
| Reduce single-markdown drift | **partial** | Skills `11`–`15` were still single-file despite being high-value orchestration skills | Add package-style `references/` and convert `SKILL.md` to navigation + contract |
| Add stronger output contracts | **partial** | Some skills have JSON examples, but output quality bar and anti-patterns are missing | Add `references/output-patterns.md` for high-priority skills |
| Add workflow guidance separate from the entry file | **partial** | Only `10` and `16` have dedicated workflow references | Add `references/workflows.md` for `11`–`15` |
| Add trigger / no-trigger examples | **partial** | Present only in a few packaged skills | Add concise trigger boundaries inside workflow references |
| Add validation for skill packages | **todo** before this pass | No automated check for frontmatter, folder/name alignment, or broken reference paths | Add `scripts/validate-skills.py` and wire it into `package.json` |
| Add a lightweight review checklist | **todo** before this pass | Review expectations were implicit and easy to drift from | Add a reusable checklist focused on progressive disclosure and output contracts |
| Add deterministic helpers/scripts where justified | **todo** | No repo-level helper scripts for skill packages yet | Defer until repeated deterministic tasks appear across skill maintenance |
| Align registry maturity with package maturity | **partial** | Skill index exists, but package health is not visible from a single place | Use the matrix and validator now; extend indexes later if needed |

## Skill-by-skill migration view

| Skill | Current state | Gap | Next action |
|---|---|---|---|
| `00-manager` | partial | Still mostly role prose; missing frontmatter before this pass | Add frontmatter now; package later if orchestration guidance grows |
| `01-analyst` | partial | Thin role brief; no package refs | Add frontmatter now; defer packaging until analyst workflow stabilizes |
| `02-qa-architect` | partial | Thin role brief; no package refs | Add frontmatter now; package later with strategy/checklist references |
| `03-frontend-tagger` | partial | Thin role brief; no package refs | Add frontmatter now; package later if selector/tagging policies expand |
| `04-manual-tester` | partial | Thin role brief; no package refs | Add frontmatter now; package later with evidence and case-writing refs |
| `05-automation` | partial | Thin role brief; overlaps with more specific implementation skills | Add frontmatter now; keep as coordinating role |
| `06-critic` | partial | Thin role brief; no structured review outputs | Add frontmatter now; package later with review checklist refs |
| `10-repo-intake` | done | Already package-style | Keep as reference pattern |
| `11-test-traceability-mapper` | partial | Missing richer workflow, gap heuristics, output quality bar | Package now with workflow + output references |
| `12-test-case-splitter` | partial | Missing atomicity heuristics, overlap/extraction policy, anti-patterns | Package now with workflow + output references |
| `13-playwright-writer` | partial | Audit says it has refs, but repo copy still lacks them | Add package-style refs now and tighten entry file |
| `14-assertion-injector` | partial | Missing oracle placement rules, anti-patterns, output quality bar | Package now with workflow + output references |
| `15-refactor-to-shared-helper` | partial | Missing extraction thresholds, helper-shape examples, anti-patterns | Package now with workflow + output references |
| `16-flake-reviewer` | done | Already package-style | Keep as reference pattern |
| `20-ui-state-snapshot` | partial | Good contract, but still single-file | Leave for later; current value is acceptable |
| `21-locator-ranker` | partial | Missing scoring heuristics and tie-break policy | Medium-priority package candidate |
| `22-action-planner` | partial | Missing schema examples and recovery heuristics | Lower-priority until tool-contract layer stabilizes |
| `23-smart-click-executor` | partial | Missing troubleshooting / fallback boundaries | Lower-priority until surrounding mini-engine stabilizes |
| `24-postcondition-verifier` | partial | Missing oracle selection heuristics | Medium-priority package candidate |
| `25-failure-classifier` | partial | Missing local taxonomy usage patterns | Medium-priority package candidate |
| `26-recovery-strategy` | partial | Missing decision policy for attempt ordering | Lower-priority until execution layer stabilizes |
| `27-sequence-debugger` | partial | Missing flow-analysis patterns and output examples | Medium-priority package candidate |

## Migration order after this pass
1. Finish repo-wide standards and validation.
2. Package `11`–`15`.
3. Package medium-priority UI mini-engine skills: `21`, `24`, `25`, `27`.
4. Revisit role skills `00`–`06` only if they need richer references rather than staying intentionally thin.
