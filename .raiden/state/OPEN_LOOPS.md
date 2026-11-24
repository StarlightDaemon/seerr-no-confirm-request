# Open Loops

## LOOP-001 - Operator live acceptance tests

Run README acceptance tests 6, 7, 8 and 10-16 on the current release (0.2.2) against the live Seerr. Step-by-step checklist: `docs/LOOP-001-live-test-checklist.md`. Series one-click and the version guard have only been verified against the mock DOM.

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

## LOOP-004 - Userscript rename and update channel

Decided 2026-11-23: full rename shipped in 0.2.1 (new name, asset and URLs, @namespace kept). Closed 2026-11-23 by operator decision: the legacy seerr-quick-request.user.js asset was removed from v0.2.2 and the v0.2.0 and v0.2.1 releases were deleted, so the in-place update path from 0.2.0 no longer exists. Any old install must be deleted and reinstalled from the new URL.

- Status: closed
- Gate: operator
