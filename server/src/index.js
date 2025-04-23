const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const { generateKoreanWords } = require('./wordGenerator');

const app = express();
app.use(cors());

// 정적 파일 제공 (클라이언트 빌드)
app.use(express.static(path.join(__dirname, '../../client/build')));

// 모든 다른 GET 요청은 리액트 앱으로 라우팅
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
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
function initializeGameRoom(roomId) {
  const koreanWords = generateKoreanWords(40);
  
  // 카드 설정 (랜덤하게 팀 배정)
  const cards = koreanWords.map((word, index) => {
    return {
      id: index,
      word: word,
      team: index < 20 ? 'red' : 'blue', // 20장은 빨강, 20장은 파랑
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
    timer: 300 // 5분 (초 단위)
  };
  
  return gameRooms[roomId];
}

// 팀 자동 배정 함수
function assignTeam(roomId, player) {
  const room = gameRooms[roomId];
  
  if (room.redTeam.length <= room.blueTeam.length && room.redTeam.length < 5) {
    room.redTeam.push(player);
    return 'red';
  } else if (room.blueTeam.length < 5) {
    room.blueTeam.push(player);
    return 'blue';
  }
  
  return null; // 양쪽 팀이 다 찬 경우
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
  
  let winner = null;
  
  // 한 팀이 상대 팀의 모든 카드를 뒤집었을 때
  if (redFlippedBlue === 20) {
    winner = 'red';
  } else if (blueFlippedRed === 20) {
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
      .filter(roomId => gameRooms[roomId].status === 'waiting' && 
             (gameRooms[roomId].redTeam.length + gameRooms[roomId].blueTeam.length) < 10)
      .map(roomId => ({
        id: roomId,
        players: gameRooms[roomId].players.length,
        maxPlayers: 10
      }));
    
    socket.emit('available-rooms', availableRooms);
  });
  
  // 새 게임룸 생성
  socket.on('create-room', () => {
    const roomId = `room_${Date.now()}`;
    initializeGameRoom(roomId);
    
    socket.emit('room-created', { roomId });
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
    if (room.players.length >= 10) {
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
      blueTeam: room.blueTeam
    });
    
    // 다른 플레이어들에게 새 플레이어 참가 알림
    socket.to(roomId).emit('player-joined', player);
    
    // 게임 시작 조건 체크 (10명이 모였을 때)
    if (room.players.length === 10) {
      io.to(roomId).emit('game-starting');
      
      // 3초 후 게임 시작
      setTimeout(() => {
        startGame(roomId);
        io.to(roomId).emit('game-started', {
          cards: room.cards,
          redTeam: room.redTeam,
          blueTeam: room.blueTeam,
          timer: room.timer
        });
      }, 3000);
    }
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
        
        // 게임 중이면서 플레이어가 없으면 게임룸 삭제
        if (room.players.length === 0) {
          delete gameRooms[roomId];
        }
      }
    }
  });
});

// 서버 시작
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 