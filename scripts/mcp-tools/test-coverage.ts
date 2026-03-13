import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const PACKAGES_DIR = path.join(ROOT, 'packages');

// ─── Types ────────────────────────────────────────────────────

interface TestFileInfo {
  filePath: string;        // relative to ROOT
  testCount: number;       // number of it() / test() calls
}

interface PackageCoverage {
  package: string;
  testFiles: TestFileInfo[];
  totalTests: number;
  sourceFiles: number;
  testedSourceFiles: number;
  untestedFiles: string[];
}

interface UntestedFile {
  filePath: string;        // relative to ROOT
  package: string;
  kind: 'component' | 'hook' | 'other';
}

// ─── Helpers ─────────────────────────────────────────────────

function listPackages(): string[] {
  try {
    return fs.readdirSync(PACKAGES_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
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

function scanFilesRecursive(dir: string, predicate: (name: string) => boolean): string[] {
  const results: string[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch { return results; }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
      results.push(...scanFilesRecursive(fullPath, predicate));
    } else if (entry.isFile() && predicate(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

function isTestFile(name: string): boolean {
  return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(name);
}

function isSourceFile(name: string): boolean {
  return /\.(ts|tsx)$/.test(name)
    && !isTestFile(name)
    && !name.endsWith('.d.ts')
    && !name.startsWith('vite-env')
    && name !== 'main.tsx'
    && name !== 'index.ts'
    && name !== 'index.tsx';
}

function countTests(content: string): number {
  // Count it(), test(), it.each(), test.each() calls
  // Avoid matching commented lines
  let count = 0;
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
    // Match test declarations
    const testRegex = /\b(?:it|test)(?:\.each|\s*\.skip|\s*\.only)?\s*\(/g;
    let m: RegExpExecArray | null;
    while ((m = testRegex.exec(trimmed)) !== null) {
      count++;
    }
  }
  return count;
}

function findCorrespondingTestFile(sourceFile: string): string | null {
  const ext = path.extname(sourceFile);
  const base = path.basename(sourceFile, ext);
  const dir = path.dirname(sourceFile);

  // Check same directory for .test.tsx or .test.ts
  const testExt = ext === '.tsx' ? '.test.tsx' : '.test.ts';
  const testFile = path.join(dir, `${base}${testExt}`);
  if (fs.existsSync(testFile)) return testFile;

  // Also check for .test.ts variant for .tsx files
  if (ext === '.tsx') {
    const altTest = path.join(dir, `${base}.test.ts`);
    if (fs.existsSync(altTest)) return altTest;
  }

  // Check __tests__ subdirectory
  const testsDir = path.join(dir, '__tests__');
  const testInSubdir = path.join(testsDir, `${base}${testExt}`);
  if (fs.existsSync(testInSubdir)) return testInSubdir;

  return null;
}

// ─── Analysis ────────────────────────────────────────────────

function analyzePackage(pkg: string): PackageCoverage {
  const pkgDir = path.join(PACKAGES_DIR, pkg);
  const srcDir = path.join(pkgDir, 'src');
  const testDir = path.join(pkgDir, 'test');

  // Find all test files (in src/ and test/)
  const testFiles: TestFileInfo[] = [];
  const testPaths = [
    ...scanFilesRecursive(srcDir, isTestFile),
    ...scanFilesRecursive(testDir, isTestFile),
  ];

  for (const testPath of testPaths) {
    const content = readFileSafe(testPath);
    testFiles.push({
      filePath: relPath(testPath),
      testCount: countTests(content),
    });
  }

  // Find source files (components, hooks, utilities)
  const sourceFiles = scanFilesRecursive(srcDir, isSourceFile);
  const untestedFiles: string[] = [];
  let testedCount = 0;

  for (const srcFile of sourceFiles) {
    const testFile = findCorrespondingTestFile(srcFile);
    if (testFile) {
      testedCount++;
    } else {
      untestedFiles.push(relPath(srcFile));
    }
  }

  return {
    package: pkg,
    testFiles,
    totalTests: testFiles.reduce((sum, t) => sum + t.testCount, 0),
    sourceFiles: sourceFiles.length,
    testedSourceFiles: testedCount,
    untestedFiles,
  };
}

// ─── Public API ──────────────────────────────────────────────

export function getTestCoverage(packageName?: string): string {
  const packages = packageName
    ? [packageName]
    : listPackages().filter(p => p !== 'shared'); // shared is a library, not MFE

  const validPackages = packages.filter(p => {
    const pkgDir = path.join(PACKAGES_DIR, p);
    return fs.existsSync(pkgDir);
  });

  if (validPackages.length === 0) {
    return packageName
      ? `Package "${packageName}" not found in packages/.`
      : 'No packages found.';
  }

  const results = validPackages.map(analyzePackage);

  if (packageName) {
    // Detailed report for single package
    return formatDetailedReport(results[0]);
  }

  // Summary report for all packages
  return formatSummaryReport(results);
}

export function findUntestedFiles(): string {
  const packages = listPackages();
  const allUntested: UntestedFile[] = [];

  for (const pkg of packages) {
    const srcDir = path.join(PACKAGES_DIR, pkg, 'src');

    // Check components
    const componentsDir = path.join(srcDir, 'components');
    const componentFiles = scanFilesRecursive(componentsDir, (name) =>
      name.endsWith('.tsx') && !isTestFile(name) && !name.endsWith('.css')
    );
    for (const f of componentFiles) {
      if (!findCorrespondingTestFile(f)) {
        allUntested.push({ filePath: relPath(f), package: pkg, kind: 'component' });
      }
    }

    // Check hooks
    const hooksDir = path.join(srcDir, 'hooks');
    const hookFiles = scanFilesRecursive(hooksDir, (name) =>
      name.endsWith('.ts') && !isTestFile(name) && !name.endsWith('.d.ts') && name !== 'index.ts'
    );
    for (const f of hookFiles) {
      if (!findCorrespondingTestFile(f)) {
        allUntested.push({ filePath: relPath(f), package: pkg, kind: 'hook' });
      }
    }
  }

  if (allUntested.length === 0) {
    return 'All components and hooks have corresponding test files.';
  }

  // Group by package
  const byPackage: Record<string, UntestedFile[]> = {};
  for (const item of allUntested) {
    if (!byPackage[item.package]) byPackage[item.package] = [];
    byPackage[item.package].push(item);
  }

  const sections: string[] = [
    '# Untested Files',
    '',
    `Found ${allUntested.length} source file(s) without a corresponding test file.`,
    '',
  ];

  // Sort packages by number of untested files (descending)
  const sorted = Object.entries(byPackage).sort((a, b) => b[1].length - a[1].length);

  for (const [pkg, files] of sorted) {
    const components = files.filter(f => f.kind === 'component');
    const hooks = files.filter(f => f.kind === 'hook');

    sections.push(`## ${pkg} (${files.length} untested)`);

    if (components.length > 0) {
      sections.push('### Components');
      for (const f of components) {
        sections.push(`- ${f.filePath}`);
      }
    }
    if (hooks.length > 0) {
      sections.push('### Hooks');
      for (const f of hooks) {
        sections.push(`- ${f.filePath}`);
      }
    }
    sections.push('');
  }

  return sections.join('\n');
}

// ─── Formatters ──────────────────────────────────────────────

function formatDetailedReport(result: PackageCoverage): string {
  const coveragePercent = result.sourceFiles > 0
    ? Math.round((result.testedSourceFiles / result.sourceFiles) * 100)
    : 0;

  const sections: string[] = [
    `# Test Coverage: ${result.package}`,
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Test files | ${result.testFiles.length} |`,
    `| Total test cases | ${result.totalTests} |`,
    `| Source files | ${result.sourceFiles} |`,
    `| Tested source files | ${result.testedSourceFiles} |`,
    `| File-level coverage | ${coveragePercent}% |`,
    '',
  ];

  if (result.testFiles.length > 0) {
    sections.push('## Test Files');
    for (const tf of result.testFiles) {
      sections.push(`- **${tf.filePath}** (${tf.testCount} test${tf.testCount !== 1 ? 's' : ''})`);
    }
    sections.push('');
  }

  if (result.untestedFiles.length > 0) {
    sections.push(`## Untested Source Files (${result.untestedFiles.length})`);
    for (const f of result.untestedFiles) {
      sections.push(`- ${f}`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

function formatSummaryReport(results: PackageCoverage[]): string {
  // Sort by coverage percentage (ascending — worst coverage first)
  const sorted = [...results].sort((a, b) => {
    const aPct = a.sourceFiles > 0 ? a.testedSourceFiles / a.sourceFiles : 0;
    const bPct = b.sourceFiles > 0 ? b.testedSourceFiles / b.sourceFiles : 0;
    return aPct - bPct;
  });

  const totalTests = sorted.reduce((s, r) => s + r.totalTests, 0);
  const totalTestFiles = sorted.reduce((s, r) => s + r.testFiles.length, 0);
  const totalSourceFiles = sorted.reduce((s, r) => s + r.sourceFiles, 0);
  const totalTestedFiles = sorted.reduce((s, r) => s + r.testedSourceFiles, 0);
  const totalUntested = sorted.reduce((s, r) => s + r.untestedFiles.length, 0);
  const overallPct = totalSourceFiles > 0 ? Math.round((totalTestedFiles / totalSourceFiles) * 100) : 0;

  const sections: string[] = [
    '# Test Coverage Summary',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Packages scanned | ${sorted.length} |`,
    `| Total test files | ${totalTestFiles} |`,
    `| Total test cases | ${totalTests} |`,
    `| Total source files | ${totalSourceFiles} |`,
    `| Files with tests | ${totalTestedFiles} |`,
    `| Files without tests | ${totalUntested} |`,
    `| Overall file coverage | ${overallPct}% |`,
    '',
    '## Per-Package Breakdown',
    '',
    '| Package | Tests | Test Files | Source Files | Coverage |',
    '|---------|-------|------------|-------------|----------|',
  ];

  for (const r of sorted) {
    const pct = r.sourceFiles > 0
      ? Math.round((r.testedSourceFiles / r.sourceFiles) * 100)
      : 0;
    const bar = pct >= 70 ? 'good' : pct >= 40 ? 'fair' : 'low';
    sections.push(`| ${r.package} | ${r.totalTests} | ${r.testFiles.length} | ${r.sourceFiles} | ${pct}% (${bar}) |`);
  }

  // Packages with zero tests
  const zeroTestPkgs = sorted.filter(r => r.totalTests === 0 && r.sourceFiles > 0);
  if (zeroTestPkgs.length > 0) {
    sections.push('', `## Packages With No Tests (${zeroTestPkgs.length})`);
    for (const r of zeroTestPkgs) {
      sections.push(`- **${r.package}** (${r.sourceFiles} source file${r.sourceFiles !== 1 ? 's' : ''})`);
    }
  }

  return sections.join('\n');
}
