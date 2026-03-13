import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

function extractLocaleKeys(localeFile: string): string[] {
  const content = readFile(localeFile);
  const keys: string[] = [];
  const regex = /['"]([a-zA-Z][a-zA-Z0-9_.]+)['"]\s*:/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    keys.push(match[1]);
  }
  return keys;
}

function getNamespace(key: string): string {
  const dotIndex = key.indexOf('.');
  return dotIndex === -1 ? key : key.substring(0, dotIndex);
}

function collectSourceFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) continue;
      results.push(...collectSourceFiles(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

export function analyzeI18nBundle(): string {
  const localeDir = 'packages/shared/src/i18n/locales';
  const localeFiles: Record<string, string> = {
    en: path.join(localeDir, 'en.ts'),
    es: path.join(localeDir, 'es.ts'),
    zh: path.join(localeDir, 'zh.ts'),
  };
  const lines: string[] = ['# i18n Bundle Analysis\n'];
  const keysByLocale: Record<string, string[]> = {};
  for (const [locale, file] of Object.entries(localeFiles)) {
    keysByLocale[locale] = extractLocaleKeys(file);
  }
  lines.push('## Keys per Locale');
  for (const [locale, keys] of Object.entries(keysByLocale)) {
    lines.push(`- **${locale}**: ${keys.length} keys`);
  }
  lines.push('');
  const enKeys = keysByLocale.en;
  const namespaceMap = new Map<string, string[]>();
  for (const key of enKeys) {
    const ns = getNamespace(key);
    if (!namespaceMap.has(ns)) namespaceMap.set(ns, []);
    namespaceMap.get(ns)!.push(key);
  }
  const sorted = [...namespaceMap.entries()].sort((a, b) => b[1].length - a[1].length);
  lines.push(`## Keys per Namespace (${sorted.length} namespaces)\n`);
  lines.push('| Namespace | Keys | % of total |');
  lines.push('|-----------|------|------------|');
  for (const [ns, keys] of sorted) {
    const pct = ((keys.length / enKeys.length) * 100).toFixed(1);
    lines.push(`| ${ns} | ${keys.length} | ${pct}% |`);
  }
  lines.push('');
  lines.push('## Top 5 Largest Namespaces\n');
  for (const [ns, keys] of sorted.slice(0, 5)) {
    lines.push(`### ${ns} (${keys.length} keys)`);
    for (const k of keys.slice(0, 5)) lines.push(`  - \`${k}\``);
    if (keys.length > 5) lines.push(`  - ... and ${keys.length - 5} more`);
    lines.push('');
  }
  return lines.join('\n');
}

export function findUnusedI18nKeys(): string {
  const enKeys = extractLocaleKeys('packages/shared/src/i18n/locales/en.ts');
  const packagesDir = path.join(ROOT, 'packages');
  const packageNames = fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'shared').map(d => d.name);
  const allSourceFiles: string[] = [];
  for (const pkg of packageNames) {
    allSourceFiles.push(...collectSourceFiles(path.join(packagesDir, pkg, 'src'), ['.ts', '.tsx']));
  }
  const sharedFiles = collectSourceFiles(path.join(packagesDir, 'shared', 'src'), ['.ts', '.tsx'])
    .filter(f => !f.includes(path.join('i18n', 'locales')));
  allSourceFiles.push(...sharedFiles);
  const allContent = allSourceFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
  const unusedKeys: string[] = [];
  for (const key of enKeys) {
    if (!allContent.includes(`'${key}'`) && !allContent.includes(`"${key}"`)) {
      unusedKeys.push(key);
    }
  }
  const lines: string[] = ['# Potentially Unused i18n Keys\n'];
  lines.push(`Scanned ${allSourceFiles.length} source files across ${packageNames.length + 1} packages.\n`);
  if (unusedKeys.length === 0) {
    lines.push('No unused keys found. All keys appear to be referenced in source code.');
    return lines.join('\n');
  }
  lines.push(`Found **${unusedKeys.length}** potentially unused keys (out of ${enKeys.length} total).\n`);
  lines.push('> **Note:** This may include false negatives for dynamically constructed keys');
  lines.push('> like `` t(`prefix.${variable}`) `` or keys used only in locale files.\n');
  const byNamespace = new Map<string, string[]>();
  for (const key of unusedKeys) {
    const ns = getNamespace(key);
    if (!byNamespace.has(ns)) byNamespace.set(ns, []);
    byNamespace.get(ns)!.push(key);
  }
  const sorted = [...byNamespace.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [ns, keys] of sorted) {
    lines.push(`## ${ns} (${keys.length} unused)`);
    for (const k of keys) lines.push(`- \`${k}\``);
    lines.push('');
  }
  return lines.join('\n');
}

export function findMissingI18nKeys(): string {
  const enKeys = new Set(extractLocaleKeys('packages/shared/src/i18n/locales/en.ts'));
  const packagesDir = path.join(ROOT, 'packages');
  const packageNames = fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'shared').map(d => d.name);
  const allSourceFiles: string[] = [];
  for (const pkg of packageNames) {
    allSourceFiles.push(...collectSourceFiles(path.join(packagesDir, pkg, 'src'), ['.ts', '.tsx']));
  }
  const sharedFiles = collectSourceFiles(path.join(packagesDir, 'shared', 'src'), ['.ts', '.tsx'])
    .filter(f => !f.includes(path.join('i18n', 'locales')));
  allSourceFiles.push(...sharedFiles);
  const tCallRegex = /\bt\(\s*['"]([a-zA-Z][a-zA-Z0-9_.]+)['"]\s*[),]/g;
  const missingKeys = new Map<string, Set<string>>();
  for (const filePath of allSourceFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    let match: RegExpExecArray | null;
    tCallRegex.lastIndex = 0;
    while ((match = tCallRegex.exec(content)) !== null) {
      const key = match[1];
      if (!enKeys.has(key)) {
        const relPath = path.relative(ROOT, filePath).replace(/\\/g, '/');
        if (!missingKeys.has(key)) missingKeys.set(key, new Set());
        missingKeys.get(key)!.add(relPath);
      }
    }
  }
  const lines: string[] = ['# Missing i18n Keys\n'];
  lines.push(`Scanned ${allSourceFiles.length} source files for \`t()\` calls.\n`);
  if (missingKeys.size === 0) {
    lines.push('No missing keys found. All `t()` calls reference keys that exist in en.ts.');
    return lines.join('\n');
  }
  lines.push(`Found **${missingKeys.size}** key(s) referenced in code but missing from en.ts.\n`);
  lines.push('> **Note:** Dynamic keys like `` t(`prefix.${var}`) `` are not detected by this scan.\n');
  const byNamespace = new Map<string, Array<{ key: string; files: string[] }>>();
  for (const [key, files] of missingKeys) {
    const ns = getNamespace(key);
    if (!byNamespace.has(ns)) byNamespace.set(ns, []);
    byNamespace.get(ns)!.push({ key, files: [...files] });
  }
  const sorted = [...byNamespace.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [ns, entries] of sorted) {
    lines.push(`## ${ns} (${entries.length} missing)`);
    for (const { key, files } of entries) {
      lines.push(`- \`${key}\``);
      for (const f of files) lines.push(`  - ${f}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
