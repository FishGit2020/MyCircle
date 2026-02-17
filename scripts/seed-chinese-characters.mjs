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
  { character: '妈妈', pinyin: 'māma', meaning: 'mom', category: 'family' },
  { character: '爸爸', pinyin: 'bàba', meaning: 'dad', category: 'family' },
  { character: '哥哥', pinyin: 'gēge', meaning: 'older brother', category: 'family' },
  { character: '姐姐', pinyin: 'jiějie', meaning: 'older sister', category: 'family' },
  { character: '宝宝', pinyin: 'bǎobao', meaning: 'baby', category: 'family' },
  { character: '家', pinyin: 'jiā', meaning: 'home / family', category: 'family' },

  // Feelings
  { character: '要', pinyin: 'yào', meaning: 'want', category: 'feelings' },
  { character: '不要', pinyin: 'bùyào', meaning: "don't want", category: 'feelings' },
  { character: '好', pinyin: 'hǎo', meaning: 'good', category: 'feelings' },
  { character: '怕', pinyin: 'pà', meaning: 'scared', category: 'feelings' },
  { character: '哭', pinyin: 'kū', meaning: 'cry', category: 'feelings' },
  { character: '笑', pinyin: 'xiào', meaning: 'laugh', category: 'feelings' },
  { character: '爱', pinyin: 'ài', meaning: 'love', category: 'feelings' },

  // Food & Drink
  { character: '水', pinyin: 'shuǐ', meaning: 'water', category: 'food' },
  { character: '奶', pinyin: 'nǎi', meaning: 'milk', category: 'food' },
  { character: '饭', pinyin: 'fàn', meaning: 'rice / meal', category: 'food' },
  { character: '吃', pinyin: 'chī', meaning: 'eat', category: 'food' },
  { character: '喝', pinyin: 'hē', meaning: 'drink', category: 'food' },
  { character: '果', pinyin: 'guǒ', meaning: 'fruit', category: 'food' },

  // Body & Actions
  { character: '手', pinyin: 'shǒu', meaning: 'hand', category: 'body' },
  { character: '脚', pinyin: 'jiǎo', meaning: 'foot', category: 'body' },
  { character: '走', pinyin: 'zǒu', meaning: 'walk', category: 'body' },
  { character: '跑', pinyin: 'pǎo', meaning: 'run', category: 'body' },
  { character: '抱', pinyin: 'bào', meaning: 'hug', category: 'body' },
  { character: '睡', pinyin: 'shuì', meaning: 'sleep', category: 'body' },

  // Around the House
  { character: '门', pinyin: 'mén', meaning: 'door', category: 'house' },
  { character: '灯', pinyin: 'dēng', meaning: 'light', category: 'house' },
  { character: '床', pinyin: 'chuáng', meaning: 'bed', category: 'house' },
  { character: '鞋', pinyin: 'xié', meaning: 'shoes', category: 'house' },
  { character: '书', pinyin: 'shū', meaning: 'book', category: 'house' },

  // Nature & Animals
  { character: '狗', pinyin: 'gǒu', meaning: 'dog', category: 'nature' },
  { character: '猫', pinyin: 'māo', meaning: 'cat', category: 'nature' },
  { character: '鱼', pinyin: 'yú', meaning: 'fish', category: 'nature' },
  { character: '花', pinyin: 'huā', meaning: 'flower', category: 'nature' },
  { character: '月', pinyin: 'yuè', meaning: 'moon', category: 'nature' },
  { character: '星', pinyin: 'xīng', meaning: 'star', category: 'nature' },

  // Numbers
  { character: '一', pinyin: 'yī', meaning: 'one', category: 'numbers' },
  { character: '二', pinyin: 'èr', meaning: 'two', category: 'numbers' },
  { character: '三', pinyin: 'sān', meaning: 'three', category: 'numbers' },
  { character: '四', pinyin: 'sì', meaning: 'four', category: 'numbers' },
  { character: '五', pinyin: 'wǔ', meaning: 'five', category: 'numbers' },
  { character: '六', pinyin: 'liù', meaning: 'six', category: 'numbers' },
  { character: '七', pinyin: 'qī', meaning: 'seven', category: 'numbers' },
  { character: '八', pinyin: 'bā', meaning: 'eight', category: 'numbers' },
  { character: '九', pinyin: 'jiǔ', meaning: 'nine', category: 'numbers' },
  { character: '十', pinyin: 'shí', meaning: 'ten', category: 'numbers' },

  // Common Phrases
  { character: '你好', pinyin: 'nǐhǎo', meaning: 'hello', category: 'phrases' },
  { character: '谢谢', pinyin: 'xièxie', meaning: 'thank you', category: 'phrases' },
  { character: '再见', pinyin: 'zàijiàn', meaning: 'goodbye', category: 'phrases' },
  { character: '对不起', pinyin: 'duìbuqǐ', meaning: 'sorry', category: 'phrases' },
  { character: '没关系', pinyin: 'méiguānxi', meaning: "it's okay", category: 'phrases' },
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
