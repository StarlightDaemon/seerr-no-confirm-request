# LOOP-001: live acceptance checklist (Seerr No-Confirm Request 0.3.0)

Run against your live Seerr in Firefox with a userscript manager. These are the acceptance tests (see `ACCEPTANCE-TESTS.md`) that were only verified on the mock DOM: **6, 7, 8 and 10 to 16**. Tests 1 to 5 and 9 were checked live on 0.1.0; re-run them if you want a full pass.

Record results in the Result column. When all pass, tell the agent so LOOP-001 can be closed in `.raiden/state/OPEN_LOOPS.md`.

## Before you start

- [ ] Installed script is **0.3.0**: in the userscript manager, script name "Seerr No-Confirm Request", version 0.3.0. If an old "Seerr Quick Request" copy or two copies exist, delete them and reinstall using the README.
- [ ] **Custom match** is set to your Seerr address (Settings tab of the script), for example `https://seerr.example.com/*`. Without it the script does not run on your server.
- [ ] Logged in to Seerr as an **admin** (auto-approve). Test 11 needs a second, non-auto-approve user.
- [ ] Pick **throwaway titles** you are happy to request, because tests 6 and 14 create real Sonarr/Radarr entries. You will delete them afterwards.
  - Series A: 5 or fewer aired seasons, not yet requested.
  - Series B: more than 5 aired seasons, not yet requested.
  - A movie for test 8, not yet requested.
- [ ] Optional: set `CONFIG.debug = true` in the script to see decisions and HTTP codes in the browser console (F12). Set it back to `false` afterwards.

## Tests

| # | Do this | Expect | Result |
|---|---|---|---|
| 6 | Click Request once on Series A | One request covering all aired seasons (specials excluded), routed to the default Sonarr. Card shows *Requested*. | |
| 7 | Click Request on Series B | Seerr's native season dialog opens. Nothing is sent: Requests page shows no new entry. Close the dialog. | |
| 8a | Shift + Click Request on the throwaway movie | Native movie dialog opens. Close it without requesting. | |
| 8b | Shift + Click Request on a series | Native season dialog opens. Close it without requesting. | |
| 10 | Open a second tab and log out of Seerr, then in the first tab click Request on an unrequested title | "Session expired" toast. Button is restored. Nothing claimed. Log back in afterwards. | |
| 11 | Log in as the non-auto-approve user, click Request on an unrequested title | Card shows *Pending approval*. The request waits in Requests for an admin to approve. | |
| 12 | Without reloading, move between Discover, a search result, and a genre page, then click Request on each | One-click works on all of them (client-side navigation does not break it). | |
| 13 | Reload the page after a successful request | Seerr's own status badge replaces the script's *Requested* label. | |
| 14 | Open Sonarr (for Series A) and Radarr (for any movie you requested) | Titles added with the configured profiles, folders and tags. Radarr's sizing behaviour is as usual. | |
| 15 | In the script editor set `testedVersion` to something that doesn't match (for example `9.9.x`), save, reload Seerr, click Request on a title | One "Paused" notice per session. Clicking Request behaves natively (two-step dialog). **Restore `testedVersion` to `3.5.x` afterwards.** | |
| 16 | Disable the script in Violentmonkey, reload, click Request | Native two-step behaviour returns. **Re-enable the script afterwards.** | |

## Cleanup (after the run)

- [ ] Delete or unmonitor the throwaway series and movies in Sonarr and Radarr, and delete the test requests in Seerr.
- [ ] `testedVersion` is back to `3.5.x` and `CONFIG.debug` is `false`.
- [ ] Script is enabled and still shows version 0.3.0, with Custom match intact.
- [ ] Log back in on the admin account if test 10 logged you out.

## If something fails

Note the test number, what you saw, and the console output if debug was on (it never logs cookies or tokens). Do not edit the installed script to work around it; report it so it can be fixed in the repository.
