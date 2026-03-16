import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

// ─── Types ───────────────────────────────────────────────────

export interface ValidatorResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  summary: string;
  details?: {
    missing?: string[];
    extra?: string[];
    warnings?: string[];
  };
  count?: number;
  limit?: number;
}

// ─── Helpers ──────────────────────────────────────────────────

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

function listDirs(relPath: string): string[] {
  return fs.readdirSync(path.join(ROOT, relPath), { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

function statusEmoji(status: ValidatorResult['status']): string {
  switch (status) {
    case 'pass': return '\u2705';
    case 'warn': return '\u26a0\ufe0f';
    case 'fail': return '\u274c';
  }
}

// ─── Validator: i18n key sync ─────────────────────────────────

export function validateI18nStructured(): ValidatorResult {
  const localeDir = 'packages/shared/src/i18n/locales';
  const localeFiles = { en: 'en.ts', es: 'es.ts', zh: 'zh.ts' };

  const keysByLocale: Record<string, Set<string>> = {};

  for (const [locale, file] of Object.entries(localeFiles)) {
    const content = readFile(path.join(localeDir, file));
    const keys = new Set<string>();
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

  const missingEntries: string[] = [];
  let totalMissing = 0;

  for (const [locale, keys] of Object.entries(keysByLocale)) {
    const missing = [...allKeys].filter(k => !keys.has(k));
    totalMissing += missing.length;
    for (const k of missing) {
      missingEntries.push(`${locale}: ${k}`);
    }
  }

  if (totalMissing === 0) {
    return {
      name: 'i18n Sync',
      status: 'pass',
      summary: `All 3 locales are in sync (${allKeys.size} keys each).`,
      count: allKeys.size,
    };
  }

  if (totalMissing <= 2) {
    return {
      name: 'i18n Sync',
      status: 'warn',
      summary: `${totalMissing} missing key(s) across locales (likely typo).`,
      details: { missing: missingEntries },
      count: allKeys.size,
    };
  }

  return {
    name: 'i18n Sync',
    status: 'fail',
    summary: `${totalMissing} missing key(s) across locales.`,
    details: { missing: missingEntries },
    count: allKeys.size,
  };
}

/** @deprecated Use validateI18nStructured() for structured results */
export function validateI18n(): string {
  return formatResult(validateI18nStructured());
}

// ─── Validator: Dockerfile packages ───────────────────────────

export function validateDockerfileStructured(): ValidatorResult {
  const dockerfile = readFile('deploy/docker/Dockerfile');
  const actualPackages = new Set(listDirs('packages'));

  const buildCopies = new Set<string>();
  const buildRegex = /COPY\s+packages\/([a-z-]+)\/package\.json/g;
  let match: RegExpExecArray | null;
  while ((match = buildRegex.exec(dockerfile)) !== null) {
    buildCopies.add(match[1]);
  }

  const runtimeCopies = new Set<string>();
  const runtimeRegex = /COPY\s+--from=builder.*?packages\/([a-z-]+)\/dist/g;
  while ((match = runtimeRegex.exec(dockerfile)) !== null) {
    runtimeCopies.add(match[1]);
  }

  const missingEntries: string[] = [];
  const extraEntries: string[] = [];

  const missingBuild = [...actualPackages].filter(p => !buildCopies.has(p));
  for (const p of missingBuild) {
    missingEntries.push(`Build stage: ${p}`);
  }

  const extraBuild = [...buildCopies].filter(p => !actualPackages.has(p));
  for (const p of extraBuild) {
    extraEntries.push(`Build stage: ${p}`);
  }

  const missingRuntime = [...actualPackages].filter(p => !runtimeCopies.has(p) && p !== 'shared');
  for (const p of missingRuntime) {
    missingEntries.push(`Runtime stage: ${p}`);
  }

  const extraRuntime = [...runtimeCopies].filter(p => !actualPackages.has(p));
  for (const p of extraRuntime) {
    extraEntries.push(`Runtime stage: ${p}`);
  }

  const hasMissing = missingEntries.length > 0;
  const hasExtra = extraEntries.length > 0;

  if (!hasMissing && !hasExtra) {
    return {
      name: 'Dockerfile',
      status: 'pass',
      summary: `Dockerfile is in sync with packages/ (${actualPackages.size} packages).`,
    };
  }

  if (!hasMissing && hasExtra) {
    return {
      name: 'Dockerfile',
      status: 'warn',
      summary: `Dockerfile has stale references to removed packages.`,
      details: { extra: extraEntries },
    };
  }

  return {
    name: 'Dockerfile',
    status: 'fail',
    summary: `Dockerfile is out of sync with packages/.`,
    details: {
      ...(hasMissing ? { missing: missingEntries } : {}),
      ...(hasExtra ? { extra: extraEntries } : {}),
    },
  };
}

/** @deprecated Use validateDockerfileStructured() for structured results */
export function validateDockerfile(): string {
  return formatResult(validateDockerfileStructured());
}

// ─── Validator: PWA shortcuts count ───────────────────────────

export function validatePwaShortcutsStructured(): ValidatorResult {
  const viteConfig = readFile('packages/shell/vite.config.ts');

  const shortcutsMatch = viteConfig.match(/shortcuts\s*:\s*\[([\s\S]*?)\]/);
  if (!shortcutsMatch) {
    return {
      name: 'PWA Shortcuts',
      status: 'warn',
      summary: 'No PWA shortcuts array found in packages/shell/vite.config.ts.',
      count: 0,
      limit: 10,
      details: { warnings: ['No shortcuts array found in vite.config.ts'] },
    };
  }

  const shortcutsBlock = shortcutsMatch[1];
  const count = (shortcutsBlock.match(/\{\s*name\s*:/g) || []).length;

  if (count > 10) {
    return {
      name: 'PWA Shortcuts',
      status: 'fail',
      summary: `PWA shortcuts: ${count} found (max 10). Browser will ignore extras. Remove ${count - 10} shortcut(s).`,
      count,
      limit: 10,
    };
  }

  if (count === 10) {
    return {
      name: 'PWA Shortcuts',
      status: 'warn',
      summary: `PWA shortcuts: ${count}/10 (at maximum). No room for more.`,
      count,
      limit: 10,
    };
  }

  return {
    name: 'PWA Shortcuts',
    status: 'pass',
    summary: `PWA shortcuts: ${count}/10. ${10 - count} slot(s) available.`,
    count,
    limit: 10,
  };
}

/** @deprecated Use validatePwaShortcutsStructured() for structured results */
export function validatePwaShortcuts(): string {
  return formatResult(validatePwaShortcutsStructured());
}

// ─── Validator: Widget registry consistency ───────────────────

export function validateWidgetRegistryStructured(): ValidatorResult {
  const dashboardFile = readFile('packages/shell/src/components/widgets/widgetConfig.ts');

  const typeMatch = dashboardFile.match(/type\s+WidgetType\s*=\s*([^;]+)/);
  const widgetTypes = new Set<string>();
  if (typeMatch) {
    const literals = typeMatch[1].match(/'([^']+)'/g);
    if (literals) {
      for (const lit of literals) widgetTypes.add(lit.replace(/'/g, ''));
    }
  }

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

  const missingEntries: string[] = [];
  const warningEntries: string[] = [];
  const allIds = new Set([...widgetTypes, ...defaultLayoutIds, ...componentKeys, ...routeKeys]);
  let hasCriticalMissing = false;

  for (const id of allIds) {
    const inType = widgetTypes.has(id);
    const inLayout = defaultLayoutIds.has(id);
    const inComponents = componentKeys.has(id);
    const inRoutes = routeKeys.size > 0 ? routeKeys.has(id) : true;

    const missing: string[] = [];
    if (!inType) missing.push('WidgetType');
    if (!inLayout) missing.push('DEFAULT_LAYOUT');
    if (!inComponents) missing.push('WIDGET_COMPONENTS');
    if (routeKeys.size > 0 && !inRoutes) missing.push('WIDGET_ROUTES');

    if (missing.length > 0) {
      const entry = `'${id}' missing from: ${missing.join(', ')}`;
      // Missing only from DEFAULT_LAYOUT is a warning (optional widget)
      if (missing.length === 1 && missing[0] === 'DEFAULT_LAYOUT') {
        warningEntries.push(entry);
      } else {
        missingEntries.push(entry);
        hasCriticalMissing = true;
      }
    }
  }

  if (!hasCriticalMissing && warningEntries.length === 0) {
    return {
      name: 'Widget Registry',
      status: 'pass',
      summary: `Widget registry is consistent (${allIds.size} widgets across WidgetType, DEFAULT_LAYOUT, WIDGET_COMPONENTS${routeKeys.size > 0 ? ', WIDGET_ROUTES' : ''}).`,
    };
  }

  if (!hasCriticalMissing && warningEntries.length > 0) {
    return {
      name: 'Widget Registry',
      status: 'warn',
      summary: `Widget registry has optional mismatches.`,
      details: { warnings: warningEntries },
    };
  }

  return {
    name: 'Widget Registry',
    status: 'fail',
    summary: `Widget registry mismatches found.`,
    details: {
      missing: missingEntries,
      ...(warningEntries.length > 0 ? { warnings: warningEntries } : {}),
    },
  };
}

/** @deprecated Use validateWidgetRegistryStructured() for structured results */
export function validateWidgetRegistry(): string {
  return formatResult(validateWidgetRegistryStructured());
}

// ─── Format helper ────────────────────────────────────────────

function formatResult(result: ValidatorResult): string {
  const lines: string[] = [result.summary];

  if (result.details?.missing && result.details.missing.length > 0) {
    lines.push('');
    lines.push('Missing:');
    for (const m of result.details.missing) {
      lines.push(`  - ${m}`);
    }
  }

  if (result.details?.extra && result.details.extra.length > 0) {
    lines.push('');
    lines.push('Stale references:');
    for (const e of result.details.extra) {
      lines.push(`  - ${e}`);
    }
  }

  if (result.details?.warnings && result.details.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    for (const w of result.details.warnings) {
      lines.push(`  - ${w}`);
    }
  }

  return lines.join('\n');
}

// ─── Validator: Run all ───────────────────────────────────────

export function validateAllStructured(): ValidatorResult[] {
  return [
    validateI18nStructured(),
    validateDockerfileStructured(),
    validatePwaShortcutsStructured(),
    validateWidgetRegistryStructured(),
  ];
}

export function validateAll(): string {
  const results = validateAllStructured();

  return results
    .map(r => {
      const emoji = statusEmoji(r.status);
      const lines: string[] = [`## ${emoji} ${r.name}`, r.summary];

      if (r.details?.missing && r.details.missing.length > 0) {
        for (const m of r.details.missing) {
          lines.push(`- ${m}`);
        }
      }

      if (r.details?.extra && r.details.extra.length > 0) {
        for (const e of r.details.extra) {
          lines.push(`- (stale) ${e}`);
        }
      }

      if (r.details?.warnings && r.details.warnings.length > 0) {
        for (const w of r.details.warnings) {
          lines.push(`- ${w}`);
        }
      }

      return lines.join('\n');
    })
    .join('\n\n');
}
