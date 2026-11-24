# Current State

## What This Repo Is

Seerr No-Confirm Request (formerly Seerr Quick Request): a Violentmonkey userscript (`seerr-no-confirm-request.user.js`) that adds one-click movie and series requests to Seerr. Scope is limited to that one feature.

## Status

- Version: 0.2.2
- Target: Seerr 3.5.x at http://192.168.1.229:5055 (the origin is configuration, not a secret)
- Release channel: GitHub releases (repository StarlightDaemon/seerr-no-confirm-request). `@updateURL` and `@downloadURL` point at the `latest` release asset `seerr-no-confirm-request.user.js`. Only v0.2.2 is published as a release (v0.2.0 and v0.2.1 releases were deleted 2026-11-23; their git tags remain). The legacy asset name `seerr-quick-request.user.js` is no longer attached, so installs from 0.2.0 or earlier no longer update and must be reinstalled from the new URL.
- Tests: mock-DOM suite, 21 cases, run by `npm test` and by CI.
- Live acceptance: movie one-click verified by the operator on 0.1.0 (admin account), including no duplicate on repeat clicks and the native TV dialog preserved. Series one-click and the version guard are verified against the mock DOM only. Operator live acceptance is pending.