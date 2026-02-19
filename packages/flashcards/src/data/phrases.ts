export interface Phrase {
  id: string;
  english: string;
  chinese: string;
  phonetic: string;
  category: PhraseCategory;
  difficulty: 1 | 2 | 3;
}

export type PhraseCategory =
  | 'greetings'
  | 'feelings'
  | 'house'
  | 'food'
  | 'goingOut'
  | 'people'
  | 'time'
  | 'emergency';

export const phrases: Phrase[] = [
  // Basic Greetings
  { id: 'g01', english: 'Hi!', chinese: '嗨！', phonetic: 'hāi', category: 'greetings', difficulty: 1 },
  { id: 'g02', english: 'Bye bye!', chinese: '拜拜！', phonetic: 'bāibāi', category: 'greetings', difficulty: 1 },
  { id: 'g03', english: 'Please.', chinese: '请。', phonetic: 'plēez', category: 'greetings', difficulty: 1 },
  { id: 'g04', english: 'Thank you!', chinese: '谢谢你！', phonetic: 'thǐaŋk yōo', category: 'greetings', difficulty: 1 },
  { id: 'g05', english: 'Sorry.', chinese: '对不起。', phonetic: 'sǒrē', category: 'greetings', difficulty: 1 },
  { id: 'g06', english: "You're welcome.", chinese: '不客气。', phonetic: 'yōr wěl-kǐm', category: 'greetings', difficulty: 1 },
  { id: 'g07', english: 'Good morning!', chinese: '早上好！', phonetic: 'gǒod mōr-nǐŋ', category: 'greetings', difficulty: 1 },
  { id: 'g08', english: 'Good night!', chinese: '晚安！', phonetic: 'gǒod nāit', category: 'greetings', difficulty: 1 },
  { id: 'g09', english: 'See you later!', chinese: '回头见！', phonetic: 'sēe yōo lěi-tǐr', category: 'greetings', difficulty: 2 },
  { id: 'g10', english: 'Excuse me.', chinese: '打扰一下。', phonetic: 'ěk-skyōoz mēe', category: 'greetings', difficulty: 2 },

  // Feelings
  { id: 'fe01', english: "I'm happy.", chinese: '我很开心。', phonetic: 'āim hǎ-pēe', category: 'feelings', difficulty: 1 },
  { id: 'fe02', english: "I'm tired.", chinese: '我累了。', phonetic: 'āim tāi-ǐrd', category: 'feelings', difficulty: 1 },
  { id: 'fe03', english: "I'm hungry.", chinese: '我饿了。', phonetic: 'āim hǎŋ-grēe', category: 'feelings', difficulty: 1 },
  { id: 'fe04', english: "I don't feel well.", chinese: '我不舒服。', phonetic: 'āi dōnt fēel wěl', category: 'feelings', difficulty: 2 },
  { id: 'fe05', english: "I'm scared.", chinese: '我害怕。', phonetic: 'āim skěrd', category: 'feelings', difficulty: 1 },
  { id: 'fe06', english: "I'm thirsty.", chinese: '我渴了。', phonetic: 'āim thǐr-stēe', category: 'feelings', difficulty: 1 },
  { id: 'fe07', english: "I'm cold.", chinese: '我冷了。', phonetic: 'āim kōld', category: 'feelings', difficulty: 1 },
  { id: 'fe08', english: "I'm hot.", chinese: '我热了。', phonetic: 'āim hǒt', category: 'feelings', difficulty: 1 },
  { id: 'fe09', english: "I miss you.", chinese: '我想你。', phonetic: 'āi mǐs yōo', category: 'feelings', difficulty: 2 },
  { id: 'fe10', english: "I love you.", chinese: '我爱你。', phonetic: 'āi lǎv yōo', category: 'feelings', difficulty: 1 },

  // Around the House
  { id: 'h01', english: 'Open the door.', chinese: '开门。', phonetic: 'ō-pěn thǐ dōr', category: 'house', difficulty: 1 },
  { id: 'h02', english: 'Close the door.', chinese: '关门。', phonetic: 'klōz thǐ dōr', category: 'house', difficulty: 1 },
  { id: 'h03', english: 'Turn on the light.', chinese: '开灯。', phonetic: 'tǐrn ǒn thǐ lāit', category: 'house', difficulty: 2 },
  { id: 'h04', english: 'Turn off the light.', chinese: '关灯。', phonetic: 'tǐrn ǒf thǐ lāit', category: 'house', difficulty: 2 },
  { id: 'h05', english: 'Where is the...?', chinese: '……在哪里？', phonetic: 'wěr ǐz thǐ', category: 'house', difficulty: 2 },
  { id: 'h06', english: "Let's clean up.", chinese: '我们收拾一下。', phonetic: 'lěts klēen ǎp', category: 'house', difficulty: 2 },
  { id: 'h07', english: 'Time for bed.', chinese: '该睡觉了。', phonetic: 'tāim fōr běd', category: 'house', difficulty: 1 },
  { id: 'h08', english: 'Wash your hands.', chinese: '洗手。', phonetic: 'wǒsh yōr hǎndz', category: 'house', difficulty: 2 },
  { id: 'h09', english: 'Take a bath.', chinese: '洗澡。', phonetic: 'těik ǐ bǎth', category: 'house', difficulty: 2 },
  { id: 'h10', english: 'Put on your shoes.', chinese: '穿鞋。', phonetic: 'pǒot ǒn yōr shōoz', category: 'house', difficulty: 2 },

  // Food & Drink
  { id: 'fd01', english: 'I want water.', chinese: '我要水。', phonetic: 'āi wǒnt wǒ-tǐr', category: 'food', difficulty: 1 },
  { id: 'fd02', english: 'Can I have...?', chinese: '可以给我……吗？', phonetic: 'kǎn āi hǎv', category: 'food', difficulty: 2 },
  { id: 'fd03', english: "It's delicious!", chinese: '很好吃！', phonetic: 'ǐts dǐ-lǐ-shǐs', category: 'food', difficulty: 2 },
  { id: 'fd04', english: "I'm full.", chinese: '我饱了。', phonetic: 'āim fǒol', category: 'food', difficulty: 1 },
  { id: 'fd05', english: 'More, please.', chinese: '再来一点。', phonetic: 'mōr plēez', category: 'food', difficulty: 1 },
  { id: 'fd06', english: "I don't like it.", chinese: '我不喜欢。', phonetic: 'āi dōnt lāik ǐt', category: 'food', difficulty: 2 },
  { id: 'fd07', english: "Let's eat!", chinese: '吃饭啦！', phonetic: 'lěts ēet', category: 'food', difficulty: 1 },
  { id: 'fd08', english: 'I want milk.', chinese: '我要牛奶。', phonetic: 'āi wǒnt mǐlk', category: 'food', difficulty: 1 },
  { id: 'fd09', english: 'I want fruit.', chinese: '我要水果。', phonetic: 'āi wǒnt frōot', category: 'food', difficulty: 1 },
  { id: 'fd10', english: 'No, thank you.', chinese: '不用了，谢谢。', phonetic: 'nō thǎŋk yōo', category: 'food', difficulty: 1 },

  // Going Out
  { id: 'go01', english: "Let's go!", chinese: '走吧！', phonetic: 'lěts gō', category: 'goingOut', difficulty: 1 },
  { id: 'go02', english: 'Wait for me!', chinese: '等等我！', phonetic: 'wěit fōr mēe', category: 'goingOut', difficulty: 1 },
  { id: 'go03', english: 'Be careful!', chinese: '小心！', phonetic: 'bēe kěr-fǒol', category: 'goingOut', difficulty: 1 },
  { id: 'go04', english: 'How much is this?', chinese: '这个多少钱？', phonetic: 'hāo mǎch ǐz thǐs', category: 'goingOut', difficulty: 2 },
  { id: 'go05', english: "I don't understand.", chinese: '我不明白。', phonetic: 'āi dōnt ǎn-dǐr-stǎnd', category: 'goingOut', difficulty: 2 },
  { id: 'go06', english: 'Please say it again.', chinese: '请再说一遍。', phonetic: 'plēez sěi ǐt ǐ-gěn', category: 'goingOut', difficulty: 2 },
  { id: 'go07', english: 'Where is the bathroom?', chinese: '洗手间在哪里？', phonetic: 'wěr ǐz thǐ bǎth-rōom', category: 'goingOut', difficulty: 2 },
  { id: 'go08', english: 'Stop!', chinese: '停！', phonetic: 'stǒp', category: 'goingOut', difficulty: 1 },
  { id: 'go09', english: 'Hurry up!', chinese: '快点！', phonetic: 'hǎ-rēe ǎp', category: 'goingOut', difficulty: 1 },
  { id: 'go10', english: 'Slow down.', chinese: '慢一点。', phonetic: 'slō dāon', category: 'goingOut', difficulty: 1 },

  // People & Family
  { id: 'pf01', english: 'This is my mom.', chinese: '这是我妈妈。', phonetic: 'thǐs ǐz māi mǒm', category: 'people', difficulty: 1 },
  { id: 'pf02', english: 'This is my dad.', chinese: '这是我爸爸。', phonetic: 'thǐs ǐz māi dǎd', category: 'people', difficulty: 1 },
  { id: 'pf03', english: 'How are you?', chinese: '你好吗？', phonetic: 'hāo ǒr yōo', category: 'people', difficulty: 1 },
  { id: 'pf04', english: "I'm fine, thanks!", chinese: '我很好，谢谢！', phonetic: 'āim fāin thǎŋks', category: 'people', difficulty: 1 },
  { id: 'pf05', english: 'Nice to meet you!', chinese: '很高兴认识你！', phonetic: 'nāis tǒo mēet yōo', category: 'people', difficulty: 2 },
  { id: 'pf06', english: 'What is your name?', chinese: '你叫什么名字？', phonetic: 'wǒt ǐz yōr něim', category: 'people', difficulty: 2 },
  { id: 'pf07', english: 'My name is...', chinese: '我叫……', phonetic: 'māi něim ǐz', category: 'people', difficulty: 1 },
  { id: 'pf08', english: "Let's play together!", chinese: '一起玩吧！', phonetic: 'lěts plěi tǒo-gě-thǐr', category: 'people', difficulty: 2 },
  { id: 'pf09', english: "He's my friend.", chinese: '他是我的朋友。', phonetic: 'hēez māi frěnd', category: 'people', difficulty: 2 },
  { id: 'pf10', english: "She's my sister.", chinese: '她是我姐姐。', phonetic: 'shēez māi sǐs-tǐr', category: 'people', difficulty: 2 },

  // Time & Weather
  { id: 'tw01', english: 'What time is it?', chinese: '现在几点？', phonetic: 'wǒt tāim ǐz ǐt', category: 'time', difficulty: 2 },
  { id: 'tw02', english: "It's raining.", chinese: '下雨了。', phonetic: 'ǐts rěi-nǐŋ', category: 'time', difficulty: 1 },
  { id: 'tw03', english: "It's sunny today.", chinese: '今天是晴天。', phonetic: 'ǐts sǎ-nēe tǒo-děi', category: 'time', difficulty: 2 },
  { id: 'tw04', english: "It's cold today.", chinese: '今天很冷。', phonetic: 'ǐts kōld tǒo-děi', category: 'time', difficulty: 1 },
  { id: 'tw05', english: "It's hot today.", chinese: '今天很热。', phonetic: 'ǐts hǒt tǒo-děi', category: 'time', difficulty: 1 },
  { id: 'tw06', english: 'Today is Monday.', chinese: '今天是星期一。', phonetic: 'tǒo-děi ǐz mǎn-děi', category: 'time', difficulty: 2 },
  { id: 'tw07', english: "It's snowing!", chinese: '下雪了！', phonetic: 'ǐts snō-ǐŋ', category: 'time', difficulty: 1 },
  { id: 'tw08', english: "It's windy.", chinese: '刮风了。', phonetic: 'ǐts wǐn-dēe', category: 'time', difficulty: 1 },

  // Emergencies
  { id: 'em01', english: 'Help!', chinese: '救命！', phonetic: 'hělp', category: 'emergency', difficulty: 1 },
  { id: 'em02', english: 'I need a doctor.', chinese: '我需要看医生。', phonetic: 'āi nēed ǐ dǒk-tǐr', category: 'emergency', difficulty: 2 },
  { id: 'em03', english: "I'm lost.", chinese: '我迷路了。', phonetic: 'āim lǒst', category: 'emergency', difficulty: 1 },
  { id: 'em04', english: 'Call the police!', chinese: '报警！', phonetic: 'kǒl thǐ pǒ-lēes', category: 'emergency', difficulty: 2 },
  { id: 'em05', english: 'It hurts here.', chinese: '这里疼。', phonetic: 'ǐt hǐrts hēer', category: 'emergency', difficulty: 2 },
  { id: 'em06', english: "I'm allergic to...", chinese: '我对……过敏。', phonetic: 'āim ǐ-lǐr-jǐk tōo', category: 'emergency', difficulty: 3 },
  { id: 'em07', english: 'Please help me.', chinese: '请帮帮我。', phonetic: 'plēez hělp mēe', category: 'emergency', difficulty: 1 },
  { id: 'em08', english: 'I need medicine.', chinese: '我需要药。', phonetic: 'āi nēed mě-dǐ-sǐn', category: 'emergency', difficulty: 2 },
];

export const categoryOrder: PhraseCategory[] = [
  'greetings', 'feelings', 'house', 'food', 'goingOut', 'people', 'time', 'emergency',
];
