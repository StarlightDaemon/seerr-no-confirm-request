# Decisions

## 2026-11-23 - Direct same-origin POST to /api/v1/request (Approach B)

Chosen over auto-confirming the native dialog. AdvancedRequester loads defaults and override rules asynchronously with no observable readiness signal, so auto-confirm could submit stale overrides. Server-side resolution avoids that.

## 2026-11-23 - Card state via per-title CSS rules

Card state is shown with per-title CSS rules rather than React internals.

## 2026-11-23 - Series one-click limited to 5 aired seasons or fewer

Above that, on a lookup failure, or with no aired seasons, the native dialog opens.

## 2026-11-23 - Version guard

The script stands down outside Seerr 3.5.x.

## 2026-11-23 - Auto-update channel

Auto-update uses the latest-release asset.

## 2026-11-23 - Public repository, MIT license

## 2026-11-23 - Scope

Scope is limited to the one-click request feature (operator direction).

## 2026-11-23 - Rename to Seerr No-Confirm Request

The project is renamed Seerr No-Confirm Request (operator direction). GitHub repository is now StarlightDaemon/seerr-no-confirm-request (GitHub redirects the old URLs), the workspace is E:\SNCR and the checkout is E:\SNCR\development\seerr-no-confirm-request-source. The userscript's own name, namespace, file name and update URLs still use the old name in v0.2.0; changing them affects Violentmonkey update continuity and is held for a separate decision (see OPEN_LOOPS).

## 2026-11-23 - Userscript renamed in 0.2.1

New @name, file name and update URLs. @namespace is unchanged. Releases keep a second asset named seerr-quick-request.user.js (identical bytes) because 0.2.0 installs ask for that name. Internal DOM ids and the sessionStorage key still used seerr-quick-request in 0.2.1; 0.2.2 renamed them to seerr-no-confirm-request (the tests assert the new ids).

## 2026-11-23 - Legacy asset and old releases retired

Operator direction: delete the v0.2.0 and v0.2.1 GitHub releases and remove the legacy `seerr-quick-request.user.js` asset from v0.2.2. Git tags v0.2.0 to v0.2.2 are kept. Consequence: an install from 0.2.0 or earlier stops receiving updates (its update URL now returns 404) and must be reinstalled from the new URL. Releases from now on attach only `seerr-no-confirm-request.user.js`.

## 2026-11-23 - No hard-coded origin (0.3.0)

Removed `CONFIG.origin` and the origin check. `@match` ships as the placeholder `http://localhost:5055/*` (Seerr's default port) and users set their own address with the userscript manager's Custom match override, which survives updates (edits to the script do not). A broad `@match` was rejected: it would run on every site and call `/api/v1/status` on each. The `/api/v1/status` version guard remains the check that the page really is a supported Seerr. Old Git history still contains the author's private LAN address; history was not rewritten.

## 2026-11-23 - Naming rationale

The name Seerr Quick Request scored lowest in a conflict review against existing tooling (0/10), and its acronym, SQR, 1/10. Seerr No-Confirm Request is the current top choice. It also says what the script does: it removes the confirmation dialog.
