export interface ChineseCharacter {
  id: string;
  character: string;
  pinyin: string;
  meaning: string;
  category: CharacterCategory;
  createdBy?: { uid: string; displayName: string };
  editedBy?: { uid: string; displayName: string };
}

export type CharacterCategory =
  | 'family'
  | 'feelings'
  | 'food'
  | 'body'
  | 'house'
  | 'nature'
  | 'numbers'
  | 'phrases';

export const categoryOrder: CharacterCategory[] = [
  'family', 'feelings', 'food', 'body', 'house', 'nature', 'numbers', 'phrases',
];
