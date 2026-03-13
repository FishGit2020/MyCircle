import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const PACKAGES_DIR = path.join(ROOT, 'packages');

// ─── Types ────────────────────────────────────────────────────

interface ComponentInfo {
  name: string;
  filePath: string;       // relative to ROOT
  package: string;
  kind: 'component' | 'hook';
  exported: boolean;
  props: PropInfo[];
  hooks: string[];
  imports: string[];
  i18nKeys: string[];
  ariaAttributes: string[];
  childComponents: string[];
}

interface PropInfo {
  name: string;
  type: string;
  optional: boolean;
}

interface MfeFeatures {
  package: string;
  components: string[];
  hooks: string[];
  mainComponent: string | null;
  route: string | null;
  keyFeatures: string[];
}

// ─── Cache ────────────────────────────────────────────────────

let componentCache: ComponentInfo[] | null = null;

function invalidateCache(): void {
  componentCache = null;
}

// ─── File scanning helpers ────────────────────────────────────

function listPackages(): string[] {
  try {
    return fs.readdirSync(PACKAGES_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch { return []; }
}

function listFiles(dir: string, ext: string): string[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter(f => f.isFile() && f.name.endsWith(ext))
      .map(f => path.join(dir, f.name));
  } catch { return []; }
}

function readFileSafe(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch { return ''; }
}

function relPath(absPath: string): string {
  return path.relative(ROOT, absPath).replace(/\\/g, '/');
}

// ─── Extraction helpers ───────────────────────────────────────

function extractProps(content: string): PropInfo[] {
  const props: PropInfo[] = [];

  // Match interface ...Props { ... } or type ...Props = { ... }
  const interfaceRegex = /(?:interface|type)\s+\w*Props\w*\s*(?:=\s*)?\{([^}]*)\}/gs;
  let match: RegExpExecArray | null;

  while ((match = interfaceRegex.exec(content)) !== null) {
    const block = match[1];
    // Match individual prop lines: name?: type; or name: type;
    const propRegex = /(\w+)(\?)?:\s*([^;\n]+)/g;
    let propMatch: RegExpExecArray | null;
    while ((propMatch = propRegex.exec(block)) !== null) {
      props.push({
        name: propMatch[1],
        type: propMatch[3].trim(),
        optional: propMatch[2] === '?',
      });
    }
  }

  // Also check for inline destructured props like { style, onMapReady }: Props
  // in the function signature — already covered by interface extraction above

  return props;
}

