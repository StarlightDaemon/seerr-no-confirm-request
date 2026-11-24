# Open Loops

## LOOP-001 - Operator live acceptance tests

Run README acceptance tests 6, 7, 8 and 10-16 on 0.2.0 against the live Seerr. Series one-click and the version guard have only been verified against the mock DOM.

- Status: open
- Gate: operator

## LOOP-002 - Branch protection decision

Decide whether `main` gets branch protection or a ruleset. Not configured; repository settings were left at defaults on creation.

- Status: open
- Gate: operator

## LOOP-003 - Re-verify when Seerr leaves 3.5.x

Re-verify the selectors and API contract and widen `CONFIG.testedVersion` when Seerr moves past 3.5.x. Until then the script stands down on other versions.

- Status: open
- Gate: upstream