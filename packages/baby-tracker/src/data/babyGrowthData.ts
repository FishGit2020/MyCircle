export interface BabyGrowthWeek {
  week: number;
  fruit: string;
  lengthCm: number;
  weightG: number;
  lengthIn: number;
  weightOz: number;
}

// Week-by-week baby growth data with fruit comparisons
// Sources: American Pregnancy Association, What to Expect
export const babyGrowthData: BabyGrowthWeek[] = [
  { week: 1,  fruit: 'poppy seed',      lengthCm: 0.01, weightG: 0,     lengthIn: 0,     weightOz: 0 },
  { week: 2,  fruit: 'poppy seed',      lengthCm: 0.01, weightG: 0,     lengthIn: 0,     weightOz: 0 },
  { week: 3,  fruit: 'poppy seed',      lengthCm: 0.01, weightG: 0,     lengthIn: 0,     weightOz: 0 },
  { week: 4,  fruit: 'poppy seed',      lengthCm: 0.1,  weightG: 0.04,  lengthIn: 0.04,  weightOz: 0.001 },
  { week: 5,  fruit: 'sesame seed',     lengthCm: 0.2,  weightG: 0.1,   lengthIn: 0.08,  weightOz: 0.004 },
  { week: 6,  fruit: 'lentil',          lengthCm: 0.6,  weightG: 0.2,   lengthIn: 0.24,  weightOz: 0.007 },
  { week: 7,  fruit: 'blueberry',       lengthCm: 1.3,  weightG: 0.8,   lengthIn: 0.51,  weightOz: 0.03 },
  { week: 8,  fruit: 'raspberry',       lengthCm: 1.6,  weightG: 1,     lengthIn: 0.63,  weightOz: 0.04 },
  { week: 9,  fruit: 'grape',           lengthCm: 2.3,  weightG: 2,     lengthIn: 0.9,   weightOz: 0.07 },
  { week: 10, fruit: 'kumquat',         lengthCm: 3.1,  weightG: 4,     lengthIn: 1.22,  weightOz: 0.14 },
  { week: 11, fruit: 'fig',             lengthCm: 4.1,  weightG: 7,     lengthIn: 1.61,  weightOz: 0.25 },
  { week: 12, fruit: 'lime',            lengthCm: 5.4,  weightG: 14,    lengthIn: 2.13,  weightOz: 0.49 },
  { week: 13, fruit: 'lemon',           lengthCm: 7.4,  weightG: 23,    lengthIn: 2.91,  weightOz: 0.81 },
  { week: 14, fruit: 'peach',           lengthCm: 8.7,  weightG: 43,    lengthIn: 3.42,  weightOz: 1.52 },
  { week: 15, fruit: 'apple',           lengthCm: 10.1, weightG: 70,    lengthIn: 3.98,  weightOz: 2.47 },
  { week: 16, fruit: 'avocado',         lengthCm: 11.6, weightG: 100,   lengthIn: 4.57,  weightOz: 3.53 },
  { week: 17, fruit: 'pear',            lengthCm: 13,   weightG: 140,   lengthIn: 5.12,  weightOz: 4.94 },
  { week: 18, fruit: 'bell pepper',     lengthCm: 14.2, weightG: 190,   lengthIn: 5.59,  weightOz: 6.7 },
  { week: 19, fruit: 'mango',           lengthCm: 15.3, weightG: 240,   lengthIn: 6.02,  weightOz: 8.47 },
  { week: 20, fruit: 'banana',          lengthCm: 25.6, weightG: 300,   lengthIn: 10.08, weightOz: 10.58 },
  { week: 21, fruit: 'carrot',          lengthCm: 26.7, weightG: 360,   lengthIn: 10.51, weightOz: 12.7 },
  { week: 22, fruit: 'papaya',          lengthCm: 27.8, weightG: 430,   lengthIn: 10.94, weightOz: 15.17 },
  { week: 23, fruit: 'grapefruit',      lengthCm: 28.9, weightG: 501,   lengthIn: 11.38, weightOz: 17.67 },
  { week: 24, fruit: 'ear of corn',     lengthCm: 30,   weightG: 600,   lengthIn: 11.81, weightOz: 21.16 },
  { week: 25, fruit: 'rutabaga',        lengthCm: 34.6, weightG: 660,   lengthIn: 13.62, weightOz: 23.28 },
  { week: 26, fruit: 'scallion bunch',  lengthCm: 35.6, weightG: 760,   lengthIn: 14.02, weightOz: 26.81 },
  { week: 27, fruit: 'cauliflower',     lengthCm: 36.6, weightG: 875,   lengthIn: 14.41, weightOz: 30.86 },
  { week: 28, fruit: 'eggplant',        lengthCm: 37.6, weightG: 1005,  lengthIn: 14.8,  weightOz: 35.45 },
  { week: 29, fruit: 'butternut squash', lengthCm: 38.6, weightG: 1153, lengthIn: 15.2,  weightOz: 40.67 },
  { week: 30, fruit: 'cabbage',         lengthCm: 39.9, weightG: 1319,  lengthIn: 15.71, weightOz: 46.52 },
  { week: 31, fruit: 'coconut',         lengthCm: 41.1, weightG: 1502,  lengthIn: 16.18, weightOz: 52.98 },
  { week: 32, fruit: 'jicama',          lengthCm: 42.4, weightG: 1702,  lengthIn: 16.69, weightOz: 60.03 },
  { week: 33, fruit: 'pineapple',       lengthCm: 43.7, weightG: 1918,  lengthIn: 17.2,  weightOz: 67.65 },
  { week: 34, fruit: 'cantaloupe',      lengthCm: 45,   weightG: 2146,  lengthIn: 17.72, weightOz: 75.71 },
  { week: 35, fruit: 'honeydew melon',  lengthCm: 46.2, weightG: 2383,  lengthIn: 18.19, weightOz: 84.07 },
  { week: 36, fruit: 'romaine lettuce', lengthCm: 47.4, weightG: 2622,  lengthIn: 18.66, weightOz: 92.5 },
  { week: 37, fruit: 'swiss chard',     lengthCm: 48.6, weightG: 2859,  lengthIn: 19.13, weightOz: 100.86 },
  { week: 38, fruit: 'leek',            lengthCm: 49.8, weightG: 3083,  lengthIn: 19.61, weightOz: 108.76 },
  { week: 39, fruit: 'mini watermelon', lengthCm: 50.7, weightG: 3288,  lengthIn: 19.96, weightOz: 115.99 },
  { week: 40, fruit: 'watermelon',      lengthCm: 51.2, weightG: 3462,  lengthIn: 20.16, weightOz: 122.12 },
];

export function getGrowthDataForWeek(week: number): BabyGrowthWeek | null {
  if (week < 1 || week > 40) return null;
  return babyGrowthData[week - 1] || null;
}

export function getTrimester(week: number): 1 | 2 | 3 {
  if (week <= 13) return 1;
  if (week <= 26) return 2;
  return 3;
}
