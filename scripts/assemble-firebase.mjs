/**
 * Assemble Firebase deployment directory
 * This script copies built micro frontends into the correct structure for Firebase Hosting
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const firebaseDir = path.join(rootDir, 'dist', 'firebase');

// Clean and create Firebase directory
if (fs.existsSync(firebaseDir)) {
  fs.rmSync(firebaseDir, { recursive: true });
}
fs.mkdirSync(firebaseDir, { recursive: true });

// Copy function to recursively copy directories
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`Warning: Source directory does not exist: ${src}`);
    return;
  }

  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Assembling Firebase deployment directory...\n');

// 1. Copy shell (host) as the root
const shellDist = path.join(rootDir, 'packages', 'shell', 'dist');
console.log(`Copying shell to ${firebaseDir}`);
copyDir(shellDist, firebaseDir);

// 2. Copy city-search MF to /city-search
const citySearchDist = path.join(rootDir, 'packages', 'city-search', 'dist');
const citySearchDest = path.join(firebaseDir, 'city-search');
console.log(`Copying city-search to ${citySearchDest}`);
copyDir(citySearchDist, citySearchDest);

// 3. Copy weather-display MF to /weather-display
const weatherDisplayDist = path.join(rootDir, 'packages', 'weather-display', 'dist');
const weatherDisplayDest = path.join(firebaseDir, 'weather-display');
console.log(`Copying weather-display to ${weatherDisplayDest}`);
copyDir(weatherDisplayDist, weatherDisplayDest);

// 4. Copy stock-tracker MF to /stock-tracker
const stockTrackerDist = path.join(rootDir, 'packages', 'stock-tracker', 'dist');
const stockTrackerDest = path.join(firebaseDir, 'stock-tracker');
console.log(`Copying stock-tracker to ${stockTrackerDest}`);
copyDir(stockTrackerDist, stockTrackerDest);

// 5. Copy podcast-player MF to /podcast-player
const podcastPlayerDist = path.join(rootDir, 'packages', 'podcast-player', 'dist');
const podcastPlayerDest = path.join(firebaseDir, 'podcast-player');
console.log(`Copying podcast-player to ${podcastPlayerDest}`);
copyDir(podcastPlayerDist, podcastPlayerDest);

// 6. Copy ai-assistant MF to /ai-assistant
const aiAssistantDist = path.join(rootDir, 'packages', 'ai-assistant', 'dist');
const aiAssistantDest = path.join(firebaseDir, 'ai-assistant');
console.log(`Copying ai-assistant to ${aiAssistantDest}`);
copyDir(aiAssistantDist, aiAssistantDest);

// 7. Copy bible-reader MF to /bible-reader
const bibleReaderDist = path.join(rootDir, 'packages', 'bible-reader', 'dist');
const bibleReaderDest = path.join(firebaseDir, 'bible-reader');
console.log(`Copying bible-reader to ${bibleReaderDest}`);
copyDir(bibleReaderDist, bibleReaderDest);

// 8. Copy worship-songs MF to /worship-songs
const worshipSongsDist = path.join(rootDir, 'packages', 'worship-songs', 'dist');
const worshipSongsDest = path.join(firebaseDir, 'worship-songs');
console.log(`Copying worship-songs to ${worshipSongsDest}`);
copyDir(worshipSongsDist, worshipSongsDest);

// 9. Copy notebook MF to /notebook
const notebookDist = path.join(rootDir, 'packages', 'notebook', 'dist');
const notebookDest = path.join(firebaseDir, 'notebook');
console.log(`Copying notebook to ${notebookDest}`);
copyDir(notebookDist, notebookDest);

// 10. Copy baby-tracker MF to /baby-tracker
const babyTrackerDist = path.join(rootDir, 'packages', 'baby-tracker', 'dist');
const babyTrackerDest = path.join(firebaseDir, 'baby-tracker');
console.log(`Copying baby-tracker to ${babyTrackerDest}`);
copyDir(babyTrackerDist, babyTrackerDest);

// 11. Copy child-development MF to /child-development
const childDevDist = path.join(rootDir, 'packages', 'child-development', 'dist');
const childDevDest = path.join(firebaseDir, 'child-development');
console.log(`Copying child-development to ${childDevDest}`);
copyDir(childDevDist, childDevDest);

// 12. Copy chinese-learning MF to /chinese-learning
const chineseLearningDist = path.join(rootDir, 'packages', 'chinese-learning', 'dist');
const chineseLearningDest = path.join(firebaseDir, 'chinese-learning');
console.log(`Copying chinese-learning to ${chineseLearningDest}`);
copyDir(chineseLearningDist, chineseLearningDest);

// 13. Copy english-learning MF to /english-learning
const englishLearningDist = path.join(rootDir, 'packages', 'english-learning', 'dist');
const englishLearningDest = path.join(firebaseDir, 'english-learning');
console.log(`Copying english-learning to ${englishLearningDest}`);
copyDir(englishLearningDist, englishLearningDest);

console.log('\nFirebase deployment directory assembled successfully!');
console.log(`Output: ${firebaseDir}`);

// List the structure
function listDir(dir, indent = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    console.log(`${indent}${entry.isDirectory() ? '📁' : '📄'} ${entry.name}`);
    if (entry.isDirectory() && indent.length < 4) {
      listDir(path.join(dir, entry.name), indent + '  ');
    }
  }
}

console.log('\nDirectory structure:');
listDir(firebaseDir);
