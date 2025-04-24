# 한글 타이핑 대결 게임

온라인 멀티플레이어 한글 타이핑 대결 게임입니다. 두 팀으로 나뉘어 단어를 빠르게 입력하여 카드를 뒤집는 게임입니다.

## 주요 기능

- 최대 7대7 팀 대결 방식
- 실시간 멀티플레이어 게임
- 다양한 한글 단어 제공
- 실시간 점수 및 타이머 표시
- 관리자(방장) 기능으로 게임 설정 조정 가능

## 온라인에서 플레이하기

[여기서 게임 플레이하기](https://typing-battle-game.onrender.com)

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

## 수정 및 개선 사항 해결 방안

## 1. 방 생성 후 다른 참가자에게 방이 보이지 않는 버그

현재 문제점: 방 생성 시 다른 사용자의 방 목록에 실시간으로 업데이트되지 않습니다.

해결 방안:
```javascript
// server/src/index.js 파일 수정 - create-room 이벤트 처리 부분

socket.on('create-room', (options = {}) => {
  const roomId = `room_${Date.now()}`;
  const maxTeamSize = options.maxTeamSize || 5;
  const totalCards = options.totalCards || 40;
  
  // 팀 크기 유효성 검사
  const validatedMaxTeamSize = Math.min(Math.max(1, maxTeamSize), 7);
  // 카드 수 유효성 검사 (짝수로 만들기)
  const validatedTotalCards = Math.round(totalCards / 2) * 2;
  
  initializeGameRoom(roomId, {
    maxTeamSize: validatedMaxTeamSize,
    totalCards: validatedTotalCards
  });
  
  // 방 생성자에게 알림
  socket.emit('room-created', { 
    roomId,
    settings: gameRooms[roomId].settings
  });
  
  // 모든 클라이언트에게 새 방 생성 알림 (이 부분 추가)
  // 로비에 있는 모든 사용자에게 새 방 정보 브로드캐스트
  io.emit('room-list-updated', Object.keys(gameRooms)
    .filter(id => gameRooms[id].status === 'waiting')
    .map(id => {
      const room = gameRooms[id];
      return {
        id,
        players: room.players.length,
        maxPlayers: room.settings.maxTeamSize * 2,
        settings: room.settings
      };
    })
  );
});
```

그리고 클라이언트 측 코드도 새 이벤트를 처리하도록 수정해야 합니다:

```javascript
import React, { useEffect, useState } from 'react';
import io from '../services/socket';

const SocketContext = React.createContext();

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    if (socket) {
      // 새 이벤트 리스너 추가
      socket.on('room-list-updated', (rooms) => {
        // 방 목록 상태 업데이트 로직
        setRooms(rooms);
      });
      
      return () => {
        // 이벤트 리스너 제거
        socket.off('room-list-updated');
      };
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, rooms }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
```

## 2. 팀 인원 설정 오류 수정

현재 문제점: 최대 인원을 7명으로 변경해도 실제 게임에서 적용되지 않는 문제가 있습니다.

해결 방안:
```javascript
// server/src/index.js 수정 - 자동 시작 로직 부분

// 자동 시작 (모든 인원이 다 차면) - 수정된 부분
if (room.players.length === room.settings.requiredPlayers) {
  // 여기에서 requiredPlayers 값이 올바르게 계산되는지 확인
  console.log(`Game starting with ${room.players.length} players, required: ${room.settings.requiredPlayers}`);
  io.to(roomId).emit('game-starting');
  
  // 3초 후 게임 시작
  setTimeout(() => {
    startGame(roomId);
    io.to(roomId).emit('game-started', {
      cards: room.cards,
      redTeam: room.redTeam,
      blueTeam: room.blueTeam,
      timer: room.timer,
      settings: room.settings
    });
  }, 3000);
}
```

또한 설정 변경 시 모든 관련 값이 제대로 업데이트되는지 확인합니다:

```javascript
// 게임 설정 변경 부분
socket.on('update-room-settings', (settings) => {
  const roomId = socket.data.roomId;
  if (!roomId || !gameRooms[roomId] || gameRooms[roomId].status !== 'waiting') {
    return;
  }
  
  const room = gameRooms[roomId];
  
  // 최대 팀 크기 변경 (1-7 사이로 제한)
  if (settings.maxTeamSize !== undefined) {
    const newMaxTeamSize = Math.min(Math.max(1, settings.maxTeamSize), 7);
    room.settings.maxTeamSize = newMaxTeamSize;
    room.settings.requiredPlayers = newMaxTeamSize * 2; // 이 부분 확인
    console.log(`Updated maxTeamSize to ${newMaxTeamSize}, requiredPlayers: ${room.settings.requiredPlayers}`);
  }
  
  // ... 기존 코드 ...
  
  // 모든 플레이어에게 설정 변경 알림
  io.to(roomId).emit('room-settings-updated', room.settings);
});
```

## 3. 게임 개선: 단어 맞힘 시 카드 단어 변경 기능

현재: 카드가 뒤집히면 같은 단어가 유지됩니다.
개선: 단어를 맞히면 새로운 단어로 교체하여 게임의 다양성을 높입니다.

```javascript
// server/src/index.js 수정 - 타이핑 입력 처리 부분

socket.on('type-word', ({ word }) => {
  const roomId = socket.data.roomId;
  if (!roomId || !gameRooms[roomId] || gameRooms[roomId].status !== 'playing') {
    return;
  }
  
  const room = gameRooms[roomId];
  const player = room.players.find(p => p.id === socket.id);
  
  if (!player) return;
  
  // 입력한 단어와 일치하는 카드 찾기
  const cardIndex = room.cards.findIndex(card => card.word === word);
  
  if (cardIndex !== -1) {
    const card = room.cards[cardIndex];
    
    // 카드 뒤집기
    card.flippedBy = player.id;
    card.flippedTeam = player.team;
    
    // 새 단어로 교체 (이 부분 추가)
    const newWord = generateKoreanWords(1)[0];
    card.word = newWord;
    
    // 모든 플레이어에게 카드 상태 업데이트 전송
    io.to(roomId).emit('card-flipped', {
      cardIndex,
      flippedBy: {
        id: player.id,
        nickname: player.nickname
      },
      flippedTeam: player.team,
      newWord: newWord // 새 단어 정보 추가
    });
    
    // 승리 조건 체크
    checkGameEnd(roomId);
  }
});
```

클라이언트 측에서도 이 새 단어를 처리할 수 있어야 합니다:

```javascript
// 클라이언트 측 코드 수정 - GameBoard.js 또는 관련 컴포넌트
socket.on('card-flipped', ({ cardIndex, flippedBy, flippedTeam, newWord }) => {
  setGameState(prev => {
    const updatedCards = [...prev.cards];
    updatedCards[cardIndex] = {
      ...updatedCards[cardIndex],
      flippedBy,
      flippedTeam,
      word: newWord // 새 단어로 업데이트
    };
    
    return {
      ...prev,
      cards: updatedCards
    };
  });
});
```

## 4. UI 개선: 게임 종료 후 플레이어 랭킹 표시

개인 성과를 표시하여 게임의 재미를 높입니다.

```javascript
// server/src/index.js 수정 - 게임 종료 처리 부분

function checkGameEnd(roomId) {
  // ... 기존 코드 ...
  
  // 게임 종료 처리
  if (winner) {
    room.status = 'finished';
    
    // 플레이어 개인 성과 계산
    const playerStats = calculatePlayerStats(room);
    
    io.to(roomId).emit('game-end', { 
      winner, 
      scores: room.scores,
      playerStats: playerStats // 개인 성과 정보 추가
    });
  }
}

// 개인 성과 계산 함수 (새로 추가)
function calculatePlayerStats(room) {
  // 각 플레이어별 뒤집은 카드 수 계산
  const playerScores = {};
  
  // 플레이어 초기화
  room.players.forEach(player => {
    playerScores[player.id] = {
      id: player.id,
      nickname: player.nickname,
      team: player.team,
      score: 0
    };
  });
  
  // 카드를 뒤집은 플레이어들의 점수 계산
  room.cards.forEach(card => {
    if (card.flippedBy && playerScores[card.flippedBy]) {
      playerScores[card.flippedBy].score += 1;
    }
  });
  
  // 점수 기준 내림차순 정렬하여 배열로 변환
  const rankedPlayers = Object.values(playerScores)
    .sort((a, b) => b.score - a.score);
  
  // 순위 추가
  rankedPlayers.forEach((player, index) => {
    player.rank = index + 1;
  });
  
  return rankedPlayers;
}
```

클라이언트에서도 이 정보를 게임 종료 화면에 표시합니다:

```jsx
// client/src/screens/GameRoomScreen.js 수정 - 게임 결과 오버레이 부분
{gameState.status === 'finished' && gameState.gameResult && (
  <GameResultOverlay>
    <GameResultContent winner={gameState.gameResult.winner}>
      <h2>
        {gameState.gameResult.winner === 'red' ? '빨강팀 승리!' : 
         gameState.gameResult.winner === 'blue' ? '파랑팀 승리!' : 
         '무승부!'}
      </h2>
      
      <div className="scores">
        <div className="team">
          <div className="team-name" style={{ color: '#e53935' }}>빨강팀</div>
          <div className="score">{gameState.gameResult.scores.red}</div>
        </div>
        
        <div className="team">
          <div className="team-name" style={{ color: '#1e88e5' }}>파랑팀</div>
          <div className="score">{gameState.gameResult.scores.blue}</div>
        </div>
      </div>
      
      {/* 플레이어 랭킹 정보 표시 (추가) */}
      <div className="player-rankings">
        <h3>플레이어 랭킹</h3>
        <div className="rankings-list">
          {gameState.gameResult.playerStats.map(player => (
            <div 
              key={player.id} 
              className={`player-rank ${player.id === socket.id ? 'current-user' : ''}`}
            >
              <span className="rank">{player.rank}등</span>
              <span className="player-name">
                {player.nickname} {player.id === socket.id ? '(나)' : ''}
              </span>
              <span className="player-score">{player.score}점</span>
            </div>
          ))}
        </div>
        
        {/* 현재 사용자 등수 강조 표시 */}
        {gameState.gameResult.playerStats.find(p => p.id === socket.id) && (
          <div className="your-rank">
            당신의 등수: {gameState.gameResult.playerStats.find(p => p.id === socket.id).rank}등
          </div>
        )}
      </div>
      
      <button onClick={handleReturnToLobby}>
        로비로 돌아가기
      </button>
    </GameResultContent>
  </GameResultOverlay>
)}
```