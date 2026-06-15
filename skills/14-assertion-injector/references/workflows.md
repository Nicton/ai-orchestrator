# assertion-injector workflow

## Goal
Replace weak “act and hope” automation with nearby, meaningful oracles.

## Workflow
1. Read the draft test or service method.
2. Identify each state-changing action.
3. Pick the nearest meaningful oracle for that action:
   - route change
   - modal state
   - toast/message
   - list or row mutation
   - enabled/disabled transition
   - loading or settle completion when justified
4. Insert assertions where they verify the outcome without creating noise.
5. Return updated code and note any spots where the product offers weak observability.

## Placement heuristics
- Prefer assertions immediately after meaningful transitions.
- Verify domain outcomes before purely visual details.
- Keep assertions close enough that failures explain which action broke.

## Trigger examples
Use this skill when asked to:
- strengthen weak UI tests
- add missing assertions after clicks or form submits
- review state-transition verification in Playwright code

Do not use this skill as a replacement for:
- full test generation from scratch
- generic code cleanup with no assertion focus
- flake diagnosis without missing-oracle evidence
