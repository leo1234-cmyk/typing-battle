const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const { generateKoreanWords } = require('./wordGenerator');
const fs = require('fs');

const app = express();
app.use(cors());

// 환경 변수 설정
const PORT = process.env.PORT || 3002;
const isProduction = process.env.NODE_ENV === 'production';

// 정적 파일 제공 (클라이언트 빌드)
const clientBuildPath = path.join(__dirname, '../../client/build');
const clientPublicPath = path.join(__dirname, '../../client/public');

// build 폴더가 있으면 그것을 사용하고, 없으면 public 폴더 사용
let staticPath = fs.existsSync(clientBuildPath) ? clientBuildPath : clientPublicPath;

app.use(express.static(staticPath));

// 모든 다른 GET 요청은 리액트 앱으로 라우팅
app.get('*', (req, res) => {
  // index.html 파일 경로 설정
  const indexPath = path.join(staticPath, 'index.html');
  
  // 파일이 존재하는지 확인
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('앱을 찾을 수 없습니다. npm run build를 실행하여 클라이언트를 빌드해주세요.');
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 게임 상태 관리
const gameRooms = {};

// 게임룸 초기화 함수
function initializeGameRoom(roomId, options = {}) {
  const { maxTeamSize = 5, totalCards = 40 } = options;
  const koreanWords = generateKoreanWords(totalCards);
  
  // 카드 설정 (팀당 반반 배정)
  const cardsPerTeam = totalCards / 2;
  const cards = koreanWords.map((word, index) => {
    return {
      id: index,
      word: word,
      team: index < cardsPerTeam ? 'red' : 'blue', // 절반은 빨강, 절반은 파랑
      flippedBy: null, // 카드를 뒤집은 플레이어
      flippedTeam: null // 카드를 뒤집은 팀
    };
  });
  
  // 카드 섞기
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  
  gameRooms[roomId] = {
    status: 'waiting', // waiting, playing, finished
    players: [],
    redTeam: [],
    blueTeam: [],
    cards: cards,
    startTime: null,
    endTime: null,
    scores: {
      red: 0,
      blue: 0
    },
    timer: 300, // 5분 (초 단위)
    settings: {
      maxTeamSize: maxTeamSize, // 팀당 최대 인원 (기본값 5, 최대 7)
      requiredPlayers: maxTeamSize * 2, // 게임 시작에 필요한 인원
      minPlayers: 2, // 게임 시작을 위한 최소 인원 (각 팀 1명씩)
      totalCards: totalCards, // 총 카드 수
      cardsPerTeam: cardsPerTeam // 팀당 카드 수
    }
  };
  
  return gameRooms[roomId];
}

// 팀 자동 배정 함수
function assignTeam(roomId, player) {
  const room = gameRooms[roomId];
  const maxTeamSize = room.settings.maxTeamSize;
  
  if (room.redTeam.length <= room.blueTeam.length && room.redTeam.length < maxTeamSize) {
    room.redTeam.push(player);
    return 'red';
  } else if (room.blueTeam.length < maxTeamSize) {
    room.blueTeam.push(player);
    return 'blue';
  }
  
  return null; // 양쪽 팀이 다 찬 경우
}

// 게임 시작 조건 체크
function checkGameStart(roomId) {
  const room = gameRooms[roomId];
  
  // 최소 인원 체크 (양 팀에 최소 1명 이상)
  if (room.redTeam.length >= 1 && room.blueTeam.length >= 1) {
    return true;
  }
  
  return false;
}

// 게임 시작 함수
function startGame(roomId) {
  const room = gameRooms[roomId];
  room.status = 'playing';
  room.startTime = Date.now();
  room.endTime = Date.now() + (room.timer * 1000);
  
  // 타이머 시작
  const timerInterval = setInterval(() => {
    room.timer--;
    
    // 스코어 체크 및 게임 종료 조건 확인
    checkGameEnd(roomId);
    
    // 타이머 업데이트 전송
    io.to(roomId).emit('timer-update', room.timer);
    
    if (room.timer <= 0 || room.status === 'finished') {
      clearInterval(timerInterval);
    }
  }, 1000);
}

// 승리 조건 체크
function checkGameEnd(roomId) {
  const room = gameRooms[roomId];
  
  // 게임이 이미 끝났거나 진행 중이 아니면 무시
  if (room.status !== 'playing') {
    return;
  }
  
  // 스코어 계산
  let redScore = 0;
  let blueScore = 0;
  
  room.cards.forEach(card => {
    if (card.flippedTeam === 'red') {
      redScore++;
    } else if (card.flippedTeam === 'blue') {
      blueScore++;
    }
  });
  
  room.scores = { red: redScore, blue: blueScore };
  
  // 모든 상대팀 카드를 뒤집었는지 체크
  const redFlippedBlue = room.cards.filter(card => card.team === 'blue' && card.flippedTeam === 'red').length;
  const blueFlippedRed = room.cards.filter(card => card.team === 'red' && card.flippedTeam === 'blue').length;
  const cardsPerTeam = room.settings.cardsPerTeam;
  
  let winner = null;
  
  // 한 팀이 상대 팀의 모든 카드를 뒤집었을 때
  if (redFlippedBlue === cardsPerTeam) {
    winner = 'red';
  } else if (blueFlippedRed === cardsPerTeam) {
    winner = 'blue';
  }
  // 시간이 종료되었을 때
  else if (room.timer <= 0) {
    winner = redScore > blueScore ? 'red' : (blueScore > redScore ? 'blue' : 'draw');
  }
  
  // 게임 종료 처리
  if (winner) {
    room.status = 'finished';
    io.to(roomId).emit('game-end', { winner, scores: room.scores });
  }
}

// 소켓 연결 처리
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // 닉네임 설정 및 로비 입장
  socket.on('join-lobby', (nickname) => {
    socket.data.nickname = nickname;
    socket.emit('lobby-joined', { id: socket.id, nickname });
    
    // 사용 가능한 게임룸 목록 전송
    const availableRooms = Object.keys(gameRooms)
      .filter(roomId => gameRooms[roomId].status === 'waiting')
      .map(roomId => {
        const room = gameRooms[roomId];
        return {
          id: roomId,
          players: room.players.length,
          maxPlayers: room.settings.maxTeamSize * 2,
          settings: room.settings
        };
      });
    
    socket.emit('available-rooms', availableRooms);
  });
  
  // 새 게임룸 생성
  socket.on('create-room', (options = {}) => {
    const roomId = `room_${Date.now()}`;
    const maxTeamSize = options.maxTeamSize || 5; // 기본값 5, 최대 7
    const totalCards = options.totalCards || 40; // 기본값 40
    
    // 팀 크기 유효성 검사
    const validatedMaxTeamSize = Math.min(Math.max(1, maxTeamSize), 7);
    // 카드 수 유효성 검사 (짝수로 만들기)
    const validatedTotalCards = Math.round(totalCards / 2) * 2;
    
    initializeGameRoom(roomId, {
      maxTeamSize: validatedMaxTeamSize,
      totalCards: validatedTotalCards
    });
    
    socket.emit('room-created', { 
      roomId,
      settings: gameRooms[roomId].settings
    });
  });
  
  // 게임룸 입장
  socket.on('join-room', (roomId) => {
    // 룸이 없으면 생성
    if (!gameRooms[roomId]) {
      initializeGameRoom(roomId);
    }
    
    const room = gameRooms[roomId];
    
    // 이미 시작된 게임이면 입장 불가
    if (room.status !== 'waiting') {
      socket.emit('join-error', '이미 시작된 게임에 참여할 수 없습니다.');
      return;
    }
    
    // 인원 초과 확인
    if (room.players.length >= room.settings.maxTeamSize * 2) {
      socket.emit('join-error', '게임방 인원이 가득 찼습니다.');
      return;
    }
    
    // 소켓을 룸에 조인
    socket.join(roomId);
    socket.data.roomId = roomId;
    
    // 플레이어 정보 생성
    const player = {
      id: socket.id,
      nickname: socket.data.nickname
    };
    
    // 팀 배정
    player.team = assignTeam(roomId, player);
    
    // 플레이어 목록에 추가
    room.players.push(player);
    
    // 클라이언트에게 입장 성공 알림
    socket.emit('room-joined', {
      roomId,
      player,
      players: room.players,
      redTeam: room.redTeam,
      blueTeam: room.blueTeam,
      settings: room.settings
    });
    
    // 다른 플레이어들에게 새 플레이어 참가 알림
    socket.to(roomId).emit('player-joined', player);
    
    // 게임 시작 조건 체크
    const canStartGame = checkGameStart(roomId);
    
    // 자동 시작 (모든 인원이 다 차면)
    if (room.players.length === room.settings.requiredPlayers) {
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
    // 최소 인원이 모이면 게임 시작 가능 알림
    else if (canStartGame) {
      io.to(roomId).emit('can-start-game', true);
    }
  });
  
  // 수동 게임 시작 요청
  socket.on('start-game', () => {
    const roomId = socket.data.roomId;
    if (!roomId || !gameRooms[roomId] || gameRooms[roomId].status !== 'waiting') {
      return;
    }
    
    const room = gameRooms[roomId];
    
    // 최소 인원이 모였는지 확인
    if (room.redTeam.length >= 1 && room.blueTeam.length >= 1) {
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
    } else {
      socket.emit('start-game-error', '각 팀에 최소 1명 이상의 플레이어가 필요합니다.');
    }
  });
  
  // 게임 설정 변경
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
      room.settings.requiredPlayers = newMaxTeamSize * 2;
    }
    
    // 총 카드 수 변경 (짝수로 만들기)
    if (settings.totalCards !== undefined) {
      const newTotalCards = Math.round(settings.totalCards / 2) * 2;
      room.settings.totalCards = newTotalCards;
      room.settings.cardsPerTeam = newTotalCards / 2;
      
      // 카드 재생성
      const koreanWords = generateKoreanWords(newTotalCards);
      const cardsPerTeam = newTotalCards / 2;
      
      room.cards = koreanWords.map((word, index) => {
        return {
          id: index,
          word: word,
          team: index < cardsPerTeam ? 'red' : 'blue',
          flippedBy: null,
          flippedTeam: null
        };
      });
      
      // 카드 섞기
      for (let i = room.cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [room.cards[i], room.cards[j]] = [room.cards[j], room.cards[i]];
      }
    }
    
    // 모든 플레이어에게 설정 변경 알림
    io.to(roomId).emit('room-settings-updated', room.settings);
  });
  
  // 타이핑 입력 처리
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
      
      // 모든 플레이어에게 카드 상태 업데이트 전송
      io.to(roomId).emit('card-flipped', {
        cardIndex,
        flippedBy: {
          id: player.id,
          nickname: player.nickname
        },
        flippedTeam: player.team
      });
      
      // 승리 조건 체크
      checkGameEnd(roomId);
    }
  });
  
  // 팀 수동 변경 요청
  socket.on('change-team', () => {
    const roomId = socket.data.roomId;
    if (!roomId || !gameRooms[roomId] || gameRooms[roomId].status !== 'waiting') {
      return;
    }
    
    const room = gameRooms[roomId];
    const player = room.players.find(p => p.id === socket.id);
    
    if (!player) return;
    
    // 현재 팀에서 제거
    if (player.team === 'red') {
      const teamIndex = room.redTeam.findIndex(p => p.id === socket.id);
      if (teamIndex !== -1) room.redTeam.splice(teamIndex, 1);
      
      // 상대 팀에 자리가 있는지 확인
      if (room.blueTeam.length < room.settings.maxTeamSize) {
        room.blueTeam.push(player);
        player.team = 'blue';
      } else {
        // 자리가 없으면 원래 팀으로 복귀
        room.redTeam.push(player);
        socket.emit('team-change-error', '상대 팀이 가득 찼습니다.');
        return;
      }
    } else if (player.team === 'blue') {
      const teamIndex = room.blueTeam.findIndex(p => p.id === socket.id);
      if (teamIndex !== -1) room.blueTeam.splice(teamIndex, 1);
      
      // 상대 팀에 자리가 있는지 확인
      if (room.redTeam.length < room.settings.maxTeamSize) {
        room.redTeam.push(player);
        player.team = 'red';
      } else {
        // 자리가 없으면 원래 팀으로 복귀
        room.blueTeam.push(player);
        socket.emit('team-change-error', '상대 팀이 가득 찼습니다.');
        return;
      }
    }
    
    // 모든 플레이어에게 팀 변경 알림
    io.to(roomId).emit('teams-updated', {
      redTeam: room.redTeam,
      blueTeam: room.blueTeam
    });
  });
  
  // 연결 끊김 처리
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const roomId = socket.data.roomId;
    if (roomId && gameRooms[roomId]) {
      const room = gameRooms[roomId];
      
      // 플레이어 제거
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        
        // 팀에서도 제거
        if (player.team === 'red') {
          const teamIndex = room.redTeam.findIndex(p => p.id === socket.id);
          if (teamIndex !== -1) room.redTeam.splice(teamIndex, 1);
        } else if (player.team === 'blue') {
          const teamIndex = room.blueTeam.findIndex(p => p.id === socket.id);
          if (teamIndex !== -1) room.blueTeam.splice(teamIndex, 1);
        }
        
        room.players.splice(playerIndex, 1);
        
        // 다른 플레이어들에게 알림
        io.to(roomId).emit('player-left', { id: socket.id });
        io.to(roomId).emit('teams-updated', {
          redTeam: room.redTeam,
          blueTeam: room.blueTeam
        });
        
        // 게임 중이면서 플레이어가 없으면 게임룸 삭제
        if (room.players.length === 0) {
          delete gameRooms[roomId];
        }
        // 게임 진행 중이고 한 팀에 플레이어가 없으면 게임 종료
        else if (room.status === 'playing' && 
                (room.redTeam.length === 0 || room.blueTeam.length === 0)) {
          const winner = room.redTeam.length === 0 ? 'blue' : 'red';
          room.status = 'finished';
          io.to(roomId).emit('game-end', { 
            winner, 
            scores: room.scores,
            reason: '상대 팀의 모든 플레이어가 나갔습니다.'
          });
        }
      }
    }
  });
});

// 서버 시작
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 