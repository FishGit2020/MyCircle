/**
 * Seed Firestore with the 51 default Chinese characters.
 * Run once against production or emulator.
 * Usage: FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/seed-chinese-characters.mjs
 *        (omit FIRESTORE_EMULATOR_HOST for production — requires GOOGLE_APPLICATION_CREDENTIALS)
 */
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log(`Using emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

if (getApps().length === 0) {
  initializeApp({ projectId: 'mycircle-dash' });
}
const db = getFirestore();

const SYSTEM_CREATOR = { uid: 'system', displayName: 'MyCircle' };

const characters = [
  // Family
  { character: '\u5988\u5988', pinyin: 'm\u0101ma', meaning: 'mom', category: 'family' },
  { character: '\u7238\u7238', pinyin: 'b\u00e0ba', meaning: 'dad', category: 'family' },
  { character: '\u54e5\u54e5', pinyin: 'g\u0113ge', meaning: 'older brother', category: 'family' },
  { character: '\u59d0\u59d0', pinyin: 'ji\u011bji\u011b', meaning: 'older sister', category: 'family' },
  { character: '\u5b9d\u5b9d', pinyin: 'b\u01ceo bao', meaning: 'baby', category: 'family' },
  { character: '\u5bb6', pinyin: 'ji\u0101', meaning: 'home / family', category: 'family' },

  // Feelings
  { character: '\u8981', pinyin: 'y\u00e0o', meaning: 'want', category: 'feelings' },
  { character: '\u4e0d\u8981', pinyin: 'b\u00f9y\u00e0o', meaning: "don't want", category: 'feelings' },
  { character: '\u597d', pinyin: 'h\u01ceo', meaning: 'good', category: 'feelings' },
  { character: '\u6015', pinyin: 'p\u00e0', meaning: 'scared', category: 'feelings' },
  { character: '\u54ed', pinyin: 'k\u016b', meaning: 'cry', category: 'feelings' },
  { character: '\u7b11', pinyin: 'xi\u00e0o', meaning: 'laugh', category: 'feelings' },
  { character: '\u7231', pinyin: '\u00e0i', meaning: 'love', category: 'feelings' },

  // Food & Drink
  { character: '\u6c34', pinyin: 'shu\u01d0', meaning: 'water', category: 'food' },
  { character: '\u5976', pinyin: 'n\u01cei', meaning: 'milk', category: 'food' },
  { character: '\u996d', pinyin: 'f\u00e0n', meaning: 'rice / meal', category: 'food' },
  { character: '\u5403', pinyin: 'ch\u012b', meaning: 'eat', category: 'food' },
  { character: '\u559d', pinyin: 'h\u0113', meaning: 'drink', category: 'food' },
  { character: '\u679c', pinyin: 'gu\u01d2', meaning: 'fruit', category: 'food' },

  // Body & Actions
  { character: '\u624b', pinyin: 'sh\u01d2u', meaning: 'hand', category: 'body' },
  { character: '\u811a', pinyin: 'ji\u01ceo', meaning: 'foot', category: 'body' },
  { character: '\u8d70', pinyin: 'z\u01d2u', meaning: 'walk', category: 'body' },
  { character: '\u8dd1', pinyin: 'p\u01ceo', meaning: 'run', category: 'body' },
  { character: '\u62b1', pinyin: 'b\u00e0o', meaning: 'hug', category: 'body' },
  { character: '\u7761', pinyin: 'shu\u00ec', meaning: 'sleep', category: 'body' },

  // Around the House
  { character: '\u95e8', pinyin: 'm\u00e9n', meaning: 'door', category: 'house' },
  { character: '\u706f', pinyin: 'd\u0113ng', meaning: 'light', category: 'house' },
  { character: '\u5e8a', pinyin: 'chu\u00e1ng', meaning: 'bed', category: 'house' },
  { character: '\u978b', pinyin: 'xi\u00e9', meaning: 'shoes', category: 'house' },
  { character: '\u4e66', pinyin: 'sh\u016b', meaning: 'book', category: 'house' },

  // Nature & Animals
  { character: '\u72d7', pinyin: 'g\u01d2u', meaning: 'dog', category: 'nature' },
  { character: '\u732b', pinyin: 'm\u0101o', meaning: 'cat', category: 'nature' },
  { character: '\u9c7c', pinyin: 'y\u00fa', meaning: 'fish', category: 'nature' },
  { character: '\u82b1', pinyin: 'hu\u0101', meaning: 'flower', category: 'nature' },
  { character: '\u6708', pinyin: 'yu\u00e8', meaning: 'moon', category: 'nature' },
  { character: '\u661f', pinyin: 'x\u012bng', meaning: 'star', category: 'nature' },

  // Numbers
  { character: '\u4e00', pinyin: 'y\u012b', meaning: 'one', category: 'numbers' },
  { character: '\u4e8c', pinyin: '\u00e8r', meaning: 'two', category: 'numbers' },
  { character: '\u4e09', pinyin: 's\u0101n', meaning: 'three', category: 'numbers' },
  { character: '\u56db', pinyin: 's\u00ec', meaning: 'four', category: 'numbers' },
  { character: '\u4e94', pinyin: 'w\u01d4', meaning: 'five', category: 'numbers' },
  { character: '\u516d', pinyin: 'li\u00f9', meaning: 'six', category: 'numbers' },
  { character: '\u4e03', pinyin: 'q\u012b', meaning: 'seven', category: 'numbers' },
  { character: '\u516b', pinyin: 'b\u0101', meaning: 'eight', category: 'numbers' },
  { character: '\u4e5d', pinyin: 'ji\u01d4', meaning: 'nine', category: 'numbers' },
  { character: '\u5341', pinyin: 'sh\u00ed', meaning: 'ten', category: 'numbers' },

  // Common Phrases
  { character: '\u4f60\u597d', pinyin: 'n\u01d0h\u01ceo', meaning: 'hello', category: 'phrases' },
  { character: '\u8c22\u8c22', pinyin: 'xi\u00e8xie', meaning: 'thank you', category: 'phrases' },
  { character: '\u518d\u89c1', pinyin: 'z\u00e0iji\u00e0n', meaning: 'goodbye', category: 'phrases' },
  { character: '\u5bf9\u4e0d\u8d77', pinyin: 'du\u00ecbuq\u01d0', meaning: 'sorry', category: 'phrases' },
  { character: '\u6ca1\u5173\u7cfb', pinyin: 'm\u00e9igu\u0101nxi', meaning: "it's okay", category: 'phrases' },
];

async function seed() {
  console.log(`Seeding ${characters.length} Chinese characters...`);

  const batch = db.batch();
  for (const char of characters) {
    const ref = db.collection('chineseCharacters').doc();
    batch.set(ref, {
      ...char,
      createdBy: SYSTEM_CREATOR,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`Successfully seeded ${characters.length} characters.`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
