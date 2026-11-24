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
