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
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
  margin: 20px auto;
  max-width: 600px;
`;

const WaitingContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
  padding: 20px;
  
  @media (min-width: 992px) {
    flex-direction: row;
    align-items: flex-start;
  }
`;

const TeamsPanel = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  flex: 1;
  
  @media (min-width: 992px) {
    margin-right: 20px;
  }
`;

const SettingsPanel = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  width: 100%;
  
  @media (min-width: 992px) {
    width: 350px;
  }
`;

const PanelTitle = styled.h3`
  font-size: 1.3rem;
  margin-bottom: 15px;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
`;

const TeamSection = styled.div`
  margin-bottom: 20px;
`;

const TeamHeader = styled.h4`
  font-size: 1.1rem;
  color: ${props => props.team === 'red' ? '#e53935' : '#1e88e5'};
  margin: 0 0 10px 0;
`;

const PlayersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
`;

const PlayerCard = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: ${props => props.isCurrentUser ? (props.team === 'red' ? '#fff8f8' : '#f8fbff') : '#f9f9f9'};
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const PlayerAvatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: ${props => props.team === 'red' ? '#e53935' : '#1e88e5'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-right: 10px;
`;

const PlayerNickname = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  margin-left: 5px;
  font-size: 1rem;
  
  &:hover {
    color: #333;
  }
`;

const SettingGroup = styled.div`
  margin-bottom: 20px;
`;

const SettingLabel = styled.div`
  font-size: 1rem;
  margin-bottom: 8px;
  color: #333;
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
`;

const NumberInput = styled.input`
  width: 60px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.9rem;
  text-align: center;
`;

const InputButton = styled.button`
  padding: 8px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  cursor: pointer;
  font-size: 1rem;
  
  &:first-child {
    border-radius: 5px 0 0 5px;
  }
  
  &:last-child {
    border-radius: 0 5px 5px 0;
  }
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const StartButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 20px;
  
  &:hover {
    background-color: #43a047;
  }
  
  &:disabled {
    background-color: #a5d6a7;
    cursor: not-allowed;
  }
