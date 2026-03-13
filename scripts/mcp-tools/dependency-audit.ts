import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

// ─── Helpers ──────────────────────────────────────────────────

function listPackages(): string[] {
  return fs
    .readdirSync(path.join(ROOT, 'packages'), { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getDirSize(dir: string): number {
  let total = 0;
  if (!fs.existsSync(dir)) return 0;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += getDirSize(full);
    } else {
      total += fs.statSync(full).size;
    }
  }
  return total;
}

interface FileInfo {
  relativePath: string;
  size: number;
}

function getFilesWithSizes(dir: string, baseDir: string): FileInfo[] {
  const results: FileInfo[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getFilesWithSizes(full, baseDir));
    } else {
      results.push({
        relativePath: path.relative(baseDir, full).replace(/\\/g, '/'),
        size: fs.statSync(full).size,
      });
    }
  }
  return results;
}

// ─── audit_dependencies ──────────────────────────────────────

interface AuditAdvisory {
  severity: string;
  module_name: string;
  title: string;
  vulnerable_versions: string;
  patched_versions: string;
  url: string;
}

interface AuditResult {
  advisories: Record<string, AuditAdvisory>;
  metadata: {
    vulnerabilities: Record<string, number>;
    totalDependencies: number;
  };
}

interface OutdatedEntry {
  current: string;
  latest: string;
  wanted: string;
  isDeprecated: boolean;
  dependencyType: string;
}

export function auditDependencies(): string {
  const sections: string[] = [];

  // ── Security audit ──────────────────────────────────────────
  sections.push('# Dependency Audit Report\n');

  try {
    // pnpm audit exits non-zero when vulnerabilities exist, so we capture stdout regardless
    const auditRaw = execSync('pnpm audit --json 2>&1', {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 60_000,
    });
    const audit: AuditResult = JSON.parse(auditRaw);

    const vulns = audit.metadata?.vulnerabilities ?? {};
    const total = Object.values(vulns).reduce((s, n) => s + n, 0);

    sections.push('## Security Vulnerabilities\n');
    if (total === 0) {
      sections.push('No known vulnerabilities found.\n');
    } else {
      sections.push(`Found **${total}** vulnerability(ies) across **${audit.metadata.totalDependencies}** dependencies:\n`);
      sections.push('| Severity | Count |');
      sections.push('|----------|-------|');
      for (const sev of ['critical', 'high', 'moderate', 'low', 'info']) {
        const count = vulns[sev] ?? 0;
        if (count > 0) {
          sections.push(`| ${sev} | ${count} |`);
        }
      }
      sections.push('');

      const advisories = Object.values(audit.advisories ?? {});
      if (advisories.length > 0) {
        sections.push('### Details\n');
        // Sort: critical > high > moderate > low > info
        const sevOrder: Record<string, number> = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 };
        advisories.sort((a, b) => (sevOrder[a.severity] ?? 5) - (sevOrder[b.severity] ?? 5));

        for (const adv of advisories) {
          sections.push(`- **[${adv.severity.toUpperCase()}]** \`${adv.module_name}\` — ${adv.title}`);
          sections.push(`  Vulnerable: \`${adv.vulnerable_versions}\` | Patched: \`${adv.patched_versions}\``);
          if (adv.url) sections.push(`  ${adv.url}`);
        }
        sections.push('');
      }
    }
  } catch (err: unknown) {
    // pnpm audit may fail with non-zero exit but still produce JSON on stdout
    const error = err as { stdout?: string; stderr?: string; message?: string };
    const stdout = error.stdout ?? '';
    if (stdout.startsWith('{')) {
      try {
        const audit: AuditResult = JSON.parse(stdout);
        const vulns = audit.metadata?.vulnerabilities ?? {};
        const total = Object.values(vulns).reduce((s, n) => s + n, 0);

        sections.push('## Security Vulnerabilities\n');
        sections.push(`Found **${total}** vulnerability(ies):\n`);
        sections.push('| Severity | Count |');
        sections.push('|----------|-------|');
        for (const sev of ['critical', 'high', 'moderate', 'low', 'info']) {
          const count = vulns[sev] ?? 0;
          if (count > 0) {
            sections.push(`| ${sev} | ${count} |`);
          }
        }
        sections.push('');

        const advisories = Object.values(audit.advisories ?? {});
        if (advisories.length > 0) {
          sections.push('### Details\n');
          const sevOrder: Record<string, number> = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 };
          advisories.sort((a, b) => (sevOrder[a.severity] ?? 5) - (sevOrder[b.severity] ?? 5));
          for (const adv of advisories) {
            sections.push(`- **[${adv.severity.toUpperCase()}]** \`${adv.module_name}\` — ${adv.title}`);
            sections.push(`  Vulnerable: \`${adv.vulnerable_versions}\` | Patched: \`${adv.patched_versions}\``);
            if (adv.url) sections.push(`  ${adv.url}`);
          }
          sections.push('');
        }
      } catch {
        sections.push('## Security Vulnerabilities\n');
        sections.push(`Could not parse audit output. Raw error: ${error.message ?? 'unknown'}\n`);
      }
    } else {
      sections.push('## Security Vulnerabilities\n');
      sections.push(`Could not run \`pnpm audit\`: ${error.message ?? 'unknown error'}\n`);
    }
  }

  // ── Outdated packages ───────────────────────────────────────
  try {
    const outdatedRaw = execSync('pnpm outdated --json 2>&1', {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 60_000,
    });
    const outdated: Record<string, OutdatedEntry> = JSON.parse(outdatedRaw);
    const entries = Object.entries(outdated);

    sections.push('## Outdated Packages\n');
    if (entries.length === 0) {
      sections.push('All packages are up to date.\n');
    } else {
      sections.push(`Found **${entries.length}** outdated package(s):\n`);
      sections.push('| Package | Current | Latest | Type |');
      sections.push('|---------|---------|--------|------|');
      // Sort by dependency type then name
      entries.sort((a, b) => {
        const typeCmp = a[1].dependencyType.localeCompare(b[1].dependencyType);
        if (typeCmp !== 0) return typeCmp;
        return a[0].localeCompare(b[0]);
      });
      for (const [name, info] of entries) {
        const depType = info.dependencyType === 'devDependencies' ? 'dev' : 'prod';
        const deprecated = info.isDeprecated ? ' (DEPRECATED)' : '';
        sections.push(`| \`${name}\`${deprecated} | ${info.current} | ${info.latest} | ${depType} |`);
      }
      sections.push('');
    }
  } catch (err: unknown) {
    // pnpm outdated exits non-zero when there are outdated packages
    const error = err as { stdout?: string; message?: string };
    const stdout = error.stdout ?? '';
    if (stdout.startsWith('{')) {
      try {
        const outdated: Record<string, OutdatedEntry> = JSON.parse(stdout);
        const entries = Object.entries(outdated);

        sections.push('## Outdated Packages\n');
        if (entries.length === 0) {
          sections.push('All packages are up to date.\n');
        } else {
          sections.push(`Found **${entries.length}** outdated package(s):\n`);
          sections.push('| Package | Current | Latest | Type |');
          sections.push('|---------|---------|--------|------|');
          entries.sort((a, b) => {
            const typeCmp = a[1].dependencyType.localeCompare(b[1].dependencyType);
            if (typeCmp !== 0) return typeCmp;
            return a[0].localeCompare(b[0]);
          });
          for (const [name, info] of entries) {
            const depType = info.dependencyType === 'devDependencies' ? 'dev' : 'prod';
            const deprecated = info.isDeprecated ? ' (DEPRECATED)' : '';
            sections.push(`| \`${name}\`${deprecated} | ${info.current} | ${info.latest} | ${depType} |`);
          }
          sections.push('');
        }
      } catch {
        sections.push('## Outdated Packages\n');
        sections.push(`Could not parse outdated output: ${error.message ?? 'unknown'}\n`);
      }
    } else {
      sections.push('## Outdated Packages\n');
      sections.push(`Could not run \`pnpm outdated\`: ${error.message ?? 'unknown error'}\n`);
    }
  }

  return sections.join('\n');
}

