# assertion-injector output patterns

## Expected output
- updated code with stronger post-action assertions
- minimal notes about why each added oracle is meaningful when the choice is non-obvious

## Quality bar
- assertions should verify state change, not just continued page existence
- oracles should match the user-facing outcome of the action
- added checks should improve diagnosis rather than create brittle noise

## Anti-patterns
- asserting the same thing after every action regardless of meaning
- replacing domain assertions with only `toBeVisible()` on the clicked control
- using network idle as a default oracle when a UI-specific outcome exists