`;

const EmptySlot = styled.div`
  padding: 8px 12px;
  background-color: #f0f0f0;
  border-radius: 5px;
  border: 1px dashed #ddd;
  display: flex;
  align-items: center;
  color: #999;
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
  
  const [teamSettings, setTeamSettings] = useState({ maxTeamSize: 5 });
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  
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
      
      // 설정 정보 업데이트
      setTeamSettings(data.settings);
      
      // 방 생성자인지 확인 (첫 번째 입장한 플레이어)
      if (data.players.length === 1 || data.players[0].id === socket.id) {
        setIsRoomCreator(true);
      }
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
    
    // 게임 설정 업데이트
    socket.on('room-settings-updated', (settings) => {
      setTeamSettings(settings);
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
      socket.off('room-settings-updated');
      
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
  
  // 팀 변경 요청
  const handleChangeTeam = (playerId) => {
    // 자신의 ID인 경우에만 처리
    if (playerId === socket.id) {
      socket.emit('change-team');
    }
  };
  
  // 설정 변경 처리
  const handleUpdateSettings = (newSettings) => {
    if (!isRoomCreator) return;
    
    socket.emit('update-room-settings', newSettings);
    setTeamSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  // 게임 시작 요청
  const handleStartGame = () => {
    if (!isRoomCreator) return;
    
    socket.emit('start-game');
  };
  
  // 팀 크기 변경
  const handleTeamSizeChange = (value) => {
    const newSize = Math.min(Math.max(1, value), 7);
    handleUpdateSettings({ maxTeamSize: newSize });
  };
  
  // 카드 수 변경
  const handleCardCountChange = (value) => {
    // 짝수로 조정
    const newCount = Math.round(value / 2) * 2;
    handleUpdateSettings({ totalCards: newCount });
  };
  
  // 로딩 중이거나 대기 중인 화면
  if (gameState.status === 'waiting') {
    const redTeam = gameState.redTeam || [];
    const blueTeam = gameState.blueTeam || [];
    const maxTeamSize = teamSettings.maxTeamSize || 5;
    const totalPlayers = redTeam.length + blueTeam.length;
    const canStartGame = redTeam.length >= 1 && blueTeam.length >= 1;
    
    return (
      <Container>
        <WaitingContainer>
          <TeamsPanel>
            <PanelTitle>팀 구성</PanelTitle>
            
            <TeamSection>
              <TeamHeader team="red">빨강팀 ({redTeam.length}/{maxTeamSize}명)</TeamHeader>
              <PlayersGrid>
                {redTeam.map(player => (
                  <PlayerCard key={player.id} team="red" isCurrentUser={player.id === socket.id}>
                    <PlayerAvatar team="red">{player.nickname.charAt(0).toUpperCase()}</PlayerAvatar>
                    <PlayerNickname>{player.nickname} {player.id === socket.id && '(나)'}</PlayerNickname>
                    {player.id === socket.id && (
                      <ActionButton onClick={() => handleChangeTeam(player.id)}>
                        <span role="img" aria-label="change team">🔄</span>
                      </ActionButton>
                    )}
                  </PlayerCard>
                ))}
                {Array(maxTeamSize - redTeam.length).fill().map((_, index) => (
                  <EmptySlot key={`empty-red-${index}`}>
                    <span>비어 있음</span>
                  </EmptySlot>
                ))}
              </PlayersGrid>
            </TeamSection>
            
            <TeamSection>
              <TeamHeader team="blue">파랑팀 ({blueTeam.length}/{maxTeamSize}명)</TeamHeader>
              <PlayersGrid>
                {blueTeam.map(player => (
                  <PlayerCard key={player.id} team="blue" isCurrentUser={player.id === socket.id}>
                    <PlayerAvatar team="blue">{player.nickname.charAt(0).toUpperCase()}</PlayerAvatar>
                    <PlayerNickname>{player.nickname} {player.id === socket.id && '(나)'}</PlayerNickname>
                    {player.id === socket.id && (
                      <ActionButton onClick={() => handleChangeTeam(player.id)}>
                        <span role="img" aria-label="change team">🔄</span>
                      </ActionButton>
                    )}
                  </PlayerCard>
                ))}
                {Array(maxTeamSize - blueTeam.length).fill().map((_, index) => (
                  <EmptySlot key={`empty-blue-${index}`}>
                    <span>비어 있음</span>
                  </EmptySlot>
                ))}
              </PlayersGrid>
            </TeamSection>
          </TeamsPanel>
          
          <SettingsPanel>
            <PanelTitle>게임 설정</PanelTitle>
            
            {isRoomCreator ? (
              <>
                <SettingGroup>
                  <SettingLabel>팀당 최대 인원 (1-7명)</SettingLabel>
                  <InputContainer>
                    <InputButton 
                      onClick={() => handleTeamSizeChange(teamSettings.maxTeamSize - 1)}
                      disabled={teamSettings.maxTeamSize <= 1}
                    >-</InputButton>
                    <NumberInput 
                      type="number" 
                      min="1" 
                      max="7" 
                      value={teamSettings.maxTeamSize} 
                      onChange={(e) => handleTeamSizeChange(parseInt(e.target.value))}
                    />
                    <InputButton 
                      onClick={() => handleTeamSizeChange(teamSettings.maxTeamSize + 1)}
                      disabled={teamSettings.maxTeamSize >= 7}
                    >+</InputButton>
                  </InputContainer>
                </SettingGroup>
                
                <SettingGroup>
                  <SettingLabel>카드 총 개수</SettingLabel>
                  <InputContainer>
                    <InputButton 
                      onClick={() => handleCardCountChange(teamSettings.totalCards - 2)}
                      disabled={teamSettings.totalCards <= 4}
                    >-</InputButton>
                    <NumberInput 
                      type="number" 
                      min="4" 
                      step="2" 
                      value={teamSettings.totalCards} 
                      onChange={(e) => handleCardCountChange(parseInt(e.target.value))}
                    />
                    <InputButton 
                      onClick={() => handleCardCountChange(teamSettings.totalCards + 2)}
                    >+</InputButton>
                  </InputContainer>
                </SettingGroup>
                
                <StartButton 
                  onClick={handleStartGame}
                  disabled={!canStartGame}
                >
                  게임 시작
                </StartButton>
                {!canStartGame && (
                  <p style={{ color: '#e53935', fontSize: '0.9rem', marginTop: '10px', textAlign: 'center' }}>
                    각 팀에 최소 1명 이상의 플레이어가 필요합니다.
                  </p>
                )}
              </>
            ) : (
              <>
                <SettingGroup>
                  <SettingLabel>팀당 최대 인원: {teamSettings.maxTeamSize}명</SettingLabel>
                </SettingGroup>
                <SettingGroup>
                  <SettingLabel>카드 총 개수: {teamSettings.totalCards}개</SettingLabel>
                </SettingGroup>
                <p style={{ textAlign: 'center', color: '#666' }}>
                  방장이 게임을 시작하기를 기다리는 중입니다...
                </p>
              </>
            )}
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p>현재 플레이어: {totalPlayers}/{maxTeamSize * 2}명</p>
            </div>
          </SettingsPanel>
        </WaitingContainer>
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