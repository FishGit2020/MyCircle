# Contributing to MyCircle

## Prerequisites

Install the following before cloning the project:

| Tool | Version | Install (macOS) |
|------|---------|-----------------|
| **Node.js** | >= 22 | `brew install node@22` or [nvm](https://github.com/nvm-sh/nvm): `nvm install 22` |
| **pnpm** | 9.x | `corepack enable && corepack prepare pnpm@9.15.0 --activate` |
| **Git** | any | `brew install git` (or Xcode Command Line Tools: `xcode-select --install`) |
| **GitHub CLI** | any | `brew install gh` then `gh auth login` |
| **Firebase CLI** | any | `npm install -g firebase-tools` then `firebase login` |
| **Java** | >= 11 | `brew install openjdk@17` (required for Firebase emulators) |

> **Windows:** Use the same Node/pnpm versions. Install Git from [git-scm.com](https://git-scm.com/), GitHub CLI from [cli.github.com](https://cli.github.com/), and Java from [adoptium.net](https://adoptium.net/).

### Verify

```bash
node -v    # v22.x
pnpm -v    # 9.x
gh --version
firebase --version
java -version
```

## Quick Start

```bash
# Clone and install
git clone https://github.com/FishGit2020/MyCircle.git
cd MyCircle
pnpm install

# Build shared package (required before running anything)
pnpm build:shared

# Start dev environment (all MFEs + shell)
pnpm dev

# Run tests
pnpm test:all
```

## Development Workflow

1. Create a branch: `git checkout -b feat/my-feature`
2. Make changes following our standards (see below)
3. Run tests: `pnpm --filter @mycircle/<package> test:run`
4. Commit and push: `git push -u origin feat/my-feature`
5. Open a PR: `gh pr create --title "feat: ..." --body "..."`
6. Wait for CI (unit tests, E2E, CodeQL, Lighthouse)
7. Merge after all checks pass

## Standards

Every change should follow these four principles:

- **i18n** — All user-visible text must use translation keys in `packages/shared/src/i18n/translations.ts` (English, Spanish, Chinese)
- **Accessibility** — ARIA labels, keyboard navigation, screen reader support, WCAG 2.1 AA compliance
- **Dark mode** — All UI must work in both light and dark themes using Tailwind's `dark:` variants
- **Responsive** — Mobile-first design that works from 320px to 1920px+

## Project Structure

```
packages/
  shared/       — i18n, types, utilities, event bus (build first!)
  shell/        — Host app with layout, routing, dashboard
  city-search/  — City search MFE
  weather-display/ — Weather MFE
  stock-tracker/   — Stock tracking MFE
  podcast-player/  — Podcast MFE
  ai-assistant/    — AI chat MFE
  bible-reader/    — Bible reader MFE
  worship-songs/   — Worship songs MFE
  notebook/        — Note-taking MFE
  baby-tracker/    — Baby growth tracker MFE
```

## CI Pipeline

Pull requests run these checks automatically:

| Check | Description |
|-------|-------------|
| **ci** | Typecheck + unit tests across all packages |
| **e2e** | Playwright E2E tests with mocked APIs |
| **e2e-emulator** | Full-stack E2E with Firebase emulators |
| **CodeQL** | Security analysis |
| **Lighthouse** | Performance, accessibility, SEO scoring |

## Detailed Guides

- [Architecture](docs/architecture.md) — Full system architecture and MFE design
- [CLAUDE.md](CLAUDE.md) — AI agent rules (auto-loaded by Claude Code)
- [PR Lifecycle](docs/pr-lifecycle.md) — Branch protection and review process
- [CI/CD Pipeline](docs/cicd.md) — Deployment and automation details
- [MFE Guide](docs/mfe-guide.md) — Micro frontend pitfalls and lessons learned
- [API Keys](docs/api-keys.md) — Setting up external API credentials
