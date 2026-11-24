# Agent Startup — RAIDEN Instance

This repo runs a RAIDEN Instance control plane in `.raiden/`.

## Read First

1. `.raiden/README.md` — control plane navigation
2. `.raiden/state/CURRENT_STATE.md` — active work and current state
3. `.raiden/state/OPEN_LOOPS.md` — pending work
4. `.raiden/writ/AGENTS.md` — full agent guide: tooling surface, write boundaries, naming canon

## Key Constraints

- **Do not write to `.raiden/writ/`** — it is RAIDEN-managed core
- **No `Co-Authored-By` in commits** — the `commit-msg` hook enforces this; do not bypass it
- **Mainline branch is `main`** — never `master`
- **D-0016**: on any Writ update — update managed core, preserve local overlay, preserve state, stop and report on locally modified managed files
- **Do not change `seerr-no-confirm-request.user.js` casually** — its `@updateURL`/`@downloadURL` point at the `latest` release asset, which must be named exactly `seerr-no-confirm-request.user.js`

## Naming Canon

`RAIDEN` · `Edict` · `RAIDEN Instance` · `Writ` · `payload` — use exactly; no synonyms.

## RAIDEN Tooling

Lives in the central RAIDEN framework repo (path is operator-specific; recorded in `.raiden/local/README.md`) — not in this repo. Invoke from there with `--instance <this-repo-path>`.

## Standing delegation v1 (operator: StarlightDaemon)
Applies to every agent working in this repo: Claude Code, Codex, Gemini CLI.

Do without asking, then report once at the end of the task:
- Read, build, test, lint. Wait for CI yourself; don't hand back "pending".
- Create agent branches (claude/*, codex/*, gemini/*); commit, rebase,
  fast-forward and merge them. Create agent worktrees.
- Push agent branches (never force). Open and update PRs; enable auto-fix.
- Merge a PR into the default branch when all checks pass, no review
  requests changes, and the merge doesn't publish (see Publication surface).
- Delete agent branches, local and remote, once their commits are in the
  default branch or another pushed branch.
- Keep records current: HANDOFF, OPEN-LOOPS, CHANGELOG and any doc that
  describes branch or PR state.

Ask once, in one message listing everything pending:
- Tags, releases, leaving a -dev version, or any merge that publishes.
- Force push, or rewriting history that's already pushed.
- Any other deletion: worktrees, backup refs, files or branches an agent
  didn't create, commits that exist nowhere else.
- Committing, moving or discarding StarlightDaemon's uncommitted work.
- CI workflows, branch protection, repo settings, secrets, agent permission
  settings, and this section.
- Anything against live hosts, services or devices.

Stop and report: failing checks you can't fix within the task, conflicts in
files StarlightDaemon is editing, or anything this section doesn't cover.

### Publication surface
A merge to `main` that changes `seerr-no-confirm-request.user.js` publishes it: the README's copy-and-paste install (Option B) serves the raw file from `main`. Treat such merges as gated. Other merges publish nothing. `@updateURL` and `@downloadURL` point at `releases/latest`, so automatic updates go out only with a tagged GitHub release.
