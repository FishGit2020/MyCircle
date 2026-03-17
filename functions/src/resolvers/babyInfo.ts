import { getFirestore } from 'firebase-admin/firestore';
import { GraphQLError } from 'graphql';

interface ResolverContext {
  uid: string | null;
}

function requireAuth(context: ResolverContext): string {
  if (!context.uid) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.uid;
}

// Embedded baby growth data — 40 weeks (duplicated from packages/baby-tracker to avoid cross-package import)
const BABY_GROWTH_DATA = [
  { week: 1,  fruit: 'poppy seed',      animal: 'flea',             vegetable: 'grain of salt',    lengthIn: 0,     weightOz: 0,     lengthCm: 0.01, weightG: 0 },
  { week: 2,  fruit: 'poppy seed',      animal: 'flea',             vegetable: 'grain of salt',    lengthIn: 0,     weightOz: 0,     lengthCm: 0.01, weightG: 0 },
  { week: 3,  fruit: 'poppy seed',      animal: 'flea',             vegetable: 'mustard seed',     lengthIn: 0,     weightOz: 0,     lengthCm: 0.01, weightG: 0 },
  { week: 4,  fruit: 'poppy seed',      animal: 'ant',              vegetable: 'peppercorn',       lengthIn: 0.04,  weightOz: 0.001, lengthCm: 0.1,  weightG: 0.04 },
  { week: 5,  fruit: 'sesame seed',     animal: 'tadpole',          vegetable: 'sesame seed',      lengthIn: 0.08,  weightOz: 0.004, lengthCm: 0.2,  weightG: 0.1 },
  { week: 6,  fruit: 'lentil',          animal: 'ladybug',          vegetable: 'lentil',           lengthIn: 0.24,  weightOz: 0.007, lengthCm: 0.6,  weightG: 0.2 },
  { week: 7,  fruit: 'blueberry',       animal: 'bee',              vegetable: 'kidney bean',      lengthIn: 0.51,  weightOz: 0.03,  lengthCm: 1.3,  weightG: 0.8 },
  { week: 8,  fruit: 'raspberry',       animal: 'tree frog',        vegetable: 'chickpea',         lengthIn: 0.63,  weightOz: 0.04,  lengthCm: 1.6,  weightG: 1 },
  { week: 9,  fruit: 'grape',           animal: 'goldfish',         vegetable: 'olive',            lengthIn: 0.9,   weightOz: 0.07,  lengthCm: 2.3,  weightG: 2 },
  { week: 10, fruit: 'kumquat',         animal: 'hummingbird',      vegetable: 'Brussels sprout',  lengthIn: 1.22,  weightOz: 0.14,  lengthCm: 3.1,  weightG: 4 },
  { week: 11, fruit: 'fig',             animal: 'mouse',            vegetable: 'baby carrot',      lengthIn: 1.61,  weightOz: 0.25,  lengthCm: 4.1,  weightG: 7 },
  { week: 12, fruit: 'lime',            animal: 'hamster',          vegetable: 'jalape\u00f1o',    lengthIn: 2.13,  weightOz: 0.49,  lengthCm: 5.4,  weightG: 14 },
  { week: 13, fruit: 'lemon',           animal: 'gerbil',           vegetable: 'snap pea pod',     lengthIn: 2.91,  weightOz: 0.81,  lengthCm: 7.4,  weightG: 23 },
  { week: 14, fruit: 'peach',           animal: 'chipmunk',         vegetable: 'tomato',           lengthIn: 3.42,  weightOz: 1.52,  lengthCm: 8.7,  weightG: 43 },
  { week: 15, fruit: 'apple',           animal: 'hedgehog',         vegetable: 'artichoke',        lengthIn: 3.98,  weightOz: 2.47,  lengthCm: 10.1, weightG: 70 },
  { week: 16, fruit: 'avocado',         animal: 'duckling',         vegetable: 'beet',             lengthIn: 4.57,  weightOz: 3.53,  lengthCm: 11.6, weightG: 100 },
  { week: 17, fruit: 'pear',            animal: 'baby rabbit',      vegetable: 'turnip',           lengthIn: 5.12,  weightOz: 4.94,  lengthCm: 13,   weightG: 140 },
  { week: 18, fruit: 'bell pepper',     animal: 'guinea pig',       vegetable: 'bell pepper',      lengthIn: 5.59,  weightOz: 6.7,   lengthCm: 14.2, weightG: 190 },
  { week: 19, fruit: 'mango',           animal: 'ferret',           vegetable: 'zucchini',         lengthIn: 6.02,  weightOz: 8.47,  lengthCm: 15.3, weightG: 240 },
  { week: 20, fruit: 'banana',          animal: 'kitten',           vegetable: 'sweet potato',     lengthIn: 10.08, weightOz: 10.58, lengthCm: 25.6, weightG: 300 },
  { week: 21, fruit: 'pomegranate',     animal: 'sugar glider',     vegetable: 'carrot',           lengthIn: 10.51, weightOz: 12.7,  lengthCm: 26.7, weightG: 360 },
  { week: 22, fruit: 'papaya',          animal: 'chinchilla',       vegetable: 'spaghetti squash', lengthIn: 10.94, weightOz: 15.17, lengthCm: 27.8, weightG: 430 },
  { week: 23, fruit: 'grapefruit',      animal: 'prairie dog',      vegetable: 'potato',           lengthIn: 11.38, weightOz: 17.67, lengthCm: 28.9, weightG: 501 },
  { week: 24, fruit: 'ear of corn',     animal: 'cottontail rabbit', vegetable: 'ear of corn',     lengthIn: 11.81, weightOz: 21.16, lengthCm: 30,   weightG: 600 },
  { week: 25, fruit: 'acorn squash',    animal: 'barn owl',         vegetable: 'rutabaga',         lengthIn: 13.62, weightOz: 23.28, lengthCm: 34.6, weightG: 660 },
  { week: 26, fruit: 'large papaya',    animal: 'groundhog',        vegetable: 'scallion bunch',   lengthIn: 14.02, weightOz: 26.81, lengthCm: 35.6, weightG: 760 },
  { week: 27, fruit: 'large pomelo',    animal: 'toy poodle',       vegetable: 'cauliflower',      lengthIn: 14.41, weightOz: 30.86, lengthCm: 36.6, weightG: 875 },
  { week: 28, fruit: 'eggplant',        animal: 'red panda',        vegetable: 'eggplant',         lengthIn: 14.8,  weightOz: 35.45, lengthCm: 37.6, weightG: 1005 },
  { week: 29, fruit: 'butternut squash', animal: 'jackrabbit',      vegetable: 'butternut squash', lengthIn: 15.2,  weightOz: 40.67, lengthCm: 38.6, weightG: 1153 },
  { week: 30, fruit: 'large cucumber',  animal: 'small cat',        vegetable: 'cabbage',          lengthIn: 15.71, weightOz: 46.52, lengthCm: 39.9, weightG: 1319 },
  { week: 31, fruit: 'coconut',         animal: 'raccoon',          vegetable: 'coconut',          lengthIn: 16.18, weightOz: 52.98, lengthCm: 41.1, weightG: 1502 },
  { week: 32, fruit: 'small papaya',    animal: 'cocker spaniel',   vegetable: 'jicama',           lengthIn: 16.69, weightOz: 60.03, lengthCm: 42.4, weightG: 1702 },
  { week: 33, fruit: 'pineapple',       animal: 'armadillo',        vegetable: 'celery stalk',     lengthIn: 17.2,  weightOz: 67.65, lengthCm: 43.7, weightG: 1918 },
  { week: 34, fruit: 'cantaloupe',      animal: 'fox cub',          vegetable: 'cantaloupe',       lengthIn: 17.72, weightOz: 75.71, lengthCm: 45,   weightG: 2146 },
  { week: 35, fruit: 'honeydew melon',  animal: 'beagle puppy',     vegetable: 'honeydew melon',   lengthIn: 18.19, weightOz: 84.07, lengthCm: 46.2, weightG: 2383 },
  { week: 36, fruit: 'crenshaw melon',  animal: 'otter',            vegetable: 'romaine lettuce',  lengthIn: 18.66, weightOz: 92.5,  lengthCm: 47.4, weightG: 2622 },
  { week: 37, fruit: 'winter melon',    animal: 'koala',            vegetable: 'swiss chard',      lengthIn: 19.13, weightOz: 100.86, lengthCm: 48.6, weightG: 2859 },
  { week: 38, fruit: 'small pumpkin',   animal: 'red fox',          vegetable: 'leek',             lengthIn: 19.61, weightOz: 108.76, lengthCm: 49.8, weightG: 3083 },
  { week: 39, fruit: 'mini watermelon', animal: 'corgi',            vegetable: 'pumpkin',          lengthIn: 19.96, weightOz: 115.99, lengthCm: 50.7, weightG: 3288 },
  { week: 40, fruit: 'watermelon',      animal: 'small lamb',       vegetable: 'watermelon',       lengthIn: 20.16, weightOz: 122.12, lengthCm: 51.2, weightG: 3462 },
];

