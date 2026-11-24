# Seerr No-Confirm Request

A Violentmonkey userscript for Firefox. You click a poster's existing **Request** button once, and the request goes in without the confirmation dialog.

- **Movies:** submitted with Seerr's defaults.
- **Series:** all aired seasons are requested when there are 5 or fewer. Bigger shows open the native season dialog.
- **Shift + Click** always opens Seerr's native dialog.
- **Collections** keep their native workflow.
- **Status:** 0.2.2. Movies were checked live on 0.1.0; series and the version guard are tested on the mock only so far.

## Compatibility

| Item | Value |
|---|---|
| Seerr | 3.5.x (verified against upstream v3.5.2 source; other versions make the script stand down) |
| Origin | `http://192.168.1.229:5055` (hard-coded in `@match` and `CONFIG.origin`) |
| Browser | Firefox with Violentmonkey |
| Permissions | `@grant none`; the page makes no requests outside Seerr (Violentmonkey itself checks GitHub for updates) |

## Install

1. Install Violentmonkey in Firefox. If you installed the old **Seerr Quick Request** (0.2.0 or earlier), delete it in Violentmonkey first: the name changed, so a fresh install from the new URL may otherwise appear as a second script.
2. Open <https://github.com/StarlightDaemon/seerr-no-confirm-request/releases/latest/download/seerr-no-confirm-request.user.js>. Violentmonkey offers to install it; confirm.
3. Reload Seerr.

If you previously pasted the script in by hand, delete that copy first. Only an install from the release URL picks up updates.

### Updates

Violentmonkey checks the latest GitHub release and updates when `@version` increases. To check now, open the dashboard and choose **Check for updates**. To pin a version, turn off updates for the script in its settings.

## How it works

- **Version guard.** On each full page load, the script makes one `GET /api/v1/status` call. If the version doesn't match `CONFIG.testedVersion` (3.5.x) or can't be read, the script stands down and every click behaves natively. It shows one notice per browser session.
- **Interception.** A capture-phase click listener runs before React. It acts only when the click is on the single button that follows a `/movie/{id}` or `/tv/{id}` link inside `[data-testid="title-card"]`. Everything else is left to Seerr: collections, the watchlist and hide buttons, modifier keys, and any unexpected structure.
- **Movies.** It sends `POST /api/v1/request` with `{mediaType:"movie", mediaId, is4k:false}`.
- **Series.** It sends `GET /api/v1/tv/{id}` and counts aired seasons, leaving out specials and empty seasons. This matches the rule the server uses for `"all"`.
  - **Up to `CONFIG.tv.maxSeasons` (5):** it sends `POST /api/v1/request` with `{mediaType:"tv", mediaId, seasons:"all", is4k:false}`. The server skips seasons that are already requested or available.
  - **More than 5, none aired yet, or the lookup fails:** the script re-clicks the button so Seerr's native season dialog opens.
- **Server-side handling.** Requests go out same-origin with your existing login session. Seerr applies the default Radarr or Sonarr, its profile, folder and tags, and any override rules, the same as a native request. Quotas, permissions, approvals and duplicate checks stay enforced on the server.
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

Settings are in the `CONFIG` block at the top of the script: `origin`, `testedVersion`, `tv.enabled`, `tv.maxSeasons` and `debug`. If you change `origin`, change the `@match` line to the same value.

## Acceptance tests (operator-run)

| # | Test | Expected result |
|---|---|---|
| 1 | Click Request on an unrequested movie | One request in Requests, routed to the default Radarr |
| 2 | Click 5× fast | Exactly one request; one toast with a count |
| 3 | Hover the same card again | Button reads *Requested*; clicking sends nothing |
| 4 | Movie already requested by another user | No duplicate; *Already requested* |
| 5 | Available movie or series | No Request button, as natively |
| 6 | Series with ≤5 aired seasons | One request covering all aired seasons, sent to the default Sonarr |
| 7 | Series with >5 aired seasons | Native season dialog opens; nothing sent |
| 8 | Shift + Click on a movie, then a series | Native dialogs |
| 9 | Collection card | Native collection dialog |
| 10 | Log out in another tab, then click | "Session expired"; nothing claimed |
| 11 | Non-auto-approve user | *Pending approval*; request waits for approval |
| 12 | Discover, search, and genre pages after client-side navigation | Works on all of them |
| 13 | Reload after requesting | Seerr's native status badge shows |
| 14 | Radarr / Sonarr | Title added with the configured profiles (Radarr's trickle-down sizing intact) |
| 15 | Set `testedVersion` to a non-matching value, then reload | "Paused" notice; native two-step behaviour |
| 16 | Script disabled, then reload | Native two-step behaviour returns |

## Known limitations

- Only poster cards are covered. The Request button on a movie or series detail page is unchanged and still uses the native dialog.
- The card's *Requested* label lasts until a full page reload. If you cancel a request elsewhere in the same session, reload to see the Request button again.
- A series click makes one extra lookup to count seasons.
- Seasons that air later are picked up or not according to Sonarr's **Monitor New Seasons** setting, as with native requests.
- The script's toasts are its own (bottom-right), not Seerr's.
- The selectors depend on the v3.5.2 `TitleCard` structure. If an upgrade changes it, the script stops intercepting and Seerr behaves natively. It does not fail toward wrong requests.
- Seerr upgrades outside 3.5.x pause the script until `testedVersion` is widened after re-verification.

## Diagnostics

Set `CONFIG.debug = true` to log decisions and HTTP status codes to the console. Cookies, headers and tokens are never logged.

`tools/probe.js` is a read-only console snippet. It reports version, CSRF setting, quotas, Radarr and Sonarr defaults, override-rule counts and user permissions, and prints no API keys.

`test/mock-dom.test.js` checks the script against a mock v3.5.2 card structure:
`npm i jsdom && node test/mock-dom.test.js seerr-no-confirm-request.user.js`

## Upgrading Seerr

After a Seerr upgrade outside 3.5.x, the script pauses itself. To re-enable it:

1. Diff these files against v3.5.2: `src/components/TitleCard/index.tsx`, `server/routes/request.ts`, `server/entity/MediaRequest.ts` and `server/models/Tv.ts`.
2. Run the mock tests.
3. Widen `testedVersion` and bump the script version.
4. Run acceptance tests 1, 6, 7 and 8.

## Rollback

In Violentmonkey, disable or delete **Seerr No-Confirm Request** (formerly Seerr Quick Request), then reload Seerr. Requests that were already submitted remain, and are handled by Seerr and Radarr as usual.
