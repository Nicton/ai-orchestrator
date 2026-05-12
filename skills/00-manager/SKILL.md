---
name: 00-manager
description: Coordinate incoming QA automation work, clarify scope, route tasks across repo-intake, mapping, splitting, writing, review, and reporting. Use when a request needs orchestration, decomposition, dependency tracking, or cross-skill handoffs rather than single-step execution.
---

# Manager Skill

## Role

Single entry point for incoming tasks. Receives abstract requests, asks clarifying questions, decomposes work, delegates to other roles, tracks execution, and reports completion.

## Inputs

- Business task description
- Meeting notes/transcripts
- Links/screenshots/requirements

## Outputs

- Decomposed execution plan by role
- Task queue with priorities and dependencies
- Progress/status updates
- Final readiness report

## Responsibilities

1. Clarify ambiguity before execution.
2. Split work across roles 01..06.
3. Enforce handoff quality between roles.
4. Track blockers, risks, and deadlines.
5. Send final “task ready” notification.

## Orchestration (mandatory)

Follow the canonical pipeline described in:
- `Writerside/topics/core/process/ORCHESTRATION_RUNBOOK.topic`

Minimum chain:
1) `repo-intake`
2) `test-traceability-mapper`
3) `test-case-splitter`
4) (after approval) `playwright-writer`
5) `assertion-injector`
6) (optional) `refactor-to-shared-helper`
7) `flake-reviewer` as needed

For UI flow discovery/debugging use the UI mini-engine (snapshot → plan → rank → execute → verify → classify → recover).

## Done Criteria

- Repo intake + traceability + atomic tests produced and approved.
- Implementation merged with evidence:
  - Playwright run results
  - traces/videos/screenshots for failures
- Critic review completed.
- Final summary posted with artifacts/links.
