# Changelog

## 0.2.1 — 2026-11-23

- Renamed the project to Seerr No-Confirm Request: new `@name`, repository (StarlightDaemon/seerr-no-confirm-request), script file name (`seerr-no-confirm-request.user.js`) and update URLs. `@namespace` is unchanged. No behaviour change. Reason: the old name scored lowest in a conflict review against existing tooling (0/10), and its acronym, SQR, 1/10.
- Releases also carry a copy named `seerr-quick-request.user.js` so installs of 0.2.0 and earlier, whose update URL uses the old file name, receive this update.

## 0.2.0 — 2026-11-23

- One-click series: all aired seasons (specials and unaired seasons excluded) when there are 5 or fewer (`CONFIG.tv.maxSeasons`). Larger series, series with no aired seasons, or a failed season lookup open the native season dialog.
- Version guard: one `GET /api/v1/status` per page load; outside `CONFIG.testedVersion` (3.5.x), or if the check fails, the script stands down and shows one notice per session.
- Series 202 ("no seasons available") is shown as already requested or available.
- Probe reports Sonarr defaults, TV quotas, TV permissions and TV override-rule counts.
- Update metadata: `@updateURL`/`@downloadURL` point at the latest GitHub release asset; `@homepageURL`/`@supportURL` added.
- Mock tests: 21 cases covering movies, series, guard and passthrough.

## 0.1.1 — 2026-11-23

- Fix: repeat clicks on an already-requested card stacked one toast per click. Identical toasts now collapse into one with a repeat count (×N), and at most 4 toasts show at once.
- Live check (operator, user 1/admin): one-click request approved; repeat clicks sent no further requests; TV still opens the native season dialog.

## 0.1.0 — 2026-11-23

- First prototype (Approach B: direct same-origin `POST /api/v1/request`).
- One-click movie requests from poster cards; Shift/Ctrl/Alt/Meta-click and non-movie cards fall through to native Seerr.
- In-flight and post-request guards; CSS-only card state; toasts for 201/409/401/403/other.
- CSRF header forwarding when Seerr's CSRF protection is on.
- Targets Seerr v3.5.2 at `http://192.168.1.229:5055`.
- Verified only against a mock DOM (jsdom); live acceptance testing pending.
