# refactor-to-shared-helper output patterns

## Expected output
- proposed helper or service API
- refactor diff or change plan grounded in real repetition

## Quality bar
- helper names should reflect user or business intent
- extracted code should still show where verification happens
- the abstraction should remove duplication without obscuring failure diagnosis

## Anti-patterns
- `commonHelper` style utility dumping grounds
- moving assertions so far away that failures become opaque
- extracting thin wrappers around single Playwright calls with no semantic value
