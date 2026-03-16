#!/usr/bin/env node
/**
 * Scaffold a new Speckit feature folder.
 * Usage: node scripts/new-spec.mjs <feature-name>
 * Example: node scripts/new-spec.mjs recipe-book
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SPECS_DIR = path.join(ROOT, 'docs', 'specs');
const TEMPLATES_DIR = path.join(SPECS_DIR, '_templates');

const featureName = process.argv[2];
if (!featureName) {
  console.error('Usage: node scripts/new-spec.mjs <feature-name>');
  console.error('Example: node scripts/new-spec.mjs recipe-book');
  process.exit(1);
}

// Find next number
const existing = fs.readdirSync(SPECS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && /^\d{3}-/.test(d.name))
  .map(d => parseInt(d.name.slice(0, 3), 10))
  .filter(n => !isNaN(n));

const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
const folderName = `${String(nextNum).padStart(3, '0')}-${featureName}`;
const folderPath = path.join(SPECS_DIR, folderName);

if (fs.existsSync(folderPath)) {
  console.error(`Folder already exists: ${folderPath}`);
  process.exit(1);
}

fs.mkdirSync(folderPath, { recursive: true });

// Copy templates, replacing [Feature Name] with actual name
const prettyName = featureName
  .split('-')
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ');

const today = new Date().toISOString().split('T')[0];

const templateFiles = ['spec.md', 'plan.md', 'tasks.md', 'research.md', 'data-model.md', '_changelog.md'];

for (const file of templateFiles) {
  const templatePath = path.join(TEMPLATES_DIR, file);
  if (!fs.existsSync(templatePath)) continue;

  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content.replace(/\[Feature Name\]/g, prettyName);
  content = content.replace(/\[YYYY-MM-DD\]/g, today);
  content = content.replace(/\[Name\]/g, '');

  fs.writeFileSync(path.join(folderPath, file), content);
}

console.log(`Created spec folder: docs/specs/${folderName}/`);
console.log(`Files: ${templateFiles.join(', ')}`);
console.log(`\nNext steps:`);
console.log(`  1. Fill out spec.md with requirements`);
console.log(`  2. Get spec reviewed/approved`);
console.log(`  3. Fill out plan.md and tasks.md`);
console.log(`  4. Create feature branch and implement`);