function extractHooksUsed(content: string): string[] {
  const hooks = new Set<string>();
  const hookRegex = /\buse[A-Z]\w+/g;
  let match: RegExpExecArray | null;
  while ((match = hookRegex.exec(content)) !== null) {
    hooks.add(match[0]);
  }
  return [...hooks].sort();
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function extractI18nKeys(content: string): string[] {
  const keys: string[] = [];
  // Match t('key') or t("key") but not import('...') or other functions ending in t
  const keyRegex = /(?<![.\w])t\(\s*['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = keyRegex.exec(content)) !== null) {
    // Filter out obvious non-i18n matches (paths with / or .)
    const key = match[1];
    if (key.includes('/') || key.endsWith('.ts') || key.endsWith('.tsx') || key.endsWith('.js') || key.endsWith('.css')) continue;
    keys.push(key);
  }
  return keys;
}

function extractAriaAttributes(content: string): string[] {
  const attrs = new Set<string>();
  const ariaRegex = /aria-[\w-]+/g;
  let match: RegExpExecArray | null;
  while ((match = ariaRegex.exec(content)) !== null) {
    attrs.add(match[0]);
  }
  return [...attrs].sort();
}

function extractChildComponents(content: string): string[] {
  const children = new Set<string>();
  // Match JSX tags: <ComponentName or <ComponentName>
  const jsxRegex = /<([A-Z]\w+)/g;
  let match: RegExpExecArray | null;
  while ((match = jsxRegex.exec(content)) !== null) {
    children.add(match[1]);
  }
  return [...children].sort();
}

function extractComponentName(content: string, fileName: string): { name: string; exported: boolean } {
  // export default function ComponentName
  const defaultFuncMatch = content.match(/export\s+default\s+function\s+(\w+)/);
  if (defaultFuncMatch) return { name: defaultFuncMatch[1], exported: true };

  // export default memo(function ComponentName
  const memoFuncMatch = content.match(/export\s+default\s+(?:React\.)?memo\(function\s+(\w+)/);
  if (memoFuncMatch) return { name: memoFuncMatch[1], exported: true };

  // const ComponentName = ... ; export default ComponentName
  const constExportMatch = content.match(/export\s+default\s+(\w+)/);
  if (constExportMatch) return { name: constExportMatch[1], exported: true };

  // export function ComponentName
  const exportFuncMatch = content.match(/export\s+function\s+(\w+)/);
  if (exportFuncMatch) return { name: exportFuncMatch[1], exported: true };

  // function ComponentName (not exported)
  const funcMatch = content.match(/function\s+(\w+)/);
  if (funcMatch) return { name: funcMatch[1], exported: false };

  // Fall back to file name
  const baseName = path.basename(fileName, path.extname(fileName));
  return { name: baseName, exported: false };
}

function extractHookName(content: string, fileName: string): { name: string; exported: boolean } {
  // export function useXxx or export const useXxx
  const exportMatch = content.match(/export\s+(?:function|const)\s+(use\w+)/);
  if (exportMatch) return { name: exportMatch[1], exported: true };

  // export default function useXxx
  const defaultMatch = content.match(/export\s+default\s+function\s+(use\w+)/);
  if (defaultMatch) return { name: defaultMatch[1], exported: true };

  // Fall back to file name
  const baseName = path.basename(fileName, path.extname(fileName));
  return { name: baseName, exported: false };
}

// ─── Scanning ─────────────────────────────────────────────────

function scanAllComponents(): ComponentInfo[] {
  if (componentCache) return componentCache;

  const results: ComponentInfo[] = [];
  const packages = listPackages();

  for (const pkg of packages) {
    const componentsDir = path.join(PACKAGES_DIR, pkg, 'src', 'components');
    const hooksDir = path.join(PACKAGES_DIR, pkg, 'src', 'hooks');

    // Scan components (skip test files)
    const componentFiles = listFiles(componentsDir, '.tsx')
      .filter(f => !f.endsWith('.test.tsx') && !f.endsWith('.css'));

    for (const filePath of componentFiles) {
      const content = readFileSafe(filePath);
      if (!content) continue;

      const { name, exported } = extractComponentName(content, filePath);
      results.push({
        name,
        filePath: relPath(filePath),
        package: pkg,
        kind: 'component',
        exported,
        props: extractProps(content),
        hooks: extractHooksUsed(content),
        imports: extractImports(content),
        i18nKeys: extractI18nKeys(content),
        ariaAttributes: extractAriaAttributes(content),
        childComponents: extractChildComponents(content),
      });
    }

    // Scan hooks (skip test files and index files)
    const hookFiles = listFiles(hooksDir, '.ts')
      .filter(f => !f.endsWith('.test.ts') && !f.endsWith('.d.ts') && !f.endsWith('index.ts'));

    for (const filePath of hookFiles) {
      const content = readFileSafe(filePath);
      if (!content) continue;

      const { name, exported } = extractHookName(content, filePath);
      results.push({
        name,
        filePath: relPath(filePath),
        package: pkg,
        kind: 'hook',
        exported,
        props: extractProps(content),
        hooks: extractHooksUsed(content),
        imports: extractImports(content),
        i18nKeys: extractI18nKeys(content),
        ariaAttributes: [],
        childComponents: [],
      });
    }
  }

  componentCache = results;
  return results;
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Search for components/hooks matching a query string.
 * Searches component names, prop names, hook names, i18n keys,
 * import paths, and aria attributes.
 */
export function exploreComponents(query: string, pkg?: string): string {
  invalidateCache(); // fresh scan each call for correctness
  const all = scanAllComponents();
  const q = query.toLowerCase();

  let filtered = all;
  if (pkg) {
    filtered = filtered.filter(c => c.package === pkg);
  }

  const matches = filtered.filter(c => {
    // Match component/hook name
    if (c.name.toLowerCase().includes(q)) return true;
    // Match prop names
    if (c.props.some(p => p.name.toLowerCase().includes(q))) return true;
    // Match hooks used
    if (c.hooks.some(h => h.toLowerCase().includes(q))) return true;
    // Match import paths (for feature keywords like 'maplibre', 'apollo', 'firebase')
    if (c.imports.some(i => i.toLowerCase().includes(q))) return true;
    // Match i18n keys
    if (c.i18nKeys.some(k => k.toLowerCase().includes(q))) return true;
    // Match aria attributes
    if (c.ariaAttributes.some(a => a.toLowerCase().includes(q))) return true;
    // Match child component names
    if (c.childComponents.some(ch => ch.toLowerCase().includes(q))) return true;
    // Match file path
    if (c.filePath.toLowerCase().includes(q)) return true;
    return false;
  });

  if (matches.length === 0) {
    return `No components or hooks found matching "${query}"${pkg ? ` in package "${pkg}"` : ''}.`;
  }

  const lines = matches.map(c => {
    const propsStr = c.props.length > 0
      ? c.props.map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type}`).join(', ')
      : '(none)';
    const hooksStr = c.hooks.length > 0 ? c.hooks.join(', ') : '(none)';

    return [
      `### ${c.exported ? 'export ' : ''}${c.kind === 'hook' ? 'hook' : 'component'} ${c.name}`,
      `- **Package**: ${c.package}`,
      `- **File**: ${c.filePath}`,
      `- **Props**: ${propsStr}`,
      `- **Hooks used**: ${hooksStr}`,
      c.i18nKeys.length > 0 ? `- **i18n keys**: ${c.i18nKeys.length} (${c.i18nKeys.slice(0, 5).join(', ')}${c.i18nKeys.length > 5 ? '...' : ''})` : null,
      c.ariaAttributes.length > 0 ? `- **ARIA**: ${c.ariaAttributes.join(', ')}` : null,
      c.childComponents.length > 0 ? `- **Children**: ${c.childComponents.join(', ')}` : null,
    ].filter(Boolean).join('\n');
  });

  return `# Components matching "${query}"${pkg ? ` (package: ${pkg})` : ''}\n\nFound ${matches.length} result(s).\n\n${lines.join('\n\n')}`;
}

/**
 * Get detailed information about a specific component file.
 */
export function componentDetail(filePath: string): string {
  // Resolve relative to ROOT if not absolute
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
  const content = readFileSafe(absPath);

  if (!content) {
    return `File not found: ${filePath}`;
  }

  const rel = relPath(absPath);
  const ext = path.extname(absPath);
  const isHook = path.basename(absPath).startsWith('use') && ext === '.ts';
  const isComponent = ext === '.tsx';

  let name: string;
  let exported: boolean;

  if (isHook) {
    ({ name, exported } = extractHookName(content, absPath));
  } else {
    ({ name, exported } = extractComponentName(content, absPath));
  }

  const props = extractProps(content);
  const hooks = extractHooksUsed(content);
  const imports = extractImports(content);
  const i18nKeys = extractI18nKeys(content);
  const ariaAttrs = extractAriaAttributes(content);
  const children = extractChildComponents(content);

  // Count lines
  const lineCount = content.split('\n').length;

  // Extract interfaces/types beyond just Props
  const typeNames: string[] = [];
  const typeRegex = /(?:export\s+)?(?:interface|type)\s+(\w+)/g;
  let typeMatch: RegExpExecArray | null;
  while ((typeMatch = typeRegex.exec(content)) !== null) {
    typeNames.push(typeMatch[1]);
  }

  const sections = [
    `# ${name}`,
    `- **File**: ${rel}`,
    `- **Kind**: ${isHook ? 'hook' : isComponent ? 'component' : 'module'}`,
    `- **Exported**: ${exported ? 'yes' : 'no'}`,
    `- **Lines**: ${lineCount}`,
    '',
    '## Props / Parameters',
    props.length > 0
      ? props.map(p => `- \`${p.name}${p.optional ? '?' : ''}\`: ${p.type}`).join('\n')
      : '(none)',
    '',
    '## Types Defined',
    typeNames.length > 0 ? typeNames.map(t => `- ${t}`).join('\n') : '(none)',
    '',
    '## Hooks Used',
    hooks.length > 0 ? hooks.map(h => `- ${h}`).join('\n') : '(none)',
    '',
    '## Imports',
    imports.length > 0 ? imports.map(i => `- ${i}`).join('\n') : '(none)',
    '',
    '## i18n Keys',
    i18nKeys.length > 0 ? i18nKeys.map(k => `- ${k}`).join('\n') : '(none)',
  ];

  if (isComponent) {
    sections.push(
      '',
      '## ARIA Attributes',
      ariaAttrs.length > 0 ? ariaAttrs.map(a => `- ${a}`).join('\n') : '(none)',
      '',
      '## Child Components',
      children.length > 0 ? children.map(c => `- ${c}`).join('\n') : '(none)',
    );
  }

  return sections.join('\n');
}

/**
 * List all MFE packages with their key features, components, and hooks.
 */
export function listMfeFeatures(): string {
  invalidateCache(); // fresh scan
  const all = scanAllComponents();
  const packages = listPackages();

  // Infer route from package name
  function inferRoute(pkg: string): string {
    // Common pattern: package-name -> /package-name
    return `/${pkg}`;
  }

  // Infer key features from component names and hooks
  function inferFeatures(components: ComponentInfo[]): string[] {
    const features = new Set<string>();
    for (const c of components) {
      // Map presence: MapView, MapLibre imports
      if (c.imports.some(i => i.includes('maplibre'))) features.add('map/geospatial');
      // Real-time: onSnapshot, WebSocket
      if (c.imports.some(i => i.includes('firebase') || i.includes('firestore'))) features.add('Firestore data');
      // Audio/media
      if (c.name.toLowerCase().includes('audio') || c.name.toLowerCase().includes('player')) features.add('audio playback');
      // Charts/visualization
      if (c.imports.some(i => i.includes('chart') || i.includes('recharts'))) features.add('charts');
      // Forms
      if (c.childComponents.some(ch => ch === 'form' || ch === 'Form')) features.add('forms');
      if (c.props.some(p => p.name.includes('onSubmit') || p.name.includes('onChange'))) features.add('forms');
      // i18n
      if (c.i18nKeys.length > 0) features.add('i18n');
      // Camera/media capture
      if (c.name.toLowerCase().includes('camera') || c.imports.some(i => i.includes('camera'))) features.add('camera');
      // Pagination
      if (c.name.toLowerCase().includes('pagination') || c.hooks.some(h => h.toLowerCase().includes('pagination'))) features.add('pagination');
      // GraphQL / Apollo
      if (c.imports.some(i => i.includes('apollo') || i.includes('@mycircle/shared')) && c.hooks.some(h => h === 'useQuery' || h === 'useMutation')) features.add('GraphQL');
      // Offline
      if (c.name.toLowerCase().includes('offline')) features.add('offline support');
    }
    return [...features];
  }

  const mfeList: MfeFeatures[] = [];

  for (const pkg of packages) {
    const pkgComponents = all.filter(c => c.package === pkg);
    const components = pkgComponents.filter(c => c.kind === 'component');
    const hooks = pkgComponents.filter(c => c.kind === 'hook');

    // Main component: typically same name as package (PascalCase) or first exported component
    const pascalName = pkg.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    const mainComponent = components.find(c => c.name === pascalName)?.name
      ?? components.find(c => c.exported)?.name
      ?? null;

    mfeList.push({
      package: pkg,
      components: components.map(c => c.name),
      hooks: hooks.map(h => h.name),
      mainComponent,
      route: inferRoute(pkg),
      keyFeatures: inferFeatures(pkgComponents),
    });
  }

  // Format as table-like output
  const rows = mfeList.map(m => {
    return [
      `### ${m.package}`,
      `- **Main component**: ${m.mainComponent ?? '(none)'}`,
      `- **Route**: ${m.route}`,
      `- **Components** (${m.components.length}): ${m.components.join(', ') || '(none)'}`,
      `- **Hooks** (${m.hooks.length}): ${m.hooks.join(', ') || '(none)'}`,
      `- **Key features**: ${m.keyFeatures.length > 0 ? m.keyFeatures.join(', ') : '(basic)'}`,
    ].join('\n');
  });

  return `# MFE Feature Overview\n\n${mfeList.length} packages scanned.\n\n${rows.join('\n\n')}`;
}
