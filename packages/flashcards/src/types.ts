export type CardType = 'chinese' | 'english' | 'bible-first-letter' | 'bible-full' | 'custom';

export interface FlashCard {
  id: string;
  type: CardType;
  category: string;
  front: string;
  back: string;
  isPublic?: boolean;
  createdBy?: { uid: string; displayName: string };
  meta?: {
    pinyin?: string;
    phonetic?: string;
    reference?: string;
    book?: string;
    chapter?: number;
    verses?: string;
  };
}

export type VisibilityFilter = 'all' | 'private' | 'published';

export interface FlashCardProgress {
  masteredIds: string[];
  lastPracticed: string;
}
