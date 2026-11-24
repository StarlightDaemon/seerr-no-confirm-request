# Acceptance tests (operator-run)

Run these against a live Seerr after install or after widening `testedVersion`. For a guided run of the ones not yet verified live, use `LOOP-001-live-test-checklist.md`.

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
