# Open Loops

## LOOP-001 - Operator live acceptance tests

Run README acceptance tests 6, 7, 8 and 10-16 on the current release against the live Seerr, with Custom match set to the server address. Step-by-step checklist: `docs/LOOP-001-live-test-checklist.md`.

Closed 2026-11-24: the operator ran the live checklist and reported that the tool works as expected. Per-test results were not itemised.

- Status: closed
- Gate: operator

## LOOP-002 - Branch protection decision

Decided 2026-11-23: no branch protection or ruleset. The operator is the only collaborator, there are no forks, and outside contributors cannot push to `main` without write access (a pull request would need the operator to merge it). Revisit if collaborators are added.

- Status: closed
- Gate: operator

## LOOP-003 - Re-verify when Seerr leaves 3.5.x

Re-verify the selectors and API contract and widen `CONFIG.testedVersion` when Seerr moves past 3.5.x. Until then the script stands down on other versions.

- Status: open
- Gate: upstream

## LOOP-004 - Userscript rename and update channel

Decided 2026-11-23: full rename shipped in 0.2.1 (new name, asset and URLs, @namespace kept). Closed 2026-11-23 by operator decision: the legacy seerr-quick-request.user.js asset was removed from v0.2.2 and the v0.2.0 and v0.2.1 releases were deleted, so the in-place update path from 0.2.0 no longer exists. Any old install must be deleted and reinstalled from the new URL.

- Status: closed
- Gate: operator
