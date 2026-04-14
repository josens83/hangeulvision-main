import type { Word } from "./types";

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
export const SEED_WORDS: Word[] = [
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
];

export function findWord(id: string): Word | undefined {
  return SEED_WORDS.find((w) => w.id === id);
}

export function wordsByExam(exam: string) {
  return SEED_WORDS.filter((w) => w.exam === exam);
}
