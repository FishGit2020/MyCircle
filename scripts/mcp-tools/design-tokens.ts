import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const TAILWIND_CONFIG = path.join(ROOT, 'packages', 'shell', 'tailwind.config.js');

// ─── Types ────────────────────────────────────────────────────

interface DesignTokenCategory {
  name: string;
  description: string;
  values: Record<string, string | Record<string, string>>;
}

// ─── Tailwind default tokens (v3 defaults) ───────────────────

const DEFAULT_BREAKPOINTS: Record<string, string> = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

const DEFAULT_SPACING_SUBSET: Record<string, string> = {
  '0': '0px',
  px: '1px',
  '0.5': '0.125rem',
  '1': '0.25rem',
  '1.5': '0.375rem',
  '2': '0.5rem',
  '2.5': '0.625rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '8': '2rem',
  '10': '2.5rem',
  '12': '3rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
  '32': '8rem',
  '40': '10rem',
  '48': '12rem',
  '56': '14rem',
  '64': '16rem',
  '72': '18rem',
  '80': '20rem',
  '96': '24rem',
};

const DEFAULT_FONT_FAMILIES: Record<string, string> = {
  sans: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
};

const DEFAULT_FONT_SIZES: Record<string, string> = {
  xs: '0.75rem (12px)',
  sm: '0.875rem (14px)',
  base: '1rem (16px)',
  lg: '1.125rem (18px)',
  xl: '1.25rem (20px)',
  '2xl': '1.5rem (24px)',
  '3xl': '1.875rem (30px)',
  '4xl': '2.25rem (36px)',
  '5xl': '3rem (48px)',
  '6xl': '3.75rem (60px)',
};

const DEFAULT_COLORS_SUMMARY: Record<string, string> = {
  slate: '50-950 (gray-blue)',
  gray: '50-950 (neutral gray)',
  zinc: '50-950 (cool gray)',
  neutral: '50-950 (true gray)',
  stone: '50-950 (warm gray)',
  red: '50-950',
  orange: '50-950',
  amber: '50-950',
  yellow: '50-950',
  lime: '50-950',
  green: '50-950',
  emerald: '50-950',
  teal: '50-950',
  cyan: '50-950',
  sky: '50-950',
  blue: '50-950',
  indigo: '50-950',
  violet: '50-950',
  purple: '50-950',
  fuchsia: '50-950',
  pink: '50-950',
  rose: '50-950',
  black: '#000',
  white: '#fff',
  transparent: 'transparent',
  current: 'currentColor',
};

// ─── Config parsing ──────────────────────────────────────────

interface ParsedConfig {
  darkMode: string | null;
  contentPaths: string[];
  extendedKeys: string[];
  plugins: string[];
  customKeyframes: Record<string, string>;
  customAnimations: Record<string, string>;
  customColors: Record<string, string>;
  customSpacing: Record<string, string>;
  customFonts: Record<string, string>;
  rawExtend: string;
}

function readConfigSafe(): string {
  try {
    return fs.readFileSync(TAILWIND_CONFIG, 'utf-8');
  } catch {
    return '';
  }
}

