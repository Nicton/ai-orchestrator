# BOOK_NOTES_MATRIX (work in progress)

| Book | Domain | Key usable points | Primary roles |
|---|---|---|---|
| Practical Guide to Testing Object-Oriented Software (Binder) | QA architecture | Model-first testing; contract/state/invariant checks; interaction-focused testing; risk-based prioritization | QA Architect, Automation, Critic, Analyst |
| The Art of Software Testing | QA fundamentals | Defect-oriented mindset; high-value test design principles; negative-path rigor | Manual, Automation, Critic |
| Agile Testing | Agile QA process | Team-wide quality ownership; acceptance-level collaboration; test strategy in iterative delivery | Manager, Analyst, QA Architect |
| A Practitioner’s Guide to Software Test Design | Test design | Equivalence classes, boundaries, decision-focused test selection | QA Architect, Manual, Automation |
| Effective TypeScript / Exploring TypeScript | Type safety | Avoid implicit any, strengthen domain types, safer refactoring | Automation, Programmer |
| You Don’t Know JS Yet / Eloquent JavaScript | JS core | Correct mental model of language behavior to reduce subtle bugs | Automation, Programmer |
| Learning SQL / SQL Antipatterns | Data layer | Query correctness, schema-aware validation, performance traps to avoid | Programmer, Analyst, QA Architect |
| Clean Code / Clean Architecture / Refactoring / Code Complete | Engineering quality | Maintainability, boundaries, disciplined refactoring, readability standards | Programmer, Manager, Critic |

> Next pass: each row gets chapter-level notes and concrete "Must/Should" rules per role.

## Wave 1 extraction status (new)
- Binder (Testing pillar) → extracted into Wave1 QA + Programmer packages.
- Myers/Copeland/Crispin&Gregory → principles absorbed into:
  - risk-based design, negative-path rigor,
  - test-case design compression (dedup/merge),
  - team-wide quality gates and traceability.
- Next: expand per-book notes into role-ready rules for **Manager/Analyst/Automation/Critic/Tagger**.
