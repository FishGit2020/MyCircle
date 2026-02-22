import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

// ─── Helpers ──────────────────────────────────────────────────

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

function listDirs(relPath: string): string[] {
  return fs.readdirSync(path.join(ROOT, relPath), { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

// ─── Validator: i18n key sync ─────────────────────────────────

export function validateI18n(): string {
  const localeDir = 'packages/shared/src/i18n/locales';
  const localeFiles = { en: 'en.ts', es: 'es.ts', zh: 'zh.ts' };

  const keysByLocale: Record<string, Set<string>> = {};

  for (const [locale, file] of Object.entries(localeFiles)) {
    const content = readFile(path.join(localeDir, file));
    const keys = new Set<string>();
    // Match keys like 'some.key': or "some.key":
    const regex = /['"]([a-zA-Z][a-zA-Z0-9_.]+)['"]\s*:/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      keys.add(match[1]);
    }
    keysByLocale[locale] = keys;
  }

  const allKeys = new Set<string>();
  for (const keys of Object.values(keysByLocale)) {
    for (const k of keys) allKeys.add(k);
  }

  const issues: string[] = [];
  for (const [locale, keys] of Object.entries(keysByLocale)) {
    const missing = [...allKeys].filter(k => !keys.has(k));
    if (missing.length > 0) {
      issues.push(`${locale}: missing ${missing.length} key(s):\n  ${missing.join('\n  ')}`);
    }
  }

  if (issues.length === 0) {
    return `All 3 locales are in sync (${allKeys.size} keys each).`;
  }
  return `i18n sync issues found:\n\n${issues.join('\n\n')}`;
}

// ─── Validator: Dockerfile packages ───────────────────────────

export function validateDockerfile(): string {
  const dockerfile = readFile('deploy/docker/Dockerfile');
  const actualPackages = new Set(listDirs('packages'));

  // Build stage: COPY packages/<name>/package.json
  const buildCopies = new Set<string>();
  const buildRegex = /COPY\s+packages\/([a-z-]+)\/package\.json/g;
  let match: RegExpExecArray | null;
  while ((match = buildRegex.exec(dockerfile)) !== null) {
    buildCopies.add(match[1]);
  }

  // Runtime stage: COPY --from=builder ... packages/<name>/dist
  const runtimeCopies = new Set<string>();
  const runtimeRegex = /COPY\s+--from=builder.*?packages\/([a-z-]+)\/dist/g;
  while ((match = runtimeRegex.exec(dockerfile)) !== null) {
    runtimeCopies.add(match[1]);
  }

  const issues: string[] = [];

  // Check for packages missing from build stage
  const missingBuild = [...actualPackages].filter(p => !buildCopies.has(p));
  if (missingBuild.length > 0) {
    issues.push(`Build stage: missing COPY for: ${missingBuild.join(', ')}`);
  }

  // Check for packages in Dockerfile but not in packages/
  const extraBuild = [...buildCopies].filter(p => !actualPackages.has(p));
  if (extraBuild.length > 0) {
    issues.push(`Build stage: references removed package(s): ${extraBuild.join(', ')}`);
  }

  // Check runtime stage
  const missingRuntime = [...actualPackages].filter(p => !runtimeCopies.has(p) && p !== 'shared');
  if (missingRuntime.length > 0) {
    issues.push(`Runtime stage: missing COPY --from=builder for: ${missingRuntime.join(', ')}`);
  }

  const extraRuntime = [...runtimeCopies].filter(p => !actualPackages.has(p));
  if (extraRuntime.length > 0) {
    issues.push(`Runtime stage: references removed package(s): ${extraRuntime.join(', ')}`);
  }

  if (issues.length === 0) {
    return `Dockerfile is in sync with packages/ (${actualPackages.size} packages).`;
  }
  return `Dockerfile sync issues:\n\n${issues.join('\n')}`;
}

// ─── Validator: PWA shortcuts count ───────────────────────────

export function validatePwaShortcuts(): string {
  const viteConfig = readFile('packages/shell/vite.config.ts');

  // Count shortcut objects in the shortcuts array
  // Look for { name: ..., url: ... } patterns inside shortcuts: [...]
  const shortcutsMatch = viteConfig.match(/shortcuts\s*:\s*\[([\s\S]*?)\]/);
  if (!shortcutsMatch) {
    return 'No PWA shortcuts array found in packages/shell/vite.config.ts.';
  }

  const shortcutsBlock = shortcutsMatch[1];
  const count = (shortcutsBlock.match(/\{\s*name\s*:/g) || []).length;

  if (count > 10) {
    return `PWA shortcuts: ${count} found (max 10). Browser will ignore extras with a warning. Remove ${count - 10} shortcut(s).`;
  }
  if (count === 10) {
    return `PWA shortcuts: ${count}/10 (at maximum). No room for more.`;
  }
  return `PWA shortcuts: ${count}/10. ${10 - count} slot(s) available.`;
}

// ─── Validator: Widget registry consistency ───────────────────

export function validateWidgetRegistry(): string {
  const dashboardFile = readFile('packages/shell/src/components/widgets/WidgetDashboard.tsx');

  // Extract WidgetType union: type WidgetType = 'weather' | 'stocks' | ...
  const typeMatch = dashboardFile.match(/type\s+WidgetType\s*=\s*([^;]+)/);
  const widgetTypes = new Set<string>();
  if (typeMatch) {
    const literals = typeMatch[1].match(/'([^']+)'/g);
    if (literals) {
      for (const lit of literals) widgetTypes.add(lit.replace(/'/g, ''));
    }
  }

  // Extract DEFAULT_LAYOUT IDs
  const defaultLayoutIds = new Set<string>();
  const layoutMatch = dashboardFile.match(/DEFAULT_LAYOUT[\s\S]*?=\s*\[([\s\S]*?)\];/);
  if (layoutMatch) {
    const idMatches = layoutMatch[1].match(/id:\s*'([^']+)'/g);
    if (idMatches) {
      for (const m of idMatches) {
        const val = m.match(/id:\s*'([^']+)'/);
        if (val) defaultLayoutIds.add(val[1]);
      }
    }
  }

  // Extract WIDGET_COMPONENTS keys
  const componentKeys = new Set<string>();
  const compMatch = dashboardFile.match(/WIDGET_COMPONENTS[\s\S]*?=\s*\{([\s\S]*?)\}/);
  if (compMatch) {
    const keyMatches = compMatch[1].match(/'([^']+)'\s*:/g);
    if (keyMatches) {
      for (const m of keyMatches) {
        const val = m.match(/'([^']+)'/);
        if (val) componentKeys.add(val[1]);
      }
    }
  }

  // Extract WIDGET_ROUTES keys if present
  const routeKeys = new Set<string>();
  const routeMatch = dashboardFile.match(/WIDGET_ROUTES[\s\S]*?=\s*\{([\s\S]*?)\}/);
  if (routeMatch) {
    const keyMatches = routeMatch[1].match(/'([^']+)'\s*:/g);
    if (keyMatches) {
      for (const m of keyMatches) {
        const val = m.match(/'([^']+)'/);
        if (val) routeKeys.add(val[1]);
      }
    }
  }

  const issues: string[] = [];
  const allIds = new Set([...widgetTypes, ...defaultLayoutIds, ...componentKeys, ...routeKeys]);

  for (const id of allIds) {
    const inType = widgetTypes.has(id);
    const inLayout = defaultLayoutIds.has(id);
    const inComponents = componentKeys.has(id);
    const inRoutes = routeKeys.size > 0 ? routeKeys.has(id) : true; // skip if no WIDGET_ROUTES found

    const missing: string[] = [];
    if (!inType) missing.push('WidgetType');
    if (!inLayout) missing.push('DEFAULT_LAYOUT');
    if (!inComponents) missing.push('WIDGET_COMPONENTS');
    if (routeKeys.size > 0 && !inRoutes) missing.push('WIDGET_ROUTES');

    if (missing.length > 0) {
      issues.push(`'${id}' missing from: ${missing.join(', ')}`);
    }
  }

  if (issues.length === 0) {
    return `Widget registry is consistent (${allIds.size} widgets across WidgetType, DEFAULT_LAYOUT, WIDGET_COMPONENTS${routeKeys.size > 0 ? ', WIDGET_ROUTES' : ''}).`;
  }
  return `Widget registry mismatches:\n\n${issues.join('\n')}`;
}

// ─── Validator: Run all ───────────────────────────────────────

export function validateAll(): string {
  const sections = [
    { title: 'i18n Sync', result: validateI18n() },
    { title: 'Dockerfile', result: validateDockerfile() },
    { title: 'PWA Shortcuts', result: validatePwaShortcuts() },
    { title: 'Widget Registry', result: validateWidgetRegistry() },
  ];

  return sections
    .map(s => `## ${s.title}\n${s.result}`)
    .join('\n\n');
}
