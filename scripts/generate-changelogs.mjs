#!/usr/bin/env node
/**
 * Generate per-package changelogs from git commit history.
 * Usage: node scripts/generate-changelogs.mjs [--since=v1.0.0] [--package=deal-finder]
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const sinceArg = args.find(a => a.startsWith('--since='));
const pkgArg = args.find(a => a.startsWith('--package='));
const since = sinceArg ? sinceArg.split('=')[1] : '30.days.ago';
const filterPkg = pkgArg ? pkgArg.split('=')[1] : null;

const packages = fs.readdirSync(path.join(ROOT, 'packages'), { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .filter(name => !filterPkg || name === filterPkg);

console.log(`Generating changelogs since ${since}...\n`);

for (const pkg of packages) {
  const pkgPath = `packages/${pkg}`;
  try {
    const log = execSync(
      `git log --oneline --since="${since}" -- "${pkgPath}"`,
      { cwd: ROOT, encoding: 'utf-8' }
    ).trim();

    if (!log) continue;

    const lines = log.split('\n');
    const changelogPath = path.join(ROOT, pkgPath, 'CHANGELOG.md');

    const entries = lines.map(line => {
      const [hash, ...rest] = line.split(' ');
      const msg = rest.join(' ');
      return `- [\`${hash}\`] ${msg}`;
    });

    const content = [
      `# ${pkg} Changelog`,
      '',
      `_Auto-generated from commits touching \`${pkgPath}/\` since ${since}_`,
      '',
      ...entries,
      '',
    ].join('\n');

    fs.writeFileSync(changelogPath, content);
    console.log(`${pkg}: ${lines.length} commit(s)`);
  } catch {
    // git log may fail if no commits match
  }
}

console.log('\nDone.');
