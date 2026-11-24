# Work Log

## 2026-11-23

- Repository bootstrapped from the verified 0.2.0 source bundle. RAIDEN Edict 2.1.0 installed with the updater (plan: up to date). CI workflow added.
- Pushed main (af3db92), CI passed, tagged v0.2.0 and published GitHub release v0.2.0 with seerr-quick-request.user.js attached.
- Renamed the GitHub repository to seerr-no-confirm-request; local workspace E:\SQR becomes E:\SNCR. Userscript metadata left as released (LOOP-004).
- Renamed the userscript and cut v0.2.1 (see DECISIONS.md).
- Renamed the internal ids and cut v0.2.2 (0.2.1 left published as is).
- Bumped jsdom to 31.0.1 (test-only) and added the LOOP-001 live acceptance checklist under docs/.
- Deleted the v0.2.0 and v0.2.1 releases (tags kept) and removed the legacy asset from v0.2.2; closed LOOP-004.
- Removed the hard-coded origin, reorganised the README, moved the acceptance table to docs/ACCEPTANCE-TESTS.md; published v0.3.0.
- Fixed the v0.3.0 release notes, where an unquoted `@match` had mentioned an unrelated GitHub user; README copy-paste install now uses the raw GitHub link and the old script name was removed from it.
- Closed LOOP-002 (no branch protection). Open at end of day: LOOP-001 (live tests, operator) and LOOP-003 (Seerr past 3.5.x, upstream).
