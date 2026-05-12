# playwright-writer output patterns

## Expected output
- code changes in the appropriate repo layers
- a short assumptions list when behavior or architecture is ambiguous

## Quality bar
- selectors respect repo policy and stability ranking
- assertions verify meaningful state changes, not empty existence checks
- repeated flows are extracted only when repetition is real
- new code fits existing naming and folder structure

## Anti-patterns
- putting raw selectors directly into specs when the repo forbids it
- adding arbitrary sleeps instead of explicit postconditions
- creating a new helper layer without repo evidence
- hiding business intent inside overly generic helper names
