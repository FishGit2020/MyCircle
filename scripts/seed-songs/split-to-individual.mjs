#!/usr/bin/env node
/**
 * Splits pdf-songbook-part*.mjs files into individual song-*.mjs files.
 * Run: node scripts/seed-songs/split-to-individual.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

const files = readdirSync(__dirname)
  .filter((f) => f.startsWith('pdf-songbook-') && f.endsWith('.mjs'))
  .sort();

const songRegex =
  /\{\s*title:\s*"([^"]*)",\s*artist:\s*"([^"]*)",\s*originalKey:\s*"([^"]*)",\s*format:\s*"([^"]*)",\s*content:\s*`([^`]*)`,?\s*notes:\s*"((?:[^"\\]|\\.)*)",?\s*bpm:\s*(\d+),?\s*tags:\s*\[([^\]]*)\]/g;

const allSongs = [];
for (const f of files) {
  const content = readFileSync(join(__dirname, f), 'utf-8');
  let match;
  while ((match = songRegex.exec(content)) !== null) {
    allSongs.push({
      title: match[1],
      artist: match[2],
      originalKey: match[3],
      format: match[4],
      content: match[5],
      notes: match[6],
      bpm: match[7],
      tags: match[8],
    });
  }
}

console.log(`Parsed ${allSongs.length} songs. Writing individual files...`);

let created = 0;
for (const song of allSongs) {
  const slug = slugify(song.title);
  const filename = `song-${slug}.mjs`;
  const filepath = join(__dirname, filename);

  const lines = [
    '#!/usr/bin/env node',
    '/**',
    ` * Seed: ${song.title} by ${song.artist}`,
    ` * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/${filename} --skip-existing`,
    ' */',
    'import { initializeApp, applicationDefault } from "firebase-admin/app";',
    'import { getFirestore, FieldValue } from "firebase-admin/firestore";',
    '',
    'initializeApp({ credential: applicationDefault() });',
    'const db = getFirestore();',
    '',
    'const SONGS = [',
    '  {',
    `    title: "${song.title}",`,
    `    artist: "${song.artist}",`,
    `    originalKey: "${song.originalKey}",`,
    `    format: "${song.format}",`,
    `    content: \`${song.content}\`,`,
    `    notes: "${song.notes}",`,
    `    bpm: ${song.bpm},`,
    `    tags: [${song.tags}],`,
    '  },',
    '];',
    '',
    'const skipExisting = process.argv.includes("--skip-existing");',
    '',
    'async function main() {',
    '  const col = db.collection("worshipSongs");',
    '  let existingTitles = new Set();',
    '',
    '  if (skipExisting) {',
    '    const snapshot = await col.select("title").get();',
    '    snapshot.forEach((doc) => existingTitles.add(doc.data().title));',
    '  }',
    '',
    '  let batch = db.batch();',
    '  let count = 0;',
    '',
    '  for (const song of SONGS) {',
    '    if (skipExisting && existingTitles.has(song.title)) {',
    '      console.log("SKIP (exists): " + song.title);',
    '      continue;',
    '    }',
    '    const ref = col.doc();',
    '    batch.set(ref, {',
    '      title: song.title,',
    '      artist: song.artist,',
    '      originalKey: song.originalKey,',
    '      format: song.format,',
    '      content: song.content,',
    '      notes: song.notes,',
    '      bpm: song.bpm,',
    '      tags: song.tags,',
    '      createdBy: "seed-script",',
    '      createdAt: FieldValue.serverTimestamp(),',
    '      updatedAt: FieldValue.serverTimestamp(),',
    '    });',
    '    count++;',
    '    console.log("ADD: " + song.title);',
    '  }',
    '',
    '  if (count > 0) {',
    '    await batch.commit();',
    '    console.log("Seeded " + count + " song(s).");',
    '  } else {',
    '    console.log("No new songs to seed.");',
    '  }',
    '}',
    '',
    'main().catch((err) => {',
    '  console.error("Seed failed:", err);',
    '  process.exit(1);',
    '});',
  ];

  writeFileSync(filepath, lines.join('\n') + '\n', 'utf-8');
  created++;
  console.log(`  ${filename}`);
}

console.log(`\nCreated ${created} individual song files.`);
