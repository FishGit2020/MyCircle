/**
 * dev-remote.mjs — Watch a remote MFE, rebuild on change, and auto-reload
 * the shell's browser tab via its /__mfe-rebuilt endpoint.
 *
 * Usage:
 *   pnpm dev:remote -- baby-tracker
 *   pnpm dev:remote -- city-search
 */
import { spawn } from 'child_process';
import { existsSync, watch } from 'fs';
import { resolve } from 'path';

const name = process.argv[2];
if (!name) {
  console.error('Usage: pnpm dev:remote -- <package-name>');
  process.exit(1);
}

const pkgDir = resolve('packages', name);
if (!existsSync(pkgDir)) {
  console.error(`Package directory not found: ${pkgDir}`);
  process.exit(1);
}

const remoteEntry = resolve(pkgDir, 'dist/assets/remoteEntry.js');
const SHELL_URL = `http://localhost:3000/__mfe-rebuilt?app=${encodeURIComponent(name)}`;
const DEBOUNCE_MS = 500;

// ── 1. Start vite build --watch via pnpm ────────────────────────────────
console.log(`[dev-remote] Starting build --watch for @mycircle/${name}...`);

const child = spawn('pnpm', ['--filter', `@mycircle/${name}`, 'build', '--watch'], {
  stdio: 'inherit',
  shell: true,
});

child.on('error', (err) => {
  console.error(`[dev-remote] Failed to start build process:`, err);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`[dev-remote] Build process exited with code ${code}`);
  process.exit(code ?? 0);
});

// ── 2. Watch remoteEntry.js for changes and notify the shell ────────────
let debounceTimer = null;

function waitForRemoteEntry() {
  if (!existsSync(remoteEntry)) {
    // remoteEntry doesn't exist yet (first build in progress) — retry shortly
    setTimeout(waitForRemoteEntry, 1000);
    return;
  }

  console.log(`[dev-remote] Watching ${remoteEntry}`);

  watch(remoteEntry, () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        console.log(`[dev-remote] Rebuild detected — notifying shell...`);
        await fetch(SHELL_URL);
        console.log(`[dev-remote] Shell notified — browser should reload.`);
      } catch {
        console.warn(`[dev-remote] Could not reach shell at ${SHELL_URL} (is it running?)`);
      }
    }, DEBOUNCE_MS);
  });
}

waitForRemoteEntry();
