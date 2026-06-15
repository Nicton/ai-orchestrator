# repo-intake output patterns

## Expected output shape

```json
{
  "architecture_summary": "...",
  "existing_patterns": ["..."],
  "anti_patterns": ["..."],
  "recommended_entrypoints": ["path/to/file"],
  "assumptions": ["..."]
}
```

## Quality bar
- `architecture_summary` should mention actual layers and where they live
- `existing_patterns` should be evidence-backed
- `anti_patterns` should be concrete, not generic style advice
- `recommended_entrypoints` should be real files a follow-up agent can open next

## Good recommendation examples
- `projects/datamola/e2e/src/fixtures/app.fixture.ts` — authenticated app entrypoint for product tests
- `projects/datamola/e2e/src/services/MattersService.ts` — reusable business-slice service for matters scenarios

## Anti-patterns
- “Use a POM pattern” when the repo already has pages + flows + services
- “Create helpers” without pointing to the repetition that justifies them
- returning framework folklore instead of repo evidence
