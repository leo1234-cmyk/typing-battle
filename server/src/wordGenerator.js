// 한글 단어 생성 모듈

// 초성 목록
const CHOSUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// 중성 목록
const JUNGSUNG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

// 종성 목록 (없는 경우도 포함)
const JONGSUNG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// 실제 한국어 단어 목록 (2~4글자 길이)
const KOREAN_WORDS = [
  // 2글자 단어
  '사과', '바다', '하늘', '땅', '꽃', '눈', '비', '산', '강', '책',
  '집', '차', '물', '불', '달', '별', '돈', '밥', '옷', '신',
  '손', '발', '머리', '눈', '코', '입', '귀', '목', '팔', '다리',
  
  // 3글자 단어
  '바나나', '딸기', '포도', '사람', '학교', '친구', '가족', '나라', '도시', '거리',
  '소리', '마음', '생각', '시간', '공부', '운동', '음식', '음악', '영화', '여행',
  '컴퓨터', '전화', '자동차', '자전거', '비행기', '지하철', '기차', '버스', '택시', '병원',
  
  // 4글자 단어
  '오렌지', '파인애플', '사과나무', '바닷가', '국제선', '하늘색', '자연환경', '주말여행', '인터넷', '도서관',
  '대학교', '초등학교', '중학교', '고등학교', '대학원', '식당', '영화관', '백화점', '슈퍼마켓', '편의점',
  '놀이공원', '동물원', '식물원', '미술관', '박물관', '공원', '수영장', '운동장', '도로', '자전거'
];

// 추가 단어 (임의로 생성할 때 사용)
const ADDITIONAL_WORDS = [
  '가방', '연필', '지우개', '필통', '노트', '공책', '연습장', '색연필', '크레파스', '수첩',
  '카메라', '스마트폰', '태블릿', '노트북', '마우스', '키보드', '모니터', '프린터', '스캐너', '이어폰',
  '헤드폰', '스피커', '충전기', '배터리', '케이블', '어댑터', '메모리', '하드', '디스크', '카드',
  '안경', '시계', '지갑', '열쇠', '우산', '모자', '장갑', '목도리', '스카프', '넥타이',
  '거울', '빗', '화장품', '립스틱', '향수', '로션', '샴푸', '린스', '비누', '치약',
  '칫솔', '수건', '휴지', '장난감', '인형', '로봇', '퍼즐', '블록', '게임기', '공'
];

/**
 * 한글 단어를 랜덤하게 생성
 * @param {number} count - 생성할 단어 개수
 * @returns {string[]} - 생성된 단어 배열
 */
function generateKoreanWords(count) {
  const result = [];
  const allWords = [...KOREAN_WORDS, ...ADDITIONAL_WORDS];
  
  // 중복 방지를 위한 단어 셔플
  const shuffledWords = [...allWords].sort(() => Math.random() - 0.5);
  
  // 필요한 만큼 단어 선택
  for (let i = 0; i < count; i++) {
    if (i < shuffledWords.length) {
      result.push(shuffledWords[i]);
    } else {
      // 단어가 부족한 경우 랜덤 생성
      result.push(generateRandomKoreanWord());
    }
  }
  
  return result;
}

/**
 * 랜덤 한글 단어 생성 (2~4글자)
 * @returns {string} - 생성된 한글 단어
 */
function generateRandomKoreanWord() {
  // 단어 길이 결정 (2~4글자)
  const length = Math.floor(Math.random() * 3) + 2;
  let word = '';
  
  for (let i = 0; i < length; i++) {
    // 한글 음절 생성을 위한 인덱스 선택
    const choIndex = Math.floor(Math.random() * CHOSUNG.length);
    const jungIndex = Math.floor(Math.random() * JUNGSUNG.length);
    const jongIndex = Math.floor(Math.random() * JONGSUNG.length);
    
    // 유니코드 한글 음절 생성 (AC00(가) + 초성*588 + 중성*28 + 종성)
    const charCode = 0xAC00 + (choIndex * 21 * 28) + (jungIndex * 28) + jongIndex;
    word += String.fromCharCode(charCode);
  }
  
  return word;
}

module.exports = {
  generateKoreanWords
}; 