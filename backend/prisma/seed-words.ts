/**
 * Seed dataset — mirror of src/lib/words.seed.ts (frontend).
 * Keep the two files in sync manually; the shared schema lives here
 * because backend/tsconfig.json's `rootDir: "src"` forbids imports from
 * the frontend tree. Pure data export — no Prisma types referenced.
 */

export type PartOfSpeechCode =
  | "NOUN"
  | "VERB"
  | "ADJ"
  | "ADV"
  | "PARTICLE"
  | "INTERJ"
  | "DET"
  | "PRONOUN"
  | "NUMERAL";

export type ExamCode =
  | "TOPIK_I"
  | "TOPIK_II_MID"
  | "TOPIK_II_ADV"
  | "KIIP"
  | "EPS_TOPIK"
  | "THEME";

export interface SeedHanja {
  char: string;
  meaning: string;
  sound: string;
}

export interface SeedEtymology {
  origin: string;
  language: "Sino-Korean" | "Native" | "Loanword";
  rootWords: SeedHanja[] | string[];
  evolution?: string;
  originEn?: string;
}

export interface SeedExample {
  sentence: string;
  translation: string;
  highlight?: string;
}

export interface SeedMnemonic {
  englishHint: string;
  syllables: string[];
}

export interface SeedCollocation {
  phrase: string;
  translation: string;
}

export interface SeedWord {
  id: string;
  word: string;
  romanization: string;
  ipa: string;
  definitionEn: string;
  partOfSpeech: PartOfSpeechCode;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  exam: ExamCode;
  mnemonic?: SeedMnemonic;
  etymology?: SeedEtymology;
  morphology?: { prefix?: string; root?: string; suffix?: string; note?: string };
  examples: SeedExample[];
  collocations: SeedCollocation[];
  synonyms?: string[];
  antonyms?: string[];
  tags?: string[];
}


