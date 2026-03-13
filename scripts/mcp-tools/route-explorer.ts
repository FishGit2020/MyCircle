import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

interface RouteInfo { path: string; component: string; mfeName: string | null; requiresAuth: boolean; isDynamic: boolean; }
interface RouteDetail extends RouteInfo { breadcrumbKey: string | null; widgetId: string | null; widgetRoute: string | null; navGroup: string | null; inBottomNav: boolean; inCommandPalette: boolean; inQuickAccess: boolean; }

function parseRoutes(): RouteInfo[] {
  const appContent = readFile('packages/shell/src/App.tsx');
  const routes: RouteInfo[] = [];
  const mfeMap = new Map<string, string>();
  const mfeRegex = /const\s+(\w+MF)\s*=\s*tracedLazy\(\s*'[^']+',\s*\(\)\s*=>\s*import\('([^']+)\/[^']+'\)/g;
  let m: RegExpExecArray | null;
  while ((m = mfeRegex.exec(appContent)) !== null) mfeMap.set(m[1], m[2]);
  const routeRegex = /<Route\s+(?:(?:index\s+)?path="([^"]*?)"\s+)?(?:index\s+)?element=\{(.*?)\}\s*\/>/g;
  const indexRegex = /<Route\s+index\s+element=\{(.*?)\}\s*\/>/g;
  while ((m = routeRegex.exec(appContent)) !== null) {
    const routePath = m[1] ?? '/'; const elementStr = m[2];
    if (routePath === '*') continue;
    const requiresAuth = elementStr.includes('<RequireAuth');
    let component: string; let mfeName: string | null = null;
    const mfeMatch = elementStr.match(/component=\{(\w+)\}\s+name="([^"]+)"/);
    if (mfeMatch) { component = mfeMatch[2]; mfeName = mfeMap.get(mfeMatch[1]) ?? null; }
    else { const dm = elementStr.match(/<(\w+)\s/) ?? elementStr.match(/<(\w+)\/>/); component = dm ? dm[1] : 'Unknown'; }
    routes.push({ path: '/' + routePath, component, mfeName, requiresAuth, isDynamic: routePath.includes(':') || routePath.includes('*') });
  }
  let idxMatch: RegExpExecArray | null;
  while ((idxMatch = indexRegex.exec(appContent)) !== null) {
    const dm = idxMatch[1].match(/<(\w+)\s*\/?>/);
    if (!routes.find(r => r.path === '/')) routes.push({ path: '/', component: dm ? dm[1] : 'Unknown', mfeName: null, requiresAuth: false, isDynamic: false });
  }
  for (const r of routes) { if (r.path.startsWith('//')) r.path = r.path.slice(1); }
  const seen = new Set<string>();
  const deduped = routes.filter(r => { if (seen.has(r.path)) return false; seen.add(r.path); return true; });
  deduped.sort((a, b) => { if (a.isDynamic !== b.isDynamic) return a.isDynamic ? 1 : -1; return a.path.localeCompare(b.path); });
  return deduped;
}

function parseBreadcrumbKeys(): Record<string, string> {
  const content = readFile('packages/shell/src/routeConfig.ts');
  const map: Record<string, string> = {};
  const regex = /(?:['"]([a-zA-Z][a-zA-Z0-9-]*)['"]|([a-zA-Z][a-zA-Z0-9]*))\s*:\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) { map[m[1] ?? m[2]] = m[3]; }
  return map;
}

function parseWidgetRoutes(): Record<string, string> {
  const content = readFile('packages/shell/src/components/widgets/widgetConfig.ts');
  const rm = content.match(/WIDGET_ROUTES[\s\S]*?=\s*\{([\s\S]*?)\};/);
  if (!rm) return {};
  const map: Record<string, string> = {};
  const regex = /(\w+)\s*:\s*'([^']+)'/g; let m: RegExpExecArray | null;
  while ((m = regex.exec(rm[1])) !== null) map[m[2]] = m[1];
  return map;
}

