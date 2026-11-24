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

Decided 2026-11-23: full rename shipped in 0.2.1 (new name, asset and URLs, @namespace kept, legacy asset name kept on every release). Open: the operator confirms an installed 0.2.0 updates in place to 0.2.1, and the legacy seerr-quick-request.user.js asset can stop shipping once no install uses the old URL.

- Status: open
- Gate: operator
