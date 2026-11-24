# Seerr No-Confirm Request

[![CI](https://github.com/StarlightDaemon/seerr-no-confirm-request/actions/workflows/ci.yml/badge.svg)](https://github.com/StarlightDaemon/seerr-no-confirm-request/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/StarlightDaemon/seerr-no-confirm-request)](https://github.com/StarlightDaemon/seerr-no-confirm-request/releases/latest)
[![License: MIT](https://img.shields.io/github/license/StarlightDaemon/seerr-no-confirm-request)](LICENSE)

A userscript for [Seerr](https://github.com/seerr-team/seerr). Click a poster's **Request** button once and the request goes in, with no confirmation dialog.

- **Movies** are submitted with Seerr's defaults.
- **Series** request all aired seasons when there are 5 or fewer. Bigger shows open the native season dialog.
- **Shift + Click** always opens Seerr's native dialog.
- **Collections** keep their native workflow.
- Seerr still enforces permissions, quotas, approvals and duplicate checks, exactly as for a native request.

**Contents:** [Requirements](#requirements) · [Install](#install) · [Set your Seerr address](#set-your-seerr-address) · [Updates](#updates) · [How it works](#how-it-works) · [Configuration](#configuration) · [Known limitations](#known-limitations) · [Rollback](#rollback) · [Development](#development)

## Requirements

| Item | Value |
|---|---|
| Seerr | 3.5.x, on any address (verified against upstream v3.5.2 source; other versions make the script stand down) |
| Browser | Firefox |
| Userscript manager | [Violentmonkey](https://violentmonkey.github.io/) (the one this is tested with) |
| Permissions | `@grant none`; the page makes no requests outside Seerr (the manager itself checks GitHub for updates) |
| Status | Movies checked live on 0.1.0. Series and the version guard are tested on a mock page only so far (see [Acceptance tests](docs/ACCEPTANCE-TESTS.md)) |

## Install

**Option A: one-click install (gets updates).** Open the link below. Your userscript manager should offer to install it; confirm.

<https://github.com/StarlightDaemon/seerr-no-confirm-request/releases/latest/download/seerr-no-confirm-request.user.js>

**Option B: copy and paste.** Use this if your browser or an add-on (an ad blocker with a userscript feature, for example) treats `.user.js` links as installs and you would rather read the code first.

1. Open the raw script, which your browser shows as plain text: <https://raw.githubusercontent.com/StarlightDaemon/seerr-no-confirm-request/main/seerr-no-confirm-request.user.js>
2. Select all (Ctrl+A) and copy (Ctrl+C).
3. In your userscript manager, create a new script, replace its contents with what you copied, and save.

A pasted copy only updates when you paste a newer one. Delete it before switching to Option A.

## Set your Seerr address

The script does not know where your Seerr lives, so it ships with Seerr's default address, `http://localhost:5055/*`, as a placeholder. Tell your userscript manager your real address once:

1. Open the script's **Settings** in the manager (in Violentmonkey: dashboard, then the script's edit button, then **Settings**).
2. Under **Custom match** (Violentmonkey labels it `Custom @match`), add your address ending in `/*`, for example `http://192.168.1.50:5055/*` or `https://seerr.example.com/*`. Use the exact scheme, host and port you type in the browser.
3. Reload Seerr.

This override is kept across script updates. Do not edit the `@match` line in the script itself, because an update would overwrite it. If the script never seems to run, a wrong Custom match is the usual cause.

## Updates

For Option A installs, the manager checks the latest GitHub release and updates when `@version` increases. To check now, use **Check for updates** in the dashboard. To pin a version, turn off updates for the script in its settings.

## How it works

- **Version guard.** On each full page load, the script makes one `GET /api/v1/status` call. If the version doesn't match `CONFIG.testedVersion` (3.5.x) or can't be read, the script stands down and every click behaves natively. It shows one notice per browser session. This is also what keeps it harmless on a page that isn't Seerr.
- **Interception.** A capture-phase click listener runs before React. It acts only when the click is on the single button that follows a `/movie/{id}` or `/tv/{id}` link inside `[data-testid="title-card"]`. Everything else is left to Seerr: collections, the watchlist and hide buttons, modifier keys, and any unexpected structure.
- **Movies.** It sends `POST /api/v1/request` with `{mediaType:"movie", mediaId, is4k:false}`.
- **Series.** It sends `GET /api/v1/tv/{id}` and counts aired seasons, leaving out specials and empty seasons. This matches the rule the server uses for `"all"`.
  - **Up to `CONFIG.tv.maxSeasons` (5):** it sends `POST /api/v1/request` with `{mediaType:"tv", mediaId, seasons:"all", is4k:false}`. The server skips seasons that are already requested or available.
  - **More than 5, none aired yet, or the lookup fails:** the script re-clicks the button so Seerr's native season dialog opens.
- **Server-side handling.** Requests go out same-origin with your existing login session. Seerr applies the default Radarr or Sonarr, its profile, folder and tags, and any override rules, the same as a native request.
- **CSRF.** If CSRF protection is on, the script copies the `XSRF-TOKEN` cookie into the `X-XSRF-TOKEN` header.
- **Card state.** One CSS rule per title shows *Requesting… / Requested / Pending approval / Already requested*. After a reload, Seerr's own status badge takes over.
- **Toasts.** Identical toasts merge into one with a repeat count, and no more than 4 show at once.

### Responses

| HTTP | Result |
|---|---|
| 201 | Success toast (series show their season count). The card shows *Requested* or *Pending approval*. |
| 202 (series) | Every season is already requested or available. The card shows *Already requested*. |
| 409 | The card shows *Already requested*. |
| 401 | "Session expired" toast. The button is restored. |
| 403 | Seerr's message is shown (quota, permission or blocklist). The button is restored. |
| other or network error | Error toast. The button is restored, and you can click to retry or Shift + Click for native. |

The script never reports success unless it gets a 201 with a request body back.

## Configuration

Behaviour settings are in the `CONFIG` block at the top of the script: `testedVersion`, `tv.enabled`, `tv.maxSeasons` and `debug`. Editing the script is overwritten by an update, so re-apply your changes afterwards, or turn off updates for the script. The Seerr address is **not** set here; see [Set your Seerr address](#set-your-seerr-address).

Set `CONFIG.debug = true` to log decisions and HTTP status codes to the browser console. Cookies, headers and tokens are never logged.

## Known limitations

- Only poster cards are covered. The Request button on a movie or series detail page is unchanged and still uses the native dialog.
- The card's *Requested* label lasts until a full page reload. If you cancel a request elsewhere in the same session, reload to see the Request button again.
- A series click makes one extra lookup to count seasons.
- Seasons that air later are picked up or not according to Sonarr's **Monitor New Seasons** setting, as with native requests.
- The script's toasts are its own (bottom-right), not Seerr's.
- The selectors depend on the v3.5.2 `TitleCard` structure. If an upgrade changes it, the script stops intercepting and Seerr behaves natively. It does not fail toward wrong requests.
- Seerr upgrades outside 3.5.x pause the script until `testedVersion` is widened after re-verification.

## Rollback

In your userscript manager, disable or delete **Seerr No-Confirm Request**, then reload Seerr. Requests that were already submitted remain, and are handled by Seerr and Radarr as usual.

## Development

- **Tests:** `npm ci && npm test` runs the mock-DOM suite against a mock v3.5.2 card structure. CI runs it on every push.
- **Acceptance tests:** [docs/ACCEPTANCE-TESTS.md](docs/ACCEPTANCE-TESTS.md) lists the manual checks to run against a live Seerr. [docs/LOOP-001-live-test-checklist.md](docs/LOOP-001-live-test-checklist.md) is a guided run of the ones not yet verified live.
- **Probe:** `tools/probe.js` is a read-only console snippet. Paste it into the browser console on your Seerr while logged in as an admin. It reports version, CSRF setting, quotas, Radarr and Sonarr defaults, override-rule counts and user permissions, and prints no API keys.
- **Upgrading for a new Seerr version.** After a Seerr upgrade outside 3.5.x the script pauses itself. To re-enable it:
  1. Diff these files against v3.5.2: `src/components/TitleCard/index.tsx`, `server/routes/request.ts`, `server/entity/MediaRequest.ts` and `server/models/Tv.ts`.
  2. Run the mock tests.
  3. Widen `testedVersion` and bump the script version.
  4. Run acceptance tests 1, 6, 7 and 8.
- **Releases:** attach only `seerr-no-confirm-request.user.js` (the file name the update links point to). Keep the version in the script, `package.json` and `CHANGELOG.md` identical; CI checks this.

See [CHANGELOG.md](CHANGELOG.md) for release notes. Licensed under the [MIT License](LICENSE).
