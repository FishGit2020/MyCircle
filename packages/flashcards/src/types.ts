export type CardType = 'chinese' | 'english' | 'bible-first-letter' | 'bible-full' | 'custom';

export interface FlashCard {
  id: string;
  type: CardType;
  category: string;
  front: string;
  back: string;
  meta?: {
    pinyin?: string;
    phonetic?: string;
    reference?: string;
    book?: string;
    chapter?: number;
    verses?: string;
  };
}

export interface FlashCardProgress {
  masteredIds: string[];
  lastPracticed: string;
}
