export interface PregnancyVerse {
  reference: string;
  text?: string;
}

// Verse text is fetched from YouVersion API at runtime.
// Only references are stored locally.
export const pregnancyVerses: PregnancyVerse[] = [
  { reference: 'Psalm 139:13-14' },
  { reference: 'Jeremiah 1:5' },
  { reference: 'Proverbs 31:25' },
  { reference: 'Isaiah 49:15' },
  { reference: 'Psalm 127:3' },
  { reference: 'Isaiah 66:9' },
  { reference: 'Deuteronomy 7:13' },
  { reference: 'Psalm 113:9' },
  { reference: 'Genesis 1:28' },
  { reference: 'Luke 1:45' },
  { reference: 'Philippians 4:13' },
  { reference: 'Isaiah 40:31' },
  { reference: '3 John 1:2' },
  { reference: 'Psalm 121:7-8' },
  { reference: 'Romans 8:28' },
];
