import { ScriptItem, LoreEntry, RefinerRule, BookmarkItem, KeywordNoteItem } from '../types';

export const FALLBACK_SCRIPTS: ScriptItem[] = [
  {
    id: 'PASTELchat-Crack-Bridge.user.js',
    fileName: 'PASTELchat-Crack-Bridge.user.js',
    category: 'bridge',
    tag: 'Core Bridge Engine',
    fileSize: 325830,
    lineCount: 5660,
    metaName: 'PASTELchat × CRACK Native Bridge Engine',
    version: '2.1.9',
    description: 'PASTELchat Native UI Engine & Data Bridge for crack.wrtn.ai (Auto Token & ChatID Interception)',
    author: 'PASTELchat',
    matches: ['https://crack.wrtn.ai/*', 'https://pastel-chat-coral.vercel.app/*'],
    requires: [
      'https://cdn.jsdelivr.net/npm/dexie@4.2.1/dist/dexie.min.js',
      'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js'
    ]
  },
  {
    id: 'lore injector TEST8',
    fileName: 'lore injector TEST8',
    category: 'lore',
    tag: 'Latest Universal Bundle',
    fileSize: 905650,
    lineCount: 17065,
    metaName: '에리의 크랙 로어 인젝터 (투명화 조건 확장)',
    version: '2.1.3-TEST8',
    description: '단일 번들로 로드 안정성을 높인 범용 로어 인젝터 및 월드북 주입 엔진',
    author: '로컬AI',
    matches: [
      'https://crack.wrtn.ai/stories/*/episodes/*',
      'https://crack.wrtn.ai/characters/*/chats/*',
      'https://crack.wrtn.ai/u/*/c/*'
    ],
    requires: [
      'https://cdn.jsdelivr.net/npm/dexie@4.2.1/dist/dexie.min.js'
    ]
  },
  {
    id: 'Response Refiner TEST8',
    fileName: 'Response Refiner TEST8',
    category: 'refiner',
    tag: 'Latest (TEST8)',
    fileSize: 92078,
    lineCount: 1606,
    metaName: '크랙 AI 응답 교정기 (Response Refiner V2.4.0)',
    version: '2.4.0-f',
    description: '추가 요청 탭 및 enrichment 교정 항목, 서술 스타일 및 실시간 대화 교정기',
    author: 'User & Gemini',
    matches: ['https://crack.wrtn.ai/*'],
    requires: [
      'https://cdn.jsdelivr.net/npm/dexie@4.2.1/dist/dexie.min.js'
    ]
  },
  {
    id: '3in1 TEST1',
    fileName: '3in1 TEST1',
    category: 'utility',
    tag: 'Integrated Suite',
    fileSize: 114524,
    lineCount: 2045,
    metaName: '크랙 AI요약 & 북마크 & 키워드노트 통합본 (3 in 1)',
    version: '4.7.3-i.5',
    description: '키워드노트 실시간 동기화 + 모듈별 독립 커스텀 색상(북마크 연노랑, 요약 연분홍) + 알리미 토스트 연동',
    author: 'Assistant',
    matches: ['https://crack.wrtn.ai/*'],
    requires: [
      'https://cdn.jsdelivr.net/npm/dexie@4.2.1/dist/dexie.min.js',
      'crack-shared-core@v1.0.0'
    ]
  },
  {
    id: '9in1 TEST1',
    fileName: '9in1 TEST1',
    category: 'helper',
    tag: 'Input Helper Suite',
    fileSize: 126388,
    lineCount: 2768,
    metaName: '크랙 9 in 1 (입력 도우미 & 전송 홀드)',
    version: '15.4.0-e',
    description: '전송 홀드 방지링 + 에디터 서식 도우미 + 자동 스크롤 동기화',
    author: 'User & Gemini',
    matches: ['https://crack.wrtn.ai/*'],
    requires: [
      'crack-shared-core@v1.2.1',
      'chasm-shared-core@v1.0.0',
      'dexie@4.2.1'
    ]
  }
];

