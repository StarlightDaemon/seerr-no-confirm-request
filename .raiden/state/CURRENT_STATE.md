# Current State

## What This Repo Is

Seerr Quick Request: a Violentmonkey userscript (`seerr-quick-request.user.js`) that adds one-click movie and series requests to Seerr. Scope is limited to that one feature.

## Status

- Version: 0.2.0
- Target: Seerr 3.5.x at http://192.168.1.229:5055 (the origin is configuration, not a secret)
- Release channel: GitHub releases. `@updateURL` and `@downloadURL` point at the `latest` release asset `seerr-quick-request.user.js`.
- Tests: mock-DOM suite, 21 cases, run by `npm test` and by CI.
- Live acceptance: movie one-click verified by the operator on 0.1.0 (admin account), including no duplicate on repeat clicks and the native TV dialog preserved. Series one-click and the version guard are verified against the mock DOM only. Operator live acceptance is pending.