// Seed dataset — 10 canonical words across TOPIK I / II levels.
// Every entry carries the full content anatomy mandated by the spec §4-2:
//   • 4 example sentences (Korean + English gloss + highlight token)
//   • 3 collocations (natural phrases used by native speakers)
//   • Hanja / etymology breakdown for Sino-Korean words
//   • Morphology (prefix/root/suffix) where relevant
//   • Synonyms + antonyms
//   • AI Mnemonic (English syllable hook)
// Bulk content (2,000+ words) will be produced by the Claude + Stability AI
// pipeline (see /internal/generate-content-continuous in the ops repo).
export const SEED_WORDS: SeedWord[] = [
  {
    id: "w_pogihada",
    word: "포기하다",
    romanization: "pogihada",
    ipa: "/po̞.ɡi.ɦa̠.da/",
    definitionEn: "to give up; to abandon",
    partOfSpeech: "VERB",
    level: 2,
    exam: "TOPIK_I",
    conceptImageUrl: "/images/concept/pogihada.svg",
    mnemonic: {
      englishHint: "PO-GI-HA-DA → POst it and GO, HA! Done Already.",
      syllables: ["포", "기", "하", "다"],
    },
    etymology: {
      origin: "抛棄",
      language: "Sino-Korean",
      rootWords: [
        { char: "抛", meaning: "throw", sound: "포" },
        { char: "棄", meaning: "abandon", sound: "기" },
      ],
      evolution: "抛棄 (Sino-Korean compound) + 하다 (verbalizing suffix)",
      originEn: "抛 (throw away) + 棄 (discard) → 'to throw away and discard'.",
    },
    morphology: { root: "포기", suffix: "하다", note: "Noun + 하다 verb construction" },
    examples: [
      { sentence: "저는 꿈을 포기하지 않아요.", translation: "I don't give up on my dreams.", highlight: "포기" },
      { sentence: "시험을 포기하면 안 돼요.", translation: "You must not give up on the exam.", highlight: "포기" },
      { sentence: "그는 결국 포기했다.", translation: "He eventually gave up.", highlight: "포기" },
      { sentence: "쉽게 포기하지 마세요.", translation: "Don't give up easily.", highlight: "포기" },
    ],
    collocations: [
      { phrase: "꿈을 포기하다", translation: "to give up on a dream" },
      { phrase: "희망을 포기하다", translation: "to give up hope" },
      { phrase: "계획을 포기하다", translation: "to abandon a plan" },
    ],
    synonyms: ["단념하다", "체념하다"],
    antonyms: ["계속하다", "도전하다"],
    tags: ["emotion", "willpower"],
  },
  {
    id: "w_gamsahada",
    word: "감사하다",
    romanization: "gamsahada",
    ipa: "/ka̠m.sʰa̠.ɦa̠.da/",
    definitionEn: "to be thankful; to thank",
    partOfSpeech: "VERB",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "GAM-SA → 'GUM SAck' you thank a friend for sharing.",
      syllables: ["감", "사", "하", "다"],
    },
    etymology: {
      origin: "感謝",
      language: "Sino-Korean",
      rootWords: [
        { char: "感", meaning: "feel", sound: "감" },
        { char: "謝", meaning: "thank", sound: "사" },
      ],
      evolution: "感謝 (Sino-Korean) + 하다 (verbalizer)",
      originEn: "感 (to feel) + 謝 (to thank) → 'to feel gratitude'.",
    },
    morphology: { root: "감사", suffix: "하다" },
    examples: [
      { sentence: "정말 감사합니다.", translation: "Thank you very much.", highlight: "감사" },
      { sentence: "도와주셔서 감사해요.", translation: "Thank you for your help.", highlight: "감사" },
      { sentence: "선물 감사합니다.", translation: "Thanks for the gift.", highlight: "감사" },
      { sentence: "늘 감사하는 마음으로 살아요.", translation: "I live with a grateful heart.", highlight: "감사" },
    ],
    collocations: [
      { phrase: "감사 인사", translation: "a word of thanks" },
      { phrase: "감사의 마음", translation: "feeling of gratitude" },
      { phrase: "감사 드립니다", translation: "I give my thanks (formal)" },
    ],
    synonyms: ["고맙다"],
    antonyms: ["원망하다"],
    tags: ["daily", "etiquette"],
  },
  {
    id: "w_gyeongheom",
    word: "경험",
    romanization: "gyeongheom",
    ipa: "/kjʌ̹ŋ.ɦʌ̹m/",
    definitionEn: "experience",
    partOfSpeech: "NOUN",
    level: 3,
    exam: "TOPIK_II_MID",
    mnemonic: {
      englishHint: "GYEONG-HEOM → 'GONE HOME' with stories to tell — that's experience.",
      syllables: ["경", "험"],
    },
    etymology: {
      origin: "經驗",
      language: "Sino-Korean",
      rootWords: [
        { char: "經", meaning: "pass through", sound: "경" },
        { char: "驗", meaning: "test", sound: "험" },
      ],
      evolution: "經驗 — used in classical Chinese from Han dynasty philosophy texts.",
      originEn: "經 (pass through) + 驗 (test) → 'what one has gone through and tested'.",
    },
    examples: [
      { sentence: "저는 한국에서 일한 경험이 있어요.", translation: "I have experience working in Korea.", highlight: "경험" },
      { sentence: "좋은 경험이 되었어요.", translation: "It was a good experience.", highlight: "경험" },
      { sentence: "그는 경험이 많은 의사이다.", translation: "He is an experienced doctor.", highlight: "경험" },
      { sentence: "새로운 경험을 해 보고 싶어요.", translation: "I want to try new experiences.", highlight: "경험" },
    ],
    collocations: [
      { phrase: "경험을 쌓다", translation: "to accumulate experience" },
      { phrase: "경험이 풍부하다", translation: "to be rich in experience" },
      { phrase: "경험을 살리다", translation: "to make use of one's experience" },
    ],
    synonyms: ["체험", "경력"],
    antonyms: ["무경험"],
    tags: ["abstract", "work"],
  },
  {
    id: "w_areumdapda",
    word: "아름답다",
    romanization: "areumdapda",
    ipa: "/a̠.ɾɯm.da̠p̚.t͈a̠/",
    definitionEn: "to be beautiful",
    partOfSpeech: "ADJ",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "A-REUM-DAP-DA → 'A ROOM DAPpled with light' — beautiful.",
      syllables: ["아", "름", "답", "다"],
    },
    etymology: {
      origin: "아름 + -답다",
      language: "Native",
      rootWords: [
        "아름 (middle Korean: a full armful)",
        "-답다 (suffix: is like / is worthy of)",
      ],
      evolution: "'A full armful worth' → that which is worthy of one's embrace = beautiful.",
      originEn: "Native Korean. Something 'as full and worthy as one's embrace'.",
    },
    morphology: { root: "아름", suffix: "-답다", note: "Native root + descriptive adjective suffix" },
    examples: [
      { sentence: "한국의 가을은 정말 아름다워요.", translation: "Korean autumn is truly beautiful.", highlight: "아름" },
      { sentence: "그녀의 목소리가 아름답다.", translation: "Her voice is beautiful.", highlight: "아름" },
      { sentence: "아름다운 풍경이네요.", translation: "What a beautiful view.", highlight: "아름" },
      { sentence: "아름다운 기억만 남았어요.", translation: "Only beautiful memories remain.", highlight: "아름" },
    ],
    collocations: [
      { phrase: "아름다운 풍경", translation: "a beautiful landscape" },
      { phrase: "아름다운 마음", translation: "a beautiful heart" },
      { phrase: "아름다운 추억", translation: "beautiful memories" },
    ],
    synonyms: ["예쁘다", "곱다"],
    antonyms: ["못생기다", "추하다"],
    tags: ["nature", "aesthetic"],
  },
  {
    id: "w_annyeong",
    word: "안녕하세요",
    romanization: "annyeonghaseyo",
    ipa: "/a̠n.njʌ̹ŋ.ɦa̠.sʰe̞.jo̞/",
    definitionEn: "hello (polite greeting)",
    partOfSpeech: "INTERJ",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "AN-NYEONG → 'ARE YOU YOUNG?' — traditional polite greeting.",
      syllables: ["안", "녕", "하", "세", "요"],
    },
    etymology: {
      origin: "安寧",
      language: "Sino-Korean",
      rootWords: [
        { char: "安", meaning: "peace", sound: "안" },
        { char: "寧", meaning: "tranquil", sound: "녕" },
      ],
      evolution: "安寧하다 (to be at peace) → 안녕하세요 (polite interrogative greeting).",
      originEn: "Literally 'are you at peace?' — a wish for the listener's wellbeing.",
    },
    examples: [
      { sentence: "안녕하세요, 만나서 반갑습니다.", translation: "Hello, nice to meet you.", highlight: "안녕" },
      { sentence: "선생님, 안녕하세요.", translation: "Hello, teacher.", highlight: "안녕" },
      { sentence: "여러분, 안녕하세요!", translation: "Hello, everyone!", highlight: "안녕" },
      { sentence: "안녕하세요? 저는 민수입니다.", translation: "Hello, I'm Minsu.", highlight: "안녕" },
    ],
    collocations: [
      { phrase: "안녕히 가세요", translation: "goodbye (to someone leaving)" },
      { phrase: "안녕히 계세요", translation: "goodbye (to someone staying)" },
      { phrase: "안녕히 주무세요", translation: "good night (formal)" },
    ],
    synonyms: ["안녕", "하이"],
    tags: ["daily", "etiquette"],
  },
  {
    id: "w_gongbuhada",
    word: "공부하다",
    romanization: "gongbuhada",
    ipa: "/ko̞ŋ.bu.ɦa̠.da̠/",
    definitionEn: "to study",
    partOfSpeech: "VERB",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "GONG-BU → ring the GONG and open the BOOk — time to study.",
      syllables: ["공", "부", "하", "다"],
    },
    etymology: {
      origin: "工夫",
      language: "Sino-Korean",
      rootWords: [
        { char: "工", meaning: "work", sound: "공" },
        { char: "夫", meaning: "effort", sound: "부" },
      ],
      evolution: "工夫 originally meant 'the effort of artisans'; evolved to 'study' in Korean.",
      originEn: "工 (work) + 夫 (effort) → 'to put in effort to learn'.",
    },
    morphology: { root: "공부", suffix: "하다" },
    examples: [
      { sentence: "저는 한국어를 공부해요.", translation: "I study Korean.", highlight: "공부" },
      { sentence: "도서관에서 공부하고 있어요.", translation: "I'm studying at the library.", highlight: "공부" },
      { sentence: "매일 두 시간씩 공부한다.", translation: "I study for two hours every day.", highlight: "공부" },
      { sentence: "열심히 공부하세요.", translation: "Please study hard.", highlight: "공부" },
    ],
    collocations: [
      { phrase: "열심히 공부하다", translation: "to study hard" },
      { phrase: "한국어를 공부하다", translation: "to study Korean" },
      { phrase: "시험 공부", translation: "exam preparation" },
    ],
    synonyms: ["배우다", "학습하다"],
    antonyms: ["놀다"],
    tags: ["school", "daily"],
  },
  {
    id: "w_sarang",
    word: "사랑하다",
    romanization: "saranghada",
    ipa: "/sʰa̠.ɾa̠ŋ.ɦa̠.da̠/",
    definitionEn: "to love",
    partOfSpeech: "VERB",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "SA-RANG → 'SARANG' rhymes with 'SUNG' — sung from the heart.",
      syllables: ["사", "랑", "하", "다"],
    },
    etymology: {
      origin: "사랑",
      language: "Native",
      rootWords: [
        "사랑 (native Korean noun: love)",
        "-하다 (verbalizer)",
      ],
      evolution: "One of the oldest recorded native Korean words — appears in 15th-century Hangul texts.",
      originEn: "A pure native Korean word with no Hanja root.",
    },
    morphology: { root: "사랑", suffix: "하다" },
    examples: [
      { sentence: "저는 당신을 사랑해요.", translation: "I love you.", highlight: "사랑" },
      { sentence: "가족을 사랑합니다.", translation: "I love my family.", highlight: "사랑" },
      { sentence: "음악을 사랑하는 사람.", translation: "A person who loves music.", highlight: "사랑" },
      { sentence: "자기 자신을 사랑하세요.", translation: "Love yourself.", highlight: "사랑" },
    ],
    collocations: [
      { phrase: "사랑에 빠지다", translation: "to fall in love" },
      { phrase: "사랑을 고백하다", translation: "to confess one's love" },
      { phrase: "사랑을 받다", translation: "to be loved" },
    ],
    synonyms: ["아끼다", "좋아하다"],
    antonyms: ["미워하다", "증오하다"],
    tags: ["emotion", "kdrama"],
  },
  {
    id: "w_chwijik",
    word: "취직",
    romanization: "chwijik",
    ipa: "/t͡ɕʰɥi.d͡ʑik̚/",
    definitionEn: "getting a job; employment",
    partOfSpeech: "NOUN",
    level: 4,
    exam: "TOPIK_II_MID",
    mnemonic: {
      englishHint: "CHWI-JIK → 'CHOOSE the JOB' — you got hired.",
      syllables: ["취", "직"],
    },
    etymology: {
      origin: "就職",
      language: "Sino-Korean",
      rootWords: [
        { char: "就", meaning: "take up", sound: "취" },
        { char: "職", meaning: "post", sound: "직" },
      ],
      evolution: "就職 — a Sino-Korean term also shared with modern Japanese (shūshoku).",
      originEn: "就 (take up) + 職 (post / position) → 'to take up a position'.",
    },
    examples: [
      { sentence: "대학 졸업 후 취직했어요.", translation: "I got a job after graduating.", highlight: "취직" },
      { sentence: "요즘 취직이 어려워요.", translation: "It's hard to get a job these days.", highlight: "취직" },
      { sentence: "한국 회사에 취직하고 싶어요.", translation: "I want to get a job at a Korean company.", highlight: "취직" },
      { sentence: "취직 준비를 하고 있어요.", translation: "I'm preparing for the job market.", highlight: "취직" },
    ],
    collocations: [
      { phrase: "취직 활동", translation: "job-hunting" },
      { phrase: "취직 시험", translation: "employment exam" },
      { phrase: "취직이 되다", translation: "to get hired" },
    ],
    synonyms: ["취업", "입사"],
    antonyms: ["퇴직", "실업"],
    tags: ["work", "EPS"],
  },
  {
    id: "w_yaksok",
    word: "약속",
    romanization: "yaksok",
    ipa: "/ja̠k̚.s͈o̞k̚/",
    definitionEn: "a promise; an appointment",
    partOfSpeech: "NOUN",
    level: 2,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "YAK-SOK → 'YAK, sock it to me' — a promise is a handshake locked in.",
      syllables: ["약", "속"],
    },
    etymology: {
      origin: "約束",
      language: "Sino-Korean",
      rootWords: [
        { char: "約", meaning: "bind", sound: "약" },
        { char: "束", meaning: "tie", sound: "속" },
      ],
      evolution: "約束 — literally 'to bind and tie', metaphor for an unbreakable commitment.",
      originEn: "約 (bind) + 束 (tie) → 'to bind and tie' = a sworn commitment.",
    },
    examples: [
      { sentence: "내일 친구와 약속이 있어요.", translation: "I have plans with a friend tomorrow.", highlight: "약속" },
      { sentence: "약속을 꼭 지키세요.", translation: "Please keep your promise.", highlight: "약속" },
      { sentence: "그 약속은 못 지켰어요.", translation: "I couldn't keep that promise.", highlight: "약속" },
      { sentence: "우리는 다시 만나기로 약속했다.", translation: "We promised to meet again.", highlight: "약속" },
    ],
    collocations: [
      { phrase: "약속을 지키다", translation: "to keep a promise" },
      { phrase: "약속을 잡다", translation: "to make an appointment" },
      { phrase: "약속을 어기다", translation: "to break a promise" },
    ],
    synonyms: ["언약", "서약"],
    antonyms: ["거짓말", "배신"],
    tags: ["social", "daily"],
  },
  {
    id: "w_computer",
    word: "컴퓨터",
    romanization: "keompyuteo",
    ipa: "/kʰʌ̹m.pʰju.tʰʌ̹/",
    definitionEn: "computer",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "KEOM-PYU-TEO → just say 'computer' with a Korean accent.",
      syllables: ["컴", "퓨", "터"],
    },
    etymology: {
      origin: "computer (English)",
      language: "Loanword",
      rootWords: ["영어: computer"],
      evolution: "Direct transliteration; alternatives like 전자계산기 (電子計算機) never caught on.",
      originEn: "Pure loanword from English, written in Hangul phonetically.",
    },
    examples: [
      { sentence: "저는 컴퓨터를 좋아해요.", translation: "I like computers.", highlight: "컴퓨터" },
      { sentence: "컴퓨터가 고장 났어요.", translation: "The computer is broken.", highlight: "컴퓨터" },
      { sentence: "매일 컴퓨터로 일해요.", translation: "I work on a computer every day.", highlight: "컴퓨터" },
      { sentence: "새 컴퓨터를 샀어요.", translation: "I bought a new computer.", highlight: "컴퓨터" },
    ],
    collocations: [
      { phrase: "컴퓨터 게임", translation: "computer game" },
      { phrase: "컴퓨터를 켜다", translation: "to turn on the computer" },
      { phrase: "컴퓨터를 끄다", translation: "to turn off the computer" },
    ],
    synonyms: ["PC", "전산기"],
    tags: ["technology", "loanword"],
  },

  // ─── TOPIK I · Level 1 pack (2026-04 addition) ───────────────────────────
  // Ten high-frequency L1 words covering food, places, time, family and
  // basic motion / state verbs. Bulk catalog (2,000+ words) still lands via
  // the Claude + Stability AI pipeline — this pack is just enough to make
  // every dashboard category render useful content today.
  {
    id: "w_bap",
    word: "밥",
    romanization: "bap",
    ipa: "/pa̠p̚/",
    definitionEn: "cooked rice; a meal",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "BAP → 'BOP' your spoon on the bowl of rice before you eat.",
      syllables: ["밥"],
    },
    etymology: {
      origin: "밥",
      language: "Native",
      rootWords: ["Native Korean root — attested in 15th-century Hangul texts."],
      originEn:
        "Native Korean; metonymically means 'a meal' because rice is the default staple.",
    },
    examples: [
      { sentence: "밥 먹었어요?", translation: "Have you eaten? (a common greeting).", highlight: "밥" },
      { sentence: "저는 매일 밥을 먹어요.", translation: "I eat rice every day.", highlight: "밥" },
    ],
    collocations: [
      { phrase: "밥을 먹다", translation: "to eat a meal" },
      { phrase: "밥을 짓다", translation: "to cook rice" },
    ],
    synonyms: ["식사", "진지"],
    tags: ["food", "daily"],
  },
  {
    id: "w_mul",
    word: "물",
    romanization: "mul",
    ipa: "/mul/",
    definitionEn: "water",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "MUL → 'MOOOL'-ticup glass of water. Drink it all.",
      syllables: ["물"],
    },
    etymology: {
      origin: "물",
      language: "Native",
      rootWords: ["Native Korean; 'mur' in older Korean."],
      originEn: "One of the basic Native Korean nouns — no Hanja root.",
    },
    examples: [
      { sentence: "물 한 잔 주세요.", translation: "Please give me a glass of water.", highlight: "물" },
      { sentence: "물이 차가워요.", translation: "The water is cold.", highlight: "물" },
    ],
    collocations: [
      { phrase: "물을 마시다", translation: "to drink water" },
      { phrase: "찬물 / 따뜻한 물", translation: "cold water / warm water" },
    ],
    tags: ["food", "daily"],
  },
  {
    id: "w_byeongwon",
    word: "병원",
    romanization: "byeongwon",
    ipa: "/pjʌ̹ŋ.wʌ̹n/",
    definitionEn: "hospital; clinic",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "BYEONG-WON → 'BEING WON over' back to health at the hospital.",
      syllables: ["병", "원"],
    },
    etymology: {
      origin: "病院",
      language: "Sino-Korean",
      rootWords: [
        { char: "病", meaning: "illness", sound: "병" },
        { char: "院", meaning: "institution", sound: "원" },
      ],
      originEn: "病 (illness) + 院 (institution) → 'an institution for illness'.",
    },
    examples: [
      { sentence: "병원에 가야 해요.", translation: "I have to go to the hospital.", highlight: "병원" },
      { sentence: "병원은 지하철역 옆에 있어요.", translation: "The hospital is next to the subway station.", highlight: "병원" },
    ],
    collocations: [
      { phrase: "병원에 가다", translation: "to go to the hospital" },
      { phrase: "종합 병원", translation: "general hospital" },
    ],
    tags: ["place", "health"],
  },
  {
    id: "w_bus",
    word: "버스",
    romanization: "beoseu",
    ipa: "/pʌ̹.sɯ/",
    definitionEn: "bus",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "BEO-SEU → just say 'bus' with a Korean vowel. Same word.",
      syllables: ["버", "스"],
    },
    etymology: {
      origin: "bus (English)",
      language: "Loanword",
      rootWords: ["영어: bus"],
      originEn: "Direct transliteration of the English word 'bus'.",
    },
    examples: [
      { sentence: "버스를 타요.", translation: "I take the bus.", highlight: "버스" },
      { sentence: "버스가 늦게 와요.", translation: "The bus is coming late.", highlight: "버스" },
    ],
    collocations: [
      { phrase: "버스를 타다", translation: "to take the bus" },
      { phrase: "버스 정류장", translation: "bus stop" },
    ],
    tags: ["transport", "loanword"],
  },
  {
    id: "w_oneul",
    word: "오늘",
    romanization: "oneul",
    ipa: "/o̞.nɯɭ/",
    definitionEn: "today",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "O-NEUL → 'OH, KNEEL' — today, right now, you bow to begin.",
      syllables: ["오", "늘"],
    },
    etymology: {
      origin: "오늘",
      language: "Native",
      rootWords: ["Native Korean; the matching set is 어제 (yesterday) / 내일 (tomorrow)."],
      originEn: "Native Korean word. No Hanja root.",
    },
    examples: [
      { sentence: "오늘 날씨가 좋아요.", translation: "The weather is nice today.", highlight: "오늘" },
      { sentence: "오늘은 월요일이에요.", translation: "Today is Monday.", highlight: "오늘" },
    ],
    collocations: [
      { phrase: "오늘 아침", translation: "this morning" },
      { phrase: "오늘 밤", translation: "tonight" },
    ],
    antonyms: ["어제", "내일"],
    tags: ["time", "daily"],
  },
  {
    id: "w_eomeoni",
    word: "어머니",
    romanization: "eomeoni",
    ipa: "/ʌ̹.mʌ̹.ni/",
    definitionEn: "mother",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "EO-MEO-NI → 'UH, MA, KNEE' — tug at mother's knee.",
      syllables: ["어", "머", "니"],
    },
    etymology: {
      origin: "어머니",
      language: "Native",
      rootWords: ["Native Korean; casual form 엄마 is the toddler's first word."],
      originEn: "Pure Native Korean. The formal register is 어머님.",
    },
    examples: [
      { sentence: "저는 어머니를 사랑해요.", translation: "I love my mother.", highlight: "어머니" },
      { sentence: "어머니가 요리를 잘하세요.", translation: "My mother cooks well.", highlight: "어머니" },
    ],
    collocations: [
      { phrase: "어머니의 사랑", translation: "a mother's love" },
      { phrase: "어머님 (honorific)", translation: "mother (honorific)" },
    ],
    synonyms: ["엄마", "모친"],
    antonyms: ["아버지"],
    tags: ["family", "daily"],
  },
  {
    id: "w_gada",
    word: "가다",
    romanization: "gada",
    ipa: "/ka̠.da̠/",
    definitionEn: "to go",
    partOfSpeech: "VERB",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "GA-DA → 'GO, DA!' — the imperative to get going.",
      syllables: ["가", "다"],
    },
    etymology: {
      origin: "가다",
      language: "Native",
      rootWords: ["Native Korean; one of the most fundamental motion verbs."],
      originEn: "Native Korean verb. Irregular only in the honorific (가시다).",
    },
    examples: [
      { sentence: "학교에 가요.", translation: "I'm going to school.", highlight: "가" },
      { sentence: "어디에 가세요?", translation: "Where are you going?", highlight: "가" },
    ],
    collocations: [
      { phrase: "집에 가다", translation: "to go home" },
      { phrase: "놀러 가다", translation: "to go out to play / hang out" },
    ],
    antonyms: ["오다"],
    tags: ["verb", "motion"],
  },
  {
    id: "w_oda",
    word: "오다",
    romanization: "oda",
    ipa: "/o̞.da̠/",
    definitionEn: "to come",
    partOfSpeech: "VERB",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "O-DA → 'OH, DA!' — surprise arrival of someone.",
      syllables: ["오", "다"],
    },
    etymology: {
      origin: "오다",
      language: "Native",
      rootWords: ["Native Korean. Pairs with 가다 (to go) as motion opposites."],
      originEn: "Native Korean verb. Irregular in the connective form 와요.",
    },
    examples: [
      { sentence: "친구가 집에 와요.", translation: "A friend is coming to my house.", highlight: "와" },
      { sentence: "비가 와요.", translation: "It's raining. (literally 'rain is coming').", highlight: "와" },
    ],
    collocations: [
      { phrase: "집에 오다", translation: "to come home" },
      { phrase: "비가 오다", translation: "to rain" },
    ],
    antonyms: ["가다"],
    tags: ["verb", "motion"],
  },
  {
    id: "w_deopda",
    word: "덥다",
    romanization: "deopda",
    ipa: "/tʌ̹p̚.t͈a̠/",
    definitionEn: "to be hot (weather / a person feeling hot)",
    partOfSpeech: "ADJ",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "DEOP-DA → 'DUB DA fan on' — it's so hot.",
      syllables: ["덥", "다"],
    },
    etymology: {
      origin: "덥다",
      language: "Native",
      rootWords: ["Native Korean adjective (irregular ㅂ conjugation: 더워요)."],
      originEn:
        "Native Korean. Describes warm weather or a person's perceived heat, not physical hotness of objects (that's 뜨겁다).",
    },
    examples: [
      { sentence: "오늘 너무 더워요.", translation: "It's so hot today.", highlight: "더워" },
      { sentence: "여름에는 덥습니다.", translation: "It is hot in summer.", highlight: "덥" },
    ],
    collocations: [
      { phrase: "날씨가 덥다", translation: "the weather is hot" },
      { phrase: "더운 여름", translation: "a hot summer" },
    ],
    antonyms: ["춥다"],
    tags: ["weather", "adjective"],
  },
  {
    id: "w_ssada",
    word: "싸다",
    romanization: "ssada",
    ipa: "/s͈a̠.da̠/",
    definitionEn: "to be cheap; inexpensive",
    partOfSpeech: "ADJ",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "SSA-DA → 'SA-le DA price' — cheap.",
      syllables: ["싸", "다"],
    },
    etymology: {
      origin: "싸다",
      language: "Native",
      rootWords: ["Native Korean adjective."],
      originEn:
        "Native Korean. Note: a separate verb 싸다 means 'to wrap' — context and particle distinguish them.",
    },
    examples: [
      { sentence: "이 가방은 싸요.", translation: "This bag is cheap.", highlight: "싸" },
      { sentence: "시장이 백화점보다 더 싸요.", translation: "The market is cheaper than the department store.", highlight: "싸" },
    ],
    collocations: [
      { phrase: "값이 싸다", translation: "the price is cheap" },
      { phrase: "싼 가격", translation: "a low price" },
    ],
    antonyms: ["비싸다"],
    tags: ["shopping", "adjective"],
  },

  // ─── TOPIK I · Level 1 pack — wave 2 (school, time, motion, money) ───────
  {
    id: "w_haksaeng",
    word: "학생",
    romanization: "haksaeng",
    ipa: "/ha̠k̚.s͈ɛŋ/",
    definitionEn: "student",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "HAK-SAENG → 'HAWK SANG' in the classroom — a keen student.",
      syllables: ["학", "생"],
    },
    etymology: {
      origin: "學生",
      language: "Sino-Korean",
      rootWords: [
        { char: "學", meaning: "learn", sound: "학" },
        { char: "生", meaning: "person / being", sound: "생" },
      ],
      originEn: "學 (learn) + 生 (person) → 'a person who learns'.",
    },
    examples: [
      { sentence: "저는 학생이에요.", translation: "I am a student.", highlight: "학생" },
      { sentence: "교실에 학생이 많아요.", translation: "There are many students in the classroom.", highlight: "학생" },
    ],
    collocations: [
      { phrase: "대학생", translation: "university student" },
      { phrase: "유학생", translation: "international student" },
    ],
    antonyms: ["선생님"],
    tags: ["school", "people"],
  },
  {
    id: "w_seonsaengnim",
    word: "선생님",
    romanization: "seonsaengnim",
    ipa: "/sʰʌ̹n.sɛŋ.nim/",
    definitionEn: "teacher (polite)",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "SEON-SAENG-NIM → 'SUN SANG KNEE-M' — you bow to the teacher who shines first.",
      syllables: ["선", "생", "님"],
    },
    etymology: {
      origin: "先生님",
      language: "Sino-Korean",
      rootWords: [
        { char: "先", meaning: "first / before", sound: "선" },
        { char: "生", meaning: "born", sound: "생" },
      ],
      evolution: "先生 (Sino-Korean: 'one born before') + 님 (Native honorific suffix).",
      originEn: "先 (before) + 生 (born) → 'one born before (and therefore wiser)'. Add 님 for respect.",
    },
    morphology: { root: "선생", suffix: "님", note: "Sino-Korean compound + native honorific" },
    examples: [
      { sentence: "선생님, 안녕하세요.", translation: "Hello, teacher.", highlight: "선생님" },
      { sentence: "우리 선생님은 친절하세요.", translation: "Our teacher is kind.", highlight: "선생님" },
    ],
    collocations: [
      { phrase: "한국어 선생님", translation: "Korean-language teacher" },
      { phrase: "담임 선생님", translation: "homeroom teacher" },
    ],
    antonyms: ["학생"],
    tags: ["school", "people", "honorific"],
  },
  {
    id: "w_naeil",
    word: "내일",
    romanization: "naeil",
    ipa: "/nɛ.iɭ/",
    definitionEn: "tomorrow",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "NAE-IL → 'NAIL it tomorrow' — what's coming next.",
      syllables: ["내", "일"],
    },
    etymology: {
      origin: "來日",
      language: "Sino-Korean",
      rootWords: [
        { char: "來", meaning: "come", sound: "내" },
        { char: "日", meaning: "day", sound: "일" },
      ],
      originEn: "來 (coming) + 日 (day) → 'the day that is coming'.",
    },
    examples: [
      { sentence: "내일 만나요.", translation: "See you tomorrow.", highlight: "내일" },
      { sentence: "내일은 토요일이에요.", translation: "Tomorrow is Saturday.", highlight: "내일" },
    ],
    collocations: [
      { phrase: "내일 아침", translation: "tomorrow morning" },
      { phrase: "내일 저녁", translation: "tomorrow evening" },
    ],
    antonyms: ["어제"],
    tags: ["time", "daily"],
  },
  {
    id: "w_eoje",
    word: "어제",
    romanization: "eoje",
    ipa: "/ʌ̹.d͡ʑe̞/",
    definitionEn: "yesterday",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "EO-JE → 'UH, JAY' — yesterday, I saw my friend J.",
      syllables: ["어", "제"],
    },
    etymology: {
      origin: "어제",
      language: "Native",
      rootWords: ["Native Korean; pairs with 오늘 (today) and 내일 (tomorrow)."],
      originEn: "Native Korean word. No Hanja root.",
    },
    examples: [
      { sentence: "어제 영화를 봤어요.", translation: "I watched a movie yesterday.", highlight: "어제" },
      { sentence: "어제는 비가 왔어요.", translation: "It rained yesterday.", highlight: "어제" },
    ],
    collocations: [
      { phrase: "어제 저녁", translation: "yesterday evening" },
      { phrase: "바로 어제", translation: "just yesterday" },
    ],
    antonyms: ["내일"],
    tags: ["time", "daily"],
  },
  {
    id: "w_chupda",
    word: "춥다",
    romanization: "chupda",
    ipa: "/t͡ɕʰup̚.t͈a̠/",
    definitionEn: "to be cold (weather / a person feeling cold)",
    partOfSpeech: "ADJ",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "CHUP-DA → 'CHOP down' the firewood — it's cold outside.",
      syllables: ["춥", "다"],
    },
    etymology: {
      origin: "춥다",
      language: "Native",
      rootWords: ["Native Korean adjective (irregular ㅂ conjugation: 추워요)."],
      originEn: "Native Korean. Describes cold weather or a person feeling cold — not objects (차갑다).",
    },
    examples: [
      { sentence: "오늘 날씨가 추워요.", translation: "The weather is cold today.", highlight: "추워" },
      { sentence: "겨울에는 춥습니다.", translation: "It is cold in winter.", highlight: "춥" },
    ],
    collocations: [
      { phrase: "날씨가 춥다", translation: "the weather is cold" },
      { phrase: "추운 겨울", translation: "a cold winter" },
    ],
    antonyms: ["덥다"],
    tags: ["weather", "adjective"],
  },
  {
    id: "w_bissada",
    word: "비싸다",
    romanization: "bissada",
    ipa: "/pi.s͈a̠.da̠/",
    definitionEn: "to be expensive",
    partOfSpeech: "ADJ",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "BI-SSA-DA → 'BEE-SA-DA' — prefix 비 ('un-cheap') on 싸다 (cheap).",
      syllables: ["비", "싸", "다"],
    },
    etymology: {
      origin: "비싸다",
      language: "Native",
      rootWords: ["비 (Native intensifier prefix) + 싸다 (cheap)"],
      originEn: "Native Korean. The 비- prefix inverts the meaning of 싸다 — 'not cheap' → 'expensive'.",
    },
    morphology: { prefix: "비-", root: "싸다", note: "Negation prefix + adjective" },
    examples: [
      { sentence: "이 가방은 너무 비싸요.", translation: "This bag is too expensive.", highlight: "비싸" },
      { sentence: "서울의 집값은 비쌉니다.", translation: "House prices in Seoul are expensive.", highlight: "비싸" },
    ],
    collocations: [
      { phrase: "값이 비싸다", translation: "the price is high" },
      { phrase: "비싼 선물", translation: "an expensive gift" },
    ],
    antonyms: ["싸다"],
    tags: ["shopping", "adjective"],
  },
  {
    id: "w_ikda",
    word: "읽다",
    romanization: "ikda",
    ipa: "/ik̚.t͈a̠/",
    definitionEn: "to read",
    partOfSpeech: "VERB",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "ILK-DA → 'ILK, DA-ily' — read every day.",
      syllables: ["읽", "다"],
    },
    etymology: {
      origin: "읽다",
      language: "Native",
      rootWords: ["Native Korean verb; the ㄺ batchim only pronounces /k/ before a consonant."],
      originEn: "Native Korean verb. Spelling keeps both ㄹ and ㄱ; pronunciation drops to /ik̚/.",
    },
    examples: [
      { sentence: "저는 책을 읽어요.", translation: "I am reading a book.", highlight: "읽" },
      { sentence: "매일 신문을 읽습니다.", translation: "I read the newspaper every day.", highlight: "읽" },
    ],
    collocations: [
      { phrase: "책을 읽다", translation: "to read a book" },
      { phrase: "신문을 읽다", translation: "to read the newspaper" },
    ],
    antonyms: ["쓰다"],
    tags: ["verb", "school"],
  },
  {
    id: "w_sseuda",
    word: "쓰다",
    romanization: "sseuda",
    ipa: "/s͈ɯ.da̠/",
    definitionEn: "to write; to use",
    partOfSpeech: "VERB",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "SSEU-DA → 'SSSH, DRAW' — silently write with the pen.",
      syllables: ["쓰", "다"],
    },
    etymology: {
      origin: "쓰다",
      language: "Native",
      rootWords: ["Native Korean. Several homonyms share the form 쓰다: write, use, be bitter, wear (a hat)."],
      originEn:
        "Native Korean. Beginners meet 쓰다 = 'to write' first; context disambiguates the other meanings.",
    },
    examples: [
      { sentence: "편지를 써요.", translation: "I'm writing a letter.", highlight: "써" },
      { sentence: "이름을 여기에 쓰세요.", translation: "Please write your name here.", highlight: "쓰" },
    ],
    collocations: [
      { phrase: "편지를 쓰다", translation: "to write a letter" },
      { phrase: "이름을 쓰다", translation: "to write one's name" },
    ],
    antonyms: ["읽다"],
    tags: ["verb", "school"],
  },
  {
    id: "w_yeok",
    word: "역",
    romanization: "yeok",
    ipa: "/jʌ̹k̚/",
    definitionEn: "station (train / subway)",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "YEOK → 'YOKE' the trains together — the station connects them.",
      syllables: ["역"],
    },
    etymology: {
      origin: "驛",
      language: "Sino-Korean",
      rootWords: [{ char: "驛", meaning: "post station", sound: "역" }],
      originEn: "驛 originally meant a relay-horse post; re-used in modern Korean for train stations.",
    },
    examples: [
      { sentence: "서울역에서 만나요.", translation: "Let's meet at Seoul Station.", highlight: "역" },
      { sentence: "지하철역이 어디예요?", translation: "Where is the subway station?", highlight: "역" },
    ],
    collocations: [
      { phrase: "지하철역", translation: "subway station" },
      { phrase: "기차역", translation: "train station" },
    ],
    tags: ["place", "transport"],
  },
  {
    id: "w_eunhaeng",
    word: "은행",
    romanization: "eunhaeng",
    ipa: "/ɯn.ɦɛŋ/",
    definitionEn: "bank (financial institution)",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "EUN-HAENG → 'OON-HANG' your money here — silver (은) on a rack (행).",
      syllables: ["은", "행"],
    },
    etymology: {
      origin: "銀行",
      language: "Sino-Korean",
      rootWords: [
        { char: "銀", meaning: "silver", sound: "은" },
        { char: "行", meaning: "shop / firm", sound: "행" },
      ],
      originEn: "銀 (silver) + 行 (firm) → 'a firm that deals in silver (money)'.",
    },
    examples: [
      { sentence: "은행에 갔어요.", translation: "I went to the bank.", highlight: "은행" },
      { sentence: "은행은 9시에 문을 열어요.", translation: "The bank opens at 9.", highlight: "은행" },
    ],
    collocations: [
      { phrase: "은행 계좌", translation: "bank account" },
      { phrase: "은행에 가다", translation: "to go to the bank" },
    ],
    tags: ["place", "money"],
  },

  // ─── TOPIK I · Level 1 pack — wave 3 (verbs, family, weather, places) ────
  {
    id: "w_boda",
    word: "보다",
    romanization: "boda",
    ipa: "/po̞.da̠/",
    definitionEn: "to see; to watch; to look at",
    partOfSpeech: "VERB",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "BO-DA → 'BOW DOWN' to see the show better.",
      syllables: ["보", "다"],
    },
    etymology: {
      origin: "보다",
      language: "Native",
      rootWords: ["Native Korean; also used as a grammar auxiliary ('try doing')."],
      originEn: "Native Korean verb. Covers 'see', 'watch', 'look at' and even 'read a newspaper'.",
    },
    examples: [
      { sentence: "영화를 봐요.", translation: "I'm watching a movie.", highlight: "봐" },
      { sentence: "저기를 보세요.", translation: "Please look over there.", highlight: "보" },
    ],
    collocations: [
      { phrase: "영화를 보다", translation: "to watch a movie" },
      { phrase: "시험을 보다", translation: "to take an exam" },
    ],
    tags: ["verb", "daily"],
  },
  {
    id: "w_jada",
    word: "자다",
    romanization: "jada",
    ipa: "/t͡ɕa̠.da̠/",
    definitionEn: "to sleep",
    partOfSpeech: "VERB",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "JA-DA → 'JA(wn), DA!' — time to sleep.",
      syllables: ["자", "다"],
    },
    etymology: {
      origin: "자다",
      language: "Native",
      rootWords: ["Native Korean verb. Honorific form is 주무시다 (entirely different stem)."],
      originEn: "Native Korean. Polite-honorific 주무시다 is one of Korean's suppletive pairs.",
    },
    examples: [
      { sentence: "저는 일찍 자요.", translation: "I sleep early.", highlight: "자" },
      { sentence: "잘 주무세요.", translation: "Sleep well. (honorific)", highlight: "주무" },
    ],
    collocations: [
      { phrase: "잠을 자다", translation: "to sleep (lit. to sleep a sleep)" },
      { phrase: "늦게 자다", translation: "to sleep late / go to bed late" },
    ],
    tags: ["verb", "daily"],
  },
  {
    id: "w_ilhada",
    word: "일하다",
    romanization: "ilhada",
    ipa: "/iɾ.ɦa̠.da̠/",
    definitionEn: "to work",
    partOfSpeech: "VERB",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "IL-HA-DA → 'ILL? HA! DA(y) of work' — show up anyway.",
      syllables: ["일", "하", "다"],
    },
    etymology: {
      origin: "일하다",
      language: "Native",
      rootWords: ["일 (Native Korean noun: work) + 하다 (verbalizer)"],
      originEn: "Native noun 일 ('work') plus the verbalizer 하다.",
    },
    morphology: { root: "일", suffix: "하다", note: "Noun + 하다 construction" },
    examples: [
      { sentence: "저는 회사에서 일해요.", translation: "I work at a company.", highlight: "일" },
      { sentence: "오늘은 열심히 일했어요.", translation: "I worked hard today.", highlight: "일" },
    ],
    collocations: [
      { phrase: "열심히 일하다", translation: "to work hard" },
      { phrase: "회사에서 일하다", translation: "to work at a company" },
    ],
    antonyms: ["쉬다"],
    tags: ["verb", "work"],
  },
  {
    id: "w_baeuda",
    word: "배우다",
    romanization: "baeuda",
    ipa: "/pɛ.u.da̠/",
    definitionEn: "to learn",
    partOfSpeech: "VERB",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "BAE-U-DA → 'BAY-OO-DA' — sail into the bay of knowledge and learn.",
      syllables: ["배", "우", "다"],
    },
    etymology: {
      origin: "배우다",
      language: "Native",
      rootWords: ["Native Korean verb. Note: the noun 배움 ('learning') shares the root."],
      originEn: "Native Korean. Pairs with 가르치다 ('to teach').",
    },
    examples: [
      { sentence: "저는 한국어를 배워요.", translation: "I'm learning Korean.", highlight: "배워" },
      { sentence: "새로운 것을 배우고 싶어요.", translation: "I want to learn something new.", highlight: "배우" },
    ],
    collocations: [
      { phrase: "한국어를 배우다", translation: "to learn Korean" },
      { phrase: "처음 배우다", translation: "to learn for the first time" },
    ],
    antonyms: ["가르치다"],
    tags: ["verb", "school"],
  },
  {
    id: "w_abeoji",
    word: "아버지",
    romanization: "abeoji",
    ipa: "/a̠.bʌ̹.d͡ʑi/",
    definitionEn: "father",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "A-BEO-JI → 'AH, BE-oh-G' — dad's deep voice.",
      syllables: ["아", "버", "지"],
    },
    etymology: {
      origin: "아버지",
      language: "Native",
      rootWords: ["Native Korean. Casual form 아빠 is the toddler's word."],
      originEn: "Pure Native Korean. The honorific is 아버님.",
    },
    examples: [
      { sentence: "아버지는 회사에 다니세요.", translation: "My father works at a company.", highlight: "아버지" },
      { sentence: "아버지께서 주셨어요.", translation: "My father gave it to me. (honorific)", highlight: "아버지" },
    ],
    collocations: [
      { phrase: "아버지의 말씀", translation: "father's words (honorific)" },
      { phrase: "아버님 (honorific)", translation: "father (honorific)" },
    ],
    synonyms: ["아빠", "부친"],
    antonyms: ["어머니"],
    tags: ["family", "daily"],
  },
  {
    id: "w_hyeong",
    word: "형",
    romanization: "hyeong",
    ipa: "/çjʌ̹ŋ/",
    definitionEn: "older brother (used by a male speaker)",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "HYEONG → 'HYUNG' the older guy you look up to.",
      syllables: ["형"],
    },
    etymology: {
      origin: "兄",
      language: "Sino-Korean",
      rootWords: [{ char: "兄", meaning: "elder brother", sound: "형" }],
      originEn:
        "Single-character Sino-Korean: 兄 (elder brother). Females use 오빠 for the same relationship.",
    },
    examples: [
      { sentence: "형은 대학생이에요.", translation: "My older brother is a university student.", highlight: "형" },
      { sentence: "형, 같이 가요.", translation: "Hyung, let's go together.", highlight: "형" },
    ],
    collocations: [
      { phrase: "친형", translation: "biological older brother" },
      { phrase: "형동생", translation: "older and younger brothers" },
    ],
    antonyms: ["동생"],
    tags: ["family"],
  },
  {
    id: "w_nuna",
    word: "누나",
    romanization: "nuna",
    ipa: "/nu.na̠/",
    definitionEn: "older sister (used by a male speaker)",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "NU-NA → 'NOONA' — the caring older sister you tease.",
      syllables: ["누", "나"],
    },
    etymology: {
      origin: "누나",
      language: "Native",
      rootWords: ["Native Korean. Females use 언니 for the same relationship."],
      originEn: "Native Korean. Gender-specific — males say 누나, females say 언니.",
    },
    examples: [
      { sentence: "누나가 요리를 잘해요.", translation: "My older sister cooks well.", highlight: "누나" },
      { sentence: "누나, 저 왔어요.", translation: "Noona, I'm home.", highlight: "누나" },
    ],
    collocations: [
      { phrase: "친누나", translation: "biological older sister" },
      { phrase: "누나 동생", translation: "older sister and younger sibling" },
    ],
    antonyms: ["동생"],
    tags: ["family"],
  },
  {
    id: "w_ai",
    word: "아이",
    romanization: "ai",
    ipa: "/a̠.i/",
    definitionEn: "child; kid",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "A-I → 'AH-EE' — the sound of a small child calling.",
      syllables: ["아", "이"],
    },
    etymology: {
      origin: "아이",
      language: "Native",
      rootWords: ["Native Korean. Often contracted to 애."],
      originEn: "Native Korean. Plain 아이 becomes 애 in speech and 아이들 / 애들 in the plural.",
    },
    examples: [
      { sentence: "아이가 울어요.", translation: "The child is crying.", highlight: "아이" },
      { sentence: "아이들이 공원에서 놀아요.", translation: "The children are playing in the park.", highlight: "아이" },
    ],
    collocations: [
      { phrase: "아이를 키우다", translation: "to raise a child" },
      { phrase: "아이들", translation: "children (plural)" },
    ],
    synonyms: ["어린이", "애"],
    antonyms: ["어른"],
    tags: ["family", "people"],
  },
  {
    id: "w_bi",
    word: "비",
    romanization: "bi",
    ipa: "/pi/",
    definitionEn: "rain",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "BI → 'BEE' buzzing before the rain begins.",
      syllables: ["비"],
    },
    etymology: {
      origin: "비",
      language: "Native",
      rootWords: ["Native Korean. Homophone (different Hanja) can mean 'broom' or 'monument' in other contexts."],
      originEn: "Native Korean. Notably pairs with the verb 오다 — Korean 'says' rain *comes*.",
    },
    examples: [
      { sentence: "비가 와요.", translation: "It's raining.", highlight: "비" },
      { sentence: "우산이 없어서 비를 맞았어요.", translation: "I didn't have an umbrella so I got rained on.", highlight: "비" },
    ],
    collocations: [
      { phrase: "비가 오다", translation: "to rain (lit. rain comes)" },
      { phrase: "비가 그치다", translation: "for the rain to stop" },
    ],
    tags: ["weather", "nature"],
  },
  {
    id: "w_nun",
    word: "눈",
    romanization: "nun",
    ipa: "/nun/",
    definitionEn: "snow (also means 'eye' — same spelling, different word)",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "NUN → 'NOON' under the snow — the eye of winter.",
      syllables: ["눈"],
    },
    etymology: {
      origin: "눈",
      language: "Native",
      rootWords: ["Native Korean. 눈 (snow) and 눈 (eye) are distinct words with the same spelling."],
      originEn:
        "Native Korean homograph. Context disambiguates: 눈이 와요 = 'it's snowing'; 눈이 커요 = 'eyes are big'.",
    },
    examples: [
      { sentence: "눈이 많이 와요.", translation: "It's snowing a lot.", highlight: "눈" },
      { sentence: "어제 첫눈이 왔어요.", translation: "The first snow fell yesterday.", highlight: "눈" },
    ],
    collocations: [
      { phrase: "눈이 오다", translation: "to snow" },
      { phrase: "첫눈", translation: "the first snow (of the season)" },
    ],
    tags: ["weather", "nature"],
  },
  {
    id: "w_bom",
    word: "봄",
    romanization: "bom",
    ipa: "/po̞m/",
    definitionEn: "spring (the season)",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "BOM → 'BLOOM!' — flowers pop up in spring.",
      syllables: ["봄"],
    },
    etymology: {
      origin: "봄",
      language: "Native",
      rootWords: ["Native Korean; possibly related to 보다 ('to see') — the season when new things are 'seen'."],
      originEn: "Native Korean. Part of the seasonal set 봄 / 여름 / 가을 / 겨울.",
    },
    examples: [
      { sentence: "봄이 왔어요.", translation: "Spring has come.", highlight: "봄" },
      { sentence: "저는 봄을 좋아해요.", translation: "I like spring.", highlight: "봄" },
    ],
    collocations: [
      { phrase: "봄꽃", translation: "spring flowers" },
      { phrase: "봄바람", translation: "a spring breeze" },
    ],
    antonyms: ["가을"],
    tags: ["season", "nature"],
  },
  {
    id: "w_yeoreum",
    word: "여름",
    romanization: "yeoreum",
    ipa: "/jʌ̹.ɾɯm/",
    definitionEn: "summer",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "YEO-REUM → 'YO, ROOM-temperature is gone' — it's hot summer.",
      syllables: ["여", "름"],
    },
    etymology: {
      origin: "여름",
      language: "Native",
      rootWords: ["Native Korean; in Middle Korean 여름 also meant 'fruit' (the summer harvest)."],
      originEn: "Native Korean. Originally also meant 'fruit' — reflecting summer's harvest.",
    },
    examples: [
      { sentence: "여름에는 바다에 가요.", translation: "In summer we go to the sea.", highlight: "여름" },
      { sentence: "한국의 여름은 아주 더워요.", translation: "Korean summers are very hot.", highlight: "여름" },
    ],
    collocations: [
      { phrase: "여름 방학", translation: "summer vacation" },
      { phrase: "한여름", translation: "midsummer" },
    ],
    antonyms: ["겨울"],
    tags: ["season", "nature"],
  },
  {
    id: "w_taxi",
    word: "택시",
    romanization: "taeksi",
    ipa: "/tʰɛk̚.ɕ͈i/",
    definitionEn: "taxi",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "TAEK-SI → just say 'taxi' with a clipped Korean first syllable.",
      syllables: ["택", "시"],
    },
    etymology: {
      origin: "taxi (English)",
      language: "Loanword",
      rootWords: ["영어: taxi"],
      originEn: "Direct transliteration of English 'taxi'.",
    },
    examples: [
      { sentence: "택시를 타요.", translation: "I take a taxi.", highlight: "택시" },
      { sentence: "택시가 안 와요.", translation: "The taxi isn't coming.", highlight: "택시" },
    ],
    collocations: [
      { phrase: "택시를 타다", translation: "to take a taxi" },
      { phrase: "택시 요금", translation: "taxi fare" },
    ],
    tags: ["transport", "loanword"],
  },
  {
    id: "w_bihaenggi",
    word: "비행기",
    romanization: "bihaenggi",
    ipa: "/pi.ɦɛŋ.ɡi/",
    definitionEn: "airplane",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "BI-HAENG-GI → 'BE HANG-ING' in the sky — an airplane.",
      syllables: ["비", "행", "기"],
    },
    etymology: {
      origin: "飛行機",
      language: "Sino-Korean",
      rootWords: [
        { char: "飛", meaning: "fly", sound: "비" },
        { char: "行", meaning: "go", sound: "행" },
        { char: "機", meaning: "machine", sound: "기" },
      ],
      originEn: "飛 (fly) + 行 (go) + 機 (machine) → 'a flying-going machine'.",
    },
    examples: [
      { sentence: "비행기가 빨라요.", translation: "Airplanes are fast.", highlight: "비행기" },
      { sentence: "비행기 표를 예약했어요.", translation: "I booked a plane ticket.", highlight: "비행기" },
    ],
    collocations: [
      { phrase: "비행기를 타다", translation: "to take / board an airplane" },
      { phrase: "비행기 표", translation: "airplane ticket" },
    ],
    tags: ["transport"],
  },
  {
    id: "w_hoesa",
    word: "회사",
    romanization: "hoesa",
    ipa: "/ɦwe̞.sa̠/",
    definitionEn: "company; firm",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "HOE-SA → 'WHO-SA' gathered — a company of people.",
      syllables: ["회", "사"],
    },
    etymology: {
      origin: "會社",
      language: "Sino-Korean",
      rootWords: [
        { char: "會", meaning: "gather", sound: "회" },
        { char: "社", meaning: "association", sound: "사" },
      ],
      originEn: "會 (gather) + 社 (association) → 'a gathered association (of workers)'.",
    },
    examples: [
      { sentence: "저는 회사에 다녀요.", translation: "I work at / go to a company.", highlight: "회사" },
      { sentence: "회사가 강남에 있어요.", translation: "The company is in Gangnam.", highlight: "회사" },
    ],
    collocations: [
      { phrase: "회사에 다니다", translation: "to work at a company" },
      { phrase: "회사원", translation: "company employee" },
    ],
    tags: ["work", "place"],
  },
  {
    id: "w_sikdang",
    word: "식당",
    romanization: "sikdang",
    ipa: "/ɕik̚.t͈aŋ/",
    definitionEn: "restaurant; dining hall",
    partOfSpeech: "NOUN",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "SIK-DANG → 'SICK-DONG' — eat here so you don't get sick.",
      syllables: ["식", "당"],
    },
    etymology: {
      origin: "食堂",
      language: "Sino-Korean",
      rootWords: [
        { char: "食", meaning: "eat / food", sound: "식" },
        { char: "堂", meaning: "hall", sound: "당" },
      ],
      originEn: "食 (eat) + 堂 (hall) → 'a hall for eating'.",
    },
    examples: [
      { sentence: "식당에서 밥을 먹어요.", translation: "I eat at the restaurant.", highlight: "식당" },
      { sentence: "이 식당은 맛있어요.", translation: "This restaurant is delicious.", highlight: "식당" },
    ],
    collocations: [
      { phrase: "학교 식당", translation: "school cafeteria" },
      { phrase: "한식당", translation: "Korean restaurant" },
    ],
    tags: ["place", "food"],
  },
  {
    id: "w_masitda",
    word: "맛있다",
    romanization: "masitda",
    ipa: "/ma̠.ɕit̚.t͈a̠/",
    definitionEn: "to be delicious; to taste good",
    partOfSpeech: "ADJ",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "MAT-ITT-DA → 'MATCH IT, DA!' — the flavor matches perfectly.",
      syllables: ["맛", "있", "다"],
    },
    etymology: {
      origin: "맛있다",
      language: "Native",
      rootWords: ["맛 (Native: taste) + 있다 (Native: to exist / have)"],
      originEn: "Native Korean. Literally 'to have taste' → to be delicious.",
    },
    morphology: { root: "맛", suffix: "있다", note: "Noun + existence verb" },
    examples: [
      { sentence: "이 음식이 정말 맛있어요.", translation: "This food is really delicious.", highlight: "맛있" },
      { sentence: "맛있는 빵을 샀어요.", translation: "I bought delicious bread.", highlight: "맛있" },
    ],
    collocations: [
      { phrase: "맛있는 음식", translation: "delicious food" },
      { phrase: "맛있게 드세요", translation: "enjoy your meal (lit. eat deliciously)" },
    ],
    antonyms: ["맛없다"],
    tags: ["food", "adjective"],
  },
  {
    id: "w_keuda",
    word: "크다",
    romanization: "keuda",
    ipa: "/kʰɯ.da̠/",
    definitionEn: "to be big; large; tall",
    partOfSpeech: "ADJ",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "KEU-DA → 'COO-DA' — a big 'coooool!' when you see something huge.",
      syllables: ["크", "다"],
    },
    etymology: {
      origin: "크다",
      language: "Native",
      rootWords: ["Native Korean adjective (regular 으 conjugation: 커요)."],
      originEn: "Native Korean. Also used for height: 키가 크다 = 'to be tall'.",
    },
    examples: [
      { sentence: "집이 커요.", translation: "The house is big.", highlight: "커" },
      { sentence: "키가 큰 사람.", translation: "A tall person.", highlight: "큰" },
    ],
    collocations: [
      { phrase: "키가 크다", translation: "to be tall" },
      { phrase: "큰 소리", translation: "a loud sound" },
    ],
    antonyms: ["작다"],
    tags: ["adjective", "size"],
  },
  {
    id: "w_jakda",
    word: "작다",
    romanization: "jakda",
    ipa: "/t͡ɕa̠k̚.t͈a̠/",
    definitionEn: "to be small; little; short (in height)",
    partOfSpeech: "ADJ",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "JAK-DA → 'JOCK-DA' — even a jock feels small against a giant.",
      syllables: ["작", "다"],
    },
    etymology: {
      origin: "작다",
      language: "Native",
      rootWords: ["Native Korean adjective. Not to be confused with 적다 (few in number)."],
      originEn: "Native Korean. 작다 = small size; 적다 = small quantity — often confused.",
    },
    examples: [
      { sentence: "이 옷이 작아요.", translation: "These clothes are small.", highlight: "작아" },
      { sentence: "작은 가방을 샀어요.", translation: "I bought a small bag.", highlight: "작은" },
    ],
    collocations: [
      { phrase: "키가 작다", translation: "to be short (in height)" },
      { phrase: "작은 소리", translation: "a quiet sound" },
    ],
    antonyms: ["크다"],
    tags: ["adjective", "size"],
  },
  {
    id: "w_manta",
    word: "많다",
    romanization: "manta",
    ipa: "/ma̠n.tʰa̠/",
    definitionEn: "to be many; to be a lot",
    partOfSpeech: "ADJ",
    level: 1,
    exam: "TOPIK_I",
    mnemonic: {
      englishHint: "MAN-TA → 'MAN, TA(ll) pile!' — there's a lot of it.",
      syllables: ["많", "다"],
    },
    etymology: {
      origin: "많다",
      language: "Native",
      rootWords: ["Native Korean adjective. The ㄶ batchim reads as /n/ before 다, with aspiration."],
      originEn: "Native Korean. Spelling keeps ㄶ; pronounced /ma̠n.tʰa̠/.",
    },
    examples: [
      { sentence: "학생이 많아요.", translation: "There are many students.", highlight: "많아" },
      { sentence: "할 일이 많습니다.", translation: "There is a lot of work to do.", highlight: "많" },
    ],
    collocations: [
      { phrase: "사람이 많다", translation: "there are many people" },
      { phrase: "돈이 많다", translation: "to have a lot of money" },
    ],
    antonyms: ["적다"],
    tags: ["adjective", "quantity"],
  },
];

export function findWord(id: string): Word | undefined {
  return SEED_WORDS.find((w) => w.id === id);
}

export function wordsByExam(exam: string) {
  return SEED_WORDS.filter((w) => w.exam === exam);
}
