#!/usr/bin/env node
/**
 * Seed public Spanish learning flashcards.
 *
 * Writes Spanish phrases to `publicFlashcards` collection via Firestore REST API.
 *
 * Prerequisites:
 *   gcloud auth application-default login
 *
 * Usage:
 *   node scripts/seed-spanish-flashcards.mjs [--dry-run]
 */

import { execSync } from 'child_process';

const dryRun = process.argv.includes('--dry-run');
const PROJECT = 'mycircle-dash';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

function getToken() {
  return execSync('gcloud auth application-default print-access-token', { encoding: 'utf-8' }).trim();
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) fields[k] = toFirestoreValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

async function writeDoc(token, collection, docId, data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toFirestoreValue(v);
  const url = `${BASE}/${collection}/${docId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to write ${collection}/${docId}: ${res.status} ${text}`);
  }
}

// Spanish phrases organized by category
const SPANISH_PHRASES = [
  // Greetings
  { id: 'es-g01', front: 'Hello', back: 'Hola', category: 'greetings', difficulty: 1 },
  { id: 'es-g02', front: 'Good morning', back: 'Buenos días', category: 'greetings', difficulty: 1 },
  { id: 'es-g03', front: 'Good afternoon', back: 'Buenas tardes', category: 'greetings', difficulty: 1 },
  { id: 'es-g04', front: 'Good night', back: 'Buenas noches', category: 'greetings', difficulty: 1 },
  { id: 'es-g05', front: 'Goodbye', back: 'Adiós', category: 'greetings', difficulty: 1 },
  { id: 'es-g06', front: 'See you later', back: 'Hasta luego', category: 'greetings', difficulty: 1 },
  { id: 'es-g07', front: 'How are you?', back: '¿Cómo estás?', category: 'greetings', difficulty: 1 },
  { id: 'es-g08', front: "I'm fine, thank you", back: 'Estoy bien, gracias', category: 'greetings', difficulty: 1 },
  { id: 'es-g09', front: 'Nice to meet you', back: 'Mucho gusto', category: 'greetings', difficulty: 1 },
  { id: 'es-g10', front: "What's your name?", back: '¿Cómo te llamas?', category: 'greetings', difficulty: 1 },
  { id: 'es-g11', front: 'My name is...', back: 'Me llamo...', category: 'greetings', difficulty: 1 },
  { id: 'es-g12', front: 'Please', back: 'Por favor', category: 'greetings', difficulty: 1 },
  { id: 'es-g13', front: 'Thank you', back: 'Gracias', category: 'greetings', difficulty: 1 },
  { id: 'es-g14', front: "You're welcome", back: 'De nada', category: 'greetings', difficulty: 1 },
  { id: 'es-g15', front: 'Excuse me / Sorry', back: 'Perdón / Disculpe', category: 'greetings', difficulty: 1 },

  // Food & Drink
  { id: 'es-f01', front: 'Water', back: 'Agua', category: 'food', difficulty: 1 },
  { id: 'es-f02', front: 'Coffee', back: 'Café', category: 'food', difficulty: 1 },
  { id: 'es-f03', front: 'Beer', back: 'Cerveza', category: 'food', difficulty: 1 },
  { id: 'es-f04', front: 'The check, please', back: 'La cuenta, por favor', category: 'food', difficulty: 1 },
  { id: 'es-f05', front: 'I would like...', back: 'Me gustaría...', category: 'food', difficulty: 2 },
  { id: 'es-f06', front: 'Breakfast', back: 'Desayuno', category: 'food', difficulty: 1 },
  { id: 'es-f07', front: 'Lunch', back: 'Almuerzo', category: 'food', difficulty: 1 },
  { id: 'es-f08', front: 'Dinner', back: 'Cena', category: 'food', difficulty: 1 },
  { id: 'es-f09', front: "I'm hungry", back: 'Tengo hambre', category: 'food', difficulty: 1 },
  { id: 'es-f10', front: "It's delicious!", back: '¡Está delicioso!', category: 'food', difficulty: 2 },

  // Travel & Directions
  { id: 'es-t01', front: 'Where is...?', back: '¿Dónde está...?', category: 'travel', difficulty: 1 },
  { id: 'es-t02', front: 'How much does it cost?', back: '¿Cuánto cuesta?', category: 'travel', difficulty: 1 },
  { id: 'es-t03', front: 'Left', back: 'Izquierda', category: 'travel', difficulty: 1 },
  { id: 'es-t04', front: 'Right', back: 'Derecha', category: 'travel', difficulty: 1 },
  { id: 'es-t05', front: 'Straight ahead', back: 'Todo recto', category: 'travel', difficulty: 1 },
  { id: 'es-t06', front: 'The airport', back: 'El aeropuerto', category: 'travel', difficulty: 1 },
  { id: 'es-t07', front: 'The hotel', back: 'El hotel', category: 'travel', difficulty: 1 },
  { id: 'es-t08', front: 'The bathroom', back: 'El baño', category: 'travel', difficulty: 1 },
  { id: 'es-t09', front: 'The train station', back: 'La estación de tren', category: 'travel', difficulty: 2 },
  { id: 'es-t10', front: 'A taxi', back: 'Un taxi', category: 'travel', difficulty: 1 },

  // Common Phrases
  { id: 'es-c01', front: 'I don\'t understand', back: 'No entiendo', category: 'common', difficulty: 1 },
  { id: 'es-c02', front: 'Do you speak English?', back: '¿Hablas inglés?', category: 'common', difficulty: 1 },
  { id: 'es-c03', front: 'I don\'t speak Spanish', back: 'No hablo español', category: 'common', difficulty: 1 },
  { id: 'es-c04', front: 'Can you help me?', back: '¿Puede ayudarme?', category: 'common', difficulty: 2 },
  { id: 'es-c05', front: 'I need help', back: 'Necesito ayuda', category: 'common', difficulty: 1 },
  { id: 'es-c06', front: 'Yes / No', back: 'Sí / No', category: 'common', difficulty: 1 },
  { id: 'es-c07', front: 'I like it', back: 'Me gusta', category: 'common', difficulty: 1 },
  { id: 'es-c08', front: 'I don\'t like it', back: 'No me gusta', category: 'common', difficulty: 1 },
  { id: 'es-c09', front: 'What time is it?', back: '¿Qué hora es?', category: 'common', difficulty: 2 },
  { id: 'es-c10', front: 'How do you say...?', back: '¿Cómo se dice...?', category: 'common', difficulty: 2 },

  // Numbers
  { id: 'es-n01', front: 'One', back: 'Uno', category: 'numbers', difficulty: 1 },
  { id: 'es-n02', front: 'Two', back: 'Dos', category: 'numbers', difficulty: 1 },
  { id: 'es-n03', front: 'Three', back: 'Tres', category: 'numbers', difficulty: 1 },
  { id: 'es-n04', front: 'Four', back: 'Cuatro', category: 'numbers', difficulty: 1 },
  { id: 'es-n05', front: 'Five', back: 'Cinco', category: 'numbers', difficulty: 1 },
  { id: 'es-n06', front: 'Ten', back: 'Diez', category: 'numbers', difficulty: 1 },
  { id: 'es-n07', front: 'Twenty', back: 'Veinte', category: 'numbers', difficulty: 1 },
  { id: 'es-n08', front: 'Fifty', back: 'Cincuenta', category: 'numbers', difficulty: 2 },
  { id: 'es-n09', front: 'One hundred', back: 'Cien', category: 'numbers', difficulty: 1 },
  { id: 'es-n10', front: 'One thousand', back: 'Mil', category: 'numbers', difficulty: 2 },

  // Emergency
  { id: 'es-e01', front: 'Help!', back: '¡Ayuda!', category: 'emergency', difficulty: 1 },
  { id: 'es-e02', front: 'Call the police', back: 'Llame a la policía', category: 'emergency', difficulty: 2 },
  { id: 'es-e03', front: 'I need a doctor', back: 'Necesito un médico', category: 'emergency', difficulty: 2 },
  { id: 'es-e04', front: 'The hospital', back: 'El hospital', category: 'emergency', difficulty: 1 },
  { id: 'es-e05', front: 'I\'m lost', back: 'Estoy perdido/a', category: 'emergency', difficulty: 2 },
];

async function seed() {
  console.log(`Found ${SPANISH_PHRASES.length} Spanish phrases`);

  const cards = SPANISH_PHRASES.map(p => ({
    id: p.id,
    type: 'spanish',
    category: p.category,
    front: p.front,
    back: p.back,
    isPublic: true,
    meta: { difficulty: String(p.difficulty) },
  }));

  if (dryRun) {
    console.log(`\n[DRY RUN] Would write ${cards.length} public Spanish flashcards:`);
    for (const cat of [...new Set(cards.map(c => c.category))]) {
      const catCards = cards.filter(c => c.category === cat);
      console.log(`  ${cat}: ${catCards.length} cards`);
    }
    return;
  }

  const token = getToken();
  let count = 0;

  for (const card of cards) {
    await writeDoc(token, 'publicFlashcards', card.id, card);
    count++;
    if (count % 20 === 0) console.log(`  Written ${count}/${cards.length}...`);
  }

  console.log(`\nDone! Seeded ${count} public Spanish flashcards to publicFlashcards collection.`);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