function parseNavGroups(): Record<string, string> {
  const content = readFile('packages/shell/src/lib/navConfig.ts');
  const map: Record<string, string> = {};
  const gRegex = /labelKey:\s*'([^']+)'(?:\s*as\s*any)?,\s*items:\s*\[([\s\S]*?)\]/g;
  let gm: RegExpExecArray | null;
  while ((gm = gRegex.exec(content)) !== null) {
    const pRegex = /path:\s*'([^']+)'/g; let pm: RegExpExecArray | null;
    while ((pm = pRegex.exec(gm[2])) !== null) map[pm[1]] = gm[1];
  }
  return map;
}

function parseBottomNavPaths(): Set<string> {
  const content = readFile('packages/shell/src/lib/navConfig.ts');
  const paths = new Set<string>();
  const m = content.match(/ALL_NAV_ITEMS[\s\S]*?=\s*\[([\s\S]*?)\];/);
  if (m) { const r = /path:\s*'([^']+)'/g; let pm: RegExpExecArray | null; while ((pm = r.exec(m[1])) !== null) paths.add(pm[1]); }
  return paths;
}

function parseCommandPalettePaths(): Set<string> {
  const content = readFile('packages/shell/src/components/layout/CommandPalette.tsx');
  const paths = new Set<string>();
  const r = /['"]\/([a-zA-Z][a-zA-Z0-9-]*)['"](?:\s*:|,\s*description)/g;
  let m: RegExpExecArray | null;
  while ((m = r.exec(content)) !== null) paths.add('/' + m[1]);
  if (content.includes("description: '/'")) paths.add('/');
  return paths;
}

function parseQuickAccessPaths(): Set<string> {
  const content = readFile('packages/shell/src/components/layout/QuickAccessTiles.tsx');
  const paths = new Set<string>();
  const r = /path:\s*'([^']+)'/g; let m: RegExpExecArray | null;
  while ((m = r.exec(content)) !== null) paths.add(m[1]);
  return paths;
}

/** List all routes defined in App.tsx as a markdown table. */
export function listAllRoutes(): string {
  const routes = parseRoutes();
  const rows = routes.map(r => `| \`${r.path}\` | ${r.component} | ${r.mfeName ?? '-'} | ${r.requiresAuth ? 'Yes' : 'No'} | ${r.isDynamic ? 'Yes' : 'No'} |`);
  return [`# All Routes (${routes.length})`, '', '| Path | Component | MFE | Auth | Dynamic |', '|------|-----------|-----|------|---------|', ...rows].join('\n');
}

