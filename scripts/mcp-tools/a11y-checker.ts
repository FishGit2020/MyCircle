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

function findTsxFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findTsxFiles(full));
    } else if (entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')) {
      results.push(full);
    }
  }
  return results;
}

function relPath(absPath: string): string {
  return path.relative(ROOT, absPath).replace(/\\/g, '/');
}

// ─── Issue types ──────────────────────────────────────────────

interface A11yIssue {
  file: string;
  line: number;
  rule: string;
  message: string;
}

// ─── Check: buttons without type="button" ─────────────────────

function checkButtonType(lines: string[], filePath: string): A11yIssue[] {
  const issues: A11yIssue[] = [];
  // Track whether we're inside a <form> block (simple heuristic)
  let formDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Track form open/close (simple heuristic)
    const formOpens = (line.match(/<form[\s>]/g) || []).length;
    const formCloses = (line.match(/<\/form>/g) || []).length;
    formDepth += formOpens - formCloses;
    if (formDepth < 0) formDepth = 0;

    // Skip if inside a form (submit buttons are valid without type="button")
    if (formDepth > 0) continue;

    const buttonMatch = line.match(/<button\b/);
    if (!buttonMatch) continue;

    // Gather the full tag — it might span multiple lines
    let tag = line;
    let j = i;
    while (!tag.includes('>') && j < lines.length - 1) {
      j++;
      tag += ' ' + lines[j];
    }

    // If the tag has type= attribute, it's fine
    if (/type\s*=\s*["']/.test(tag)) continue;

    issues.push({
      file: filePath,
      line: i + 1,
      rule: 'button-type',
      message: '<button> without type="button" outside a <form> — defaults to type="submit"',
    });
  }

  return issues;
}

// ─── Check: img without alt ───────────────────────────────────

function checkImgAlt(lines: string[], filePath: string): A11yIssue[] {
  const issues: A11yIssue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/<img\b/.test(line)) continue;

    // Gather the full tag
    let tag = line;
    let j = i;
    while (!tag.includes('/>') && !tag.includes('>') && j < lines.length - 1) {
      j++;
      tag += ' ' + lines[j];
    }

    if (!/\balt\s*=/.test(tag)) {
      issues.push({
        file: filePath,
        line: i + 1,
        rule: 'img-alt',
        message: '<img> missing alt attribute',
      });
    }
  }

  return issues;
}

// ─── Check: svg without aria-label or aria-hidden ─────────────

function checkSvgAccessibility(lines: string[], filePath: string): A11yIssue[] {
  const issues: A11yIssue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/<svg\b/.test(line)) continue;

    // Gather the full opening tag
    let tag = line;
    let j = i;
    while (!tag.includes('>') && j < lines.length - 1) {
      j++;
      tag += ' ' + lines[j];
    }

    const hasAriaLabel = /aria-label\s*=/.test(tag);
    const hasAriaHidden = /aria-hidden\s*=/.test(tag);
    const hasRole = /\brole\s*=\s*["']img["']/.test(tag);

    if (!hasAriaLabel && !hasAriaHidden && !hasRole) {
      issues.push({
        file: filePath,
        line: i + 1,
        rule: 'svg-a11y',
        message: '<svg> missing aria-hidden="true" or aria-label',
      });
    }
  }

  return issues;
}

// ─── Check: form inputs without label association ─────────────

