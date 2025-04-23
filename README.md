# 한글 타이핑 대결 게임

온라인 멀티플레이어 한글 타이핑 대결 게임입니다. 두 팀으로 나뉘어 단어를 빠르게 입력하여 카드를 뒤집는 게임입니다.

## 주요 기능

- 최대 7대7 팀 대결 방식
- 실시간 멀티플레이어 게임
- 다양한 한글 단어 제공
- 실시간 점수 및 타이머 표시
- 관리자(방장) 기능으로 게임 설정 조정 가능

## 온라인에서 플레이하기

[여기서 게임 플레이하기](https://your-app-url.onrender.com)

## 로컬에서 실행하기

### 요구사항

- Node.js 14 이상
- npm

### 설치 및 실행

1. 저장소 클론
```
git clone https://github.com/your-username/typing-battle-game.git
cd typing-battle-game
```

2. 의존성 설치
```
npm run install-all
```

3. 개발 모드로 실행
```
npm run dev
```

4. 빌드 및 프로덕션 모드로 실행
```
npm run build
npm start
```

## 배포 방법 (Render.com)

1. GitHub에 프로젝트 업로드
2. Render.com 가입 및 로그인
3. [Render Dashboard](https://dashboard.render.com/)에서 'New Web Service' 선택
4. GitHub 저장소 연결
5. 다음 설정으로 웹 서비스 구성:
   - Name: typing-battle-game (또는 원하는 이름)
   - Environment: Node
   - Build Command: `npm run install-all && npm run build`
   - Start Command: `npm start`
   - Plan: Free (또는 원하는 요금제)
6. 'Create Web Service' 클릭하여 배포 시작

배포가 완료되면 제공된 URL로 게임에 접속할 수 있습니다.

## 기술 스택

- Frontend: React, Styled-Components
- Backend: Node.js, Express, Socket.IO

## 게임 규칙

1. **게임 방식**
  - 10명이 접속하면 게임이 시작됨 (5명씩 두 팀)
  - 화면에는 40장의 카드가 펼쳐짐 (한글 단어가 적힌 카드)
  - 각 카드에는 팀 색상이 지정됨 (20장씩: 빨강 vs 파랑)
  - 카드를 뒤집는 방법: 해당 카드의 단어를 먼저 정확하게 타이핑한 플레이어가 뒤집음
  - 뒤집힌 카드는 상대 팀이 다시 타이핑하여 탈환 가능 (락 걸리지 않음)

2. **승리 조건**
  - 제한시간 5분
  - 시간 내 상대 팀 카드 20장을 모두 뒤집으면 즉시 승리
  - 시간 종료 시, 더 많은 카드를 뒤집은 팀이 승리

## 프로젝트 구조

```
typing-battle/
├── client/                  # 프론트엔드 코드
│   ├── public/              # 정적 파일
│   └── src/                 # 소스 코드
│       ├── components/      # 재사용 가능한 컴포넌트
│       ├── contexts/        # React Context
│       └── screens/         # 페이지 컴포넌트
├── server/                  # 백엔드 코드
│   └── src/                 # 소스 코드
└── package.json             # 루트 package.json
```