/** Get detailed information about a specific route. */
export function routeDetail(routePath: string): string {
  const routes = parseRoutes();
  const breadcrumbs = parseBreadcrumbKeys();
  const widgetRoutes = parseWidgetRoutes();
  const navGroups = parseNavGroups();
  const bottomNav = parseBottomNavPaths();
  const cmdPalette = parseCommandPalettePaths();
  const quickAccess = parseQuickAccessPaths();

  let route = routes.find(r => r.path === routePath) ?? routes.find(r => r.path.startsWith(routePath + '/'));
  if (!route) { const seg = routePath.replace(/^\//, '').split('/')[0]; route = routes.find(r => r.path === '/' + seg); }
  if (!route) return `No route found for path: ${routePath}\n\nAvailable routes:\n${routes.map(r => `- ${r.path}`).join('\n')}`;

  const seg = route.path.replace(/^\//, '').split('/')[0];
  const d: RouteDetail = { ...route, breadcrumbKey: breadcrumbs[seg] ?? null, widgetId: widgetRoutes['/' + seg] ?? null, widgetRoute: widgetRoutes['/' + seg] ? '/' + seg : null, navGroup: navGroups['/' + seg] ?? null, inBottomNav: bottomNav.has('/' + seg), inCommandPalette: cmdPalette.has('/' + seg), inQuickAccess: quickAccess.has('/' + seg) };

  const s = [`# Route: ${d.path}`, '', '## Basic Info', `- **Path**: \`${d.path}\``, `- **Component**: ${d.component}`, `- **MFE module**: ${d.mfeName ?? '(shell page)'}`, `- **Requires auth**: ${d.requiresAuth ? 'Yes' : 'No'}`, `- **Dynamic segments**: ${d.isDynamic ? 'Yes' : 'No'}`, '', '## Integration Points', `- **Breadcrumb label key**: ${d.breadcrumbKey ?? '(none)'}`, `- **Widget ID**: ${d.widgetId ?? '(none)'}`, `- **Nav group**: ${d.navGroup ?? '(none)'}`, `- **In BottomNav**: ${d.inBottomNav ? 'Yes' : 'No'}`, `- **In CommandPalette**: ${d.inCommandPalette ? 'Yes' : 'No'}`, `- **In QuickAccess**: ${d.inQuickAccess ? 'Yes' : 'No'}`];
  const siblings = routes.filter(r => r.path !== route!.path && r.path.replace(/^\//, '').split('/')[0] === seg);
  if (siblings.length > 0) s.push('', '## Sibling Routes', ...siblings.map(r => `- \`${r.path}\`${r.isDynamic ? ' (dynamic)' : ''}`));
  return s.join('\n');
}

/** Find integration gaps: routes missing from breadcrumbs, widgets, navigation, quick access. */
export function findRouteGaps(): string {
  const routes = parseRoutes();
  const breadcrumbs = parseBreadcrumbKeys();
  const widgetRoutes = parseWidgetRoutes();
  const navGroups = parseNavGroups();
  const bottomNav = parseBottomNavPaths();
  const cmdPalette = parseCommandPalettePaths();
  const quickAccess = parseQuickAccessPaths();

  const skip = new Set(['/', '/whats-new', '/privacy', '/terms', '/trash', '/weather/compare']);
  const primary = new Map<string, RouteInfo>();
  for (const r of routes) { const seg = r.path.replace(/^\//, '').split('/')[0]; if (!skip.has(r.path) && !primary.has(seg)) primary.set(seg, r); }

  const gaps: { title: string; items: string[]; file: string }[] = [
    { title: 'Routes without breadcrumb config', items: [], file: 'packages/shell/src/routeConfig.ts' },
    { title: 'Routes without widget config', items: [], file: 'packages/shell/src/components/widgets/widgetConfig.ts' },
    { title: 'Routes not in navigation (NAV_GROUPS)', items: [], file: 'packages/shell/src/lib/navConfig.ts' },
    { title: 'Routes not in BottomNav (ALL_NAV_ITEMS)', items: [], file: 'packages/shell/src/lib/navConfig.ts' },
    { title: 'Routes not in CommandPalette', items: [], file: 'packages/shell/src/components/layout/CommandPalette.tsx' },
    { title: 'Routes not in QuickAccess', items: [], file: 'packages/shell/src/components/layout/QuickAccessTiles.tsx' },
  ];

  for (const [seg, r] of primary) {
    const p = '/' + seg; const label = `\`${p}\` (${r.component})`;
    if (!breadcrumbs[seg]) gaps[0].items.push(label);
    if (!widgetRoutes[p]) gaps[1].items.push(label);
    if (!navGroups[p]) gaps[2].items.push(label);
    if (!bottomNav.has(p)) gaps[3].items.push(label);
    if (!cmdPalette.has(p)) gaps[4].items.push(label);
    if (!quickAccess.has(p)) gaps[5].items.push(label);
  }

  let total = 0;
  const s: string[] = ['# Route Integration Gaps', ''];
  for (const g of gaps) {
    s.push(`## ${g.title}`);
    if (g.items.length === 0) { s.push('None -- all routes covered.'); }
    else { total += g.items.length; s.push(`File: \`${g.file}\``, '', ...g.items.map(i => `- ${i}`)); }
    s.push('');
  }
  s.splice(2, 0, total === 0 ? `All ${primary.size} primary routes are fully integrated across all 6 checkpoints.` : `Found ${total} gap(s) across ${primary.size} primary routes.`, '');
  return s.join('\n');
}
