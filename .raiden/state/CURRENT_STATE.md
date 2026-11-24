# Current State

## What This Repo Is

Seerr No-Confirm Request (formerly Seerr Quick Request): a Violentmonkey userscript (`seerr-no-confirm-request.user.js`) that adds one-click movie and series requests to Seerr. Scope is limited to that one feature.

## Status

- Version: 0.3.0, released as v0.3.0 (latest) on 2026-11-23; `main` also carries README-only changes after it.
- Target: Seerr 3.5.x on any address. No origin is hard-coded: `@match` is the placeholder `http://localhost:5055/*` and each user sets their server under Custom match in their userscript manager.
- Release channel: GitHub releases (repository StarlightDaemon/seerr-no-confirm-request). `@updateURL` and `@downloadURL` point at the `latest` release asset `seerr-no-confirm-request.user.js`. Published releases are v0.3.0 and v0.2.2 (the v0.2.0 and v0.2.1 releases were deleted; their git tags remain). Releases attach only `seerr-no-confirm-request.user.js`.
- Tests: mock-DOM suite, 21 cases, run by `npm test` and by CI.
- Live acceptance: movie one-click verified by the operator on 0.1.0 (admin account), including no duplicate on repeat clicks and the native TV dialog preserved. On 2026-11-24 the operator ran the LOOP-001 live checklist and reported the tool works as expected (per-test results not itemised), which closes LOOP-001. Only LOOP-003 (Seerr past 3.5.x, upstream) remains open.