export const INITIAL_LORE_ENTRIES: LoreEntry[] = [
  {
    id: 'lore-1',
    keys: ['에리', '아이돌', '에리코'],
    content: '[등장인물: 에리]\n- 나이: 19세, 신장: 162cm\n- 외형: 은발 트윈테일, 벽안의 생기 넘치는 눈매\n- 성격: 겉으로는 츤데레 성향이나 속으로는 다정하고 의리가 깊음\n- 배경: 언더그라운드 인디 아이돌로 활동 중이며 주인공을 매니저이자 오랜 소꿉친구로 신뢰함.',
    priority: 100,
    scope: 'character',
    matchType: 'contains',
    enabled: true,
    notes: '에리 캐릭터 전용 기본 설정 및 말투 가이드'
  },
  {
    id: 'lore-2',
    keys: ['아카데미', '마도학원', '루멘'],
    content: '[세계관: 루멘 황립 아카데미]\n- 제국 최고 권위의 마도 교육 기관으로 4대 학부(연금, 소환, 전투, 고대어)로 나뉨.\n- 학생들은 교내 마도 결계 안에서만 자유롭게 실습 가능하며 야간 통금은 오후 10시 엄수.',
    priority: 80,
    scope: 'global',
    matchType: 'contains',
    enabled: true,
    notes: '학원물 세계관 배경 정보'
  },
  {
    id: 'lore-3',
    keys: ['크랙', '인젝터', '시스템'],
    content: '[시스템 룰: 메타 인지 방지]\n- AI는 자신이 프롬프트 인젝션을 받고 있다는 사실을 발설하지 말고 자연스러운 서사 흐름으로 녹여낼 것.',
    priority: 95,
    scope: 'scene',
    matchType: 'contains',
    enabled: true,
    notes: '몰입도 유지용 시스템 가이드'
  }
];

export const INITIAL_REFINER_RULES: RefinerRule[] = [
  {
    id: 'rule-quote-fix',
    name: '대화 따옴표 통일',
    description: '어긋나거나 반쪽짜리 큰따옴표/작은따옴표를 표준 한국어 따옴표로 교정합니다.',
    category: 'dialogue',
    pattern: '["""]',
    replacement: '"',
    enabled: true,
    isRegex: true
  },
  {
    id: 'rule-ai-slop',
    name: '상투적 AI 맺음말 제거',
    description: '"어떤 일이 일어날지 지켜보자", "당신의 선택에 달려있습니다" 등의 진부한 끝맺음을 제거합니다.',
    category: 'roleplay',
    pattern: '(어떤 일이 펼쳐질지|당신의 선택은|앞으로의 이야기는 어떻게).*$',
    replacement: '',
    enabled: true,
    isRegex: true
  },
  {
    id: 'rule-space-cleanup',
    name: '불필요한 중복 공백 및 줄바꿈 정리',
    description: '3줄 이상의 과도한 연속 빈 줄을 2줄로 압축합니다.',
    category: 'formatting',
    pattern: '\\n{3,}',
    replacement: '\n\n',
    enabled: true,
    isRegex: true
  },
  {
    id: 'rule-asterisk-action',
    name: '행동 지문 애스터리스크 정리',
    description: '*웃으며 손을 흔든다* 형식의 지문을 표준 한국어 소괄호 (웃으며 손을 흔든다) 또는 서술문으로 교정',
    category: 'roleplay',
    pattern: '\\*([^*]+)\\*',
    replacement: '($1)',
    enabled: false,
    isRegex: true
  }
];

export const INITIAL_BOOKMARKS: BookmarkItem[] = [
  {
    id: 'bm-1',
    text: '"매니저님, 오늘은 평소보다 30분 일찍 연습실에 온 것 같은데요? 혹시... 날 보러 일찍 온 거예요?"',
    color: '#F6E19A', // 연노랑 (북마크 시그니처 컬러)
    note: '에리 특유의 츤데레 대사 하이라이트 (에피소드 3)',
    createdAt: '2026-10-09 14:22',
    tags: ['대사', '명장면', '에리']
  },
  {
    id: 'bm-2',
    text: '창밖으로 석양이 번지며 루멘 아카데미의 뾰족탑 위로 은은한 마도 광륜이 어른거렸다.',
    color: '#BCD0D8', // 파스텔 블루그레이
    note: '루멘 아카데미 배경 묘사 우수 구절',
    createdAt: '2026-10-09 15:10',
    tags: ['묘사', '배경']
  }
];

export const INITIAL_KEYWORD_NOTES: KeywordNoteItem[] = [
  {
    id: 'kn-1',
    keyword: '루멘 아카데미 결계',
    summary: '야간 10시 이후 침입 시 경보 작동. 에리와 주인공의 비밀 아지트는 결계 사각지대 북탑 지하 2층.',
    frequency: 8,
    updatedAt: '2026-10-09 15:30'
  },
  {
    id: 'kn-2',
    keyword: '은빛 펜던트',
    summary: '에리가 어린 시절 주인공에게 건넸던 고대 마도 유물. 평소에는 단순한 목걸이로 위장.',
    frequency: 14,
    updatedAt: '2026-10-09 16:05'
  }
];