function calculateGestationalAge(dueDateStr: string): { weeks: number; days: number; totalDays: number } {
  const dueDate = new Date(dueDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / msPerDay);
  const totalDays = 280 - daysUntilDue; // 40 weeks = 280 days
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { weeks, days, totalDays };
}

export function createBabyInfoResolvers() {
  return {
    Query: {
      babyInfo: async (_: unknown, __: unknown, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();

        // Get user doc for dueDate
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();

        // Check children subcollection for dueDate if not on user doc
        let dueDate: string | null = userData?.dueDate ?? null;
        if (!dueDate) {
          const childrenSnap = await db
            .collection('users').doc(uid).collection('children')
            .where('dueDate', '!=', null)
            .limit(1)
            .get();
          if (!childrenSnap.empty) {
            dueDate = childrenSnap.docs[0].data().dueDate;
          }
        }

        if (!dueDate) {
          throw new GraphQLError('No due date found. Set a due date in Baby Tracker first.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        const { weeks, days } = calculateGestationalAge(dueDate);
        const clampedWeek = Math.max(1, Math.min(40, weeks));
        const weeksRemaining = Math.max(0, 40 - weeks);
        const growthData = BABY_GROWTH_DATA[clampedWeek - 1];

        return {
          dueDate,
          currentWeek: weeks,
          currentDay: days,
          weeksRemaining,
          fruit: growthData.fruit,
          animal: growthData.animal,
          vegetable: growthData.vegetable,
          length: `${growthData.lengthIn} in (${growthData.lengthCm} cm)`,
          weight: `${growthData.weightOz} oz (${growthData.weightG} g)`,
        };
      },
    },
  };
}
