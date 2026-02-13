# Pull Request Lifecycle

Best practices for contributing to MyCircle — from branch creation to merge.

---

## Branch Protection Rules

The `main` branch is protected with the following rules configured via GitHub:

| Rule | Setting | Why |
|------|---------|-----|
| **Required status checks** | `ci`, `e2e` | PRs cannot merge until unit tests/typecheck AND E2E tests pass |
| **Require up-to-date branch** | Enabled | PR must be rebased on latest `main` before merging — prevents "works on my branch" failures |
| **Enforce for admins** | Enabled | Even repository admins cannot bypass required checks |
| **Force pushes** | Blocked | No `git push --force` to `main` |
| **Branch deletions** | Blocked | `main` cannot be deleted |

### What the Required Checks Do

```
PR opened / updated
    │
    ├──► ci  (ci.yml)
    │     ├─ Shared dependency version check
    │     ├─ Build @mycircle/shared
    │     ├─ TypeScript typecheck (all packages)
    │     └─ Unit tests: root (382+) + all MFEs
    │
    └──► e2e  (e2e.yml)
          ├─ Build full production app (firebase:build)
          ├─ Serve dist/firebase/ on port 3000
          └─ Playwright E2E tests (browser-level mocked)

Both ✅  →  PR can be merged
Either ❌ →  PR is blocked
```

> **Note:** The `e2e-emulator` job (full-stack Firebase emulator tests) runs in parallel but is **not** a required check. It provides extra confidence but won't block a merge if it fails.

---

## PR Workflow

### 1. Create a Branch

Use a conventional prefix:

| Prefix | Use for | Example |
|--------|---------|---------|
| `feat/` | New features | `feat/dark-mode` |
| `fix/` | Bug fixes | `fix/podcast-null-guard` |
| `docs/` | Documentation only | `docs/api-keys-guide` |
| `refactor/` | Code restructuring (no behavior change) | `refactor/shared-exports` |
| `test/` | Test additions/fixes | `test/stock-proxy-coverage` |

```bash
git checkout main
git pull origin main
git checkout -b feat/my-feature
```

### 2. Develop and Test Locally

Before pushing, run the same checks CI will run:

```bash
# Build shared (required before per-package tests)
pnpm build:shared

# Unit tests
pnpm test:run          # Root workspace (all packages)
pnpm test:mf           # Per-package test runners

# Typecheck
pnpm typecheck:all

# E2E (starts dev server automatically)
pnpm test:e2e

# E2E with visible browser (for debugging)
pnpm test:e2e:headed
```

### 3. Commit

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <short description>
```

| Type | When to use |
|------|-------------|
| `feat` | Adding new functionality |
| `fix` | Fixing a bug |
| `docs` | Documentation changes only |
| `refactor` | Code change that doesn't fix a bug or add a feature |
| `test` | Adding or updating tests |
| `chore` | Build tooling, CI config, dependencies |

**Examples from this repo:**

```
feat: add Notebook MFE — personal notes with Firestore persistence
fix: guard null podcast episode count in PodcastCard
docs: add comprehensive API key setup guide
refactor: replace stale @weather/shared imports with @mycircle/shared
```

**Tips:**
- Keep the first line under 72 characters
- Use imperative mood ("add", "fix", "update" — not "added", "fixes", "updates")
- Reference the "why" not just the "what" when it isn't obvious

### 4. Push and Open PR

```bash
git push -u origin feat/my-feature
gh pr create --title "feat: my feature description" --body "## Summary
- What changed and why

## Test plan
- [ ] How to verify"
```

**PR title** follows the same conventional commit format as commit messages. The squash-merge commit message will use the PR title.

### 5. Wait for CI Checks

After opening/updating a PR, two checks run automatically:

| Check | Runs | Typical Duration |
|-------|------|-----------------|
| `ci` | Unit tests + typecheck | ~2 minutes |
| `e2e` | Playwright E2E tests | ~5 minutes |
| `e2e-emulator` | Full-stack emulator tests (optional) | ~5 minutes |

You can monitor progress:

```bash
gh run list                    # See all runs
gh run watch                   # Live progress of current run
gh pr checks                   # Check status on current PR
```

If a check fails:

```bash
gh run view <run-id> --log     # View full logs
gh run view <run-id> --log-failed  # View only failed step logs
```

### 6. Fix Failures

If CI fails, push a fix commit — CI will re-run automatically:

```bash
# Fix the issue
git add <files>
git commit -m "fix: address CI failure"
git push
```

**Common CI failure causes:**
- TypeScript errors → run `pnpm typecheck:all` locally
- Test failures → run `pnpm test:run` locally
- Shared dependency mismatch → use `catalog:` in `package.json` instead of pinned versions
- E2E failures → run `pnpm test:e2e:headed` locally to debug visually

### 7. Merge

Once both `ci` and `e2e` checks pass:

```bash
gh pr merge --squash
```

**Always squash merge** — this keeps `main` history clean with one commit per PR. The squash commit message uses the PR title, so make sure the title is descriptive.

> **Note:** `--admin` bypass is disabled. You must wait for checks to pass.

### 8. Clean Up

After merge, switch to main and pull:

```bash
git checkout main
git pull origin main
git branch -d feat/my-feature       # Delete local branch
```

GitHub auto-deletes the remote branch after squash merge (if enabled in repo settings).

---

## Handling Special Cases

### Docs-Only Changes

CI and E2E are **skipped** for PRs that only touch:
- `**.md`, `docs/**`, `LICENSE`, `.gitignore`, `.vscode/**`

These PRs can merge without waiting for checks (the checks simply won't appear).

### Emergency Hotfixes

If you need to merge urgently when CI is down or flaky:

```bash
# Temporarily disable admin enforcement
gh api repos/FishGit2020/MyCircle/branches/main/protection/enforce_admins --method DELETE

# Merge with admin bypass
gh pr merge --squash --admin

# Re-enable admin enforcement immediately
gh api repos/FishGit2020/MyCircle/branches/main/protection/enforce_admins \
  --method POST --field enabled=true
```

Use this sparingly — it defeats the purpose of branch protection.

### Updating a PR After Main Has Advanced

When the "Require up-to-date branch" check blocks merge:

```bash
git checkout feat/my-feature
git fetch origin main
git rebase origin/main
git push --force-with-lease      # Safe force push to your feature branch only
```

---

## Branch Protection Configuration

The protection rules are managed via the GitHub API. To view the current configuration:

```bash
gh api repos/FishGit2020/MyCircle/branches/main/protection \
  --jq '{
    required_checks: .required_status_checks.contexts,
    strict: .required_status_checks.strict,
    enforce_admins: .enforce_admins.enabled
  }'
```

To add a new required check (e.g., making `e2e-emulator` required):

```bash
gh api repos/FishGit2020/MyCircle/branches/main/protection/required_status_checks \
  --method PATCH --input - <<< '{"contexts": ["ci", "e2e", "e2e-emulator"], "strict": true}'
```

To remove a check:

```bash
gh api repos/FishGit2020/MyCircle/branches/main/protection/required_status_checks \
  --method PATCH --input - <<< '{"contexts": ["ci", "e2e"], "strict": true}'
```

---

## Quick Reference

```bash
# Full local pre-push validation (mirrors CI)
pnpm build:shared && pnpm typecheck:all && pnpm test:all && pnpm test:e2e

# Create PR
gh pr create --title "feat: description" --body "summary"

# Check PR status
gh pr checks

# Merge (after checks pass)
gh pr merge --squash

# Sync after merge
git checkout main && git pull origin main
```
