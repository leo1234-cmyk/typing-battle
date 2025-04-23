import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useSocket } from '../contexts/SocketContext';
import GameBoard from '../components/GameBoard';
import PlayersList from '../components/PlayersList';
import InputBox from '../components/InputBox';
import GameStatus from '../components/GameStatus';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  flex: 1;
`;

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 20px;
`;

const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const WaitingMessage = styled.div`
  text-align: center;
  padding: 40px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin: 40px auto;
  max-width: 600px;
  
  h2 {
    font-size: 1.8rem;
    margin-bottom: 15px;
    color: #333;
  }
  
  p {
    font-size: 1.2rem;
    color: #666;
    margin-bottom: 10px;
  }
  
  .countdown {
    font-size: 2rem;
    font-weight: bold;
    color: #4a90e2;
    margin: 20px 0;
  }
`;

const GameResultOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const GameResultContent = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  
  h2 {
    font-size: 2rem;
    margin-bottom: 20px;
    color: ${props => props.winner === 'red' ? '#e53935' : 
                      props.winner === 'blue' ? '#1e88e5' : '#333'};
  }
  
  .scores {
    display: flex;
    justify-content: space-around;
    margin-bottom: 30px;
    
    .team {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .team-name {
        font-size: 1.2rem;
        font-weight: bold;
        margin-bottom: 10px;
        color: ${props => props.winner === 'red' ? '#e53935' : '#1e88e5'};
      }
      
      .score {
        font-size: 2.5rem;
        font-weight: bold;
      }
    }
  }
  
  button {
    padding: 12px 24px;
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: background-color 0.3s;
    
    &:hover {
      background-color: #3a7bc8;
    }
  }
`;

function GameRoomScreen() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, user, typeWord } = useSocket();
  
  const [gameState, setGameState] = useState({
    status: 'waiting', // waiting, starting, playing, finished
    cards: [],
    redTeam: [],
    blueTeam: [],
    timer: 300,
    countdown: 3,
    gameResult: null
  });
  
  const countdownInterval = useRef(null);
  
  // 사용자가 로그인하지 않은 경우 닉네임 화면으로 리다이렉트
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  // 소켓 이벤트 리스너 설정
  useEffect(() => {
    if (!socket) return;
    
    // 방 입장 성공
    socket.on('room-joined', (data) => {
      setGameState(prev => ({
        ...prev,
        redTeam: data.redTeam,
        blueTeam: data.blueTeam
      }));
    });
    
    // 다른 플레이어 입장
    socket.on('player-joined', (player) => {
      // 새로운 플레이어가 어느 팀에 들어갔는지 확인하고 업데이트
      setGameState(prev => {
        if (player.team === 'red') {
          return {
            ...prev,
            redTeam: [...prev.redTeam, player]
          };
        } else {
          return {
            ...prev,
            blueTeam: [...prev.blueTeam, player]
          };
        }
      });
    });
    
    // 플레이어 퇴장
    socket.on('player-left', (data) => {
      setGameState(prev => {
        // 팀에서 플레이어 제거
        const updatedRedTeam = prev.redTeam.filter(p => p.id !== data.id);
        const updatedBlueTeam = prev.blueTeam.filter(p => p.id !== data.id);
        
        return {
          ...prev,
          redTeam: updatedRedTeam,
          blueTeam: updatedBlueTeam
        };
      });
    });
    
    // 게임 시작 카운트다운
    socket.on('game-starting', () => {
      setGameState(prev => ({
        ...prev,
        status: 'starting',
        countdown: 3
      }));
      
      // 카운트다운 시작
      countdownInterval.current = setInterval(() => {
        setGameState(prev => {
          const newCountdown = prev.countdown - 1;
          
          if (newCountdown <= 0) {
            clearInterval(countdownInterval.current);
          }
          
          return {
            ...prev,
            countdown: Math.max(0, newCountdown)
          };
        });
      }, 1000);
    });
    
    // 게임 시작
    socket.on('game-started', (data) => {
      setGameState(prev => ({
        ...prev,
        status: 'playing',
        cards: data.cards,
        redTeam: data.redTeam,
        blueTeam: data.blueTeam,
        timer: data.timer
      }));
    });
    
    // 타이머 업데이트
    socket.on('timer-update', (time) => {
      setGameState(prev => ({
        ...prev,
        timer: time
      }));
    });
    
    // 카드 뒤집기 이벤트
    socket.on('card-flipped', ({ cardIndex, flippedBy, flippedTeam }) => {
      setGameState(prev => {
        const updatedCards = [...prev.cards];
        updatedCards[cardIndex] = {
          ...updatedCards[cardIndex],
          flippedBy,
          flippedTeam
        };
        
        return {
          ...prev,
          cards: updatedCards
        };
      });
    });
    
    // 게임 종료
    socket.on('game-end', ({ winner, scores }) => {
      setGameState(prev => ({
        ...prev,
        status: 'finished',
        gameResult: {
          winner,
          scores
        }
      }));
    });
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      socket.off('room-joined');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('game-starting');
      socket.off('game-started');
      socket.off('timer-update');
      socket.off('card-flipped');
      socket.off('game-end');
      
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, [socket]);
  
  // 사용자 입력 처리
  const handleTyping = (word) => {
    if (gameState.status === 'playing') {
      typeWord(word);
    }
  };
  
  // 로비로 돌아가기
  const handleReturnToLobby = () => {
    navigate('/lobby');
  };
  
  // 로딩 중이거나 대기 중인 화면
  if (gameState.status === 'waiting') {
    return (
      <Container>
        <WaitingMessage>
          <h2>게임 대기 중</h2>
          <p>현재 플레이어: {gameState.redTeam.length + gameState.blueTeam.length}/10</p>
          <p>10명이 모이면 게임이 시작됩니다.</p>
        </WaitingMessage>
      </Container>
    );
  }
  
  // 게임 시작 카운트다운
  if (gameState.status === 'starting') {
    return (
      <Container>
        <WaitingMessage>
          <h2>게임 시작</h2>
          <p>곧 게임이 시작됩니다!</p>
          <div className="countdown">{gameState.countdown}</div>
        </WaitingMessage>
      </Container>
    );
  }
  
  return (
    <Container>
      <GameContainer>
        <TopSection>
          <GameStatus
            timer={gameState.timer}
            redTeam={gameState.redTeam}
            blueTeam={gameState.blueTeam}
            redScore={gameState.cards.filter(card => card.flippedTeam === 'red').length}
            blueScore={gameState.cards.filter(card => card.flippedTeam === 'blue').length}
          />
          <PlayersList
            redTeam={gameState.redTeam}
            blueTeam={gameState.blueTeam}
            currentUser={user}
          />
        </TopSection>
        
        <GameBoard cards={gameState.cards} />
        
        <InputBox onSubmit={handleTyping} isGameActive={gameState.status === 'playing'} />
      </GameContainer>
      
      {/* 게임 결과 오버레이 */}
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
            
            <button onClick={handleReturnToLobby}>
              로비로 돌아가기
            </button>
          </GameResultContent>
        </GameResultOverlay>
      )}
    </Container>
  );
}

export default GameRoomScreen; 