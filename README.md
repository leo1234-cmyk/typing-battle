# 타자 판치기 (Korean Typing Battle)

5대5 온라인 멀티플레이 한글 타자 게임입니다.

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

## 기술 스택

- **프론트엔드**: React.js, styled-components
- **백엔드**: Node.js, Express
- **실시간 통신**: Socket.IO

## 설치 및 실행 방법

### 요구사항

- Node.js 14.0.0 이상
- npm 또는 yarn

### 설치

1. 저장소 클론
```bash
git clone https://github.com/yourusername/typing-battle.git
cd typing-battle
```

2. 패키지 설치
```bash
# 루트, 클라이언트, 서버 모두에 패키지 설치
npm run install-all
```

### 실행

```bash
# 개발 모드로 클라이언트와 서버 동시에 실행
npm start
```

- 서버: http://localhost:3001
- 클라이언트: http://localhost:3000

### 개별 실행

```bash
# 서버만 실행
npm run server

# 클라이언트만 실행
npm run client
```

### 배포

프로젝트는 Render.com을 통해 배포할 수 있습니다.

1. GitHub 저장소로 코드를 푸시합니다.
2. Render.com에 가입하고 새 웹 서비스를 만듭니다.
3. GitHub 저장소를 연결하고 `render.yaml` 설정을 사용합니다.
4. 배포가 완료되면 제공된 URL로 접속할 수 있습니다.

## 게임 플레이 방법

1. 닉네임 입력 페이지에서 사용할 닉네임을 입력합니다.
2. 로비에서 새 게임방을 만들거나 기존 게임방에 참여합니다.
3. 게임방에 10명의 플레이어가 모이면 자동으로 게임이 시작됩니다.
4. 게임이 시작되면 화면에 나타난 카드의 단어를 정확하게 입력하여 카드를 뒤집습니다.
5. 자신의 팀 컬러로 최대한 많은 카드를 뒤집으세요!

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