function checkInputLabels(lines: string[], filePath: string): A11yIssue[] {
  const issues: A11yIssue[] = [];
  const content = lines.join('\n');

  // Collect all htmlFor/for values from <label> elements
  const labelForIds = new Set<string>();
  const labelForRegex = /(?:htmlFor|for)\s*=\s*["']([^"']+)["']/g;
  let lm: RegExpExecArray | null;
  while ((lm = labelForRegex.exec(content)) !== null) {
    labelForIds.add(lm[1]);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/<(?:input|select|textarea)\b/.test(line)) continue;

    // Gather the full tag
    let tag = line;
    let j = i;
    while (!tag.includes('>') && !tag.includes('/>') && j < lines.length - 1) {
      j++;
      tag += ' ' + lines[j];
    }

    // Skip hidden inputs
    if (/type\s*=\s*["']hidden["']/.test(tag)) continue;

    const hasAriaLabel = /aria-label\s*=/.test(tag);
    const hasAriaLabelledBy = /aria-labelledby\s*=/.test(tag);
    const idMatch = tag.match(/\bid\s*=\s*["']([^"']+)["']/);
    const hasLinkedLabel = idMatch ? labelForIds.has(idMatch[1]) : false;

    if (!hasAriaLabel && !hasAriaLabelledBy && !hasLinkedLabel) {
      issues.push({
        file: filePath,
        line: i + 1,
        rule: 'input-label',
        message: '<input>/<select>/<textarea> without aria-label or associated <label>',
      });
    }
  }

  return issues;
}

// ─── Check: onClick on non-interactive elements ───────────────

function checkClickableNonInteractive(lines: string[], filePath: string): A11yIssue[] {
  const issues: A11yIssue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Look for non-interactive elements with onClick
    const tagMatch = line.match(/<(div|span|p|li|td|section|article|header|footer|main|aside|nav)\b/);
    if (!tagMatch) continue;

    // Gather the full opening tag
    let tag = line;
    let j = i;
    while (!tag.includes('>') && j < lines.length - 1) {
      j++;
      tag += ' ' + lines[j];
    }

    if (!/onClick\s*=/.test(tag)) continue;

    const hasRole = /\brole\s*=/.test(tag);
    const hasTabIndex = /tabIndex\s*=/.test(tag);
    // aria-hidden elements don't need role/tabIndex
    const hasAriaHidden = /aria-hidden\s*=\s*["']true["']/.test(tag);

    if (hasAriaHidden) continue;

    if (!hasRole || !hasTabIndex) {
      const missing: string[] = [];
      if (!hasRole) missing.push('role');
      if (!hasTabIndex) missing.push('tabIndex');
      issues.push({
        file: filePath,
        line: i + 1,
        rule: 'click-role',
        message: `<${tagMatch[1]}> with onClick missing ${missing.join(' and ')} — non-interactive element needs role and tabIndex for keyboard access`,
      });
    }
  }

  return issues;
}

// ─── Check: icon-only buttons without aria-label ──────────────

function checkIconOnlyButtons(lines: string[], filePath: string): A11yIssue[] {
  const issues: A11yIssue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/<button\b/.test(line)) continue;

    // Gather the full opening tag
    let openTag = line;
    let j = i;
    while (!openTag.includes('>') && j < lines.length - 1) {
      j++;
      openTag += ' ' + lines[j];
    }

    // If button already has aria-label, it's fine
    if (/aria-label\s*=/.test(openTag)) continue;

    // Check if the button body (up to </button>) contains only SVG/icon elements and no text
    let body = '';
    let k = j;
    // Start collecting after the opening tag's '>'
    const afterOpen = openTag.substring(openTag.indexOf('>') + 1);
    body += afterOpen;
    while (k < lines.length - 1 && !body.includes('</button>')) {
      k++;
      body += '\n' + lines[k];
    }

    // Strip SVG elements, then other HTML tags, check if any visible text remains
    const stripped = body
      .replace(/<\/button>[\s\S]*/, '')     // Trim after closing tag
      .replace(/<svg[\s\S]*?<\/svg>/g, '')  // Remove SVG blocks
      .replace(/<[^>]+\/>/g, '')            // Remove self-closing tags
      .replace(/<[^>]+>/g, '')              // Remove other HTML tags
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // Remove JSX comments
      .replace(/\s+/g, '')
      .trim();

    if (stripped === '') {
      issues.push({
        file: filePath,
        line: i + 1,
        rule: 'icon-button-label',
        message: 'Icon-only <button> missing aria-label — screen readers cannot identify its purpose',
      });
    }
  }

  return issues;
}

// ─── Main: checkAccessibility ─────────────────────────────────

export function checkAccessibility(packageName?: string): string {
  const packages = packageName ? [packageName] : listPackages();
  const allIssues: A11yIssue[] = [];

  for (const pkg of packages) {
    const srcDir = path.join(ROOT, 'packages', pkg, 'src');
    const files = findTsxFiles(srcDir);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const fileLines = content.split('\n');
      const rel = relPath(file);

      allIssues.push(
        ...checkButtonType(fileLines, rel),
        ...checkImgAlt(fileLines, rel),
        ...checkSvgAccessibility(fileLines, rel),
        ...checkInputLabels(fileLines, rel),
        ...checkClickableNonInteractive(fileLines, rel),
        ...checkIconOnlyButtons(fileLines, rel),
      );
    }
  }

  if (allIssues.length === 0) {
    const scope = packageName ? `package "${packageName}"` : 'all packages';
    return `No accessibility issues found in ${scope}.`;
  }

  // Group by file
  const byFile = new Map<string, A11yIssue[]>();
  for (const issue of allIssues) {
    const existing = byFile.get(issue.file) || [];
    existing.push(issue);
    byFile.set(issue.file, existing);
  }

  // Group by rule for summary
  const byRule = new Map<string, number>();
  for (const issue of allIssues) {
    byRule.set(issue.rule, (byRule.get(issue.rule) || 0) + 1);
  }

  const outputLines: string[] = [
    `# Accessibility Audit — ${allIssues.length} issue(s) found`,
    '',
    '## Summary by rule',
  ];

  for (const [rule, count] of [...byRule.entries()].sort((a, b) => b[1] - a[1])) {
    outputLines.push(`- **${rule}**: ${count}`);
  }

  outputLines.push('', '## Details by file', '');

  for (const [file, issues] of [...byFile.entries()].sort()) {
    outputLines.push(`### ${file}`);
    for (const issue of issues) {
      outputLines.push(`- Line ${issue.line}: [${issue.rule}] ${issue.message}`);
    }
    outputLines.push('');
  }

  return outputLines.join('\n');
}

