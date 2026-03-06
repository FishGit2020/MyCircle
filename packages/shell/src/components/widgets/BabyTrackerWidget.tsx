import React, { useEffect } from 'react';
import { useTranslation, StorageKeys } from '@mycircle/shared';

// Inline fruit-size lookup for widget — duplication necessary since we can't import from baby-tracker MFE
const BABY_SIZES: Record<'fruit' | 'animal' | 'vegetable', string[]> = {
  fruit: [
    '', 'poppy seed', 'poppy seed', 'poppy seed', 'poppy seed', 'sesame seed', 'lentil', 'blueberry',
    'raspberry', 'grape', 'kumquat', 'fig', 'lime', 'lemon', 'peach', 'apple', 'avocado', 'pear',
    'bell pepper', 'mango', 'banana', 'pomegranate', 'papaya', 'grapefruit', 'ear of corn', 'acorn squash',
    'large papaya', 'large pomelo', 'eggplant', 'butternut squash', 'large cucumber', 'coconut', 'small papaya',
    'pineapple', 'cantaloupe', 'honeydew melon', 'crenshaw melon', 'winter melon', 'small pumpkin',
    'mini watermelon', 'watermelon',
  ],
  animal: [
    '', 'flea', 'flea', 'flea', 'ant', 'tadpole', 'ladybug', 'bee',
    'tree frog', 'goldfish', 'hummingbird', 'mouse', 'hamster', 'gerbil', 'chipmunk', 'hedgehog', 'duckling', 'baby rabbit',
    'guinea pig', 'ferret', 'kitten', 'sugar glider', 'chinchilla', 'prairie dog', 'cottontail rabbit', 'barn owl',
    'groundhog', 'toy poodle', 'red panda', 'jackrabbit', 'small cat', 'raccoon', 'cocker spaniel',
    'armadillo', 'fox cub', 'beagle puppy', 'otter', 'koala', 'red fox',
    'corgi', 'small lamb',
  ],
  vegetable: [
    '', 'grain of salt', 'grain of salt', 'mustard seed', 'peppercorn', 'sesame seed', 'lentil', 'kidney bean',
    'chickpea', 'olive', 'Brussels sprout', 'baby carrot', 'jalape\u00f1o', 'snap pea pod', 'tomato', 'artichoke', 'beet', 'turnip',
    'bell pepper', 'zucchini', 'sweet potato', 'carrot', 'spaghetti squash', 'potato', 'ear of corn', 'rutabaga',
    'scallion bunch', 'cauliflower', 'eggplant', 'butternut squash', 'cabbage', 'coconut', 'jicama',
    'celery stalk', 'cantaloupe', 'honeydew melon', 'romaine lettuce', 'swiss chard', 'leek',
    'pumpkin', 'watermelon',
  ],
};
const BABY_CATEGORY_ICONS: Record<string, string> = { fruit: '\uD83C\uDF4E', animal: '\uD83D\uDC3E', vegetable: '\uD83E\uDD66' };

const BabyTrackerWidget = React.memo(function BabyTrackerWidget() {
  const { t } = useTranslation();
  const [weekInfo, setWeekInfo] = React.useState<{ week: number; day: number } | null>(null);
  const [category, setCategory] = React.useState<'fruit' | 'animal' | 'vegetable'>('fruit');

  useEffect(() => {
    function compute() {
      try {
        const stored = localStorage.getItem(StorageKeys.BABY_DUE_DATE);
        if (stored) {
          const dueDate = new Date(stored + 'T00:00:00');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const msPerDay = 24 * 60 * 60 * 1000;
          const totalDaysPregnant = Math.floor((today.getTime() - (dueDate.getTime() - 40 * 7 * msPerDay)) / msPerDay);
          const week = Math.floor(totalDaysPregnant / 7);
          const day = totalDaysPregnant % 7;
          if (week >= 1 && week <= 40) {
            setWeekInfo({ week, day });
          } else {
            setWeekInfo(null);
          }
        } else {
          setWeekInfo(null);
        }
      } catch { setWeekInfo(null); }
    }
    compute();
    window.addEventListener('baby-due-date-changed', compute);
    return () => window.removeEventListener('baby-due-date-changed', compute);
  }, []);

  const sizeLabel = weekInfo ? (BABY_SIZES[category][weekInfo.week] || '') : '';

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center text-pink-500">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.babyTracker')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.babyTrackerDesc')}</p>
        </div>
      </div>
      {weekInfo ? (
        <>
          <p className="text-sm text-pink-600 dark:text-pink-400 font-medium capitalize">
            {t('baby.week')} {weekInfo.week}{weekInfo.day > 0 ? ` + ${weekInfo.day} ${t('baby.days')}` : ''} — {sizeLabel}
          </p>
          <div className="flex gap-1 mt-1.5">
            {(['fruit', 'animal', 'vegetable'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCategory(cat); }}
                className={`px-2 py-0.5 rounded-full text-xs min-h-[28px] transition ${
                  category === cat
                    ? 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 font-medium'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-label={t(`baby.category${cat.charAt(0).toUpperCase() + cat.slice(1)}`)}
              >
                {BABY_CATEGORY_ICONS[cat]}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noDueDate')}</p>
      )}
    </div>
  );
});

export default BabyTrackerWidget;
