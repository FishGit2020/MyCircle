#!/usr/bin/env node

/**
 * CI check: ensures all micro-frontend packages declare the same versions
 * for shared Module Federation dependencies.
 *
 * Reads every packages/* /pkg.json and compares the version specifiers of
 * the libraries listed in SHARED_DEPS.  Exits with code 1 on any mismatch.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PACKAGES_DIR = join(ROOT, 'packages');

/** Shared deps that MUST be identical across all micro-frontends */
const SHARED_DEPS = [
  'react',
  'react-dom',
  'react-router',
  '@apollo/client',
  'graphql',
];

// ── Collect versions ────────────────────────────────────────
/** @type {Map<string, Map<string, string>>}  dep -> { pkg -> version } */
const versions = new Map(SHARED_DEPS.map((d) => [d, new Map()]));

const pkgDirs = readdirSync(PACKAGES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const dir of pkgDirs) {
  const pkgPath = join(PACKAGES_DIR, dir, 'package.json');
  if (!existsSync(pkgPath)) continue;

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };

  for (const dep of SHARED_DEPS) {
    if (deps[dep]) {
      versions.get(dep).set(dir, deps[dep]);
    }
  }
}

// ── Check for mismatches ────────────────────────────────────
let failed = false;

for (const [dep, pkgVersions] of versions) {
  const uniqueVersions = new Set(pkgVersions.values());
  if (uniqueVersions.size > 1) {
    failed = true;
    console.error(`\n❌  Version mismatch for "${dep}":`);
    for (const [pkg, ver] of pkgVersions) {
      console.error(`     packages/${pkg}: ${ver}`);
    }
  }
}

if (failed) {
  console.error(
    '\n⚠️  Shared Module Federation dependencies must use identical version specifiers across all packages.\n' +
      '   Update the mismatched versions above, or use pnpm catalogs to centralise them.\n'
  );
  process.exit(1);
} else {
  console.log('✅  All shared dependency versions are consistent across packages.');
}