// ─── Color contrast / dark mode coverage ──────────────────────

// Tailwind color class prefixes that should have dark: variants
const COLOR_PREFIXES = [
  'text-', 'bg-', 'border-', 'ring-', 'divide-',
  'placeholder-', 'from-', 'via-', 'to-',
  'outline-', 'decoration-', 'accent-', 'caret-',
  'fill-', 'stroke-',
];

// Color values that are theme-neutral (don't need dark variants)
const NEUTRAL_VALUES = new Set([
  'transparent', 'current', 'currentColor', 'inherit',
  'white', 'black',
]);

// Tailwind color palette names
const COLOR_NAMES = new Set([
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose',
]);

/** Returns true if a class like `text-gray-500` is actually a color class (not `text-sm` or `text-center`). */
function isColorClass(cls: string): boolean {
  for (const prefix of COLOR_PREFIXES) {
    if (!cls.startsWith(prefix)) continue;
    const value = cls.slice(prefix.length);
    if (NEUTRAL_VALUES.has(value)) return true;
    if (value.startsWith('[')) return true; // arbitrary value
    // Must start with a known color name (e.g., gray-500, blue-600/50)
    const colorName = value.split('-')[0];
    if (COLOR_NAMES.has(colorName)) return true;
  }
  return false;
}

function isNeutralColor(cls: string): boolean {
  for (const prefix of COLOR_PREFIXES) {
    if (cls.startsWith(prefix)) {
      const value = cls.slice(prefix.length);
      if (NEUTRAL_VALUES.has(value)) return true;
      if (value.startsWith('[')) return true;
    }
  }
  return false;
}

function extractColorClasses(className: string): string[] {
  const classes = className.split(/\s+/);
  const colorClasses: string[] = [];

  for (const cls of classes) {
    // Skip dark: variants, hover:, focus:, etc.
    if (cls.includes(':')) continue;

    if (isColorClass(cls) && !isNeutralColor(cls)) {
      colorClasses.push(cls);
    }
  }

  return colorClasses;
}

function extractDarkClasses(className: string): Set<string> {
  const classes = className.split(/\s+/);
  const darkClasses = new Set<string>();

  for (const cls of classes) {
    // Match dark:text-*, dark:hover:text-*, etc.
    const darkMatch = cls.match(/^dark:(?:[a-z]+:)*(.+)$/);
    if (darkMatch) {
      darkClasses.add(darkMatch[1]);
    }
  }

  return darkClasses;
}

interface DarkModeIssue {
  file: string;
  line: number;
  classes: string[];
}

export function checkColorContrast(): string {
  const packages = listPackages();
  const allIssues: DarkModeIssue[] = [];

  for (const pkg of packages) {
    const srcDir = path.join(ROOT, 'packages', pkg, 'src');
    const files = findTsxFiles(srcDir);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const fileLines = content.split('\n');
      const rel = relPath(file);

      for (let i = 0; i < fileLines.length; i++) {
        const line = fileLines[i];

        // Find className="..." or className={`...`}
        const classRegex = /className\s*=\s*(?:"([^"]+)"|{`([^`]+)`})/g;
        let match: RegExpExecArray | null;

        while ((match = classRegex.exec(line)) !== null) {
          const classValue = match[1] || match[2] || '';
          const colorClasses = extractColorClasses(classValue);
          if (colorClasses.length === 0) continue;

          const darkClasses = extractDarkClasses(classValue);

          // Check which color classes have no corresponding dark: variant
          const missingDark: string[] = [];
          for (const cls of colorClasses) {
            const prefix = COLOR_PREFIXES.find(p => cls.startsWith(p));
            if (!prefix) continue;

            // Check if there's any dark: class with the same prefix
            let hasDarkVariant = false;
            for (const dc of darkClasses) {
              if (dc.startsWith(prefix)) {
                hasDarkVariant = true;
                break;
              }
            }

            if (!hasDarkVariant) {
              missingDark.push(cls);
            }
          }

          if (missingDark.length > 0) {
            allIssues.push({
              file: rel,
              line: i + 1,
              classes: missingDark,
            });
          }
        }
      }
    }
  }

  if (allIssues.length === 0) {
    return 'All Tailwind color classes have corresponding dark: variants.';
  }

  // Group by file
  const byFile = new Map<string, DarkModeIssue[]>();
  for (const issue of allIssues) {
    const existing = byFile.get(issue.file) || [];
    existing.push(issue);
    byFile.set(issue.file, existing);
  }

  const outputLines: string[] = [
    `# Dark Mode Coverage — ${allIssues.length} line(s) with missing dark: variants`,
    '',
    '## Details by file',
    '',
  ];

  for (const [file, issues] of [...byFile.entries()].sort()) {
    outputLines.push(`### ${file}`);
    for (const issue of issues) {
      outputLines.push(`- Line ${issue.line}: missing dark: for \`${issue.classes.join('`, `')}\``);
    }
    outputLines.push('');
  }

  return outputLines.join('\n');
}