function parseConfig(): ParsedConfig {
  const content = readConfigSafe();
  const result: ParsedConfig = {
    darkMode: null,
    contentPaths: [],
    extendedKeys: [],
    plugins: [],
    customKeyframes: {},
    customAnimations: {},
    customColors: {},
    customSpacing: {},
    customFonts: {},
    rawExtend: '',
  };

  if (!content) return result;

  // Dark mode
  const darkModeMatch = content.match(/darkMode\s*:\s*['"](\w+)['"]/);
  if (darkModeMatch) result.darkMode = darkModeMatch[1];

  // Content paths
  const contentMatch = content.match(/content\s*:\s*\[([\s\S]*?)\]/);
  if (contentMatch) {
    const pathRegex = /['"]([^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = pathRegex.exec(contentMatch[1])) !== null) {
      result.contentPaths.push(m[1]);
    }
  }

  // Plugins
  const pluginsMatch = content.match(/plugins\s*:\s*\[([\s\S]*?)\]/);
  if (pluginsMatch) {
    const pluginContent = pluginsMatch[1].trim();
    if (pluginContent) {
      result.plugins = pluginContent.split(',').map(p => p.trim()).filter(Boolean);
    }
  }

  // Extract theme.extend block
  const extendMatch = content.match(/extend\s*:\s*\{([\s\S]*?)\n\s{4}\}/);
  if (extendMatch) {
    result.rawExtend = extendMatch[1];

    // Extract top-level keys in extend
    const keyRegex = /(\w+)\s*:\s*\{/g;
    let km: RegExpExecArray | null;
    while ((km = keyRegex.exec(extendMatch[1])) !== null) {
      result.extendedKeys.push(km[1]);
    }

    // Extract keyframes
    const keyframesMatch = extendMatch[1].match(/keyframes\s*:\s*\{([\s\S]*?)\n\s{6}\}/);
    if (keyframesMatch) {
      const nameRegex = /(\w+)\s*:\s*\{/g;
      let nm: RegExpExecArray | null;
      while ((nm = nameRegex.exec(keyframesMatch[1])) !== null) {
        result.customKeyframes[nm[1]] = '(custom keyframe)';
      }
    }

    // Extract animations
    const animMatch = extendMatch[1].match(/animation\s*:\s*\{([\s\S]*?)\}/);
    if (animMatch) {
      const animRegex = /(\w+)\s*:\s*['"]([^'"]+)['"]/g;
      let am: RegExpExecArray | null;
      while ((am = animRegex.exec(animMatch[1])) !== null) {
        result.customAnimations[am[1]] = am[2];
      }
    }

    // Extract colors if extended
    const colorsMatch = extendMatch[1].match(/colors\s*:\s*\{([\s\S]*?)\}/);
    if (colorsMatch) {
      const colorRegex = /['"]?(\w[\w-]*)['"]?\s*:\s*['"]([^'"]+)['"]/g;
      let cm: RegExpExecArray | null;
      while ((cm = colorRegex.exec(colorsMatch[1])) !== null) {
        result.customColors[cm[1]] = cm[2];
      }
    }

    // Extract spacing if extended
    const spacingMatch = extendMatch[1].match(/spacing\s*:\s*\{([\s\S]*?)\}/);
    if (spacingMatch) {
      const spacingRegex = /['"]?(\w[\w.-]*)['"]?\s*:\s*['"]([^'"]+)['"]/g;
      let sm: RegExpExecArray | null;
      while ((sm = spacingRegex.exec(spacingMatch[1])) !== null) {
        result.customSpacing[sm[1]] = sm[2];
      }
    }

    // Extract fontFamily if extended
    const fontMatch = extendMatch[1].match(/fontFamily\s*:\s*\{([\s\S]*?)\}/);
    if (fontMatch) {
      const fontRegex = /['"]?(\w+)['"]?\s*:\s*\[([^\]]+)\]/g;
      let fm: RegExpExecArray | null;
      while ((fm = fontRegex.exec(fontMatch[1])) !== null) {
        result.customFonts[fm[1]] = fm[2].trim();
      }
    }
  }

  return result;
}

// ─── Scanners: detect Tailwind classes used in codebase ──────

function scanUsedClasses(category: string): string[] {
  const packagesDir = path.join(ROOT, 'packages');
  const used = new Set<string>();

  let dirs: string[];
  try {
    dirs = fs.readdirSync(packagesDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch { return []; }

  const patterns: Record<string, RegExp> = {
    breakpoints: /\b(sm|md|lg|xl|2xl):/g,
    colors: /\b(?:text|bg|border|ring|shadow|outline|fill|stroke|from|via|to|divide|accent|caret|decoration|placeholder)-([a-z]+-\d{2,3}|black|white|transparent|current)\b/g,
  };

  const pattern = patterns[category];
  if (!pattern) return [];

  for (const dir of dirs) {
    const srcDir = path.join(packagesDir, dir, 'src');
    scanFilesRecursive(srcDir, /\.tsx?$/, (content) => {
      let m: RegExpExecArray | null;
      const localPattern = new RegExp(pattern.source, pattern.flags);
      while ((m = localPattern.exec(content)) !== null) {
        if (category === 'breakpoints') {
          used.add(m[1]);
        } else {
          used.add(m[0]);
        }
      }
    });
  }

  return [...used].sort();
}

function scanFilesRecursive(dir: string, ext: RegExp, cb: (content: string) => void): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch { return; }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      scanFilesRecursive(fullPath, ext, cb);
    } else if (entry.isFile() && ext.test(entry.name) && !entry.name.endsWith('.test.tsx') && !entry.name.endsWith('.test.ts')) {
      try {
        cb(fs.readFileSync(fullPath, 'utf-8'));
      } catch { /* skip unreadable files */ }
    }
  }
}

// ─── Public API ──────────────────────────────────────────────

const VALID_CATEGORIES = ['colors', 'spacing', 'breakpoints', 'fonts', 'animations', 'darkMode', 'content'] as const;
type Category = typeof VALID_CATEGORIES[number];

export function exploreDesignTokens(category?: string): string {
  const config = parseConfig();

  if (!category) {
    return formatOverview(config);
  }

  const cat = category.toLowerCase() as Category;
  if (!VALID_CATEGORIES.includes(cat)) {
    return `Unknown category "${category}". Valid categories: ${VALID_CATEGORIES.join(', ')}`;
  }

  switch (cat) {
    case 'colors': return formatColors(config);
    case 'spacing': return formatSpacing(config);
    case 'breakpoints': return formatBreakpoints(config);
    case 'fonts': return formatFonts(config);
    case 'animations': return formatAnimations(config);
    case 'darkMode': return formatDarkMode(config);
    case 'content': return formatContent(config);
  }
}

// ─── Formatters ──────────────────────────────────────────────

function formatOverview(config: ParsedConfig): string {
  const sections: string[] = [
    '# Design Token Overview',
    '',
    `**Config file**: packages/shell/tailwind.config.js`,
    `**Dark mode**: ${config.darkMode ?? '(not set — media query default)'}`,
    `**Plugins**: ${config.plugins.length > 0 ? config.plugins.join(', ') : '(none)'}`,
    `**Content paths**: ${config.contentPaths.length} entries`,
    '',
    '## Categories',
    '',
    `- **colors** — Tailwind v3 default palette (22 color scales) ${Object.keys(config.customColors).length > 0 ? `+ ${Object.keys(config.customColors).length} custom` : '(no custom overrides)'}`,
    `- **spacing** — Default spacing scale (0-96) ${Object.keys(config.customSpacing).length > 0 ? `+ ${Object.keys(config.customSpacing).length} custom` : '(no custom overrides)'}`,
    `- **breakpoints** — ${Object.keys(DEFAULT_BREAKPOINTS).length} default breakpoints (sm, md, lg, xl, 2xl)`,
    `- **fonts** — ${Object.keys(DEFAULT_FONT_FAMILIES).length} default font stacks ${Object.keys(config.customFonts).length > 0 ? `+ ${Object.keys(config.customFonts).length} custom` : '(no custom overrides)'}`,
    `- **animations** — ${Object.keys(config.customKeyframes).length} custom keyframe(s), ${Object.keys(config.customAnimations).length} animation(s)`,
    `- **darkMode** — Strategy and usage info`,
    `- **content** — Scanned file paths for class purging`,
    '',
    '## Extended Theme Keys',
    config.extendedKeys.length > 0
      ? config.extendedKeys.map(k => `- ${k}`).join('\n')
      : '(no theme extensions)',
    '',
    'Use `explore_design_tokens` with a category name for details.',
  ];

  return sections.join('\n');
}

function formatColors(config: ParsedConfig): string {
  const sections: string[] = [
    '# Colors',
    '',
    '## Default Palette (Tailwind v3)',
    'Each color has shades 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950.',
    '',
  ];

  for (const [name, desc] of Object.entries(DEFAULT_COLORS_SUMMARY)) {
    sections.push(`- **${name}**: ${desc}`);
  }

  if (Object.keys(config.customColors).length > 0) {
    sections.push('', '## Custom Colors (theme.extend.colors)');
    for (const [name, value] of Object.entries(config.customColors)) {
      sections.push(`- **${name}**: ${value}`);
    }
  } else {
    sections.push('', '## Custom Colors', '(none — using defaults only)');
  }

  // Show most-used color classes in codebase
  const usedColors = scanUsedClasses('colors');
  if (usedColors.length > 0) {
    // Group by color name
    const colorCounts: Record<string, number> = {};
    for (const cls of usedColors) {
      const colorName = cls.replace(/^(?:text|bg|border|ring|shadow|outline|fill|stroke|from|via|to|divide|accent|caret|decoration|placeholder)-/, '').replace(/-\d+$/, '');
      colorCounts[colorName] = (colorCounts[colorName] || 0) + 1;
    }
    const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
    sections.push('', '## Most-Used Color Families in Codebase');
    for (const [name, count] of sorted) {
      sections.push(`- **${name}**: ${count} variant(s) used`);
    }
  }

  return sections.join('\n');
}

function formatSpacing(config: ParsedConfig): string {
  const sections: string[] = [
    '# Spacing',
    '',
    '## Default Scale (Tailwind v3)',
    'Used for padding (p-), margin (m-), width (w-), height (h-), gap, etc.',
    '',
  ];

  for (const [key, value] of Object.entries(DEFAULT_SPACING_SUBSET)) {
    sections.push(`- **${key}**: ${value}`);
  }

  if (Object.keys(config.customSpacing).length > 0) {
    sections.push('', '## Custom Spacing (theme.extend.spacing)');
    for (const [key, value] of Object.entries(config.customSpacing)) {
      sections.push(`- **${key}**: ${value}`);
    }
  } else {
    sections.push('', '## Custom Spacing', '(none — using defaults only)');
  }

  return sections.join('\n');
}

function formatBreakpoints(config: ParsedConfig): string {
  const usedBreakpoints = scanUsedClasses('breakpoints');

  const sections: string[] = [
    '# Breakpoints',
    '',
    '## Default Breakpoints (Tailwind v3)',
    'Mobile-first: styles apply at min-width and above.',
    '',
  ];

  for (const [name, value] of Object.entries(DEFAULT_BREAKPOINTS)) {
    const isUsed = usedBreakpoints.includes(name);
    sections.push(`- **${name}**: ${value} ${isUsed ? '(used in codebase)' : '(not detected in codebase)'}`);
  }

  sections.push(
    '',
    '## Usage Pattern',
    'MyCircle uses mobile-first design with `md:` as the main breakpoint.',
    'Example: `className="flex flex-col md:flex-row"`',
  );

  return sections.join('\n');
}

function formatFonts(config: ParsedConfig): string {
  const sections: string[] = [
    '# Font Tokens',
    '',
    '## Default Font Families (Tailwind v3)',
    '',
  ];

  for (const [name, value] of Object.entries(DEFAULT_FONT_FAMILIES)) {
    sections.push(`- **font-${name}**: ${value}`);
  }

  if (Object.keys(config.customFonts).length > 0) {
    sections.push('', '## Custom Fonts (theme.extend.fontFamily)');
    for (const [name, value] of Object.entries(config.customFonts)) {
      sections.push(`- **font-${name}**: ${value}`);
    }
  } else {
    sections.push('', '## Custom Fonts', '(none — using defaults only)');
  }

  sections.push('', '## Font Sizes (Tailwind v3 defaults)', '');
  for (const [name, value] of Object.entries(DEFAULT_FONT_SIZES)) {
    sections.push(`- **text-${name}**: ${value}`);
  }

  return sections.join('\n');
}

function formatAnimations(config: ParsedConfig): string {
  const sections: string[] = [
    '# Animations',
    '',
    '## Tailwind Built-in Animations',
    '- **animate-spin**: 1s linear infinite rotation',
    '- **animate-ping**: 1s cubic-bezier scale + fade',
    '- **animate-pulse**: 2s ease-in-out opacity pulse',
    '- **animate-bounce**: 1s infinite bounce',
    '',
  ];

  if (Object.keys(config.customKeyframes).length > 0 || Object.keys(config.customAnimations).length > 0) {
    sections.push('## Custom Keyframes (theme.extend.keyframes)');
    for (const name of Object.keys(config.customKeyframes)) {
      sections.push(`- **${name}**`);
    }

    sections.push('', '## Custom Animations (theme.extend.animation)');
    for (const [name, value] of Object.entries(config.customAnimations)) {
      sections.push(`- **animate-${name}**: ${value}`);
    }
  } else {
    sections.push('## Custom Animations', '(none)');
  }

  return sections.join('\n');
}

function formatDarkMode(config: ParsedConfig): string {
  const sections: string[] = [
    '# Dark Mode',
    '',
    `**Strategy**: ${config.darkMode ?? 'media (default)'}`,
    '',
  ];

  if (config.darkMode === 'class') {
    sections.push(
      'The `class` strategy means dark mode is toggled by adding/removing the `dark` class on a parent element (usually `<html>`).',
      '',
      '**Usage**: Every color utility should have a `dark:` variant.',
      'Example: `className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"`',
      '',
      'MyCircle rule: all color classes must include a `dark:` variant for accessibility.',
    );
  } else {
    sections.push(
      'The `media` strategy respects `prefers-color-scheme` from the OS.',
    );
  }

  return sections.join('\n');
}

function formatContent(config: ParsedConfig): string {
  const sections: string[] = [
    '# Content Paths (Tailwind Purge Config)',
    '',
    `${config.contentPaths.length} paths configured for class scanning:`,
    '',
  ];

  // Group by MFE package
  const shellPaths: string[] = [];
  const mfePaths: string[] = [];

  for (const p of config.contentPaths) {
    if (p.startsWith('./') || p.startsWith('../shared/')) {
      shellPaths.push(p);
    } else {
      // Extract package name from path like "../package-name/src/**"
      const pkgMatch = p.match(/\.\.\/([^/]+)\//);
      if (pkgMatch) {
        mfePaths.push(pkgMatch[1]);
      }
    }
  }

  sections.push('## Shell / Shared');
  for (const p of shellPaths) {
    sections.push(`- ${p}`);
  }

  sections.push('', `## MFE Packages (${mfePaths.length})`);
  for (const pkg of mfePaths) {
    sections.push(`- ${pkg}`);
  }

  return sections.join('\n');
}
