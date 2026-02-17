export interface ChineseCharacter {
  id: string;
  character: string;
  pinyin: string;
  meaning: string;
  category: CharacterCategory;
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

export const characters: ChineseCharacter[] = [
  // Family
  { id: 'f01', character: '妈妈', pinyin: 'māma', meaning: 'mom', category: 'family' },
  { id: 'f02', character: '爸爸', pinyin: 'bàba', meaning: 'dad', category: 'family' },
  { id: 'f03', character: '哥哥', pinyin: 'gēge', meaning: 'older brother', category: 'family' },
  { id: 'f04', character: '姐姐', pinyin: 'jiějie', meaning: 'older sister', category: 'family' },
  { id: 'f05', character: '宝宝', pinyin: 'bǎobao', meaning: 'baby', category: 'family' },
  { id: 'f06', character: '家', pinyin: 'jiā', meaning: 'home / family', category: 'family' },

  // Feelings
  { id: 'e01', character: '要', pinyin: 'yào', meaning: 'want', category: 'feelings' },
  { id: 'e02', character: '不要', pinyin: 'bùyào', meaning: "don't want", category: 'feelings' },
  { id: 'e03', character: '好', pinyin: 'hǎo', meaning: 'good', category: 'feelings' },
  { id: 'e04', character: '怕', pinyin: 'pà', meaning: 'scared', category: 'feelings' },
  { id: 'e05', character: '哭', pinyin: 'kū', meaning: 'cry', category: 'feelings' },
  { id: 'e06', character: '笑', pinyin: 'xiào', meaning: 'laugh', category: 'feelings' },
  { id: 'e07', character: '爱', pinyin: 'ài', meaning: 'love', category: 'feelings' },

  // Food & Drink
  { id: 'd01', character: '水', pinyin: 'shuǐ', meaning: 'water', category: 'food' },
  { id: 'd02', character: '奶', pinyin: 'nǎi', meaning: 'milk', category: 'food' },
  { id: 'd03', character: '饭', pinyin: 'fàn', meaning: 'rice / meal', category: 'food' },
  { id: 'd04', character: '吃', pinyin: 'chī', meaning: 'eat', category: 'food' },
  { id: 'd05', character: '喝', pinyin: 'hē', meaning: 'drink', category: 'food' },
  { id: 'd06', character: '果', pinyin: 'guǒ', meaning: 'fruit', category: 'food' },

  // Body & Actions
  { id: 'b01', character: '手', pinyin: 'shǒu', meaning: 'hand', category: 'body' },
  { id: 'b02', character: '脚', pinyin: 'jiǎo', meaning: 'foot', category: 'body' },
  { id: 'b03', character: '走', pinyin: 'zǒu', meaning: 'walk', category: 'body' },
  { id: 'b04', character: '跑', pinyin: 'pǎo', meaning: 'run', category: 'body' },
  { id: 'b05', character: '抱', pinyin: 'bào', meaning: 'hug', category: 'body' },
  { id: 'b06', character: '睡', pinyin: 'shuì', meaning: 'sleep', category: 'body' },

  // Around the House
  { id: 'h01', character: '门', pinyin: 'mén', meaning: 'door', category: 'house' },
  { id: 'h02', character: '灯', pinyin: 'dēng', meaning: 'light', category: 'house' },
  { id: 'h03', character: '床', pinyin: 'chuáng', meaning: 'bed', category: 'house' },
  { id: 'h04', character: '鞋', pinyin: 'xié', meaning: 'shoes', category: 'house' },
  { id: 'h05', character: '书', pinyin: 'shū', meaning: 'book', category: 'house' },

  // Nature & Animals
  { id: 'n01', character: '狗', pinyin: 'gǒu', meaning: 'dog', category: 'nature' },
  { id: 'n02', character: '猫', pinyin: 'māo', meaning: 'cat', category: 'nature' },
  { id: 'n03', character: '鱼', pinyin: 'yú', meaning: 'fish', category: 'nature' },
  { id: 'n04', character: '花', pinyin: 'huā', meaning: 'flower', category: 'nature' },
  { id: 'n05', character: '月', pinyin: 'yuè', meaning: 'moon', category: 'nature' },
  { id: 'n06', character: '星', pinyin: 'xīng', meaning: 'star', category: 'nature' },

  // Numbers
  { id: 'num01', character: '一', pinyin: 'yī', meaning: 'one', category: 'numbers' },
  { id: 'num02', character: '二', pinyin: 'èr', meaning: 'two', category: 'numbers' },
  { id: 'num03', character: '三', pinyin: 'sān', meaning: 'three', category: 'numbers' },
  { id: 'num04', character: '四', pinyin: 'sì', meaning: 'four', category: 'numbers' },
  { id: 'num05', character: '五', pinyin: 'wǔ', meaning: 'five', category: 'numbers' },
  { id: 'num06', character: '六', pinyin: 'liù', meaning: 'six', category: 'numbers' },
  { id: 'num07', character: '七', pinyin: 'qī', meaning: 'seven', category: 'numbers' },
  { id: 'num08', character: '八', pinyin: 'bā', meaning: 'eight', category: 'numbers' },
  { id: 'num09', character: '九', pinyin: 'jiǔ', meaning: 'nine', category: 'numbers' },
  { id: 'num10', character: '十', pinyin: 'shí', meaning: 'ten', category: 'numbers' },

  // Common Phrases
  { id: 'p01', character: '你好', pinyin: 'nǐhǎo', meaning: 'hello', category: 'phrases' },
  { id: 'p02', character: '谢谢', pinyin: 'xièxie', meaning: 'thank you', category: 'phrases' },
  { id: 'p03', character: '再见', pinyin: 'zàijiàn', meaning: 'goodbye', category: 'phrases' },
  { id: 'p04', character: '对不起', pinyin: 'duìbuqǐ', meaning: 'sorry', category: 'phrases' },
  { id: 'p05', character: '没关系', pinyin: 'méiguānxi', meaning: "it's okay", category: 'phrases' },
];

export const categoryOrder: CharacterCategory[] = [
  'family', 'feelings', 'food', 'body', 'house', 'nature', 'numbers', 'phrases',
];