// ─── analyze_bundle_sizes ────────────────────────────────────

interface MfeBundleInfo {
  package: string;
  totalSize: number;
  fileCount: number;
  largestFiles: FileInfo[];
  built: boolean;
}

export function analyzeBundleSizes(): string {
  const packages = listPackages();
  const sections: string[] = [];

  sections.push('# Bundle Size Analysis\n');

  const mfeInfos: MfeBundleInfo[] = [];
  let notBuilt = 0;

  for (const pkg of packages) {
    const distDir = path.join(ROOT, 'packages', pkg, 'dist');
    if (!fs.existsSync(distDir)) {
      mfeInfos.push({ package: pkg, totalSize: 0, fileCount: 0, largestFiles: [], built: false });
      notBuilt++;
      continue;
    }

    const files = getFilesWithSizes(distDir, distDir);
    const totalSize = files.reduce((s, f) => s + f.size, 0);

    // Get top 5 largest files
    files.sort((a, b) => b.size - a.size);
    const largestFiles = files.slice(0, 5);

    mfeInfos.push({
      package: pkg,
      totalSize,
      fileCount: files.length,
      largestFiles,
      built: true,
    });
  }

  // Sort by total size descending
  const built = mfeInfos.filter(m => m.built);
  built.sort((a, b) => b.totalSize - a.totalSize);
  const unbuilt = mfeInfos.filter(m => !m.built);

  if (notBuilt === packages.length) {
    sections.push('No packages have been built yet. Run `pnpm build` first.\n');
    return sections.join('\n');
  }

  // ── Summary table ──
  sections.push('## Per-Package Bundle Sizes\n');
  sections.push('| Package | Total Size | Files |');
  sections.push('|---------|-----------|-------|');

  let grandTotal = 0;
  for (const info of built) {
    sections.push(`| \`${info.package}\` | ${formatBytes(info.totalSize)} | ${info.fileCount} |`);
    grandTotal += info.totalSize;
  }
  sections.push(`| **TOTAL** | **${formatBytes(grandTotal)}** | |`);
  sections.push('');

  if (unbuilt.length > 0) {
    sections.push(`*${unbuilt.length} package(s) not built:* ${unbuilt.map(u => `\`${u.package}\``).join(', ')}\n`);
  }

  // ── Top 10 largest files across all MFEs ──
  const allFiles: (FileInfo & { package: string })[] = [];
  for (const info of built) {
    for (const f of info.largestFiles) {
      allFiles.push({ ...f, package: info.package });
    }
  }
  allFiles.sort((a, b) => b.size - a.size);
  const top10 = allFiles.slice(0, 10);

  if (top10.length > 0) {
    sections.push('## Top 10 Largest Files\n');
    sections.push('| Package | File | Size |');
    sections.push('|---------|------|------|');
    for (const f of top10) {
      sections.push(`| \`${f.package}\` | \`${f.relativePath}\` | ${formatBytes(f.size)} |`);
    }
    sections.push('');
  }

  return sections.join('\n');
}
